# Phase 01: Setup & Dependencies
Status: ✅ Complete

## Objective
Prepare the environment and install necessary libraries for voice recognition and AI integration.

## Requirements
- Support for Vietnamese speech recognition.
- OpenAI SDK for cleaner API interactions.
- Permissions for microphone and camera in the browser.

## Implementation Steps
1. [x] Install dependencies: `npm install react-speech-recognition openai react-webcam`
2. [x] Install dev dependencies: `npm install -D @types/react-speech-recognition`
3. [x] Verify `OPENAI_API_KEY` in `.env`.
4. [x] Create a central `lib/ai/openai.ts` client.

## Files to Create/Modify
- `package.json` - Add dependencies.
- `lib/ai/openai.ts` - New central client.
- `.env` - Verify API keys.

## Test Criteria
- [ ] Dependencies installed without errors.
- [ ] OpenAI client initializes correctly.
