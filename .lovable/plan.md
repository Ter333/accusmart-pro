

# 📊 OHADA Accounting Web Application — Implementation Plan

## Overview
A full-stack academic-grade accounting application following the SYSCOHADA standard, with strict role-based access (Admin, Chef, Comptable), automated financial report generation (Balance, Income Statement, Balance Sheet), and multi-period fiscal year support.

---

## Phase 1: Backend Foundation & Authentication

### 1.1 — Database Schema (Supabase)
- **profiles** table: first_name, last_name, phone, email, is_active (default false), created_at
- **user_roles** table: user_id, role (enum: admin, chef, comptable) — separate table for security
- **fiscal_periods** table: label, start_date, end_date, is_open, created_by
- **accounts** table: account_number, account_name, account_class (1–7), is_custom, fiscal_period_id — pre-loaded with the SYSCOHADA chart of accounts
- **journal_entries** table: date, debit_account_id, credit_account_id, debit_amount, credit_amount, label, created_by (comptable), fiscal_period_id, created_at
- **system_logs** table: user_id, action_type, description, timestamp — for admin audit trail
- RLS policies enforcing strict role-based data access on every table

### 1.2 — Authentication System
- Single login page (email + password) for all roles
- Registration page with: first name, last name, phone, email, password, confirm password
- After registration: user is **inactive** and cannot log in until admin approves
- Default admin account seeded: `admin@system.local` / `admin` — forced password change on first login
- Role-based redirect after login: Admin → Admin Panel, Chef → Reports, Comptable → Journal

---

## Phase 2: Admin Panel

### 2.1 — User Management
- View all pending registrations with approval/rejection actions
- During approval, admin assigns role: Comptable (default) or Chef
- View list of all active users with their roles
- Deactivate users if needed

### 2.2 — Fiscal Period Management
- Create, open, and close fiscal periods (fiscal years)
- Only one period can be active at a time

### 2.3 — System Logs (Read-Only)
- View login/logout timestamps per user
- View CRUD activity logs (journal entry creation, edits)
- Admin explicitly **cannot** access Journal, Balance, Income Statement, or Balance Sheet

Admin access is strictly limited to:
- User management
- Fiscal periods
- Logs

Admin must NOT have access at API or UI level to accounting data tables.


---

## Phase 3: Comptable — Journal Entry System

### 3.1 — SYSCOHADA Chart of Accounts
- Pre-loaded standard OHADA accounts (Classes 1–7)
- Comptable can add custom accounts or edit names
- Account picker with search and class filtering

### 3.2 — Journal Table (Precise Academic Layout)
- One continuous table with 5 columns: Debit Class | Credit Class | Date / Account / Label | Debit Amount | Credit Amount
- Each entry is a logical block of 3 rows within the continuous table:
  - **Row 1 (Debit):** Account class number in col 1, account name left-aligned in col 3, amount in col 4
  - **Row 2 (Credit):** Account class number in col 2, account name indented right in col 3, amount in col 5
  - **Row 3 (Label):** Label text in col 3 only
- The date appears once per entry, aligned with the block in the wide column
- No visible borders between entries — one seamless table
- Add/edit journal entry form with account selection, amounts, date, and label
- Comptable can only see and edit their own journal entries

Important:
- The journal layout is accounting-academic, not UI-standard
- Rows belong to the same logical entry but remain visually continuous
- Date is displayed only once per entry, aligned vertically with the block
- No grouping cards, no collapsible rows, no borders between entries


---

## Phase 4: Automatic Financial Reports (Chef View)

### 4.1 — Balance (Balance de Vérification)
- Auto-generated from all journal entries for the selected fiscal period
- Columns: Account Number | Account Name | Initial Balance | Debit Movement | Credit Movement | Final Balance
- All cells filled (0 if no value)
- Total row: Total Debit = Total Credit (verification)

### 4.2 — Income Statement (Compte de Résultat)
- Class 6 accounts → Charges (Debit side)
- Class 7 accounts → Products (Credit side)
- Automatic stock variation calculation
- Result = Total Products − Total Charges

### 4.3 — Balance Sheet (Bilan)
- Actif (Assets) / Passif (Liabilities + Equity) two-column layout
- Classes 1–5 distributed appropriately per OHADA rules
- Net result from Income Statement auto-injected into equity
- Verification: Total Actif = Total Passif

### 4.4 — Report Features
- Fiscal period selector to view reports for any period
- Chef can view reports across all comptables
- Print-friendly CSS for browser printing
- PDF export for all reports
- Chef explicitly **cannot** edit journal entries or manage users

## Accounting Calculation Rules (SYSCOHADA)

- Debit increases: Asset (1), Expense (6)
- Credit increases: Liability (2), Equity (3), Revenue (7)

- Account balances are calculated as:
  Final Balance = Opening Balance + Total Debit − Total Credit
  (or reversed depending on account class)

- Stock variation:
  Variation = Ending Stock − Opening Stock
  Positive variation → Product
  Negative variation → Charge

---

## Phase 5: Security, Polish & Cross-Cutting

### 5.1 — Route Guards & Access Control
- Frontend route guards checking role before rendering pages
- Backend RLS policies as the true security layer
- Admin blocked from accounting views; Comptable blocked from reports and admin; Chef blocked from editing and admin

### 5.2 — UI Design
- Clean, professional white and blue color scheme
- Desktop-first responsive layout
- Academic-style tables (no charts, no dashboards with widgets)
- Consistent navigation with role-appropriate sidebar/header

### 5.3 — Activity Logging
- All login/logout events recorded
- All journal CRUD actions logged with timestamps and user info
- Logs visible only to admin

---

## Data Flow Summary

```
Comptable creates Journal Entries
        ↓ (automatic)
   Balance (Vérification)
        ↓ (automatic)
   Income Statement (Résultat)
        ↓ (automatic)
   Balance Sheet (Bilan)
```

## Audit & Data Integrity
- Journal entries cannot be deleted once fiscal period is closed
- Any edit after creation must be logged
- Period closing freezes all accounting data

Chef views all generated reports. Admin manages users and monitors activity. Each role sees only what they're authorized to access.

