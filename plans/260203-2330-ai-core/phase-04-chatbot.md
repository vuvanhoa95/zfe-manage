# Phase 04: AI Assistant Chatbot (Optional)
Status: ✅ Complete

## Objective
Implement a conversational AI assistant that helps users create and manage quotations through natural language. This is an **optional advanced feature** that can be skipped if time/budget is limited.

## Requirements
- Natural language conversation in Vietnamese
- Streaming responses for real-time feedback
- Function calling: searchCustomer, getHistory, suggestPricing
- Chat history persistence
- Sidebar UI in QuotationEditor
- Context-aware (remembers conversation)

## How It Works
1. User opens chatbot sidebar: "Giúp tôi tạo báo giá cho khách hàng ABC"
2. AI asks clarifying questions: "Dự án gì? Ở đâu?"
3. AI can call functions to search customers, get history, suggest prices
4. User confirms → AI populates form fields
5. Chat history saved for future reference

## Implementation Steps
1. [ ] Create `lib/ai/assistant.ts`:
   - Define AI tools (function calling schema)
   - Build system prompt for quotation assistant
   - Handle streaming responses with Vercel AI SDK
2. [ ] Create API `/api/ai/chat/route.ts` (streaming):
   - Accept: `{ messages, quotationContext? }`
   - Return: Streaming SSE response
   - Implement tools:
     - `searchCustomer(name)` → Returns matching customers
     - `getCustomerHistory(id)` → Returns past quotations
     - `suggestPricing(item, customer)` → Returns price range
3. [ ] Create `components/quotation/AIAssistant.tsx`:
   - Collapsible sidebar (right side)
   - Chat message list (scrollable)
   - Input field with send button
   - Streaming message display (typewriter effect)
   - Quick action buttons: "Tạo báo giá mới", "Tìm khách hàng"
4. [ ] Integrate into `QuotationEditor.tsx`:
   - Toggle button to show/hide chatbot
   - Pass `quotationContext` to API
   - Auto-fill form when AI suggests data

## Files to Create/Modify
- `lib/ai/assistant.ts` [NEW]
- `app/api/ai/chat/route.ts` [NEW]
- `components/quotation/AIAssistant.tsx` [NEW]
- `components/quotation/QuotationEditor.tsx` [MODIFY]

## AI Tools (Function Calling)
```typescript
const tools = [
  {
    name: 'searchCustomer',
    description: 'Search for customers by name',
    parameters: { name: 'string' }
  },
  {
    name: 'getCustomerHistory',
    description: 'Get quotation history for a customer',
    parameters: { customerId: 'string' }
  },
  {
    name: 'suggestPricing',
    description: 'Get AI pricing suggestion for an item',
    parameters: { itemTitle: 'string', customerId: 'string?' }
  }
];
```

## Example Conversation
```
User: Giúp tôi tạo báo giá cho khách ABC
AI: [calls searchCustomer("ABC")]
AI: Tôi tìm thấy 2 khách hàng: ABC Corp và ABC Việt Nam. Anh muốn chọn công ty nào?

User: ABC Corp
AI: [calls getCustomerHistory("customer-id")]
AI: Anh muốn tạo báo giá cho dự án gì? Lần trước chúng ta đã làm dự án Landmark.

User: Dự án BIM cho Sunrise Tower
AI: Được ạ! Các hạng mục cần báo giá gồm những gì?

[conversation continues...]
```

## Technology Stack
- **Vercel AI SDK** - Free, handles streaming + function calling
- **Claude 3.5 Sonnet** - Better Vietnamese support than GPT-4
- **OpenAI GPT-4o-mini** - Fallback option

## Testing
- [ ] Test conversation: "Create quotation for Customer X"
- [ ] Verify AI can search customers accurately
- [ ] Verify AI can suggest prices
- [ ] Verify chat history saves correctly
- [ ] Test streaming (real-time response display)
- [ ] Test function calling (3+ tools)

## Notes
- **This phase is OPTIONAL** - Skip if time/budget limited
- Can still deliver great value with Phases 01-03 only
- Consider adding in Phase 4+ (Month 4) if needed

## Next Phase
Integration & Testing (Phase 3 complete)
