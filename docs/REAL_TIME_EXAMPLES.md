# Real-Time Prompt Examples
## Developer Experience Platform (DXP)

### Version: 1.0.0
### Date: August 14, 2025

---

## Table of Contents

1. [Foundation Layer Examples](#1-foundation-layer-examples)
2. [Feature Layer Examples](#2-feature-layer-examples)
3. [SDLC Template Examples](#3-sdlc-template-examples)
4. [Component Examples](#4-component-examples)
5. [Complete Implementation Workflows](#5-complete-implementation-workflows)
6. [Advanced Use Cases](#6-advanced-use-cases)

---

## 1. Foundation Layer Examples

### 1.1 Service Interface Template

**Real-time Usage Scenario:** Creating a new microservice for user management

**Template Content:**
```typescript
// Foundation service interface with dependency injection and logging
import { Logger } from './logger.service';
import { DatabaseService } from './database.service';

export interface I{{ServiceName}}Service {
  {{methodName}}Async({{parameters}}): Promise<{{returnType}}>;
  validate{{EntityName}}(data: {{EntityType}}): ValidationResult;
  logOperation(operation: string, data?: any): void;
}

@Injectable()
export class {{ServiceName}}Service implements I{{ServiceName}}Service {
  constructor(
    private readonly logger: Logger,
    private readonly database: DatabaseService
  ) {}

  async {{methodName}}Async({{parameters}}): Promise<{{returnType}}> {
    this.logger.info(`Executing {{methodName}} with parameters:`, {{parameters}});
    
    try {
      // Validate input parameters
      const validation = this.validate{{EntityName}}({{inputData}});
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute business logic
      const result = await this.database.{{operationName}}({{parameters}});
      
      this.logger.info(`{{methodName}} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Error in {{methodName}}:`, error);
      throw error;
    }
  }

  validate{{EntityName}}(data: {{EntityType}}): ValidationResult {
    const errors: string[] = [];
    
    // Add your validation logic here
    if (!data.{{requiredField}}) {
      errors.push('{{requiredField}} is required');
    }
    
    if (data.{{emailField}} && !this.isValidEmail(data.{{emailField}})) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  logOperation(operation: string, data?: any): void {
    this.logger.info(`Operation: ${operation}`, data);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Supporting types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface {{EntityType}} {
  {{requiredField}}: string;
  {{emailField}}?: string;
  // Add other properties as needed
}
```

**Customized Implementation Example:**
```typescript
// After customization for User Management Service
export interface IUserManagementService {
  createUserAsync(userData: CreateUserRequest): Promise<User>;
  validateUser(data: User): ValidationResult;
  logOperation(operation: string, data?: any): void;
}

@Injectable()
export class UserManagementService implements IUserManagementService {
  constructor(
    private readonly logger: Logger,
    private readonly database: DatabaseService
  ) {}

  async createUserAsync(userData: CreateUserRequest): Promise<User> {
    this.logger.info(`Creating user with email:`, userData.email);
    
    try {
      const validation = this.validateUser(userData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const user = await this.database.createUser(userData);
      
      this.logger.info(`User created successfully with ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error creating user:`, error);
      throw error;
    }
  }
  // ... rest of implementation
}
```

### 1.2 Repository Pattern Template

**Real-time Usage Scenario:** Setting up data access layer for e-commerce products

**Template Content:**
```typescript
// Repository pattern implementation with generic CRUD operations
import { DatabaseConnection } from './database.connection';
import { Logger } from './logger.service';

export interface IRepository<T, K> {
  findById(id: K): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: K, entity: Partial<T>): Promise<T>;
  delete(id: K): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}

export abstract class BaseRepository<T, K> implements IRepository<T, K> {
  constructor(
    protected readonly db: DatabaseConnection,
    protected readonly logger: Logger,
    protected readonly tableName: string
  ) {}

  async findById(id: K): Promise<T | null> {
    this.logger.debug(`Finding ${this.tableName} by ID: ${id}`);
    
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await this.db.query(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Error finding ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    this.logger.debug(`Finding all ${this.tableName} with filter:`, filter);
    
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filter && Object.keys(filter).length > 0) {
        const conditions = Object.keys(filter).map((key, index) => {
          params.push(filter[key as keyof T]);
          return `${key} = $${index + 1}`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    this.logger.debug(`Creating new ${this.tableName}:`, entity);
    
    try {
      const columns = Object.keys(entity).join(', ');
      const placeholders = Object.keys(entity).map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(entity);
      
      const query = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: K, entity: Partial<T>): Promise<T> {
    this.logger.debug(`Updating ${this.tableName} ID ${id}:`, entity);
    
    try {
      const updates = Object.keys(entity).map((key, index) => {
        return `${key} = $${index + 2}`;
      });
      const values = [id, ...Object.values(entity)];
      
      const query = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error(`${this.tableName} with ID ${id} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(id: K): Promise<boolean> {
    this.logger.debug(`Deleting ${this.tableName} ID: ${id}`);
    
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      this.logger.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  async count(filter?: Partial<T>): Promise<number> {
    this.logger.debug(`Counting ${this.tableName} with filter:`, filter);
    
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filter && Object.keys(filter).length > 0) {
        const conditions = Object.keys(filter).map((key, index) => {
          params.push(filter[key as keyof T]);
          return `${key} = $${index + 1}`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const result = await this.db.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      this.logger.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }
}

// Specific repository implementation
export interface {{EntityName}} {
  id: {{IdType}};
  {{field1}}: {{Type1}};
  {{field2}}: {{Type2}};
  created_at: Date;
  updated_at: Date;
}

export class {{EntityName}}Repository extends BaseRepository<{{EntityName}}, {{IdType}}> {
  constructor(db: DatabaseConnection, logger: Logger) {
    super(db, logger, '{{tableName}}');
  }

  // Add entity-specific methods here
  async findBy{{CustomField}}({{customField}}: {{FieldType}}): Promise<{{EntityName}}[]> {
    this.logger.debug(`Finding ${this.tableName} by {{customField}}: ${{{customField}}}`);
    
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE {{customField}} = $1`;
      const result = await this.db.query(query, [{{customField}}]);
      
      return result.rows;
    } catch (error) {
      this.logger.error(`Error finding ${this.tableName} by {{customField}}:`, error);
      throw error;
    }
  }
}
```

**Customized Implementation Example:**
```typescript
// Product Repository Implementation
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ProductRepository extends BaseRepository<Product, string> {
  constructor(db: DatabaseConnection, logger: Logger) {
    super(db, logger, 'products');
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    this.logger.debug(`Finding products by category: ${categoryId}`);
    
    try {
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE category_id = $1 AND is_active = true
        ORDER BY name ASC
      `;
      const result = await this.db.query(query, [categoryId]);
      
      return result.rows;
    } catch (error) {
      this.logger.error(`Error finding products by category:`, error);
      throw error;
    }
  }

  async findLowStock(threshold: number = 10): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE stock_quantity <= $1 AND is_active = true
        ORDER BY stock_quantity ASC
      `;
      const result = await this.db.query(query, [threshold]);
      
      return result.rows;
    } catch (error) {
      this.logger.error(`Error finding low stock products:`, error);
      throw error;
    }
  }

  async updateStock(productId: string, quantity: number): Promise<Product> {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET stock_quantity = stock_quantity + $2, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;
      
      const result = await this.db.query(query, [productId, quantity]);
      
      if (result.rows.length === 0) {
        throw new Error(`Product with ID ${productId} not found or inactive`);
      }
      
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error updating product stock:`, error);
      throw error;
    }
  }
}
```

---

## 2. Feature Layer Examples

### 2.1 Authentication Service Template

**Real-time Usage Scenario:** Implementing JWT-based authentication system

**Template Content:**
```typescript
// Comprehensive authentication service with JWT tokens and password security
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { Logger } from './logger.service';
import { UserRepository } from './user.repository';

export interface LoginCredentials {
  {{usernameField}}: string;
  password: string;
}

export interface AuthResult {
  user: {{UserType}};
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  {{usernameField}}: string;
  roles: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class {{ServiceName}}AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    this.logger.info(`Login attempt for ${credentials.{{usernameField}}}`);

    try {
      // Find user by username/email
      const user = await this.userRepository.findBy{{UsernameField}}(credentials.{{usernameField}});
      
      if (!user) {
        this.logger.warn(`Login failed: User not found - ${credentials.{{usernameField}}}`);
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.passwordHash);
      
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password - ${credentials.{{usernameField}}}`);
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn(`Login failed: Account disabled - ${credentials.{{usernameField}}}`);
        throw new Error('Account is disabled');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      // Update last login
      await this.updateLastLogin(user.id);

      this.logger.info(`Login successful for ${credentials.{{usernameField}}}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      this.logger.error(`Login error for ${credentials.{{usernameField}}}:`, error);
      throw error;
    }
  }

  async register(userData: {{RegisterType}}): Promise<AuthResult> {
    this.logger.info(`Registration attempt for ${userData.{{usernameField}}}`);

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findBy{{UsernameField}}(userData.{{usernameField}});
      
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Create user
      const newUser = await this.userRepository.create({
        ...userData,
        passwordHash,
        isActive: true,
        roles: ['user'], // Default role
        emailVerified: false
      });

      // Generate tokens
      const tokens = await this.generateTokens(newUser);

      this.logger.info(`Registration successful for ${userData.{{usernameField}}}`);

      return {
        user: this.sanitizeUser(newUser),
        ...tokens
      };
    } catch (error) {
      this.logger.error(`Registration error for ${userData.{{usernameField}}}:`, error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET
      });

      // Find user
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<{{UserType}} | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepository.findById(payload.sub);
      
      return user && user.isActive ? this.sanitizeUser(user) : null;
    } catch (error) {
      this.logger.debug('Token validation failed:', error.message);
      return null;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await this.userRepository.update(userId, {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date()
      });

      this.logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Password change error for user ${userId}:`, error);
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // Update last logout (optional)
      await this.userRepository.update(userId, {
        lastLogout: new Date()
      });

      this.logger.info(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error(`Logout error for user ${userId}:`, error);
      throw error;
    }
  }

  private async generateTokens(user: {{UserType}}): Promise<Omit<AuthResult, 'user'>> {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      {{usernameField}}: user.{{usernameField}},
      roles: user.roles
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: this.ACCESS_TOKEN_EXPIRY
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: this.REFRESH_TOKEN_EXPIRY
      })
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 * 1000 // 15 minutes in milliseconds
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, this.SALT_ROUNDS);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLogin: new Date()
    });
  }

  private sanitizeUser(user: {{UserType}}): {{UserType}} {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser as {{UserType}};
  }
}

// Supporting interfaces
export interface {{UserType}} {
  id: string;
  {{usernameField}}: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  lastLogout?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface {{RegisterType}} {
  {{usernameField}}: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
```

**Customized Implementation Example:**
```typescript
// E-commerce Authentication Service
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class EcommerceAuthService {
  // Implementation using email as username field
  async login(credentials: { email: string; password: string }): Promise<AuthResult> {
    this.logger.info(`Login attempt for ${credentials.email}`);
    // ... full implementation
  }

  async register(userData: RegisterRequest): Promise<AuthResult> {
    this.logger.info(`Registration attempt for ${userData.email}`);
    // ... implementation with email validation
  }
  
  // ... rest of the methods
}
```

---

## 3. SDLC Template Examples

### 3.1 CI/CD Pipeline Template

**Real-time Usage Scenario:** Setting up automated deployment for a Node.js application

**Template Content:**
```yaml
# Complete CI/CD Pipeline Configuration
# Supports: GitHub Actions, GitLab CI, Jenkins
# Technologies: Node.js, Docker, PostgreSQL, Redis

name: {{ApplicationName}} CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main, develop]
  release:
    types: [published]

env:
  NODE_VERSION: '{{nodeVersion}}'
  REGISTRY: {{containerRegistry}}
  IMAGE_NAME: {{imageName}}
  
jobs:
  # Code Quality & Security Checks
  code-quality:
    name: Code Quality Analysis
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Shallow clones should be disabled for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Dependencies
        run: |
          npm ci
          npm audit --audit-level high

      - name: Lint Code
        run: |
          npm run lint
          npm run lint:check

      - name: Type Check
        run: npm run type-check

      - name: Security Scan
        run: |
          npx audit-ci --config audit-ci.json
          npx dependency-check --project {{ApplicationName}} --scan ./ --format HTML

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # Automated Testing
  test:
    name: Automated Testing
    runs-on: ubuntu-latest
    needs: [code-quality]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: {{testDatabaseName}}
          POSTGRES_USER: {{testDatabaseUser}}
          POSTGRES_PASSWORD: {{testDatabasePassword}}
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Setup Test Database
        run: |
          npm run db:migrate:test
          npm run db:seed:test
        env:
          DATABASE_URL: postgresql://{{testDatabaseUser}}:{{testDatabasePassword}}@localhost:5432/{{testDatabaseName}}
          REDIS_URL: redis://localhost:6379

      - name: Run Unit Tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://{{testDatabaseUser}}:{{testDatabasePassword}}@localhost:5432/{{testDatabaseName}}
          REDIS_URL: redis://localhost:6379

      - name: Run Integration Tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://{{testDatabaseUser}}:{{testDatabasePassword}}@localhost:5432/{{testDatabaseName}}
          REDIS_URL: redis://localhost:6379

      - name: Generate Test Coverage
        run: npm run test:coverage

      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Performance Tests
        run: npm run test:performance
        env:
          NODE_ENV: test

  # Build Application
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test]
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Application
        run: |
          npm run build
          npm run build:client

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract Metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and Push Docker Image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  # Security Scanning
  security:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name != 'pull_request'
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.STAGING_KUBECONFIG }}

      - name: Deploy to Staging
        run: |
          # Update deployment with new image
          kubectl set image deployment/{{applicationName}} \
            {{applicationName}}=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n {{stagingNamespace}}
          
          # Wait for rollout to complete
          kubectl rollout status deployment/{{applicationName}} -n {{stagingNamespace}} --timeout=300s

      - name: Run Smoke Tests
        run: |
          npm ci
          npm run test:smoke
        env:
          TEST_URL: https://{{stagingUrl}}
          API_KEY: ${{ secrets.STAGING_API_KEY }}

      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "text": "🚀 Staging deployment successful!",
              "attachments": [{
                "color": "good",
                "fields": [{
                  "title": "Environment",
                  "value": "Staging",
                  "short": true
                }, {
                  "title": "Version",
                  "value": "${{ github.sha }}",
                  "short": true
                }, {
                  "title": "URL",
                  "value": "https://{{stagingUrl}}",
                  "short": false
                }]
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.event_name == 'release'
    environment: production
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.PRODUCTION_KUBECONFIG }}

      - name: Blue-Green Deployment
        run: |
          # Create new deployment
          kubectl apply -f k8s/production/ -n {{productionNamespace}}
          
          # Update service to point to new deployment
          kubectl patch service {{applicationName}} \
            -p '{"spec":{"selector":{"version":"${{ github.sha }}"}}}' \
            -n {{productionNamespace}}
          
          # Wait for deployment to be ready
          kubectl rollout status deployment/{{applicationName}} -n {{productionNamespace}} --timeout=600s

      - name: Run Production Health Checks
        run: |
          npm ci
          npm run test:health
        env:
          TEST_URL: https://{{productionUrl}}
          API_KEY: ${{ secrets.PRODUCTION_API_KEY }}

      - name: Cleanup Old Deployments
        run: |
          # Keep last 3 deployments
          kubectl delete deployment -l app={{applicationName}},version!=${{ github.sha }} \
            -n {{productionNamespace}} \
            --sort-by='.metadata.creationTimestamp' \
            --field-selector='metadata.name!={{applicationName}}'

      - name: Notify Production Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "text": "🎉 Production deployment successful!",
              "attachments": [{
                "color": "good",
                "fields": [{
                  "title": "Environment",
                  "value": "Production",
                  "short": true
                }, {
                  "title": "Version",
                  "value": "${{ github.event.release.tag_name }}",
                  "short": true
                }, {
                  "title": "Release Notes",
                  "value": "${{ github.event.release.html_url }}",
                  "short": false
                }]
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # Rollback on Failure
  rollback:
    name: Rollback Deployment
    runs-on: ubuntu-latest
    if: failure() && (needs.deploy-staging.result == 'failure' || needs.deploy-production.result == 'failure')
    needs: [deploy-staging, deploy-production]
    
    steps:
      - name: Rollback Staging
        if: needs.deploy-staging.result == 'failure'
        run: |
          kubectl rollout undo deployment/{{applicationName}} -n {{stagingNamespace}}
          kubectl rollout status deployment/{{applicationName}} -n {{stagingNamespace}}

      - name: Rollback Production
        if: needs.deploy-production.result == 'failure'
        run: |
          kubectl rollout undo deployment/{{applicationName}} -n {{productionNamespace}}
          kubectl rollout status deployment/{{applicationName}} -n {{productionNamespace}}

      - name: Notify Rollback
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "text": "⚠️ Deployment rollback executed!",
              "attachments": [{
                "color": "warning",
                "fields": [{
                  "title": "Action",
                  "value": "Automatic rollback due to deployment failure",
                  "short": false
                }, {
                  "title": "Branch",
                  "value": "${{ github.ref }}",
                  "short": true
                }, {
                  "title": "Commit",
                  "value": "${{ github.sha }}",
                  "short": true
                }]
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Customized Implementation Example:**
```yaml
# E-commerce Platform CI/CD Pipeline
name: E-commerce Platform CI/CD

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ecommerce-platform
  
jobs:
  code-quality:
    name: Code Quality Analysis
    runs-on: ubuntu-latest
    # ... implementation for e-commerce specific checks

  test:
    name: E-commerce Testing Suite
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: ecommerce_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
    # ... e-commerce specific testing
```

---

## 4. Component Examples

### 4.1 Data Table Component Template

**Real-time Usage Scenario:** Creating a product management table for admin dashboard

**Template Content:**
```typescript
// Advanced Data Table Component with sorting, filtering, and pagination
import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

export interface {{EntityName}}TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface {{EntityName}}TableProps<T> {
  data: T[];
  columns: {{EntityName}}TableColumn<T>[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  actions?: {
    label: string;
    onClick: (row: T) => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline';
  }[];
  emptyMessage?: string;
  className?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function {{EntityName}}Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onRowSelect,
  actions = [],
  emptyMessage = 'No data available',
  className = ''
}: {{EntityName}}TableProps<T>) {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchable && searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    if (filterable) {
      Object.entries(filterValues).forEach(([key, value]) => {
        if (value) {
          filtered = filtered.filter(item => {
            const itemValue = item[key]?.toString().toLowerCase();
            return itemValue?.includes(value.toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (sortable && sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, filterValues, columns, searchable, filterable, sortable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = pagination 
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;

  // Event handlers
  const handleSort = useCallback((key: string) => {
    if (!sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, [sortable]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(current => ({
      ...current,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleRowSelect = useCallback((row: T, isSelected: boolean) => {
    setSelectedRows(current => {
      const updated = isSelected
        ? [...current, row]
        : current.filter(r => r !== row);
      
      onRowSelect?.(updated);
      return updated;
    });
  }, [onRowSelect]);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    const newSelection = isSelected ? [...paginatedData] : [];
    setSelectedRows(newSelection);
    onRowSelect?.(newSelection);
  }, [paginatedData, onRowSelect]);

  const exportData = useCallback(() => {
    const csvContent = [
      // Header row
      columns.map(col => col.header).join(','),
      // Data rows
      ...processedData.map(row =>
        columns.map(col => {
          const value = row[col.key];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value?.toString() || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '{{entityName}}_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [processedData, columns]);

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!sortable) return null;
    
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' 
        ? <ChevronUp className="w-4 h-4" />
        : <ChevronDown className="w-4 h-4" />;
    }
    
    return <ChevronUp className="w-4 h-4 opacity-30" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search {{entityName}}..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {filterable && (
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          {selectedRows.length > 0 && (
            <span className="text-sm text-gray-600 self-center">
              {selectedRows.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Filter Row */}
      {filterable && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {columns.filter(col => col.filterable).map(column => (
            <Select
              key={column.key.toString()}
              value={filterValues[column.key.toString()] || ''}
              onValueChange={(value) => handleFilterChange(column.key.toString(), value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={`Filter ${column.header}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All {column.header}</SelectItem>
                {/* Add dynamic filter options based on data */}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onRowSelect && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </TableHead>
              )}
              
              {columns.map((column) => (
                <TableHead
                  key={column.key.toString()}
                  className={`${column.width ? `w-${column.width}` : ''} ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key.toString())}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {renderSortIcon(column.key.toString())}
                  </div>
                </TableHead>
              ))}
              
              {actions.length > 0 && (
                <TableHead className="w-32">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onRowSelect ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="text-center py-8 text-gray-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${
                    selectedRows.includes(row) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {onRowSelect && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(row, e.target.checked);
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                  )}
                  
                  {columns.map((column) => (
                    <TableCell
                      key={column.key.toString()}
                      className={`text-${column.align || 'left'}`}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]?.toString() || '-'
                      }
                    </TableCell>
                  ))}
                  
                  {actions.length > 0 && (
                    <TableCell>
                      <div className="flex gap-1">
                        {actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant={action.variant || 'outline'}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                          >
                            {action.icon && <span className="mr-1">{action.icon}</span>}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of{' '}
            {processedData.length} entries
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Usage Example Component
export interface {{EntityName}} {
  id: string;
  {{field1}}: {{Type1}};
  {{field2}}: {{Type2}};
  {{statusField}}: '{{status1}}' | '{{status2}}' | '{{status3}}';
  {{dateField}}: Date;
}

export function {{EntityName}}TableExample() {
  const [{{entityName}}s, set{{EntityName}}s] = useState<{{EntityName}}[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: {{EntityName}}TableColumn<{{EntityName}}>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '100px',
      sortable: true
    },
    {
      key: '{{field1}}',
      header: '{{Field1Header}}',
      sortable: true,
      filterable: true
    },
    {
      key: '{{field2}}',
      header: '{{Field2Header}}',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: '{{statusField}}',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === '{{status1}}' ? 'bg-green-100 text-green-800' :
          status === '{{status2}}' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: '{{dateField}}',
      header: '{{DateFieldHeader}}',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: ({{entityName}}: {{EntityName}}) => {
        console.log('Edit {{entityName}}:', {{entityName}}.id);
      },
      variant: 'outline' as const
    },
    {
      label: 'Delete',
      onClick: ({{entityName}}: {{EntityName}}) => {
        console.log('Delete {{entityName}}:', {{entityName}}.id);
      },
      variant: 'destructive' as const
    }
  ];

  return (
    <{{EntityName}}Table
      data={ {{entityName}}s}
      columns={columns}
      loading={loading}
      actions={actions}
      onRowClick={({{entityName}}) => console.log('Row clicked:', {{entityName}})}
      onRowSelect={(selected) => console.log('Selected rows:', selected)}
      emptyMessage="No {{entityName}}s found"
    />
  );
}
```

**Customized Implementation Example:**
```typescript
// Product Management Table
export interface Product {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: Date;
  category: string;
  stock: number;
}

export function ProductTable() {
  const columns: ProductTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      filterable: true,
      render: (name, product) => (
        <div className="flex items-center">
          <img src={product.imageUrl} className="w-8 h-8 rounded mr-2" />
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      render: (price) => `$${price.toFixed(2)}`
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (stock) => (
        <span className={stock <= 10 ? 'text-red-600 font-bold' : ''}>
          {stock}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'active' ? 'bg-green-100 text-green-800' :
          status === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status.replace('_', ' ')}
        </span>
      )
    }
  ];

  return (
    <ProductTable
      data={products}
      columns={columns}
      actions={[
        { label: 'Edit', onClick: handleEdit },
        { label: 'Delete', onClick: handleDelete, variant: 'destructive' }
      ]}
    />
  );
}
```

---

## 5. Complete Implementation Workflows

### 5.1 Building a Complete E-commerce API

**Scenario:** Creating a full-featured e-commerce backend API

**Step-by-Step Implementation:**

#### Step 1: Foundation Setup
```typescript
// 1. Service Interface (Foundation Layer)
export interface IProductService {
  createProductAsync(productData: CreateProductRequest): Promise<Product>;
  getProductByIdAsync(id: string): Promise<Product | null>;
  updateProductAsync(id: string, updates: UpdateProductRequest): Promise<Product>;
  deleteProductAsync(id: string): Promise<boolean>;
  searchProductsAsync(query: SearchProductsRequest): Promise<SearchProductsResponse>;
}

// 2. Repository Pattern (Foundation Layer)
export class ProductRepository extends BaseRepository<Product, string> {
  constructor(db: DatabaseConnection, logger: Logger) {
    super(db, logger, 'products');
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    // Implementation
  }

  async searchByText(query: string): Promise<Product[]> {
    // Full-text search implementation
  }
}

// 3. Dependency Injection Setup
@Module({
  providers: [
    ProductService,
    ProductRepository,
    DatabaseConnection,
    Logger
  ]
})
export class ProductModule {}
```

#### Step 2: Feature Implementation
```typescript
// 4. Authentication Service (Feature Layer)
@Injectable()
export class EcommerceAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // JWT-based authentication
  }

  async register(userData: RegisterRequest): Promise<AuthResult> {
    // User registration with email verification
  }
}

// 5. Shopping Cart Service (Feature Layer)
@Injectable()
export class ShoppingCartService {
  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    // Add product to cart logic
  }

  async removeFromCart(userId: string, itemId: string): Promise<boolean> {
    // Remove item from cart
  }

  async getCart(userId: string): Promise<Cart> {
    // Get user's current cart
  }
}

// 6. Payment Processing (Feature Layer)
@Injectable()
export class PaymentService {
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    // Stripe/PayPal integration
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    // Refund processing
  }
}
```

#### Step 3: API Layer Implementation
```typescript
// 7. Product Controller (Project Layer)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: IProductService) {}

  @Get()
  async searchProducts(@Query() query: SearchProductsRequest): Promise<SearchProductsResponse> {
    return this.productService.searchProductsAsync(query);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string): Promise<Product> {
    const product = await this.productService.getProductByIdAsync(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  async createProduct(@Body() productData: CreateProductRequest): Promise<Product> {
    return this.productService.createProductAsync(productData);
  }
}

// 8. Cart Controller
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: ShoppingCartService) {}

  @Get()
  async getCart(@Request() req: AuthenticatedRequest): Promise<Cart> {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  async addToCart(
    @Request() req: AuthenticatedRequest,
    @Body() addItemData: AddToCartRequest
  ): Promise<CartItem> {
    return this.cartService.addToCart(
      req.user.id,
      addItemData.productId,
      addItemData.quantity
    );
  }
}
```

#### Step 4: Testing Implementation
```typescript
// 9. Unit Tests (Testing Layer)
describe('ProductService', () => {
  let service: ProductService;
  let repository: ProductRepository;
  let logger: Logger;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: Logger,
          useValue: {
            info: jest.fn(),
            error: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<ProductRepository>(ProductRepository);
    logger = module.get<Logger>(Logger);
  });

  describe('createProductAsync', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      const productData: CreateProductRequest = {
        name: 'Test Product',
        price: 29.99,
        categoryId: 'cat-1',
        description: 'Test description'
      };

      const expectedProduct: Product = {
        id: 'prod-1',
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      repository.create = jest.fn().mockResolvedValue(expectedProduct);

      // Act
      const result = await service.createProductAsync(productData);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(repository.create).toHaveBeenCalledWith(productData);
      expect(logger.info).toHaveBeenCalledWith('Creating new product: Test Product');
    });
  });
});

// 10. Integration Tests
describe('Product API Integration', () => {
  let app: INestApplication;
  
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/products (GET) should return product list', async () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect(response => {
        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
      });
  });
});
```

#### Step 5: SDLC Implementation
```yaml
# 11. CI/CD Pipeline (SDLC Template)
name: E-commerce API CI/CD
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: ecommerce_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          docker build -t ecommerce-api .
          docker push ${{ secrets.REGISTRY_URL }}/ecommerce-api:latest
```

**Final Result:** Complete e-commerce API with:
- ✅ Robust architecture with proper separation of concerns
- ✅ Authentication and authorization
- ✅ Product management with search capabilities
- ✅ Shopping cart functionality
- ✅ Payment processing integration
- ✅ Comprehensive testing suite
- ✅ Automated CI/CD pipeline
- ✅ Production-ready deployment configuration

---

## 6. Advanced Use Cases

### 6.1 Microservices Architecture Implementation

**Scenario:** Breaking down a monolithic application into microservices

```typescript
// Service Discovery Template
export interface IServiceDiscovery {
  registerService(service: ServiceRegistration): Promise<void>;
  discoverService(serviceName: string): Promise<ServiceEndpoint[]>;
  healthCheck(serviceId: string): Promise<HealthStatus>;
}

// API Gateway Template
export class ApiGateway {
  constructor(
    private readonly serviceDiscovery: IServiceDiscovery,
    private readonly loadBalancer: ILoadBalancer,
    private readonly authService: IAuthService
  ) {}

  async routeRequest(request: IncomingRequest): Promise<Response> {
    // Route to appropriate microservice
  }
}

// Event Bus Template
export class EventBus {
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    // Publish domain events across services
  }

  async subscribe<T>(eventType: string, handler: EventHandler<T>): Promise<void> {
    // Subscribe to domain events
  }
}
```

### 6.2 Real-time Features Implementation

**Scenario:** Adding real-time notifications and live updates

```typescript
// WebSocket Service Template
export class WebSocketService {
  private readonly connections = new Map<string, WebSocket>();

  async handleConnection(ws: WebSocket, userId: string): Promise<void> {
    this.connections.set(userId, ws);
    
    ws.on('message', (message) => this.handleMessage(userId, message));
    ws.on('close', () => this.connections.delete(userId));
  }

  async broadcastToUser(userId: string, message: any): Promise<void> {
    const connection = this.connections.get(userId);
    if (connection?.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  }

  async broadcastToRoom(roomId: string, message: any): Promise<void> {
    // Broadcast to all users in a room
  }
}

// Real-time Notifications
export class NotificationService {
  constructor(
    private readonly websocketService: WebSocketService,
    private readonly pushService: IPushNotificationService
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    // Send via WebSocket for real-time
    await this.websocketService.broadcastToUser(
      notification.userId,
      notification
    );

    // Send push notification for offline users
    if (!this.isUserOnline(notification.userId)) {
      await this.pushService.send(notification);
    }
  }
}
```

### 6.3 Advanced Analytics Implementation

**Scenario:** Building comprehensive analytics and reporting system

```typescript
// Analytics Event Tracking
export class AnalyticsService {
  async track(event: AnalyticsEvent): Promise<void> {
    // Track user behavior events
    await this.eventStore.save(event);
    await this.realTimeProcessor.process(event);
  }

  async generateReport(reportConfig: ReportConfiguration): Promise<AnalyticsReport> {
    // Generate business intelligence reports
  }

  async createDashboard(userId: string, config: DashboardConfig): Promise<Dashboard> {
    // Create custom analytics dashboards
  }
}

// Data Pipeline Template
export class DataPipeline {
  async extractData(source: DataSource): Promise<RawData[]> {
    // Extract data from various sources
  }

  async transformData(rawData: RawData[]): Promise<ProcessedData[]> {
    // Clean and transform data
  }

  async loadData(processedData: ProcessedData[]): Promise<void> {
    // Load into data warehouse
  }
}
```

---

This comprehensive documentation provides real-time examples and practical implementations for all major aspects of the Developer Experience Platform. Each template can be directly customized and implemented in real-world projects, saving significant development time while ensuring best practices and consistent quality.

The examples demonstrate how to combine multiple templates to build complete, production-ready applications with proper architecture, testing, and deployment workflows.