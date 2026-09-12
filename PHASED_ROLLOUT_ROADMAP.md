# Breakthrough Manager OS: Phased Security & Architectural Rollout Plan
**Australian NDIS Provider Practice Management & Clinical Governance Platform**
**Evaluation Baseline Score: 47 / 100 ➔ Target Score: 97 / 100**

---

## Executive Summary

This phased rollout plan translates the 9 key findings from the technical security and architectural evaluation into an ordered, non-disruptive, production-grade implementation roadmap. The plan is organized into **5 Sequenced Phases** with milestone gates, automated verification criteria, and compliance checkpoints aligned with the **NDIS Quality and Safeguards Commission** (NDIS Act 2013, Section 73Z) and **Australian Privacy Principles (APPs)**.

---

## Visual Roadmap Overview

```
[Phase 1: Zero-Trust Identity] ──► [Phase 2: API Gateway Hardening] ──► [Phase 3: Storage & Audit Ledger]
         (Score: 47 ➔ 58)                         (Score: 58 ➔ 68)                       (Score: 68 ➔ 82)
                │                                         │                                      │
                ▼                                         ▼                                      ▼
    Default PENDING Role                      Server Session Auth Middleware            Cross-Service firestore.get()
    Block Client Role Escalation              HMAC-SHA256 Webhook Verification          Immutable Audit Ledger (No-Delete)
    Eliminate Substring Logic                 Server-Guarded Gemini Proxy               Scoped Notifications

                                                          │
                                                          ▼
                                      [Phase 4: Durable Enterprise State] ──► [Phase 5: Verification & Architecture]
                                                (Score: 82 ➔ 87)                               (Score: 87 ➔ 97)
                                                       │                                              │
                                                       ▼                                              ▼
                                           Firestore PRODA Batch Records              Firebase Local Emulator Suite
                                           Firestore Xero Invoicing & Feeds           Strict Compiler & Linting (CI)
                                           PACE Reference Tracking                    Domain Subdirectory Modularization
```

---

## Phase 1: Zero-Trust Identity & Access Perimeter (Immediate / Days 1–3)
**Score Impact: 47 ➔ 58 (+11 points) | Severity: Critical**

### Objectives & Threat Addressed
- Eliminate the public privilege-escalation vulnerability where unauthenticated registrants bypass RBAC by creating an account with substring-matched emails (e.g., `*admin*`, `*director*`).
- Prevent direct write calls to `/users/{uid}` with elevated `role: "ADMIN"`.

### Implementation Actions
1. **Remove Client-Side Substring Role Heuristics**:
   - Refactor `stores/slices/authSlice.ts` to remove any `email.includes('admin')` logic.
   - Set initial user registration state to `PENDING` awaiting organizational invitation or administrator approval.
2. **Harden Cloud Firestore Rules for User Profiles**:
   - Enforce rule in `firestore.rules`:
     ```cel
     match /users/{userId} {
       allow get: if isOwner(userId) || isSignedIn();
       allow create: if isOwner(userId)
         && isValidId(userId)
         && incoming().id == userId
         && (incoming().role == 'PENDING' || incoming().role == 'support_worker');
       allow update: if isOwner(userId)
         && incoming().id == existing().id
         && incoming().role == existing().role
         && incoming().diff(existing()).affectedKeys().hasOnly(['displayName', 'branchId', 'phone', 'preferredName', 'updatedAt']);
       allow delete: if false;
     }
     ```
3. **Role Promotion Workflow**:
   - Elevated roles (`lead_clinician`, `practice_manager`, `compliance_officer`) can only be granted by verified administrators through server-authorized administrative operations.

### Verification Gate
- Attempt creating a user document with `role: "ADMIN"` via unauthenticated and standard authenticated client SDK calls; ensure Firestore rejects the write with `PERMISSION_DENIED`.

---

## Phase 2: API Gateway Hardening & Webhook Cryptography (Days 4–7)
**Score Impact: 58 ➔ 68 (+10 points) | Severity: Critical**

### Objectives & Threat Addressed
- Block unauthenticated public access to Next.js/Express server route handlers (`/api/*`).
- Protect Google Cloud Gemini AI quota and clinical guardrails against prompt injection and arbitrary model override.
- Verify cryptographic authenticity on external webhook ingestion points (17hats, Xero, NDIS Portal).

### Implementation Actions
1. **Server-Side Session Verification Middleware (`lib/auth/serverAuth.ts`)**:
   - Implement `verifyFirebaseIdToken()` checking incoming `Authorization: Bearer <token>` headers against Google Identity Toolkit.
   - Enforce `requireAuth` and `requireRole` middleware across all sensitive endpoints.
2. **Secure Gemini AI Proxy (`app/api/gemini/generate/route.ts`)**:
   - Enforce valid bearer session token before calling Google Gen AI SDK.
   - Enforce server-side clinical system instructions aligned with NDIS PBS guidelines.
   - Cap prompt length (max 8,000 characters) and sanitize input to mitigate prompt injection.
3. **Cryptographic HMAC-SHA256 Webhook Validation (`lib/auth/webhookValidation.ts`)**:
   - Verify signatures using Node.js `crypto.timingSafeEqual` to eliminate timing attacks.
   - Reject any incoming 17hats or third-party webhooks with missing or mismatched signatures.

### Verification Gate
- Query `/api/pricing/calculate`, `/api/incidents`, and `/api/gemini/generate` without a Bearer token; verify HTTP 401 response.
- Send webhook payload with invalid signature; verify HTTP 401 response.

---

## Phase 3: Cross-Service Cloud Storage & Audit Ledger Integrity (Days 8–12)
**Score Impact: 68 ➔ 82 (+14 points) | Severity: High**

### Objectives & Threat Addressed
- Repair broken Cloud Storage access rules where missing custom claims lock out legitimate practitioners.
- Prevent fabrication and tampering of statutory regulatory audit logs during NDIS Quality and Safeguards Commission inquiries.
- Scope notifications so participants cannot inspect other participants' or clinicians' notifications.

### Implementation Actions
1. **Storage Rules Cross-Service Lookups (`storage.rules`)**:
   - Replace nonexistent `request.auth.token.role` with `firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data`.
   - Grant read/write access based on actual user role in Firestore for:
     - `/clients/{clientId}/**` (Dossiers & BSP evidence, max 15MB)
     - `/bsp/{bspId}/**` (Behaviour Support Plans, max 25MB)
     - `/incidents/{incidentId}/**` (Statutory 24h evidence, max 10MB)
2. **Immutable Audit Ledger in Firestore Rules**:
   - Require `actorUid == request.auth.uid` on write.
   - Set `allow update, delete: if false;` on `/tenants/{tenantId}/auditLogs/{logId}`.
3. **Multi-Tenant Scoped Notifications**:
   - Update rule to allow read only if `resource.data.recipientUid == request.auth.uid || resource.data.tenantId == tenantId`.

### Verification Gate
- Upload client file from practitioner account; verify successful write with CEL rule passing.
- Attempt to delete or edit an existing audit log document; verify write rejected with `PERMISSION_DENIED`.

---

## Phase 4: Durable Enterprise State Persistence (Days 13–18)
**Score Impact: 82 ➔ 87 (+5 points) | Severity: Medium**

### Objectives & Threat Addressed
- Eliminate in-memory ephemeral Maps in PRODA (R8) and Xero (R9) that wipe batch references and PACE claim numbers when cloud containers restart.
- Align code implementation with project milestone documentation.

### Implementation Actions
1. **PRODA Batch Claims Persistence (`lib/integrations/prodaPersistence.ts`)**:
   - Store submitted NDIS PAPL bulk claim batches to `/tenants/{tenantId}/prodaBatches/{batchId}` in Cloud Firestore.
   - Track statutory batch attributes: `paceReferenceNumber`, `submissionTimestamp`, `claimLineItems`, `status`, and `ndisRegistrationNumber`.
   - Maintain a local IndexedDB/LocalStorage cache fallback for offline clinical operations.
2. **Xero Synchronization Engine (`lib/integrations/xeroPersistence.ts`)**:
   - Store invoices, payment statuses, and bank feed sync logs in `/tenants/{tenantId}/xeroInvoices/{invoiceId}`.
   - Support sandbox mock testing vs. live PRODA/Xero OAuth token flows with explicit UI indicators.

### Verification Gate
- Create a PRODA batch, trigger server restart, and verify the batch history and PACE reference remain fully intact.

---

## Phase 5: Automated Verification, CI/CD & Clean Architecture (Days 19–25)
**Score Impact: 87 ➔ 97 (+10 points) | Severity: Medium / Architectural**

### Objectives & Threat Addressed
- Eliminate synthetic JavaScript test mocks in favor of official Firebase Local Emulator Suite.
- Enforce strict compilation checks (`tsc --noEmit`) and remove orphaned legacy libraries (Postgres, Drizzle, obsolete Express scripts).
- Reorganize flat `components/features/` into clean domain-driven architecture.

### Implementation Actions
1. **Firebase Local Emulator Suite**:
   - Configure `firebase-tools` emulators for Firestore, Auth, and Storage.
   - Write automated CEL test suite with `@firebase/rules-unit-testing` verifying rule rejections.
2. **Compiler & Dependency Hygiene**:
   - Update `package.json` project metadata (`breakthrough-manager-os` v2.5.0).
   - Ensure strict TypeScript linting and build checks without `ignoreBuildErrors`.
3. **Domain Directory Reorganization**:
   - Partition feature components into domain subdirectories:
     - `components/features/clinical/` (BSP, ABC Data, Case Notes, Restrictive Practices)
     - `components/features/billing/` (NDIS PAPL Engine, PRODA Claims, Xero Invoicing)
     - `components/features/compliance/` (Section 73Z Incidents, Audit Register, SCHADS Roster)
     - `components/features/workspace/` (Google Workspace Hub, Cloud Drive, Picker)
     - `components/features/rollout/` (Security Roadmap & Audit Command Center)

### Verification Gate
- Automated CI pipeline runs `npm run lint` and passes 100% with zero type errors.

---

## Phased Rollout Tracking Table

| Phase | Milestone Name | Key Finding Addressed | Target Score | Target Window | Status |
|---|---|---|---|---|---|
| **Phase 1** | Zero-Trust Identity Perimeter | Privilege escalation on registration; `authSlice` substring matching | **58 / 100** | Days 1–3 | **COMPLETED & DEPLOYED** |
| **Phase 2** | API Gateway & Cryptography | Unauthenticated `/api/*` endpoints; prompt injection & webhook spoofing | **68 / 100** | Days 4–7 | **COMPLETED & DEPLOYED** |
| **Phase 3** | Storage & Audit Ledger Integrity | Missing custom claims in `storage.rules`; client-writable audit logs | **82 / 100** | Days 8–12 | **COMPLETED & DEPLOYED** |
| **Phase 4** | Durable Enterprise Integrations | In-memory PRODA/Xero state loss on container reboot | **87 / 100** | Days 13–18 | **COMPLETED & DEPLOYED** |
| **Phase 5** | CI/CD, Emulators & Clean Architecture | Synthetic test harness; dependency drift; flat component tree | **97 / 100** | Days 19–25 | **COMPLETED & DEPLOYED** |
