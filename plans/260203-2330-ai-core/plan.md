# Phase 3: AI Core Features - Implementation Plan

**Timeline:** 10-14 days  
**Status:** 📋 Planning  
**Priority:** HIGH  
**Dependencies:** Phase 2 Complete ✅

---

## 🎯 OBJECTIVE

Transform ZfeManage into an **AI-powered quotation platform** by integrating core AI capabilities:
1. **Smart Pricing Suggestions** - AI recommends optimal prices based on history
2. **Auto Intro Text Generator** - AI writes professional quotation introductions
3. **AI Assistant Chatbot** - Natural language interface for quotation creation

---

## 📊 PROGRESS OVERVIEW

| Phase | Feature | Status | Progress |
|-------|---------|--------|----------|
| 01 | AI Infrastructure Setup | ✅ Complete | 100% |
| 02 | Smart Pricing Suggestions | ✅ Complete | 100% |
| 03 | Auto Intro Generator | ✅ Complete | 100% |
| 04 | AI Assistant Chatbot | ✅ Complete | 100% |

## Quick Commands
- Start Phase 1: `/code phase-01`
- Start Phase 2: `/code phase-02`
- Start Phase 3: `/code phase-03`
- Start Phase 4: `/code phase-04`

---

## 💰 COST ESTIMATION

### AI Services (Monthly):
- **OpenAI GPT-4o-mini:** $50-80/month (pricing, intro generation)
- **Claude 3.5 Sonnet (optional):** $100-150/month (chatbot - cheaper alternative)
- **Pinecone Vector DB (optional):** $70/month (for semantic search in Phase 4)

**Total Phase 3:** ~$50-230/month (depending on features enabled)

> **Note:** We'll start with OpenAI only ($50-80) and optionally add Claude/Pinecone in Phase 4.

---

## 🏗️ ARCHITECTURE DECISIONS

### AI Model Selection:
- **Pricing & Intro:** GPT-4o-mini (fast, cheap, good quality)
- **Chatbot (optional):** Claude 3.5 Sonnet (better reasoning, Vietnamese support)
- **Fallback:** All features work with GPT-4o-mini only

### Data Strategy:
- **NO Vector DB initially** - Use direct API calls with context
- **Phase 4+** - Add Pinecone if semantic search is needed

---

## 📁 FOLDER STRUCTURE

New files to create:
```
lib/ai/
├── claude.ts                    # Claude client (chatbot)
├── embeddings.ts                # Vector embeddings (Phase 4)
├── pricing-analyzer.ts          # Pricing logic
├── intro-generator.ts           # Intro text logic
└── assistant.ts                 # Chatbot logic + tools

app/api/ai/
├── pricing-suggest/route.ts     # Pricing endpoint
├── generate-intro/route.ts      # Intro generation
└── chat/route.ts                # Chatbot streaming

components/quotation/
├── AIPricingSuggestion.tsx      # Pricing widget
├── AIIntroGenerator.tsx         # Intro generator
└── AIAssistant.tsx              # Chatbot sidebar
```

---

## 🚀 DETAILED PHASES

### Phase 01: AI Infrastructure Setup (2 days)
**Goal:** Prepare the foundation for all AI features.

**Tasks:**
1. Decide: OpenAI only vs. OpenAI + Claude
2. Create `lib/ai/openai.ts` - Extend existing client with streaming support
3. Create `lib/ai/claude.ts` - Claude client (if using)
4. Set up environment variables (`CLAUDE_API_KEY`)
5. Create shared types in `types/ai.ts`

**Deliverables:**
- [ ] AI clients configured and tested
- [ ] Environment variables documented
- [ ] Shared AI types defined

---

### Phase 02: Smart Pricing Suggestions (3-4 days)
**Goal:** AI suggests optimal prices based on historical quotations.

**How It Works:**
1. User adds a line item (e.g., "Thiết kế Kiến trúc")
2. System searches similar past quotations
3. AI analyzes: customer segment, project size, region
4. Returns: Min/Avg/Max prices + confidence score

**Tasks:**
1. Create `lib/ai/pricing-analyzer.ts`:
   - Query similar items from database
   - Build AI prompt with context
   - Parse AI response (JSON: min, avg, max, confidence)
2. Create API `/api/ai/pricing-suggest`:
   - Accept: `{ itemTitle, customerId?, projectSize? }`
   - Return: `{ min, avg, max, confidence, reasoning }`
3. Create `components/quotation/AIPricingSuggestion.tsx`:
   - Show suggestion card when user focuses on `unitPrice`
   - Display: "💡 AI gợi ý: 500K - 800K - 1.2M"
   - One-click apply

**Deliverables:**
- [ ] Pricing analyzer logic complete
- [ ] API endpoint working
- [ ] UI widget integrated into PricingTable
- [ ] Accuracy test: 70%+ correct suggestions

---

### Phase 03: Auto Intro Generator (2-3 days)
**Goal:** AI writes professional, personalized quotation introductions.

**How It Works:**
1. User clicks "✨ AI Tạo Lời Mở Đầu" in QuotationEditor
2. AI uses: Company profile + Customer data + Project info
3. Generates: Professional Vietnamese intro (3-4 paragraphs)
4. User can: Accept, Regenerate, or Edit

**Tasks:**
1. Create `lib/ai/intro-generator.ts`:
   - Build prompt with company/customer/project context
   - Generate 150-200 word introduction
   - Maintain professional tone
2. Create API `/api/ai/generate-intro`:
   - Accept: `{ customerId, projectName, projectNotes }`
   - Return: `{ introText, confidence }`
3. Create `components/quotation/AIIntroGenerator.tsx`:
   - Button in IntroText field
   - Loading state
   - Show generated text in modal for approval

**Deliverables:**
- [ ] Intro generator logic complete
- [ ] API endpoint working
- [ ] UI component integrated
- [ ] Quality test: 90%+ usable intros

---

### Phase 04: AI Assistant Chatbot (4-5 days) 🆕
**Goal:** Conversational AI that helps create quotations via natural language.

**How It Works:**
1. User opens chatbot sidebar: "Giúp tôi tạo báo giá cho khách A"
2. AI asks clarifying questions
3. AI can call functions: searchCustomer, suggestPricing, createDraft
4. Streaming responses for real-time feedback

**Tasks:**
1. Create `lib/ai/assistant.ts`:
   - Define AI tools (function calling)
   - Build system prompt for quotation assistant
   - Handle streaming responses
2. Create API `/api/ai/chat` (streaming):
   - Accept: `{ messages, quotationContext }`
   - Return: Streaming SSE response
   - Implement tools: `searchCustomer`, `getHistory`, `suggestPricing`
3. Create `components/quotation/AIAssistant.tsx`:
   - Sidebar panel (collapsible)
   - Chat history
   - Streaming message display
   - Quick action buttons

**Deliverables:**
- [ ] AI assistant logic complete
- [ ] Streaming chat API working
- [ ] UI integrated into QuotationEditor
- [ ] Function calling tested (3+ functions)
- [ ] Chat history persisted

---

## 🧪 VERIFICATION PLAN

### Phase 02 Testing (Pricing):
- [ ] Test with 10 different line items
- [ ] Compare AI suggestions vs. actual historical prices
- [ ] Target: 70%+ accuracy (within ±20% range)

### Phase 03 Testing (Intro):
- [ ] Generate 5 intros for different customers
- [ ] Check: Grammar, tone, personalization
- [ ] Target: 90%+ require no manual edits

### Phase 04 Testing (Chatbot):
- [ ] Test conversation: "Create quotation for Customer X"
- [ ] Verify AI can search customers
- [ ] Verify AI can suggest prices
- [ ] Verify chat history saves correctly

---

## ⚠️ RISKS & MITIGATION

### Risk 1: AI Cost Too High
- **Mitigation:** Use GPT-4o-mini (10x cheaper than GPT-4)
- **Mitigation:** Cache AI responses for common queries
- **Mitigation:** Set API rate limits

### Risk 2: AI Suggestions Inaccurate
- **Mitigation:** Always show confidence score
- **Mitigation:** Allow manual override
- **Mitigation:** Collect user feedback to improve prompts

### Risk 3: Chatbot Doesn't Understand Vietnamese Well
- **Mitigation:** Use Claude 3.5 (better Vietnamese support)
- **Mitigation:** Provide clear system prompts with examples
- **Mitigation:** Test with real Vietnamese queries

---

## 📝 NOTES

- **OpenAI API Key:** Already have from Phase 2
- **Claude API Key:** Need to create if using chatbot
- **Vercel AI SDK:** Free, simplifies streaming
- **Start Simple:** Phase 01-03 first, Phase 04 (chatbot) is optional

---

**Next Steps:** Review this plan → Start Phase 01 (AI Infrastructure)
