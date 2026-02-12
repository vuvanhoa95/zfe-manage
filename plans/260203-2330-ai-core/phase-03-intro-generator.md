# Phase 03: Auto Intro Generator
Status: ✅ Complete

## Objective
Implement AI-powered introduction text generation for quotations. AI writes professional, personalized intros based on company profile, customer data, and project details.

## Requirements
- Generate 150-200 word professional Vietnamese introduction
- Personalized based on customer and project context
- Maintain formal business tone
- Regenerate option if user is not satisfied
- 90%+ quality target (minimal manual edits needed)

## How It Works
1. User clicks "✨ AI Tạo Lời Mở Đầu" button in QuotationEditor
2. AI fetches: Company profile + Customer info + Project details
3. AI generates personalized introduction (3-4 paragraphs)
4. User reviews in modal → Accept, Regenerate, or Edit

## Implementation Steps
1. [ ] Create `lib/ai/intro-generator.ts`:
   - Fetch company profile (name, contact, expertise)
   - Fetch customer data (name, industry, history)
   - Build AI prompt with context
   - Generate intro text (150-200 words)
2. [ ] Create API `/api/ai/generate-intro/route.ts`:
   - Accept: `{ customerId, projectName, projectNotes? }`
   - Fetch company + customer from database
   - Return: `{ introText, confidence }`
3. [ ] Create `components/quotation/AIIntroGenerator.tsx`:
   - "✨ AI Tạo Lời Mở Đầu" button
   - Modal to show generated text
   - Actions: Accept / Regenerate / Edit
   - Loading state (shimmer effect)
4. [ ] Integrate into `DataTab.tsx`:
   - Add button near `introText` field
   - On accept → Fill `introText` field

## Files to Create/Modify
- `lib/ai/intro-generator.ts` [NEW]
- `app/api/ai/generate-intro/route.ts` [NEW]
- `components/quotation/AIIntroGenerator.tsx` [NEW]
- `components/quotation/DataTab.tsx` [MODIFY]

## Example Prompt Structure
```text
System: You are a professional Vietnamese business writer.
User: Generate a quotation introduction for:
- Company: ZFENIX (BIM Consulting)
- Customer: ABC Corp (Construction company)
- Project: BIM for Landmark Tower

Generate a 150-200 word professional introduction.
```

## Example Output
```
Kính gửi Quý Công ty ABC,

ZFENIX trân trọng gửi đến Quý Công ty bản báo giá cho dự án BIM Landmark Tower. 
Với hơn 10 năm kinh nghiệm trong lĩnh vực tư vấn BIM, chúng tôi tự hào đã đồng hành 
cùng nhiều đơn vị xây dựng lớn...

[AI continues...]
```

## Testing
- [ ] Generate 5 intros for different customers
- [ ] Check: Grammar, tone, personalization quality
- [ ] Target: 90%+ require no manual edits
- [ ] Test regenerate function (different output each time)

## Next Phase
Phase 04: AI Assistant Chatbot (Optional)
