# Overview

This is a DXP (Digital Experience Platform) Prompt Library application built for Sitecore 10.4 development with Helix architecture. The application serves as a comprehensive collection of development prompts, templates, and code snippets organized by architectural layers (Foundation, Feature, Project) and component types. It provides developers with quick access to standardized prompts for generating Sitecore components, services, and implementations following best practices.

The application features a full-stack architecture with a React frontend and Express backend, designed to help development teams maintain consistency and accelerate development workflows through reusable prompt templates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component development
- **Routing**: Wouter for lightweight client-side routing without the overhead of React Router
- **State Management**: TanStack Query (React Query) for server state management, caching, and data fetching
- **Styling**: Tailwind CSS with custom design system and Radix UI components for consistent, accessible UI
- **Component Library**: Shadcn/ui components built on Radix UI primitives for professional interface elements
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the full stack
- **API Design**: RESTful endpoints for prompt management (CRUD operations, search, categorization)
- **Storage**: In-memory storage implementation with interface for future database integration
- **Error Handling**: Centralized error handling middleware with structured error responses

## Data Storage Solutions
- **Primary Database**: PostgreSQL configured via Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database for serverless PostgreSQL hosting
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **ORM**: Drizzle ORM with Zod integration for runtime type validation
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple

## Component Organization
- **Architectural Layers**: Organized by Sitecore Helix principles (Foundation, Feature, Project layers)
- **Component Categories**: UI components, testing templates, styling guides, and SDLC templates
- **Prompt Structure**: Structured prompt data with metadata, tags, context, and SDLC stage information
- **Search & Discovery**: Full-text search capabilities with category-based filtering and tag-based organization

## Development Workflow
- **Type Safety**: Full TypeScript implementation with strict type checking across frontend and backend
- **Code Quality**: ESLint and TypeScript compiler checks for maintaining code standards
- **Development Server**: Hot reload development environment with Vite's fast refresh
- **Build Process**: Optimized production builds with code splitting and asset optimization

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for frontend development
- **Backend Framework**: Express.js with TypeScript support for API development
- **Database**: PostgreSQL with Neon Database provider for cloud hosting
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations

## UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling Framework**: Tailwind CSS for utility-first styling approach
- **Design System**: Shadcn/ui component library for consistent interface design
- **Icons**: Lucide React for scalable vector icons

## Development Tools
- **Build Tool**: Vite for development server and production builds
- **Type System**: TypeScript with strict configuration for type safety
- **Schema Validation**: Zod for runtime type validation and schema definition
- **Session Management**: Express sessions with PostgreSQL store

## VS Code Extension Integration
- **Extension Files**: Includes VS Code extension files for enhanced developer experience
- **Prompt Management**: Integration with VS Code for prompt palette and quick access functionality
- **Search Integration**: Fuse.js for fuzzy search capabilities within the extension

## Deployment and Hosting
- **Platform**: Designed for deployment on Replit with production-ready configuration
- **Environment**: Supports both development and production environments
- **Database**: Cloud PostgreSQL via Neon Database for scalable data storage
- **Asset Handling**: Optimized asset serving for production deployments