# LEXIE ERP System - Codebase Index & Workflow Documentation

## 📋 Overview

LEXIE ERP is a comprehensive Enterprise Resource Planning system built with:
- **Backend**: Django REST Framework (Python) with PostgreSQL database
- **Frontend**: Next.js 15 with TypeScript, React, and Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens) with role-based access control
- **Architecture**: RESTful API with modular Django apps

---

## 🏗️ System Architecture

### Backend Structure (`Backend/`)

```
Backend/
├── LEXY_API/              # Main Django project configuration
│   ├── settings.py        # Django settings, JWT config, CORS, database
│   ├── urls.py            # Root URL routing
│   └── wsgi.py/asgi.py    # WSGI/ASGI configuration
│
├── users/                 # User management & authentication
├── hr/                    # Human Resources module
├── Finance/               # Finance & Accounting module
├── audit/                 # Audit logging module
└── API/                   # General API endpoints (Product model)
```

### Frontend Structure (`Frontend/`)

```
Frontend/
├── app/                   # Next.js App Router
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── hr/           # HR module pages
│   │   ├── finance/      # Finance module pages
│   │   └── audit/        # Audit logs page
│   ├── login/            # Authentication pages
│   └── register/
│
├── components/           # React components
│   ├── auth/            # Login/Register forms
│   ├── hr/              # HR components (employees, departments)
│   ├── finance/         # Finance components (accounts, journals)
│   ├── payroll/         # Payroll components
│   ├── audit/           # Audit log components
│   ├── layout/          # Sidebar, Navbar
│   └── common/          # Shared UI components
│
├── context/             # React Context (Auth)
├── utils/               # API utilities, token management
└── hooks/               # Custom React hooks
```

---

## 🔐 Authentication & Authorization

### User Roles
- **ADMIN**: Full system access
- **HR**: Human Resources module access
- **FINANCE**: Finance module access
- **MANAGER**: Management-level access
- **STAFF**: Basic staff access
All request flows (procurement, leave, travel, etc.) require the authenticated user to be linked to an Employee record.
On user creation, a minimal Employee is auto-provisioned and linked.
Purchase Request creation auto-provisions the requester if missing.
A backfill command can be added to link/create employees for existing users: python manage.py backfill_employees.


### Authentication Flow
1. User logs in via `/api/auth/login/` → receives JWT access token
2. Token stored in localStorage
3. Token included in `Authorization: Bearer <token>` header for all API requests
4. Token refresh available via `/api/auth/refresh/`
5. User profile fetched from `/api/users/me/` to determine role

### JWT Configuration
- **Access Token Lifetime**: 15 minutes
- **Refresh Token Lifetime**: 90 days
- **Token Rotation**: Enabled
- **Blacklist After Rotation**: Enabled

---

## 📦 Core Modules

### 1. Users Module (`Backend/users/`)

**Models:**
- `UserProfile`: Extended user profile with role, department, phone, verification status

**Key Endpoints:**
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login (returns JWT)
- `GET /api/users/me/` - Get current user profile
- `GET /api/users/` - List all users (admin)
- `GET /api/users/{id}/` - User details

**Workflow:**
- User registration creates Django User + UserProfile
- Profile links to User via OneToOne relationship
- Role determines module access

---

### 2. HR Module (`Backend/hr/`)

**Models:**

#### Department
- `name`, `code` (unique)
- `manager` (ForeignKey to Employee)

#### Employee
- Personal: `staff_number`, `first_name`, `last_name`, `email`, `phone`, `national_id`
- Employment: `department`, `job_title`, `employment_type`, `hire_date`, `end_date`
- Compensation: `basic_salary`
- Tax Info: `kra_pin`, `nssf_number`, `sha_number`
- Status: `ACTIVE`, `ON_LEAVE`, `SUSPENDED`, `TERMINATED`, `RESIGNED`

#### EmploymentHistory
- Tracks: promotions, transfers, salary changes, terminations
- Stores: previous/new values for department, job title, salary, status
- Auto-updates Employee when saved

#### PayrollRun
- Period: `period_start`, `period_end`, `pay_date`
- Earnings: `basic_salary`, `allowances`, `overtime`, `gross_salary`
- Deductions: `paye_tax`, `nssf_deduction`, `sha_deduction`, `other_deductions`, `total_deductions`
- Net: `net_salary`
- Status: `DRAFT` → `CALCULATED` → `APPROVED` → `POSTED` → `PAID`
- Links to Finance via `journal_entry` ForeignKey

#### PayrollDeduction
- Additional deductions: loans, advances, insurance, union dues

**Key Endpoints:**
- `GET/POST /api/hr/departments/` - Department CRUD
- `GET/POST /api/hr/employees/` - Employee CRUD
- `GET /api/hr/employees/{id}/employment_history/` - Employee history
- `GET/POST /api/hr/payroll_runs/` - Payroll CRUD
- `POST /api/hr/payroll_runs/{id}/calculate/` - Calculate payroll
- `POST /api/hr/payroll_runs/{id}/approve/` - Approve payroll
- `POST /api/hr/payroll_runs/{id}/post_to_finance/` - Post to finance

**HR Workflow:**

1. **Employee Management:**
   - Create employee → Auto-creates draft payroll for current month
   - Update employee → Can create EmploymentHistory record
   - Terminate employee → Soft delete (status = TERMINATED)

2. **Payroll Generation:**
   ```
   Command: python manage.py generate_payroll --period monthly
   ```
   - Generates payroll for all active employees
   - Calculates: gross salary, deductions (PAYE, NSSF, SHA), net salary
   - Status: DRAFT → CALCULATED

3. **Payroll Approval:**
   - HR/Admin approves payroll → Status: APPROVED
   - Signal triggers auto-posting to Finance (if approved by Finance Admin)

4. **Posting to Finance:**
   - Finance Admin posts payroll → Creates JournalEntry in Finance module
   - Journal lines created:
     - Debit: Salary Expense (5210)
     - Credit: PAYE Payable (2110), NSSF Payable (2120), SHA Payable (2130)
     - Credit: Bank Account (1120) for net salary
   - Status: POSTED
   - `is_posted_to_finance = True`

**Signals:**
- `post_save` on Employee → Auto-creates payroll for new active employees
- `post_save` on PayrollRun → Auto-posts to Finance when APPROVED (if Finance Admin)

---

### 3. Finance Module (`Backend/Finance/`)

**Models:**

#### Account
- Chart of Accounts structure
- `code` (unique), `name`, `type` (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE)
- `parent` (self-referential for account hierarchy)
- `balance` (calculated field)

#### JournalEntry
- `date`, `description`, `reference`
- Links to PayrollRun via reverse relation

#### JournalLine
- `entry` (ForeignKey to JournalEntry)
- `account` (ForeignKey to Account)
- `debit`, `credit` amounts
- `description`

**Key Endpoints:**
- `GET/POST /api/finance/accounts/` - Account CRUD
- `GET/POST /api/finance/journals/` - Journal Entry CRUD
- `GET /api/finance/summary/` - Finance summary

**Finance Workflow:**

1. **Account Management:**
   - Create chart of accounts (Assets, Liabilities, Equity, Income, Expenses)
   - Standard accounts:
     - 1120: Bank Account
     - 2110: PAYE Payable
     - 2120: NSSF Payable
     - 2130: SHA Payable
     - 5210: Salary Expense

2. **Journal Entries:**
   - Manual entries: Create journal entry with multiple lines (debits/credits must balance)
   - Auto-entries: Created when payroll is posted from HR module

3. **Payroll Integration:**
   - When payroll posted → JournalEntry created automatically
   - Double-entry bookkeeping: Debits = Credits

---

### 4. Audit Module (`Backend/audit/`)

**Models:**

#### AuditLog
- `module`: HR, FINANCE
- `action_type`: PAYROLL_RUN, EMPLOYEE_HIRE, EMPLOYEE_TERMINATION
- `description`: Detailed description
- `performed_by`: User who performed action
- `timestamp`: Auto-created

**Key Endpoints:**
- `GET /api/audit/auditlogs/` - List audit logs (filterable, paginated)

**Audit Workflow:**
- System actions automatically logged
- HR signals send audit logs via HTTP POST to audit API
- Finance actions logged when payroll posted
- Filterable by module, action type, date range, user

---

## 🔄 Complete System Workflow

### Payroll Processing Flow

```
1. Employee Created
   ↓
2. Auto-create Draft Payroll (Signal)
   ↓
3. Generate Payroll (Command or Manual)
   ├─ Calculate: Basic Salary + Allowances + Overtime = Gross
   ├─ Calculate Deductions: PAYE, NSSF, SHA
   └─ Calculate: Gross - Deductions = Net
   ↓
4. Status: CALCULATED
   ↓
5. HR/Admin Approves
   ├─ Status: APPROVED
   └─ approved_by: username
   ↓
6. Auto-Post to Finance (Signal - if Finance Admin)
   ├─ Create JournalEntry
   ├─ Create JournalLines (Debit/Credit)
   ├─ Link PayrollRun to JournalEntry
   └─ Status: POSTED
   ↓
7. Finance Module Records Transaction
   └─ Accounts updated (balances)
```

### Employee Lifecycle

```
1. Hire Employee
   ├─ Create Employee record
   ├─ Assign Department
   ├─ Set Basic Salary
   └─ Status: ACTIVE
   ↓
2. Auto-create Payroll (Signal)
   └─ Draft payroll for current month
   ↓
3. Employment Changes (via EmploymentHistory)
   ├─ Promotion: Update job_title, salary
   ├─ Transfer: Update department
   ├─ Salary Increase: Update basic_salary
   └─ Termination: Status = TERMINATED
```

---

## 🔌 API Integration

### Frontend API Service (`Frontend/utils/api.ts`)

**Base URL**: `http://127.0.0.1:8000/api` (configurable via env)

**Authentication**: 
- Token retrieved from localStorage
- Added to `Authorization: Bearer <token>` header

**Error Handling**:
- Throws errors for non-200 responses
- Returns JSON or empty object

### Frontend Auth Context (`Frontend/context/auth-context.tsx`)

**Features:**
- Token management (save/retrieve/clear)
- User state management
- Role checking (`isHRAdmin`, `isFinanceAdmin`, `isSuperAdmin`)
- Auto-restore session on page load
- Login/logout functions

---

## 🛠️ Key Features

### 1. Role-Based Access Control (RBAC)
- Decorators: `@role_required(['HR', 'ADMIN'])`
- Frontend: Role-based sidebar navigation
- API: Permission classes check user roles

### 2. Automatic Workflows
- **Signal-driven**: Employee creation → Payroll creation
- **Signal-driven**: Payroll approval → Finance posting
- **Command-driven**: Bulk payroll generation

### 3. Audit Trail
- All critical actions logged
- Filterable audit logs
- User attribution for all changes

### 4. Data Integrity
- Soft deletes (Employee termination)
- Validation (end_date > hire_date)
- Unique constraints (staff_number, email, national_id)
- Foreign key relationships

### 5. Financial Integration
- HR → Finance seamless integration
- Double-entry bookkeeping
- Account balance tracking

---

## 📊 Database Schema Relationships

```
User (Django)
  └─ UserProfile (OneToOne)
      └─ role, department, phone

Department
  ├─ Employee (ManyToOne)
  └─ Employee.manager (OneToOne, optional)

Employee
  ├─ EmploymentHistory (OneToMany)
  ├─ PayrollRun (OneToMany)
  └─ Department (ManyToOne)

PayrollRun
  ├─ Employee (ManyToOne)
  ├─ JournalEntry (OneToOne, optional)
  └─ PayrollDeduction (OneToMany)

JournalEntry
  └─ JournalLine (OneToMany)
      └─ Account (ManyToOne)

Account
  └─ Account.parent (Self-referential, optional)
```

---

## 🚀 Development Setup

### Backend
```bash
cd Backend
pip install -r requirements.txt  # (if exists)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Environment Variables
- Backend: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- Frontend: `NEXT_PUBLIC_BASE_API`

---

## 📝 Management Commands

### Generate Payroll
```bash
python manage.py generate_payroll --period monthly --date 2025-01-31
python manage.py generate_payroll --period bi-weekly
python manage.py generate_payroll --period weekly --reprocess
```

**Options:**
- `--period`: monthly, bi-weekly, weekly
- `--date`: Reference date (default: today)
- `--reprocess`: Overwrite existing payrolls

---

## 🔍 Key Files Reference

### Backend
- `Backend/LEXY_API/settings.py` - Main configuration
- `Backend/LEXY_API/urls.py` - Root URL routing
- `Backend/hr/models.py` - HR data models
- `Backend/hr/views.py` - HR API endpoints
- `Backend/hr/signals.py` - Auto-workflows
- `Backend/hr/management/commands/generate_payroll.py` - Payroll generation
- `Backend/Finance/models.py` - Finance data models
- `Backend/users/models.py` - User profile model

### Frontend
- `Frontend/app/dashboard/layout.tsx` - Dashboard layout with auth
- `Frontend/context/auth-context.tsx` - Authentication state
- `Frontend/utils/api.ts` - API service layer
- `Frontend/components/layout/sidebar.tsx` - Role-based navigation
- `Frontend/components/payroll/payroll-approval.tsx` - Payroll approval UI

---

## 🎯 Business Logic Highlights

1. **Payroll Calculation**: 
   - Gross = Basic + Allowances + Overtime
   - Deductions = PAYE (10% of basic) + NSSF (200) + SHA (500) + Others
   - Net = Gross - Deductions

2. **Finance Posting**:
   - Creates balanced journal entry (Debits = Credits)
   - Links payroll to journal entry for traceability
   - Updates account balances

3. **Security**:
   - Only Finance Admins can post payroll to finance
   - Role-based API access control
   - JWT token authentication

4. **Data Validation**:
   - Employee end_date must be after hire_date
   - Payroll period_end must be after period_start
   - Only active employees can have payroll

---

## 📈 Future Enhancements (Observations)

- Product model exists in API app but not fully integrated
- Audit logging could be enhanced with more action types
- Payroll calculation uses dummy formulas (should be configurable)
- Account balance calculation may need periodic reconciliation
- Frontend could add more reporting/analytics dashboards

---

## 🔗 API Endpoint Summary

### Authentication
- `POST /api/auth/login/` - Login (JWT)
- `POST /api/auth/refresh/` - Refresh token
- `POST /api/auth/verify/` - Verify token

### Users
- `POST /api/users/register/` - Register
- `GET /api/users/me/` - Current user
- `GET /api/users/` - List users

### HR
- `GET/POST /api/hr/departments/` - Departments
- `GET/POST /api/hr/employees/` - Employees
- `GET/POST /api/hr/payroll_runs/` - Payroll runs
- `POST /api/hr/payroll_runs/{id}/approve/` - Approve
- `POST /api/hr/payroll_runs/{id}/post_to_finance/` - Post to finance

### Finance
- `GET/POST /api/finance/accounts/` - Accounts
- `GET/POST /api/finance/journals/` - Journal entries
- `GET /api/finance/summary/` - Summary

### Audit
- `GET /api/audit/auditlogs/` - Audit logs (filterable)

---

**Last Updated**: 2025-01-27
**System Version**: LEXIE ERP v1.0

