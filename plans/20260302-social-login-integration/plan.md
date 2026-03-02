# Plan: Social Login & User Approval Workflow
Created: 2026-03-02
Status: 🟡 In Progress
Feature: Google & Microsoft Login + Auto-create with Approval + Invite via Email

## Overview
Implement social login providers using NextAuth.js. New users via social login will be created in a `PENDING` state and require manual approval. Manually added users will receive an invitation email to set their password.

## Tech Stack
- Auth: NextAuth.js
- Providers: Google, Microsoft (Azure AD)
- Email: Resend (Already configured in project)
- Database: Prisma (PostgreSQL)

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | [Database Schema Update](phase-01-database-schema.md) | ✅ Complete | 100% |
| 02 | [Google Provider Integration](phase-02-google-auth.md) | ✅ Complete | 100% |
| 03 | [Microsoft Provider Integration](phase-03-microsoft-auth.md) | ✅ Complete | 100% |
| 04 | [User Approval Logic & Email Worker](phase-04-user-workflow.md) | ✅ Complete | 100% |
| 05 | [UI & Safety Testing](phase-05-ui-updates.md) | ✅ Complete | 100% |

## Quick Commands
- Start: `/code plans/20260302-social-login-integration/phase-01-database-schema.md`
- Status: `/next`
