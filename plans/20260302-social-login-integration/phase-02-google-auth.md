# Phase 02: Google Provider Integration

## Objective
Enable Google OAuth login and handle user auto-creation.

## Requirements
- Configure Google Provider in `lib/auth.ts`.
- Implement `signIn` callback to check user existence or auto-create.
- Create initial user logic for social logins.

## Implementation Steps
1. [x] Create a "Google Project" in Google Cloud Console (User action).
2. [x] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`.
3. [x] Update `lib/auth.ts` to include Google Provider.
4. [x] Implement social login handler:
    - If user exists -> Login.
    - If user doesn't exist -> Create as `PENDING`.

## Files to Modify
- `lib/auth.ts`
- `.env`
- `.env.example`
