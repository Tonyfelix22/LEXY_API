# ERP System Frontend

A comprehensive React/Next.js frontend for a Django REST Framework ERP system with HR, Finance, and Audit modules.

## Features

- **Authentication & Authorization**: Token-based authentication with role-based access control
- **HR Module**: Manage employees and departments with full CRUD operations
- **Finance Module**: Manage accounts, journal entries, and payroll runs
- **Audit Module**: Track all system changes with filtering and pagination
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Error Handling**: Comprehensive error boundaries and toast notifications
- **Loading States**: Smooth loading indicators for all async operations

## Project Structure

\`\`\`
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── globals.css             # Global styles and design tokens
│   ├── page.tsx                # Login page
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout with sidebar
│       ├── hr/
│       │   ├── page.tsx        # HR dashboard
│       │   ├── employees/      # Employee management
│       │   └── departments/    # Department management
│       ├── finance/
│       │   ├── page.tsx        # Finance dashboard
│       │   ├── accounts/       # Account management
│       │   ├── journal-entries/# Journal entry management
│       │   └── payroll/        # Payroll view
│       └── audit/
│           └── page.tsx        # Audit logs with filtering
├── components/
│   ├── auth/                   # Authentication components
│   ├── layout/                 # Layout components (sidebar, navbar)
│   ├── hr/                     # HR module components
│   ├── finance/                # Finance module components
│   ├── audit/                  # Audit module components
│   └── common/                 # Shared UI components
├── context/
│   └── auth-context.tsx        # Authentication context
└── services/
    └── api.ts                  # API service layer

\`\`\`

## Setup

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment variables** in `.env.local`:
   \`\`\`
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   \`\`\`

3. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open in browser**:
   Navigate to `http://localhost:3000`

## Authentication

- Login with your Django user credentials
- Token is stored in localStorage and automatically included in API requests
- Users are automatically redirected to their appropriate dashboard based on group membership

## API Integration

The frontend connects to a Django REST Framework backend with the following endpoints:

- `/auth/login/` - User authentication
- `/auth/user/` - Get current user info
- `/hr/employees/` - Employee CRUD operations
- `/hr/departments/` - Department CRUD operations
- `/finance/accounts/` - Account CRUD operations
- `/finance/journal_entries/` - Journal entry CRUD operations
- `/payroll/payroll_runs/` - Payroll run retrieval
- `/audit/logs/` - Audit log retrieval with filtering

## Role-Based Access Control

- **HR Admin**: Can access HR module (employees, departments)
- **Finance Admin**: Can access Finance module (accounts, journal entries, payroll)
- **Both**: Can access Audit logs

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hot Toast**: Toast notifications
- **Fetch API**: HTTP client for API requests

## Development

- Components are organized by module for easy maintenance
- Shared UI components in `components/common/` for reusability
- API service layer abstracts all HTTP requests
- Authentication context manages user state globally
- Error boundaries catch and display errors gracefully

## Deployment

Deploy to Vercel with a single click:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## License

MIT
