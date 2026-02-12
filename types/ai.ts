// Shared AI Types for Phase 3

// ============================================
// AI MESSAGE TYPES
// ============================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================
// PRICING SUGGESTION TYPES
// ============================================

export interface PricingSuggestion {
  min: number;
  avg: number;
  max: number;
  confidence: number;  // 0-1
  reasoning: string;
  sampleCount: number; // Number of historical items analyzed
  historicalItems?: {
    title: string;
    price: number;
    customer: string;
    date: Date;
  }[];
}

export interface PricingSuggestionRequest {
  itemTitle: string;
  customerId?: string;
  projectSize?: number;
  location?: string;
}

// ============================================
// INTRO GENERATION TYPES
// ============================================

export interface IntroGenerationRequest {
  customerId: string;
  projectName: string;
  projectNotes?: string;
  totalArea?: number;
}

export interface IntroGenerationResponse {
  introText: string;
  confidence: number;  // 0-1
  wordCount: number;
}

// ============================================
// CHAT / ASSISTANT TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    arguments: any;
    result?: any;
  };
}

export interface QuotationContext {
  quotationId?: string;
  customerId?: string;
  customerName?: string;
  projectName?: string;
  totalArea?: number;
  currentStep?: 'basic' | 'content' | 'pricing' | 'payment';
  lineItems?: {
    title: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
  }[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  quotationContext?: QuotationContext;
}

// ============================================
// AI FUNCTION CALLING TYPES
// ============================================

export type AIToolName = 
  | 'search_customers' 
  | 'get_customer_info' 
  | 'suggest_line_items'
  | 'searchCustomer' 
  | 'getCustomerHistory' 
  | 'suggestPricing'
  | 'searchCatalog'
  | 'createQuotationDraft';

export interface AITool {
  type: 'function';
  function: {
    name: AIToolName;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface AIFunctionCall {
  name: AIToolName;
  arguments: any;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AIApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
