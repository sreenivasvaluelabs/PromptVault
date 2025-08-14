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
    // Initialize with all 75 prompts from the complete Cognizant DXP Prompt Library
    const promptsData = [
      // Foundation Layer (5 prompts)
      {
        id: "foundation-service_interface-development",
        title: "Service Interface",
        description: "Foundation service interface with dependency injection and logging",
        content: "Create a foundation service interface following Helix architecture principles. Include async methods, error handling, and comprehensive logging.",
        category: "foundation",
        component: "service_interface",
        sdlcStage: "development",
        tags: ["foundation", "service", "interface", "async", "logging"],
        context: "implementation",
        metadata: { layer: "foundation", complexity: "medium" }
      },
      {
        id: "foundation-logging_service-development",
        title: "Logging Service",
        description: "Advanced logging service with performance, user action, and security event tracking",
        content: "Implement an advanced logging service that extends basic logging with performance tracking, user actions, and security events for Sitecore applications.",
        category: "foundation",
        component: "logging_service",
        sdlcStage: "development",
        tags: ["foundation", "logging", "performance", "security", "tracking"],
        context: "implementation",
        metadata: { layer: "foundation", complexity: "high" }
      },
      {
        id: "foundation-cache_service-development",
        title: "Cache Service",
        description: "Comprehensive caching service with Redis integration and cache invalidation",
        content: "Create a robust caching service with Redis integration, cache warming, invalidation strategies, and performance monitoring for Sitecore applications.",
        category: "foundation",
        component: "cache_service",
        sdlcStage: "development",
        tags: ["foundation", "cache", "redis", "performance", "invalidation"],
        context: "implementation",
        metadata: { layer: "foundation", complexity: "high" }
      },
      {
        id: "foundation-configuration_service-development",
        title: "Configuration Service",
        description: "Environment-aware configuration service with caching and Sitecore integration",
        content: "Implement a configuration service that supports environment-specific settings, caching, and integration with Sitecore configuration systems.",
        category: "foundation",
        component: "configuration_service",
        sdlcStage: "development",
        tags: ["foundation", "configuration", "environment", "caching", "sitecore"],
        context: "implementation",
        metadata: { layer: "foundation", complexity: "medium" }
      },
      {
        id: "foundation-di_configuration-development",
        title: "DI Configuration",
        description: "Dependency injection configuration for Foundation layer services",
        content: "Set up comprehensive dependency injection configuration for Foundation layer services with proper scoping and lifecycle management.",
        category: "foundation",
        component: "di_configuration",
        sdlcStage: "development",
        tags: ["foundation", "di", "dependency-injection", "configuration", "lifecycle"],
        context: "implementation",
        metadata: { layer: "foundation", complexity: "medium" }
      },

      // Feature Layer (5 prompts)
      {
        id: "feature-controller_action-development",
        title: "Controller Action",
        description: "Feature controller action with comprehensive error handling and logging",
        content: "Create a Sitecore MVC controller action with proper error handling, logging, dependency injection, and response handling following Helix architecture.",
        category: "feature",
        component: "controller_action",
        sdlcStage: "development",
        tags: ["feature", "mvc", "controller", "error-handling", "logging"],
        context: "implementation",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-view_model-development",
        title: "View Model",
        description: "Feature view model with validation and display logic",
        content: "Implement a comprehensive view model with validation attributes, display formatting, and business logic for Sitecore Feature layer components.",
        category: "feature",
        component: "view_model",
        sdlcStage: "development",
        tags: ["feature", "viewmodel", "validation", "display", "business-logic"],
        context: "implementation",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-glass_mapper_model-development",
        title: "Glass Mapper Model",
        description: "Glass Mapper model with comprehensive field mapping and inheritance",
        content: "Create a Glass Mapper model interface with comprehensive field mappings, inheritance from base templates, and proper Sitecore field handling.",
        category: "feature",
        component: "glass_mapper_model",
        sdlcStage: "development",
        tags: ["feature", "glass-mapper", "model", "mapping", "inheritance"],
        context: "implementation",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-service_layer-development",
        title: "Service Layer",
        description: "Feature service layer with async operations, caching, and validation",
        content: "Implement a feature service layer with async operations, caching integration, input validation, and comprehensive error handling.",
        category: "feature",
        component: "service_layer",
        sdlcStage: "development",
        tags: ["feature", "service", "async", "caching", "validation"],
        context: "implementation",
        metadata: { layer: "feature", complexity: "medium" }
      },
      {
        id: "feature-razor_view-development",
        title: "Razor View",
        description: "Accessible Razor view with SEO optimization and responsive design",
        content: "Create a Razor view with accessibility features, SEO optimization, responsive design, and integration with Sitecore Experience Editor.",
        category: "feature",
        component: "razor_view",
        sdlcStage: "development",
        tags: ["feature", "razor", "view", "accessibility", "seo", "responsive"],
        context: "implementation",
        metadata: { layer: "feature", complexity: "medium" }
      },

      // Project Layer (5 prompts)
      {
        id: "project-site_controller-development",
        title: "Site Controller",
        description: "Project layer site controller with authentication and site-specific logic",
        content: "Create a Project layer site controller with authentication, authorization, site-specific business logic, and proper error handling.",
        category: "project",
        component: "site_controller",
        sdlcStage: "development",
        tags: ["project", "controller", "authentication", "authorization", "site-specific"],
        context: "implementation",
        metadata: { layer: "project", complexity: "high" }
      },
      {
        id: "project-layout_view-development",
        title: "Layout View",
        description: "Main layout view with navigation, SEO, and performance optimization",
        content: "Implement a master layout view with navigation, SEO meta tags, performance optimization, and responsive design for the Project layer.",
        category: "project",
        component: "layout_view",
        sdlcStage: "development",
        tags: ["project", "layout", "navigation", "seo", "performance", "responsive"],
        context: "implementation",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-site_configuration-development",
        title: "Site Configuration",
        description: "Project layer site configuration with multi-site support",
        content: "Set up Project layer site configuration with multi-site support, environment-specific settings, and integration with Sitecore site definitions.",
        category: "project",
        component: "site_configuration",
        sdlcStage: "development",
        tags: ["project", "configuration", "multi-site", "environment", "sitecore"],
        context: "implementation",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-global_navigation-development",
        title: "Global Navigation",
        description: "Site-wide navigation component with responsive behavior and accessibility",
        content: "Create a global navigation component with responsive behavior, accessibility features, and integration with Sitecore content tree structure.",
        category: "project",
        component: "global_navigation",
        sdlcStage: "development",
        tags: ["project", "navigation", "responsive", "accessibility", "sitecore"],
        context: "implementation",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-asset_pipeline-development",
        title: "Asset Pipeline",
        description: "Asset optimization and bundling configuration for Project layer",
        content: "Configure asset pipeline with bundling, minification, CDN integration, and cache busting for optimal web performance.",
        category: "project",
        component: "asset_pipeline",
        sdlcStage: "development",
        tags: ["project", "assets", "bundling", "cdn", "performance", "optimization"],
        context: "implementation",
        metadata: { layer: "project", complexity: "high" }
      },

      // UI Components (5 prompts)
      {
        id: "components-carousel-development",
        title: "Carousel Component",
        description: "Advanced carousel component with responsive behavior and accessibility",
        content: "Implement an advanced carousel component with responsive behavior, touch support, accessibility features, and Sitecore integration.",
        category: "components",
        component: "carousel",
        sdlcStage: "development",
        tags: ["component", "carousel", "responsive", "accessibility", "touch"],
        context: "implementation",
        metadata: { complexity: "high", accessibility: "required" }
      },
      {
        id: "components-custom_forms-development",
        title: "Form Component",
        description: "Dynamic form component with validation and submission handling",
        content: "Create a dynamic form component with client/server validation, AJAX submission, file upload support, and integration with Sitecore Forms.",
        category: "components",
        component: "custom_forms",
        sdlcStage: "development",
        tags: ["component", "forms", "validation", "ajax", "file-upload"],
        context: "implementation",
        metadata: { complexity: "high", security: "required" }
      },
      {
        id: "components-navigation-development",
        title: "Navigation Component",
        description: "Multi-level responsive navigation with breadcrumbs and search",
        content: "Implement a responsive navigation component with multi-level menus, breadcrumbs, search integration, and mobile-first design.",
        category: "components",
        component: "navigation",
        sdlcStage: "development",
        tags: ["component", "navigation", "responsive", "breadcrumbs", "search", "mobile"],
        context: "implementation",
        metadata: { complexity: "medium", accessibility: "required" }
      },
      {
        id: "components-search-development",
        title: "Search Component",
        description: "Intelligent search with auto-complete and faceted filtering",
        content: "Create an intelligent search component with auto-complete, faceted filtering, result highlighting, and integration with Sitecore Content Search.",
        category: "components",
        component: "search",
        sdlcStage: "development",
        tags: ["component", "search", "autocomplete", "faceting", "solr", "content-search"],
        context: "implementation",
        metadata: { complexity: "high", performance: "critical" }
      },
      {
        id: "components-media_gallery-development",
        title: "Media Gallery",
        description: "Responsive media gallery with lazy loading and lightbox functionality",
        content: "Implement a responsive media gallery with lazy loading, lightbox functionality, image optimization, and integration with Sitecore Media Library.",
        category: "components",
        component: "media_gallery",
        sdlcStage: "development",
        tags: ["component", "media", "gallery", "lazy-loading", "lightbox", "optimization"],
        context: "implementation",
        metadata: { complexity: "medium", performance: "important" }
      },

      // Testing (5 prompts)
      {
        id: "testing-unit_test-development",
        title: "Unit Test",
        description: "Comprehensive unit test with mocking and coverage",
        content: "Create comprehensive unit tests with proper mocking, test data builders, and coverage for Sitecore components following AAA pattern.",
        category: "testing",
        component: "unit_test",
        sdlcStage: "development",
        tags: ["testing", "unit-test", "mocking", "coverage", "aaa-pattern"],
        context: "unit_testing",
        metadata: { complexity: "medium", testing: "required" }
      },
      {
        id: "testing-integration_test-development",
        title: "Integration Test",
        description: "Integration test for Sitecore components with real dependencies",
        content: "Implement integration tests for Sitecore components with real dependencies, database interactions, and end-to-end scenarios.",
        category: "testing",
        component: "integration_test",
        sdlcStage: "development",
        tags: ["testing", "integration-test", "database", "end-to-end", "sitecore"],
        context: "integration_testing",
        metadata: { complexity: "high", testing: "required" }
      },
      {
        id: "testing-test_data_builder-development",
        title: "Test Data Builder",
        description: "Test data builder pattern for creating test objects",
        content: "Create test data builders using the builder pattern for generating consistent test data across unit and integration tests.",
        category: "testing",
        component: "test_data_builder",
        sdlcStage: "development",
        tags: ["testing", "test-data", "builder-pattern", "consistency", "maintainability"],
        context: "unit_testing",
        metadata: { complexity: "medium", testing: "helpful" }
      },
      {
        id: "testing-mock_configuration-development",
        title: "Mock Configuration",
        description: "Mock configuration for Sitecore context and services",
        content: "Set up comprehensive mock configuration for Sitecore context, services, and dependencies for effective unit testing.",
        category: "testing",
        component: "mock_configuration",
        sdlcStage: "development",
        tags: ["testing", "mocking", "sitecore-context", "dependencies", "configuration"],
        context: "unit_testing",
        metadata: { complexity: "medium", testing: "required" }
      },
      {
        id: "testing-e2e_test-development",
        title: "E2E Test",
        description: "End-to-end test with Selenium WebDriver and page object pattern",
        content: "Implement end-to-end tests using Selenium WebDriver with page object pattern, cross-browser testing, and CI/CD integration.",
        category: "testing",
        component: "e2e_test",
        sdlcStage: "development",
        tags: ["testing", "e2e", "selenium", "page-object", "cross-browser", "cicd"],
        context: "integration_testing",
        metadata: { complexity: "high", testing: "comprehensive" }
      },

      // Styling (1 prompt)
      {
        id: "styling-scss_component-development",
        title: "SCSS Component",
        description: "Component styling following BEM methodology with responsive design",
        content: "Create SCSS component styles following BEM methodology with responsive design, CSS Grid/Flexbox, and accessibility considerations.",
        category: "styling",
        component: "scss_component",
        sdlcStage: "development",
        tags: ["styling", "scss", "bem", "responsive", "css-grid", "accessibility"],
        context: "implementation",
        metadata: { complexity: "medium", styling: "required" }
      },

      // SDLC Templates (13 prompts)
      {
        id: "sdlc_templates-user_story_template-development",
        title: "User Story Template",
        description: "Comprehensive user story template with acceptance criteria and definition of done",
        content: "Create a comprehensive user story template following agile best practices with clear acceptance criteria and definition of done.",
        category: "sdlc_templates",
        component: "user_story_template",
        sdlcStage: "development",
        tags: ["sdlc", "user-story", "agile", "requirements", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "low", documentation: "required" }
      },
      {
        id: "sdlc_templates-unit_test_suite-development",
        title: "Unit Test Suite",
        description: "Complete unit test suite template with mocking and test setup",
        content: "Generate a comprehensive unit test suite template with proper mocking, setup, and test structure for .NET applications.",
        category: "sdlc_templates",
        component: "unit_test_suite",
        sdlcStage: "development",
        tags: ["sdlc", "testing", "unit-test", "mocking", "template"],
        context: "unit_testing",
        metadata: { complexity: "medium", testing: "required" }
      },
      {
        id: "sdlc_templates-azure_devops_pipeline-development",
        title: "Azure DevOps Pipeline",
        description: "CI/CD pipeline template for Azure DevOps with build, test, and deployment stages",
        content: "Create a complete Azure DevOps CI/CD pipeline template with build, test, and deployment stages for .NET applications.",
        category: "sdlc_templates",
        component: "azure_devops_pipeline",
        sdlcStage: "development",
        tags: ["sdlc", "devops", "pipeline", "cicd", "azure", "template"],
        context: "deployment",
        metadata: { complexity: "high", devops: "required" }
      },
      {
        id: "sdlc_templates-technical_requirements-development",
        title: "Technical Requirements",
        description: "Comprehensive technical requirements document template",
        content: "Generate a detailed technical requirements document template covering functional, non-functional, and technical specifications.",
        category: "sdlc_templates",
        component: "technical_requirements",
        sdlcStage: "development",
        tags: ["sdlc", "requirements", "technical", "documentation", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "medium", documentation: "required" }
      },
      {
        id: "sdlc_templates-architecture_diagram-development",
        title: "Architecture Diagram",
        description: "Sitecore Helix architecture documentation and diagram template",
        content: "Create comprehensive architecture documentation with Helix layer structure, dependencies, and component diagrams.",
        category: "sdlc_templates",
        component: "architecture_diagram",
        sdlcStage: "development",
        tags: ["sdlc", "architecture", "helix", "documentation", "diagram", "template"],
        context: "technical_design",
        metadata: { complexity: "high", documentation: "required" }
      },
      {
        id: "sdlc_templates-api_specification-development",
        title: "API Specification",
        description: "RESTful API specification template with OpenAPI documentation",
        content: "Generate a complete API specification template with endpoint documentation, authentication, and error handling.",
        category: "sdlc_templates",
        component: "api_specification",
        sdlcStage: "development",
        tags: ["sdlc", "api", "specification", "openapi", "rest", "template"],
        context: "technical_design",
        metadata: { complexity: "medium", documentation: "required" }
      },
      {
        id: "sdlc_templates-data_model_design-development",
        title: "Data Model Design",
        description: "Sitecore data template design and Glass Mapper model template",
        content: "Create comprehensive data model design documentation with Sitecore template hierarchy and Glass Mapper models.",
        category: "sdlc_templates",
        component: "data_model_design",
        sdlcStage: "development",
        tags: ["sdlc", "data-model", "sitecore", "templates", "glass-mapper", "template"],
        context: "technical_design",
        metadata: { complexity: "medium", documentation: "required" }
      },
      {
        id: "sdlc_templates-security_requirements-development",
        title: "Security Requirements",
        description: "Security requirements and compliance documentation template",
        content: "Generate comprehensive security requirements documentation covering authentication, authorization, data protection, and compliance.",
        category: "sdlc_templates",
        component: "security_requirements",
        sdlcStage: "development",
        tags: ["sdlc", "security", "requirements", "compliance", "documentation", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "high", security: "required" }
      },
      {
        id: "sdlc_templates-performance_tests-development",
        title: "Performance Tests",
        description: "Performance testing suite template with load testing and monitoring",
        content: "Create a comprehensive performance testing suite template with load testing, benchmarks, and monitoring setup.",
        category: "sdlc_templates",
        component: "performance_tests",
        sdlcStage: "development",
        tags: ["sdlc", "performance", "testing", "load-testing", "monitoring", "template"],
        context: "integration_testing",
        metadata: { complexity: "high", testing: "performance" }
      },
      {
        id: "sdlc_templates-accessibility_testing-development",
        title: "Accessibility Testing",
        description: "WCAG compliance and accessibility testing template",
        content: "Generate comprehensive accessibility testing template covering WCAG 2.1 AA compliance, testing tools, and validation procedures.",
        category: "sdlc_templates",
        component: "accessibility_testing",
        sdlcStage: "development",
        tags: ["sdlc", "accessibility", "testing", "wcag", "compliance", "template"],
        context: "integration_testing",
        metadata: { complexity: "medium", accessibility: "required" }
      },
      {
        id: "sdlc_templates-docker_setup-development",
        title: "Docker Setup",
        description: "Docker containerization configuration template for development and deployment",
        content: "Create comprehensive Docker setup template with Dockerfile, docker-compose, and container orchestration for development and production.",
        category: "sdlc_templates",
        component: "docker_setup",
        sdlcStage: "development",
        tags: ["sdlc", "docker", "containerization", "deployment", "configuration", "template"],
        context: "deployment",
        metadata: { complexity: "high", devops: "required" }
      },
      {
        id: "sdlc_templates-monitoring_setup-development",
        title: "Monitoring Setup",
        description: "Application monitoring and observability configuration template",
        content: "Generate comprehensive monitoring setup template with application insights, health checks, logging, and alerting configuration.",
        category: "sdlc_templates",
        component: "monitoring_setup",
        sdlcStage: "development",
        tags: ["sdlc", "monitoring", "observability", "logging", "alerting", "template"],
        context: "maintenance",
        metadata: { complexity: "high", monitoring: "required" }
      },
      {
        id: "sdlc_templates-log_analysis-development",
        title: "Log Analysis",
        description: "Log analysis and management system template with ELK stack integration",
        content: "Create comprehensive log analysis template with structured logging, ELK stack integration, and log management procedures.",
        category: "sdlc_templates",
        component: "log_analysis",
        sdlcStage: "development",
        tags: ["sdlc", "logging", "analysis", "elk-stack", "management", "template"],
        context: "maintenance",
        metadata: { complexity: "high", monitoring: "required" }
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
