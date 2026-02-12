import { prisma } from '@/lib/prisma';
import { generateStreamingCompletion } from './openai';
import type { ChatMessage, QuotationContext, AITool, AIMessage } from '@/types/ai';

// Define available tools for function calling
const AVAILABLE_TOOLS: AITool[] = [
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description: 'Search for customers by name. Returns a list of matching customers with their IDs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Customer name to search for',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_info',
      description: 'Get detailed information about a specific customer including their quotation history.',
      parameters: {
        type: 'object',
        properties: {
          customerId: {
            type: 'string',
            description: 'The customer ID',
          },
        },
        required: ['customerId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_line_items',
      description: 'Suggest line items for a quotation based on project type and scope.',
      parameters: {
        type: 'object',
        properties: {
          projectType: {
            type: 'string',
            description: 'Type of project (e.g., "BIM Modeling", "Clash Detection", etc.)',
          },
          totalArea: {
            type: 'number',
            description: 'Total project area in m²',
          },
        },
        required: ['projectType'],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are a helpful AI assistant for ZfeManage - a BIM quotation management system.
Your role is to help users create quotations through natural conversation in Vietnamese.

Capabilities:
1. Search and retrieve customer information
2. Suggest appropriate line items based on project type
3. Calculate pricing based on project scope
4. Guide users through the quotation creation process

Guidelines:
- Always respond in Vietnamese
- Be professional and helpful
- Ask clarifying questions when needed
- Use function calls to retrieve real data
- Provide specific, actionable suggestions

When creating quotations:
1. First, identify or search for the customer
2. Understand the project scope (type, area, requirements)
3. Suggest appropriate line items with pricing
4. Help structure the quotation properly

Remember: You're assisting with QUOTATION CREATION, not general BIM consulting.`;

// Function implementations
async function searchCustomers(query: string) {
  const customers = await prisma.customer.findMany({
    where: {
      name: {
        contains: query,
      },
    },
    select: {
      id: true,
      name: true,
      location: true,
      contactName: true,
    },
    take: 5,
  });

  return customers;
}

async function getCustomerInfo(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      quotations: {
        select: {
          id: true,
          quotationNo: true,
          projectName: true,
          totalBeforeVat: true,
          totalAfterVat: true,
          status: true,
          date: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  return {
    id: customer.id,
    name: customer.name,
    location: customer.location,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    recentQuotations: customer.quotations,
    totalQuotations: customer.quotations.length,
  };
}

async function suggestLineItems(projectType: string, totalArea?: number) {
  // Fetch similar quotations based on project type
  const quotations = await prisma.quotation.findMany({
    where: {
      OR: [
        { projectName: { contains: projectType } },
        { projectItem: { contains: projectType } },
      ],
      status: { in: ['SENT', 'ACCEPTED'] },
    },
    include: {
      lines: {
        where: { isChargeable: true },
      },
    },
    take: 10,
  });

  // Aggregate common line items
  const itemFrequency: Record<string, { count: number; avgPrice: number; unit: string }> = {};

  for (const quotation of quotations) {
    for (const line of quotation.lines) {
      const key = line.title.toLowerCase().trim();
      if (!itemFrequency[key]) {
        itemFrequency[key] = {
          count: 0,
          avgPrice: 0,
          unit: line.unit || 'm²',
        };
      }
      itemFrequency[key].count += 1;
      itemFrequency[key].avgPrice += line.unitPrice || 0;
    }
  }

  // Get top items by frequency
  const suggestions = Object.entries(itemFrequency)
    .map(([title, data]) => ({
      title,
      frequency: data.count,
      avgPrice: Math.round(data.avgPrice / data.count),
      unit: data.unit,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8);

  return suggestions;
}

// Execute function call
async function executeFunction(name: string, args: any): Promise<any> {
  switch (name) {
    case 'search_customers':
      return await searchCustomers(args.query);
    
    case 'get_customer_info':
      return await getCustomerInfo(args.customerId);
    
    case 'suggest_line_items':
      return await suggestLineItems(args.projectType, args.totalArea);
    
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

export async function* chatWithAssistant(
  messages: ChatMessage[],
  context?: QuotationContext
): AsyncGenerator<{ type: 'text' | 'function'; content: any }, void, unknown> {
  // Build message history
  const aiMessages: AIMessage[] = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  // Add context if provided
  if (context) {
    const contextMsg = `
Current Quotation Context:
- Customer: ${context.customerName || 'Not selected'}
- Project: ${context.projectName || 'Not specified'}
- Total Area: ${context.totalArea ? `${context.totalArea} m²` : 'Not specified'}
- Current Line Items: ${context.lineItems?.length || 0} items
`.trim();
    
    aiMessages.push({
      role: 'system',
      content: contextMsg,
    });
  }

  // Stream response from AI
  for await (const chunk of generateStreamingCompletion(aiMessages, {
    temperature: 0.7,
    maxTokens: 800,
  })) {
    yield { type: 'text', content: chunk };
  }

  // Note: Function calling with streaming is complex
  // For Phase 04, we'll use simpler pattern without function calls in streaming
  // Full function calling can be added in future iterations
}
