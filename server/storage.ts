import { type User, type InsertUser, type Prompt, type InsertPrompt } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllPrompts(): Promise<Prompt[]>;
  getPromptById(id: string): Promise<Prompt | undefined>;
  getPromptsByCategory(category: string): Promise<Prompt[]>;
  searchPrompts(query: string): Promise<Prompt[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private prompts: Map<string, Prompt>;

  constructor() {
    this.users = new Map();
    this.prompts = new Map();
    this.initializePrompts();
  }

  private initializePrompts(): void {
    // Initialize with all prompt data from the VS Code extension
    const promptsData = [
      // Foundation Layer
      {
        id: "foundation-service_interface-development",
        title: "Service Interface",
        description: "Foundation service interface with dependency injection",
        content: "Create a foundation service interface following Helix architecture principles. Include async methods, error handling, and comprehensive logging. Implement the interface with proper dependency injection configuration and ensure all methods support cancellation tokens for optimal performance.",
        category: "foundation",
        component: "service_interface",
        sdlcStage: "development",
        tags: ["foundation", "service", "interface", "dependency-injection", "async"],
        context: "Foundation layer service interfaces should follow the repository pattern and include comprehensive error handling with structured logging.",
        metadata: { layer: "foundation", complexity: "medium" }
      },
      {
        id: "foundation-logging_service-development",
        title: "Logging Service",
        description: "Advanced logging with performance tracking",
        content: "Implement an advanced logging service that extends basic logging with performance tracking, user actions, and security events for Sitecore applications. Include structured logging with correlation IDs, performance metrics, and integration with Application Insights or similar monitoring solutions.",
        category: "foundation",
        component: "logging_service",
        sdlcStage: "development",
        tags: ["foundation", "logging", "performance", "security", "monitoring"],
        context: "Use structured logging with consistent format across all foundation services. Include correlation IDs for request tracking.",
        metadata: { layer: "foundation", complexity: "high" }
      },
      {
        id: "foundation-cache_service-development",
        title: "Cache Service",
        description: "Comprehensive caching with Redis integration",
        content: "Create a robust caching service with Redis integration, cache warming, invalidation strategies, and performance monitoring for Sitecore applications. Include distributed caching support, cache-aside pattern implementation, and automatic cache warming strategies for improved performance.",
        category: "foundation",
        component: "cache_service",
        sdlcStage: "development",
        tags: ["foundation", "cache", "redis", "performance", "distributed"],
        context: "Implement cache-aside pattern with proper invalidation strategies. Use Redis for distributed caching in multi-instance environments.",
        metadata: { layer: "foundation", complexity: "high" }
      },
      {
        id: "foundation-configuration_service-development",
        title: "Configuration Service",
        description: "Environment-aware configuration service",
        content: "Build an environment-aware configuration service that supports multiple environments, feature flags, and runtime configuration updates. Include validation, type safety, and integration with Sitecore's configuration system.",
        category: "foundation",
        component: "configuration_service",
        sdlcStage: "development",
        tags: ["foundation", "configuration", "environment", "feature-flags"],
        context: "Configuration should be environment-specific with validation and type safety. Support runtime updates for feature flags.",
        metadata: { layer: "foundation", complexity: "medium" }
      },
      {
        id: "foundation-di_configuration-development",
        title: "DI Configuration",
        description: "Dependency injection configuration",
        content: "Set up comprehensive dependency injection configuration for the foundation layer, including service registration, lifetime management, and proper disposal patterns. Configure IoC container with proper abstractions and implementations.",
        category: "foundation",
        component: "di_configuration",
        sdlcStage: "development",
        tags: ["foundation", "dependency-injection", "ioc", "configuration"],
        context: "Register all foundation services with appropriate lifetimes. Use abstraction patterns for testability.",
        metadata: { layer: "foundation", complexity: "medium" }
      },

      // Feature Layer
      {
        id: "feature-controller_action-development",
        title: "Controller Action",
        description: "MVC controller with comprehensive error handling",
        content: "Create a Sitecore MVC controller action with proper error handling, logging, dependency injection, and response handling following Helix architecture. Include model validation, anti-forgery token support, and proper HTTP status code handling.",
        category: "feature",
        component: "controller_action",
        sdlcStage: "development",
        tags: ["feature", "mvc", "controller", "error-handling", "validation"],
        context: "Feature controllers should handle business logic and delegate to services. Include proper error handling and logging.",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-view_model-development",
        title: "View Model",
        description: "Feature view model with validation",
        content: "Implement a feature layer view model with data annotations, validation attributes, and proper mapping from domain models. Include support for localization and accessibility requirements.",
        category: "feature",
        component: "view_model",
        sdlcStage: "development",
        tags: ["feature", "viewmodel", "validation", "mapping", "localization"],
        context: "View models should contain only presentation logic and validation. Map from domain models using AutoMapper or similar.",
        metadata: { layer: "feature", complexity: "low" }
      },
      {
        id: "feature-glass_mapper_model-development",
        title: "Glass Mapper Model",
        description: "Glass Mapper with comprehensive field mapping",
        content: "Create a Glass Mapper model interface with comprehensive field mappings, inheritance from base templates, and proper Sitecore field handling. Include lazy loading, field validation, and proper type conversions for all Sitecore field types.",
        category: "feature",
        component: "glass_mapper_model",
        sdlcStage: "development",
        tags: ["feature", "glass-mapper", "sitecore", "mapping", "fields"],
        context: "Use Glass Mapper interfaces for all Sitecore item models. Include proper field type mappings and inheritance.",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-service_layer-development",
        title: "Service Layer",
        description: "Feature service with async operations",
        content: "Implement a feature service layer with async operations, proper error handling, and integration with foundation services. Include business logic validation and proper dependency injection.",
        category: "feature",
        component: "service_layer",
        sdlcStage: "development",
        tags: ["feature", "service", "async", "business-logic", "validation"],
        context: "Feature services contain business logic and orchestrate foundation services. Use async patterns for I/O operations.",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-razor_view-development",
        title: "Razor View",
        description: "Accessible Razor view with SEO optimization",
        content: "Create an accessible Razor view with proper semantic HTML, SEO optimization, and responsive design. Include ARIA attributes, structured data, and performance optimizations.",
        category: "feature",
        component: "razor_view",
        sdlcStage: "development",
        tags: ["feature", "razor", "accessibility", "seo", "responsive"],
        context: "Use semantic HTML with proper ARIA attributes. Include structured data for SEO and ensure responsive design.",
        metadata: { layer: "feature", complexity: "medium" }
      },

      // Project Layer
      {
        id: "project-site_controller-development",
        title: "Site Controller",
        description: "Project layer site controller with authentication",
        content: "Implement a project layer site controller with authentication, authorization, and site-specific logic. Include security headers, CSRF protection, and proper session management.",
        category: "project",
        component: "site_controller",
        sdlcStage: "development",
        tags: ["project", "controller", "authentication", "security", "session"],
        context: "Project controllers handle site-wide concerns like authentication and authorization. Include security measures.",
        metadata: { layer: "project", complexity: "high" }
      },
      {
        id: "project-layout_view-development",
        title: "Layout View",
        description: "Main layout view with navigation and SEO",
        content: "Create the main layout view with global navigation, SEO meta tags, structured data, and performance optimizations. Include responsive design and accessibility features.",
        category: "project",
        component: "layout_view",
        sdlcStage: "development",
        tags: ["project", "layout", "navigation", "seo", "performance"],
        context: "Layout views define the overall page structure. Include global navigation and SEO elements.",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-site_configuration-development",
        title: "Site Configuration",
        description: "Project layer site configuration",
        content: "Configure site-specific settings including domains, languages, security policies, and feature toggles. Include environment-specific configurations and deployment settings.",
        category: "project",
        component: "site_configuration",
        sdlcStage: "development",
        tags: ["project", "configuration", "domains", "security", "deployment"],
        context: "Site configuration should be environment-aware and include security policies and feature toggles.",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-global_navigation-development",
        title: "Global Navigation",
        description: "Site-wide navigation component",
        content: "Implement global navigation with multi-level menus, responsive behavior, and accessibility features. Include breadcrumbs, search integration, and user account navigation.",
        category: "project",
        component: "global_navigation",
        sdlcStage: "development",
        tags: ["project", "navigation", "responsive", "accessibility", "breadcrumbs"],
        context: "Global navigation should be consistent across the site and include proper ARIA navigation landmarks.",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-asset_pipeline-development",
        title: "Asset Pipeline",
        description: "Asset optimization and bundling configuration",
        content: "Set up asset pipeline for CSS/JS bundling, minification, image optimization, and CDN integration. Include cache busting and performance monitoring.",
        category: "project",
        component: "asset_pipeline",
        sdlcStage: "development",
        tags: ["project", "assets", "bundling", "optimization", "cdn"],
        context: "Asset pipeline should optimize for performance with proper caching strategies and CDN integration.",
        metadata: { layer: "project", complexity: "high" }
      },

      // UI Components
      {
        id: "components-carousel-development",
        title: "Carousel Component",
        description: "Advanced carousel with responsive behavior",
        content: "Implement an advanced carousel component with responsive behavior, touch support, accessibility features, and Sitecore integration. Include auto-play functionality, keyboard navigation, screen reader support, and configurable transition effects.",
        category: "components",
        component: "carousel",
        sdlcStage: "development",
        tags: ["component", "carousel", "responsive", "accessibility", "touch"],
        context: "Carousel should be fully accessible with keyboard navigation and screen reader support. Include touch gestures for mobile.",
        metadata: { complexity: "high", accessibility: "required" }
      },
      {
        id: "components-custom_forms-development",
        title: "Form Component",
        description: "Dynamic form with validation and submission",
        content: "Create a dynamic form component with client and server-side validation, CSRF protection, and integration with Sitecore Forms or custom form handling. Include progressive enhancement and accessibility features.",
        category: "components",
        component: "custom_forms",
        sdlcStage: "development",
        tags: ["component", "forms", "validation", "csrf", "accessibility"],
        context: "Forms should include both client and server validation with proper error handling and accessibility.",
        metadata: { complexity: "high", security: "required" }
      },
      {
        id: "components-navigation-development",
        title: "Navigation Component",
        description: "Multi-level responsive navigation",
        content: "Build a multi-level navigation component with responsive behavior, dropdown menus, and mobile-friendly design. Include ARIA navigation patterns and keyboard support.",
        category: "components",
        component: "navigation",
        sdlcStage: "development",
        tags: ["component", "navigation", "responsive", "dropdown", "aria"],
        context: "Navigation should follow ARIA patterns and be fully keyboard accessible with proper focus management.",
        metadata: { complexity: "medium", accessibility: "required" }
      },
      {
        id: "components-search-development",
        title: "Search Component",
        description: "Intelligent search with auto-complete",
        content: "Implement an intelligent search component with auto-complete, faceted search, and result highlighting. Include integration with Sitecore Search or Solr.",
        category: "components",
        component: "search",
        sdlcStage: "development",
        tags: ["component", "search", "autocomplete", "facets", "solr"],
        context: "Search should provide relevant results with proper highlighting and filtering capabilities.",
        metadata: { complexity: "high", performance: "critical" }
      },
      {
        id: "components-media_gallery-development",
        title: "Media Gallery",
        description: "Responsive media gallery with lazy loading",
        content: "Create a responsive media gallery with lazy loading, lightbox functionality, and optimized image delivery. Include support for various media types and accessibility features.",
        category: "components",
        component: "media_gallery",
        sdlcStage: "development",
        tags: ["component", "gallery", "lazy-loading", "lightbox", "responsive"],
        context: "Media gallery should optimize image loading and provide accessible viewing experiences.",
        metadata: { complexity: "medium", performance: "important" }
      },

      // Testing
      {
        id: "testing-unit_test-development",
        title: "Unit Test",
        description: "Comprehensive unit test with mocking",
        content: "Create comprehensive unit tests with proper mocking, dependency injection testing, and coverage reporting. Include tests for happy path, edge cases, and error conditions.",
        category: "testing",
        component: "unit_test",
        sdlcStage: "development",
        tags: ["testing", "unit", "mocking", "coverage", "edge-cases"],
        context: "Unit tests should cover all business logic with proper mocking of dependencies and comprehensive assertions.",
        metadata: { coverage: "required", automation: "enabled" }
      },
      {
        id: "testing-integration_test-development",
        title: "Integration Test",
        description: "Integration test for Sitecore components",
        content: "Implement integration tests for Sitecore components including database interactions, API integrations, and cross-component functionality testing.",
        category: "testing",
        component: "integration_test",
        sdlcStage: "development",
        tags: ["testing", "integration", "sitecore", "database", "api"],
        context: "Integration tests should verify component interactions and data flow between layers.",
        metadata: { environment: "test", automation: "enabled" }
      },
      {
        id: "testing-test_data_builder-development",
        title: "Test Data Builder",
        description: "Test data builder pattern for creating test objects",
        content: "Implement the test data builder pattern for creating consistent test objects with default values and fluent configuration. Include builders for all major domain objects.",
        category: "testing",
        component: "test_data_builder",
        sdlcStage: "development",
        tags: ["testing", "builder", "test-data", "fluent", "objects"],
        context: "Test data builders should provide consistent test data with easy customization for specific test scenarios.",
        metadata: { pattern: "builder", reusability: "high" }
      },
      {
        id: "testing-mock_configuration-development",
        title: "Mock Configuration",
        description: "Mock setup for dependency injection",
        content: "Set up mock configuration for dependency injection container in tests, including proper mock lifecycle management and verification patterns.",
        category: "testing",
        component: "mock_configuration",
        sdlcStage: "development",
        tags: ["testing", "mocking", "dependency-injection", "verification"],
        context: "Mock configuration should isolate units under test and provide verifiable interactions with dependencies.",
        metadata: { isolation: "required", verification: "enabled" }
      },
      {
        id: "testing-e2e_test-development",
        title: "E2E Test",
        description: "End-to-end testing with Selenium",
        content: "Create end-to-end tests using Selenium or similar tools for testing complete user workflows, cross-browser compatibility, and accessibility compliance.",
        category: "testing",
        component: "e2e_test",
        sdlcStage: "development",
        tags: ["testing", "e2e", "selenium", "workflows", "accessibility"],
        context: "E2E tests should verify complete user workflows across different browsers and devices.",
        metadata: { browser: "multi", accessibility: "verified" }
      },

      // Styling
      {
        id: "styling-scss_component-development",
        title: "SCSS Component",
        description: "Component-specific SCSS with BEM methodology",
        content: "Create component-specific SCSS following BEM methodology, responsive design principles, and accessibility guidelines. Include CSS custom properties and modern layout techniques.",
        category: "styling",
        component: "scss_component",
        sdlcStage: "development",
        tags: ["styling", "scss", "bem", "responsive", "accessibility"],
        context: "SCSS should follow BEM naming conventions and include responsive breakpoints and accessibility considerations.",
        metadata: { methodology: "bem", responsive: "required" }
      }
    ];

    promptsData.forEach(prompt => {
      this.prompts.set(prompt.id, prompt as Prompt);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return Array.from(this.prompts.values());
  }

  async getPromptById(id: string): Promise<Prompt | undefined> {
    return this.prompts.get(id);
  }

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    return Array.from(this.prompts.values()).filter(
      prompt => prompt.category === category
    );
  }

  async searchPrompts(query: string): Promise<Prompt[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.prompts.values()).filter(prompt =>
      prompt.title.toLowerCase().includes(searchTerm) ||
      prompt.description.toLowerCase().includes(searchTerm) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      prompt.content.toLowerCase().includes(searchTerm)
    );
  }
}

export const storage = new MemStorage();
