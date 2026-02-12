# Product Specification – MVP

## 1. User Roles and Permissions

### User (Rep)

**Sales representative making calls**

- Access Rep Portal and Dialer
- View own compliance status
- Use AI Call Assistant
- View own performance metrics

### Admin

**Business owner/manager**

- All User permissions
- View all agents' compliance & performance
- Create/manage compliance rules
- Receive violation alerts
- Set daily goals for team

### Super Admin

**Platform owner (client)**

- All Admin permissions
- View all businesses' data
- Manage all users across platform
- Access platform-wide analytics
- System configuration

---

## 2. Authentication & User Management

### 2.1 Sign Up Flow

- Email/password registration
- Email verification
- Business/organization creation during signup (for Admins)
- Role selection (initially manual assignment by Super Admin)
- Invitation system for Admins to add Users to their organization

### 2.2 Sign In Flow

- Email/password login
- Password reset functionality
- Session management with JWT tokens
- Role-based redirect to appropriate dashboard
- RingCentral OAuth integration for dialer access

---

## 3. Rep Portal (Dialer Interface)

### 3.1 RingCentral Integration

- Embedded RingCentral dialer widget (replacing demo dialer)
- User authenticates with their RingCentral credentials
- Dial pad for manual number entry
- Call controls (mute, hold, end call)
- Call timer display

### 3.2 Live Transcript Panel

- Real-time speech-to-text transcription
- Speaker identification (Rep vs Customer)
- Scrollable transcript history during call
- Transcript saved post-call for review

### 3.3 Real-Time Compliance Monitor

- Compliance score (percentage) displayed prominently
- Checklist of compliance items (e.g. “Introduced yourself and company”, “Stated purpose of call”, “Asked for consent to continue”, “Disclosed recording if applicable”)
- Items auto-checked when detected in transcript
- Visual indicator (Active/Warning/Violation status)
- Real-time alerts for violations

### 3.4 AI Call Assistant

- Chat interface for reps to ask questions mid-call
- Pre-configured quick answers (pricing, implementation, integrations, competitive advantage, security features)
- RAG-based responses using company knowledge base
- Context-aware suggestions based on call transcript

### 3.5 Quick Responses

- Pre-defined response templates (Opening greeting, Handle objection, Close)
- One-click access during calls

---

## 4. Compliance Module (Admin View)

### 4.1 Compliance Rules Management

- Create, edit, delete compliance rules
- Rule attributes: Name, Description, Category (Disclosure, Prohibited Language, Timing, Consent, Data Handling, Licensing), Rule Type, Jurisdiction (UK, US, California, etc.), Severity (Low, Medium, High, Critical), Detection Pattern (keywords/regex for automated detection), Remediation Steps
- Category-based organization with counts
- Search and filter rules
- Jurisdiction-specific rule activation

### 4.2 Compliance Overview Dashboard

- Summary cards showing rule counts by category
- List of all rules with severity indicators
- Quick access to add new rules

### 4.3 Violations Tracking (TPI & DNC Compliance)

- Recent violations list: Rep name and phone number, Violation type (e.g. Script deviation, Recording Consent Notice), Timestamp, Violation count per rep
- Single check and bulk verification options
- Drill-down to specific call details

### 4.4 Alert System

- Email notifications to Admin when violations occur
- Configurable alert thresholds by severity
- Super Admin receives alerts for all organizations

---

## 5. Performance Monitoring (Basic)

- Daily goals (set by Admin for their team)
- Call statistics: Number of calls made, Active call time, Calls per day
- Number of sales/conversions tracking
- Empathy/tone indicators (basic sentiment analysis from AI)

---

## 6. Super Admin Dashboard

- View all organizations and their agents
- Platform-wide compliance overview
- User management (create credentials manually)
- System health monitoring

---

## Implementation Notes

- **Platform roles** in code: `rep` | `admin` | `super_admin` (see `backend/docs/ROLES.md` and `frontend/src/lib/roles.ts`).
- Role hierarchy: rep < admin < super_admin (higher role satisfies checks for lower roles).
- Org-scoped features (e.g. compliance rules, team goals) use `organization_members` and org role (`admin` | `member` | `viewer`).
