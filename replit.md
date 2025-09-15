# Overview

This is an AI-Based Timetable Generation System designed for NEP 2020 compliance, targeting multidisciplinary education structures in higher education institutions. The system consists of a full-stack web application with an integrated AI optimization engine that automatically generates conflict-free, optimized academic timetables for multiple programs (B.Ed., M.Ed., FYUP, ITEP).

The application provides comprehensive management of courses, faculty, rooms, and students while offering real-time conflict detection and resolution. It features role-based dashboards for administrators, faculty, and students, with export capabilities for generated timetables in PDF and Excel formats.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Session Management**: Express-session for authentication state
- **Password Security**: Bcrypt for password hashing
- **API Design**: RESTful APIs with role-based access control
- **File Structure**: Clean separation between routes, storage, and business logic

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Modeling**: Comprehensive schema covering users, programs, courses, faculty, rooms, students, enrollments, timetables, and conflicts

## AI/Optimization Engine
- **Language**: Python with FastAPI for high-performance API endpoints
- **Optimization Algorithms**: 
  - Constraint Satisfaction Problem (CSP) using Google OR-Tools
  - Genetic Algorithm for multi-objective optimization
  - Integer Linear Programming (ILP) using PuLP
- **Architecture**: Microservice design with RESTful API communication
- **Objectives**: Minimize conflicts, balance workload, maximize room utilization, minimize schedule gaps

## Authentication & Authorization
- **Method**: Session-based authentication with role-based access control
- **Roles**: Admin, Faculty, and Student with appropriate permission levels
- **Security**: Password hashing, session management, and route protection

## Integration Architecture
- **Main App ↔ AI Engine**: HTTP REST API communication between Node.js backend and Python optimization service
- **Data Flow**: Structured data conversion between application format and AI engine format
- **Async Processing**: Support for both synchronous and asynchronous optimization requests

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with migration support

## UI & Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography

## Optimization & AI
- **Google OR-Tools**: Constraint programming and optimization solver
- **PuLP**: Linear programming library for mathematical optimization
- **NumPy/Pandas**: Scientific computing and data manipulation
- **SciPy**: Advanced scientific computing algorithms

## Development & Build Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Static type checking for JavaScript
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer support

## Authentication & Security
- **bcrypt**: Password hashing library
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store

## Communication & API
- **TanStack Query**: Data fetching and caching library
- **React Hook Form**: Performant form library with validation
- **Zod**: TypeScript-first schema validation
- **FastAPI**: Modern Python web framework for AI service APIs