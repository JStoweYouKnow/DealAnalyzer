# Real Estate Deal Analyzer

## Overview

This is a full-stack web application designed to help real estate investors quickly evaluate investment opportunities from email listing alerts. The application automatically parses property details from real estate emails, calculates key financial metrics, and evaluates properties against specific investment criteria. It features both a modern React web interface and a Python command-line tool for batch processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript for both server and shared code
- **API Design**: RESTful endpoints with structured JSON responses
- **Python Integration**: Child process execution for real estate analysis logic
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot module replacement via Vite middleware

### Data Architecture
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Data Validation**: Zod schemas shared between frontend and backend
- **Storage Strategy**: In-memory storage for development with PostgreSQL for production

### Real Estate Analysis Engine
- **Email Parsing**: Regular expression-based extraction of property details
- **Financial Calculations**: Comprehensive investment metrics including cash flow, COC return, cap rate
- **Criteria Evaluation**: Configurable investment criteria matching (1% rule, location, price limits)
- **Report Generation**: Both JSON API responses and formatted text reports

### Component Architecture
- **Shared Types**: Common TypeScript interfaces between client and server
- **Modular Components**: Reusable UI components for property display and analysis results
- **Form Validation**: Client-side validation with server-side verification
- **Error Handling**: Comprehensive error boundaries and user feedback

### Development Workflow
- **Monorepo Structure**: Client, server, and shared code in single repository
- **Path Aliases**: TypeScript path mapping for clean imports
- **Development Server**: Integrated Vite dev server with Express backend
- **Build Process**: Separate builds for frontend (Vite) and backend (esbuild)

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database for production deployments
- **Neon Database**: Serverless PostgreSQL provider for cloud hosting
- **Connection Pooling**: Built-in connection management via Drizzle ORM

### UI Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icon set for real estate-specific icons

### Development Tools
- **Replit Integration**: Custom plugins for Replit development environment
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Fast JavaScript bundler for server-side builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Python Runtime
- **Standard Library**: Email parsing and financial calculations using built-in modules
- **File System**: Local file operations for criteria management and report generation
- **Process Communication**: JSON-based data exchange between Node.js and Python processes