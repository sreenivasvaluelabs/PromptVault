# Architecture Diagrams
## Developer Experience Platform (DXP)

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "CDN/Load Balancer"
        LB[Load Balancer/CDN]
    end
    
    subgraph "Application Layer"
        subgraph "Frontend (React)"
            UI[User Interface]
            Router[Wouter Router]
            State[TanStack Query]
            Components[Shadcn Components]
        end
        
        subgraph "Backend (Express.js)"
            API[REST API]
            Auth[Authentication]
            Middleware[Middleware Stack]
            Validation[Zod Validation]
        end
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        Redis[(Redis Cache)]
        Sessions[(Session Store)]
    end
    
    subgraph "External Services"
        Analytics[Analytics Service]
        Monitoring[Monitoring/Logging]
        GitHub[GitHub Integration]
    end
    
    Browser --> LB
    Mobile --> LB
    LB --> UI
    
    UI --> Router
    Router --> State
    State --> Components
    State --> API
    
    API --> Auth
    API --> Middleware
    Middleware --> Validation
    Validation --> PostgreSQL
    
    Auth --> Sessions
    Sessions --> PostgreSQL
    API --> Redis
    
    API --> Analytics
    API --> Monitoring
    Auth --> GitHub
    
    style Browser fill:#e1f5fe
    style Mobile fill:#e1f5fe
    style UI fill:#f3e5f5
    style API fill:#e8f5e8
    style PostgreSQL fill:#fff3e0
    style Redis fill:#ffebee
```

### Component Architecture

```mermaid
graph TD
    subgraph "React Application Structure"
        App[App.tsx - Root Component]
        
        subgraph "Pages"
            PL[prompt-library.tsx]
            NF[not-found.tsx]
        end
        
        subgraph "Components"
            PS[prompt-sidebar.tsx]
            PD[prompt-display.tsx]
            PSE[prompt-search.tsx]
            
            subgraph "UI Components"
                Button[Button]
                Card[Card]
                Dialog[Dialog]
                Form[Form]
                Input[Input]
                Toast[Toast]
            end
        end
        
        subgraph "Hooks"
            UP[use-prompts.ts]
            UT[use-toast.ts]
            UM[use-mobile.tsx]
        end
        
        subgraph "Libraries"
            QC[queryClient.ts]
            Utils[utils.ts]
            PData[prompt-data.ts]
        end
    end
    
    App --> PL
    App --> NF
    
    PL --> PS
    PL --> PD
    PL --> PSE
    
    PS --> UP
    PD --> UP
    PSE --> UP
    
    PL --> UT
    PD --> UT
    
    PL --> UM
    PS --> UM
    
    UP --> QC
    QC --> Utils
    Utils --> PData
    
    PS --> Button
    PS --> Card
    PD --> Button
    PD --> Card
    PD --> Toast
    PSE --> Input
    PSE --> Dialog
    
    style App fill:#bbdefb
    style PL fill:#c8e6c9
    style PS fill:#fff9c4
    style PD fill:#fff9c4
    style PSE fill:#fff9c4
    style UP fill:#f8bbd9
    style QC fill:#d1c4e9
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant TQ as TanStack Query
    participant API as Express API
    participant DB as PostgreSQL
    participant Cache as Redis
    
    U->>UI: Loads Application
    UI->>TQ: Initialize Query Client
    TQ->>API: GET /api/prompts
    API->>Cache: Check Cache
    
    alt Cache Hit
        Cache-->>API: Return Cached Data
    else Cache Miss
        API->>DB: Query Prompts
        DB-->>API: Return Prompts
        API->>Cache: Store in Cache
    end
    
    API-->>TQ: Return Prompts Data
    TQ-->>UI: Update State
    UI-->>U: Display Prompts
    
    U->>UI: Search Prompts
    UI->>TQ: Debounced Search
    TQ->>API: GET /api/prompts/search/:query
    API->>DB: Full-text Search
    DB-->>API: Search Results
    API-->>TQ: Return Results
    TQ-->>UI: Update Search State
    UI-->>U: Display Search Results
    
    U->>UI: Select Prompt
    UI->>UI: Update Local State
    UI-->>U: Display Prompt Content
    
    U->>UI: Copy to Clipboard
    UI->>UI: Copy Content
    UI->>UI: Show Toast Notification
    UI-->>U: Success Feedback
```

### Database Schema Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar role
        timestamp created_at
        timestamp updated_at
    }
    
    PROMPTS {
        varchar id PK
        varchar title
        text description
        text content
        varchar category
        text[] tags
        varchar context
        varchar development_stage
        varchar complexity_level
        integer estimated_time
        timestamp created_at
        timestamp updated_at
    }
    
    SESSIONS {
        varchar sid PK
        json sess
        timestamp expire
    }
    
    USER_FAVORITES {
        uuid id PK
        uuid user_id FK
        varchar prompt_id FK
        timestamp created_at
    }
    
    PROMPT_ANALYTICS {
        uuid id PK
        varchar prompt_id FK
        varchar event_type
        uuid user_id FK
        json metadata
        timestamp created_at
    }
    
    USERS ||--o{ USER_FAVORITES : "has"
    PROMPTS ||--o{ USER_FAVORITES : "favorited"
    USERS ||--o{ SESSIONS : "has"
    PROMPTS ||--o{ PROMPT_ANALYTICS : "tracks"
    USERS ||--o{ PROMPT_ANALYTICS : "generates"
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend
    participant API as Backend API
    participant Session as Session Store
    participant DB as Database
    
    U->>UI: Enter Credentials
    UI->>API: POST /api/auth/login
    API->>DB: Validate User
    
    alt Valid Credentials
        DB-->>API: User Data
        API->>Session: Create Session
        Session-->>API: Session ID
        API-->>UI: Success + Session Cookie
        UI-->>U: Redirect to Dashboard
    else Invalid Credentials
        DB-->>API: No Match
        API-->>UI: 401 Error
        UI-->>U: Show Error Message
    end
    
    Note over U,DB: Subsequent Requests
    
    U->>UI: Access Protected Resource
    UI->>API: GET /api/prompts (with session cookie)
    API->>Session: Validate Session
    
    alt Valid Session
        Session-->>API: User Data
        API->>DB: Fetch Data
        DB-->>API: Return Data
        API-->>UI: Protected Data
        UI-->>U: Display Content
    else Invalid Session
        Session-->>API: No Session
        API-->>UI: 401 Unauthorized
        UI-->>U: Redirect to Login
    end
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer"
            LB[NGINX Load Balancer]
            SSL[SSL Termination]
        end
        
        subgraph "Application Servers"
            App1[Node.js App Instance 1]
            App2[Node.js App Instance 2]
            App3[Node.js App Instance 3]
        end
        
        subgraph "Database Cluster"
            Primary[(PostgreSQL Primary)]
            Replica1[(PostgreSQL Replica 1)]
            Replica2[(PostgreSQL Replica 2)]
        end
        
        subgraph "Cache Layer"
            Redis1[(Redis Master)]
            Redis2[(Redis Replica)]
        end
        
        subgraph "Monitoring"
            Prometheus[Prometheus]
            Grafana[Grafana]
            AlertManager[Alert Manager]
        end
    end
    
    subgraph "External Services"
        CDN[CloudFlare CDN]
        Backup[Backup Service]
        Analytics[Analytics Service]
    end
    
    Users[Users] --> CDN
    CDN --> LB
    LB --> SSL
    SSL --> App1
    SSL --> App2
    SSL --> App3
    
    App1 --> Primary
    App2 --> Primary
    App3 --> Primary
    
    Primary --> Replica1
    Primary --> Replica2
    
    App1 --> Redis1
    App2 --> Redis1
    App3 --> Redis1
    
    Redis1 --> Redis2
    
    App1 --> Prometheus
    App2 --> Prometheus
    App3 --> Prometheus
    
    Prometheus --> Grafana
    Prometheus --> AlertManager
    
    Primary --> Backup
    App1 --> Analytics
    
    style Users fill:#e3f2fd
    style LB fill:#e8f5e8
    style App1 fill:#fff3e0
    style App2 fill:#fff3e0
    style App3 fill:#fff3e0
    style Primary fill:#f3e5f5
    style Redis1 fill:#ffebee
    style Prometheus fill:#e0f2f1
```

### API Request Flow

```mermaid
graph LR
    Client[Client Request] --> CORS[CORS Check]
    CORS --> RateLimit[Rate Limiting]
    RateLimit --> Auth[Authentication]
    Auth --> Validation[Request Validation]
    Validation --> Controller[Controller Logic]
    Controller --> Service[Service Layer]
    Service --> Database[(Database)]
    Database --> Cache[Cache Update]
    Cache --> Response[Format Response]
    Response --> Client
    
    subgraph "Middleware Stack"
        CORS
        RateLimit
        Auth
        Validation
    end
    
    subgraph "Application Logic"
        Controller
        Service
    end
    
    subgraph "Data Layer"
        Database
        Cache
    end
    
    style Client fill:#e1f5fe
    style Controller fill:#e8f5e8
    style Database fill:#fff3e0
    style Cache fill:#ffebee
```

### Search Architecture

```mermaid
graph TB
    User[User Search Input] --> Debounce[Debounce Input]
    Debounce --> SearchAPI[Search API Endpoint]
    
    SearchAPI --> QueryType{Query Type}
    
    QueryType -->|Full Text| FullText[PostgreSQL Full-Text Search]
    QueryType -->|Category| Category[Category Filter]
    QueryType -->|Tags| Tags[Tag Array Search]
    
    FullText --> Rankings[Relevance Ranking]
    Category --> Rankings
    Tags --> Rankings
    
    Rankings --> Pagination[Apply Pagination]
    Pagination --> Cache[Cache Results]
    Cache --> Response[Return Results]
    
    Response --> Frontend[Update UI]
    Frontend --> Results[Display Search Results]
    
    subgraph "Search Features"
        Fuzzy[Fuzzy Matching]
        Highlights[Search Highlights]
        Suggestions[Auto Suggestions]
    end
    
    FullText --> Fuzzy
    Rankings --> Highlights
    Debounce --> Suggestions
    
    style User fill:#e3f2fd
    style SearchAPI fill:#e8f5e8
    style FullText fill:#fff3e0
    style Rankings fill:#f3e5f5
    style Results fill:#e0f2f1
```

### Caching Strategy

```mermaid
graph TD
    Request[API Request] --> CacheCheck{Cache Hit?}
    
    CacheCheck -->|Yes| ReturnCached[Return Cached Data]
    CacheCheck -->|No| Database[(Query Database)]
    
    Database --> StoreCache[Store in Cache]
    StoreCache --> ReturnData[Return Fresh Data]
    
    subgraph "Cache Layers"
        L1[Browser Cache<br/>5 minutes]
        L2[TanStack Query<br/>10 minutes]
        L3[Redis Cache<br/>1 hour]
        L4[Database Query<br/>Real-time]
    end
    
    subgraph "Cache Invalidation"
        Update[Data Update] --> InvalidateAll[Invalidate All Layers]
        TTL[Time-based TTL] --> Refresh[Refresh Cache]
    end
    
    Request --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    
    Update --> L1
    Update --> L2
    Update --> L3
    
    style Request fill:#e3f2fd
    style Database fill:#fff3e0
    style L1 fill:#e8f5e8
    style L2 fill:#f3e5f5
    style L3 fill:#ffebee
```

### Error Handling Flow

```mermaid
graph TD
    Error[Application Error] --> Type{Error Type}
    
    Type -->|Validation| ValidationError[400 Bad Request]
    Type -->|Authentication| AuthError[401 Unauthorized]
    Type -->|Authorization| AuthzError[403 Forbidden]
    Type -->|Not Found| NotFoundError[404 Not Found]
    Type -->|Server| ServerError[500 Internal Server Error]
    
    ValidationError --> Log[Log Error Details]
    AuthError --> Log
    AuthzError --> Log
    NotFoundError --> Log
    ServerError --> Log
    
    Log --> Notify{Critical Error?}
    
    Notify -->|Yes| Alert[Send Alert]
    Notify -->|No| Monitor[Monitor Only]
    
    Alert --> PagerDuty[PagerDuty Notification]
    Alert --> Slack[Slack Channel]
    Alert --> Email[Email Team]
    
    Log --> Response[Format Error Response]
    Response --> Client[Return to Client]
    
    subgraph "Error Tracking"
        Sentry[Sentry Error Tracking]
        Metrics[Error Metrics]
        Dashboard[Error Dashboard]
    end
    
    Log --> Sentry
    Log --> Metrics
    Metrics --> Dashboard
    
    style Error fill:#ffcdd2
    style ServerError fill:#f8bbd9
    style Alert fill:#fff59d
    style Client fill:#e3f2fd
```

### Performance Monitoring

```mermaid
graph TB
    subgraph "Frontend Monitoring"
        PageLoad[Page Load Time]
        API_Response[API Response Time]
        User_Interaction[User Interactions]
        Error_Rate[Frontend Error Rate]
    end
    
    subgraph "Backend Monitoring"
        Request_Duration[Request Duration]
        Database_Query[Database Query Time]
        Memory_Usage[Memory Usage]
        CPU_Usage[CPU Usage]
    end
    
    subgraph "Infrastructure Monitoring"
        Server_Health[Server Health]
        Database_Performance[Database Performance]
        Cache_Hit_Rate[Cache Hit Rate]
        Network_Latency[Network Latency]
    end
    
    subgraph "Business Metrics"
        Template_Usage[Template Usage]
        Search_Queries[Search Queries]
        User_Sessions[User Sessions]
        Feature_Adoption[Feature Adoption]
    end
    
    subgraph "Alerting"
        Thresholds[Performance Thresholds]
        Automated_Alerts[Automated Alerts]
        Escalation[Escalation Rules]
    end
    
    PageLoad --> Thresholds
    Request_Duration --> Thresholds
    Database_Query --> Thresholds
    Memory_Usage --> Thresholds
    
    Thresholds --> Automated_Alerts
    Automated_Alerts --> Escalation
    
    Template_Usage --> Analytics[Analytics Dashboard]
    Search_Queries --> Analytics
    User_Sessions --> Analytics
    
    style PageLoad fill:#e8f5e8
    style Request_Duration fill:#fff3e0
    style Database_Performance fill:#f3e5f5
    style Template_Usage fill:#e0f2f1
    style Automated_Alerts fill:#fff59d
```

This architecture documentation provides comprehensive visual representations of the Developer Experience Platform's system design, data flow, and operational characteristics. These diagrams serve as reference materials for development, deployment, and maintenance activities.