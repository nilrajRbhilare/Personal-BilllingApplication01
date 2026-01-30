# Invoicely - Invoice Management System

## Overview

Invoicely is a full-stack invoice management application built with React, Express, and PostgreSQL. It provides functionality for creating and managing invoices, customers, and company settings with a modern, professional UI. The system includes a dashboard with analytics, CRUD operations for invoices and customers, printable invoice generation, and configurable company settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Charts**: Recharts for dashboard analytics
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express 5 with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **API Design**: REST endpoints defined in shared routes file with type-safe contracts

### Data Layer
- **Primary Storage**: PostgreSQL database (connection via DATABASE_URL environment variable)
- **Fallback Storage**: File-based JSON storage in `server/data/` directory for development
- **Schema Location**: `shared/schema.ts` defines all database tables using Drizzle
- **Migrations**: Managed via drizzle-kit with `npm run db:push`

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks (data fetching)
│   ├── pages/           # Route page components
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API endpoint handlers
│   ├── storage.ts       # Data access layer
│   └── db.ts            # Database connection
├── shared/              # Shared types and contracts
│   ├── schema.ts        # Drizzle table definitions
│   └── routes.ts        # API route definitions with Zod schemas
```

### Key Design Patterns
- **Shared Schema**: Database schema and Zod validation schemas are defined once in `shared/` and used by both frontend and backend
- **Type-Safe API**: Route definitions include input/output schemas, enabling end-to-end type safety
- **Custom Hooks**: Each data entity (customers, invoices, settings) has dedicated React Query hooks
- **Component Library**: shadcn/ui components are copied into `client/src/components/ui/` for customization

## External Dependencies

### Database
- **PostgreSQL**: Primary database, configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management
- **drizzle-kit**: Database migrations and schema synchronization

### UI Framework
- **Radix UI**: Headless component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Data & Forms
- **TanStack React Query**: Async state management and caching
- **React Hook Form**: Form state management
- **Zod**: Runtime schema validation
- **date-fns**: Date formatting and manipulation

### Printing
- **react-to-print**: PDF/print generation for invoices

### Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development