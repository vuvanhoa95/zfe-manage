# Phase 02: AI Backend Endpoints
Status: ✅ Complete

## Objective
Create the brain of the smart input system. These endpoints will transform unstructured text/images into structured data.

## Requirements
- High accuracy for Vietnamese text parsing.
- Support for images (OpenAI Vision).
- Structured JSON output.

## Implementation Steps
1. [x] **Voice Parsing Endpoint**: Create `app/api/ai/parse-voice/route.ts`.
   - Prompt engineering for extracting project name, location, and items.
2. [x] **Card Scanning Endpoint**: Create `app/api/ai/scan-card/route.ts`.
   - GPT-4o-vision prompt for business card OCR.
3. [x] Add error handling and specific JSON schemas for AI output.

## Files to Create/Modify
- `app/api/ai/parse-voice/route.ts` [NEW]
- `app/api/ai/scan-card/route.ts` [NEW]
- `lib/ai/prompts.ts` [NEW] - Store AI prompts.

## Test Criteria
- [ ] Parse voice endpoint returns correct JSON for sample transcript.
- [ ] Scan card endpoint extracts correct contact info from a sample card image.
