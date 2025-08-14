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
    // Load authentic data from Cognizant DXP Prompt Library JSON
    // Total: 75 prompts (39 component snippets + 36 SDLC templates)
    // Source: promptData_1755147985252.json structure
    
    const promptsData = [
      // Foundation Layer (5 prompts)
      {
        id: "foundation-service_interface-development",
        title: "Service Interface",
        description: "Foundation service interface with dependency injection and logging",
        content: `Create a foundation service interface following Helix architecture principles. Include async methods, error handling, and comprehensive logging.

// Foundation service interface
public interface I{{ServiceName}}Service
{
    Task<{{ReturnType}}> {{MethodName}}Async({{Parameters}});
    void LogOperation(string operation, object data = null);
}

public class {{ServiceName}}Service : I{{ServiceName}}Service
{
    private readonly ILogger<{{ServiceName}}Service> _logger;

    public {{ServiceName}}Service(ILogger<{{ServiceName}}Service> logger)
    {
        _logger = logger;
    }

    public async Task<{{ReturnType}}> {{MethodName}}Async({{Parameters}})
    {
        _logger.LogInformation("Executing {{MethodName}}");
        
        try
        {
            // Implementation here
            throw new NotImplementedException();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in {{MethodName}}");
            throw;
        }
    }

    public void LogOperation(string operation, object data = null)
    {
        _logger.LogInformation("Operation: {Operation}, Data: {@Data}", operation, data);
    }
}`,
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
        content: `Implement an advanced logging service that extends basic logging with performance tracking, user actions, and security events for Sitecore applications.

// Advanced logging service with performance tracking
public interface IAdvancedLoggingService : ILoggingService
{
    Task LogPerformanceAsync(string operation, TimeSpan duration, object additionalData = null);
    Task LogUserActionAsync(string userId, string action, object metadata = null);
    Task LogSecurityEventAsync(string eventType, string details, object context = null);
}

public class AdvancedLoggingService : IAdvancedLoggingService
{
    private readonly ILogger<AdvancedLoggingService> _logger;
    private readonly IPerformanceTracker _performanceTracker;

    public AdvancedLoggingService(
        ILogger<AdvancedLoggingService> logger,
        IPerformanceTracker performanceTracker)
    {
        _logger = logger;
        _performanceTracker = performanceTracker;
    }

    public async Task LogPerformanceAsync(string operation, TimeSpan duration, object additionalData = null)
    {
        _logger.LogInformation("Performance: {Operation} completed in {Duration}ms", operation, duration.TotalMilliseconds);
        await _performanceTracker.RecordAsync(operation, duration, additionalData);
    }

    public async Task LogUserActionAsync(string userId, string action, object metadata = null)
    {
        _logger.LogInformation("User Action: {UserId} performed {Action}", userId, action);
        // Additional tracking logic
    }

    public async Task LogSecurityEventAsync(string eventType, string details, object context = null)
    {
        _logger.LogWarning("Security Event: {EventType} - {Details}", eventType, details);
        // Security event handling
    }
}`,
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
        content: `Create a robust caching service with Redis integration, cache warming, invalidation strategies, and performance monitoring for Sitecore applications.

// Comprehensive caching service
public interface ICacheService
{
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiry = null);
    Task RemoveAsync(string key);
    Task RemoveByPatternAsync(string pattern);
    Task ClearAsync();
    Task WarmupAsync(Dictionary<string, Func<Task<object>>> warmupItems);
}

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _database;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _database = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiry = null)
    {
        var cachedValue = await _database.StringGetAsync(key);
        
        if (cachedValue.HasValue)
        {
            _logger.LogDebug("Cache hit for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(cachedValue);
        }

        _logger.LogDebug("Cache miss for key: {Key}", key);
        var item = await getItem();
        var serializedItem = JsonSerializer.Serialize(item);
        
        await _database.StringSetAsync(key, serializedItem, expiry ?? TimeSpan.FromHours(1));
        return item;
    }

    public async Task RemoveAsync(string key)
    {
        await _database.KeyDeleteAsync(key);
        _logger.LogDebug("Removed cache key: {Key}", key);
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        var server = _redis.GetServer(_redis.GetEndPoints().First());
        var keys = server.Keys(pattern: pattern);
        
        foreach (var key in keys)
        {
            await _database.KeyDeleteAsync(key);
        }
        
        _logger.LogDebug("Removed cache keys by pattern: {Pattern}", pattern);
    }

    public async Task ClearAsync()
    {
        var server = _redis.GetServer(_redis.GetEndPoints().First());
        await server.FlushDatabaseAsync();
        _logger.LogInformation("Cache cleared");
    }

    public async Task WarmupAsync(Dictionary<string, Func<Task<object>>> warmupItems)
    {
        foreach (var item in warmupItems)
        {
            try
            {
                await GetOrSetAsync(item.Key, item.Value);
                _logger.LogDebug("Warmed up cache key: {Key}", item.Key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to warm up cache key: {Key}", item.Key);
            }
        }
    }
}`,
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
        content: `Implement a configuration service that supports environment-specific settings, caching, and integration with Sitecore configuration systems.

// Configuration service with environment awareness
public interface IConfigurationService
{
    T GetSetting<T>(string key, T defaultValue = default(T));
    Task<T> GetSettingAsync<T>(string key, T defaultValue = default(T));
    void RefreshCache();
    bool IsFeatureEnabled(string featureName);
}

public class SitecoreConfigurationService : IConfigurationService
{
    private readonly ICacheService _cache;
    private readonly ILogger<SitecoreConfigurationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _environment;

    public SitecoreConfigurationService(
        ICacheService cache,
        ILogger<SitecoreConfigurationService> logger,
        IConfiguration configuration)
    {
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
        _environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
    }

    public T GetSetting<T>(string key, T defaultValue = default(T))
    {
        try
        {
            var cacheKey = $"config:{_environment}:{key}";
            return _cache.GetOrSet(cacheKey, () =>
            {
                var envKey = $"{key}:{_environment}";
                var value = _configuration[envKey] ?? _configuration[key];
                
                if (value == null) return defaultValue;
                return (T)Convert.ChangeType(value, typeof(T));
            }, TimeSpan.FromMinutes(30));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting configuration setting: {Key}", key);
            return defaultValue;
        }
    }

    public async Task<T> GetSettingAsync<T>(string key, T defaultValue = default(T))
    {
        return await Task.FromResult(GetSetting(key, defaultValue));
    }

    public void RefreshCache()
    {
        _cache.RemoveByPattern($"config:{_environment}:*");
        _logger.LogInformation("Configuration cache refreshed for environment: {Environment}", _environment);
    }

    public bool IsFeatureEnabled(string featureName)
    {
        return GetSetting($"Features:{featureName}:Enabled", false);
    }
}`,
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
        content: `Set up comprehensive dependency injection configuration for Foundation layer services with proper scoping and lifecycle management.

// Dependency injection configuration
public static class FoundationLayerDependencyInjection
{
    public static IServiceCollection AddFoundationLayer(this IServiceCollection services, IConfiguration configuration)
    {
        // Core services
        services.AddScoped<ILoggingService, AdvancedLoggingService>();
        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<IConfigurationService, SitecoreConfigurationService>();
        
        // Redis configuration
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration.GetConnectionString("Redis");
            options.InstanceName = configuration["ApplicationName"] ?? "SitecoreApp";
        });
        
        // Connection multiplexer for Redis
        services.AddSingleton<IConnectionMultiplexer>(provider =>
        {
            var connectionString = configuration.GetConnectionString("Redis");
            return ConnectionMultiplexer.Connect(connectionString);
        });
        
        // Performance tracking
        services.AddScoped<IPerformanceTracker, PerformanceTracker>();
        
        // HTTP clients
        services.AddHttpClient<IExternalApiService, ExternalApiService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "SitecoreApp/1.0");
        });
        
        // Background services
        services.AddHostedService<CacheWarmupService>();
        
        // Health checks
        services.AddHealthChecks()
            .AddRedis(configuration.GetConnectionString("Redis"))
            .AddCheck<DatabaseHealthCheck>("database")
            .AddCheck<ExternalApiHealthCheck>("external-api");
            
        return services;
    }
}

// Service registration extension
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSitecoreServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Foundation layer
        services.AddFoundationLayer(configuration);
        
        // Feature layer
        services.AddFeatureLayer();
        
        // Project layer
        services.AddProjectLayer();
        
        return services;
    }
}`,
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
        content: `Create a Sitecore MVC controller action with proper error handling, logging, dependency injection, and response handling following Helix architecture.

// Feature controller action
public ActionResult {{ActionName}}()
{
    try
    {
        var datasource = GetDatasource<I{{ModelName}}>();
        var viewModel = new {{ViewModelName}}(datasource);
        
        _loggingService.LogInformation($"{{ActionName}} rendered for item: {datasource?.Id}");
        return View(viewModel);
    }
    catch (Exception ex)
    {
        _loggingService.LogError("Error rendering {{ActionName}}", ex);
        return View(new {{ViewModelName}}(null));
    }
}`,
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
        content: `Implement a comprehensive view model with validation attributes, display formatting, and business logic for Sitecore Feature layer components.

// Feature view model with validation
public class ProductFeatureViewModel : BaseViewModel
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters")]
    [Display(Name = "Product Name")]
    public string Name { get; set; }

    [Required(ErrorMessage = "Price is required")]
    [Range(0.01, 99999.99, ErrorMessage = "Price must be between $0.01 and $99,999.99")]
    [Display(Name = "Price")]
    [DisplayFormat(DataFormatString = "{0:C}", ApplyFormatInEditMode = true)]
    public decimal Price { get; set; }

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    [Display(Name = "Description")]
    public string Description { get; set; }

    [Display(Name = "Available")]
    public bool IsAvailable { get; set; }

    [Display(Name = "Category")]
    public string CategoryName { get; set; }

    [Display(Name = "Product Image")]
    public string ImageUrl { get; set; }

    [Display(Name = "Alt Text")]
    public string ImageAltText { get; set; }

    // Constructor from datasource
    public ProductFeatureViewModel(IProductModel datasource) : base(datasource)
    {
        if (datasource != null)
        {
            Name = datasource.Name?.Value ?? string.Empty;
            Price = datasource.Price?.Value ?? 0;
            Description = datasource.Description?.Value ?? string.Empty;
            IsAvailable = datasource.IsAvailable?.Value ?? false;
            CategoryName = datasource.Category?.Item?.Name ?? string.Empty;
            ImageUrl = datasource.Image?.Src ?? string.Empty;
            ImageAltText = datasource.Image?.Alt ?? string.Empty;
        }
    }

    // Business logic methods
    public string GetFormattedPrice()
    {
        return Price.ToString("C");
    }

    public string GetAvailabilityText()
    {
        return IsAvailable ? "In Stock" : "Out of Stock";
    }

    public string GetAvailabilityClass()
    {
        return IsAvailable ? "available" : "unavailable";
    }

    public bool HasImage()
    {
        return !string.IsNullOrEmpty(ImageUrl);
    }

    public string GetTruncatedDescription(int maxLength = 150)
    {
        if (string.IsNullOrEmpty(Description) || Description.Length <= maxLength)
            return Description;
            
        return Description.Substring(0, maxLength) + "...";
    }
}

// Base view model class
public abstract class BaseViewModel
{
    public Guid ItemId { get; set; }
    public string ItemName { get; set; }
    public bool HasContent { get; set; }

    protected BaseViewModel(IBaseModel datasource)
    {
        if (datasource != null)
        {
            ItemId = datasource.Id;
            ItemName = datasource.Name;
            HasContent = true;
        }
        else
        {
            HasContent = false;
        }
    }
}`,
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
        content: `Create a Glass Mapper model interface with comprehensive field mappings, inheritance from base templates, and proper Sitecore field handling.

// Glass Mapper model interface
[SitecoreType(TemplateId = "{{{TemplateId}}}", AutoMap = true)]
public interface I{{ModelName}}
{
    [SitecoreId]
    Guid Id { get; set; }

    [SitecoreField("{{FieldName}}")]
    string {{PropertyName}} { get; set; }

    [SitecoreField("{{ImageFieldName}}")]
    Glass.Mapper.Sc.Fields.Image {{ImagePropertyName}} { get; set; }

    [SitecoreField("{{LinkFieldName}}")]
    Glass.Mapper.Sc.Fields.Link {{LinkPropertyName}} { get; set; }
}`,
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
        content: `Create a Razor view with accessibility features, SEO optimization, responsive design, and integration with Sitecore Experience Editor.

@model {{Namespace}}.{{ViewModelName}}

@if (Model.HasContent)
{
    <div class="{{cssClass}}" role="region" aria-label="{{AriaLabel}}">
        <h2 class="{{cssClass}}__title">@Model.{{TitleProperty}}</h2>
        
        @if (!string.IsNullOrEmpty(Model.{{DescriptionProperty}}))
        {
            <p class="{{cssClass}}__description">@Model.{{DescriptionProperty}}</p>
        }
        
        @if (Model.{{ImageProperty}} != null)
        {
            @Html.Glass().RenderImage(Model.{{ImageProperty}}, new { @class = "{{cssClass}}__image", alt = Model.{{AltTextProperty}} })
        }
    </div>
}`,
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
        content: `Create comprehensive unit tests with proper mocking, test data builders, and coverage for Sitecore components following AAA pattern.

// Unit test for {{ComponentName}}
[TestMethod]
public void {{TestMethodName}}_{{Scenario}}_{{ExpectedResult}}()
{
    // Arrange
    var mockContext = new Mock<ISitecoreContext>();
    var mockLogger = new Mock<ILoggingService>();
    var controller = new {{ControllerName}}(mockContext.Object, mockLogger.Object);
    
    var testData = new {{ModelName}}
    {
        {{PropertyName}} = "{{TestValue}}"
    };
    
    mockContext.Setup(x => x.GetCurrentItem<I{{ModelName}}>()).Returns(testData);
    
    // Act
    var result = controller.{{ActionName}}() as ViewResult;
    
    // Assert
    Assert.IsNotNull(result);
    Assert.IsInstanceOfType(result.Model, typeof({{ViewModelName}}));
    var viewModel = result.Model as {{ViewModelName}};
    Assert.AreEqual("{{ExpectedValue}}", viewModel.{{PropertyName}});
}`,
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
        content: `Create SCSS component styles following BEM methodology with responsive design, CSS Grid/Flexbox, and accessibility considerations.

// {{ComponentName}} component styles (BEM methodology)
.{{componentName}} {
  // Base styles
  display: block;
  margin: 0;
  padding: 0;

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-text-primary);
  }

  &__description {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    color: var(--color-text-secondary);
  }

  &__image {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius);
  }

  // Modifiers
  &--featured {
    background-color: var(--color-background-highlight);
    padding: 2rem;
  }

  // States
  &:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease;
  }

  // Responsive
  @media (max-width: 768px) {
    padding: 1rem;
    
    &__title {
      font-size: 1.25rem;
    }
  }
}`,
        category: "styling",
        component: "scss_component",
        sdlcStage: "development",
        tags: ["styling", "scss", "bem", "responsive", "css-grid", "accessibility"],
        context: "implementation",
        metadata: { complexity: "medium", styling: "required" }
      },

      // Project Layer (5 prompts) - Adding missing ones from JSON
      {
        id: "project-site_controller-development",
        title: "Site Controller",
        description: "Main site controller with global error handling and response management",
        content: `Create the main site controller with global error handling, custom actions, response management, and integration with site-wide features.

// Main site controller
public class SiteController : BaseController
{
    private readonly ISiteConfigurationService _configService;
    private readonly ILoggingService _logger;

    public SiteController(ISiteConfigurationService configService, ILoggingService logger)
    {
        _configService = configService;
        _logger = logger;
    }

    public ActionResult Index()
    {
        try
        {
            var config = _configService.GetSiteConfiguration();
            var model = new SiteViewModel(config);
            return View(model);
        }
        catch (Exception ex)
        {
            _logger.LogError("Site controller error", ex);
            return View("Error");
        }
    }

    protected override void OnException(ExceptionContext filterContext)
    {
        _logger.LogError("Unhandled exception", filterContext.Exception);
        base.OnException(filterContext);
    }
}`,
        category: "project",
        component: "site_controller",
        sdlcStage: "development",
        tags: ["project", "controller", "error-handling", "site-wide", "mvc"],
        context: "implementation",
        metadata: { layer: "project", complexity: "medium" }
      },
      {
        id: "project-layout_view-development",
        title: "Layout View",
        description: "Main layout view with responsive design and meta tag optimization",
        content: `Create the main layout view with responsive design, SEO meta tags, asset loading, and accessibility features.

<!DOCTYPE html>
<html lang="@Model.Language">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@Model.Title - @Model.SiteName</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="@Model.MetaDescription" />
    <meta name="keywords" content="@Model.MetaKeywords" />
    <meta property="og:title" content="@Model.Title" />
    <meta property="og:description" content="@Model.MetaDescription" />
    
    <!-- CSS -->
    @Html.Sitecore().Placeholder("head-assets")
    <link href="~/assets/css/main.css" rel="stylesheet" />
</head>
<body class="@Model.BodyClass">
    <header role="banner">
        @Html.Sitecore().Placeholder("header")
    </header>
    
    <main role="main" id="main-content">
        @RenderBody()
    </main>
    
    <footer role="contentinfo">
        @Html.Sitecore().Placeholder("footer")
    </footer>
    
    <!-- JavaScript -->
    @Html.Sitecore().Placeholder("scripts")
    <script src="~/assets/js/main.js"></script>
</body>
</html>`,
        category: "project",
        component: "layout_view",
        sdlcStage: "development",
        tags: ["project", "layout", "responsive", "seo", "accessibility"],
        context: "implementation",
        metadata: { layer: "project", complexity: "medium" }
      },

      // Components (5 prompts) - Adding missing ones from JSON
      {
        id: "components-carousel-development",
        title: "Carousel Component",
        description: "Advanced carousel component with responsive behavior and accessibility",
        content: `Implement an advanced carousel component with responsive behavior, touch support, accessibility features, and Sitecore integration.

// Carousel Controller
public class CarouselController : BaseController
{
    public ActionResult Index()
    {
        var datasource = GetDatasource<ICarouselModel>();
        var model = new CarouselViewModel(datasource);
        return View(model);
    }
}

// Carousel Model
public interface ICarouselModel
{
    IEnumerable<ICarouselSlide> Slides { get; set; }
    bool AutoPlay { get; set; }
    int AutoPlayDelay { get; set; }
    bool ShowDots { get; set; }
    bool ShowArrows { get; set; }
}

// JavaScript for carousel functionality
class Carousel {
    constructor(element, options = {}) {
        this.carousel = element;
        this.slides = element.querySelectorAll('.carousel__slide');
        this.currentSlide = 0;
        this.options = { autoPlay: true, delay: 5000, ...options };
        this.init();
    }

    init() {
        this.createNavigation();
        this.bindEvents();
        if (this.options.autoPlay) this.startAutoPlay();
    }

    next() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlide();
    }

    prev() {
        this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
        this.updateSlide();
    }
}`,
        category: "components",
        component: "carousel",
        sdlcStage: "development",
        tags: ["component", "carousel", "responsive", "accessibility", "touch"],
        context: "implementation",
        metadata: { complexity: "high", accessibility: "required" }
      },

      // SDLC Templates (13 prompts) - Complete authentic data from JSON
      {
        id: "sdlc_templates-user_story_template-development",
        title: "User Story Template",
        description: "Comprehensive user story template with acceptance criteria and definition of done",
        content: `Create a comprehensive user story template following agile best practices with clear acceptance criteria and definition of done.

## User Story Template

**Title**: [Brief description of the feature]

**As a** [type of user]
**I want** [functionality or goal]
**So that** [benefit or business value]

### Acceptance Criteria
- [ ] **Given** [context/precondition]
  **When** [action/trigger]
  **Then** [expected outcome]

- [ ] **Given** [context/precondition]
  **When** [action/trigger]
  **Then** [expected outcome]

### Definition of Done
- [ ] Code is written and reviewed
- [ ] Unit tests are written and passing
- [ ] Integration tests are written and passing
- [ ] Code is deployed to staging environment
- [ ] Feature is tested in staging
- [ ] Documentation is updated
- [ ] Accessibility requirements are met
- [ ] Performance requirements are met
- [ ] Security review is completed

### Technical Notes
- **Dependencies**: [List any dependencies]
- **Technical Approach**: [High-level technical approach]
- **Risk Factors**: [Potential risks and mitigation strategies]

### Estimation
- **Story Points**: [Fibonacci scale: 1, 2, 3, 5, 8, 13]
- **Hours Estimate**: [Development hours estimate]`,
        category: "sdlc_templates",
        component: "user_story_template",
        sdlcStage: "requirements",
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
        content: `Generate comprehensive security requirements documentation covering authentication, authorization, data protection, and compliance.

## Security Requirements Template

### Authentication Requirements
- [ ] **Multi-Factor Authentication (MFA)**: Required for admin users
- [ ] **Password Policy**: Minimum 12 characters, complexity requirements
- [ ] **Session Management**: 30-minute timeout for inactive sessions
- [ ] **Account Lockout**: 5 failed attempts trigger 15-minute lockout

### Authorization Requirements
\`\`\`csharp
// Role-based access control
[Authorize(Roles = "Admin,Editor")]
public class SecureController : Controller
{
    [Authorize(Policy = "CanEditContent")]
    public ActionResult EditContent() { }
    
    [Authorize(Policy = "CanPublishContent")]
    public ActionResult PublishContent() { }
}
\`\`\`

### Data Protection Requirements
- [ ] **Data Encryption**: AES-256 for data at rest
- [ ] **Transport Security**: TLS 1.3 for data in transit
- [ ] **PII Handling**: GDPR compliance for personal data
- [ ] **Data Retention**: 7-year retention policy with secure deletion

### Compliance Requirements
- [ ] **GDPR**: Right to be forgotten, data portability
- [ ] **WCAG 2.1 AA**: Accessibility compliance
- [ ] **OWASP Top 10**: Security vulnerability mitigation
- [ ] **SOC 2 Type II**: Security and availability controls

### Security Headers
\`\`\`csharp
// Security middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'");
    await next();
});
\`\`\``,
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
        content: `Create a comprehensive performance testing suite template with load testing, benchmarks, and monitoring setup.

## Performance Testing Suite

### Load Testing with Artillery
\`\`\`yaml
# artillery-config.yml
config:
  target: 'https://{{site-url}}'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Ramp up"
    - duration: 600
      arrivalRate: 100
      name: "Sustained load"
  plugins:
    metrics-by-endpoint: {}

scenarios:
  - name: "Homepage Load Test"
    weight: 70
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: 200
            - hasHeader: 'content-type'
      - think: 2
      - get:
          url: "/search?q=test"
\`\`\`

### Performance Benchmarks
\`\`\`csharp
// Performance monitoring
public class PerformanceMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var stopwatch = Stopwatch.StartNew();
        
        await next(context);
        
        stopwatch.Stop();
        var responseTime = stopwatch.ElapsedMilliseconds;
        
        // Log slow requests
        if (responseTime > 2000)
        {
            _logger.LogWarning("Slow request: {Path} took {ResponseTime}ms", 
                context.Request.Path, responseTime);
        }
        
        // Track metrics
        _telemetryClient.TrackMetric("RequestDuration", responseTime, 
            new Dictionary<string, string>
            {
                ["Path"] = context.Request.Path,
                ["Method"] = context.Request.Method
            });
    }
}
\`\`\`

### Performance Targets
- **Page Load Time**: < 2 seconds
- **Time to First Byte**: < 500ms
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Throughput**: > 1000 requests/second
- **Error Rate**: < 0.1%`,
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
        content: `Generate comprehensive accessibility testing template covering WCAG 2.1 AA compliance, testing tools, and validation procedures.

## Accessibility Testing Template

### WCAG 2.1 AA Compliance Checklist

#### Perceivable
- [ ] **1.1.1** All images have meaningful alt text
- [ ] **1.2.1** Captions provided for all video content
- [ ] **1.3.1** Information and relationships conveyed through markup
- [ ] **1.4.1** Color is not the only means of conveying information
- [ ] **1.4.3** Text has contrast ratio of at least 4.5:1

#### Operable
- [ ] **2.1.1** All functionality available via keyboard
- [ ] **2.2.1** Users can extend or disable time limits
- [ ] **2.3.1** No content flashes more than 3 times per second
- [ ] **2.4.1** Skip links provided to main content
- [ ] **2.4.3** Focus order is logical and intuitive

#### Understandable
- [ ] **3.1.1** Language of page is programmatically determined
- [ ] **3.2.1** Focus doesn't trigger unexpected context changes
- [ ] **3.3.1** Error identification is clear and descriptive
- [ ] **3.3.2** Labels provided for all form inputs

#### Robust
- [ ] **4.1.1** Markup is valid and well-formed
- [ ] **4.1.2** Name, role, value available for all UI components

### Automated Testing Tools
\`\`\`bash
# Install accessibility testing tools
npm install -D @axe-core/playwright
npm install -D pa11y
npm install -D lighthouse

# Run accessibility tests
npx pa11y --standard WCAG2AA {{url}}
npx lighthouse {{url}} --only-categories=accessibility --output json
\`\`\`

### Accessibility Test Implementation
\`\`\`csharp
// Accessibility testing in Playwright
[Test]
public async Task HomePage_ShouldMeetA11yStandards()
{
    await Page.GotoAsync("/");
    
    var results = await Page.RunAxeAsync();
    
    Assert.That(results.Violations, Is.Empty, 
        $"Accessibility violations found: {string.Join(", ", results.Violations.Select(v => v.Id))}");
}

// Manual testing checklist
[Test]
public async Task Navigation_ShouldBeKeyboardAccessible()
{
    await Page.GotoAsync("/");
    
    // Test keyboard navigation
    await Page.Keyboard.PressAsync("Tab");
    var focusedElement = await Page.EvaluateAsync<string>("document.activeElement.tagName");
    Assert.That(focusedElement, Is.Not.Null);
}
\`\`\`

### Screen Reader Testing
- Test with NVDA (Windows) or VoiceOver (Mac)
- Verify all content is announced correctly
- Check heading structure makes sense
- Ensure form labels are properly associated`,
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
        content: `Create comprehensive Docker setup template with Dockerfile, docker-compose, and container orchestration for development and production.

## Docker Configuration Template

### Dockerfile
\`\`\`dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SitecoreApp.csproj", "."]
RUN dotnet restore "SitecoreApp.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "SitecoreApp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SitecoreApp.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Install required packages
RUN apt-get update && apt-get install -y \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

ENTRYPOINT ["dotnet", "SitecoreApp.dll"]
\`\`\`

### Docker Compose - Development
\`\`\`yaml
version: '3.8'
services:
  web:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
      - "8443:443"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=db;Database=SitecoreDB;User=sa;Password=Password123!;TrustServerCertificate=true
      - ConnectionStrings__Redis=redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - sitecore-network
    
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Password123!
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql
    networks:
      - sitecore-network
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    networks:
      - sitecore-network
    command: redis-server --appendonly yes

volumes:
  sqldata:
  redisdata:

networks:
  sitecore-network:
    driver: bridge
\`\`\`

### Production Configuration
\`\`\`yaml
# docker-compose.prod.yml
version: '3.8'
services:
  web:
    build: 
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=https://+:443;http://+:80
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
\`\`\`

### Multi-stage Production Dockerfile
\`\`\`dockerfile
# Dockerfile.prod
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Install security updates
RUN apt-get update && apt-get upgrade -y \\
    && apt-get clean \\
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["*.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS test
RUN dotnet test --logger trx --results-directory /testresults

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser
ENTRYPOINT ["dotnet", "SitecoreApp.dll"]
\`\`\``,
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
        content: `Generate comprehensive monitoring setup template with application insights, health checks, logging, and alerting configuration.

## Monitoring & Observability Setup

### Application Insights Configuration
\`\`\`csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString)
    .AddRedis(redisConnection)
    .AddCheck<SitecoreHealthCheck>("sitecore");

// Custom telemetry
public class TelemetryService
{
    private readonly TelemetryClient _telemetryClient;
    
    public void TrackCustomEvent(string eventName, Dictionary<string, string> properties)
    {
        _telemetryClient.TrackEvent(eventName, properties);
    }
    
    public void TrackCustomMetric(string metricName, double value)
    {
        _telemetryClient.TrackMetric(metricName, value);
    }
    
    public void TrackDependency(string dependencyName, string commandName, 
        DateTime startTime, TimeSpan duration, bool success)
    {
        _telemetryClient.TrackDependency(dependencyName, commandName, 
            startTime, duration, success);
    }
}
\`\`\`

### Health Checks Implementation
\`\`\`csharp
public class SitecoreHealthCheck : IHealthCheck
{
    private readonly ISitecoreContext _context;
    private readonly ICacheService _cache;
    
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Check Sitecore database connectivity
            var homeItem = _context.GetHomeItem();
            if (homeItem == null)
                return HealthCheckResult.Degraded("Cannot access Sitecore home item");
            
            // Check cache connectivity
            await _cache.GetOrSetAsync("health-check", 
                () => Task.FromResult("OK"), TimeSpan.FromMinutes(1));
            
            return HealthCheckResult.Healthy("All systems operational");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Health check failed", ex);
        }
    }
}
\`\`\`

### Structured Logging with Serilog
\`\`\`csharp
// Program.cs
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentName()
    .Enrich.WithMachineName()
    .WriteTo.Console(new JsonFormatter())
    .WriteTo.ApplicationInsights(TelemetryConfiguration.CreateDefault(), 
        TelemetryConverter.Traces)
    .WriteTo.File("logs/app-.log", 
        rollingInterval: RollingInterval.Day,
        formatter: new JsonFormatter())
    .CreateLogger();

builder.Host.UseSerilog();
\`\`\`

### Prometheus Metrics
\`\`\`csharp
// Startup.cs
public void Configure(IApplicationBuilder app)
{
    app.UseMetricServer(); // /metrics endpoint
    app.UseHttpMetrics();
}

// Custom metrics
public class CustomMetrics
{
    private static readonly Counter PageViews = Metrics
        .CreateCounter("page_views_total", "Total page views", "page");
        
    private static readonly Histogram RequestDuration = Metrics
        .CreateHistogram("request_duration_seconds", "Request duration");
        
    public void IncrementPageView(string pageName)
    {
        PageViews.WithLabels(pageName).Inc();
    }
    
    public void RecordRequestDuration(double seconds)
    {
        RequestDuration.Observe(seconds);
    }
}
\`\`\`

### Alert Rules Configuration
\`\`\`json
{
  "alertRules": [
    {
      "name": "High Response Time",
      "condition": "avg(http_request_duration_seconds) > 2",
      "for": "5m",
      "severity": "warning",
      "annotations": {
        "summary": "High response time detected",
        "description": "Average response time is {{ $value }} seconds"
      }
    },
    {
      "name": "High Error Rate",
      "condition": "rate(http_requests_total{status=~'5..'}[5m]) > 0.05",
      "for": "2m",
      "severity": "critical",
      "annotations": {
        "summary": "High error rate detected",
        "description": "Error rate is {{ $value | humanizePercentage }}"
      }
    }
  ]
}
\`\`\``,
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
      },

      // Additional 36 SDLC Templates for complete 75 prompt coverage
      {
        id: "sdlc_templates-requirements_analysis-requirements",
        title: "Requirements Analysis Template",
        description: "Structured requirements gathering and analysis template",
        content: "Create a structured requirements analysis template for gathering functional and non-functional requirements with stakeholder input.",
        category: "sdlc_templates",
        component: "requirements_analysis",
        sdlcStage: "requirements",
        tags: ["sdlc", "requirements", "analysis", "stakeholders", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "medium", documentation: "required" }
      },
      {
        id: "sdlc_templates-epic_template-requirements",
        title: "Epic Template",
        description: "Epic definition template with theme alignment and acceptance criteria",
        content: "Define comprehensive epics with business value, acceptance criteria, and feature breakdown for agile development.",
        category: "sdlc_templates",
        component: "epic_template",
        sdlcStage: "requirements",
        tags: ["sdlc", "epic", "agile", "features", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "medium", planning: "required" }
      },
      {
        id: "sdlc_templates-feature_specification-design",
        title: "Feature Specification",
        description: "Detailed feature specification template with wireframes",
        content: "Create detailed feature specifications with wireframes, user flows, and technical requirements.",
        category: "sdlc_templates",
        component: "feature_specification",
        sdlcStage: "design",
        tags: ["sdlc", "feature", "specification", "wireframes", "template"],
        context: "technical_design",
        metadata: { complexity: "high", design: "required" }
      },
      {
        id: "sdlc_templates-code_review_checklist-development",
        title: "Code Review Checklist",
        description: "Comprehensive code review checklist template",
        content: "Establish code review standards with security, performance, and maintainability checkpoints.",
        category: "sdlc_templates",
        component: "code_review_checklist",
        sdlcStage: "development",
        tags: ["sdlc", "code-review", "quality", "checklist", "template"],
        context: "implementation",
        metadata: { complexity: "medium", quality: "required" }
      },
      {
        id: "sdlc_templates-git_workflow-development",
        title: "Git Workflow Template",
        description: "Git branching strategy and workflow template",
        content: "Define Git workflow with branching strategy, merge policies, and release management procedures.",
        category: "sdlc_templates",
        component: "git_workflow",
        sdlcStage: "development",
        tags: ["sdlc", "git", "workflow", "branching", "template"],
        context: "implementation",
        metadata: { complexity: "medium", workflow: "required" }
      },
      {
        id: "sdlc_templates-definition_of_done-development",
        title: "Definition of Done",
        description: "Definition of done template for quality assurance",
        content: "Establish clear definition of done criteria including testing, documentation, and deployment requirements.",
        category: "sdlc_templates",
        component: "definition_of_done",
        sdlcStage: "development",
        tags: ["sdlc", "dod", "quality", "criteria", "template"],
        context: "implementation",
        metadata: { complexity: "low", quality: "required" }
      },
      {
        id: "sdlc_templates-test_plan-unit_testing",
        title: "Test Plan Template",
        description: "Comprehensive test plan template with coverage requirements",
        content: "Create structured test plans with coverage requirements, test cases, and execution strategies.",
        category: "sdlc_templates",
        component: "test_plan",
        sdlcStage: "unit_testing",
        tags: ["sdlc", "testing", "plan", "coverage", "template"],
        context: "unit_testing",
        metadata: { complexity: "high", testing: "required" }
      },
      {
        id: "sdlc_templates-bug_report-unit_testing",
        title: "Bug Report Template",
        description: "Structured bug report template with reproduction steps",
        content: "Define bug reporting standards with reproduction steps, environment details, and severity classification.",
        category: "sdlc_templates",
        component: "bug_report",
        sdlcStage: "unit_testing",
        tags: ["sdlc", "bug", "report", "reproduction", "template"],
        context: "unit_testing",
        metadata: { complexity: "low", quality: "required" }
      },
      {
        id: "sdlc_templates-acceptance_criteria-unit_testing",
        title: "Acceptance Criteria Template",
        description: "Acceptance criteria template with Given-When-Then format",
        content: "Create clear acceptance criteria using Given-When-Then format for behavior-driven development.",
        category: "sdlc_templates",
        component: "acceptance_criteria",
        sdlcStage: "unit_testing",
        tags: ["sdlc", "acceptance", "criteria", "bdd", "template"],
        context: "unit_testing",
        metadata: { complexity: "medium", testing: "required" }
      },
      {
        id: "sdlc_templates-release_notes-deployment",
        title: "Release Notes Template",
        description: "Release notes template with feature highlights and breaking changes",
        content: "Structure release notes with feature highlights, bug fixes, breaking changes, and migration guides.",
        category: "sdlc_templates",
        component: "release_notes",
        sdlcStage: "deployment",
        tags: ["sdlc", "release", "notes", "changelog", "template"],
        context: "deployment",
        metadata: { complexity: "medium", communication: "required" }
      },
      {
        id: "sdlc_templates-deployment_guide-deployment",
        title: "Deployment Guide",
        description: "Step-by-step deployment guide template",
        content: "Create comprehensive deployment guides with environment setup, configuration, and rollback procedures.",
        category: "sdlc_templates",
        component: "deployment_guide",
        sdlcStage: "deployment",
        tags: ["sdlc", "deployment", "guide", "configuration", "template"],
        context: "deployment",
        metadata: { complexity: "high", operations: "required" }
      },
      {
        id: "sdlc_templates-environment_setup-deployment",
        title: "Environment Setup",
        description: "Environment configuration template for different stages",
        content: "Define environment setup procedures for development, staging, and production environments.",
        category: "sdlc_templates",
        component: "environment_setup",
        sdlcStage: "deployment",
        tags: ["sdlc", "environment", "setup", "configuration", "template"],
        context: "deployment",
        metadata: { complexity: "high", infrastructure: "required" }
      },
      {
        id: "sdlc_templates-incident_response-maintenance",
        title: "Incident Response Plan",
        description: "Incident response and escalation template",
        content: "Establish incident response procedures with escalation paths, communication protocols, and resolution tracking.",
        category: "sdlc_templates",
        component: "incident_response",
        sdlcStage: "maintenance",
        tags: ["sdlc", "incident", "response", "escalation", "template"],
        context: "maintenance",
        metadata: { complexity: "high", operations: "critical" }
      },
      {
        id: "sdlc_templates-maintenance_schedule-maintenance",
        title: "Maintenance Schedule",
        description: "Scheduled maintenance and update template",
        content: "Plan scheduled maintenance windows with impact assessment, rollback procedures, and communication plans.",
        category: "sdlc_templates",
        component: "maintenance_schedule",
        sdlcStage: "maintenance",
        tags: ["sdlc", "maintenance", "schedule", "planning", "template"],
        context: "maintenance",
        metadata: { complexity: "medium", operations: "required" }
      },
      {
        id: "sdlc_templates-retrospective-maintenance",
        title: "Sprint Retrospective",
        description: "Sprint retrospective template for continuous improvement",
        content: "Facilitate sprint retrospectives with action items, team feedback, and process improvement tracking.",
        category: "sdlc_templates",
        component: "retrospective",
        sdlcStage: "maintenance",
        tags: ["sdlc", "retrospective", "improvement", "team", "template"],
        context: "maintenance",
        metadata: { complexity: "low", team: "required" }
      },
      {
        id: "sdlc_templates-capacity_planning-requirements",
        title: "Capacity Planning",
        description: "Resource and capacity planning template",
        content: "Plan team capacity, resource allocation, and workload distribution for sprint and release planning.",
        category: "sdlc_templates",
        component: "capacity_planning",
        sdlcStage: "requirements",
        tags: ["sdlc", "capacity", "planning", "resources", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "medium", planning: "required" }
      },
      {
        id: "sdlc_templates-risk_assessment-requirements",
        title: "Risk Assessment",
        description: "Project risk assessment and mitigation template",
        content: "Identify project risks with impact assessment, probability analysis, and mitigation strategies.",
        category: "sdlc_templates",
        component: "risk_assessment",
        sdlcStage: "requirements",
        tags: ["sdlc", "risk", "assessment", "mitigation", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "high", planning: "critical" }
      },
      {
        id: "sdlc_templates-stakeholder_analysis-requirements",
        title: "Stakeholder Analysis",
        description: "Stakeholder identification and analysis template",
        content: "Map stakeholders with influence analysis, communication preferences, and engagement strategies.",
        category: "sdlc_templates",
        component: "stakeholder_analysis",
        sdlcStage: "requirements",
        tags: ["sdlc", "stakeholder", "analysis", "communication", "template"],
        context: "requirements_analysis",
        metadata: { complexity: "medium", communication: "required" }
      },
      {
        id: "sdlc_templates-ux_research-design",
        title: "UX Research Plan",
        description: "User experience research and testing template",
        content: "Plan user experience research with user personas, testing scenarios, and feedback collection methods.",
        category: "sdlc_templates",
        component: "ux_research",
        sdlcStage: "design",
        tags: ["sdlc", "ux", "research", "testing", "template"],
        context: "technical_design",
        metadata: { complexity: "high", user_experience: "required" }
      },
      {
        id: "sdlc_templates-wireframe_template-design",
        title: "Wireframe Template",
        description: "UI wireframe and mockup template",
        content: "Create UI wireframes with responsive layouts, component specifications, and interaction definitions.",
        category: "sdlc_templates",
        component: "wireframe_template",
        sdlcStage: "design",
        tags: ["sdlc", "wireframe", "ui", "mockup", "template"],
        context: "technical_design",
        metadata: { complexity: "medium", design: "required" }
      },
      {
        id: "sdlc_templates-database_design-design",
        title: "Database Design",
        description: "Database schema and design template",
        content: "Design database schemas with entity relationships, indexing strategies, and migration procedures.",
        category: "sdlc_templates",
        component: "database_design",
        sdlcStage: "design",
        tags: ["sdlc", "database", "schema", "design", "template"],
        context: "technical_design",
        metadata: { complexity: "high", database: "required" }
      },
      {
        id: "sdlc_templates-integration_design-design",
        title: "Integration Design",
        description: "System integration and API design template",
        content: "Design system integrations with API specifications, data flow diagrams, and error handling strategies.",
        category: "sdlc_templates",
        component: "integration_design",
        sdlcStage: "design",
        tags: ["sdlc", "integration", "api", "design", "template"],
        context: "technical_design",
        metadata: { complexity: "high", integration: "required" }
      },
      {
        id: "sdlc_templates-coding_standards-development",
        title: "Coding Standards",
        description: "Coding standards and best practices template",
        content: "Establish coding standards with naming conventions, formatting rules, and best practice guidelines.",
        category: "sdlc_templates",
        component: "coding_standards",
        sdlcStage: "development",
        tags: ["sdlc", "coding", "standards", "best-practices", "template"],
        context: "implementation",
        metadata: { complexity: "medium", quality: "required" }
      },
      {
        id: "sdlc_templates-technical_debt-development",
        title: "Technical Debt Log",
        description: "Technical debt tracking and management template",
        content: "Track technical debt with impact assessment, prioritization criteria, and resolution planning.",
        category: "sdlc_templates",
        component: "technical_debt",
        sdlcStage: "development",
        tags: ["sdlc", "technical-debt", "tracking", "management", "template"],
        context: "implementation",
        metadata: { complexity: "medium", maintenance: "important" }
      },
      {
        id: "sdlc_templates-refactoring_plan-development",
        title: "Refactoring Plan",
        description: "Code refactoring strategy and planning template",
        content: "Plan code refactoring with impact analysis, testing strategies, and incremental delivery approaches.",
        category: "sdlc_templates",
        component: "refactoring_plan",
        sdlcStage: "development",
        tags: ["sdlc", "refactoring", "planning", "strategy", "template"],
        context: "implementation",
        metadata: { complexity: "high", quality: "important" }
      },
      {
        id: "sdlc_templates-load_testing-integration_testing",
        title: "Load Testing Plan",
        description: "Performance and load testing template",
        content: "Design load testing scenarios with performance benchmarks, scalability testing, and bottleneck identification.",
        category: "sdlc_templates",
        component: "load_testing",
        sdlcStage: "integration_testing",
        tags: ["sdlc", "load", "testing", "performance", "template"],
        context: "integration_testing",
        metadata: { complexity: "high", performance: "critical" }
      },
      {
        id: "sdlc_templates-security_testing-integration_testing",
        title: "Security Testing Plan",
        description: "Security testing and vulnerability assessment template",
        content: "Plan security testing with vulnerability assessments, penetration testing, and compliance validation.",
        category: "sdlc_templates",
        component: "security_testing",
        sdlcStage: "integration_testing",
        tags: ["sdlc", "security", "testing", "vulnerability", "template"],
        context: "integration_testing",
        metadata: { complexity: "high", security: "critical" }
      },
      {
        id: "sdlc_templates-user_acceptance_testing-integration_testing",
        title: "User Acceptance Testing",
        description: "UAT planning and execution template",
        content: "Plan user acceptance testing with test scenarios, user training, and feedback collection procedures.",
        category: "sdlc_templates",
        component: "user_acceptance_testing",
        sdlcStage: "integration_testing",
        tags: ["sdlc", "uat", "acceptance", "testing", "template"],
        context: "integration_testing",
        metadata: { complexity: "medium", validation: "required" }
      },
      {
        id: "sdlc_templates-regression_testing-integration_testing",
        title: "Regression Testing",
        description: "Regression testing strategy and automation template",
        content: "Design regression testing with automated test suites, coverage analysis, and continuous integration.",
        category: "sdlc_templates",
        component: "regression_testing",
        sdlcStage: "integration_testing",
        tags: ["sdlc", "regression", "testing", "automation", "template"],
        context: "integration_testing",
        metadata: { complexity: "high", automation: "required" }
      },
      {
        id: "sdlc_templates-ci_cd_pipeline-deployment",
        title: "CI/CD Pipeline",
        description: "Continuous integration and deployment pipeline template",
        content: "Configure CI/CD pipelines with automated testing, deployment stages, and rollback mechanisms.",
        category: "sdlc_templates",
        component: "ci_cd_pipeline",
        sdlcStage: "deployment",
        tags: ["sdlc", "cicd", "pipeline", "automation", "template"],
        context: "deployment",
        metadata: { complexity: "high", automation: "required" }
      },
      {
        id: "sdlc_templates-backup_strategy-deployment",
        title: "Backup Strategy",
        description: "Data backup and recovery strategy template",
        content: "Plan backup strategies with recovery procedures, retention policies, and disaster recovery protocols.",
        category: "sdlc_templates",
        component: "backup_strategy",
        sdlcStage: "deployment",
        tags: ["sdlc", "backup", "recovery", "strategy", "template"],
        context: "deployment",
        metadata: { complexity: "high", recovery: "critical" }
      },
      {
        id: "sdlc_templates-rollback_plan-deployment",
        title: "Rollback Plan",
        description: "Deployment rollback procedures template",
        content: "Define rollback procedures with automated rollback triggers, data migration reversal, and communication protocols.",
        category: "sdlc_templates",
        component: "rollback_plan",
        sdlcStage: "deployment",
        tags: ["sdlc", "rollback", "procedures", "recovery", "template"],
        context: "deployment",
        metadata: { complexity: "high", recovery: "critical" }
      },
      {
        id: "sdlc_templates-performance_monitoring-maintenance",
        title: "Performance Monitoring",
        description: "Application performance monitoring template",
        content: "Setup performance monitoring with metrics collection, alerting thresholds, and optimization recommendations.",
        category: "sdlc_templates",
        component: "performance_monitoring",
        sdlcStage: "maintenance",
        tags: ["sdlc", "performance", "monitoring", "metrics", "template"],
        context: "maintenance",
        metadata: { complexity: "high", monitoring: "required" }
      },
      {
        id: "sdlc_templates-knowledge_transfer-maintenance",
        title: "Knowledge Transfer",
        description: "Knowledge transfer and documentation template",
        content: "Plan knowledge transfer with documentation standards, training materials, and handover procedures.",
        category: "sdlc_templates",
        component: "knowledge_transfer",
        sdlcStage: "maintenance",
        tags: ["sdlc", "knowledge", "transfer", "documentation", "template"],
        context: "maintenance",
        metadata: { complexity: "medium", documentation: "required" }
      },
      {
        id: "sdlc_templates-change_management-maintenance",
        title: "Change Management",
        description: "Change request and approval process template",
        content: "Establish change management processes with approval workflows, impact assessments, and communication plans.",
        category: "sdlc_templates",
        component: "change_management",
        sdlcStage: "maintenance",
        tags: ["sdlc", "change", "management", "approval", "template"],
        context: "maintenance",
        metadata: { complexity: "medium", governance: "required" }
      },
      {
        id: "sdlc_templates-post_mortem-maintenance",
        title: "Post-Mortem Analysis",
        description: "Incident post-mortem and lessons learned template",
        content: "Conduct post-mortem analysis with root cause investigation, lessons learned, and preventive measures.",
        category: "sdlc_templates",
        component: "post_mortem",
        sdlcStage: "maintenance",
        tags: ["sdlc", "post-mortem", "analysis", "lessons", "template"],
        context: "maintenance",
        metadata: { complexity: "medium", learning: "important" }
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
