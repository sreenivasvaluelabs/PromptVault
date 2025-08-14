# Technical Specification Document
## Developer Experience Platform (DXP) - Prompt Library

### Version: 1.0.0
### Date: August 14, 2025
### Authors: Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technical Stack](#3-technical-stack)
4. [Database Design](#4-database-design)
5. [API Specification](#5-api-specification)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Security & Authentication](#7-security--authentication)
8. [Performance Requirements](#8-performance-requirements)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Data Models](#10-data-models)
11. [Integration Points](#11-integration-points)
12. [Monitoring & Logging](#12-monitoring--logging)

---

## 1. Executive Summary

### 1.1 Project Overview
The Developer Experience Platform (DXP) is a comprehensive web-based application designed to provide development teams with quick access to standardized code templates, SDLC workflows, and development best practices. The platform serves as a centralized repository of 75 professionally curated templates organized across 7 categories.

### 1.2 Business Objectives
- **Accelerate Development**: Reduce code writing time by 40-60% through reusable templates
- **Standardization**: Ensure consistent code quality and architectural patterns
- **Knowledge Sharing**: Centralize institutional knowledge and best practices
- **Onboarding**: Provide new developers with immediate access to proven patterns
- **SDLC Optimization**: Streamline software development lifecycle processes

### 1.3 Key Features
- **Template Library**: 39 component templates + 36 SDLC workflow templates
- **Search & Discovery**: Full-text search with fuzzy matching capabilities
- **Category-based Organization**: 7 main categories for easy navigation
- **Copy-to-Clipboard**: One-click template usage
- **Responsive Design**: Cross-device compatibility
- **Real-time Updates**: Live template synchronization

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (TypeScript)                              │
│  ├── Component Library (Shadcn/UI + Radix)               │
│  ├── State Management (TanStack Query)                    │
│  ├── Routing (Wouter)                                     │
│  └── Styling (Tailwind CSS)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Express.js Backend (TypeScript)                          │
│  ├── REST API Endpoints                                   │
│  ├── Request Validation (Zod)                             │
│  ├── Error Handling Middleware                            │
│  └── Session Management                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Database Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                       │
│  ├── Drizzle ORM                                          │
│  ├── Schema Management                                     │
│  ├── Connection Pooling                                    │
│  └── Session Storage                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
Frontend Components Hierarchy:
├── App.tsx (Root Application)
├── pages/
│   ├── prompt-library.tsx (Main Interface)
│   └── not-found.tsx (404 Handler)
├── components/
│   ├── prompt-sidebar.tsx (Navigation)
│   ├── prompt-display.tsx (Content Viewer)
│   ├── prompt-search.tsx (Search Interface)
│   └── ui/ (Reusable UI Components)
├── hooks/
│   ├── use-prompts.ts (Data Fetching)
│   ├── use-toast.ts (Notifications)
│   └── use-mobile.tsx (Responsive Utilities)
└── lib/
    ├── queryClient.ts (API Client)
    ├── utils.ts (Utilities)
    └── prompt-data.ts (Data Models)
```

---

## 3. Technical Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **React** | 18.x | UI Framework | Modern, component-based, excellent ecosystem |
| **TypeScript** | 5.x | Type Safety | Compile-time error detection, better IDE support |
| **Vite** | 5.x | Build Tool | Fast development server, optimized builds |
| **Wouter** | 2.x | Routing | Lightweight alternative to React Router |
| **TanStack Query** | 5.x | State Management | Server state caching, background updates |
| **Tailwind CSS** | 3.x | Styling | Utility-first, rapid development |
| **Shadcn/UI** | Latest | Component Library | Accessible, customizable components |
| **Radix UI** | Latest | Primitives | Unstyled, accessible components |
| **Lucide React** | Latest | Icons | Consistent icon library |

### 3.2 Backend Technologies

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Node.js** | 20.x | Runtime | JavaScript everywhere, excellent performance |
| **Express.js** | 4.x | Web Framework | Minimal, flexible, proven in production |
| **TypeScript** | 5.x | Type Safety | Shared types between frontend/backend |
| **Drizzle ORM** | Latest | Database ORM | Type-safe, lightweight, excellent TypeScript support |
| **PostgreSQL** | 15.x | Database | ACID compliance, JSON support, scalability |
| **Zod** | 3.x | Validation | Runtime type validation, schema generation |
| **Express Session** | Latest | Session Management | Secure session handling |

### 3.3 Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and standards enforcement |
| **Prettier** | Code formatting |
| **Drizzle Kit** | Database migrations and introspection |
| **TSX** | TypeScript execution for development |

---

## 4. Database Design

### 4.1 Schema Overview

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompts Table
CREATE TABLE prompts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    context VARCHAR(500),
    development_stage VARCHAR(100),
    complexity_level VARCHAR(50),
    estimated_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table (for express-session)
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Indexes for Performance
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_search ON prompts USING GIN(to_tsvector('english', title || ' ' || description || ' ' || content));
CREATE INDEX idx_sessions_expire ON sessions(expire);
```

### 4.2 Data Relationships

```
Users (1) ──────── (*) User_Sessions
                        │
                        │
Prompts (*) ────────── (1) Categories [Enum]
    │
    └── Tags (Array Field)
```

### 4.3 Data Constraints

- **Prompts.id**: Unique identifier following naming convention
- **Prompts.category**: Enum values (foundation, feature, project, components, testing, styling, sdlc_templates)
- **Prompts.tags**: Array of strings for flexible tagging
- **Users.username**: Unique, alphanumeric with underscores
- **Users.email**: Valid email format validation

---

## 5. API Specification

### 5.1 REST Endpoints

#### 5.1.1 Prompts API

```typescript
// GET /api/prompts
// Retrieve all prompts
Response: Prompt[]

// GET /api/prompts/:id
// Retrieve specific prompt by ID
Response: Prompt | 404

// GET /api/prompts/category/:category
// Retrieve prompts by category
Response: Prompt[]

// GET /api/prompts/search/:query
// Search prompts by query string
Response: Prompt[]

// POST /api/prompts
// Create new prompt (Admin only)
Request: InsertPrompt
Response: Prompt | 400 | 401

// PATCH /api/prompts/:id
// Update existing prompt (Admin only)
Request: Partial<InsertPrompt>
Response: Prompt | 400 | 401 | 404

// DELETE /api/prompts/:id
// Delete prompt (Admin only)
Response: 204 | 401 | 404
```

#### 5.1.2 Authentication API

```typescript
// POST /api/auth/login
// User authentication
Request: { username: string, password: string }
Response: { user: User, token: string } | 401

// POST /api/auth/logout
// User logout
Response: 204

// GET /api/auth/me
// Get current user
Response: User | 401
```

### 5.2 Error Response Format

```typescript
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}
```

### 5.3 Request/Response Examples

#### Get All Prompts
```http
GET /api/prompts HTTP/1.1
Host: localhost:5000
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "foundation-service_interface-development",
    "title": "Service Interface",
    "description": "Foundation service interface with dependency injection and logging",
    "content": "Create a foundation service interface...",
    "category": "foundation",
    "tags": ["interface", "service", "foundation"],
    "context": "Foundation layer development",
    "developmentStage": "implementation",
    "complexityLevel": "intermediate",
    "estimatedTime": 15
  }
]
```

#### Search Prompts
```http
GET /api/prompts/search/authentication HTTP/1.1
Host: localhost:5000
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "feature-authentication_service-development",
    "title": "Authentication Service",
    "description": "Secure authentication service with JWT tokens",
    // ... rest of prompt data
  }
]
```

---

## 6. Frontend Architecture

### 6.1 Component Design Patterns

#### 6.1.1 Container/Presentational Pattern
```typescript
// Container Component (Smart)
export default function PromptLibrary() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const { data: prompts, isLoading, error } = usePrompts();
  
  // Business logic and state management
  return (
    <PromptDisplay 
      prompt={selectedPrompt}
      onSelectPrompt={setSelectedPrompt}
    />
  );
}

// Presentational Component (Dumb)
interface PromptDisplayProps {
  prompt: PromptItem | null;
  onSelectPrompt: (prompt: PromptItem) => void;
}

export function PromptDisplay({ prompt, onSelectPrompt }: PromptDisplayProps) {
  // Pure rendering logic
  return <div>{/* UI markup */}</div>;
}
```

#### 6.1.2 Custom Hooks Pattern
```typescript
// Data fetching hook
export function usePrompts() {
  return useQuery({
    queryKey: ['/api/prompts'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Search hook with debouncing
export function usePromptSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery({
    queryKey: ['/api/prompts/search', debouncedQuery],
    enabled: debouncedQuery.length > 2,
  });
}
```

### 6.2 State Management Strategy

#### 6.2.1 Server State (TanStack Query)
- **Prompts Data**: Cached with 5-minute stale time
- **Search Results**: Cached per query with 2-minute stale time
- **User Data**: Cached until logout

#### 6.2.2 Local State (React useState)
- **UI State**: Sidebar visibility, modal states
- **Form State**: React Hook Form for form management
- **Navigation State**: Current selected prompt

#### 6.2.3 Global State (Context API)
- **Theme Context**: Dark/light mode preference
- **User Context**: Authentication state
- **Toast Context**: Notification system

### 6.3 Performance Optimizations

#### 6.3.1 Code Splitting
```typescript
// Lazy loading for routes
const PromptLibrary = lazy(() => import('@/pages/prompt-library'));
const AdminPanel = lazy(() => import('@/pages/admin-panel'));

// Component-level splitting
const HeavyComponent = lazy(() => import('@/components/heavy-component'));
```

#### 6.3.2 Memoization
```typescript
// Expensive calculations
const filteredPrompts = useMemo(() => {
  return prompts.filter(prompt => 
    prompt.category === selectedCategory
  );
}, [prompts, selectedCategory]);

// Callback memoization
const handleSelectPrompt = useCallback((prompt: PromptItem) => {
  setSelectedPrompt(prompt);
  analytics.track('prompt_selected', { promptId: prompt.id });
}, []);
```

#### 6.3.3 Virtual Scrolling
```typescript
// For large lists (future enhancement)
import { FixedSizeList as List } from 'react-window';

const VirtualizedPromptList = ({ prompts }: { prompts: PromptItem[] }) => (
  <List
    height={400}
    itemCount={prompts.length}
    itemSize={80}
    itemData={prompts}
  >
    {PromptListItem}
  </List>
);
```

---

## 7. Security & Authentication

### 7.1 Authentication Strategy

#### 7.1.1 Session-based Authentication
```typescript
// Session configuration
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    pool: db.pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

#### 7.1.2 Password Security
```typescript
import bcrypt from 'bcrypt';

// Password hashing
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Password verification
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### 7.2 Authorization Levels

| Role | Permissions |
|------|-------------|
| **Guest** | Read-only access to public prompts |
| **User** | Full read access, personal favorites |
| **Admin** | Full CRUD operations, user management |
| **Super Admin** | System configuration, analytics |

### 7.3 Input Validation & Sanitization

#### 7.3.1 Request Validation
```typescript
import { z } from 'zod';

const CreatePromptSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  content: z.string().min(1),
  category: z.enum(['foundation', 'feature', 'project', 'components', 'testing', 'styling', 'sdlc_templates']),
  tags: z.array(z.string()).default([]),
  context: z.string().max(500).optional(),
  developmentStage: z.string().optional(),
  complexityLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedTime: z.number().int().positive().optional()
});
```

#### 7.3.2 XSS Prevention
```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
const sanitizeContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['code', 'pre', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: ['class']
  });
};
```

### 7.4 CORS Configuration

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 8. Performance Requirements

### 8.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| **Page Load** | < 2 seconds | < 5 seconds |
| **API Response** | < 500ms | < 2 seconds |
| **Search Results** | < 300ms | < 1 second |
| **Template Copy** | < 100ms | < 300ms |

### 8.2 Scalability Requirements

| Metric | Current | Target | Maximum |
|--------|---------|--------|---------|
| **Concurrent Users** | 10 | 100 | 1,000 |
| **Templates** | 75 | 500 | 2,000 |
| **Daily Requests** | 1K | 10K | 100K |
| **Database Size** | 10MB | 100MB | 1GB |

### 8.3 Caching Strategy

#### 8.3.1 Frontend Caching
```typescript
// TanStack Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});
```

#### 8.3.2 HTTP Caching
```typescript
// Express cache headers
app.get('/api/prompts', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300', // 5 minutes
    'ETag': generateETag(prompts),
    'Last-Modified': new Date().toUTCString()
  });
  res.json(prompts);
});
```

#### 8.3.3 Database Query Optimization
```sql
-- Indexes for common queries
CREATE INDEX CONCURRENTLY idx_prompts_category_title ON prompts(category, title);
CREATE INDEX CONCURRENTLY idx_prompts_search_gin ON prompts USING gin(to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || content));

-- Query optimization example
EXPLAIN ANALYZE 
SELECT * FROM prompts 
WHERE category = $1 
  AND tags && $2 
ORDER BY title 
LIMIT 20;
```

---

## 9. Deployment Architecture

### 9.1 Production Environment

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dxp_prompts
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 9.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          docker build -t dxp-app .
          docker push ${{ secrets.REGISTRY_URL }}/dxp-app:latest
          # Deployment commands
```

### 9.3 Environment Configuration

```typescript
// config/environment.ts
export const config = {
  development: {
    port: 5000,
    database: {
      url: 'postgresql://localhost:5432/dxp_dev',
      ssl: false
    },
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173']
    }
  },
  production: {
    port: process.env.PORT || 5000,
    database: {
      url: process.env.DATABASE_URL,
      ssl: true
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || []
    }
  }
};
```

---

## 10. Data Models

### 10.1 TypeScript Interfaces

```typescript
// Core Data Models
export interface Prompt {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: PromptCategory;
  tags: string[];
  context?: string;
  developmentStage?: string;
  complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // minutes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: Date;
  updatedAt: Date;
}

export type PromptCategory = 
  | 'foundation'
  | 'feature'
  | 'project'
  | 'components'
  | 'testing'
  | 'styling'
  | 'sdlc_templates';

// API Request/Response Types
export interface CreatePromptRequest {
  title: string;
  description?: string;
  content: string;
  category: PromptCategory;
  tags?: string[];
  context?: string;
  developmentStage?: string;
  complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number;
}

export interface SearchPromptsResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}
```

### 10.2 Database Models (Drizzle)

```typescript
// schema.ts
import { pgTable, uuid, varchar, text, timestamp, integer, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const prompts = pgTable('prompts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  content: text('content').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  tags: json('tags').$type<string[]>().default([]),
  context: varchar('context', { length: 500 }),
  developmentStage: varchar('development_stage', { length: 100 }),
  complexityLevel: varchar('complexity_level', { length: 50 }),
  estimatedTime: integer('estimated_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  sid: varchar('sid').primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull()
});
```

---

## 11. Integration Points

### 11.1 External Services

#### 11.1.1 Authentication Providers (Future)
```typescript
// OAuth Integration
interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

const providers: Record<string, OAuthProvider> = {
  github: {
    name: 'GitHub',
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: `${process.env.BASE_URL}/auth/github/callback`,
    scope: ['user:email']
  },
  google: {
    name: 'Google',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.BASE_URL}/auth/google/callback`,
    scope: ['profile', 'email']
  }
};
```

#### 11.1.2 Analytics Integration
```typescript
// Analytics Service
interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties: Record<string, any>;
  timestamp: Date;
}

class AnalyticsService {
  async track(event: AnalyticsEvent): Promise<void> {
    // Send to analytics provider (e.g., Google Analytics, Mixpanel)
    await fetch('https://api.analytics-provider.com/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  }
}
```

### 11.2 API Integration Patterns

#### 11.2.1 Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
```

#### 11.2.2 Request Logging
```typescript
import morgan from 'morgan';

app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));
```

---

## 12. Monitoring & Logging

### 12.1 Application Monitoring

#### 12.1.1 Health Checks
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Database connectivity check
    await db.select().from(prompts).limit(1);
    
    // Memory usage check
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: memPercent
      },
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

#### 12.1.2 Performance Metrics
```typescript
// Response time middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Send metrics to monitoring service
    metrics.histogram('http_request_duration', duration, {
      method: req.method,
      route: req.path,
      status_code: res.statusCode
    });
  });
  
  next();
});
```

### 12.2 Error Tracking

#### 12.2.1 Error Handler
```typescript
interface ErrorDetails {
  message: string;
  stack?: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  userId?: string;
}

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorDetails: ErrorDetails = {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    statusCode: (error as any).statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    userId: req.user?.id
  };
  
  // Log error
  logger.error('Application Error', errorDetails);
  
  // Send to error tracking service
  errorTracker.captureException(error, {
    user: req.user,
    extra: errorDetails
  });
  
  res.status(errorDetails.statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: errorDetails.timestamp
  });
});
```

### 12.3 Logging Configuration

#### 12.3.1 Winston Logger Setup
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dxp-prompt-library' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
});

export { logger };
```

---

## Conclusion

This technical specification provides a comprehensive overview of the Developer Experience Platform architecture, implementation details, and operational requirements. The system is designed for scalability, maintainability, and excellent developer experience while serving as a robust template library for modern software development teams.

For implementation guidance and user documentation, refer to the accompanying User Manual and API Documentation.