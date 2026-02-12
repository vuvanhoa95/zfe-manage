# Phase 02: Smart Pricing Suggestions
Status: ✅ Complete

## Objective
Implement AI-powered pricing suggestions that analyze historical data to recommend optimal prices for quotation line items.

## Requirements
- Query similar items from historical quotations
- AI analyzes customer segment, project size, location
- Return: Min/Avg/Max price range + confidence score
- One-click apply to line item
- 70%+ accuracy target (within ±20% of historical average)

## How It Works
1. User adds a line item (e.g., "Thiết kế Kiến trúc")
2. On focus of `unitPrice` field → Auto-trigger AI suggestion
3. System searches database for similar items
4. AI analyzes context and returns price range
5. User sees suggestion card: "💡 AI gợi ý: 500K - 800K - 1.2M"
6. Click to apply average price

## Implementation Steps
1. [x] Create `lib/ai/pricing-analyzer.ts`:
   - Database query for similar items (fuzzy match on title)
   - Build AI prompt with historical context
   - Parse JSON response: `{ min, avg, max, confidence, reasoning }`
2. [x] Create API `/api/ai/pricing-suggest/route.ts`:
   - Accept: `{ itemTitle, customerId?, projectSize?, location? }`
   - Return: AI-generated price range
3. [x] Create `components/quotation/AIPricingSuggestion.tsx`:
   - Floating card near `unitPrice` input
   - Display: Min/Avg/Max with visual range indicator
   - "Apply Average" button
   - Loading state + error handling
4. [x] Integrate into `PricingTable.tsx`:
   - Show suggestion when user focuses `unitPrice`
   - Auto-hide after 10 seconds or when applied

## Files to Create/Modify
- `lib/ai/pricing-analyzer.ts` [NEW]
- `app/api/ai/pricing-suggest/route.ts` [NEW]
- `components/quotation/AIPricingSuggestion.tsx` [NEW]
- `components/quotation/PricingTable.tsx` [MODIFY]

## Data Model
```typescript
type PricingSuggestion = {
  min: number;
  avg: number;
  max: number;
  confidence: number;  // 0-1
  reasoning: string;   // AI explanation
  sampleCount: number; // How many historical items were analyzed
};
```

## Testing
- [ ] Test with 10 different line items
- [ ] Compare AI suggestions vs. actual historical prices
- [ ] Measure accuracy (should be 70%+ within ±20% range)
- [ ] Test edge cases: no historical data, new item types

## Next Phase
Phase 03: Auto Intro Generator
