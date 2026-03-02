# Phase 04: User Approval Logic & Email Worker

## Objective
Implement administrative approval for new users and email invites for manually added users.

## Requirements
- Admin dashboard update: Approve/Reject users.
- Email triggers via Resend for new manual invites.
- Safe blocking of `PENDING` users during login.

## Implementation Steps
1. [x] Update `signIn` callback in NextAuth to explicitly check for `ACTIVE` status.
2. [x] Implement the "Waiting for Approval" page (Handled via Login Error).
3. [x] Create service to send "Invite & Change Password" email when admin adds user manually.
4. [x] Update User Admin UI to include status filters and Approve buttons.

## Files to Modify
- `lib/auth.ts`
- `app/api/users/route.ts` (POST)
- `lib/email/templates/invite-user.tsx`
- `middleware.ts` (or `proxy.ts`)
- `app/(dashboard)/users/page.tsx`
