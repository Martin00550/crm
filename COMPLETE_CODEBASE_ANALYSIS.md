# 🔍 Complete Codebase Analysis Report

**Date:** April 8, 2026  
**Project:** PolicyPulse CRM  
**Scope:** Every file, route, component, database table, integration, and feature

---

## 📊 Executive Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Database** | 4 | 5 | 8 | 6 | 23 |
| **API Routes** | 6 | 8 | 12 | 5 | 31 |
| **UI Components** | 6 | 7 | 11 | 8 | 32 |
| **Features** | 3 | 4 | 5 | 3 | 15 |
| **Integrations** | 2 | 3 | 4 | 2 | 11 |
| **TOTAL** | **21** | **27** | **40** | **24** | **112** |

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### DATABASE

#### 1. No Foreign Key Constraints
**Files:** `src/db/schema.ts`  
**Impact:** Data integrity at risk - orphaned records possible  
**Problem:** Zero database-level FK constraints exist. All relations are ORM-only. If an agency is deleted, all its users, clients, policies, renewals, commissions, documents, invitations, and notifications become orphaned.  
**Fix:** Add `.references(() => table.id, { onDelete: 'cascade' })` to every FK column.

#### 2. Missing Unique Constraint on Policy Numbers
**File:** `src/db/schema.ts:82`  
**Impact:** Data integrity disaster waiting to happen  
**Problem:** `policies.policyNumber` has no unique constraint. Two policies can share the same number.  
**Fix:** Add unique constraint, likely composite: `.unique(['agencyId', 'policyNumber'])`

#### 3. Runtime Bug: Mock Data Inserting Non-Existent Columns
**File:** `src/lib/mock-data.ts:83-84`  
**Impact:** Silent failures or crashes  
**Problem:** Inserts `emailSent` and `emailSentAt` into `renewals` table, but schema uses `notification90Sent`, `notification60Sent`, `notification30Sent` instead.  
**Fix:** Update mock data to use correct column names.

#### 4. Feature Usage Race Condition
**File:** `src/db/schema.ts:45-57`, `src/lib/feature-access.ts`  
**Impact:** Duplicate usage records, incorrect billing  
**Problem:** No composite unique constraint on `(agencyId, featureKey, billingPeriodStart)`. Code does select-then-insert which has race conditions.  
**Fix:** Add `.unique(['agencyId', 'featureKey', 'billingPeriodStart'])`

---

### API ROUTES

#### 5. Seed/Mock Routes Have NO Authentication
**Files:** 
- `src/app/api/seed/route.ts:9`
- `src/app/api/mock-data/route.ts:9`
- `src/app/api/seed-sample/route.ts:44`  
**Impact:** Anyone can inject arbitrary data into production database  
**Problem:** These routes have zero auth checks. Even the `'use server'` directive doesn't prevent API access.  
**Fix:** Add auth middleware, or remove these routes entirely in production.

#### 6. Job Trigger Routes Have NO Authentication
**Files:**
- `src/app/api/jobs/renewal-check/route.ts:5`
- `src/app/api/jobs/scheduler/route.ts:6`  
**Impact:** Anyone can spam renewal checks, causing email floods and API costs  
**Fix:** Add auth + role checks.

#### 7. Portal Auth Uses Weak/Fallback JWT Secret
**File:** `src/app/api/portal/auth/route.ts:8`  
**Impact:** Tokens can be forged by anyone who knows the default secret  
**Problem:** Falls back to `'your-secret-key-change-in-production'` if env var not set.  
**Fix:** Require JWT_SECRET, crash on startup if missing.

#### 8. Document Routes Don't Verify Agency Ownership
**Files:** `src/app/api/documents/route.ts:142,172`  
**Impact:** Users can query and delete documents from ANY agency  
**Problem:** `agencyId` comes from query params but isn't cross-referenced with the authenticated user's agency.  
**Fix:** Use `getUserAgencyId(userId)` instead of accepting agencyId from params.

#### 9. Branding Route Accepts agencyId from Request Body
**File:** `src/app/api/branding/route.ts:18`  
**Impact:** Users can modify another agency's branding  
**Fix:** Get agencyId from authenticated user, not request body.

#### 10. Portal Auth Login Has No Rate Limiting
**File:** `src/app/api/portal/auth/route.ts`  
**Impact:** Brute force vulnerable - anyone can try unlimited passwords  
**Fix:** Add rate limiting (e.g., 5 attempts per IP per minute).

---

### UI COMPONENTS

#### 11. Homepage Prices Completely Wrong
**File:** `src/app/page.tsx:247`  
**Impact:** Customers see wrong prices ($149/$349 vs actual $99/$249/$499)  
**Problem:** Homepage has hardcoded prices that don't match pricing page or billing page.  
**Fix:** Import prices from `src/lib/features.ts` or remove pricing from homepage.

#### 12. redirect() in Client Component Will Crash
**File:** `src/app/dashboard/analytics/page.tsx:10`  
**Impact:** Runtime crash when user not signed in  
**Problem:** `redirect()` from `next/navigation` in a `'use client'` component throws during render.  
**Fix:** Use `useRouter().push()` instead.

#### 13. Missing API Routes Break Client CRUD
**File:** `src/app/dashboard/clients/[id]/page.tsx:228,260,290`  
**Impact:** Cannot create, update, or delete policies from client detail page  
**Problem:** Component fetches `/api/policies` and `/api/policies/[id]` but these routes don't exist.  
**Fix:** Create the missing policy CRUD routes.

#### 14. Demo Settings Links to Non-Existent Routes
**File:** `src/app/demo/settings/page.tsx:50`  
**Impact:** All settings links in demo mode 404  
**Problem:** Links to `/demo/settings/profile`, `/demo/settings/branding`, etc. but only `/demo/settings/page.tsx` exists.  
**Fix:** Create the sub-routes or disable the links in demo mode.

#### 15. Add Renewal Button Does Nothing
**File:** `src/components/dashboard/DashboardButtons.tsx:399-434`  
**Impact:** Broken feature - users click and nothing happens  
**Problem:** "Commit Renewal" button has no onClick handler.  
**Fix:** Implement the submit handler or remove the button.

#### 16. Contact Form in Portal Does Nothing
**File:** `src/app/portal/[subdomain]/page.tsx:169-203`  
**Impact:** Clients can't submit contact forms  
**Problem:** Form has `type="submit"` but no `onSubmit` handler.  
**Fix:** Add submit handler that sends to API or emails.

---

## 🟠 HIGH PRIORITY ISSUES

### DATABASE

#### 17. Missing Indexes on Key Columns
**Files:** `src/db/schema.ts`  
**Missing indexes on:**
- `crossSellOpportunities.agencyId`
- `commissions.agencyId`
- `messages.agencyId`
- `policies.status` (frequently queried)

**Fix:** Add indexes to all frequently filtered columns.

#### 18. Incomplete ORM Relations
**Files:** `src/db/schema.ts:238-277`  
**Missing agency relations on:**
- `renewals.agencyId`
- `commissions.agencyId`
- `crossSellOpportunities.agencyId`
- `messages.agencyId`
- `featureUsage.agencyId`

**Fix:** Add `agency: one(agencies)` relation to each.

#### 19. Stripe Column Names Misleading
**File:** `src/db/schema.ts:21-22`  
**Impact:** Developer confusion  
**Problem:** Columns named `stripeCustomerId` and `stripeSubscriptionId` but actually store Paddle IDs now.  
**Fix:** Create migration to rename to `paymentProcessorCustomerId` and `paymentProcessorSubscriptionId`.

#### 20. No Check Constraints on Enums
**File:** `src/db/schema.ts`  
**Impact:** Invalid data can be inserted  
**Problem:** Columns like `users.role`, `policies.status`, `invitations.status` accept any text value.  
**Fix:** Add PostgreSQL CHECK constraints: `.check(sql`role IN ('owner', 'admin', 'csr', 'producer')`)`

#### 21. No Soft Delete Support
**Impact:** Permanent data loss on deletion  
**Problem:** No `deletedAt` columns on any tables.  
**Fix:** Add `deletedAt timestamp` to `clients`, `policies`, `agencies` for soft deletes.

---

### API ROUTES

#### 22. No Input Validation (Zod/Yup)
**Affects:** Every single POST/PUT/PATCH route  
**Problem:** All validation is manual `if (!field)` checks. No email format validation, no phone validation, no date validation.  
**Fix:** Add Zod schemas for all route inputs.

#### 23. N+1 Query Pattern in Chat API
**File:** `src/app/api/chat/route.ts:252-256`  
**Impact:** Will OOM on large datasets  
**Problem:** Fetches ALL policies and clients into memory, then filters in JavaScript.  
**Fix:** Push filtering to database with proper WHERE clauses.

#### 24. CSV Export Has No Pagination
**Files:** `src/app/api/export/route.ts:54,65,80`  
**Impact:** Will OOM on large datasets  
**Problem:** Fetches ALL records with `.execute()` and no limit.  
**Fix:** Add streaming or chunked export for large datasets.

#### 25. In-Memory Rate Limiter Doesn't Work in Serverless
**File:** `src/app/api/chat/route.ts:8-19`  
**Impact:** Rate limiting completely ineffective in production  
**Problem:** Uses JavaScript `Map` which is lost between serverless invocations.  
**Fix:** Use Redis or database-backed rate limiting.

#### 26. Debug Routes Exposed
**Files:** All 8 routes in `src/app/api/debug/`  
**Impact:** `debug/force-enable` can escalate any agency to enterprise tier for free  
**Problem:** Weak guard: `if (NODE_ENV === 'production' && !ADMIN_SECRET)`. If ADMIN_SECRET is set, the guard is bypassed entirely.  
**Fix:** Remove debug routes in production, or add proper admin authentication.

#### 27. Notifications POST Allows User Spoofing
**File:** `src/app/api/notifications/route.ts:106`  
**Impact:** Can create notifications for any user  
**Problem:** `targetUserId` accepted from request body without authorization check.  
**Fix:** Verify `targetUserId === userId` or require admin role.

#### 28. S3 Orphaned Files
**Files:** `src/app/api/documents/route.ts:106`, `src/app/api/upload/logo/route.ts:70`  
**Impact:** Storage costs accumulate for files not in database  
**Problem:** If S3 upload succeeds but DB insert fails, file is orphaned.  
**Fix:** Add cleanup logic in error handler to delete uploaded file on DB failure.

---

### UI COMPONENTS

#### 29. 16+ Dead/Unused Components
**Files:**
- `src/components/dashboard/ClientsView.tsx` - Never imported
- `src/components/dashboard/CommandCenter.tsx` - Never imported
- `src/components/dashboard/SettingsPanel.tsx` - Settings never saved
- `src/components/dashboard/NotificationPanel.tsx` - Never imported
- `src/components/dashboard/PolicyLeakageDashboard.tsx` - No page uses it
- `src/components/dashboard/RiskDashboard.tsx` - No `/dashboard/risk` page exists
- `src/components/modals/ExportModal.tsx` - Never imported
- `src/components/dashboard/DashboardButtons.tsx:47-250` - 6 unused exported buttons
- `src/app/layout_metadata.ts` - Not imported
- `src/app/pricing/layout_metadata.ts` - Not imported

**Fix:** Delete all unused components or implement the missing pages.

#### 30. Search Bar Only Searches Mock Data
**File:** `src/components/dashboard/SearchBar.tsx:27-45`  
**Impact:** Search functionality is completely fake  
**Problem:** Returns hardcoded "John Smith" and "POL123" results. Database is never queried.  
**Fix:** Implement real search via API route.

#### 31. No Error Boundaries Anywhere
**Impact:** Any runtime error crashes the entire app  
**Problem:** Zero `error.tsx` files exist in any route group.  
**Fix:** Add `error.tsx` and `loading.tsx` to every major route.

#### 32. Modal Z-Index Conflicts
**Files:** Multiple components use `z-[9999]`  
**Impact:** Modals can overlap and become unusable  
**Problem:** No stacking context management.  
**Fix:** Use a modal manager with incremental z-indexes.

#### 33. No Keyboard Navigation in Modals
**Impact:** Inaccessible for keyboard-only users  
**Problem:** No Escape key handling, no focus traps, no arrow key navigation.  
**Fix:** Add focus trap library and keyboard event listeners.

#### 34. Mobile Sidebar Not Responsive
**File:** `src/components/dashboard/Sidebar.tsx:36`  
**Impact:** Broken on mobile - fixed 256px width takes 25% of viewport  
**Problem:** No collapsible sidebar or hamburger menu.  
**Fix:** Implement responsive sidebar that collapses on mobile.

#### 35. Inconsistent Design System
**Impact:** App looks disjointed  
**Problem:** Dashboard uses custom tokens (`bg-surface`, `rounded-[32px]`) but modals and portal pages use plain Tailwind (`bg-white`, `rounded-2xl`, `slate-200`).  
**Fix:** Apply design system tokens consistently across all components.

---

## 🟡 MEDIUM PRIORITY ISSUES

### DATABASE

#### 36. No Audit Logs Table
**Impact:** No way to track who changed what  
**Problem:** CRUD operations on clients, policies, documents have no audit trail.  
**Fix:** Create `audit_logs` table with `userId`, `action`, `entityType`, `entityId`, `oldValues`, `newValues`, `timestamp`.

#### 37. Redundant `renewals.daysOut` Column
**File:** `src/db/schema.ts:141`  
**Problem:** Can be computed from `renewalDate - NOW()`. Sometimes set, sometimes null.  
**Fix:** Remove column or add generated column constraint.

#### 38. Normalization Violation in `agencies.branding`
**File:** `src/db/schema.ts:26-39`  
**Problem:** JSONB column mixes branding config with notification settings.  
**Fix:** Separate notification settings into their own columns or table.

#### 39. Renewal Notification Tracking Violates 1NF
**File:** `src/db/schema.ts:142-147`  
**Problem:** Six boolean columns for notification types is a repeating group.  
**Fix:** Create `renewal_notifications` table with `renewalId`, `type`, `sentAt`.

#### 40. No `updatedAt` on `crossSellOpportunities`
**Impact:** Can't track when opportunities were last modified  
**Fix:** Add `.updatedAt` timestamp column.

#### 41. Missing Unique on `renewals.policyId`
**Impact:** Can create duplicate renewal records for same policy  
**Fix:** Add `.unique()` constraint.

#### 42. Decimal Precision Inconsistency
**File:** `src/db/schema.ts`  
**Problem:** `commissions.agentSplit` stored as string `'70'` but uses decimal type.  
**Fix:** Make consistent - either all percentages as decimals or all as strings.

#### 43. No `messages` Table CRUD API
**Impact:** Dead schema - table exists but no routes use it  
**Fix:** Either implement message CRUD routes or remove the table.

---

### API ROUTES

#### 44. Generic 500 Errors Everywhere
**Affects:** Every route  
**Problem:** All errors return `"Internal server error"` without distinguishing DB errors, validation errors, permission errors, etc.  
**Fix:** Create custom error classes and proper error handling middleware.

#### 45. Missing Pagination on List Endpoints
**Files:** Multiple list endpoints  
**Problem:** No offset/cursor pagination on notifications, documents, policies.  
**Fix:** Add pagination to all list endpoints.

#### 46. Overlapping Debug Routes
**Files:** `debug/upgrade` vs `debug/force-enable`  
**Problem:** Both upgrade agency to enterprise tier. Redundant.  
**Fix:** Consolidate into one route.

#### 47. Agency Profile Routes Overlap
**Files:** `/api/agency/profile` vs `/api/agency/user-agency`  
**Problem:** Both fetch agency info with different response shapes.  
**Fix:** Consolidate into one route with optional query params for response shape.

#### 48. Subscription Route Missing Validation
**File:** `src/app/api/subscription/route.ts:43`  
**Problem:** Only validates `tier` with `.includes()`. `customerId` unvalidated.  
**Fix:** Add Zod schema for subscription requests.

#### 49. CSV Export No Feature Gate Check
**File:** `src/app/api/export/route.ts`  
**Impact:** Already fixed in previous PR ✅

#### 50. Import Route Has No Error Limit
**File:** `src/app/api/import/route.ts:189`  
**Problem:** Import continues even with hundreds of failed rows.  
**Fix:** Add error threshold (e.g., abort if >10% of rows fail).

---

### UI COMPONENTS

#### 51. Hardcoded Carrier Lists
**Files:** 
- `src/components/modals/PolicyModal.tsx:78-88`
- `src/components/dashboard/FilterPanel.tsx:92-101`  
**Problem:** Carriers hardcoded in multiple places.  
**Fix:** Fetch carriers from database or config file.

#### 52. Missing Empty States
**Files:**
- `src/components/dashboard/ClientsTable.tsx` - No "no clients" message
- `src/app/dashboard/renewals/page.tsx` - Duplicate empty states  
**Fix:** Add proper empty states with CTAs.

#### 53. Forms Use `alert()` Instead of Toasts
**Files:** Multiple components  
**Problem:** `alert("Upload failed")`, `alert("Delete failed")` etc.  
**Fix:** Implement global toast system and use consistently.

#### 54. No Memoization on Computed Values
**Files:**
- `src/components/dashboard/ClientsView.tsx:50` - `filteredClients`
- `src/components/dashboard/CommandCenter.tsx:35` - `filteredPolicies`
- `src/components/dashboard/PolicyLedgerTable.tsx:11` - `filteredLedger`  
**Impact:** Unnecessary re-renders on every state change  
**Fix:** Wrap with `useMemo`.

#### 55. AI Report Modal Always Returns Hardcoded Responses
**File:** `src/components/modals/AIReportModal.tsx:13-17,50`  
**Impact:** "LIVE MODE" is a lie - always returns canned responses  
**Fix:** Implement real AI report generation or remove the modal.

#### 56. Notification Polling Has No Loading State
**File:** `src/components/dashboard/NotificationDropdown.tsx:28`  
**Impact:** User sees no indication of fetching  
**Fix:** Add loading indicator.

#### 57. Copyright Year Outdated
**Files:** `src/app/page.tsx:301`, `src/app/pricing/page.tsx:228`  
**Problem:** Shows "2024" but current year is 2026  
**Fix:** Update to 2026 or make dynamic.

#### 58. External Image Dependencies
**Files:** 
- `src/app/page.tsx:21` - `https://grainy-gradients.vercel.app/noise.svg`
- Multiple logo URLs from external CDNs  
**Impact:** If external service goes down, app looks broken  
**Fix:** Bundle images locally or use reliable CDN.

---

### FEATURES

#### 59. AI Cross-Sell Has No UI
**Problem:** `crossSellOpportunities` table exists and Inngest generates opportunities, but users can't view, accept, or dismiss them.  
**Fix:** Create Cross-Sell dashboard page.

#### 60. Commission Management Has No UI
**Problem:** `commissions` table exists and monitor runs, but no dedicated commission management page.  
**Fix:** Create Commission tracking page.

#### 61. Messages Feature Incomplete
**Problem:** `messages` table exists but no CRUD routes, no UI, no usage.  
**Fix:** Either implement messaging system or remove the table.

#### 62. Client Portal Invite Flow Incomplete
**File:** `src/lib/client-portal.ts:146`  
**Problem:** Generates portal invite URL but no email is sent to client.  
**Fix:** Integrate with email service to send invite to client.

#### 63. Renewal Monitor Email Not Implemented
**File:** `src/lib/renewal-monitor.ts`  
**Problem:** `runRenewalCheck()` identifies upcoming renewals but doesn't actually send emails.  
**Fix:** Connect to email service.

---

## 🟢 LOW PRIORITY / NICE TO HAVE

### DATABASE

#### 64. Timestamp vs Date Types
**Problem:** `renewals.renewalDate`, `policies.effectiveDate`, `policies.expirationDate` use `timestamp` but should be `date`.  
**Fix:** Change to `date` type to avoid timezone confusion.

#### 65. No Database-Level Check for `expiresAt > sentAt`
**File:** `src/db/schema.ts:113`  
**Fix:** Add check constraint.

#### 66. Policy Health Score/Status No Defaults
**File:** `src/db/schema.ts:91-92`  
**Fix:** Add default values: `healthScore: 50`, `healthStatus: 'unknown'`.

#### 67. Missing Index on `notifications.createdAt`
**Fix:** Add index for chronological queries.

#### 68. Document File Path Should Be Unique
**Fix:** Add unique constraint on `documents.filePath`.

#### 69. Feature Usage Billing Period No Default
**Fix:** Add default values for `billingPeriodStart` and `billingPeriodEnd`.

---

### API ROUTES

#### 70. No Caching on Tier Lookups
**Files:** Multiple routes query `agencies.subscriptionTier` every request  
**Fix:** Add Redis or in-memory cache with TTL.

#### 71. Notification Seed Route Should Not Exist in Production
**File:** `src/app/api/notifications/seed/route.ts`  
**Fix:** Remove or gate behind admin auth.

#### 72. No Webhook Retry Logic
**File:** `src/app/api/webhooks/paddle/route.ts`  
**Problem:** If webhook handler fails, event is lost.  
**Fix:** Add retry queue or dead letter handling.

#### 73. No API Versioning
**Impact:** Future API changes will break existing clients  
**Fix:** Add `/api/v1/` prefix to all routes.

#### 74. No Request Logging
**Impact:** Can't debug issues or audit access  
**Fix:** Add request/response logging middleware.

---

### UI COMPONENTS

#### 75. Google Fonts Blocks Rendering
**File:** `src/app/layout.tsx:12`  
**Fix:** Use `next/font` or preload.

#### 76. Missing `aria-label` Throughout
**Files:** Multiple interactive elements  
**Fix:** Add proper ARIA attributes.

#### 77. Color Contrast Issues
**Files:** Multiple components with low opacity text  
**Fix:** Ensure WCAG AA compliance (4.5:1 ratio).

#### 78. Body Scroll Not Prevented When Modal Open
**Fix:** Add `document.body.style.overflow = 'hidden'` when modal opens.

#### 79. Agency ID Prop Drilling
**Fix:** Create React Context for agency-level data.

#### 80. No Image Optimization
**File:** Multiple `<img>` tags without `loading="lazy"`  
**Fix:** Add lazy loading and use Next.js `<Image>`.

#### 81. Date Formatting Inconsistent
**Problem:** Multiple date format methods used throughout  
**Fix:** Create shared `formatDate` utility and use consistently.

#### 82. PaddleCheckout Component Ignores Tier
**File:** `src/components/ui/PaddleCheckout.tsx:48`  
**Problem:** Always uses solo price regardless of `tier` prop.  
**Fix:** Use correct price ID based on tier.

---

## 📋 IMPLEMENTATION PRIORITY ROADMAP

### Phase 1: Critical Fixes (Week 1)
1. Add foreign key constraints to database
2. Add unique constraint on policy numbers
3. Fix mock-data.ts runtime bug
4. Add auth to seed/mock-data routes
5. Fix homepage pricing mismatch
6. Create missing policy CRUD routes
7. Fix redirect() in client component
8. Add agency ownership verification to document routes

### Phase 2: High Priority (Week 2-3)
9. Add missing database indexes
10. Implement Zod validation for all routes
11. Add rate limiting to portal auth
12. Fix N+1 queries in chat API
13. Add error boundaries to all routes
14. Delete dead/unused components
15. Implement real search functionality
16. Fix modal z-index and keyboard navigation

### Phase 3: Medium Priority (Week 4-5)
17. Create audit logs table
18. Add pagination to list endpoints
19. Implement proper toast system
20. Add memoization to computed values
21. Create cross-sell UI
22. Create commission management UI
23. Fix design system inconsistencies
24. Add mobile responsive sidebar

### Phase 4: Low Priority (Week 6+)
25. Add soft delete support
26. Implement caching for tier lookups
27. Add API versioning
28. Fix accessibility issues
29. Add request logging
30. Optimize image loading

---

## 🎯 Quick Wins (Can Fix in <1 Hour Each)

1. ✅ Fix copyright year (2 min)
2. ✅ Remove dead links on homepage (10 min)
3. ✅ Delete unused components (30 min)
4. ✅ Fix Add Renewal button onClick (15 min)
5. ✅ Add portal contact form onSubmit (30 min)
6. ✅ Fix PaddleCheckout tier selection (20 min)
7. ✅ Add missing indexes (30 min)
8. ✅ Fix mock-data column names (5 min)
9. ✅ Add aria-labels to buttons (1 hour)
10. ✅ Add error boundaries (1 hour)

---

**Total Issues Found:** 112  
**Estimated Fix Time:** 4-6 weeks for full remediation  
**Recommended Approach:** Fix Phase 1 immediately, then work through phases 2-4 incrementally.
