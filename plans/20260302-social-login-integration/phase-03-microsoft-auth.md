# Phase 03: Microsoft Provider Integration

## Objective
Enable Microsoft Azure AD login (Outlook/Business/Personal).

## Requirements
- Handle common tenants (Multi-tenant support).
- Map Microsoft profile fields to database user fields.

## Implementation Steps
1. [x] Register App in Azure Portal (User action).
2. [x] Add `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID` to `.env`.
3. [x] Integrate Microsoft Provider into `lib/auth.ts`.
4. [x] Test multi-account login capability.

## Files to Modify
- `lib/auth.ts`
- `.env`
