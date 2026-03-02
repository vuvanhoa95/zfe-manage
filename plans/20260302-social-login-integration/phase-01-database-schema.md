# Phase 01: Database Schema Update

## Objective
Update the Prisma schema to support OAuth accounts and user status management.

## Requirements
- Support multiple login methods per user (Email/Pass, Google, Microsoft).
- Add user status (ACTIVE, PENDING, SUSPENDED).
- Track account linking.

## Implementation Steps
1. [x] Add `Account` and `Session` models to `schema.prisma` (NextAuth standard).
2. [x] Add `status` field to `User` model with default value `PENDING`.
3. [x] Run `npx prisma migrate dev --name add_social_auth_and_status`.
4. [x] Update seed data to ensure admin is `ACTIVE`.

## Files to Modify
- `prisma/schema.prisma`
- `prisma/seed.ts`
