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
        content: `Implement a feature service layer with async operations, caching integration, input validation, and comprehensive error handling.

// Feature service layer implementation
public interface IFeatureService
{
    Task<TResult> ProcessAsync<T, TResult>(T input) where T : class;
    Task<IEnumerable<TResult>> GetItemsAsync<TResult>(int pageSize = 10, int page = 1);
    Task<bool> ValidateInputAsync<T>(T input) where T : class;
    Task ClearCacheAsync(string pattern);
}

public class FeatureService : IFeatureService
{
    private readonly ICacheService _cacheService;
    private readonly ILoggingService _loggingService;
    private readonly IValidator<object> _validator;
    private readonly ISitecoreContext _sitecoreContext;

    public FeatureService(
        ICacheService cacheService,
        ILoggingService loggingService,
        IValidator<object> validator,
        ISitecoreContext sitecoreContext)
    {
        _cacheService = cacheService;
        _loggingService = loggingService;
        _validator = validator;
        _sitecoreContext = sitecoreContext;
    }

    public async Task<TResult> ProcessAsync<T, TResult>(T input) where T : class
    {
        try
        {
            // Input validation
            var isValid = await ValidateInputAsync(input);
            if (!isValid)
            {
                throw new ValidationException("Input validation failed");
            }

            // Check cache first
            var cacheKey = GenerateCacheKey<T>(input);
            var cachedResult = await _cacheService.GetOrSetAsync<TResult>(cacheKey, async () =>
            {
                _loggingService.LogInformation("Processing request for type {Type}", typeof(T).Name);
                
                // Business logic processing
                var result = await ProcessBusinessLogicAsync<T, TResult>(input);
                
                _loggingService.LogInformation("Successfully processed {Type}", typeof(T).Name);
                return result;
            }, TimeSpan.FromMinutes(15));

            return cachedResult;
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error processing {Type}", typeof(T).Name);
            throw;
        }
    }

    public async Task<IEnumerable<TResult>> GetItemsAsync<TResult>(int pageSize = 10, int page = 1)
    {
        var cacheKey = $"items:{typeof(TResult).Name}:page:{page}:size:{pageSize}";
        
        return await _cacheService.GetOrSetAsync(cacheKey, async () =>
        {
            _loggingService.LogInformation("Fetching items for {Type}, Page: {Page}, Size: {PageSize}", 
                typeof(TResult).Name, page, pageSize);

            // Implement your data fetching logic here
            var items = await FetchItemsFromDataSourceAsync<TResult>(pageSize, page);
            
            return items;
        }, TimeSpan.FromMinutes(10));
    }

    public async Task<bool> ValidateInputAsync<T>(T input) where T : class
    {
        if (input == null)
        {
            _loggingService.LogWarning("Null input provided for validation");
            return false;
        }

        try
        {
            var validationResult = await _validator.ValidateAsync(input);
            if (!validationResult.IsValid)
            {
                _loggingService.LogWarning("Validation failed for {Type}: {Errors}", 
                    typeof(T).Name, 
                    string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage)));
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error during validation for {Type}", typeof(T).Name);
            return false;
        }
    }

    public async Task ClearCacheAsync(string pattern)
    {
        await _cacheService.RemoveByPatternAsync(pattern);
        _loggingService.LogInformation("Cache cleared for pattern: {Pattern}", pattern);
    }

    private string GenerateCacheKey<T>(T input)
    {
        // Generate a unique cache key based on input properties
        var hash = input.GetHashCode();
        return $"{typeof(T).Name}:{hash}";
    }

    private async Task<TResult> ProcessBusinessLogicAsync<T, TResult>(T input)
    {
        // Implement your specific business logic here
        // This is where you would interact with Sitecore APIs, databases, external services, etc.
        await Task.Delay(1); // Placeholder for async operation
        
        // Example business logic
        return default(TResult);
    }

    private async Task<IEnumerable<TResult>> FetchItemsFromDataSourceAsync<TResult>(int pageSize, int page)
    {
        // Implement data fetching logic
        // This could be from Sitecore, database, API, etc.
        await Task.Delay(1); // Placeholder for async operation
        
        return new List<TResult>();
    }
}`,
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
        content: `Create a Project layer site controller with authentication, authorization, site-specific business logic, and proper error handling.

// Project layer site controller
[Authorize]
[Route("api/[controller]")]
[ApiController]
public class SiteController : ControllerBase
{
    private readonly ISiteService _siteService;
    private readonly ILogger<SiteController> _logger;
    private readonly IAuthorizationService _authorizationService;
    private readonly ICurrentUserService _currentUserService;

    public SiteController(
        ISiteService siteService,
        ILogger<SiteController> logger,
        IAuthorizationService authorizationService,
        ICurrentUserService currentUserService)
    {
        _siteService = siteService;
        _logger = logger;
        _authorizationService = authorizationService;
        _currentUserService = currentUserService;
    }

    [HttpGet("content/{*path}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetContent(string path)
    {
        try
        {
            _logger.LogInformation("Requesting content for path: {Path}", path);
            
            var content = await _siteService.GetContentByPathAsync(path);
            if (content == null)
            {
                _logger.LogWarning("Content not found for path: {Path}", path);
                return NotFound(new { message = "Content not found", path });
            }

            // Check if user has permission to view this content
            var authResult = await _authorizationService.AuthorizeAsync(User, content, "CanView");
            if (!authResult.Succeeded)
            {
                _logger.LogWarning("User {UserId} denied access to content: {Path}", 
                    _currentUserService.UserId, path);
                return Forbid();
            }

            return Ok(content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving content for path: {Path}", path);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("navigation")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNavigation()
    {
        try
        {
            var navigation = await _siteService.GetNavigationAsync();
            return Ok(navigation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving navigation");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("contact")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitContact([FromBody] ContactFormModel model)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Processing contact form submission from {Email}", model.Email);
            
            var result = await _siteService.ProcessContactFormAsync(model);
            if (result.Success)
            {
                _logger.LogInformation("Contact form submitted successfully for {Email}", model.Email);
                return Ok(new { message = "Thank you for your message. We'll get back to you soon." });
            }

            return BadRequest(new { message = result.ErrorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing contact form for {Email}", model?.Email);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            _logger.LogInformation("Search query: {Query}, Page: {Page}", query, page);
            
            var results = await _siteService.SearchAsync(query, page, pageSize);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing search for query: {Query}", query);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("user/profile")]
    [Authorize]
    public async Task<IActionResult> GetUserProfile()
    {
        try
        {
            var userId = _currentUserService.UserId;
            var profile = await _siteService.GetUserProfileAsync(userId);
            
            if (profile == null)
            {
                return NotFound(new { message = "User profile not found" });
            }

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile for user: {UserId}", _currentUserService.UserId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("user/profile")]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateUserProfile([FromBody] UserProfileModel model)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = _currentUserService.UserId;
            _logger.LogInformation("Updating profile for user: {UserId}", userId);
            
            var result = await _siteService.UpdateUserProfileAsync(userId, model);
            if (result.Success)
            {
                return Ok(new { message = "Profile updated successfully" });
            }

            return BadRequest(new { message = result.ErrorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile for user: {UserId}", _currentUserService.UserId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

// Supporting models
public class ContactFormModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; }

    [Required]
    [StringLength(500)]
    public string Message { get; set; }

    public string Phone { get; set; }
}

public class UserProfileModel
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; }

    [Required]
    [StringLength(100)]
    public string LastName { get; set; }

    [EmailAddress]
    public string Email { get; set; }

    public string Phone { get; set; }
    public string Company { get; set; }
}`,
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
        content: `Implement a master layout view with navigation, SEO meta tags, performance optimization, and responsive design for the Project layer.

@model BasePageViewModel
@inject IAssetService AssetService
@inject ISeoService SeoService
@{
    Layout = null;
    var seoData = SeoService.GetSeoData(Model);
    var preloadAssets = AssetService.GetPreloadAssets();
}

<!DOCTYPE html>
<html lang="@seoData.Language" dir="@seoData.Direction">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <!-- SEO Meta Tags -->
    <title>@seoData.Title</title>
    <meta name="description" content="@seoData.Description">
    <meta name="keywords" content="@seoData.Keywords">
    <meta name="author" content="@seoData.Author">
    <meta name="robots" content="@seoData.RobotsContent">
    
    <!-- Open Graph -->
    <meta property="og:title" content="@seoData.Title">
    <meta property="og:description" content="@seoData.Description">
    <meta property="og:image" content="@seoData.ImageUrl">
    <meta property="og:url" content="@seoData.CanonicalUrl">
    <meta property="og:type" content="@seoData.PageType">
    <meta property="og:site_name" content="@seoData.SiteName">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@seoData.Title">
    <meta name="twitter:description" content="@seoData.Description">
    <meta name="twitter:image" content="@seoData.ImageUrl">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="@seoData.CanonicalUrl">
    
    <!-- DNS Prefetch -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//cdn.example.com">
    
    <!-- Preload Critical Assets -->
    @foreach (var asset in preloadAssets)
    {
        @if (asset.EndsWith(".css"))
        {
            <link rel="preload" href="@asset" as="style" onload="this.onload=null;this.rel='stylesheet'">
            <noscript><link rel="stylesheet" href="@asset"></noscript>
        }
        else if (asset.EndsWith(".js"))
        {
            <link rel="preload" href="@asset" as="script">
        }
        else if (asset.Contains("font"))
        {
            <link rel="preload" href="@asset" as="font" type="font/woff2" crossorigin>
        }
    }
    
    <!-- Critical CSS Inline -->
    <style>
        /* Critical above-the-fold CSS */
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; }
        .header { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    </style>
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "@seoData.SchemaType",
        "name": "@seoData.Title",
        "description": "@seoData.Description",
        "url": "@seoData.CanonicalUrl",
        "image": "@seoData.ImageUrl"
    }
    </script>
    
    <!-- Analytics -->
    @if (!string.IsNullOrEmpty(seoData.GoogleAnalyticsId))
    {
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=@seoData.GoogleAnalyticsId"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '@seoData.GoogleAnalyticsId', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
            });
        </script>
    }
</head>

<body class="@ViewBag.BodyClass" data-page-type="@seoData.PageType">
    <!-- Skip to main content -->
    <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
    
    <!-- Header -->
    <header class="header" role="banner">
        <div class="container">
            @await Html.PartialAsync("_GlobalNavigation", Model.Navigation)
        </div>
    </header>
    
    <!-- Main Content -->
    <main id="main-content" role="main" tabindex="-1">
        @RenderBody()
    </main>
    
    <!-- Footer -->
    <footer class="footer" role="contentinfo">
        <div class="container">
            @await Html.PartialAsync("_Footer", Model.Footer)
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script src="@AssetService.GetAssetUrl("js/vendor.js")" defer></script>
    <script src="@AssetService.GetAssetUrl("js/main.js")" defer></script>
    
    @await RenderSectionAsync("Scripts", required: false)
    
    <!-- Service Worker Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
            });
        }
    </script>
</body>
</html>

/* Responsive CSS Grid Layout */
.layout-grid {
    display: grid;
    grid-template-areas: 
        "header header"
        "main sidebar"
        "footer footer";
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr 300px;
    min-height: 100vh;
}

@media (max-width: 768px) {
    .layout-grid {
        grid-template-areas: 
            "header"
            "main"
            "sidebar"
            "footer";
        grid-template-columns: 1fr;
    }
}`,
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
        content: `Set up Project layer site configuration with multi-site support, environment-specific settings, and integration with Sitecore site definitions.

// Project layer site configuration
<configuration>
  <configSections>
    <section name="sitecore" type="Sitecore.Configuration.ConfigReader, Sitecore.Kernel" />
  </configSections>
  
  <sitecore>
    <sites>
      <site name="website" 
            virtualFolder="/" 
            physicalFolder="/" 
            rootPath="/sitecore/content/Home" 
            startItem="/Home" 
            database="web" 
            domain="extranet" 
            allowDebug="true" 
            cacheHtml="true" 
            htmlCacheSize="50MB" 
            registryCacheSize="0" 
            viewStateCacheSize="0" 
            xslCacheSize="25MB" 
            filteredItemsCacheSize="10MB" 
            enablePreview="true" 
            enableWebEdit="true" 
            enableDebugger="true" 
            disableClientData="false" 
            hostName="localhost" />
            
      <site name="corporate" 
            virtualFolder="/corporate" 
            physicalFolder="/corporate" 
            rootPath="/sitecore/content/Corporate" 
            startItem="/Home" 
            database="web" 
            domain="extranet" 
            hostName="corporate.localhost" />
    </sites>
    
    <settings>
      <setting name="Analytics.Enabled" value="true" />
      <setting name="Experience.Analytics.Enabled" value="true" />
      <setting name="Caching.Enabled" value="true" />
      <setting name="ContentSearch.Enabled" value="true" />
    </settings>
    
    <pipelines>
      <httpRequestBegin>
        <processor type="Sitecore.Pipelines.HttpRequest.ItemResolver, Sitecore.Kernel" />
        <processor type="Sitecore.Pipelines.HttpRequest.LayoutResolver, Sitecore.Kernel" />
        <processor type="Sitecore.Pipelines.HttpRequest.RenderLayout, Sitecore.Kernel" />
      </httpRequestBegin>
    </pipelines>
  </sitecore>
</configuration>

// C# Configuration Service
public class SiteConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly ISitecoreContext _sitecoreContext;
    
    public SiteConfigurationService(IConfiguration configuration, ISitecoreContext sitecoreContext)
    {
        _configuration = configuration;
        _sitecoreContext = sitecoreContext;
    }
    
    public SiteInfo GetCurrentSite()
    {
        var site = Sitecore.Context.Site;
        return new SiteInfo
        {
            Name = site.Name,
            HostName = site.HostName,
            RootPath = site.RootPath,
            StartItem = site.StartItem,
            Database = site.Database?.Name
        };
    }
    
    public string GetSiteSpecificSetting(string key, string defaultValue = "")
    {
        var siteName = Sitecore.Context.Site?.Name ?? "default";
        var siteSpecificKey = $"Sites:{siteName}:{key}";
        return _configuration[siteSpecificKey] ?? _configuration[key] ?? defaultValue;
    }
}`,
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
        content: `Create a global navigation component with responsive behavior, accessibility features, and integration with Sitecore content tree structure.

// Global Navigation View Model
public class GlobalNavigationViewModel
{
    public IEnumerable<NavigationItem> MainNavigation { get; set; }
    public IEnumerable<NavigationItem> SecondaryNavigation { get; set; }
    public NavigationItem HomeItem { get; set; }
    public string CurrentPath { get; set; }
    public bool IsMobileMenuOpen { get; set; }
}

public class NavigationItem
{
    public string Title { get; set; }
    public string Url { get; set; }
    public string Target { get; set; }
    public bool IsActive { get; set; }
    public bool HasChildren { get; set; }
    public IEnumerable<NavigationItem> Children { get; set; }
    public string CssClass { get; set; }
    public int Level { get; set; }
}

// Navigation Service
public interface INavigationService
{
    Task<GlobalNavigationViewModel> GetGlobalNavigationAsync();
    Task<IEnumerable<NavigationItem>> GetBreadcrumbsAsync(string currentPath);
    bool IsCurrentPage(string itemPath, string currentPath);
}

public class NavigationService : INavigationService
{
    private readonly ISitecoreContext _sitecoreContext;
    private readonly ICacheService _cacheService;
    
    public NavigationService(ISitecoreContext sitecoreContext, ICacheService cacheService)
    {
        _sitecoreContext = sitecoreContext;
        _cacheService = cacheService;
    }
    
    public async Task<GlobalNavigationViewModel> GetGlobalNavigationAsync()
    {
        return await _cacheService.GetOrSetAsync("global-navigation", async () =>
        {
            var homeItem = _sitecoreContext.GetHomeItem<INavigationModel>();
            var currentPath = _sitecoreContext.GetCurrentItem()?.Paths?.FullPath ?? string.Empty;
            
            return new GlobalNavigationViewModel
            {
                MainNavigation = BuildNavigationItems(homeItem.MainNavigation, currentPath, 1),
                SecondaryNavigation = BuildNavigationItems(homeItem.SecondaryNavigation, currentPath, 1),
                HomeItem = new NavigationItem
                {
                    Title = homeItem.NavigationTitle?.Value ?? homeItem.Title?.Value,
                    Url = LinkManager.GetItemUrl(homeItem),
                    IsActive = IsCurrentPage(homeItem.Paths.FullPath, currentPath)
                },
                CurrentPath = currentPath
            };
        }, TimeSpan.FromMinutes(30));
    }
    
    private IEnumerable<NavigationItem> BuildNavigationItems(
        IEnumerable<INavigationModel> items, 
        string currentPath, 
        int level)
    {
        if (items == null) return Enumerable.Empty<NavigationItem>();
        
        return items.Where(item => item.ShowInNavigation?.Value == true)
                   .Select(item => new NavigationItem
                   {
                       Title = item.NavigationTitle?.Value ?? item.Title?.Value,
                       Url = LinkManager.GetItemUrl(item),
                       IsActive = IsCurrentPage(item.Paths.FullPath, currentPath),
                       HasChildren = item.Children?.Any(child => child.ShowInNavigation?.Value == true) == true,
                       Children = BuildNavigationItems(item.Children, currentPath, level + 1),
                       Level = level,
                       CssClass = $"nav-level-{level}"
                   });
    }
    
    public bool IsCurrentPage(string itemPath, string currentPath)
    {
        return string.Equals(itemPath, currentPath, StringComparison.OrdinalIgnoreCase) ||
               currentPath.StartsWith(itemPath + "/", StringComparison.OrdinalIgnoreCase);
    }
}

// Razor View
@model GlobalNavigationViewModel

<nav class="global-navigation" role="navigation" aria-label="Main navigation">
    <div class="nav-container">
        <a href="@Model.HomeItem.Url" class="nav-home @(Model.HomeItem.IsActive ? "active" : "")">
            @Model.HomeItem.Title
        </a>
        
        <button class="mobile-menu-toggle" 
                aria-expanded="@Model.IsMobileMenuOpen.ToString().ToLower()" 
                aria-controls="main-menu">
            <span class="sr-only">Toggle navigation</span>
            <span class="hamburger"></span>
        </button>
        
        <ul class="nav-menu" id="main-menu" role="menubar">
            @foreach (var item in Model.MainNavigation)
            {
                <li class="nav-item @item.CssClass @(item.IsActive ? "active" : "")" role="none">
                    @if (item.HasChildren)
                    {
                        <button class="nav-link dropdown-toggle" 
                                role="menuitem" 
                                aria-haspopup="true" 
                                aria-expanded="false">
                            @item.Title
                        </button>
                        <ul class="dropdown-menu" role="menu">
                            @foreach (var child in item.Children)
                            {
                                <li role="none">
                                    <a href="@child.Url" 
                                       class="dropdown-link @(child.IsActive ? "active" : "")" 
                                       role="menuitem">
                                        @child.Title
                                    </a>
                                </li>
                            }
                        </ul>
                    }
                    else
                    {
                        <a href="@item.Url" 
                           class="nav-link @(item.IsActive ? "active" : "")" 
                           role="menuitem">
                            @item.Title
                        </a>
                    }
                </li>
            }
        </ul>
    </div>
</nav>`,
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
        content: `Configure asset pipeline with bundling, minification, CDN integration, and cache busting for optimal web performance.

// Asset Pipeline Configuration - webpack.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        entry: {
            main: './src/js/main.js',
            vendor: './src/js/vendor.js'
        },
        
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? '[name].[contenthash].js' : '[name].js',
            publicPath: process.env.CDN_URL || '/dist/',
            clean: true
        },
        
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.scss$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 8 * 1024 // 8kb
                        }
                    },
                    generator: {
                        filename: 'images/[name].[contenthash][ext]'
                    }
                }
            ]
        },
        
        plugins: [
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: isProduction ? '[name].[contenthash].css' : '[name].css'
            })
        ],
        
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            },
            minimizer: isProduction ? [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true
                        }
                    }
                }),
                new OptimizeCSSAssetsPlugin()
            ] : []
        },
        
        devtool: isProduction ? 'source-map' : 'eval-source-map'
    };
};

// Asset Helper Service - C#
public interface IAssetService
{
    string GetAssetUrl(string assetPath);
    string GetCriticalCss();
    IEnumerable<string> GetPreloadAssets();
}

public class AssetService : IAssetService
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ICacheService _cache;
    private static readonly Dictionary<string, string> _manifest = new();
    
    public AssetService(
        IConfiguration configuration, 
        IWebHostEnvironment environment,
        ICacheService cache)
    {
        _configuration = configuration;
        _environment = environment;
        _cache = cache;
        LoadManifest();
    }
    
    public string GetAssetUrl(string assetPath)
    {
        var cdnUrl = _configuration["CDN:BaseUrl"];
        var hashedPath = _manifest.ContainsKey(assetPath) ? _manifest[assetPath] : assetPath;
        
        if (!string.IsNullOrEmpty(cdnUrl))
        {
            return $"{cdnUrl.TrimEnd('/')}/{hashedPath.TrimStart('/')}";
        }
        
        return $"/{hashedPath.TrimStart('/')}";
    }
    
    public string GetCriticalCss()
    {
        return _cache.GetOrSet("critical-css", () =>
        {
            var criticalCssPath = Path.Combine(_environment.WebRootPath, "css", "critical.css");
            return File.Exists(criticalCssPath) ? File.ReadAllText(criticalCssPath) : string.Empty;
        }, TimeSpan.FromHours(1));
    }
    
    public IEnumerable<string> GetPreloadAssets()
    {
        return new[]
        {
            GetAssetUrl("css/main.css"),
            GetAssetUrl("js/main.js"),
            GetAssetUrl("fonts/main.woff2")
        };
    }
    
    private void LoadManifest()
    {
        var manifestPath = Path.Combine(_environment.WebRootPath, "manifest.json");
        if (File.Exists(manifestPath))
        {
            var manifestContent = File.ReadAllText(manifestPath);
            var manifest = JsonSerializer.Deserialize<Dictionary<string, string>>(manifestContent);
            
            foreach (var kvp in manifest)
            {
                _manifest[kvp.Key] = kvp.Value;
            }
        }
    }
}

// Razor Helper
@using Microsoft.AspNetCore.Mvc.TagHelpers
@inject IAssetService AssetService

@{
    var preloadAssets = AssetService.GetPreloadAssets();
    var criticalCss = AssetService.GetCriticalCss();
}

<head>
    <!-- Critical CSS inlined -->
    @if (!string.IsNullOrEmpty(criticalCss))
    {
        <style>@Html.Raw(criticalCss)</style>
    }
    
    <!-- Preload critical assets -->
    @foreach (var asset in preloadAssets)
    {
        @if (asset.EndsWith(".css"))
        {
            <link rel="preload" href="@asset" as="style" onload="this.onload=null;this.rel='stylesheet'">
        }
        else if (asset.EndsWith(".js"))
        {
            <link rel="preload" href="@asset" as="script">
        }
        else if (asset.Contains("font"))
        {
            <link rel="preload" href="@asset" as="font" type="font/woff2" crossorigin>
        }
    }
    
    <!-- Non-critical CSS -->
    <link rel="stylesheet" href="@AssetService.GetAssetUrl("css/main.css")">
</head>`,
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
        content: `Implement an advanced carousel component with responsive behavior, touch support, accessibility features, and Sitecore integration.

// Carousel Component Implementation
public class CarouselController : Controller
{
    private readonly ICarouselService _carouselService;
    private readonly ICacheService _cacheService;
    
    public CarouselController(ICarouselService carouselService, ICacheService cacheService)
    {
        _carouselService = carouselService;
        _cacheService = cacheService;
    }
    
    public async Task<IActionResult> RenderCarousel(Guid datasourceId)
    {
        var cacheKey = $"carousel-{datasourceId}";
        var viewModel = await _cacheService.GetOrSetAsync(cacheKey, async () =>
        {
            return await _carouselService.GetCarouselViewModelAsync(datasourceId);
        }, TimeSpan.FromMinutes(30));
        
        return PartialView("_Carousel", viewModel);
    }
}

// Carousel Models
public class CarouselViewModel
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public IEnumerable<CarouselSlide> Slides { get; set; }
    public CarouselConfiguration Configuration { get; set; }
    public string CssClass { get; set; }
}

public class CarouselSlide
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string ImageUrl { get; set; }
    public string MobileImageUrl { get; set; }
    public string LinkUrl { get; set; }
    public string LinkTarget { get; set; }
    public string LinkText { get; set; }
    public string BackgroundColor { get; set; }
    public string TextColor { get; set; }
    public string Position { get; set; } // left, center, right
    public int Order { get; set; }
    public bool IsActive { get; set; }
}

public class CarouselConfiguration
{
    public bool AutoPlay { get; set; } = true;
    public int AutoPlayDelay { get; set; } = 5000;
    public bool ShowDots { get; set; } = true;
    public bool ShowArrows { get; set; } = true;
    public bool InfiniteLoop { get; set; } = true;
    public bool PauseOnHover { get; set; } = true;
    public bool TouchEnabled { get; set; } = true;
    public string TransitionEffect { get; set; } = "slide"; // slide, fade
    public int TransitionDuration { get; set; } = 300;
    public ResponsiveBreakpoints Responsive { get; set; } = new();
}

public class ResponsiveBreakpoints
{
    public int SlidesPerViewDesktop { get; set; } = 1;
    public int SlidesPerViewTablet { get; set; } = 1;
    public int SlidesPerViewMobile { get; set; } = 1;
    public int SpaceBetween { get; set; } = 0;
}

// Razor View - _Carousel.cshtml
@model CarouselViewModel

<div class="carousel-component @Model.CssClass" 
     data-carousel-id="@Model.Id"
     data-autoplay="@Model.Configuration.AutoPlay.ToString().ToLower()"
     data-autoplay-delay="@Model.Configuration.AutoPlayDelay"
     data-infinite="@Model.Configuration.InfiniteLoop.ToString().ToLower()"
     data-pause-on-hover="@Model.Configuration.PauseOnHover.ToString().ToLower()"
     data-touch-enabled="@Model.Configuration.TouchEnabled.ToString().ToLower()"
     data-transition-effect="@Model.Configuration.TransitionEffect"
     data-transition-duration="@Model.Configuration.TransitionDuration"
     role="region"
     aria-label="@Model.Title carousel">
     
    @if (!string.IsNullOrEmpty(Model.Title))
    {
        <h2 class="carousel-component__title sr-only">@Model.Title</h2>
    }
    
    <div class="carousel-container">
        <div class="carousel-wrapper" 
             aria-live="polite" 
             aria-atomic="false">
             
            <div class="carousel-track" 
                 style="transform: translateX(0%);">
                 
                @foreach (var (slide, index) in Model.Slides.Select((s, i) => (s, i)))
                {
                    <div class="carousel-slide @(slide.IsActive ? "active" : "")" 
                         data-slide-index="@index"
                         aria-hidden="@(!slide.IsActive).ToString().ToLower()"
                         style="@(!string.IsNullOrEmpty(slide.BackgroundColor) ? $"background-color: {slide.BackgroundColor};" : "")
                                @(!string.IsNullOrEmpty(slide.TextColor) ? $"color: {slide.TextColor};" : "")">
                         
                        <!-- Background Image -->
                        @if (!string.IsNullOrEmpty(slide.ImageUrl))
                        {
                            <div class="carousel-slide__background">
                                <picture>
                                    @if (!string.IsNullOrEmpty(slide.MobileImageUrl))
                                    {
                                        <source media="(max-width: 768px)" srcset="@slide.MobileImageUrl">
                                    }
                                    <img src="@slide.ImageUrl" 
                                         alt="@slide.Title" 
                                         class="carousel-slide__image"
                                         loading="@(index == 0 ? "eager" : "lazy")">
                                </picture>
                            </div>
                        }
                        
                        <!-- Content Overlay -->
                        <div class="carousel-slide__content carousel-slide__content--@slide.Position">
                            <div class="carousel-slide__inner">
                                @if (!string.IsNullOrEmpty(slide.Title))
                                {
                                    <h3 class="carousel-slide__title">@slide.Title</h3>
                                }
                                
                                @if (!string.IsNullOrEmpty(slide.Description))
                                {
                                    <p class="carousel-slide__description">@slide.Description</p>
                                }
                                
                                @if (!string.IsNullOrEmpty(slide.LinkUrl))
                                {
                                    <a href="@slide.LinkUrl" 
                                       class="carousel-slide__cta btn btn-primary"
                                       @(slide.LinkTarget != null ? Html.Raw($"target=\"{slide.LinkTarget}\"") : Html.Raw("")))>
                                        @(slide.LinkText ?? "Learn More")
                                    </a>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
        
        <!-- Navigation Arrows -->
        @if (Model.Configuration.ShowArrows && Model.Slides.Count() > 1)
        {
            <button class="carousel-nav carousel-nav--prev" 
                    type="button"
                    aria-label="Previous slide"
                    data-carousel-prev>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
            </button>
            
            <button class="carousel-nav carousel-nav--next" 
                    type="button"
                    aria-label="Next slide"
                    data-carousel-next>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
            </button>
        }
        
        <!-- Pagination Dots -->
        @if (Model.Configuration.ShowDots && Model.Slides.Count() > 1)
        {
            <div class="carousel-pagination" role="tablist" aria-label="Slide navigation">
                @foreach (var (slide, index) in Model.Slides.Select((s, i) => (s, i)))
                {
                    <button class="carousel-dot @(slide.IsActive ? "active" : "")" 
                            type="button"
                            role="tab"
                            aria-selected="@slide.IsActive.ToString().ToLower()"
                            aria-controls="slide-@index"
                            aria-label="Go to slide @(index + 1)"
                            data-slide-index="@index">
                        <span class="sr-only">Slide @(index + 1)</span>
                    </button>
                }
            </div>
        }
    </div>
    
    <!-- Screen Reader Announcements -->
    <div class="sr-only" aria-live="polite" aria-atomic="true" data-carousel-announcer></div>
</div>

<script>
class Carousel {
    constructor(element) {
        this.carousel = element;
        this.track = element.querySelector('.carousel-track');
        this.slides = element.querySelectorAll('.carousel-slide');
        this.prevBtn = element.querySelector('[data-carousel-prev]');
        this.nextBtn = element.querySelector('[data-carousel-next]');
        this.dots = element.querySelectorAll('.carousel-dot');
        this.announcer = element.querySelector('[data-carousel-announcer]');
        
        this.currentIndex = 0;
        this.isAnimating = false;
        this.autoPlayTimer = null;
        
        // Configuration
        this.config = {
            autoPlay: element.dataset.autoplay === 'true',
            autoPlayDelay: parseInt(element.dataset.autoplayDelay) || 5000,
            infinite: element.dataset.infinite === 'true',
            pauseOnHover: element.dataset.pauseOnHover === 'true',
            touchEnabled: element.dataset.touchEnabled === 'true',
            transitionEffect: element.dataset.transitionEffect || 'slide',
            transitionDuration: parseInt(element.dataset.transitionDuration) || 300
        };
        
        this.init();
    }
    
    init() {
        if (this.slides.length <= 1) return;
        
        this.setupEventListeners();
        this.setupTouchEvents();
        this.setupKeyboardNavigation();
        
        if (this.config.autoPlay) {
            this.startAutoPlay();
        }
        
        // Set initial ARIA attributes
        this.updateAriaAttributes();
    }
    
    setupEventListeners() {
        this.prevBtn?.addEventListener('click', () => this.goToPrevious());
        this.nextBtn?.addEventListener('click', () => this.goToNext());
        
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        if (this.config.pauseOnHover) {
            this.carousel.addEventListener('mouseenter', () => this.pauseAutoPlay());
            this.carousel.addEventListener('mouseleave', () => this.resumeAutoPlay());
        }
        
        // Intersection Observer for performance
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.resumeAutoPlay();
                    } else {
                        this.pauseAutoPlay();
                    }
                });
            });
            observer.observe(this.carousel);
        }
    }
    
    setupTouchEvents() {
        if (!this.config.touchEnabled) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            this.pauseAutoPlay();
        });
        
        this.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diffX = startX - currentX;
            
            // Add visual feedback during swipe
            this.track.style.transform = \`translateX(calc(-\${this.currentIndex * 100}% - \${diffX}px))\`;
        });
        
        this.track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const diffX = startX - currentX;
            const threshold = 50;
            
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    this.goToNext();
                } else {
                    this.goToPrevious();
                }
            } else {
                this.updateSlidePosition();
            }
            
            this.resumeAutoPlay();
        });
    }
    
    setupKeyboardNavigation() {
        this.carousel.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.goToPrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.goToNext();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                    break;
            }
        });
    }
    
    goToNext() {
        if (this.isAnimating) return;
        
        let nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.slides.length) {
            nextIndex = this.config.infinite ? 0 : this.currentIndex;
        }
        
        if (nextIndex !== this.currentIndex) {
            this.goToSlide(nextIndex);
        }
    }
    
    goToPrevious() {
        if (this.isAnimating) return;
        
        let prevIndex = this.currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.config.infinite ? this.slides.length - 1 : this.currentIndex;
        }
        
        if (prevIndex !== this.currentIndex) {
            this.goToSlide(prevIndex);
        }
    }
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex || index < 0 || index >= this.slides.length) {
            return;
        }
        
        this.isAnimating = true;
        this.currentIndex = index;
        
        this.updateSlidePosition();
        this.updateAriaAttributes();
        this.announceSlideChange();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, this.config.transitionDuration);
    }
    
    updateSlidePosition() {
        if (this.config.transitionEffect === 'fade') {
            this.slides.forEach((slide, index) => {
                slide.style.opacity = index === this.currentIndex ? '1' : '0';
            });
        } else {
            this.track.style.transform = \`translateX(-\${this.currentIndex * 100}%)\`;
        }
        
        // Update active states
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentIndex);
        });
        
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
            dot.setAttribute('aria-selected', index === this.currentIndex);
        });
    }
    
    updateAriaAttributes() {
        this.slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', index !== this.currentIndex);
        });
    }
    
    announceSlideChange() {
        const currentSlide = this.slides[this.currentIndex];
        const title = currentSlide.querySelector('.carousel-slide__title')?.textContent || '';
        const description = currentSlide.querySelector('.carousel-slide__description')?.textContent || '';
        
        this.announcer.textContent = \`Slide \${this.currentIndex + 1} of \${this.slides.length}: \${title} \${description}\`;
    }
    
    startAutoPlay() {
        if (this.config.autoPlay && this.slides.length > 1) {
            this.autoPlayTimer = setInterval(() => {
                this.goToNext();
            }, this.config.autoPlayDelay);
        }
    }
    
    pauseAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    resumeAutoPlay() {
        if (this.config.autoPlay && !this.autoPlayTimer) {
            this.startAutoPlay();
        }
    }
    
    destroy() {
        this.pauseAutoPlay();
        // Remove event listeners and cleanup
    }
}

// Initialize carousels
document.addEventListener('DOMContentLoaded', function() {
    const carousels = document.querySelectorAll('.carousel-component');
    carousels.forEach(carousel => new Carousel(carousel));
});
</script>`,
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
        content: `Create a dynamic form component with client/server validation, AJAX submission, file upload support, and integration with Sitecore Forms.

// Form Component Implementation
public class FormComponentController : Controller
{
    private readonly IFormService _formService;
    private readonly ILogger<FormComponentController> _logger;
    
    public FormComponentController(IFormService formService, ILogger<FormComponentController> logger)
    {
        _formService = formService;
        _logger = logger;
    }
    
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitForm([FromForm] FormSubmissionModel model, IFormFile[] files)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, errors = ModelState.GetErrorDictionary() });
            }
            
            var result = await _formService.ProcessFormSubmissionAsync(model, files);
            
            if (result.Success)
            {
                _logger.LogInformation("Form submitted successfully: {FormId}", model.FormId);
                return Json(new { success = true, message = result.Message, redirectUrl = result.RedirectUrl });
            }
            
            return Json(new { success = false, message = result.ErrorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing form submission");
            return Json(new { success = false, message = "An error occurred processing your submission" });
        }
    }
}

// Form View Model
public class FormComponentViewModel
{
    public string FormId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public IEnumerable<FormFieldViewModel> Fields { get; set; }
    public string SubmitButtonText { get; set; }
    public string Action { get; set; }
    public bool RequiresCaptcha { get; set; }
    public string CssClass { get; set; }
}

public class FormFieldViewModel
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Label { get; set; }
    public string Type { get; set; } // text, email, tel, textarea, select, checkbox, radio, file
    public bool Required { get; set; }
    public string Placeholder { get; set; }
    public IEnumerable<SelectOption> Options { get; set; }
    public Dictionary<string, object> Attributes { get; set; }
    public string ValidationPattern { get; set; }
    public string ValidationMessage { get; set; }
    public string CssClass { get; set; }
}

// Razor View
@model FormComponentViewModel

<form id="@Model.FormId" class="form-component @Model.CssClass" 
      action="@Model.Action" method="post" enctype="multipart/form-data"
      data-ajax="true" data-ajax-loading="#loading-@Model.FormId"
      data-ajax-success="onFormSuccess" data-ajax-failure="onFormError">
      
    @Html.AntiForgeryToken()
    <input type="hidden" name="FormId" value="@Model.FormId" />
    
    @if (!string.IsNullOrEmpty(Model.Title))
    {
        <h2 class="form-component__title">@Model.Title</h2>
    }
    
    @if (!string.IsNullOrEmpty(Model.Description))
    {
        <p class="form-component__description">@Model.Description</p>
    }
    
    <div class="form-component__fields">
        @foreach (var field in Model.Fields)
        {
            <div class="form-field @field.CssClass @(field.Required ? "required" : "")" data-field-type="@field.Type">
                <label for="@field.Id" class="form-field__label">
                    @field.Label
                    @if (field.Required)
                    {
                        <span class="required-indicator" aria-label="required">*</span>
                    }
                </label>
                
                @switch (field.Type.ToLower())
                {
                    case "textarea":
                        <textarea id="@field.Id" name="@field.Name" 
                                  class="form-field__input form-field__textarea"
                                  placeholder="@field.Placeholder"
                                  @(field.Required ? Html.Raw("required") : Html.Raw(""))
                                  @(field.ValidationPattern != null ? Html.Raw($"pattern=\"{field.ValidationPattern}\"") : Html.Raw(""))
                                  rows="4"></textarea>
                        break;
                        
                    case "select":
                        <select id="@field.Id" name="@field.Name" 
                                class="form-field__input form-field__select"
                                @(field.Required ? Html.Raw("required") : Html.Raw(""))>
                            <option value="">Choose...</option>
                            @foreach (var option in field.Options ?? Enumerable.Empty<SelectOption>())
                            {
                                <option value="@option.Value">@option.Text</option>
                            }
                        </select>
                        break;
                        
                    case "checkbox":
                        <div class="form-field__checkbox-group">
                            @foreach (var option in field.Options ?? Enumerable.Empty<SelectOption>())
                            {
                                <label class="form-field__checkbox-label">
                                    <input type="checkbox" name="@field.Name" value="@option.Value"
                                           class="form-field__checkbox" />
                                    <span class="form-field__checkbox-text">@option.Text</span>
                                </label>
                            }
                        </div>
                        break;
                        
                    case "radio":
                        <div class="form-field__radio-group" role="radiogroup">
                            @foreach (var option in field.Options ?? Enumerable.Empty<SelectOption>())
                            {
                                <label class="form-field__radio-label">
                                    <input type="radio" name="@field.Name" value="@option.Value"
                                           class="form-field__radio" @(field.Required ? Html.Raw("required") : Html.Raw("")) />
                                    <span class="form-field__radio-text">@option.Text</span>
                                </label>
                            }
                        </div>
                        break;
                        
                    case "file":
                        <input type="file" id="@field.Id" name="@field.Name"
                               class="form-field__input form-field__file"
                               @(field.Required ? Html.Raw("required") : Html.Raw(""))
                               accept="@field.Attributes?["accept"]"
                               @(field.Attributes?.ContainsKey("multiple") == true ? Html.Raw("multiple") : Html.Raw("")) />
                        break;
                        
                    default:
                        <input type="@field.Type" id="@field.Id" name="@field.Name"
                               class="form-field__input"
                               placeholder="@field.Placeholder"
                               @(field.Required ? Html.Raw("required") : Html.Raw(""))
                               @(field.ValidationPattern != null ? Html.Raw($"pattern=\"{field.ValidationPattern}\"") : Html.Raw("")) />
                        break;
                }
                
                @if (!string.IsNullOrEmpty(field.ValidationMessage))
                {
                    <div class="form-field__error" role="alert" aria-live="polite"></div>
                }
            </div>
        }
    </div>
    
    @if (Model.RequiresCaptcha)
    {
        <div class="form-field">
            <div class="g-recaptcha" data-sitekey="@ViewBag.RecaptchaSiteKey"></div>
        </div>
    }
    
    <div class="form-component__actions">
        <button type="submit" class="form-component__submit btn btn-primary">
            <span class="submit-text">@Model.SubmitButtonText</span>
            <span class="loading-text" style="display: none;">Submitting...</span>
        </button>
    </div>
    
    <div id="loading-@Model.FormId" class="form-loading" style="display: none;">
        <div class="spinner"></div>
    </div>
    
    <div class="form-messages" role="status" aria-live="polite"></div>
</form>

<script>
function onFormSuccess(data) {
    const form = event.target.closest('form');
    const messagesContainer = form.querySelector('.form-messages');
    
    if (data.success) {
        messagesContainer.innerHTML = '<div class="alert alert-success">' + data.message + '</div>';
        form.reset();
        
        if (data.redirectUrl) {
            setTimeout(() => window.location.href = data.redirectUrl, 2000);
        }
    } else {
        messagesContainer.innerHTML = '<div class="alert alert-error">' + data.message + '</div>';
    }
}

function onFormError() {
    const form = event.target.closest('form');
    const messagesContainer = form.querySelector('.form-messages');
    messagesContainer.innerHTML = '<div class="alert alert-error">An error occurred. Please try again.</div>';
}
</script>`,
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
        content: `Implement a responsive navigation component with multi-level menus, breadcrumbs, search integration, and mobile-first design.

// Navigation Component Implementation
public class NavigationComponentController : Controller
{
    private readonly INavigationService _navigationService;
    private readonly ICacheService _cacheService;
    
    public NavigationComponentController(INavigationService navigationService, ICacheService cacheService)
    {
        _navigationService = navigationService;
        _cacheService = cacheService;
    }
    
    public async Task<IActionResult> RenderNavigation()
    {
        var viewModel = await _cacheService.GetOrSetAsync("navigation-component", async () =>
        {
            return await _navigationService.GetNavigationViewModelAsync();
        }, TimeSpan.FromMinutes(30));
        
        return PartialView("_NavigationComponent", viewModel);
    }
}

// Navigation View Model
public class NavigationComponentViewModel
{
    public IEnumerable<NavigationItem> MainNavigation { get; set; }
    public IEnumerable<BreadcrumbItem> Breadcrumbs { get; set; }
    public NavigationItem HomeItem { get; set; }
    public SearchConfiguration SearchConfig { get; set; }
    public string CurrentUrl { get; set; }
    public bool IsMobileMenuOpen { get; set; }
    public string CssClass { get; set; }
}

public class BreadcrumbItem
{
    public string Title { get; set; }
    public string Url { get; set; }
    public bool IsCurrentPage { get; set; }
    public string Schema { get; set; }
}

public class SearchConfiguration
{
    public bool Enabled { get; set; }
    public string Placeholder { get; set; }
    public string SearchUrl { get; set; }
    public bool AutoComplete { get; set; }
    public int MinCharacters { get; set; }
}

// Razor View - _NavigationComponent.cshtml
@model NavigationComponentViewModel

<nav class="navigation-component @Model.CssClass" role="navigation" aria-label="Main navigation">
    <div class="navigation-component__container">
        <!-- Mobile Menu Toggle -->
        <button class="navigation-component__mobile-toggle" 
                type="button"
                aria-expanded="@Model.IsMobileMenuOpen.ToString().ToLower()"
                aria-controls="main-navigation-menu"
                aria-label="Toggle navigation menu">
            <span class="mobile-toggle__icon">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </span>
            <span class="mobile-toggle__text">Menu</span>
        </button>
        
        <!-- Brand/Home Link -->
        @if (Model.HomeItem != null)
        {
            <a href="@Model.HomeItem.Url" class="navigation-component__brand" aria-label="Go to homepage">
                @Model.HomeItem.Title
            </a>
        }
        
        <!-- Search Component -->
        @if (Model.SearchConfig?.Enabled == true)
        {
            <div class="navigation-component__search">
                <form class="search-form" action="@Model.SearchConfig.SearchUrl" method="get" role="search">
                    <div class="search-form__input-group">
                        <label for="nav-search" class="sr-only">Search</label>
                        <input type="search" 
                               id="nav-search"
                               name="q" 
                               class="search-form__input"
                               placeholder="@Model.SearchConfig.Placeholder"
                               autocomplete="off"
                               @(Model.SearchConfig.AutoComplete ? Html.Raw("data-autocomplete=\"true\"") : Html.Raw(""))
                               data-min-chars="@Model.SearchConfig.MinCharacters">
                        <button type="submit" class="search-form__button" aria-label="Search">
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                                <path d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.39zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="search-form__suggestions" aria-live="polite"></div>
                </form>
            </div>
        }
        
        <!-- Main Navigation Menu -->
        <div class="navigation-component__menu-wrapper" id="main-navigation-menu">
            <ul class="navigation-component__menu" role="menubar">
                @foreach (var item in Model.MainNavigation ?? Enumerable.Empty<NavigationItem>())
                {
                    <li class="navigation-item @(item.HasChildren ? "has-children" : "") @(item.IsActive ? "active" : "")" 
                        role="none">
                        @if (item.HasChildren)
                        {
                            <button class="navigation-item__toggle" 
                                    role="menuitem"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                    aria-controls="submenu-@item.Id">
                                <span class="navigation-item__text">@item.Title</span>
                                <span class="navigation-item__icon" aria-hidden="true">▼</span>
                            </button>
                            
                            <ul class="navigation-item__submenu" 
                                id="submenu-@item.Id"
                                role="menu"
                                aria-label="@item.Title submenu">
                                @foreach (var child in item.Children ?? Enumerable.Empty<NavigationItem>())
                                {
                                    <li class="submenu-item @(child.IsActive ? "active" : "")" role="none">
                                        <a href="@child.Url" 
                                           class="submenu-item__link"
                                           role="menuitem"
                                           @(child.Target != null ? Html.Raw($"target=\"{child.Target}\"") : Html.Raw(""))>
                                            @child.Title
                                        </a>
                                    </li>
                                }
                            </ul>
                        }
                        else
                        {
                            <a href="@item.Url" 
                               class="navigation-item__link @(item.IsActive ? "active" : "")"
                               role="menuitem"
                               @(item.Target != null ? Html.Raw($"target=\"{item.Target}\"") : Html.Raw(""))>
                                @item.Title
                            </a>
                        }
                    </li>
                }
            </ul>
        </div>
    </div>
    
    <!-- Breadcrumbs -->
    @if (Model.Breadcrumbs?.Any() == true)
    {
        <div class="navigation-component__breadcrumbs">
            <nav aria-label="Breadcrumb" class="breadcrumbs">
                <ol class="breadcrumbs__list" vocab="https://schema.org/" typeof="BreadcrumbList">
                    @foreach (var (breadcrumb, index) in Model.Breadcrumbs.Select((b, i) => (b, i)))
                    {
                        <li class="breadcrumbs__item @(breadcrumb.IsCurrentPage ? "current" : "")" 
                            property="itemListElement" typeof="ListItem">
                            @if (breadcrumb.IsCurrentPage)
                            {
                                <span class="breadcrumbs__text" property="name" aria-current="page">
                                    @breadcrumb.Title
                                </span>
                            }
                            else
                            {
                                <a href="@breadcrumb.Url" class="breadcrumbs__link" property="item" typeof="WebPage">
                                    <span property="name">@breadcrumb.Title</span>
                                </a>
                            }
                            <meta property="position" content="@(index + 1)" />
                        </li>
                    }
                </ol>
            </nav>
        </div>
    }
</nav>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('.navigation-component');
    const mobileToggle = nav.querySelector('.navigation-component__mobile-toggle');
    const menuWrapper = nav.querySelector('.navigation-component__menu-wrapper');
    
    // Mobile menu toggle
    mobileToggle?.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        menuWrapper.classList.toggle('open');
        document.body.classList.toggle('nav-open');
    });
    
    // Submenu toggles
    nav.querySelectorAll('.navigation-item__toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const submenu = this.nextElementSibling;
            
            // Close other submenus
            nav.querySelectorAll('.navigation-item__toggle').forEach(other => {
                if (other !== this) {
                    other.setAttribute('aria-expanded', 'false');
                    other.nextElementSibling?.classList.remove('open');
                }
            });
            
            this.setAttribute('aria-expanded', !isExpanded);
            submenu?.classList.toggle('open');
        });
    });
    
    // Search autocomplete
    const searchInput = nav.querySelector('[data-autocomplete="true"]');
    if (searchInput) {
        let searchTimeout;
        const suggestionsContainer = nav.querySelector('.search-form__suggestions');
        const minChars = parseInt(searchInput.dataset.minChars) || 3;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length >= minChars) {
                searchTimeout = setTimeout(() => {
                    fetchSearchSuggestions(query, suggestionsContainer);
                }, 300);
            } else {
                suggestionsContainer.innerHTML = '';
            }
        });
    }
    
    // Close menus on outside click
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target)) {
            mobileToggle?.setAttribute('aria-expanded', 'false');
            menuWrapper?.classList.remove('open');
            document.body.classList.remove('nav-open');
            
            nav.querySelectorAll('.navigation-item__toggle').forEach(toggle => {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.nextElementSibling?.classList.remove('open');
            });
        }
    });
});

async function fetchSearchSuggestions(query, container) {
    try {
        const response = await fetch(\`/api/search/suggestions?q=\${encodeURIComponent(query)}\`);
        const data = await response.json();
        
        if (data.suggestions?.length > 0) {
            container.innerHTML = data.suggestions
                .map(suggestion => \`<div class="search-suggestion" data-url="\${suggestion.url}">\${suggestion.title}</div>\`)
                .join('');
        } else {
            container.innerHTML = '';
        }
    } catch (error) {
        console.error('Search suggestions error:', error);
        container.innerHTML = '';
    }
}
</script>`,
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
        content: `Create an intelligent search component with auto-complete, faceted filtering, result highlighting, and integration with Sitecore Content Search.

// Search Component Implementation
public class SearchComponentController : Controller
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchComponentController> _logger;
    
    public SearchComponentController(ISearchService searchService, ILogger<SearchComponentController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }
    
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] SearchRequestModel request)
    {
        try
        {
            var results = await _searchService.SearchAsync(request);
            
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return Json(results);
            }
            
            return View("SearchResults", results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing search for query: {Query}", request.Query);
            return Json(new { error = "Search failed. Please try again." });
        }
    }
    
    [HttpGet]
    public async Task<IActionResult> Suggestions([FromQuery] string q, [FromQuery] int max = 5)
    {
        try
        {
            var suggestions = await _searchService.GetSuggestionsAsync(q, max);
            return Json(new { suggestions });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions for: {Query}", q);
            return Json(new { suggestions = Array.Empty<object>() });
        }
    }
}

// Search Models
public class SearchRequestModel
{
    public string Query { get; set; } = "";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Dictionary<string, string[]> Facets { get; set; } = new();
    public string SortBy { get; set; } = "relevance";
    public string[] ContentTypes { get; set; } = Array.Empty<string>();
}

public class SearchResultsViewModel
{
    public string Query { get; set; }
    public int TotalResults { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public IEnumerable<SearchResultItem> Results { get; set; }
    public Dictionary<string, FacetGroup> Facets { get; set; }
    public SearchStatistics Statistics { get; set; }
    public string[] SuggestionQuery { get; set; }
}

public class SearchResultItem
{
    public string Id { get; set; }
    public string Title { get; set; }
    public string Url { get; set; }
    public string Excerpt { get; set; }
    public string ContentType { get; set; }
    public DateTime LastModified { get; set; }
    public string ImageUrl { get; set; }
    public Dictionary<string, object> Fields { get; set; }
    public double Score { get; set; }
}

public class FacetGroup
{
    public string Name { get; set; }
    public string DisplayName { get; set; }
    public IEnumerable<FacetValue> Values { get; set; }
}

public class FacetValue
{
    public string Value { get; set; }
    public string DisplayValue { get; set; }
    public int Count { get; set; }
    public bool Selected { get; set; }
}

// Razor View - SearchComponent.cshtml
@model SearchResultsViewModel

<div class="search-component" data-search-url="@Url.Action("Search")" data-suggestions-url="@Url.Action("Suggestions")">
    <!-- Search Form -->
    <form class="search-component__form" method="get" role="search">
        <div class="search-form-container">
            <div class="search-input-group">
                <label for="search-query" class="sr-only">Search</label>
                <input type="search" 
                       id="search-query"
                       name="query" 
                       value="@Model.Query"
                       class="search-input"
                       placeholder="What are you looking for?"
                       autocomplete="off"
                       data-autocomplete="true"
                       data-min-chars="2"
                       required>
                <button type="submit" class="search-button" aria-label="Search">
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.39zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z"/>
                    </svg>
                </button>
            </div>
            
            <!-- Auto-complete suggestions -->
            <div class="search-suggestions" role="listbox" aria-label="Search suggestions"></div>
            
            <!-- Advanced filters -->
            <div class="search-filters">
                <button type="button" class="filters-toggle" aria-expanded="false" aria-controls="advanced-filters">
                    Advanced Filters
                    <span class="filters-toggle__icon" aria-hidden="true">▼</span>
                </button>
                
                <div id="advanced-filters" class="advanced-filters" hidden>
                    <div class="filter-group">
                        <label for="content-type">Content Type:</label>
                        <select name="contentTypes" id="content-type" multiple>
                            <option value="page">Pages</option>
                            <option value="article">Articles</option>
                            <option value="product">Products</option>
                            <option value="media">Media</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="sort-by">Sort by:</label>
                        <select name="sortBy" id="sort-by">
                            <option value="relevance">Relevance</option>
                            <option value="date">Date</option>
                            <option value="title">Title</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </form>
    
    @if (!string.IsNullOrEmpty(Model.Query))
    {
        <!-- Search Results -->
        <div class="search-results">
            <!-- Results Header -->
            <div class="search-results__header">
                <h2 class="search-results__title">
                    Search Results for "@Model.Query"
                </h2>
                <div class="search-results__stats">
                    @if (Model.TotalResults > 0)
                    {
                        <span>@Model.TotalResults.ToString("N0") results found in @Model.Statistics.Duration.TotalMilliseconds.ToString("F0")ms</span>
                    }
                    else
                    {
                        <span>No results found</span>
                    }
                </div>
            </div>
            
            @if (Model.TotalResults > 0)
            {
                <div class="search-results__container">
                    <!-- Faceted Navigation -->
                    @if (Model.Facets?.Any() == true)
                    {
                        <aside class="search-facets" role="complementary" aria-label="Filter results">
                            <h3 class="search-facets__title">Refine Results</h3>
                            
                            @foreach (var facetGroup in Model.Facets)
                            {
                                <div class="facet-group">
                                    <h4 class="facet-group__title">@facetGroup.Value.DisplayName</h4>
                                    <ul class="facet-group__list">
                                        @foreach (var facetValue in facetGroup.Value.Values)
                                        {
                                            <li class="facet-item">
                                                <label class="facet-item__label">
                                                    <input type="checkbox" 
                                                           name="facets[@facetGroup.Key]" 
                                                           value="@facetValue.Value"
                                                           @(facetValue.Selected ? "checked" : "")
                                                           class="facet-item__checkbox"
                                                           data-facet-group="@facetGroup.Key">
                                                    <span class="facet-item__text">@facetValue.DisplayValue</span>
                                                    <span class="facet-item__count">(@facetValue.Count)</span>
                                                </label>
                                            </li>
                                        }
                                    </ul>
                                </div>
                            }
                        </aside>
                    }
                    
                    <!-- Results List -->
                    <main class="search-results__main" role="main">
                        <ul class="search-results__list">
                            @foreach (var result in Model.Results)
                            {
                                <li class="search-result-item" data-result-id="@result.Id">
                                    @if (!string.IsNullOrEmpty(result.ImageUrl))
                                    {
                                        <div class="search-result-item__image">
                                            <img src="@result.ImageUrl" alt="" loading="lazy">
                                        </div>
                                    }
                                    
                                    <div class="search-result-item__content">
                                        <h3 class="search-result-item__title">
                                            <a href="@result.Url" class="search-result-item__link">
                                                @Html.Raw(HighlightSearchTerms(result.Title, Model.Query))
                                            </a>
                                        </h3>
                                        
                                        <p class="search-result-item__excerpt">
                                            @Html.Raw(HighlightSearchTerms(result.Excerpt, Model.Query))
                                        </p>
                                        
                                        <div class="search-result-item__meta">
                                            <span class="search-result-item__type">@result.ContentType</span>
                                            <span class="search-result-item__date">@result.LastModified.ToString("MMM dd, yyyy")</span>
                                            <span class="search-result-item__score" title="Relevance score">Score: @result.Score.ToString("F2")</span>
                                        </div>
                                        
                                        <div class="search-result-item__url">
                                            <cite>@result.Url</cite>
                                        </div>
                                    </div>
                                </li>
                            }
                        </ul>
                        
                        <!-- Pagination -->
                        @if (Model.TotalPages > 1)
                        {
                            <nav class="search-pagination" aria-label="Search results pagination">
                                <ul class="pagination">
                                    @if (Model.CurrentPage > 1)
                                    {
                                        <li class="pagination__item">
                                            <a href="@GetPageUrl(Model.CurrentPage - 1)" class="pagination__link">
                                                Previous
                                            </a>
                                        </li>
                                    }
                                    
                                    @for (int i = Math.Max(1, Model.CurrentPage - 2); i <= Math.Min(Model.TotalPages, Model.CurrentPage + 2); i++)
                                    {
                                        <li class="pagination__item @(i == Model.CurrentPage ? "active" : "")">
                                            @if (i == Model.CurrentPage)
                                            {
                                                <span class="pagination__current" aria-current="page">@i</span>
                                            }
                                            else
                                            {
                                                <a href="@GetPageUrl(i)" class="pagination__link">@i</a>
                                            }
                                        </li>
                                    }
                                    
                                    @if (Model.CurrentPage < Model.TotalPages)
                                    {
                                        <li class="pagination__item">
                                            <a href="@GetPageUrl(Model.CurrentPage + 1)" class="pagination__link">
                                                Next
                                            </a>
                                        </li>
                                    }
                                </ul>
                            </nav>
                        }
                    </main>
                </div>
            }
            else
            {
                <!-- No Results -->
                <div class="search-no-results">
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters.</p>
                    
                    @if (Model.SuggestionQuery?.Any() == true)
                    {
                        <p>Did you mean: 
                            @foreach (var suggestion in Model.SuggestionQuery)
                            {
                                <a href="?query=@Uri.EscapeDataString(suggestion)" class="search-suggestion-link">@suggestion</a>
                            }
                        </p>
                    }
                </div>
            }
        </div>
    }
</div>

@functions {
    private string GetPageUrl(int page)
    {
        var queryString = HttpUtility.ParseQueryString(Request.QueryString.Value ?? "");
        queryString["page"] = page.ToString();
        return "?" + queryString.ToString();
    }
    
    private string HighlightSearchTerms(string text, string searchTerms)
    {
        if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(searchTerms))
            return text;
            
        var terms = searchTerms.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        foreach (var term in terms)
        {
            text = Regex.Replace(text, Regex.Escape(term), 
                $"<mark>{term}</mark>", RegexOptions.IgnoreCase);
        }
        return text;
    }
}

<script>
document.addEventListener('DOMContentLoaded', function() {
    const searchComponent = document.querySelector('.search-component');
    const searchInput = searchComponent.querySelector('.search-input');
    const suggestionsContainer = searchComponent.querySelector('.search-suggestions');
    const form = searchComponent.querySelector('.search-component__form');
    
    let searchTimeout;
    
    // Auto-complete functionality
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                fetchSuggestions(query);
            }, 300);
        } else {
            hideSuggestions();
        }
    });
    
    // Facet filtering
    searchComponent.querySelectorAll('.facet-item__checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            form.submit();
        });
    });
    
    async function fetchSuggestions(query) {
        try {
            const url = searchComponent.dataset.suggestionsUrl + '?q=' + encodeURIComponent(query);
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.suggestions?.length > 0) {
                showSuggestions(data.suggestions);
            } else {
                hideSuggestions();
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            hideSuggestions();
        }
    }
    
    function showSuggestions(suggestions) {
        suggestionsContainer.innerHTML = suggestions
            .map(suggestion => \`<div class="search-suggestion" role="option" data-value="\${suggestion.title}">\${suggestion.title}</div>\`)
            .join('');
        suggestionsContainer.style.display = 'block';
        
        // Add click handlers
        suggestionsContainer.querySelectorAll('.search-suggestion').forEach(item => {
            item.addEventListener('click', function() {
                searchInput.value = this.dataset.value;
                hideSuggestions();
                form.submit();
            });
        });
    }
    
    function hideSuggestions() {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.innerHTML = '';
    }
    
    // Hide suggestions on outside click
    document.addEventListener('click', function(e) {
        if (!searchComponent.contains(e.target)) {
            hideSuggestions();
        }
    });
});
</script>`,
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
        content: `Implement a responsive media gallery with lazy loading, lightbox functionality, image optimization, and integration with Sitecore Media Library.

// Media Gallery Component Implementation
public class MediaGalleryController : Controller
{
    private readonly IMediaService _mediaService;
    private readonly ICacheService _cacheService;
    
    public MediaGalleryController(IMediaService mediaService, ICacheService cacheService)
    {
        _mediaService = mediaService;
        _cacheService = cacheService;
    }
    
    public async Task<IActionResult> RenderGallery(Guid datasourceId)
    {
        var cacheKey = $"media-gallery-{datasourceId}";
        var viewModel = await _cacheService.GetOrSetAsync(cacheKey, async () =>
        {
            return await _mediaService.GetMediaGalleryAsync(datasourceId);
        }, TimeSpan.FromMinutes(30));
        
        return PartialView("_MediaGallery", viewModel);
    }
    
    [HttpGet]
    public async Task<IActionResult> LoadMore([FromQuery] Guid galleryId, [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        try
        {
            var items = await _mediaService.GetMediaItemsAsync(galleryId, page, pageSize);
            return Json(new { success = true, items, hasMore = items.Count() == pageSize });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, error = ex.Message });
        }
    }
}

// Media Gallery Models
public class MediaGalleryViewModel
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public IEnumerable<MediaItem> Items { get; set; }
    public GalleryConfiguration Configuration { get; set; }
    public string CssClass { get; set; }
    public bool HasMoreItems { get; set; }
    public int TotalItems { get; set; }
}

public class MediaItem
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Alt { get; set; }
    public string ThumbnailUrl { get; set; }
    public string MediumUrl { get; set; }
    public string FullUrl { get; set; }
    public string MediaType { get; set; } // image, video, audio
    public long FileSize { get; set; }
    public string FileName { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public DateTime DateCreated { get; set; }
    public Dictionary<string, object> Metadata { get; set; }
}

public class GalleryConfiguration
{
    public string Layout { get; set; } = "grid"; // grid, masonry, carousel
    public int ItemsPerPage { get; set; } = 12;
    public bool EnableLazyLoading { get; set; } = true;
    public bool EnableLightbox { get; set; } = true;
    public bool EnableInfiniteScroll { get; set; } = false;
    public bool ShowCaptions { get; set; } = true;
    public bool ShowMetadata { get; set; } = false;
    public string[] AllowedTypes { get; set; } = { "image", "video" };
    public ResponsiveConfiguration Responsive { get; set; } = new();
}

public class ResponsiveConfiguration
{
    public int ColumnsDesktop { get; set; } = 4;
    public int ColumnsTablet { get; set; } = 3;
    public int ColumnsMobile { get; set; } = 2;
    public string AspectRatio { get; set; } = "16/9";
}

// Razor View - _MediaGallery.cshtml
@model MediaGalleryViewModel

<div class="media-gallery @Model.CssClass" 
     data-gallery-id="@Model.Id"
     data-layout="@Model.Configuration.Layout"
     data-enable-lightbox="@Model.Configuration.EnableLightbox.ToString().ToLower()"
     data-enable-infinite-scroll="@Model.Configuration.EnableInfiniteScroll.ToString().ToLower()"
     data-load-more-url="@Url.Action("LoadMore")">
     
    @if (!string.IsNullOrEmpty(Model.Title))
    {
        <header class="media-gallery__header">
            <h2 class="media-gallery__title">@Model.Title</h2>
            @if (!string.IsNullOrEmpty(Model.Description))
            {
                <p class="media-gallery__description">@Model.Description</p>
            }
        </header>
    }
    
    <div class="media-gallery__container">
        <div class="media-gallery__grid" 
             style="--columns-desktop: @Model.Configuration.Responsive.ColumnsDesktop; 
                    --columns-tablet: @Model.Configuration.Responsive.ColumnsTablet; 
                    --columns-mobile: @Model.Configuration.Responsive.ColumnsMobile;
                    --aspect-ratio: @Model.Configuration.Responsive.AspectRatio;">
                    
            @foreach (var item in Model.Items ?? Enumerable.Empty<MediaItem>())
            {
                <div class="media-gallery__item" 
                     data-media-id="@item.Id"
                     data-media-type="@item.MediaType">
                     
                    <div class="media-item">
                        @if (item.MediaType == "image")
                        {
                            <div class="media-item__image-container">
                                @if (Model.Configuration.EnableLazyLoading)
                                {
                                    <img class="media-item__image lazy" 
                                         data-src="@item.MediumUrl"
                                         data-full-src="@item.FullUrl"
                                         src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4="
                                         alt="@item.Alt"
                                         loading="lazy"
                                         width="@item.Width"
                                         height="@item.Height">
                                }
                                else
                                {
                                    <img class="media-item__image" 
                                         src="@item.MediumUrl"
                                         data-full-src="@item.FullUrl"
                                         alt="@item.Alt"
                                         width="@item.Width"
                                         height="@item.Height">
                                }
                                
                                @if (Model.Configuration.EnableLightbox)
                                {
                                    <button class="media-item__zoom" 
                                            type="button"
                                            aria-label="View full size image"
                                            data-lightbox-trigger>
                                        <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
                                            <path d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.39zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z"/>
                                            <path d="M13 11h-2v-2a1 1 0 0 0-2 0v2H7a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2z"/>
                                        </svg>
                                    </button>
                                }
                            </div>
                        }
                        else if (item.MediaType == "video")
                        {
                            <div class="media-item__video-container">
                                <video class="media-item__video" 
                                       poster="@item.ThumbnailUrl"
                                       controls
                                       preload="metadata"
                                       width="@item.Width"
                                       height="@item.Height">
                                    <source src="@item.FullUrl" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        }
                        
                        @if (Model.Configuration.ShowCaptions && (!string.IsNullOrEmpty(item.Title) || !string.IsNullOrEmpty(item.Description)))
                        {
                            <div class="media-item__caption">
                                @if (!string.IsNullOrEmpty(item.Title))
                                {
                                    <h3 class="media-item__title">@item.Title</h3>
                                }
                                @if (!string.IsNullOrEmpty(item.Description))
                                {
                                    <p class="media-item__description">@item.Description</p>
                                }
                            </div>
                        }
                        
                        @if (Model.Configuration.ShowMetadata)
                        {
                            <div class="media-item__metadata">
                                <span class="media-item__size">@FormatFileSize(item.FileSize)</span>
                                <span class="media-item__dimensions">@item.Width × @item.Height</span>
                                <time class="media-item__date" datetime="@item.DateCreated.ToString("yyyy-MM-dd")">
                                    @item.DateCreated.ToString("MMM dd, yyyy")
                                </time>
                            </div>
                        }
                    </div>
                </div>
            }
        </div>
        
        @if (Model.HasMoreItems && !Model.Configuration.EnableInfiniteScroll)
        {
            <div class="media-gallery__load-more">
                <button type="button" class="load-more-button btn btn-secondary" data-load-more>
                    <span class="load-more-text">Load More</span>
                    <span class="load-more-spinner" style="display: none;">Loading...</span>
                </button>
            </div>
        }
        
        @if (Model.Configuration.EnableInfiniteScroll)
        {
            <div class="media-gallery__loading" style="display: none;">
                <div class="loading-spinner"></div>
            </div>
        }
    </div>
    
    <!-- Gallery Stats -->
    <footer class="media-gallery__footer">
        <p class="media-gallery__stats">
            Showing @Model.Items.Count() of @Model.TotalItems items
        </p>
    </footer>
</div>

<!-- Lightbox Modal -->
@if (Model.Configuration.EnableLightbox)
{
    <div class="lightbox-overlay" style="display: none;" role="dialog" aria-modal="true" aria-label="Media lightbox">
        <div class="lightbox-container">
            <button class="lightbox-close" type="button" aria-label="Close lightbox">&times;</button>
            
            <button class="lightbox-prev" type="button" aria-label="Previous image">&#8249;</button>
            <button class="lightbox-next" type="button" aria-label="Next image">&#8250;</button>
            
            <div class="lightbox-content">
                <img class="lightbox-image" src="" alt="">
                <div class="lightbox-caption">
                    <h3 class="lightbox-title"></h3>
                    <p class="lightbox-description"></p>
                </div>
            </div>
        </div>
    </div>
}

@functions {
    private string FormatFileSize(long bytes)
    {
        string[] suffixes = { "B", "KB", "MB", "GB" };
        int counter = 0;
        decimal number = bytes;
        while (Math.Round(number / 1024) >= 1)
        {
            number /= 1024;
            counter++;
        }
        return $"{number:n1} {suffixes[counter]}";
    }
}

<script>
document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.querySelector('.media-gallery');
    if (!gallery) return;
    
    const config = {
        enableLightbox: gallery.dataset.enableLightbox === 'true',
        enableInfiniteScroll: gallery.dataset.enableInfiniteScroll === 'true',
        galleryId: gallery.dataset.galleryId,
        loadMoreUrl: gallery.dataset.loadMoreUrl
    };
    
    let currentPage = 1;
    let isLoading = false;
    let hasMoreItems = gallery.querySelector('.load-more-button') !== null;
    
    // Lazy loading
    if ('IntersectionObserver' in window) {
        const lazyImages = gallery.querySelectorAll('.lazy');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Lightbox functionality
    if (config.enableLightbox) {
        setupLightbox();
    }
    
    // Load more functionality
    const loadMoreButton = gallery.querySelector('.load-more-button');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', loadMoreItems);
    }
    
    // Infinite scroll
    if (config.enableInfiniteScroll) {
        setupInfiniteScroll();
    }
    
    function setupLightbox() {
        const lightbox = document.querySelector('.lightbox-overlay');
        const lightboxImage = lightbox.querySelector('.lightbox-image');
        const lightboxTitle = lightbox.querySelector('.lightbox-title');
        const lightboxDescription = lightbox.querySelector('.lightbox-description');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        
        let currentIndex = 0;
        let mediaItems = [];
        
        // Open lightbox
        gallery.addEventListener('click', function(e) {
            if (e.target.closest('[data-lightbox-trigger]')) {
                e.preventDefault();
                const mediaItem = e.target.closest('.media-gallery__item');
                const allItems = gallery.querySelectorAll('.media-gallery__item');
                currentIndex = Array.from(allItems).indexOf(mediaItem);
                
                mediaItems = Array.from(allItems).map(item => {
                    const img = item.querySelector('.media-item__image');
                    const title = item.querySelector('.media-item__title')?.textContent || '';
                    const description = item.querySelector('.media-item__description')?.textContent || '';
                    
                    return {
                        src: img.dataset.fullSrc || img.src,
                        alt: img.alt,
                        title,
                        description
                    };
                });
                
                showLightbox(currentIndex);
            }
        });
        
        function showLightbox(index) {
            const item = mediaItems[index];
            lightboxImage.src = item.src;
            lightboxImage.alt = item.alt;
            lightboxTitle.textContent = item.title;
            lightboxDescription.textContent = item.description;
            
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Update navigation buttons
            prevBtn.style.display = index > 0 ? 'block' : 'none';
            nextBtn.style.display = index < mediaItems.length - 1 ? 'block' : 'none';
        }
        
        function hideLightbox() {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Event listeners
        closeBtn.addEventListener('click', hideLightbox);
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) hideLightbox();
        });
        
        prevBtn.addEventListener('click', function() {
            if (currentIndex > 0) {
                currentIndex--;
                showLightbox(currentIndex);
            }
        });
        
        nextBtn.addEventListener('click', function() {
            if (currentIndex < mediaItems.length - 1) {
                currentIndex++;
                showLightbox(currentIndex);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (lightbox.style.display === 'flex') {
                switch(e.key) {
                    case 'Escape':
                        hideLightbox();
                        break;
                    case 'ArrowLeft':
                        if (currentIndex > 0) {
                            currentIndex--;
                            showLightbox(currentIndex);
                        }
                        break;
                    case 'ArrowRight':
                        if (currentIndex < mediaItems.length - 1) {
                            currentIndex++;
                            showLightbox(currentIndex);
                        }
                        break;
                }
            }
        });
    }
    
    async function loadMoreItems() {
        if (isLoading || !hasMoreItems) return;
        
        isLoading = true;
        currentPage++;
        
        const button = gallery.querySelector('.load-more-button');
        const buttonText = button.querySelector('.load-more-text');
        const buttonSpinner = button.querySelector('.load-more-spinner');
        
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'inline';
        button.disabled = true;
        
        try {
            const response = await fetch(\`\${config.loadMoreUrl}?galleryId=\${config.galleryId}&page=\${currentPage}\`);
            const data = await response.json();
            
            if (data.success && data.items?.length > 0) {
                appendItems(data.items);
                hasMoreItems = data.hasMore;
                
                if (!hasMoreItems) {
                    button.style.display = 'none';
                }
            } else {
                hasMoreItems = false;
                button.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading more items:', error);
        } finally {
            isLoading = false;
            buttonText.style.display = 'inline';
            buttonSpinner.style.display = 'none';
            button.disabled = false;
        }
    }
    
    function setupInfiniteScroll() {
        const loadingIndicator = gallery.querySelector('.media-gallery__loading');
        
        const scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading && hasMoreItems) {
                loadingIndicator.style.display = 'block';
                loadMoreItems().finally(() => {
                    loadingIndicator.style.display = 'none';
                });
            }
        });
        
        if (loadingIndicator) {
            scrollObserver.observe(loadingIndicator);
        }
    }
    
    function appendItems(items) {
        const grid = gallery.querySelector('.media-gallery__grid');
        items.forEach(item => {
            const itemHtml = createItemHtml(item);
            grid.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        // Re-initialize lazy loading for new items
        if ('IntersectionObserver' in window) {
            const newLazyImages = grid.querySelectorAll('.lazy');
            newLazyImages.forEach(img => imageObserver.observe(img));
        }
    }
    
    function createItemHtml(item) {
        // This would typically be generated server-side
        // Simplified version for demonstration
        return \`
            <div class="media-gallery__item" data-media-id="\${item.id}" data-media-type="\${item.mediaType}">
                <div class="media-item">
                    <div class="media-item__image-container">
                        <img class="media-item__image lazy" 
                             data-src="\${item.mediumUrl}"
                             data-full-src="\${item.fullUrl}"
                             src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4="
                             alt="\${item.alt}"
                             loading="lazy">
                        <button class="media-item__zoom" type="button" aria-label="View full size image" data-lightbox-trigger>
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
                                <path d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.39zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z"/>
                                <path d="M13 11h-2v-2a1 1 0 0 0-2 0v2H7a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2z"/>
                            </svg>
                        </button>
                    </div>
                    \${item.title ? \`<div class="media-item__caption"><h3 class="media-item__title">\${item.title}</h3></div>\` : ''}
                </div>
            </div>
        \`;
    }
});
</script>`,
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
        content: `Implement integration tests for Sitecore components with real dependencies, database interactions, and end-to-end scenarios.

// Integration Test Implementation
[TestClass]
public class {{ComponentName}}IntegrationTests
{
    private static TestContext _testContext;
    private static IServiceProvider _serviceProvider;
    private static ISitecoreContext _sitecoreContext;
    private static IConfiguration _configuration;
    
    [ClassInitialize]
    public static void ClassInitialize(TestContext context)
    {
        _testContext = context;
        
        // Setup test configuration
        var configBuilder = new ConfigurationBuilder()
            .AddJsonFile("appsettings.test.json", optional: false)
            .AddEnvironmentVariables("TEST_");
        _configuration = configBuilder.Build();
        
        // Setup dependency injection for integration tests
        var services = new ServiceCollection();
        ConfigureTestServices(services);
        _serviceProvider = services.BuildServiceProvider();
        
        // Initialize Sitecore context
        _sitecoreContext = _serviceProvider.GetRequiredService<ISitecoreContext>();
    }
    
    private static void ConfigureTestServices(IServiceCollection services)
    {
        // Register test configuration
        services.AddSingleton(_configuration);
        
        // Register Sitecore dependencies
        services.AddScoped<ISitecoreContext, TestSitecoreContext>();
        services.AddScoped<IItemManager, TestItemManager>();
        services.AddScoped<ISearchManager, TestSearchManager>();
        
        // Register component-specific services
        services.AddScoped<I{{ServiceName}}, {{ServiceName}}>();
        services.AddScoped<{{ControllerName}}>();
        
        // Register test database context
        services.AddDbContext<TestDbContext>(options =>
            options.UseSqlServer(_configuration.GetConnectionString("TestDatabase")));
        
        // Register logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Register HTTP client for API testing
        services.AddHttpClient();
    }
    
    [TestInitialize]
    public void TestInitialize()
    {
        // Setup test data before each test
        SetupTestData();
    }
    
    [TestCleanup]
    public void TestCleanup()
    {
        // Cleanup test data after each test
        CleanupTestData();
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithValidInput_ReturnsExpectedResult()
    {
        // Arrange
        var controller = _serviceProvider.GetRequiredService<{{ControllerName}}>();
        var testItem = CreateTestItem();
        
        var mockContext = _serviceProvider.GetRequiredService<ISitecoreContext>();
        mockContext.Database.Add(testItem);
        
        var requestModel = new {{RequestModel}}
        {
            {{PropertyName}} = "{{TestValue}}",
            {{PropertyName2}} = {{TestValue2}}
        };
        
        // Act
        var result = await controller.{{ActionName}}(requestModel);
        
        // Assert
        Assert.IsNotNull(result);
        
        if (result is ViewResult viewResult)
        {
            Assert.IsInstanceOfType(viewResult.Model, typeof({{ViewModelType}}));
            var viewModel = viewResult.Model as {{ViewModelType}};
            
            Assert.AreEqual("{{ExpectedValue}}", viewModel.{{PropertyName}});
            Assert.IsTrue(viewModel.{{BooleanProperty}});
        }
        else if (result is JsonResult jsonResult)
        {
            dynamic data = jsonResult.Value;
            Assert.AreEqual("{{ExpectedValue}}", data.{{PropertyName}}.ToString());
            Assert.IsTrue((bool)data.success);
        }
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithDatabaseInteraction_PersistsDataCorrectly()
    {
        // Arrange
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TestDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<I{{ServiceName}}>();
        
        var entity = new {{EntityType}}
        {
            Id = Guid.NewGuid(),
            Name = "Test Entity",
            CreatedDate = DateTime.UtcNow,
            IsActive = true
        };
        
        // Act
        await service.CreateAsync(entity);
        
        // Assert - Verify data was persisted
        var persistedEntity = await dbContext.{{EntitySetName}}
            .FirstOrDefaultAsync(e => e.Id == entity.Id);
            
        Assert.IsNotNull(persistedEntity);
        Assert.AreEqual(entity.Name, persistedEntity.Name);
        Assert.AreEqual(entity.IsActive, persistedEntity.IsActive);
        
        // Act - Update the entity
        persistedEntity.Name = "Updated Entity";
        await service.UpdateAsync(persistedEntity);
        
        // Assert - Verify update was persisted
        var updatedEntity = await dbContext.{{EntitySetName}}
            .FirstOrDefaultAsync(e => e.Id == entity.Id);
            
        Assert.AreEqual("Updated Entity", updatedEntity.Name);
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithSearchIntegration_ReturnsCorrectResults()
    {
        // Arrange
        var searchManager = _serviceProvider.GetRequiredService<ISearchManager>();
        var searchService = _serviceProvider.GetRequiredService<I{{SearchServiceName}}>();
        
        // Setup test search data
        var testItems = new List<{{SearchItemType}}>
        {
            new {{SearchItemType}} { Id = Guid.NewGuid(), Title = "Test Item 1", Content = "Content for testing search" },
            new {{SearchItemType}} { Id = Guid.NewGuid(), Title = "Test Item 2", Content = "Another test content" },
            new {{SearchItemType}} { Id = Guid.NewGuid(), Title = "Different Title", Content = "No match content" }
        };
        
        foreach (var item in testItems)
        {
            await searchManager.IndexItem(item);
        }
        
        // Wait for indexing to complete
        await Task.Delay(1000);
        
        var searchRequest = new SearchRequest
        {
            Query = "test",
            PageSize = 10,
            Page = 1
        };
        
        // Act
        var searchResults = await searchService.SearchAsync(searchRequest);
        
        // Assert
        Assert.IsNotNull(searchResults);
        Assert.IsTrue(searchResults.TotalResults >= 2);
        Assert.IsTrue(searchResults.Results.Any(r => r.Title.Contains("Test Item")));
        
        // Verify result ranking
        var firstResult = searchResults.Results.First();
        Assert.IsTrue(firstResult.Score > 0);
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithExternalApiCall_HandlesApiResponseCorrectly()
    {
        // Arrange
        var httpClient = _serviceProvider.GetRequiredService<HttpClient>();
        var apiService = new {{ApiServiceName}}(httpClient, _configuration);
        
        var requestData = new {{ApiRequestModel}}
        {
            {{PropertyName}} = "{{TestValue}}",
            Timestamp = DateTime.UtcNow
        };
        
        // Act
        var response = await apiService.CallExternalApiAsync(requestData);
        
        // Assert
        Assert.IsNotNull(response);
        Assert.IsTrue(response.IsSuccess);
        Assert.IsNotNull(response.Data);
        
        // Verify response data structure
        Assert.AreEqual("{{ExpectedStatus}}", response.Status);
        Assert.IsTrue(response.Data.{{PropertyName}}.Length > 0);
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithConcurrentRequests_HandlesLoadCorrectly()
    {
        // Arrange
        var service = _serviceProvider.GetRequiredService<I{{ServiceName}}>();
        var tasks = new List<Task<{{ResponseType}}>>();
        const int concurrentRequests = 10;
        
        // Act - Execute concurrent requests
        for (int i = 0; i < concurrentRequests; i++)
        {
            var request = new {{RequestType}}
            {
                Id = Guid.NewGuid(),
                Value = $"Test Value {i}"
            };
            
            tasks.Add(service.ProcessAsync(request));
        }
        
        var results = await Task.WhenAll(tasks);
        
        // Assert
        Assert.AreEqual(concurrentRequests, results.Length);
        Assert.IsTrue(results.All(r => r.IsSuccess));
        
        // Verify all requests were processed uniquely
        var uniqueResults = results.Select(r => r.Id).Distinct().Count();
        Assert.AreEqual(concurrentRequests, uniqueResults);
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithInvalidData_ThrowsExpectedException()
    {
        // Arrange
        var service = _serviceProvider.GetRequiredService<I{{ServiceName}}>();
        var invalidRequest = new {{RequestType}}
        {
            // Missing required properties or invalid values
            {{PropertyName}} = null,
            {{NumericProperty}} = -1
        };
        
        // Act & Assert
        await Assert.ThrowsExceptionAsync<{{ExpectedExceptionType}}>(
            () => service.ProcessAsync(invalidRequest));
    }
    
    [TestMethod]
    public async Task {{MethodName}}_WithTransactionRollback_MaintainsDataIntegrity()
    {
        // Arrange
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TestDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<I{{ServiceName}}>();
        
        var initialCount = await dbContext.{{EntitySetName}}.CountAsync();
        
        var entity1 = new {{EntityType}} { Id = Guid.NewGuid(), Name = "Valid Entity" };
        var entity2 = new {{EntityType}} { Id = Guid.NewGuid(), Name = null }; // This should cause failure
        
        // Act & Assert
        try
        {
            using var transaction = await dbContext.Database.BeginTransactionAsync();
            await service.CreateAsync(entity1);
            await service.CreateAsync(entity2); // This should fail
            await transaction.CommitAsync();
            
            Assert.Fail("Expected exception was not thrown");
        }
        catch (Exception)
        {
            // Expected exception
        }
        
        // Assert - Verify rollback occurred
        var finalCount = await dbContext.{{EntitySetName}}.CountAsync();
        Assert.AreEqual(initialCount, finalCount);
    }
    
    private void SetupTestData()
    {
        // Create test items, users, permissions, etc.
        var testDatabase = _sitecoreContext.Database;
        
        // Setup test templates
        var testTemplate = testDatabase.GetTemplate("{{TestTemplateName}}");
        if (testTemplate == null)
        {
            testTemplate = CreateTestTemplate();
        }
        
        // Setup test items
        var testItem = CreateTestItem(testTemplate);
        testDatabase.Add(testItem);
    }
    
    private void CleanupTestData()
    {
        // Remove test items and clean up database
        var testDatabase = _sitecoreContext.Database;
        var testItems = testDatabase.SelectItems("fast://*[@@templatename='{{TestTemplateName}}']");
        
        foreach (var item in testItems)
        {
            item.Delete();
        }
    }
    
    private {{ItemType}} CreateTestItem()
    {
        return new {{ItemType}}
        {
            ID = Guid.NewGuid(),
            Name = "Test Item",
            TemplateID = Guid.NewGuid(),
            Fields = new Dictionary<string, object>
            {
                ["Title"] = "Test Title",
                ["Description"] = "Test Description",
                ["IsActive"] = true,
                ["CreatedDate"] = DateTime.UtcNow
            }
        };
    }
    
    private Template CreateTestTemplate()
    {
        return new Template
        {
            ID = Guid.NewGuid(),
            Name = "{{TestTemplateName}}",
            Fields = new List<TemplateField>
            {
                new TemplateField { Name = "Title", Type = "Single-Line Text" },
                new TemplateField { Name = "Description", Type = "Multi-Line Text" },
                new TemplateField { Name = "IsActive", Type = "Checkbox" },
                new TemplateField { Name = "CreatedDate", Type = "Datetime" }
            }
        };
    }
    
    [ClassCleanup]
    public static void ClassCleanup()
    {
        _serviceProvider?.Dispose();
    }
}

// Test Database Context
public class TestDbContext : DbContext
{
    public TestDbContext(DbContextOptions<TestDbContext> options) : base(options) { }
    
    public DbSet<{{EntityType}}> {{EntitySetName}} { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure test entity mappings
        modelBuilder.Entity<{{EntityType}}>()
            .HasKey(e => e.Id);
            
        modelBuilder.Entity<{{EntityType}}>()
            .Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(255);
    }
}

// Test Configuration (appsettings.test.json)
{
  "ConnectionStrings": {
    "TestDatabase": "Server=(localdb)\\mssqllocaldb;Database=SitecoreTest;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Sitecore": {
    "ConnectionString": "Data Source=(localdb)\\mssqllocaldb;Initial Catalog=SitecoreTest_Master;Integrated Security=True",
    "TestMode": true
  },
  "Search": {
    "Provider": "Solr",
    "IndexName": "sitecore_test_index",
    "Url": "http://localhost:8983/solr"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}`,
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
        content: `Create test data builders using the builder pattern for generating consistent test data across unit and integration tests.

// Test Data Builder Pattern Implementation
public class {{ModelName}}TestDataBuilder
{
    private readonly {{ModelName}} _instance = new {{ModelName}}();
    
    public {{ModelName}}TestDataBuilder()
    {
        SetDefaults();
    }
    
    private void SetDefaults()
    {
        _instance.Id = Guid.NewGuid();
        _instance.CreatedDate = DateTime.UtcNow;
        _instance.IsActive = true;
        _instance.Name = "Default Test Name";
        _instance.Description = "Default test description for testing purposes";
    }
    
    public {{ModelName}}TestDataBuilder WithId(Guid id)
    {
        _instance.Id = id;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithName(string name)
    {
        _instance.Name = name;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithDescription(string description)
    {
        _instance.Description = description;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithIsActive(bool isActive)
    {
        _instance.IsActive = isActive;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithCreatedDate(DateTime createdDate)
    {
        _instance.CreatedDate = createdDate;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithRandomData()
    {
        var random = new Random();
        _instance.Id = Guid.NewGuid();
        _instance.Name = $"Test Item {random.Next(1000, 9999)}";
        _instance.Description = $"Test description {random.Next(1000, 9999)}";
        _instance.IsActive = random.Next(0, 2) == 1;
        _instance.CreatedDate = DateTime.UtcNow.AddDays(-random.Next(0, 365));
        return this;
    }
    
    public {{ModelName}}TestDataBuilder AsInactive()
    {
        _instance.IsActive = false;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder AsActive()
    {
        _instance.IsActive = true;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithPastDate(int daysAgo)
    {
        _instance.CreatedDate = DateTime.UtcNow.AddDays(-daysAgo);
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithFutureDate(int daysFromNow)
    {
        _instance.CreatedDate = DateTime.UtcNow.AddDays(daysFromNow);
        return this;
    }
    
    public {{ModelName}} Build()
    {
        // Create a new instance to prevent modification of built objects
        return new {{ModelName}}
        {
            Id = _instance.Id,
            Name = _instance.Name,
            Description = _instance.Description,
            IsActive = _instance.IsActive,
            CreatedDate = _instance.CreatedDate
        };
    }
    
    public List<{{ModelName}}> BuildMany(int count)
    {
        var items = new List<{{ModelName}}>();
        for (int i = 0; i < count; i++)
        {
            // Create variation for each item
            var builder = new {{ModelName}}TestDataBuilder()
                .WithName($"{_instance.Name} {i + 1}")
                .WithDescription($"{_instance.Description} {i + 1}")
                .WithIsActive(_instance.IsActive)
                .WithCreatedDate(_instance.CreatedDate.AddMinutes(i));
                
            items.Add(builder.Build());
        }
        return items;
    }
    
    // Implicit conversion operator
    public static implicit operator {{ModelName}}({{ModelName}}TestDataBuilder builder)
    {
        return builder.Build();
    }
}

// Sitecore Item Test Data Builder
public class SitecoreItemTestDataBuilder
{
    private readonly Dictionary<string, object> _fields = new Dictionary<string, object>();
    private Guid _id = Guid.NewGuid();
    private Guid _templateId = Guid.NewGuid();
    private string _name = "Test Item";
    private string _path = "/sitecore/content/home/test-item";
    
    public SitecoreItemTestDataBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithTemplateId(Guid templateId)
    {
        _templateId = templateId;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithName(string name)
    {
        _name = name;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithPath(string path)
    {
        _path = path;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithField(string fieldName, object fieldValue)
    {
        _fields[fieldName] = fieldValue;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithTitle(string title)
    {
        _fields["Title"] = title;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithDescription(string description)
    {
        _fields["Description"] = description;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithImage(string imagePath)
    {
        _fields["Image"] = imagePath;
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithLink(string linkUrl, string linkText = null)
    {
        _fields["Link"] = new { Url = linkUrl, Text = linkText ?? "Learn More" };
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithDateField(string fieldName, DateTime date)
    {
        _fields[fieldName] = date.ToString("yyyyMMddTHHmmss");
        return this;
    }
    
    public SitecoreItemTestDataBuilder WithCheckboxField(string fieldName, bool isChecked)
    {
        _fields[fieldName] = isChecked ? "1" : "0";
        return this;
    }
    
    public Mock<IItem> BuildMock()
    {
        var mockItem = new Mock<IItem>();
        
        mockItem.Setup(i => i.ID).Returns(new ID(_id));
        mockItem.Setup(i => i.TemplateID).Returns(new ID(_templateId));
        mockItem.Setup(i => i.Name).Returns(_name);
        mockItem.Setup(i => i.Paths).Returns(new ItemPaths { FullPath = _path });
        
        // Setup fields
        var mockFields = new Mock<FieldCollection>();
        foreach (var field in _fields)
        {
            var mockField = new Mock<Field>();
            mockField.Setup(f => f.Name).Returns(field.Key);
            mockField.Setup(f => f.Value).Returns(field.Value?.ToString() ?? string.Empty);
            mockField.Setup(f => f.HasValue).Returns(field.Value != null);
            
            mockFields.Setup(fc => fc[field.Key]).Returns(mockField.Object);
            mockItem.Setup(i => i[field.Key]).Returns(field.Value?.ToString() ?? string.Empty);
        }
        
        mockItem.Setup(i => i.Fields).Returns(mockFields.Object);
        
        return mockItem;
    }
}

// Usage Examples and Test Patterns
[TestClass]
public class TestDataBuilderExamples
{
    [TestMethod]
    public void SingleItem_UsingDefaults()
    {
        // Arrange
        var testItem = new {{ModelName}}TestDataBuilder().Build();
        
        // Assert
        Assert.IsNotNull(testItem);
        Assert.AreNotEqual(Guid.Empty, testItem.Id);
        Assert.IsTrue(testItem.IsActive);
        Assert.IsNotNull(testItem.Name);
    }
    
    [TestMethod]
    public void SingleItem_WithCustomValues()
    {
        // Arrange
        var testItem = new {{ModelName}}TestDataBuilder()
            .WithName("Custom Test Item")
            .WithDescription("Custom description")
            .AsInactive()
            .WithPastDate(30)
            .Build();
        
        // Assert
        Assert.AreEqual("Custom Test Item", testItem.Name);
        Assert.AreEqual("Custom description", testItem.Description);
        Assert.IsFalse(testItem.IsActive);
        Assert.IsTrue(testItem.CreatedDate < DateTime.UtcNow.AddDays(-29));
    }
    
    [TestMethod]
    public void MultipleItems_WithVariations()
    {
        // Arrange
        var testItems = new {{ModelName}}TestDataBuilder()
            .WithName("Base Item")
            .WithDescription("Base description")
            .BuildMany(5);
        
        // Assert
        Assert.AreEqual(5, testItems.Count);
        Assert.IsTrue(testItems.All(i => i.Name.StartsWith("Base Item")));
        Assert.IsTrue(testItems.Select(i => i.Name).Distinct().Count() == 5); // All unique
    }
    
    [TestMethod]
    public void SitecoreItem_WithFields()
    {
        // Arrange
        var mockItem = new SitecoreItemTestDataBuilder()
            .WithName("Test Sitecore Item")
            .WithTitle("Test Title")
            .WithDescription("Test Description")
            .WithImage("/media/test-image.jpg")
            .WithLink("/test-page", "Test Link")
            .WithDateField("PublishDate", DateTime.Now)
            .WithCheckboxField("IsPublished", true)
            .BuildMock();
        
        // Assert
        Assert.AreEqual("Test Sitecore Item", mockItem.Object.Name);
        Assert.AreEqual("Test Title", mockItem.Object["Title"]);
        Assert.AreEqual("Test Description", mockItem.Object["Description"]);
        Assert.AreEqual("1", mockItem.Object["IsPublished"]);
    }
}

// Factory Methods for Common Test Scenarios
public static class TestDataFactory
{
    public static {{ModelName}} CreateValid{{ModelName}}()
    {
        return new {{ModelName}}TestDataBuilder()
            .WithName("Valid Test Item")
            .WithDescription("Valid test description")
            .AsActive()
            .Build();
    }
    
    public static {{ModelName}} CreateInvalid{{ModelName}}()
    {
        return new {{ModelName}}TestDataBuilder()
            .WithName(null) // Invalid name
            .WithDescription("")
            .AsInactive()
            .Build();
    }
    
    public static List<{{ModelName}}> CreateTestCollection(int count = 10)
    {
        return new {{ModelName}}TestDataBuilder()
            .WithRandomData()
            .BuildMany(count);
    }
    
    public static Mock<IItem> CreateSitecoreTestItem()
    {
        return new SitecoreItemTestDataBuilder()
            .WithName("Standard Test Item")
            .WithTitle("Standard Title")
            .WithDescription("Standard description for testing")
            .WithImage("/media/standard-image.jpg")
            .WithCheckboxField("IsActive", true)
            .BuildMock();
    }
}`,
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
        content: `Set up comprehensive mock configuration for Sitecore context, services, and dependencies for effective unit testing.

// Mock Configuration Setup
public static class MockConfiguration
{
    public static IServiceProvider CreateMockServiceProvider()
    {
        var services = new ServiceCollection();
        ConfigureMockServices(services);
        return services.BuildServiceProvider();
    }
    
    private static void ConfigureMockServices(IServiceCollection services)
    {
        // Mock Sitecore Context
        var mockSitecoreContext = new Mock<ISitecoreContext>();
        var mockDatabase = new Mock<IDatabase>();
        var mockItem = CreateMockItem();
        
        mockDatabase.Setup(db => db.GetItem(It.IsAny<ID>())).Returns(mockItem.Object);
        mockDatabase.Setup(db => db.SelectItems(It.IsAny<string>())).Returns(new[] { mockItem.Object });
        mockSitecoreContext.Setup(ctx => ctx.Database).Returns(mockDatabase.Object);
        mockSitecoreContext.Setup(ctx => ctx.GetCurrentItem<I{{ModelName}}>()).Returns(CreateMockSitecoreItem());
        
        services.AddSingleton(mockSitecoreContext.Object);
        
        // Mock Configuration
        var mockConfiguration = new Mock<IConfiguration>();
        mockConfiguration.Setup(c => c["{{ConfigKey}}"]).Returns("{{ConfigValue}}");
        mockConfiguration.Setup(c => c.GetConnectionString("Default")).Returns("{{TestConnectionString}}");
        services.AddSingleton(mockConfiguration.Object);
        
        // Mock Logger
        var mockLogger = new Mock<ILogger<{{ClassName}}>>();
        services.AddSingleton(mockLogger.Object);
        
        // Mock Cache Service
        var mockCacheService = new Mock<ICacheService>();
        mockCacheService.Setup(c => c.GetOrSet(It.IsAny<string>(), It.IsAny<Func<object>>(), It.IsAny<TimeSpan>()))
                       .Returns<string, Func<object>, TimeSpan>((key, factory, duration) => factory());
        services.AddSingleton(mockCacheService.Object);
        
        // Mock HTTP Context
        var mockHttpContext = new Mock<HttpContext>();
        var mockRequest = new Mock<HttpRequest>();
        var mockResponse = new Mock<HttpResponse>();
        var mockSession = new Mock<ISession>();
        
        mockRequest.Setup(r => r.Headers).Returns(new HeaderDictionary());
        mockRequest.Setup(r => r.Query).Returns(new QueryCollection());
        mockHttpContext.Setup(c => c.Request).Returns(mockRequest.Object);
        mockHttpContext.Setup(c => c.Response).Returns(mockResponse.Object);
        mockHttpContext.Setup(c => c.Session).Returns(mockSession.Object);
        
        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        mockHttpContextAccessor.Setup(a => a.HttpContext).Returns(mockHttpContext.Object);
        services.AddSingleton(mockHttpContextAccessor.Object);
    }
    
    private static Mock<IItem> CreateMockItem()
    {
        var mockItem = new Mock<IItem>();
        mockItem.Setup(i => i.ID).Returns(new ID(Guid.NewGuid()));
        mockItem.Setup(i => i.Name).Returns("Test Item");
        mockItem.Setup(i => i.DisplayName).Returns("Test Item Display Name");
        mockItem.Setup(i => i.TemplateID).Returns(new ID(Guid.NewGuid()));
        mockItem.Setup(i => i.TemplateName).Returns("{{TemplateName}}");
        mockItem.Setup(i => i.Paths).Returns(CreateMockItemPaths());
        mockItem.Setup(i => i.Fields).Returns(CreateMockFieldCollection());
        mockItem.Setup(i => i["{{FieldName}}"]).Returns("{{FieldValue}}");
        return mockItem;
    }
    
    private static ItemPaths CreateMockItemPaths()
    {
        // Create mock paths object with common Sitecore paths
        return new ItemPaths
        {
            FullPath = "/sitecore/content/home/test-item",
            Path = "/sitecore/content/home/test-item",
            Name = "test-item"
        };
    }
    
    private static FieldCollection CreateMockFieldCollection()
    {
        var fields = new Dictionary<string, string>
        {
            ["Title"] = "Test Title",
            ["Description"] = "Test Description",
            ["Image"] = "{{MediaLibraryPath}}/test-image.jpg",
            ["Link"] = "{{LinkFieldValue}}",
            ["Date"] = DateTime.Now.ToString("yyyyMMddTHHmmss"),
            ["Number"] = "42",
            ["Checkbox"] = "1"
        };
        
        var mockFieldCollection = new Mock<FieldCollection>();
        foreach (var field in fields)
        {
            var mockField = new Mock<Field>();
            mockField.Setup(f => f.Name).Returns(field.Key);
            mockField.Setup(f => f.Value).Returns(field.Value);
            mockField.Setup(f => f.HasValue).Returns(!string.IsNullOrEmpty(field.Value));
            mockFieldCollection.Setup(fc => fc[field.Key]).Returns(mockField.Object);
        }
        
        return mockFieldCollection.Object;
    }
    
    private static I{{ModelName}} CreateMockSitecoreItem()
    {
        var mock = new Mock<I{{ModelName}}>();
        mock.Setup(m => m.{{PropertyName}}).Returns("{{PropertyValue}}");
        mock.Setup(m => m.{{BooleanProperty}}).Returns(true);
        mock.Setup(m => m.{{DateProperty}}).Returns(DateTime.Now);
        mock.Setup(m => m.{{ImageProperty}}).Returns(CreateMockImage());
        mock.Setup(m => m.{{LinkProperty}}).Returns(CreateMockLink());
        return mock.Object;
    }
    
    private static Image CreateMockImage()
    {
        var mockImage = new Mock<Image>();
        mockImage.Setup(i => i.Src).Returns("/media/test-image.jpg");
        mockImage.Setup(i => i.Alt).Returns("Test Alt Text");
        mockImage.Setup(i => i.Width).Returns(800);
        mockImage.Setup(i => i.Height).Returns(600);
        return mockImage.Object;
    }
    
    private static Link CreateMockLink()
    {
        var mockLink = new Mock<Link>();
        mockLink.Setup(l => l.Url).Returns("/test-page");
        mockLink.Setup(l => l.Text).Returns("Test Link Text");
        mockLink.Setup(l => l.Target).Returns("_self");
        mockLink.Setup(l => l.Title).Returns("Test Link Title");
        return mockLink.Object;
    }
}

// Base Test Class
public abstract class BaseSitecoreTest
{
    protected IServiceProvider ServiceProvider { get; private set; }
    protected Mock<ISitecoreContext> MockSitecoreContext { get; private set; }
    protected Mock<ILogger<{{ClassName}}>> MockLogger { get; private set; }
    protected Mock<ICacheService> MockCacheService { get; private set; }
    
    [TestInitialize]
    public virtual void TestInitialize()
    {
        ServiceProvider = MockConfiguration.CreateMockServiceProvider();
        MockSitecoreContext = new Mock<ISitecoreContext>();
        MockLogger = new Mock<ILogger<{{ClassName}}>>();
        MockCacheService = new Mock<ICacheService>();
        
        SetupCommonMocks();
    }
    
    protected virtual void SetupCommonMocks()
    {
        // Setup common mock behaviors that are used across multiple tests
        MockCacheService.Setup(c => c.GetOrSet(It.IsAny<string>(), It.IsAny<Func<object>>(), It.IsAny<TimeSpan>()))
                       .Returns<string, Func<object>, TimeSpan>((key, factory, duration) => factory());
    }
    
    protected T GetService<T>() where T : class
    {
        return ServiceProvider.GetService<T>();
    }
    
    protected {{ControllerName}} CreateController()
    {
        return new {{ControllerName}}(
            MockSitecoreContext.Object,
            MockLogger.Object,
            MockCacheService.Object
        );
    }
    
    [TestCleanup]
    public virtual void TestCleanup()
    {
        ServiceProvider?.Dispose();
    }
}

// Test Data Builders
public class {{ModelName}}TestDataBuilder
{
    private readonly {{ModelName}} _instance = new {{ModelName}}();
    
    public {{ModelName}}TestDataBuilder WithId(Guid id)
    {
        _instance.Id = id;
        return this;
    }
    
    public {{ModelName}}TestDataBuilder With{{PropertyName}}(string {{propertyName}})
    {
        _instance.{{PropertyName}} = {{propertyName}};
        return this;
    }
    
    public {{ModelName}}TestDataBuilder With{{BooleanProperty}}(bool {{booleanProperty}})
    {
        _instance.{{BooleanProperty}} = {{booleanProperty}};
        return this;
    }
    
    public {{ModelName}}TestDataBuilder With{{DateProperty}}(DateTime {{dateProperty}})
    {
        _instance.{{DateProperty}} = {{dateProperty}};
        return this;
    }
    
    public {{ModelName}}TestDataBuilder WithDefaults()
    {
        _instance.Id = Guid.NewGuid();
        _instance.{{PropertyName}} = "Default {{PropertyName}}";
        _instance.{{BooleanProperty}} = true;
        _instance.{{DateProperty}} = DateTime.Now;
        return this;
    }
    
    public {{ModelName}} Build() => _instance;
    
    public static implicit operator {{ModelName}}({{ModelName}}TestDataBuilder builder) => builder.Build();
}

// Mock HTTP Context Helper
public static class MockHttpContextHelper
{
    public static ControllerContext CreateControllerContext(string url = "/", string method = "GET")
    {
        var httpContext = new Mock<HttpContext>();
        var request = new Mock<HttpRequest>();
        var response = new Mock<HttpResponse>();
        
        request.Setup(r => r.Path).Returns(url);
        request.Setup(r => r.Method).Returns(method);
        request.Setup(r => r.Headers).Returns(new HeaderDictionary());
        request.Setup(r => r.Query).Returns(new QueryCollection());
        
        var responseHeaders = new Mock<IHeaderDictionary>();
        response.Setup(r => r.Headers).Returns(responseHeaders.Object);
        
        httpContext.Setup(c => c.Request).Returns(request.Object);
        httpContext.Setup(c => c.Response).Returns(response.Object);
        
        return new ControllerContext
        {
            HttpContext = httpContext.Object
        };
    }
    
    public static void SetupAuthentication(Mock<HttpContext> httpContext, string userName = "testuser", params string[] roles)
    {
        var identity = new Mock<IIdentity>();
        identity.Setup(i => i.Name).Returns(userName);
        identity.Setup(i => i.IsAuthenticated).Returns(true);
        
        var principal = new Mock<ClaimsPrincipal>();
        principal.Setup(p => p.Identity).Returns(identity.Object);
        principal.Setup(p => p.IsInRole(It.IsAny<string>())).Returns<string>(role => roles.Contains(role));
        
        httpContext.Setup(c => c.User).Returns(principal.Object);
    }
}

// Assert Extensions for Sitecore
public static class SitecoreAssertExtensions
{
    public static void AssertItemExists(this ISitecoreContext context, string path)
    {
        var item = context.Database.GetItem(path);
        Assert.IsNotNull(item, $"Item at path '{path}' does not exist");
    }
    
    public static void AssertItemHasField(this IItem item, string fieldName, string expectedValue = null)
    {
        Assert.IsNotNull(item, "Item cannot be null");
        var field = item.Fields[fieldName];
        Assert.IsNotNull(field, $"Field '{fieldName}' does not exist on item");
        
        if (expectedValue != null)
        {
            Assert.AreEqual(expectedValue, field.Value, $"Field '{fieldName}' value mismatch");
        }
    }
    
    public static void AssertViewModelProperty<T>(this T viewModel, Expression<Func<T, object>> propertyExpression, object expectedValue)
    {
        var memberExpression = propertyExpression.Body as MemberExpression ?? 
                              ((UnaryExpression)propertyExpression.Body).Operand as MemberExpression;
        
        var propertyName = memberExpression.Member.Name;
        var propertyInfo = typeof(T).GetProperty(propertyName);
        var actualValue = propertyInfo.GetValue(viewModel);
        
        Assert.AreEqual(expectedValue, actualValue, $"Property '{propertyName}' value mismatch");
    }
}

// Usage Example
[TestClass]
public class ExampleControllerTests : BaseSitecoreTest
{
    [TestMethod]
    public void Index_ReturnsViewWithCorrectModel()
    {
        // Arrange
        var testData = new {{ModelName}}TestDataBuilder()
            .WithDefaults()
            .With{{PropertyName}}("Test Value")
            .Build();
            
        MockSitecoreContext.Setup(ctx => ctx.GetCurrentItem<I{{ModelName}}>())
                          .Returns(testData);
        
        var controller = CreateController();
        
        // Act
        var result = controller.Index() as ViewResult;
        
        // Assert
        Assert.IsNotNull(result);
        Assert.IsInstanceOfType(result.Model, typeof({{ViewModelName}}));
        
        var viewModel = result.Model as {{ViewModelName}};
        viewModel.AssertViewModelProperty(vm => vm.{{PropertyName}}, "Test Value");
    }
}`,
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
        content: `Implement end-to-end tests using Selenium WebDriver with page object pattern, cross-browser testing, and CI/CD integration.

// End-to-End Test Implementation with Selenium WebDriver
[TestClass]
public class {{FeatureName}}E2ETests
{
    private static IWebDriver _driver;
    private static WebDriverWait _wait;
    private static TestContext _testContext;
    private static IConfiguration _configuration;
    
    [ClassInitialize]
    public static void ClassInitialize(TestContext context)
    {
        _testContext = context;
        
        // Load test configuration
        var configBuilder = new ConfigurationBuilder()
            .AddJsonFile("appsettings.e2e.json", optional: false)
            .AddEnvironmentVariables("E2E_");
        _configuration = configBuilder.Build();
        
        // Initialize WebDriver based on configuration
        var browserType = _configuration["Browser"] ?? "Chrome";
        _driver = CreateWebDriver(browserType);
        _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(30));
        
        // Set implicit wait
        _driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);
        
        // Maximize window for consistent testing
        _driver.Manage().Window.Maximize();
    }
    
    private static IWebDriver CreateWebDriver(string browserType)
    {
        var options = new ChromeOptions();
        
        switch (browserType.ToLower())
        {
            case "chrome":
                // Chrome options for CI/CD environments
                options.AddArguments("--no-sandbox");
                options.AddArguments("--disable-dev-shm-usage");
                options.AddArguments("--disable-gpu");
                
                if (_configuration.GetValue<bool>("Headless"))
                {
                    options.AddArguments("--headless");
                }
                
                return new ChromeDriver(options);
                
            case "firefox":
                var firefoxOptions = new FirefoxOptions();
                if (_configuration.GetValue<bool>("Headless"))
                {
                    firefoxOptions.AddArguments("--headless");
                }
                return new FirefoxDriver(firefoxOptions);
                
            case "edge":
                var edgeOptions = new EdgeOptions();
                if (_configuration.GetValue<bool>("Headless"))
                {
                    edgeOptions.AddArguments("--headless");
                }
                return new EdgeDriver(edgeOptions);
                
            default:
                throw new ArgumentException($"Unsupported browser type: {browserType}");
        }
    }
    
    [TestInitialize]
    public void TestInitialize()
    {
        // Navigate to the base URL before each test
        var baseUrl = _configuration["BaseUrl"] ?? "http://localhost";
        _driver.Navigate().GoToUrl(baseUrl);
        
        // Clear cookies and local storage
        _driver.Manage().Cookies.DeleteAllCookies();
        ((IJavaScriptExecutor)_driver).ExecuteScript("localStorage.clear();");
        ((IJavaScriptExecutor)_driver).ExecuteScript("sessionStorage.clear();");
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("Smoke")]
    public void HomePage_LoadsSuccessfully()
    {
        // Arrange
        var homePage = new HomePage(_driver);
        
        // Act
        var isLoaded = homePage.WaitForPageLoad();
        
        // Assert
        Assert.IsTrue(isLoaded, "Home page should load successfully");
        Assert.IsTrue(homePage.IsHeaderVisible(), "Header should be visible");
        Assert.IsTrue(homePage.IsNavigationVisible(), "Navigation should be visible");
        Assert.IsTrue(homePage.IsFooterVisible(), "Footer should be visible");
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("Navigation")]
    public void Navigation_AllLinksWorkCorrectly()
    {
        // Arrange
        var homePage = new HomePage(_driver);
        var navigationPage = new NavigationPage(_driver);
        
        // Act & Assert
        homePage.WaitForPageLoad();
        var navigationLinks = navigationPage.GetAllNavigationLinks();
        
        foreach (var link in navigationLinks)
        {
            navigationPage.ClickNavigationLink(link);
            
            // Wait for page to load
            _wait.Until(driver => ((IJavaScriptExecutor)driver)
                .ExecuteScript("return document.readyState").Equals("complete"));
            
            // Verify page loads without errors
            var pageTitle = _driver.Title;
            Assert.IsFalse(string.IsNullOrEmpty(pageTitle), 
                $"Page title should not be empty for link: {link}");
            
            // Check for common error indicators
            var errorElements = _driver.FindElements(By.CssSelector(".error, .exception, [data-error]"));
            Assert.AreEqual(0, errorElements.Count, 
                $"No error elements should be present on page: {link}");
        }
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("Forms")]
    public void ContactForm_SubmitsSuccessfully()
    {
        // Arrange
        var contactPage = new ContactPage(_driver);
        var formData = new ContactFormData
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            Phone = "+1-555-123-4567",
            Message = "This is a test message for E2E testing purposes."
        };
        
        // Act
        contactPage.NavigateToContactPage();
        contactPage.WaitForPageLoad();
        
        contactPage.FillContactForm(formData);
        var successPage = contactPage.SubmitForm();
        
        // Assert
        Assert.IsTrue(successPage.IsSuccessMessageVisible(), 
            "Success message should be displayed after form submission");
        
        var confirmationNumber = successPage.GetConfirmationNumber();
        Assert.IsFalse(string.IsNullOrEmpty(confirmationNumber), 
            "Confirmation number should be generated");
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("Search")]
    public void SearchFunctionality_ReturnsResults()
    {
        // Arrange
        var searchPage = new SearchPage(_driver);
        var searchTerm = "test content";
        
        // Act
        searchPage.NavigateToSearchPage();
        searchPage.WaitForPageLoad();
        
        var resultsPage = searchPage.PerformSearch(searchTerm);
        
        // Assert
        Assert.IsTrue(resultsPage.HasResults(), "Search should return results");
        Assert.IsTrue(resultsPage.GetResultCount() > 0, "Result count should be greater than 0");
        
        var results = resultsPage.GetSearchResults();
        Assert.IsTrue(results.Any(r => r.Title.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                                      r.Description.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)),
            "At least one result should contain the search term");
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("Responsive")]
    public void ResponsiveDesign_WorksOnDifferentScreenSizes()
    {
        // Arrange
        var homePage = new HomePage(_driver);
        var screenSizes = new[]
        {
            new { Width = 1920, Height = 1080, Name = "Desktop" },
            new { Width = 1024, Height = 768, Name = "Tablet" },
            new { Width = 375, Height = 667, Name = "Mobile" }
        };
        
        foreach (var size in screenSizes)
        {
            // Act
            _driver.Manage().Window.Size = new Size(size.Width, size.Height);
            homePage.WaitForPageLoad();
            
            // Assert
            Assert.IsTrue(homePage.IsHeaderVisible(), 
                $"Header should be visible on {size.Name}");
            Assert.IsTrue(homePage.IsContentVisible(), 
                $"Content should be visible on {size.Name}");
            
            // Check for horizontal scrollbar (should not be present)
            var hasHorizontalScroll = (bool)((IJavaScriptExecutor)_driver)
                .ExecuteScript("return document.body.scrollWidth > window.innerWidth");
            Assert.IsFalse(hasHorizontalScroll, 
                $"No horizontal scrollbar should appear on {size.Name}");
        }
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("Performance")]
    public void PageLoadTime_IsWithinAcceptableRange()
    {
        // Arrange
        var performancePage = new PerformancePage(_driver);
        var maxLoadTime = TimeSpan.FromSeconds(5);
        
        // Act
        var stopwatch = Stopwatch.StartNew();
        performancePage.NavigateToPage();
        performancePage.WaitForPageLoad();
        stopwatch.Stop();
        
        // Assert
        Assert.IsTrue(stopwatch.Elapsed < maxLoadTime, 
            $"Page should load within {maxLoadTime.TotalSeconds} seconds. Actual: {stopwatch.Elapsed.TotalSeconds}s");
        
        // Check for JavaScript errors
        var jsErrors = ((IJavaScriptExecutor)_driver)
            .ExecuteScript("return window.jsErrors || []") as IEnumerable<object>;
        Assert.AreEqual(0, jsErrors?.Count() ?? 0, "No JavaScript errors should be present");
    }
    
    [TestMethod]
    [TestCategory("E2E")]
    [TestCategory("CrossBrowser")]
    [DataRow("Chrome")]
    [DataRow("Firefox")]
    [DataRow("Edge")]
    public void CrossBrowserCompatibility_AllBrowsersWork(string browserType)
    {
        // This test can be run with different browsers in CI/CD
        // The browser is set via configuration or test parameters
        
        // Arrange
        using var browserDriver = CreateWebDriver(browserType);
        var homePage = new HomePage(browserDriver);
        
        // Act
        browserDriver.Navigate().GoToUrl(_configuration["BaseUrl"]);
        var isLoaded = homePage.WaitForPageLoad();
        
        // Assert
        Assert.IsTrue(isLoaded, $"Page should load correctly in {browserType}");
        Assert.IsTrue(homePage.IsHeaderVisible(), $"Header should be visible in {browserType}");
        Assert.IsTrue(homePage.IsNavigationVisible(), $"Navigation should work in {browserType}");
    }
    
    [TestCleanup]
    public void TestCleanup()
    {
        // Take screenshot on test failure
        if (_testContext.CurrentTestOutcome == UnitTestOutcome.Failed)
        {
            TakeScreenshot();
        }
    }
    
    private void TakeScreenshot()
    {
        try
        {
            var screenshot = ((ITakesScreenshot)_driver).GetScreenshot();
            var filename = $"{_testContext.TestName}_{DateTime.Now:yyyyMMdd_HHmmss}.png";
            var filepath = Path.Combine(_testContext.TestResultsDirectory, filename);
            screenshot.SaveAsFile(filepath, ScreenshotImageFormat.Png);
            
            _testContext.WriteLine($"Screenshot saved: {filepath}");
        }
        catch (Exception ex)
        {
            _testContext.WriteLine($"Failed to take screenshot: {ex.Message}");
        }
    }
    
    [ClassCleanup]
    public static void ClassCleanup()
    {
        _driver?.Quit();
        _driver?.Dispose();
    }
}

// Page Object Models
public class HomePage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;
    
    // Locators
    private readonly By HeaderLocator = By.CssSelector("header");
    private readonly By NavigationLocator = By.CssSelector("nav");
    private readonly By FooterLocator = By.CssSelector("footer");
    private readonly By ContentLocator = By.CssSelector("main");
    
    public HomePage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
    }
    
    public bool WaitForPageLoad()
    {
        return _wait.Until(driver => 
            ((IJavaScriptExecutor)driver).ExecuteScript("return document.readyState").Equals("complete"));
    }
    
    public bool IsHeaderVisible()
    {
        return _driver.FindElements(HeaderLocator).Any(e => e.Displayed);
    }
    
    public bool IsNavigationVisible()
    {
        return _driver.FindElements(NavigationLocator).Any(e => e.Displayed);
    }
    
    public bool IsFooterVisible()
    {
        return _driver.FindElements(FooterLocator).Any(e => e.Displayed);
    }
    
    public bool IsContentVisible()
    {
        return _driver.FindElements(ContentLocator).Any(e => e.Displayed);
    }
}

public class ContactPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;
    
    // Form locators
    private readonly By FirstNameInput = By.Id("firstName");
    private readonly By LastNameInput = By.Id("lastName");
    private readonly By EmailInput = By.Id("email");
    private readonly By PhoneInput = By.Id("phone");
    private readonly By MessageTextarea = By.Id("message");
    private readonly By SubmitButton = By.CssSelector("button[type='submit']");
    
    public ContactPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
    }
    
    public void NavigateToContactPage()
    {
        _driver.Navigate().GoToUrl(_driver.Url + "/contact");
    }
    
    public bool WaitForPageLoad()
    {
        return _wait.Until(driver => driver.FindElement(FirstNameInput).Displayed);
    }
    
    public void FillContactForm(ContactFormData formData)
    {
        _driver.FindElement(FirstNameInput).SendKeys(formData.FirstName);
        _driver.FindElement(LastNameInput).SendKeys(formData.LastName);
        _driver.FindElement(EmailInput).SendKeys(formData.Email);
        _driver.FindElement(PhoneInput).SendKeys(formData.Phone);
        _driver.FindElement(MessageTextarea).SendKeys(formData.Message);
    }
    
    public SuccessPage SubmitForm()
    {
        _driver.FindElement(SubmitButton).Click();
        return new SuccessPage(_driver);
    }
}

public class ContactFormData
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Message { get; set; }
}

public class SuccessPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;
    
    private readonly By SuccessMessageLocator = By.CssSelector(".success-message");
    private readonly By ConfirmationNumberLocator = By.CssSelector(".confirmation-number");
    
    public SuccessPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
    }
    
    public bool IsSuccessMessageVisible()
    {
        return _wait.Until(driver => driver.FindElement(SuccessMessageLocator).Displayed);
    }
    
    public string GetConfirmationNumber()
    {
        return _driver.FindElement(ConfirmationNumberLocator).Text;
    }
}

// E2E Test Configuration (appsettings.e2e.json)
{
  "BaseUrl": "https://localhost:5001",
  "Browser": "Chrome",
  "Headless": false,
  "Timeout": 30,
  "ImplicitWait": 10,
  "Screenshots": {
    "OnFailure": true,
    "Directory": "Screenshots"
  },
  "CrossBrowser": {
    "Enabled": true,
    "Browsers": ["Chrome", "Firefox", "Edge"]
  },
  "Parallel": {
    "Enabled": false,
    "MaxDegreeOfParallelism": 3
  }
}`,
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
        content: `Generate a comprehensive unit test suite template with proper mocking, setup, and test structure for .NET applications.

// Comprehensive Unit Test Suite Template
// Complete testing framework with mocking, setup, and structured test organization

using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using FluentAssertions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Glass.Mapper.Sc;
using {{ProjectNamespace}}.Foundation.Testing;
using {{ProjectNamespace}}.Feature.{{FeatureName}}.Services;
using {{ProjectNamespace}}.Feature.{{FeatureName}}.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace {{ProjectNamespace}}.Feature.{{FeatureName}}.Tests
{
    [TestClass]
    public class {{ServiceName}}Tests
    {
        private Mock<ISitecoreContext> _mockSitecoreContext;
        private Mock<ILogService> _mockLogService;
        private Mock<ICacheService> _mockCacheService;
        private {{ServiceName}} _service;
        private TestContext _testContext;
        
        [TestInitialize]
        public void Setup()
        {
            // Initialize mocks
            _mockSitecoreContext = new Mock<ISitecoreContext>();
            _mockLogService = new Mock<ILogService>();
            _mockCacheService = new Mock<ICacheService>();
            
            // Setup service under test
            _service = new {{ServiceName}}(
                _mockSitecoreContext.Object,
                _mockLogService.Object,
                _mockCacheService.Object
            );
        }
        
        [TestCleanup]
        public void Cleanup()
        {
            // Clean up resources
            _mockSitecoreContext.Reset();
            _mockLogService.Reset();
            _mockCacheService.Reset();
        }
        
        #region GetItem Tests
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetItem_ValidId_ReturnsItem()
        {
            // Arrange
            var itemId = Guid.NewGuid();
            var expectedItem = CreateTestItem(itemId, "Test Item");
            
            _mockSitecoreContext
                .Setup(x => x.GetItem<ITestModel>(itemId))
                .Returns(expectedItem);
            
            // Act
            var result = _service.GetItem(itemId);
            
            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(itemId);
            result.Name.Should().Be("Test Item");
            
            _mockSitecoreContext.Verify(x => x.GetItem<ITestModel>(itemId), Times.Once);
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetItem_InvalidId_ReturnsNull()
        {
            // Arrange
            var itemId = Guid.Empty;
            
            _mockSitecoreContext
                .Setup(x => x.GetItem<ITestModel>(itemId))
                .Returns((ITestModel)null);
            
            // Act
            var result = _service.GetItem(itemId);
            
            // Assert
            result.Should().BeNull();
            _mockSitecoreContext.Verify(x => x.GetItem<ITestModel>(itemId), Times.Once);
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetItem_ExceptionThrown_LogsErrorAndReturnsNull()
        {
            // Arrange
            var itemId = Guid.NewGuid();
            var exception = new Exception("Test exception");
            
            _mockSitecoreContext
                .Setup(x => x.GetItem<ITestModel>(itemId))
                .Throws(exception);
            
            // Act
            var result = _service.GetItem(itemId);
            
            // Assert
            result.Should().BeNull();
            _mockLogService.Verify(x => x.Error(It.IsAny<string>(), exception), Times.Once);
        }
        
        #endregion
        
        #region GetItems Tests
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetItems_ValidQuery_ReturnsItems()
        {
            // Arrange
            var expectedItems = new List<ITestModel>
            {
                CreateTestItem(Guid.NewGuid(), "Item 1"),
                CreateTestItem(Guid.NewGuid(), "Item 2"),
                CreateTestItem(Guid.NewGuid(), "Item 3")
            };
            
            var query = "fast:/sitecore/content/home//*[@@templatename='Test Template']";
            
            _mockSitecoreContext
                .Setup(x => x.Query<ITestModel>(query))
                .Returns(expectedItems);
            
            // Act
            var result = _service.GetItems(query);
            
            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
            result.First().Name.Should().Be("Item 1");
            
            _mockSitecoreContext.Verify(x => x.Query<ITestModel>(query), Times.Once);
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetItems_EmptyQuery_ReturnsEmptyCollection()
        {
            // Arrange
            var query = string.Empty;
            
            // Act
            var result = _service.GetItems(query);
            
            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
            _mockSitecoreContext.Verify(x => x.Query<ITestModel>(It.IsAny<string>()), Times.Never);
        }
        
        #endregion
        
        #region Caching Tests
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetCachedItem_ItemInCache_ReturnsCachedItem()
        {
            // Arrange
            var itemId = Guid.NewGuid();
            var cachedItem = CreateTestItem(itemId, "Cached Item");
            var cacheKey = $"test-item-{itemId}";
            
            _mockCacheService
                .Setup(x => x.Get<ITestModel>(cacheKey))
                .Returns(cachedItem);
            
            // Act
            var result = _service.GetCachedItem(itemId);
            
            // Assert
            result.Should().NotBeNull();
            result.Should().Be(cachedItem);
            
            _mockCacheService.Verify(x => x.Get<ITestModel>(cacheKey), Times.Once);
            _mockSitecoreContext.Verify(x => x.GetItem<ITestModel>(It.IsAny<Guid>()), Times.Never);
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void GetCachedItem_ItemNotInCache_FetchesAndCachesItem()
        {
            // Arrange
            var itemId = Guid.NewGuid();
            var freshItem = CreateTestItem(itemId, "Fresh Item");
            var cacheKey = $"test-item-{itemId}";
            
            _mockCacheService
                .Setup(x => x.Get<ITestModel>(cacheKey))
                .Returns((ITestModel)null);
            
            _mockSitecoreContext
                .Setup(x => x.GetItem<ITestModel>(itemId))
                .Returns(freshItem);
            
            _mockCacheService
                .Setup(x => x.Set(cacheKey, freshItem, TimeSpan.FromMinutes(30)))
                .Verifiable();
            
            // Act
            var result = _service.GetCachedItem(itemId);
            
            // Assert
            result.Should().NotBeNull();
            result.Should().Be(freshItem);
            
            _mockCacheService.Verify(x => x.Get<ITestModel>(cacheKey), Times.Once);
            _mockCacheService.Verify(x => x.Set(cacheKey, freshItem, TimeSpan.FromMinutes(30)), Times.Once);
            _mockSitecoreContext.Verify(x => x.GetItem<ITestModel>(itemId), Times.Once);
        }
        
        #endregion
        
        #region Validation Tests
        
        [TestMethod]
        [TestCategory("Unit")]
        [DataRow("", false)]
        [DataRow(null, false)]
        [DataRow("Valid Name", true)]
        [DataRow("Name with 123 numbers", true)]
        public void ValidateItemName_VariousInputs_ReturnsExpectedResult(string name, bool expectedResult)
        {
            // Act
            var result = _service.ValidateItemName(name);
            
            // Assert
            result.Should().Be(expectedResult);
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void ValidateItem_ValidItem_ReturnsTrue()
        {
            // Arrange
            var item = CreateTestItem(Guid.NewGuid(), "Valid Item");
            item.Title = "Valid Title";
            item.Description = "Valid Description";
            
            // Act
            var result = _service.ValidateItem(item);
            
            // Assert
            result.Should().BeTrue();
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void ValidateItem_NullItem_ReturnsFalse()
        {
            // Act
            var result = _service.ValidateItem(null);
            
            // Assert
            result.Should().BeFalse();
        }
        
        #endregion
        
        #region Business Logic Tests
        
        [TestMethod]
        [TestCategory("Unit")]
        public void ProcessItems_ValidItems_ProcessesAllItems()
        {
            // Arrange
            var items = new List<ITestModel>
            {
                CreateTestItem(Guid.NewGuid(), "Item 1"),
                CreateTestItem(Guid.NewGuid(), "Item 2"),
                CreateTestItem(Guid.NewGuid(), "Item 3")
            };
            
            // Act
            var result = _service.ProcessItems(items);
            
            // Assert
            result.Should().NotBeNull();
            result.ProcessedCount.Should().Be(3);
            result.SuccessfulCount.Should().Be(3);
            result.FailedCount.Should().Be(0);
        }
        
        [TestMethod]
        [TestCategory("Unit")]
        public void ProcessItems_EmptyCollection_ReturnsEmptyResult()
        {
            // Arrange
            var items = new List<ITestModel>();
            
            // Act
            var result = _service.ProcessItems(items);
            
            // Assert
            result.Should().NotBeNull();
            result.ProcessedCount.Should().Be(0);
            result.SuccessfulCount.Should().Be(0);
            result.FailedCount.Should().Be(0);
        }
        
        #endregion
        
        #region Helper Methods
        
        private ITestModel CreateTestItem(Guid id, string name)
        {
            var mock = new Mock<ITestModel>();
            mock.Setup(x => x.Id).Returns(id);
            mock.Setup(x => x.Name).Returns(name);
            mock.Setup(x => x.Path).Returns($"/sitecore/content/test/{name.ToLower().Replace(" ", "-")}");
            mock.Setup(x => x.CreatedDate).Returns(DateTime.UtcNow);
            mock.Setup(x => x.ModifiedDate).Returns(DateTime.UtcNow);
            return mock.Object;
        }
        
        private void SetupSitecoreContext()
        {
            var mockDatabase = new Mock<Database>();
            _mockSitecoreContext.Setup(x => x.Database).Returns(mockDatabase.Object);
        }
        
        #endregion
    }
    
    // Integration Tests with FakeDb
    [TestClass]
    public class {{ServiceName}}IntegrationTests
    {
        [TestMethod]
        [TestCategory("Integration")]
        public void GetItem_RealSitecoreItem_ReturnsCorrectData()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Test Item", new ID(Guid.NewGuid()))
                {
                    new DbField("Title") { Value = "Integration Test Title" },
                    new DbField("Description") { Value = "Integration test description" }
                }
            })
            {
                var item = db.GetItem("/sitecore/content/Test Item");
                var context = new SitecoreContext();
                var service = new {{ServiceName}}(context, new Mock<ILogService>().Object, new Mock<ICacheService>().Object);
                
                // Act
                var result = service.GetItem(item.ID.Guid);
                
                // Assert
                result.Should().NotBeNull();
                result.Id.Should().Be(item.ID.Guid);
            }
        }
        
        [TestMethod]
        [TestCategory("Integration")]
        public void Query_RealDatabase_ReturnsItems()
        {
            // Arrange
            using (var db = new Db
            {
                new DbItem("Item 1", new ID(Guid.NewGuid())) { TemplateID = TemplateIDs.Sample },
                new DbItem("Item 2", new ID(Guid.NewGuid())) { TemplateID = TemplateIDs.Sample },
                new DbItem("Item 3", new ID(Guid.NewGuid())) { TemplateID = TemplateIDs.Sample }
            })
            {
                var context = new SitecoreContext();
                var service = new {{ServiceName}}(context, new Mock<ILogService>().Object, new Mock<ICacheService>().Object);
                var query = "fast:/sitecore/content//*";
                
                // Act
                var result = service.GetItems(query);
                
                // Assert
                result.Should().NotBeNull();
                result.Should().HaveCountGreaterThan(0);
            }
        }
    }
    
    // Performance Tests
    [TestClass]
    public class {{ServiceName}}PerformanceTests
    {
        private {{ServiceName}} _service;
        private Stopwatch _stopwatch;
        
        [TestInitialize]
        public void Setup()
        {
            var mockContext = new Mock<ISitecoreContext>();
            var mockLogger = new Mock<ILogService>();
            var mockCache = new Mock<ICacheService>();
            
            _service = new {{ServiceName}}(mockContext.Object, mockLogger.Object, mockCache.Object);
            _stopwatch = new Stopwatch();
        }
        
        [TestMethod]
        [TestCategory("Performance")]
        public void GetItem_PerformanceTest_CompletesWithinTimeLimit()
        {
            // Arrange
            var itemId = Guid.NewGuid();
            var timeLimit = TimeSpan.FromMilliseconds(100);
            
            // Act
            _stopwatch.Start();
            var result = _service.GetItem(itemId);
            _stopwatch.Stop();
            
            // Assert
            _stopwatch.Elapsed.Should().BeLessThan(timeLimit);
        }
        
        [TestMethod]
        [TestCategory("Performance")]
        public void ProcessLargeItemSet_PerformanceTest_CompletesWithinTimeLimit()
        {
            // Arrange
            var items = CreateLargeItemSet(1000);
            var timeLimit = TimeSpan.FromSeconds(5);
            
            // Act
            _stopwatch.Start();
            var result = _service.ProcessItems(items);
            _stopwatch.Stop();
            
            // Assert
            _stopwatch.Elapsed.Should().BeLessThan(timeLimit);
            result.ProcessedCount.Should().Be(1000);
        }
        
        private List<ITestModel> CreateLargeItemSet(int count)
        {
            var items = new List<ITestModel>();
            for (int i = 0; i < count; i++)
            {
                var mock = new Mock<ITestModel>();
                mock.Setup(x => x.Id).Returns(Guid.NewGuid());
                mock.Setup(x => x.Name).Returns($"Item {i}");
                items.Add(mock.Object);
            }
            return items;
        }
    }
}

// Test Configuration and Setup
public static class TestConfiguration
{
    public static void ConfigureTestDependencies(IServiceCollection services)
    {
        services.AddSingleton<ILogService, TestLogService>();
        services.AddSingleton<ICacheService, TestCacheService>();
        services.AddScoped<ISitecoreContext, TestSitecoreContext>();
    }
}

// Test Data Builders
public class TestModelBuilder
{
    private readonly Mock<ITestModel> _mock = new Mock<ITestModel>();
    
    public TestModelBuilder WithId(Guid id)
    {
        _mock.Setup(x => x.Id).Returns(id);
        return this;
    }
    
    public TestModelBuilder WithName(string name)
    {
        _mock.Setup(x => x.Name).Returns(name);
        return this;
    }
    
    public TestModelBuilder WithPath(string path)
    {
        _mock.Setup(x => x.Path).Returns(path);
        return this;
    }
    
    public ITestModel Build() => _mock.Object;
}`,
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
        content: `Create a complete Azure DevOps CI/CD pipeline template with build, test, and deployment stages for .NET applications.

# Azure DevOps CI/CD Pipeline Template
# Complete pipeline with build, test, and deployment stages for .NET applications

trigger:
  branches:
    include:
    - main
    - develop
    - feature/*
  paths:
    exclude:
    - README.md
    - docs/*

pr:
  branches:
    include:
    - main
    - develop

variables:
  buildConfiguration: 'Release'
  dotNetFramework: 'net8.0'
  dotNetVersion: '8.0.x'
  vmImageName: 'windows-latest'
  solutionPath: '**/*.sln'
  testProjectsPath: '**/*Tests.csproj'
  artifactName: 'drop'
  
  # SonarCloud variables
  sonarCloudServiceConnection: 'SonarCloud'
  sonarCloudProjectKey: 'your-project-key'
  sonarCloudProjectName: 'your-project-name'
  sonarCloudOrganization: 'your-org'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: Build
    displayName: 'Build Solution'
    pool:
      vmImage: $(vmImageName)
    
    steps:
    - checkout: self
      fetchDepth: 0  # Needed for SonarCloud analysis
    
    - task: UseDotNet@2
      displayName: 'Use .NET $(dotNetVersion)'
      inputs:
        packageType: 'sdk'
        version: $(dotNetVersion)
        includePreviewVersions: false
    
    - task: SonarCloudPrepare@1
      displayName: 'Prepare SonarCloud Analysis'
      inputs:
        SonarCloud: $(sonarCloudServiceConnection)
        organization: $(sonarCloudOrganization)
        scannerMode: 'MSBuild'
        projectKey: $(sonarCloudProjectKey)
        projectName: $(sonarCloudProjectName)
        extraProperties: |
          sonar.coverage.exclusions=**/*Tests.cs,**/Program.cs
          sonar.cs.opencover.reportsPaths=$(Agent.TempDirectory)/**/coverage.opencover.xml
    
    - task: NuGetToolInstaller@1
      displayName: 'Install NuGet'
      inputs:
        versionSpec: '>=5.0.0'
    
    - task: NuGetCommand@2
      displayName: 'Restore NuGet packages'
      inputs:
        command: 'restore'
        restoreSolution: $(solutionPath)
        feedsToUse: 'select'
        vstsFeed: 'your-feed-id'  # Optional: if using private NuGet feed
    
    - task: DotNetCoreCLI@2
      displayName: 'Build Solution'
      inputs:
        command: 'build'
        projects: $(solutionPath)
        arguments: '--configuration $(buildConfiguration) --no-restore'
    
    - task: DotNetCoreCLI@2
      displayName: 'Run Unit Tests'
      inputs:
        command: 'test'
        projects: $(testProjectsPath)
        arguments: '--configuration $(buildConfiguration) --no-build --collect:"XPlat Code Coverage" --results-directory $(Agent.TempDirectory) --logger trx --collect "Code coverage"'
        publishTestResults: true
    
    - task: PublishCodeCoverageResults@1
      displayName: 'Publish Code Coverage'
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: $(Agent.TempDirectory)/**/coverage.cobertura.xml
    
    - task: SonarCloudAnalyze@1
      displayName: 'Run SonarCloud Analysis'
    
    - task: SonarCloudPublish@1
      displayName: 'Publish SonarCloud Results'
      inputs:
        pollingTimeoutSec: '300'
    
    - task: DotNetCoreCLI@2
      displayName: 'Publish Application'
      inputs:
        command: 'publish'
        publishWebProjects: true
        arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
        zipAfterPublish: true
        modifyOutputPath: false
    
    - task: PublishBuildArtifacts@1
      displayName: 'Publish Build Artifacts'
      inputs:
        pathToPublish: $(Build.ArtifactStagingDirectory)
        artifactName: $(artifactName)
        publishLocation: 'Container'

- stage: SecurityScan
  displayName: 'Security Scanning'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - job: SecurityScan
    displayName: 'Run Security Scans'
    pool:
      vmImage: $(vmImageName)
    
    steps:
    - task: WhiteSource@21
      displayName: 'WhiteSource Security Scan'
      inputs:
        cwd: '$(Build.SourcesDirectory)'
        projectName: '$(Build.Repository.Name)'
    
    - task: CredScan@3
      displayName: 'Credential Scanner'
      inputs:
        toolMajorVersion: 'V2'
        scanFolder: '$(Build.SourcesDirectory)'
        debugMode: false
    
    - task: Semmle@1
      displayName: 'CodeQL Security Scan'
      inputs:
        sourceCodeDirectory: '$(Build.SourcesDirectory)'
        language: 'csharp'
        buildcommands: 'dotnet build $(solutionPath) --configuration $(buildConfiguration)'

- stage: DeployDev
  displayName: 'Deploy to Development'
  dependsOn: 
  - Build
  - SecurityScan
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
  variables:
  - group: 'Development Environment'
  jobs:
  - deployment: DeployToDev
    displayName: 'Deploy to Development Environment'
    pool:
      vmImage: $(vmImageName)
    environment: 'Development'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            displayName: 'Download Build Artifacts'
            inputs:
              buildType: 'current'
              downloadType: 'single'
              artifactName: $(artifactName)
              downloadPath: '$(System.ArtifactsDirectory)'
          
          - task: AzureRmWebAppDeployment@4
            displayName: 'Deploy to Azure Web App'
            inputs:
              ConnectionType: 'AzureRM'
              azureSubscription: '$(Azure.ServiceConnection)'
              appType: 'webApp'
              WebAppName: '$(WebApp.Name.Dev)'
              packageForLinux: '$(System.ArtifactsDirectory)/$(artifactName)/**/*.zip'
              enableCustomDeployment: true
              DeploymentType: 'webDeploy'
              ExcludeFilesFromAppDataFlag: false
              
          - task: AzureCLI@2
            displayName: 'Run Database Migrations'
            inputs:
              azureSubscription: '$(Azure.ServiceConnection)'
              scriptType: 'ps'
              scriptLocation: 'inlineScript'
              inlineScript: |
                az webapp config connection-string set --name $(WebApp.Name.Dev) --resource-group $(ResourceGroup.Name.Dev) --connection-string-type SQLServer --settings DefaultConnection="$(ConnectionString.Dev)"
                
          - task: DotNetCoreCLI@2
            displayName: 'Run Integration Tests'
            inputs:
              command: 'test'
              projects: '**/*IntegrationTests.csproj'
              arguments: '--configuration $(buildConfiguration) --logger trx'
              
          - task: PowerShell@2
            displayName: 'Health Check'
            inputs:
              targetType: 'inline'
              script: |
                $response = Invoke-WebRequest -Uri "$(WebApp.Url.Dev)/health" -Method GET
                if ($response.StatusCode -ne 200) {
                  throw "Health check failed with status code: $($response.StatusCode)"
                }
                Write-Host "Health check passed"

- stage: DeployStaging
  displayName: 'Deploy to Staging'
  dependsOn: DeployDev
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  variables:
  - group: 'Staging Environment'
  jobs:
  - deployment: DeployToStaging
    displayName: 'Deploy to Staging Environment'
    pool:
      vmImage: $(vmImageName)
    environment: 'Staging'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            displayName: 'Download Build Artifacts'
            inputs:
              buildType: 'current'
              downloadType: 'single'
              artifactName: $(artifactName)
              downloadPath: '$(System.ArtifactsDirectory)'
          
          - task: AzureRmWebAppDeployment@4
            displayName: 'Deploy to Azure Web App'
            inputs:
              ConnectionType: 'AzureRM'
              azureSubscription: '$(Azure.ServiceConnection)'
              appType: 'webApp'
              WebAppName: '$(WebApp.Name.Staging)'
              packageForLinux: '$(System.ArtifactsDirectory)/$(artifactName)/**/*.zip'
              slotName: 'staging'
              
          - task: AzureAppServiceManage@0
            displayName: 'Swap Deployment Slots'
            inputs:
              azureSubscription: '$(Azure.ServiceConnection)'
              WebAppName: '$(WebApp.Name.Staging)'
              ResourceGroupName: '$(ResourceGroup.Name.Staging)'
              SourceSlot: 'staging'
              SwapWithProduction: true
              
          - task: PowerShell@2
            displayName: 'Run Smoke Tests'
            inputs:
              targetType: 'inline'
              script: |
                # Add smoke test scripts here
                Write-Host "Running smoke tests..."
                # Example: Invoke-Pester -Path "$(System.DefaultWorkingDirectory)/SmokeTests" -OutputFile "$(System.DefaultWorkingDirectory)/SmokeTestResults.xml" -OutputFormat NUnitXml

- stage: DeployProduction
  displayName: 'Deploy to Production'
  dependsOn: DeployStaging
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  variables:
  - group: 'Production Environment'
  jobs:
  - deployment: DeployToProduction
    displayName: 'Deploy to Production Environment'
    pool:
      vmImage: $(vmImageName)
    environment: 'Production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            displayName: 'Download Build Artifacts'
            inputs:
              buildType: 'current'
              downloadType: 'single'
              artifactName: $(artifactName)
              downloadPath: '$(System.ArtifactsDirectory)'
          
          - task: AzureCLI@2
            displayName: 'Create Application Backup'
            inputs:
              azureSubscription: '$(Azure.ServiceConnection)'
              scriptType: 'ps'
              scriptLocation: 'inlineScript'
              inlineScript: |
                $backupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                az webapp config backup create --resource-group $(ResourceGroup.Name.Prod) --webapp-name $(WebApp.Name.Prod) --backup-name $backupName --container-url "$(Backup.StorageUrl)"
                
          - task: AzureRmWebAppDeployment@4
            displayName: 'Deploy to Production'
            inputs:
              ConnectionType: 'AzureRM'
              azureSubscription: '$(Azure.ServiceConnection)'
              appType: 'webApp'
              WebAppName: '$(WebApp.Name.Prod)'
              packageForLinux: '$(System.ArtifactsDirectory)/$(artifactName)/**/*.zip'
              
          - task: PowerShell@2
            displayName: 'Production Health Check'
            inputs:
              targetType: 'inline'
              script: |
                Start-Sleep -Seconds 30  # Wait for app to start
                $response = Invoke-WebRequest -Uri "$(WebApp.Url.Prod)/health" -Method GET
                if ($response.StatusCode -ne 200) {
                  throw "Production health check failed"
                }
                Write-Host "Production deployment successful"
                
          - task: PowerShell@2
            displayName: 'Send Deployment Notification'
            inputs:
              targetType: 'inline'
              script: |
                # Send Teams/Slack notification
                $webhook = "$(Notification.WebhookUrl)"
                $body = @{
                  text = "✅ Production deployment successful for $(Build.Repository.Name) - Build $(Build.BuildNumber)"
                } | ConvertTo-Json
                Invoke-RestMethod -Uri $webhook -Method Post -Body $body -ContentType 'application/json'

# Variable Groups Configuration Examples:
# Development Environment:
# - Azure.ServiceConnection: 'Azure-Dev-Connection'
# - WebApp.Name.Dev: 'myapp-dev'
# - WebApp.Url.Dev: 'https://myapp-dev.azurewebsites.net'
# - ResourceGroup.Name.Dev: 'rg-myapp-dev'
# - ConnectionString.Dev: 'Server=dev-sql;Database=myapp-dev;...'

# Staging Environment:
# - WebApp.Name.Staging: 'myapp-staging'
# - ResourceGroup.Name.Staging: 'rg-myapp-staging'

# Production Environment:
# - WebApp.Name.Prod: 'myapp-prod'
# - WebApp.Url.Prod: 'https://myapp.azurewebsites.net'
# - ResourceGroup.Name.Prod: 'rg-myapp-prod'
# - Backup.StorageUrl: 'https://backupstorage.blob.core.windows.net/...'
# - Notification.WebhookUrl: 'https://hooks.slack.com/services/...'`,
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
        content: `Generate a detailed technical requirements document template covering functional, non-functional, and technical specifications.

# Technical Requirements Document
## {{ProjectName}} - {{FeatureName}} Module

### Document Information
- **Document Version**: 1.0
- **Created Date**: {{CurrentDate}}
- **Created By**: {{AuthorName}}
- **Last Modified**: {{LastModifiedDate}}
- **Status**: {{DocumentStatus}}
- **Stakeholders**: {{StakeholderList}}

## 1. Executive Summary

### 1.1 Project Overview
{{ProjectDescription}}

### 1.2 Scope
This document defines the technical requirements for the {{FeatureName}} module within the {{ProjectName}} Sitecore solution. It covers functional specifications, non-functional requirements, technical constraints, and acceptance criteria.

### 1.3 Objectives
- **Primary Objective**: {{PrimaryObjective}}
- **Secondary Objectives**: {{SecondaryObjectives}}
- **Success Criteria**: {{SuccessCriteria}}

## 2. Functional Requirements

### 2.1 User Stories and Requirements

#### FR-001: {{RequirementTitle}}
**Priority**: {{Priority}}
**User Story**: As a {{UserRole}}, I want to {{UserAction}} so that {{UserBenefit}}.

**Detailed Requirements**:
- The system shall {{FunctionalRequirement1}}
- The system shall {{FunctionalRequirement2}}
- The system shall {{FunctionalRequirement3}}

**Business Rules**:
- BR-001: {{BusinessRule1}}
- BR-002: {{BusinessRule2}}

**Acceptance Criteria**:
- Given {{PreconditionState}}
- When {{UserAction}}
- Then {{ExpectedOutcome}}

#### FR-002: Content Management
**Priority**: High
**User Story**: As a content editor, I want to manage content efficiently so that I can maintain up-to-date website information.

**Detailed Requirements**:
- The system shall provide a user-friendly content editing interface
- The system shall support rich text editing with HTML formatting
- The system shall allow media file uploads and management
- The system shall provide content preview functionality
- The system shall support content versioning and rollback

**Business Rules**:
- BR-003: Only authenticated users can edit content
- BR-004: All content changes must be tracked with user and timestamp
- BR-005: Content must be approved before publication

**Acceptance Criteria**:
- Given I am a logged-in content editor
- When I navigate to the content editing interface
- Then I should see all available content items with edit options
- And I should be able to create, edit, and delete content items
- And all changes should be automatically saved as drafts

## 3. Non-Functional Requirements

### 3.1 Performance Requirements
- **Page Load Time**: All pages must load within 3 seconds on standard broadband connection
- **API Response Time**: All API calls must respond within 500ms for 95% of requests
- **Search Response Time**: Search results must be delivered within 2 seconds
- **Database Query Time**: Individual database queries must complete within 100ms

### 3.2 Security Requirements
- **User Authentication**: All users must be authenticated via SSO integration
- **Role-based Access**: Access control must be implemented based on user roles
- **Data Encryption**: All data must be encrypted in transit and at rest
- **Audit Trail**: All user actions must be logged for security auditing

### 3.3 Availability and Reliability
- **System Availability**: 99.9% uptime during business hours
- **Disaster Recovery**: Recovery Time Objective (RTO) of 4 hours
- **Data Recovery**: Recovery Point Objective (RPO) of 1 hour
- **Error Handling**: Graceful degradation during partial failures

## 4. Technical Constraints
- **Platform**: Sitecore 10.4 on .NET Framework 4.8
- **Database**: Microsoft SQL Server 2019
- **Web Server**: IIS 10
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Search**: Solr 8.11
- **Caching**: Redis Cache

## 5. Integration Requirements
- **SSO Integration**: Active Directory Federation Services (ADFS)
- **Analytics**: Google Analytics 4 integration
- **CDN**: Azure CDN for static asset delivery
- **Email**: SMTP integration for notifications
- **Third-party APIs**: {{ExternalApiList}}

## 6. Testing Requirements
- **Unit Testing**: 90% code coverage for all business logic
- **Integration Testing**: End-to-end workflow testing
- **Performance Testing**: Load testing with simulated user scenarios
- **Security Testing**: Penetration testing and vulnerability assessment
- **User Acceptance Testing**: Business stakeholder validation

## 7. Deployment Requirements
- **Blue-Green Deployment**: Zero-downtime deployment strategy
- **Automated Deployment**: CI/CD pipeline with Azure DevOps
- **Database Updates**: Automated database schema migrations
- **Configuration Management**: Environment-specific configuration files
- **Rollback Strategy**: Automated rollback capability within 15 minutes

## 8. Risk Assessment
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation under load | High | Medium | Load testing and performance optimization |
| Third-party API failures | Medium | High | Circuit breaker pattern and fallback mechanisms |
| Database connectivity issues | High | Low | Connection pooling and failover clustering |
| Security vulnerabilities | High | Medium | Regular security audits and penetration testing |

## 9. Approval Matrix
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Analyst | {{BAName}} |  |  |
| Technical Lead | {{TechLeadName}} |  |  |
| Project Manager | {{PMName}} |  |  |
| Stakeholder | {{StakeholderName}} |  |  |`,
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
        content: `Create comprehensive architecture documentation with Helix layer structure, dependencies, and component diagrams.

# Sitecore Helix Architecture Documentation
## Complete architectural documentation with layer structure, dependencies, and component diagrams

## 1. Architecture Overview

### 1.1 Helix Architecture Principles
The Sitecore Helix architecture follows three core principles:

**Modular Architecture**
- Separation of concerns through distinct layers
- Clear boundaries between business functionality
- Reusable and maintainable components

**Dependency Direction**
- Foundation → Feature → Project (unidirectional dependencies)
- Lower layers cannot depend on higher layers
- Promotes loose coupling and high cohesion

**Solution Structure**
- Organized by business capabilities
- Clear naming conventions
- Consistent project structure

### 1.2 Layer Definitions

#### Foundation Layer
**Purpose**: Core functionality and shared services
**Responsibilities**:
- Base templates and interfaces
- Shared utilities and extensions
- Cross-cutting concerns (logging, caching, validation)
- External service integrations

**Dependencies**: None (cannot reference Feature or Project layers)

#### Feature Layer
**Purpose**: Business-specific functionality
**Responsibilities**:
- Business logic implementation
- Content types and templates
- User interface components
- API endpoints

**Dependencies**: Foundation layer only

#### Project Layer
**Purpose**: Site-specific implementations
**Responsibilities**:
- Site structure and layout
- Tenant-specific configurations
- Styling and branding
- Content organization

**Dependencies**: Foundation and Feature layers

## 2. Solution Structure

\`\`\`
Solution/
├── src/
│   ├── Foundation/
│   │   ├── DependencyInjection/
│   │   │   ├── App_Config/Include/Foundation/
│   │   │   │   └── Foundation.DependencyInjection.config
│   │   │   ├── Services/
│   │   │   │   ├── IServiceConfigurator.cs
│   │   │   │   └── ServiceConfigurator.cs
│   │   │   └── Foundation.DependencyInjection.csproj
│   │   │
│   │   ├── Logging/
│   │   │   ├── Services/
│   │   │   │   ├── ILogService.cs
│   │   │   │   └── SitecoreLogService.cs
│   │   │   ├── Models/
│   │   │   │   └── LogEntry.cs
│   │   │   └── Foundation.Logging.csproj
│   │   │
│   │   ├── Caching/
│   │   │   ├── Services/
│   │   │   │   ├── ICacheService.cs
│   │   │   │   └── SitecoreCacheService.cs
│   │   │   └── Foundation.Caching.csproj
│   │   │
│   │   └── Configuration/
│   │       ├── Services/
│   │       │   ├── IConfigurationService.cs
│   │       │   └── ConfigurationService.cs
│   │       └── Foundation.Configuration.csproj
│   │
│   ├── Feature/
│   │   ├── Navigation/
│   │   │   ├── Controllers/
│   │   │   │   └── NavigationController.cs
│   │   │   ├── Models/
│   │   │   │   ├── INavigationItem.cs
│   │   │   │   └── NavigationViewModel.cs
│   │   │   ├── Services/
│   │   │   │   ├── INavigationService.cs
│   │   │   │   └── NavigationService.cs
│   │   │   ├── Templates/
│   │   │   │   └── Navigation Item.item
│   │   │   ├── Views/Navigation/
│   │   │   │   ├── _MainNavigation.cshtml
│   │   │   │   └── _Breadcrumb.cshtml
│   │   │   └── Feature.Navigation.csproj
│   │   │
│   │   ├── Search/
│   │   │   ├── Controllers/
│   │   │   │   └── SearchController.cs
│   │   │   ├── Models/
│   │   │   │   ├── SearchRequest.cs
│   │   │   │   └── SearchResult.cs
│   │   │   ├── Services/
│   │   │   │   ├── ISearchService.cs
│   │   │   │   └── SolrSearchService.cs
│   │   │   └── Feature.Search.csproj
│   │   │
│   │   └── Content/
│   │       ├── Controllers/
│   │       │   └── ContentController.cs
│   │       ├── Models/
│   │       │   ├── IContentItem.cs
│   │       │   └── ContentViewModel.cs
│   │       └── Feature.Content.csproj
│   │
│   └── Project/
│       ├── Website/
│       │   ├── Controllers/
│       │   │   └── HomeController.cs
│       │   ├── Models/
│       │   │   └── SiteSettingsModel.cs
│       │   ├── Views/
│       │   │   ├── Shared/
│       │   │   │   ├── _Layout.cshtml
│       │   │   │   └── _ViewStart.cshtml
│       │   │   └── Home/
│       │   │       └── Index.cshtml
│       │   ├── App_Config/Include/Project/
│       │   │   └── Project.Website.config
│       │   ├── Assets/
│       │   │   ├── styles/
│       │   │   ├── scripts/
│       │   │   └── images/
│       │   └── Project.Website.csproj
│       │
│       └── Common/
│           ├── Templates/
│           │   ├── Page Types/
│           │   └── Data Templates/
│           └── Project.Common.csproj
│
├── tests/
│   ├── Foundation.Tests/
│   ├── Feature.Tests/
│   └── Project.Tests/
│
└── tools/
    ├── build/
    └── deployment/
\`\`\`

## 3. Dependency Graph

### 3.1 Foundation Layer Dependencies
\`\`\`mermaid
graph TD
    A[Foundation.DependencyInjection] --> B[Sitecore.Kernel]
    C[Foundation.Logging] --> A
    D[Foundation.Caching] --> A
    E[Foundation.Configuration] --> A
    F[Foundation.Validation] --> A
    G[Foundation.Serialization] --> A
\`\`\`

### 3.2 Feature Layer Dependencies
\`\`\`mermaid
graph TD
    A[Feature.Navigation] --> B[Foundation.Logging]
    A --> C[Foundation.Caching]
    D[Feature.Search] --> B
    D --> E[Foundation.Configuration]
    F[Feature.Content] --> B
    F --> C
    G[Feature.Forms] --> B
    G --> H[Foundation.Validation]
\`\`\`

### 3.3 Project Layer Dependencies
\`\`\`mermaid
graph TD
    A[Project.Website] --> B[Feature.Navigation]
    A --> C[Feature.Search]
    A --> D[Feature.Content]
    A --> E[Foundation.Logging]
    F[Project.Common] --> E
\`\`\`

## 4. Component Integration Patterns

### 4.1 Service Registration Pattern
\`\`\`csharp
// Foundation.DependencyInjection
public class ServiceConfigurator : IConfigurator
{
    public void Configure(IServiceCollection serviceCollection)
    {
        // Foundation services
        serviceCollection.AddSingleton<ILogService, SitecoreLogService>();
        serviceCollection.AddSingleton<ICacheService, SitecoreCacheService>();
        
        // Feature services
        serviceCollection.AddScoped<INavigationService, NavigationService>();
        serviceCollection.AddScoped<ISearchService, SolrSearchService>();
        
        // Project services
        serviceCollection.AddScoped<ISiteSettingsService, SiteSettingsService>();
    }
}
\`\`\`

### 4.2 Controller Base Pattern
\`\`\`csharp
// Foundation layer base controller
public abstract class FoundationController : Controller
{
    protected readonly ILogService LogService;
    protected readonly ICacheService CacheService;
    
    protected FoundationController(ILogService logService, ICacheService cacheService)
    {
        LogService = logService;
        CacheService = cacheService;
    }
    
    protected override void OnException(ExceptionContext filterContext)
    {
        LogService.Error("Controller exception", filterContext.Exception);
        base.OnException(filterContext);
    }
}

// Feature layer controller inheriting foundation
public class NavigationController : FoundationController
{
    private readonly INavigationService _navigationService;
    
    public NavigationController(
        INavigationService navigationService,
        ILogService logService,
        ICacheService cacheService) : base(logService, cacheService)
    {
        _navigationService = navigationService;
    }
}
\`\`\`

### 4.3 Model Interface Pattern
\`\`\`csharp
// Foundation interface
public interface IBaseContent
{
    Guid Id { get; set; }
    string Title { get; set; }
    DateTime CreatedDate { get; set; }
}

// Feature interface extending foundation
public interface INavigationItem : IBaseContent
{
    string Url { get; set; }
    IEnumerable<INavigationItem> Children { get; set; }
    bool IsActive { get; set; }
}

// Project implementation
public class NavigationItem : INavigationItem
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public DateTime CreatedDate { get; set; }
    public string Url { get; set; }
    public IEnumerable<INavigationItem> Children { get; set; }
    public bool IsActive { get; set; }
}
\`\`\`

## 5. Configuration Architecture

### 5.1 Configuration Layering
\`\`\`xml
<!-- Foundation configurations -->
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/" xmlns:role="http://www.sitecore.net/xmlconfig/role/">
  <sitecore>
    <services>
      <configurator type="Foundation.DependencyInjection.ServiceConfigurator, Foundation.DependencyInjection" />
    </services>
    
    <settings>
      <setting name="Foundation.Logging.Level" value="Info" />
      <setting name="Foundation.Caching.DefaultExpiration" value="00:30:00" />
    </settings>
  </sitecore>
</configuration>

<!-- Feature configurations -->
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <settings>
      <setting name="Feature.Navigation.MaxDepth" value="3" />
      <setting name="Feature.Search.IndexName" value="sitecore_web_index" />
    </settings>
    
    <pipelines>
      <mvc.getPageItem>
        <processor type="Feature.Navigation.Pipelines.SetNavigationContext, Feature.Navigation" />
      </mvc.getPageItem>
    </pipelines>
  </sitecore>
</configuration>

<!-- Project configurations -->
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <sites>
      <site name="website" 
            hostName="localhost"
            targetHostName="www.mysite.com"
            rootPath="/sitecore/content/mysite"
            startItem="/home"
            database="web" />
    </sites>
  </sitecore>
</configuration>
\`\`\`

## 6. Testing Strategy

### 6.1 Testing Pyramid
\`\`\`
                    /\\
                   /  \\
                  / E2E \\
                 /      \\
                /________\\
               /          \\
              / Integration \\
             /______________\\
            /                \\
           /   Unit Tests      \\
          /__________________\\
\`\`\`

### 6.2 Test Organization
- **Foundation Tests**: Service contracts, utilities, extensions
- **Feature Tests**: Business logic, component behavior
- **Project Tests**: Integration scenarios, end-to-end workflows

### 6.3 Mock Strategy
\`\`\`csharp
// Foundation mocking infrastructure
public static class MockFactory
{
    public static Mock<ISitecoreContext> CreateSitecoreContext()
    {
        var mock = new Mock<ISitecoreContext>();
        // Setup common Sitecore context behaviors
        return mock;
    }
    
    public static Mock<ILogService> CreateLogService()
    {
        return new Mock<ILogService>();
    }
}

// Feature test using foundation mocks
[TestClass]
public class NavigationServiceTests
{
    private Mock<ILogService> _logService;
    private Mock<ICacheService> _cacheService;
    private NavigationService _navigationService;
    
    [TestInitialize]
    public void Setup()
    {
        _logService = MockFactory.CreateLogService();
        _cacheService = MockFactory.CreateCacheService();
        _navigationService = new NavigationService(_logService.Object, _cacheService.Object);
    }
}
\`\`\`

## 7. Deployment Architecture

### 7.1 Environment Strategy
- **Development**: Feature branch deployments, full debugging
- **Integration**: Automated testing, performance profiling
- **Staging**: Production-like environment, user acceptance testing
- **Production**: Blue-green deployment, monitoring and alerting

### 7.2 Deployment Packages
\`\`\`
Deployment/
├── Foundation/
│   ├── Foundation.*.dll
│   └── App_Config/Include/Foundation/
├── Feature/
│   ├── Feature.*.dll
│   ├── Views/Feature/
│   └── App_Config/Include/Feature/
└── Project/
    ├── Project.*.dll
    ├── Views/Project/
    ├── Assets/
    └── App_Config/Include/Project/
\`\`\`

## 8. Monitoring and Observability

### 8.1 Logging Strategy
- **Foundation**: Infrastructure and cross-cutting concerns
- **Feature**: Business operations and user interactions
- **Project**: Site-specific events and configurations

### 8.2 Performance Monitoring
- Component-level performance tracking
- Dependency analysis and bottleneck identification
- Cache effectiveness monitoring
- Search performance optimization

## 9. Security Architecture

### 9.1 Security Layers
- **Foundation**: Authentication, authorization, encryption
- **Feature**: Input validation, output encoding, business rules
- **Project**: Site-specific security policies

### 9.2 Security Patterns
\`\`\`csharp
// Foundation security service
public interface ISecurityService
{
    bool IsAuthenticated();
    bool HasPermission(string permission);
    void ValidateInput(string input);
    string EncodeOutput(string output);
}

// Feature using foundation security
public class ContentController : FoundationController
{
    private readonly ISecurityService _securityService;
    
    public ActionResult GetContent(string id)
    {
        _securityService.ValidateInput(id);
        if (!_securityService.HasPermission("content:read"))
        {
            return new HttpUnauthorizedResult();
        }
        
        var content = GetContentById(id);
        return Json(_securityService.EncodeOutput(content));
    }
}
\`\`\`

## 10. Migration and Upgrade Strategy

### 10.1 Version Management
- Semantic versioning for each layer
- Backward compatibility requirements
- Migration scripts and procedures

### 10.2 Upgrade Path
1. Foundation layer upgrades (infrastructure)
2. Feature layer updates (business logic)
3. Project layer modifications (site-specific)
4. Testing and validation at each step`,
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
        content: `Generate a complete API specification template with endpoint documentation, authentication, and error handling.

# API Specification Template
## {{APITitle}} v{{APIVersion}}

### Document Information
- **API Name**: {{APITitle}}
- **Version**: {{APIVersion}}
- **Specification Version**: OpenAPI 3.0.3
- **Base URL**: {{BaseURL}}
- **Contact**: {{ContactEmail}}
- **License**: {{LicenseType}}
- **Last Updated**: {{LastUpdated}}
- **Status**: {{APIStatus}}

### API Overview

#### Description
{{APIDescription}}

#### Key Features
- {{KeyFeature1}}
- {{KeyFeature2}}
- {{KeyFeature3}}
- {{KeyFeature4}}

#### Architecture Overview
**API Type**: {{APIType}}
**Protocol**: {{Protocol}}
**Data Format**: {{DataFormat}}
**Authentication**: {{AuthenticationType}}
**Rate Limiting**: {{RateLimiting}}

### OpenAPI Specification

\`\`\`yaml
openapi: 3.0.3
info:
  title: {{APITitle}}
  version: {{APIVersion}}
  description: {{APIDescription}}
  termsOfService: {{TermsOfServiceURL}}
  contact:
    name: {{ContactName}}
    email: {{ContactEmail}}
    url: {{ContactURL}}
  license:
    name: {{LicenseName}}
    url: {{LicenseURL}}

servers:
  - url: {{ProductionURL}}
    description: Production server
  - url: {{StagingURL}}
    description: Staging server
  - url: {{DevelopmentURL}}
    description: Development server

paths:
  /{{resourcePath}}:
    get:
      summary: {{GetSummary}}
      description: {{GetDescription}}
      operationId: {{GetOperationId}}
      tags:
        - {{ResourceTag}}
      parameters:
        - name: {{QueryParam1}}
          in: query
          required: {{Param1Required}}
          schema:
            type: {{Param1Type}}
          description: {{Param1Description}}
        - name: {{QueryParam2}}
          in: query
          required: {{Param2Required}}
          schema:
            type: {{Param2Type}}
          description: {{Param2Description}}
      responses:
        '200':
          description: {{SuccessDescription}}
          content:
            application/json:
              schema:
                type: object
                properties:
                  {{ResponseProperty1}}:
                    type: {{ResponseType1}}
                    description: {{ResponseDescription1}}
                  {{ResponseProperty2}}:
                    type: {{ResponseType2}}
                    description: {{ResponseDescription2}}
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Not Found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    
    post:
      summary: {{PostSummary}}
      description: {{PostDescription}}
      operationId: {{PostOperationId}}
      tags:
        - {{ResourceTag}}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - {{RequiredField1}}
                - {{RequiredField2}}
              properties:
                {{RequestField1}}:
                  type: {{RequestType1}}
                  description: {{RequestDescription1}}
                {{RequestField2}}:
                  type: {{RequestType2}}
                  description: {{RequestDescription2}}
                {{RequestField3}}:
                  type: {{RequestType3}}
                  description: {{RequestDescription3}}
      responses:
        '201':
          description: {{CreateSuccessDescription}}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{{ResourceSchema}}'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
        '401':
          description: Unauthorized
        '409':
          description: Conflict
        '500':
          description: Internal Server Error

  /{{resourcePath}}/{id}:
    get:
      summary: {{GetByIdSummary}}
      description: {{GetByIdDescription}}
      operationId: {{GetByIdOperationId}}
      tags:
        - {{ResourceTag}}
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: {{IdType}}
          description: {{IdDescription}}
      responses:
        '200':
          description: {{GetByIdSuccessDescription}}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{{ResourceSchema}}'
        '404':
          description: {{ResourceName}} not found
        '500':
          description: Internal Server Error
    
    put:
      summary: {{PutSummary}}
      description: {{PutDescription}}
      operationId: {{PutOperationId}}
      tags:
        - {{ResourceTag}}
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: {{IdType}}
          description: {{IdDescription}}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/{{UpdateSchema}}'
      responses:
        '200':
          description: {{UpdateSuccessDescription}}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{{ResourceSchema}}'
        '400':
          description: Bad Request
        '404':
          description: {{ResourceName}} not found
        '500':
          description: Internal Server Error
    
    delete:
      summary: {{DeleteSummary}}
      description: {{DeleteDescription}}
      operationId: {{DeleteOperationId}}
      tags:
        - {{ResourceTag}}
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: {{IdType}}
          description: {{IdDescription}}
      responses:
        '204':
          description: {{DeleteSuccessDescription}}
        '404':
          description: {{ResourceName}} not found
        '500':
          description: Internal Server Error

components:
  schemas:
    {{ResourceSchema}}:
      type: object
      required:
        - {{RequiredProperty1}}
        - {{RequiredProperty2}}
      properties:
        {{Property1}}:
          type: {{PropertyType1}}
          description: {{PropertyDescription1}}
        {{Property2}}:
          type: {{PropertyType2}}
          description: {{PropertyDescription2}}
        {{Property3}}:
          type: {{PropertyType3}}
          description: {{PropertyDescription3}}
        createdAt:
          type: string
          format: date-time
          description: Creation timestamp
        updatedAt:
          type: string
          format: date-time
          description: Last update timestamp
    
    {{UpdateSchema}}:
      type: object
      properties:
        {{UpdateProperty1}}:
          type: {{UpdateType1}}
          description: {{UpdateDescription1}}
        {{UpdateProperty2}}:
          type: {{UpdateType2}}
          description: {{UpdateDescription2}}
    
    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: string
          description: Additional error details
        timestamp:
          type: string
          format: date-time
          description: Error occurrence time
        path:
          type: string
          description: API path where error occurred
    
    ValidationError:
      allOf:
        - $ref: '#/components/schemas/Error'
        - type: object
          properties:
            validationErrors:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                    description: Field that failed validation
                  code:
                    type: string
                    description: Validation error code
                  message:
                    type: string
                    description: Validation error message

  securitySchemes:
    {{AuthScheme1}}:
      type: {{AuthType1}}
      scheme: {{AuthScheme1Details}}
      bearerFormat: {{BearerFormat}}
    
    {{AuthScheme2}}:
      type: {{AuthType2}}
      name: {{AuthHeaderName}}
      in: {{AuthHeaderLocation}}

security:
  - {{AuthScheme1}}: []
  - {{AuthScheme2}}: []

tags:
  - name: {{Tag1}}
    description: {{Tag1Description}}
  - name: {{Tag2}}
    description: {{Tag2Description}}

externalDocs:
  description: {{ExternalDocsDescription}}
  url: {{ExternalDocsURL}}
\`\`\`

### Authentication & Authorization

#### Authentication Methods

##### Method 1: {{AuthMethod1}}
**Type**: {{AuthType1}}
**Description**: {{AuthDescription1}}

**Implementation**:
\`\`\`javascript
// Authentication example
const authToken = await getAuthToken();
const response = await fetch('{{BaseURL}}/{{endpoint}}', {
  method: 'GET',
  headers: {
    'Authorization': \`{{AuthPrefix}} \${authToken}\`,
    'Content-Type': 'application/json'
  }
});
\`\`\`

**Token Format**:
\`\`\`json
{
  "access_token": "{{SampleAccessToken}}",
  "token_type": "{{TokenType}}",
  "expires_in": {{ExpiresIn}},
  "refresh_token": "{{SampleRefreshToken}}"
}
\`\`\`

##### Method 2: {{AuthMethod2}}
**Type**: {{AuthType2}}
**Description**: {{AuthDescription2}}

**Headers Required**:
- \`{{AuthHeader1}}\`: {{AuthHeaderDescription1}}
- \`{{AuthHeader2}}\`: {{AuthHeaderDescription2}}

#### Authorization Levels
| Level | Description | Access |
|-------|-------------|--------|
| {{AuthLevel1}} | {{AuthLevelDescription1}} | {{AuthLevelAccess1}} |
| {{AuthLevel2}} | {{AuthLevelDescription2}} | {{AuthLevelAccess2}} |
| {{AuthLevel3}} | {{AuthLevelDescription3}} | {{AuthLevelAccess3}} |

### Rate Limiting

#### Rate Limit Configuration
- **Requests per minute**: {{RateLimitPerMinute}}
- **Requests per hour**: {{RateLimitPerHour}}
- **Requests per day**: {{RateLimitPerDay}}
- **Burst limit**: {{BurstLimit}}

#### Rate Limit Headers
\`\`\`
X-RateLimit-Limit: {{RateLimitValue}}
X-RateLimit-Remaining: {{RateLimitRemaining}}
X-RateLimit-Reset: {{RateLimitReset}}
X-RateLimit-Retry-After: {{RetryAfter}}
\`\`\`

#### Rate Limit Exceeded Response
\`\`\`json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded. Please retry after {{RetryAfter}} seconds.",
  "details": "You have exceeded the allowed number of requests per {{TimeWindow}}.",
  "retryAfter": {{RetryAfterSeconds}},
  "limit": {{CurrentLimit}},
  "remaining": 0,
  "resetTime": "{{ResetTimestamp}}"
}
\`\`\`

### API Endpoints Documentation

#### Resource: {{ResourceName}}

##### GET /{{resourcePath}}
**Purpose**: {{GetPurpose}}
**Authentication**: {{GetAuthentication}}
**Rate Limit**: {{GetRateLimit}}

**Query Parameters**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| {{QueryParam1}} | {{Param1Type}} | {{Param1Required}} | {{Param1Description}} | {{Param1Example}} |
| {{QueryParam2}} | {{Param2Type}} | {{Param2Required}} | {{Param2Description}} | {{Param2Example}} |

**Request Example**:
\`\`\`bash
curl -X GET "{{BaseURL}}/{{resourcePath}}?{{QueryParam1}}={{ExampleValue1}}" \\
  -H "Authorization: Bearer {{SampleToken}}" \\
  -H "Content-Type: application/json"
\`\`\`

**Response Example (200 OK)**:
\`\`\`json
{
  "data": [
    {
      "{{Property1}}": "{{ExampleValue1}}",
      "{{Property2}}": "{{ExampleValue2}}",
      "{{Property3}}": {{ExampleValue3}},
      "createdAt": "{{CreatedAtExample}}",
      "updatedAt": "{{UpdatedAtExample}}"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "meta": {
    "requestId": "{{RequestId}}",
    "timestamp": "{{TimestampExample}}"
  }
}
\`\`\`

##### POST /{{resourcePath}}
**Purpose**: {{PostPurpose}}
**Authentication**: {{PostAuthentication}}
**Rate Limit**: {{PostRateLimit}}

**Request Body**:
\`\`\`json
{
  "{{RequestField1}}": "{{RequestExample1}}",
  "{{RequestField2}}": "{{RequestExample2}}",
  "{{RequestField3}}": {{RequestExample3}}
}
\`\`\`

**Request Example**:
\`\`\`bash
curl -X POST "{{BaseURL}}/{{resourcePath}}" \\
  -H "Authorization: Bearer {{SampleToken}}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "{{RequestField1}}": "{{RequestExample1}}",
    "{{RequestField2}}": "{{RequestExample2}}"
  }'
\`\`\`

**Response Example (201 Created)**:
\`\`\`json
{
  "data": {
    "id": "{{CreatedId}}",
    "{{Property1}}": "{{CreatedValue1}}",
    "{{Property2}}": "{{CreatedValue2}}",
    "createdAt": "{{CreatedTimestamp}}",
    "updatedAt": "{{CreatedTimestamp}}"
  },
  "meta": {
    "requestId": "{{RequestId}}",
    "timestamp": "{{TimestampExample}}"
  }
}
\`\`\`

### Error Handling

#### Error Response Format
All API errors follow a consistent format:

\`\`\`json
{
  "error": "{{ErrorCode}}",
  "message": "{{ErrorMessage}}",
  "details": "{{ErrorDetails}}",
  "timestamp": "{{ErrorTimestamp}}",
  "path": "{{ErrorPath}}",
  "requestId": "{{ErrorRequestId}}"
}
\`\`\`

#### HTTP Status Codes
| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily unavailable |

#### Common Error Examples

**400 Bad Request**:
\`\`\`json
{
  "error": "bad_request",
  "message": "Invalid request parameters",
  "details": "The request contains invalid or missing parameters",
  "validationErrors": [
    {
      "field": "{{FieldName}}",
      "code": "{{ValidationCode}}",
      "message": "{{ValidationMessage}}"
    }
  ]
}
\`\`\`

**401 Unauthorized**:
\`\`\`json
{
  "error": "unauthorized",
  "message": "Authentication required",
  "details": "Valid authentication token is required to access this resource"
}
\`\`\`

**404 Not Found**:
\`\`\`json
{
  "error": "not_found",
  "message": "Resource not found",
  "details": "The requested {{ResourceType}} with ID {{ResourceId}} was not found"
}
\`\`\`

### Data Models

#### {{ResourceName}} Model
\`\`\`typescript
interface {{ResourceInterface}} {
  {{Property1}}: {{PropertyType1}};
  {{Property2}}: {{PropertyType2}};
  {{Property3}}: {{PropertyType3}};
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}
\`\`\`

#### {{CreateRequestInterface}} Model
\`\`\`typescript
interface {{CreateRequestInterface}} {
  {{RequestField1}}: {{RequestType1}};
  {{RequestField2}}: {{RequestType2}};
  {{RequestField3}}?: {{RequestType3}}; // Optional field
}
\`\`\`

#### {{UpdateRequestInterface}} Model
\`\`\`typescript
interface {{UpdateRequestInterface}} {
  {{UpdateField1}}?: {{UpdateType1}};
  {{UpdateField2}}?: {{UpdateType2}};
  {{UpdateField3}}?: {{UpdateType3}};
}
\`\`\`

### SDK and Client Libraries

#### JavaScript/TypeScript SDK
\`\`\`typescript
import { {{APIClientClass}} } from '{{PackageName}}';

const client = new {{APIClientClass}}({
  baseUrl: '{{BaseURL}}',
  apiKey: '{{APIKey}}',
  timeout: {{Timeout}}
});

// Example usage
const {{resourceVariable}} = await client.{{resourcePath}}.create({
  {{RequestField1}}: '{{ExampleValue1}}',
  {{RequestField2}}: '{{ExampleValue2}}'
});

const {{resourceList}} = await client.{{resourcePath}}.list({
  {{QueryParam1}}: '{{FilterValue}}',
  page: 1,
  limit: 20
});
\`\`\`

#### Python SDK
\`\`\`python
from {{package_name}} import {{APIClientClass}}

client = {{APIClientClass}}(
    base_url='{{BaseURL}}',
    api_key='{{APIKey}}',
    timeout={{Timeout}}
)

# Example usage
{{resource_variable}} = client.{{resource_path}}.create({
    '{{RequestField1}}': '{{ExampleValue1}}',
    '{{RequestField2}}': '{{ExampleValue2}}'
})

{{resource_list}} = client.{{resource_path}}.list(
    {{query_param_1}}='{{FilterValue}}',
    page=1,
    limit=20
)
\`\`\`

### Testing and Validation

#### API Testing Checklist
- [ ] **Authentication**: All endpoints require proper authentication
- [ ] **Authorization**: Role-based access control working correctly
- [ ] **Input Validation**: Invalid inputs are properly rejected
- [ ] **Rate Limiting**: Rate limits are enforced correctly
- [ ] **Error Handling**: Consistent error responses
- [ ] **Data Validation**: Response data matches schema
- [ ] **Security**: No sensitive data exposed in responses
- [ ] **Performance**: Response times meet SLA requirements

#### Test Data Examples
\`\`\`json
{
  "valid_{{resource_name}}": {
    "{{RequestField1}}": "{{ValidValue1}}",
    "{{RequestField2}}": "{{ValidValue2}}",
    "{{RequestField3}}": {{ValidValue3}}
  },
  "invalid_{{resource_name}}": {
    "{{RequestField1}}": "{{InvalidValue1}}",
    "{{RequestField2}}": null,
    "{{RequestField3}}": "{{InvalidValue3}}"
  }
}
\`\`\`

### Changelog and Versioning

#### Version {{CurrentVersion}}
**Release Date**: {{ReleaseDate}}
**Changes**:
- {{Change1}}
- {{Change2}}
- {{Change3}}

#### Version {{PreviousVersion}}
**Release Date**: {{PreviousReleaseDate}}
**Changes**:
- {{PreviousChange1}}
- {{PreviousChange2}}

### Support and Contact

#### Support Information
- **API Documentation**: {{DocumentationURL}}
- **Support Portal**: {{SupportURL}}
- **Community Forum**: {{ForumURL}}
- **Status Page**: {{StatusPageURL}}

#### Contact Details
- **Technical Support**: {{SupportEmail}}
- **API Team**: {{APITeamEmail}}
- **Sales**: {{SalesEmail}}
- **Emergency Contact**: {{EmergencyContact}}

#### SLA and Availability
- **Uptime Guarantee**: {{UptimeGuarantee}}%
- **Response Time SLA**: {{ResponseTimeSLA}}ms
- **Support Hours**: {{SupportHours}}
- **Maintenance Windows**: {{MaintenanceWindows}}

This comprehensive API specification provides developers with all necessary information to successfully integrate with the {{APITitle}} API.`,
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
        content: `Create comprehensive data model design documentation with Sitecore template hierarchy and Glass Mapper models.

# Comprehensive Data Model Design Documentation
## Sitecore Template Hierarchy and Glass Mapper Model Implementation

## 1. Template Hierarchy Structure

### 1.1 Base Templates (Foundation Layer)

#### _BaseTemplate
**Purpose**: Core fields shared across all content items
**Template ID**: {12345678-1234-5678-9012-123456789012}
**Location**: /sitecore/templates/Foundation/BaseTemplate

**Fields**:
- **Meta Title** (Single-Line Text)
  - Field ID: {A1B2C3D4-E5F6-7890-1234-567890ABCDEF}
  - Default Value: $name
  - Validation: Max length 60 characters
  
- **Meta Description** (Multi-Line Text)
  - Field ID: {B2C3D4E5-F6G7-8901-2345-678901BCDEFG}
  - Validation: Max length 160 characters
  
- **Meta Keywords** (Single-Line Text)
  - Field ID: {C3D4E5F6-G7H8-9012-3456-789012CDEFGH}
  
- **Created Date** (Datetime)
  - Field ID: {D4E5F6G7-H8I9-0123-4567-890123DEFGHI}
  - Default Value: $now
  
- **Modified Date** (Datetime)
  - Field ID: {E5F6G7H8-I9J0-1234-5678-901234EFGHIJ}
  - Default Value: $now

#### _PageTemplate
**Purpose**: Standard page functionality
**Template ID**: {23456789-2345-6789-0123-234567890123}
**Base Templates**: _BaseTemplate
**Location**: /sitecore/templates/Foundation/PageTemplate

**Fields**:
- **Page Title** (Single-Line Text)
  - Field ID: {F6G7H8I9-J0K1-2345-6789-012345FGHIJK}
  - Required: Yes
  
- **Page Content** (Rich Text)
  - Field ID: {G7H8I9J0-K1L2-3456-7890-123456GHIJKL}
  
- **Hide from Navigation** (Checkbox)
  - Field ID: {H8I9J0K1-L2M3-4567-8901-234567HIJKLM}
  
- **Canonical URL** (General Link)
  - Field ID: {I9J0K1L2-M3N4-5678-9012-345678IJKLMN}

### 1.2 Feature Templates

#### Navigation Item Template
**Purpose**: Navigation structure and behavior
**Template ID**: {34567890-3456-7890-1234-345678901234}
**Base Templates**: _BaseTemplate
**Location**: /sitecore/templates/Feature/Navigation/NavigationItem

**Fields**:
- **Navigation Title** (Single-Line Text)
  - Field ID: {J0K1L2M3-N4O5-6789-0123-456789JKLMNO}
  - Default Value: $name
  
- **Navigation URL** (General Link)
  - Field ID: {K1L2M3N4-O5P6-7890-1234-567890KLMNOP}
  
- **Open in New Window** (Checkbox)
  - Field ID: {L2M3N4O5-P6Q7-8901-2345-678901LMNOPQ}
  
- **Navigation Icon** (Image)
  - Field ID: {M3N4O5P6-Q7R8-9012-3456-789012MNOPQR}
  
- **Sort Order** (Integer)
  - Field ID: {N4O5P6Q7-R8S9-0123-4567-890123NOPQRS}
  - Default Value: 100

#### Content Block Template
**Purpose**: Reusable content components
**Template ID**: {45678901-4567-8901-2345-456789012345}
**Base Templates**: _BaseTemplate
**Location**: /sitecore/templates/Feature/Content/ContentBlock

**Fields**:
- **Heading** (Single-Line Text)
  - Field ID: {O5P6Q7R8-S9T0-1234-5678-901234OPQRST}
  
- **Subheading** (Single-Line Text)
  - Field ID: {P6Q7R8S9-T0U1-2345-6789-012345PQRSTU}
  
- **Body Text** (Rich Text)
  - Field ID: {Q7R8S9T0-U1V2-3456-7890-123456QRSTUV}
  
- **Call to Action** (General Link)
  - Field ID: {R8S9T0U1-V2W3-4567-8901-234567RSTUVW}
  
- **Background Image** (Image)
  - Field ID: {S9T0U1V2-W3X4-5678-9012-345678STUVWX}

#### Media Gallery Template
**Purpose**: Image and video gallery functionality
**Template ID**: {56789012-5678-9012-3456-567890123456}
**Base Templates**: _BaseTemplate
**Location**: /sitecore/templates/Feature/Media/MediaGallery

**Fields**:
- **Gallery Title** (Single-Line Text)
  - Field ID: {T0U1V2W3-X4Y5-6789-0123-456789TUVWXY}
  
- **Gallery Items** (Multilist)
  - Field ID: {U1V2W3X4-Y5Z6-7890-1234-567890UVWXYZ}
  - Source: /sitecore/media library
  
- **Display Mode** (Droplink)
  - Field ID: {V2W3X4Y5-Z6A7-8901-2345-678901VWXYZA}
  - Source: /sitecore/system/Settings/Feature/Media/Display Modes
  
- **Items Per Row** (Integer)
  - Field ID: {W3X4Y5Z6-A7B8-9012-3456-789012WXYZAB}
  - Default Value: 3

### 1.3 Project Templates

#### Home Page Template
**Purpose**: Site homepage structure
**Template ID**: {67890123-6789-0123-4567-678901234567}
**Base Templates**: _PageTemplate
**Location**: /sitecore/templates/Project/Website/HomePage

**Fields**:
- **Hero Banner** (Droptree)
  - Field ID: {X4Y5Z6A7-B8C9-0123-4567-890123XYZABC}
  - Source: /sitecore/content/Global/Components/Banners
  
- **Featured Content** (Multilist)
  - Field ID: {Y5Z6A7B8-C9D0-1234-5678-901234YZABCD}
  
- **News Section** (Droptree)
  - Field ID: {Z6A7B8C9-D0E1-2345-6789-012345ZABCDE}

#### Landing Page Template
**Purpose**: Campaign and product landing pages
**Template ID**: {78901234-7890-1234-5678-789012345678}
**Base Templates**: _PageTemplate
**Location**: /sitecore/templates/Project/Website/LandingPage

**Fields**:
- **Campaign Code** (Single-Line Text)
  - Field ID: {A7B8C9D0-E1F2-3456-7890-123456ABCDEF}
  
- **Conversion Goal** (Droplink)
  - Field ID: {B8C9D0E1-F2G3-4567-8901-234567BCDEFG}
  
- **Lead Form** (Droptree)
  - Field ID: {C9D0E1F2-G3H4-5678-9012-345678CDEFGH}

## 2. Glass Mapper Model Implementation

### 2.1 Base Interface Definitions

\`\`\`csharp
// Foundation.Models/Interfaces/IBaseTemplate.cs
using Glass.Mapper.Sc.Configuration.Attributes;

[SitecoreType(TemplateId = "{12345678-1234-5678-9012-123456789012}", AutoMap = true)]
public interface IBaseTemplate
{
    [SitecoreId]
    Guid Id { get; set; }
    
    [SitecoreInfo(SitecoreInfoType.Name)]
    string Name { get; set; }
    
    [SitecoreInfo(SitecoreInfoType.Path)]
    string Path { get; set; }
    
    [SitecoreField("Meta Title")]
    string MetaTitle { get; set; }
    
    [SitecoreField("Meta Description")]
    string MetaDescription { get; set; }
    
    [SitecoreField("Meta Keywords")]
    string MetaKeywords { get; set; }
    
    [SitecoreField("Created Date")]
    DateTime CreatedDate { get; set; }
    
    [SitecoreField("Modified Date")]
    DateTime ModifiedDate { get; set; }
}

[SitecoreType(TemplateId = "{23456789-2345-6789-0123-234567890123}", AutoMap = true)]
public interface IPageTemplate : IBaseTemplate
{
    [SitecoreField("Page Title")]
    string PageTitle { get; set; }
    
    [SitecoreField("Page Content")]
    string PageContent { get; set; }
    
    [SitecoreField("Hide from Navigation")]
    bool HideFromNavigation { get; set; }
    
    [SitecoreField("Canonical URL")]
    Link CanonicalUrl { get; set; }
}
\`\`\`

### 2.2 Feature Model Implementations

\`\`\`csharp
// Feature.Navigation/Models/INavigationItem.cs
using Glass.Mapper.Sc.Configuration.Attributes;

[SitecoreType(TemplateId = "{34567890-3456-7890-1234-345678901234}", AutoMap = true)]
public interface INavigationItem : IBaseTemplate
{
    [SitecoreField("Navigation Title")]
    string NavigationTitle { get; set; }
    
    [SitecoreField("Navigation URL")]
    Link NavigationUrl { get; set; }
    
    [SitecoreField("Open in New Window")]
    bool OpenInNewWindow { get; set; }
    
    [SitecoreField("Navigation Icon")]
    Image NavigationIcon { get; set; }
    
    [SitecoreField("Sort Order")]
    int SortOrder { get; set; }
    
    [SitecoreChildren]
    IEnumerable<INavigationItem> Children { get; set; }
    
    [SitecoreParent]
    INavigationItem Parent { get; set; }
    
    // Computed properties
    bool HasChildren { get; }
    string CssClass { get; }
    bool IsActive { get; }
}

// Feature.Navigation/Models/NavigationItem.cs
public class NavigationItem : INavigationItem
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Path { get; set; }
    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public string MetaKeywords { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    
    public string NavigationTitle { get; set; }
    public Link NavigationUrl { get; set; }
    public bool OpenInNewWindow { get; set; }
    public Image NavigationIcon { get; set; }
    public int SortOrder { get; set; }
    public IEnumerable<INavigationItem> Children { get; set; }
    public INavigationItem Parent { get; set; }
    
    // Computed properties
    public bool HasChildren => Children?.Any() == true;
    
    public string CssClass
    {
        get
        {
            var classes = new List<string> { "nav-item" };
            if (HasChildren) classes.Add("has-children");
            if (IsActive) classes.Add("active");
            return string.Join(" ", classes);
        }
    }
    
    public bool IsActive
    {
        get
        {
            var currentPath = Sitecore.Context.Item?.Paths.FullPath;
            return !string.IsNullOrEmpty(currentPath) && 
                   (Path.Equals(currentPath, StringComparison.OrdinalIgnoreCase) ||
                    currentPath.StartsWith(Path + "/", StringComparison.OrdinalIgnoreCase));
        }
    }
}
\`\`\`

### 2.3 Content Model Implementation

\`\`\`csharp
// Feature.Content/Models/IContentBlock.cs
[SitecoreType(TemplateId = "{45678901-4567-8901-2345-456789012345}", AutoMap = true)]
public interface IContentBlock : IBaseTemplate
{
    [SitecoreField("Heading")]
    string Heading { get; set; }
    
    [SitecoreField("Subheading")]
    string Subheading { get; set; }
    
    [SitecoreField("Body Text")]
    string BodyText { get; set; }
    
    [SitecoreField("Call to Action")]
    Link CallToAction { get; set; }
    
    [SitecoreField("Background Image")]
    Image BackgroundImage { get; set; }
    
    // Computed properties
    string RenderedContent { get; }
    bool HasCallToAction { get; }
    string BackgroundImageUrl { get; }
}

// Feature.Content/Models/ContentBlock.cs
public class ContentBlock : IContentBlock
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Path { get; set; }
    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public string MetaKeywords { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    
    public string Heading { get; set; }
    public string Subheading { get; set; }
    public string BodyText { get; set; }
    public Link CallToAction { get; set; }
    public Image BackgroundImage { get; set; }
    
    public string RenderedContent
    {
        get
        {
            if (string.IsNullOrEmpty(BodyText)) return string.Empty;
            
            // Process rich text and apply any transformations
            return FieldRenderer.Render(Sitecore.Context.Item, "Body Text");
        }
    }
    
    public bool HasCallToAction => CallToAction != null && !string.IsNullOrEmpty(CallToAction.Url);
    
    public string BackgroundImageUrl
    {
        get
        {
            if (BackgroundImage?.Src == null) return string.Empty;
            
            // Generate responsive image URL with media parameters
            var mediaOptions = new MediaUrlOptions
            {
                Width = 1200,
                Height = 600,
                DisableMediaCache = false,
                UseDefaultIcon = false
            };
            
            return MediaManager.GetMediaUrl(BackgroundImage.MediaItem, mediaOptions);
        }
    }
}
\`\`\`

### 2.4 Project Model Implementation

\`\`\`csharp
// Project.Website/Models/IHomePage.cs
[SitecoreType(TemplateId = "{67890123-6789-0123-4567-678901234567}", AutoMap = true)]
public interface IHomePage : IPageTemplate
{
    [SitecoreField("Hero Banner")]
    IContentBlock HeroBanner { get; set; }
    
    [SitecoreField("Featured Content")]
    IEnumerable<IContentBlock> FeaturedContent { get; set; }
    
    [SitecoreField("News Section")]
    IContentBlock NewsSection { get; set; }
    
    // Computed properties
    bool HasFeaturedContent { get; }
    IEnumerable<IContentBlock> VisibleFeaturedContent { get; }
}

// Project.Website/Models/HomePage.cs
public class HomePage : IHomePage
{
    // Base template properties
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Path { get; set; }
    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public string MetaKeywords { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    
    // Page template properties
    public string PageTitle { get; set; }
    public string PageContent { get; set; }
    public bool HideFromNavigation { get; set; }
    public Link CanonicalUrl { get; set; }
    
    // Homepage-specific properties
    public IContentBlock HeroBanner { get; set; }
    public IEnumerable<IContentBlock> FeaturedContent { get; set; }
    public IContentBlock NewsSection { get; set; }
    
    public bool HasFeaturedContent => FeaturedContent?.Any() == true;
    
    public IEnumerable<IContentBlock> VisibleFeaturedContent
    {
        get
        {
            return FeaturedContent?.Where(c => c != null && !string.IsNullOrEmpty(c.Heading)) ?? Enumerable.Empty<IContentBlock>();
        }
    }
}
\`\`\`

## 3. Glass Mapper Configuration

### 3.1 Dependency Injection Setup

\`\`\`csharp
// Foundation.DependencyInjection/GlassMapperConfigurator.cs
public class GlassMapperConfigurator : IConfigurator
{
    public void Configure(IServiceCollection serviceCollection)
    {
        var context = Context.Create(DependencyResolver.CreateStandardResolver());
        context.Load(
            new SitecoreAttributeConfigurationLoader("Foundation.Models"),
            new SitecoreAttributeConfigurationLoader("Feature.Navigation"),
            new SitecoreAttributeConfigurationLoader("Feature.Content"),
            new SitecoreAttributeConfigurationLoader("Feature.Media"),
            new SitecoreAttributeConfigurationLoader("Project.Website")
        );
        
        serviceCollection.AddSingleton<ISitecoreContext>(provider => 
        {
            var sitecoreService = new SitecoreService(Sitecore.Context.Database);
            return sitecoreService;
        });
    }
}
\`\`\`

### 3.2 Model Factory Pattern

\`\`\`csharp
// Foundation.Models/Factories/IModelFactory.cs
public interface IModelFactory
{
    T GetModel<T>(Item item) where T : class, IBaseTemplate;
    T GetModel<T>(Guid itemId) where T : class, IBaseTemplate;
    T GetModel<T>(string itemPath) where T : class, IBaseTemplate;
    IEnumerable<T> GetModels<T>(IEnumerable<Item> items) where T : class, IBaseTemplate;
}

// Foundation.Models/Factories/ModelFactory.cs
public class ModelFactory : IModelFactory
{
    private readonly ISitecoreContext _sitecoreContext;
    private readonly ILogger<ModelFactory> _logger;
    
    public ModelFactory(ISitecoreContext sitecoreContext, ILogger<ModelFactory> logger)
    {
        _sitecoreContext = sitecoreContext;
        _logger = logger;
    }
    
    public T GetModel<T>(Item item) where T : class, IBaseTemplate
    {
        if (item == null) return null;
        
        try
        {
            return _sitecoreContext.Cast<T>(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cast item {ItemId} to type {ModelType}", item.ID, typeof(T).Name);
            return null;
        }
    }
    
    public T GetModel<T>(Guid itemId) where T : class, IBaseTemplate
    {
        try
        {
            return _sitecoreContext.GetItem<T>(itemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get item {ItemId} as type {ModelType}", itemId, typeof(T).Name);
            return null;
        }
    }
    
    public T GetModel<T>(string itemPath) where T : class, IBaseTemplate
    {
        try
        {
            return _sitecoreContext.GetItem<T>(itemPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get item at path {ItemPath} as type {ModelType}", itemPath, typeof(T).Name);
            return null;
        }
    }
    
    public IEnumerable<T> GetModels<T>(IEnumerable<Item> items) where T : class, IBaseTemplate
    {
        return items?.Select(GetModel<T>).Where(model => model != null) ?? Enumerable.Empty<T>();
    }
}
\`\`\`

## 4. Advanced Model Patterns

### 4.1 Computed Fields and Caching

\`\`\`csharp
// Feature.Navigation/Models/NavigationItemExtended.cs
public class NavigationItemExtended : NavigationItem
{
    private readonly ICacheService _cacheService;
    
    public NavigationItemExtended(ICacheService cacheService)
    {
        _cacheService = cacheService;
    }
    
    private IEnumerable<INavigationItem> _cachedChildren;
    public override IEnumerable<INavigationItem> Children
    {
        get
        {
            if (_cachedChildren == null)
            {
                var cacheKey = $"nav-children-{Id}";
                _cachedChildren = _cacheService.GetOrSet(cacheKey, () =>
                {
                    return base.Children?.OrderBy(c => c.SortOrder) ?? Enumerable.Empty<INavigationItem>();
                }, TimeSpan.FromMinutes(30));
            }
            return _cachedChildren;
        }
        set => _cachedChildren = value;
    }
    
    public string BreadcrumbPath
    {
        get
        {
            var path = new List<string>();
            var current = this;
            
            while (current != null)
            {
                path.Insert(0, current.NavigationTitle ?? current.Name);
                current = current.Parent;
            }
            
            return string.Join(" > ", path);
        }
    }
}
\`\`\`

### 4.2 Validation and Business Rules

\`\`\`csharp
// Feature.Content/Models/Validation/ContentBlockValidator.cs
public class ContentBlockValidator : IValidator<IContentBlock>
{
    public ValidationResult Validate(IContentBlock model)
    {
        var result = new ValidationResult();
        
        if (string.IsNullOrWhiteSpace(model.Heading))
        {
            result.AddError("Heading", "Heading is required");
        }
        
        if (model.Heading?.Length > 100)
        {
            result.AddError("Heading", "Heading cannot exceed 100 characters");
        }
        
        if (model.HasCallToAction && string.IsNullOrWhiteSpace(model.CallToAction?.Text))
        {
            result.AddError("CallToAction", "Call to action text is required when URL is provided");
        }
        
        return result;
    }
}
\`\`\`

This comprehensive data model design provides a solid foundation for Sitecore development with clear template hierarchies, strongly-typed Glass Mapper models, and extensible patterns for validation and caching.`,
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
        content: `Create comprehensive log analysis template with structured logging, ELK stack integration, and log management procedures.

# Comprehensive Log Analysis Template
## Structured Logging, ELK Stack Integration, and Log Management Procedures

## 1. Log Analysis Overview

### 1.1 Purpose
This template provides a comprehensive framework for log analysis in Sitecore applications, including structured logging implementation, ELK stack integration, and automated log management procedures.

### 1.2 Scope
- Application logging configuration
- ELK stack setup and integration
- Log parsing and analysis procedures
- Automated monitoring and alerting
- Performance and security analysis

## 2. Structured Logging Implementation

### 2.1 Serilog Configuration
\`\`\`csharp
// Startup.cs or Program.cs
public static void ConfigureLogging(IServiceCollection services, IConfiguration configuration)
{
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .MinimumLevel.Override("Sitecore", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "{{ApplicationName}}")
        .Enrich.WithProperty("Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"))
        .Enrich.WithMachineName()
        .Enrich.WithProcessId()
        .Enrich.WithThreadId()
        .WriteTo.Console(new JsonFormatter())
        .WriteTo.File(
            path: "logs/application-.log",
            rollingInterval: RollingInterval.Day,
            formatter: new JsonFormatter(),
            retainedFileCountLimit: 30)
        .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(configuration["Elasticsearch:Uri"]))
        {
            IndexFormat = "{{ApplicationName}}-logs-{0:yyyy.MM.dd}",
            AutoRegisterTemplate = true,
            AutoRegisterTemplateVersion = AutoRegisterTemplateVersion.ESv7,
            CustomFormatter = new ElasticsearchJsonFormatter(),
            EmitEventFailure = EmitEventFailureHandling.WriteToSelfLog,
            QueueSizeLimit = 5000,
            BatchPostingLimit = 50,
            Period = TimeSpan.FromSeconds(10)
        })
        .CreateLogger();

    services.AddSingleton<Serilog.ILogger>(Log.Logger);
}
\`\`\`

### 2.2 Custom Log Context Enrichers
\`\`\`csharp
public class SitecoreContextEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        if (Sitecore.Context.Item != null)
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SitecoreItemId", Sitecore.Context.Item.ID.ToString()));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SitecoreItemPath", Sitecore.Context.Item.Paths.FullPath));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SitecoreTemplateName", Sitecore.Context.Item.TemplateName));
        }
        
        if (Sitecore.Context.User != null)
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SitecoreUser", Sitecore.Context.User.Name));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SitecoreUserRoles", string.Join(",", Sitecore.Context.User.Roles.Select(r => r.Name))));
        }
        
        if (Sitecore.Context.Site != null)
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SitecoreSite", Sitecore.Context.Site.Name));
        }
        
        var httpContext = HttpContext.Current;
        if (httpContext != null)
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("RequestId", httpContext.Request.Headers["X-Request-ID"] ?? Guid.NewGuid().ToString()));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("UserAgent", httpContext.Request.UserAgent));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("RemoteIpAddress", GetClientIpAddress(httpContext)));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("RequestUrl", httpContext.Request.Url?.ToString()));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("HttpMethod", httpContext.Request.HttpMethod));
        }
    }
    
    private string GetClientIpAddress(HttpContext context)
    {
        string ipAddress = context.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];
        
        if (!string.IsNullOrEmpty(ipAddress))
        {
            string[] addresses = ipAddress.Split(',');
            if (addresses.Length != 0)
            {
                return addresses[0];
            }
        }
        
        return context.Request.ServerVariables["REMOTE_ADDR"];
    }
}
\`\`\`

### 2.3 Performance Logging Middleware
\`\`\`csharp
public class PerformanceLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceLoggingMiddleware> _logger;
    
    public PerformanceLoggingMiddleware(RequestDelegate next, ILogger<PerformanceLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = context.Request.Headers["X-Request-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["RequestId"] = requestId,
            ["RequestPath"] = context.Request.Path,
            ["RequestMethod"] = context.Request.Method
        }))
        {
            _logger.LogInformation("Request started: {RequestMethod} {RequestPath}", 
                context.Request.Method, context.Request.Path);
            
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Request failed: {RequestMethod} {RequestPath}", 
                    context.Request.Method, context.Request.Path);
                throw;
            }
            finally
            {
                stopwatch.Stop();
                
                _logger.LogInformation("Request completed: {RequestMethod} {RequestPath} responded {StatusCode} in {ElapsedMilliseconds}ms",
                    context.Request.Method, 
                    context.Request.Path, 
                    context.Response.StatusCode, 
                    stopwatch.ElapsedMilliseconds);
                    
                // Log performance metrics
                if (stopwatch.ElapsedMilliseconds > 5000) // Log slow requests
                {
                    _logger.LogWarning("Slow request detected: {RequestMethod} {RequestPath} took {ElapsedMilliseconds}ms",
                        context.Request.Method, context.Request.Path, stopwatch.ElapsedMilliseconds);
                }
            }
        }
    }
}
\`\`\`

## 3. ELK Stack Configuration

### 3.1 Elasticsearch Index Template
\`\`\`json
{
  "index_patterns": ["{{ApplicationName}}-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "index.refresh_interval": "30s",
      "index.lifecycle.name": "{{ApplicationName}}-policy",
      "index.lifecycle.rollover_alias": "{{ApplicationName}}-logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date",
          "format": "strict_date_optional_time||epoch_millis"
        },
        "level": {
          "type": "keyword"
        },
        "message": {
          "type": "text",
          "analyzer": "standard"
        },
        "fields": {
          "properties": {
            "Application": {"type": "keyword"},
            "Environment": {"type": "keyword"},
            "MachineName": {"type": "keyword"},
            "ProcessId": {"type": "long"},
            "ThreadId": {"type": "long"},
            "RequestId": {"type": "keyword"},
            "SitecoreItemId": {"type": "keyword"},
            "SitecoreItemPath": {"type": "keyword"},
            "SitecoreTemplateName": {"type": "keyword"},
            "SitecoreUser": {"type": "keyword"},
            "SitecoreSite": {"type": "keyword"},
            "UserAgent": {"type": "text"},
            "RemoteIpAddress": {"type": "ip"},
            "RequestUrl": {"type": "keyword"},
            "HttpMethod": {"type": "keyword"},
            "ElapsedMilliseconds": {"type": "long"}
          }
        }
      }
    }
  }
}
\`\`\`

### 3.2 Logstash Configuration
\`\`\`ruby
input {
  beats {
    port => 5044
  }
  
  file {
    path => "/var/log/{{ApplicationName}}/*.log"
    start_position => "beginning"
    codec => json
  }
}

filter {
  # Parse timestamp
  date {
    match => [ "@timestamp", "ISO8601" ]
  }
  
  # Extract request duration from message
  grok {
    match => { "message" => "Request completed.*in %{NUMBER:duration_ms:int}ms" }
    tag_on_failure => []
  }
  
  # Parse exception details
  if [fields][Exception] {
    mutate {
      add_field => { "error_type" => "%{[fields][Exception][Type]}" }
      add_field => { "error_message" => "%{[fields][Exception][Message]}" }
      add_field => { "stack_trace" => "%{[fields][Exception][StackTrace]}" }
    }
  }
  
  # Categorize log levels
  if [level] == "Error" or [level] == "Fatal" {
    mutate { add_tag => ["error"] }
  } else if [level] == "Warning" {
    mutate { add_tag => ["warning"] }
  } else if [level] == "Information" {
    mutate { add_tag => ["info"] }
  }
  
  # Performance categorization
  if [duration_ms] {
    if [duration_ms] > 10000 {
      mutate { add_tag => ["very_slow"] }
    } else if [duration_ms] > 5000 {
      mutate { add_tag => ["slow"] }
    } else if [duration_ms] > 2000 {
      mutate { add_tag => ["moderate"] }
    } else {
      mutate { add_tag => ["fast"] }
    }
  }
  
  # Security analysis
  if [fields][RemoteIpAddress] {
    # Check for suspicious IPs (implement your logic)
    if [fields][RemoteIpAddress] =~ /^(10\.|192\.168\.|172\.)/ {
      mutate { add_tag => ["internal_network"] }
    } else {
      mutate { add_tag => ["external_network"] }
    }
  }
  
  # Bot detection
  if [fields][UserAgent] {
    if [fields][UserAgent] =~ /(bot|spider|crawler)/i {
      mutate { add_tag => ["bot_traffic"] }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "{{ApplicationName}}-logs-%{+YYYY.MM.dd}"
  }
  
  # Send errors to separate index for alerting
  if "error" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "{{ApplicationName}}-errors-%{+YYYY.MM.dd}"
    }
  }
  
  stdout { codec => rubydebug }
}
\`\`\`

### 3.3 Kibana Dashboard Configuration
\`\`\`json
{
  "dashboard": {
    "title": "{{ApplicationName}} - Application Monitoring",
    "visualizations": [
      {
        "title": "Request Volume Over Time",
        "type": "line_chart",
        "query": {
          "bool": {
            "filter": [
              {"term": {"fields.Application": "{{ApplicationName}}"}},
              {"range": {"@timestamp": {"gte": "now-24h"}}}
            ]
          }
        },
        "aggregation": {
          "date_histogram": {
            "field": "@timestamp",
            "interval": "5m"
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "metric",
        "query": {
          "bool": {
            "filter": [
              {"term": {"fields.Application": "{{ApplicationName}}"}},
              {"terms": {"level": ["Error", "Fatal"]}},
              {"range": {"@timestamp": {"gte": "now-1h"}}}
            ]
          }
        }
      },
      {
        "title": "Average Response Time",
        "type": "metric",
        "query": {
          "bool": {
            "filter": [
              {"term": {"fields.Application": "{{ApplicationName}}"}},
              {"exists": {"field": "fields.ElapsedMilliseconds"}},
              {"range": {"@timestamp": {"gte": "now-1h"}}}
            ]
          }
        },
        "aggregation": {
          "avg": {
            "field": "fields.ElapsedMilliseconds"
          }
        }
      },
      {
        "title": "Top Error Messages",
        "type": "data_table",
        "query": {
          "bool": {
            "filter": [
              {"term": {"fields.Application": "{{ApplicationName}}"}},
              {"terms": {"level": ["Error", "Fatal"]}},
              {"range": {"@timestamp": {"gte": "now-24h"}}}
            ]
          }
        },
        "aggregation": {
          "terms": {
            "field": "message.keyword",
            "size": 10
          }
        }
      },
      {
        "title": "Slowest Requests",
        "type": "data_table",
        "query": {
          "bool": {
            "filter": [
              {"term": {"fields.Application": "{{ApplicationName}}"}},
              {"range": {"fields.ElapsedMilliseconds": {"gte": 2000}}},
              {"range": {"@timestamp": {"gte": "now-1h"}}}
            ]
          }
        },
        "sort": [
          {"fields.ElapsedMilliseconds": {"order": "desc"}}
        ]
      }
    ]
  }
}
\`\`\`

## 4. Log Analysis Queries

### 4.1 Performance Analysis Queries
\`\`\`json
# Find slowest endpoints in last hour
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"@timestamp": {"gte": "now-1h"}}},
        {"exists": {"field": "fields.ElapsedMilliseconds"}},
        {"term": {"fields.Application": "{{ApplicationName}}"}}
      ]
    }
  },
  "aggs": {
    "slowest_endpoints": {
      "terms": {
        "field": "fields.RequestPath.keyword",
        "size": 10
      },
      "aggs": {
        "avg_response_time": {
          "avg": {"field": "fields.ElapsedMilliseconds"}
        },
        "max_response_time": {
          "max": {"field": "fields.ElapsedMilliseconds"}
        }
      }
    }
  },
  "sort": [{"fields.ElapsedMilliseconds": {"order": "desc"}}],
  "size": 20
}

# Database query performance analysis
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"@timestamp": {"gte": "now-4h"}}},
        {"wildcard": {"message": "*SQL*"}},
        {"term": {"level": "Information"}}
      ]
    }
  },
  "aggs": {
    "query_performance": {
      "range": {
        "field": "fields.ElapsedMilliseconds",
        "ranges": [
          {"key": "fast", "to": 100},
          {"key": "moderate", "from": 100, "to": 500},
          {"key": "slow", "from": 500, "to": 2000},
          {"key": "very_slow", "from": 2000}
        ]
      }
    }
  }
}
\`\`\`

### 4.2 Security Analysis Queries
\`\`\`json
# Failed authentication attempts
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"@timestamp": {"gte": "now-24h"}}},
        {"wildcard": {"message": "*authentication*failed*"}},
        {"term": {"level": "Warning"}}
      ]
    }
  },
  "aggs": {
    "failed_attempts_by_ip": {
      "terms": {
        "field": "fields.RemoteIpAddress",
        "size": 20
      }
    },
    "failed_attempts_by_user": {
      "terms": {
        "field": "fields.SitecoreUser.keyword",
        "size": 20
      }
    }
  }
}

# Suspicious activity detection
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"@timestamp": {"gte": "now-1h"}}},
        {"terms": {"fields.HttpMethod": ["POST", "PUT", "DELETE"]}},
        {"range": {"fields.ElapsedMilliseconds": {"gte": 10000}}}
      ]
    }
  },
  "aggs": {
    "suspicious_ips": {
      "terms": {
        "field": "fields.RemoteIpAddress",
        "min_doc_count": 50
      }
    }
  }
}
\`\`\`

### 4.3 Business Intelligence Queries
\`\`\`json
# Most accessed Sitecore items
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"@timestamp": {"gte": "now-24h"}}},
        {"exists": {"field": "fields.SitecoreItemPath"}},
        {"term": {"fields.HttpMethod": "GET"}}
      ]
    }
  },
  "aggs": {
    "popular_content": {
      "terms": {
        "field": "fields.SitecoreItemPath.keyword",
        "size": 20
      },
      "aggs": {
        "unique_visitors": {
          "cardinality": {"field": "fields.RemoteIpAddress"}
        }
      }
    }
  }
}

# User behavior analysis
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"@timestamp": {"gte": "now-7d"}}},
        {"exists": {"field": "fields.SitecoreUser"}},
        {"bool": {"must_not": [{"wildcard": {"fields.SitecoreUser": "*anonymous*"}}]}}
      ]
    }
  },
  "aggs": {
    "active_users": {
      "terms": {
        "field": "fields.SitecoreUser.keyword",
        "size": 50
      },
      "aggs": {
        "sessions": {
          "cardinality": {"field": "fields.RequestId"}
        },
        "pages_viewed": {
          "value_count": {"field": "fields.SitecoreItemPath"}
        }
      }
    }
  }
}
\`\`\`

## 5. Automated Alerting Rules

### 5.1 Watcher Configurations
\`\`\`json
{
  "watcher_rules": [
    {
      "name": "High Error Rate",
      "schedule": {"interval": "5m"},
      "condition": {
        "compare": {
          "ctx.payload.aggregations.error_rate.doc_count": {
            "gt": 10
          }
        }
      },
      "actions": {
        "send_email": {
          "email": {
            "to": ["devops@company.com"],
            "subject": "{{ApplicationName}} - High Error Rate Alert",
            "body": "Error rate exceeded threshold: {{ctx.payload.aggregations.error_rate.doc_count}} errors in last 5 minutes"
          }
        }
      }
    },
    {
      "name": "Performance Degradation",
      "schedule": {"interval": "10m"},
      "condition": {
        "compare": {
          "ctx.payload.aggregations.avg_response_time.value": {
            "gt": 5000
          }
        }
      },
      "actions": {
        "send_slack": {
          "slack": {
            "message": {
              "to": ["#alerts"],
              "text": "{{ApplicationName}} - Performance Alert: Average response time {{ctx.payload.aggregations.avg_response_time.value}}ms"
            }
          }
        }
      }
    }
  ]
}
\`\`\`

## 6. Log Management Procedures

### 6.1 Log Retention Policy
- **Application Logs**: Retain for 90 days in hot storage, 1 year in cold storage
- **Error Logs**: Retain for 1 year in hot storage, 3 years in cold storage  
- **Security Logs**: Retain for 2 years in hot storage, 7 years in cold storage
- **Performance Logs**: Retain for 30 days in hot storage, 6 months in cold storage

### 6.2 Log Cleanup Scripts
\`\`\`bash
#!/bin/bash
# automated-log-cleanup.sh

# Delete indices older than retention period
curl -X DELETE "elasticsearch:9200/{{ApplicationName}}-logs-$(date -d '90 days ago' '+%Y.%m.%d')"
curl -X DELETE "elasticsearch:9200/{{ApplicationName}}-errors-$(date -d '365 days ago' '+%Y.%m.%d')"

# Archive old logs to cold storage
elasticdump --input=http://elasticsearch:9200/{{ApplicationName}}-logs-$(date -d '30 days ago' '+%Y.%m.%d') --output=s3://log-archive/{{ApplicationName}}/$(date -d '30 days ago' '+%Y-%m-%d').json

# Update index lifecycle policies
curl -X PUT "elasticsearch:9200/_ilm/policy/{{ApplicationName}}-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "5GB",
            "max_age": "1d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "delete": {
        "min_age": "90d"
      }
    }
  }
}'
\`\`\`

This comprehensive log analysis template provides structured logging, ELK stack integration, automated monitoring, and management procedures for enterprise Sitecore applications.`,
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
        content: `Create a structured requirements analysis template for gathering functional and non-functional requirements with stakeholder input.

# Requirements Analysis Template
## Comprehensive Requirements Gathering Framework

### Document Control
- **Document Version**: 1.0
- **Project**: {{ProjectName}}
- **Created By**: {{RequirementsAnalyst}}
- **Creation Date**: {{CreationDate}}
- **Last Updated**: {{LastUpdatedDate}}
- **Status**: {{DocumentStatus}}
- **Approval**: {{ApprovalStatus}}

## 1. Project Overview

### 1.1 Project Background
**Business Context**: {{BusinessContext}}
**Project Drivers**: {{ProjectDrivers}}
**Expected Outcomes**: {{ExpectedOutcomes}}

### 1.2 Stakeholder Analysis
| Stakeholder Group | Primary Contact | Role | Influence | Interest | Requirements Input |
|-------------------|-----------------|------|-----------|----------|-------------------|
| Business Sponsor | {{SponsorName}} | Executive | High | High | Strategic objectives |
| Product Owner | {{ProductOwnerName}} | Business | High | High | Functional requirements |
| End Users | {{EndUserRep}} | Operational | Medium | High | User experience requirements |
| Technical Lead | {{TechnicalLeadName}} | Technical | Medium | Medium | Technical constraints |
| Compliance Officer | {{ComplianceOfficer}} | Governance | Medium | Medium | Regulatory requirements |
| IT Operations | {{ITOpsLead}} | Support | Low | Medium | Operational requirements |

### 1.3 Business Objectives
**Primary Objectives**:
1. {{PrimaryObjective1}}
2. {{PrimaryObjective2}}
3. {{PrimaryObjective3}}

**Success Metrics**:
- {{SuccessMetric1}}
- {{SuccessMetric2}}
- {{SuccessMetric3}}

**Key Performance Indicators**:
- {{KPI1}}
- {{KPI2}}
- {{KPI3}}

## 2. Requirements Gathering Methodology

### 2.1 Information Gathering Techniques
- **Stakeholder Interviews**: One-on-one sessions with key stakeholders
- **Focus Groups**: Collaborative sessions with user groups
- **Workshops**: Facilitated requirements elicitation sessions
- **Document Analysis**: Review of existing systems and processes
- **Observation**: Shadowing users in their work environment
- **Surveys**: Structured questionnaires for broad input
- **Prototyping**: Interactive mockups for validation

### 2.2 Requirements Categories
#### Functional Requirements (FR)
- **User Functions**: What users need to accomplish
- **System Functions**: What the system needs to do
- **Business Rules**: Constraints and validation logic
- **Data Requirements**: Information that needs to be managed

#### Non-Functional Requirements (NFR)
- **Performance**: Speed, throughput, response times
- **Scalability**: Growth and load handling
- **Security**: Authentication, authorization, data protection
- **Usability**: User experience and accessibility
- **Reliability**: Uptime, fault tolerance, recovery
- **Compatibility**: Integration with existing systems
- **Compliance**: Regulatory and standards adherence

## 3. Functional Requirements Analysis

### 3.1 User Story Framework
\`\`\`
As a [USER ROLE]
I want to [CAPABILITY/FUNCTIONALITY]  
So that [BUSINESS VALUE/BENEFIT]

Acceptance Criteria:
- Given [INITIAL CONTEXT]
- When [EVENT OCCURS]
- Then [EXPECTED OUTCOME]
- And [ADDITIONAL OUTCOMES]
\`\`\`

### 3.2 Business Process Analysis
#### Current State Process Map
1. **Process**: {{CurrentProcessName}}
   - **Steps**: {{CurrentProcessSteps}}
   - **Pain Points**: {{CurrentPainPoints}}
   - **Inefficiencies**: {{CurrentInefficiencies}}

2. **Process**: {{CurrentProcessName2}}
   - **Steps**: {{CurrentProcessSteps2}}
   - **Pain Points**: {{CurrentPainPoints2}}
   - **Inefficiencies**: {{CurrentInefficiencies2}}

#### Future State Process Map
1. **Process**: {{FutureProcessName}}
   - **Improved Steps**: {{FutureProcessSteps}}
   - **Automation Points**: {{AutomationOpportunities}}
   - **Expected Benefits**: {{ProcessBenefits}}

### 3.3 Data Requirements Analysis
#### Data Entities
| Entity Name | Description | Attributes | Data Volume | Criticality |
|-------------|-------------|------------|-------------|-------------|
| {{EntityName1}} | {{EntityDescription1}} | {{EntityAttributes1}} | {{DataVolume1}} | {{Criticality1}} |
| {{EntityName2}} | {{EntityDescription2}} | {{EntityAttributes2}} | {{DataVolume2}} | {{Criticality2}} |
| {{EntityName3}} | {{EntityDescription3}} | {{EntityAttributes3}} | {{DataVolume3}} | {{Criticality3}} |

#### Data Flow Analysis
\`\`\`
[Source System] → [Validation] → [Transformation] → [Target System]
     ↓                ↓               ↓               ↓
[{{SourceSystem}}] → [{{ValidationRules}}] → [{{TransformationLogic}}] → [{{TargetSystem}}]
\`\`\`

### 3.4 Integration Requirements
#### System Interfaces
| Integration Point | Source System | Target System | Protocol | Data Format | Frequency |
|-------------------|---------------|---------------|----------|-------------|-----------|
| {{IntegrationName1}} | {{SourceSystem1}} | {{TargetSystem1}} | {{Protocol1}} | {{DataFormat1}} | {{Frequency1}} |
| {{IntegrationName2}} | {{SourceSystem2}} | {{TargetSystem2}} | {{Protocol2}} | {{DataFormat2}} | {{Frequency2}} |

## 4. Non-Functional Requirements Analysis

### 4.1 Performance Requirements
#### Response Time Requirements
| Function | Expected Load | Response Time Target | Peak Load Response Time |
|----------|---------------|---------------------|------------------------|
| {{Function1}} | {{ExpectedLoad1}} | {{ResponseTime1}} | {{PeakResponseTime1}} |
| {{Function2}} | {{ExpectedLoad2}} | {{ResponseTime2}} | {{PeakResponseTime2}} |
| {{Function3}} | {{ExpectedLoad3}} | {{ResponseTime3}} | {{PeakResponseTime3}} |

#### Throughput Requirements
- **Concurrent Users**: {{ConcurrentUsers}}
- **Transactions per Second**: {{TransactionsPerSecond}}
- **Data Processing Volume**: {{DataProcessingVolume}}
- **Peak Load Multiplier**: {{PeakLoadMultiplier}}

### 4.2 Security Requirements
#### Authentication Requirements
- **User Authentication Method**: {{AuthenticationMethod}}
- **Multi-Factor Authentication**: {{MFARequirement}}
- **Session Management**: {{SessionManagement}}
- **Password Policy**: {{PasswordPolicy}}

#### Authorization Requirements
- **Role-Based Access Control**: {{RBACRequirements}}
- **Permissions Model**: {{PermissionsModel}}
- **Data Access Controls**: {{DataAccessControls}}

#### Data Protection Requirements
- **Data Encryption**: {{EncryptionRequirements}}
- **PII Handling**: {{PIIHandling}}
- **Audit Trail**: {{AuditTrailRequirements}}
- **Data Retention**: {{DataRetentionPolicy}}

### 4.3 Usability Requirements
#### User Experience Requirements
- **User Interface Standards**: {{UIStandards}}
- **Accessibility Compliance**: {{AccessibilityRequirements}}
- **Browser Support**: {{BrowserSupport}}
- **Mobile Responsiveness**: {{MobileRequirements}}

#### Training and Support Requirements
- **User Training**: {{TrainingRequirements}}
- **Help Documentation**: {{DocumentationRequirements}}
- **Support Model**: {{SupportModel}}

### 4.4 Reliability and Availability
#### Uptime Requirements
- **Service Level Agreement**: {{SLARequirements}}
- **Planned Downtime**: {{PlannedDowntimeWindow}}
- **Recovery Time Objective**: {{RTORequirements}}
- **Recovery Point Objective**: {{RPORequirements}}

#### Error Handling Requirements
- **Error Recovery**: {{ErrorRecoveryRequirements}}
- **Graceful Degradation**: {{GracefulDegradationRequirements}}
- **Error Messaging**: {{ErrorMessagingRequirements}}

## 5. Requirements Prioritization

### 5.1 MoSCoW Analysis
#### Must Have (Critical)
1. {{MustHaveRequirement1}}
2. {{MustHaveRequirement2}}
3. {{MustHaveRequirement3}}

#### Should Have (Important)
1. {{ShouldHaveRequirement1}}
2. {{ShouldHaveRequirement2}}
3. {{ShouldHaveRequirement3}}

#### Could Have (Nice to Have)
1. {{CouldHaveRequirement1}}
2. {{CouldHaveRequirement2}}
3. {{CouldHaveRequirement3}}

#### Won't Have (Future Release)
1. {{WontHaveRequirement1}}
2. {{WontHaveRequirement2}}
3. {{WontHaveRequirement3}}

### 5.2 Risk-Value Matrix
| Requirement | Business Value | Implementation Risk | Priority Score |
|-------------|---------------|---------------------|----------------|
| {{Requirement1}} | {{BusinessValue1}} | {{ImplementationRisk1}} | {{PriorityScore1}} |
| {{Requirement2}} | {{BusinessValue2}} | {{ImplementationRisk2}} | {{PriorityScore2}} |
| {{Requirement3}} | {{BusinessValue3}} | {{ImplementationRisk3}} | {{PriorityScore3}} |

## 6. Constraints and Assumptions

### 6.1 Technical Constraints
- **Technology Stack**: {{TechnologyConstraints}}
- **Integration Limitations**: {{IntegrationConstraints}}
- **Performance Limitations**: {{PerformanceConstraints}}
- **Security Constraints**: {{SecurityConstraints}}

### 6.2 Business Constraints
- **Budget Limitations**: {{BudgetConstraints}}
- **Timeline Constraints**: {{TimelineConstraints}}
- **Resource Constraints**: {{ResourceConstraints}}
- **Regulatory Constraints**: {{RegulatoryConstraints}}

### 6.3 Assumptions
1. {{Assumption1}}
2. {{Assumption2}}
3. {{Assumption3}}
4. {{Assumption4}}

## 7. Requirements Validation

### 7.1 Validation Criteria
- **Completeness**: All requirements are fully specified
- **Consistency**: No conflicting requirements
- **Clarity**: Requirements are unambiguous
- **Testability**: Requirements can be verified
- **Traceability**: Requirements link to business objectives

### 7.2 Validation Methods
- **Requirements Review Sessions**: Structured walkthrough with stakeholders
- **Prototype Validation**: Interactive demonstrations
- **Requirements Traceability Matrix**: Mapping requirements to objectives
- **Impact Analysis**: Assessment of requirement changes

### 7.3 Sign-off Matrix
| Stakeholder Role | Name | Review Date | Approval Date | Signature |
|------------------|------|-------------|---------------|-----------|
| Business Sponsor | {{SponsorName}} | {{ReviewDate1}} | {{ApprovalDate1}} | |
| Product Owner | {{ProductOwnerName}} | {{ReviewDate2}} | {{ApprovalDate2}} | |
| Technical Lead | {{TechnicalLeadName}} | {{ReviewDate3}} | {{ApprovalDate3}} | |
| Quality Assurance | {{QALead}} | {{ReviewDate4}} | {{ApprovalDate4}} | |

## 8. Requirements Traceability

### 8.1 Business Objective Traceability
| Business Objective | Related Requirements | Success Metrics |
|-------------------|---------------------|-----------------|
| {{BusinessObjective1}} | {{RelatedRequirements1}} | {{SuccessMetrics1}} |
| {{BusinessObjective2}} | {{RelatedRequirements2}} | {{SuccessMetrics2}} |
| {{BusinessObjective3}} | {{RelatedRequirements3}} | {{SuccessMetrics3}} |

### 8.2 Stakeholder Requirements Matrix
| Requirement ID | Requirement Description | Stakeholder | Priority | Status |
|----------------|------------------------|-------------|----------|---------|
| {{RequirementID1}} | {{RequirementDescription1}} | {{Stakeholder1}} | {{Priority1}} | {{Status1}} |
| {{RequirementID2}} | {{RequirementDescription2}} | {{Stakeholder2}} | {{Priority2}} | {{Status2}} |
| {{RequirementID3}} | {{RequirementDescription3}} | {{Stakeholder3}} | {{Priority3}} | {{Status3}} |

## 9. Change Management

### 9.1 Requirements Change Process
1. **Change Request Submission**
2. **Impact Analysis**
3. **Stakeholder Review**
4. **Change Approval/Rejection**
5. **Requirements Update**
6. **Communication to Team**

### 9.2 Change Control Board
| Role | Name | Responsibilities |
|------|------|-----------------|
| Change Control Manager | {{CCMName}} | Process oversight |
| Business Representative | {{BusinessRep}} | Business impact assessment |
| Technical Representative | {{TechnicalRep}} | Technical impact assessment |
| Project Manager | {{ProjectManager}} | Schedule and resource impact |

## 10. Appendices

### Appendix A: Stakeholder Interview Templates
### Appendix B: Requirements Gathering Worksheets  
### Appendix C: Data Flow Diagrams
### Appendix D: System Interface Specifications
### Appendix E: Non-Functional Requirements Details`,
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
        content: `Define comprehensive epics with business value, acceptance criteria, and feature breakdown for agile development.

# Epic Template
## {{EpicTitle}}

### Epic Overview
- **Epic ID**: {{EpicID}}
- **Epic Title**: {{EpicTitle}}
- **Product**: {{ProductName}}
- **Squad/Team**: {{TeamName}}
- **Epic Owner**: {{EpicOwner}}
- **Created Date**: {{CreatedDate}}
- **Target Release**: {{TargetRelease}}
- **Status**: {{EpicStatus}}
- **Priority**: {{EpicPriority}}

### Epic Statement
**As a** {{UserPersona}}  
**I want** {{DesiredCapability}}  
**So that** {{BusinessValue}}

### Business Context
**Problem Statement**: {{ProblemStatement}}
**Business Opportunity**: {{BusinessOpportunity}}  
**Current State**: {{CurrentState}}
**Desired Future State**: {{DesiredFutureState}}

### Success Metrics
**Key Performance Indicators**:
- {{KPI1}}: {{KPITarget1}}
- {{KPI2}}: {{KPITarget2}}
- {{KPI3}}: {{KPITarget3}}

**Definition of Done**:
- [ ] {{DoneDefinition1}}
- [ ] {{DoneDefinition2}}  
- [ ] {{DoneDefinition3}}
- [ ] All user stories completed and accepted
- [ ] Quality gates passed (unit tests, integration tests, UAT)
- [ ] Performance requirements met
- [ ] Security requirements validated
- [ ] Documentation completed

### User Stories

#### Story 1: {{UserStoryTitle1}}
**Story ID**: {{StoryID1}}
**Priority**: {{StoryPriority1}}
**Estimate**: {{StoryEstimate1}}

**User Story**: 
As a {{UserRole1}}
I want to {{UserCapability1}}
So that {{UserBenefit1}}

**Acceptance Criteria**:
- [ ] **Given** {{PreconditionState1}}, **When** {{UserAction1}}, **Then** {{ExpectedOutcome1}}
- [ ] **Given** {{PreconditionState2}}, **When** {{UserAction2}}, **Then** {{ExpectedOutcome2}}
- [ ] **Given** {{PreconditionState3}}, **When** {{UserAction3}}, **Then** {{ExpectedOutcome3}}

**Technical Considerations**:
- {{TechnicalConsideration1}}
- {{TechnicalConsideration2}}

**Dependencies**:
- {{Dependency1}}
- {{Dependency2}}

### Dependencies and Constraints

#### Internal Dependencies
| Dependency | Type | Owner | Status | Impact | Mitigation |
|------------|------|-------|--------|--------|------------|
| {{InternalDependency1}} | {{DependencyType1}} | {{Owner1}} | {{Status1}} | {{Impact1}} | {{Mitigation1}} |
| {{InternalDependency2}} | {{DependencyType2}} | {{Owner2}} | {{Status2}} | {{Impact2}} | {{Mitigation2}} |

#### External Dependencies
| Dependency | Vendor/Team | SLA | Status | Risk Level | Contingency |
|------------|-------------|-----|--------|------------|-------------|
| {{ExternalDependency1}} | {{Vendor1}} | {{SLA1}} | {{Status1}} | {{Risk1}} | {{Contingency1}} |
| {{ExternalDependency2}} | {{Vendor2}} | {{SLA2}} | {{Status2}} | {{Risk2}} | {{Contingency2}} |

### Risk Assessment

#### Risk Registry
| Risk ID | Description | Probability | Impact | Risk Level | Owner | Mitigation Strategy | Status |
|---------|-------------|-------------|--------|------------|-------|-------------------|---------|
| {{RiskID1}} | {{RiskDescription1}} | {{Probability1}} | {{Impact1}} | {{RiskLevel1}} | {{RiskOwner1}} | {{MitigationStrategy1}} | {{RiskStatus1}} |
| {{RiskID2}} | {{RiskDescription2}} | {{Probability2}} | {{Impact2}} | {{RiskLevel2}} | {{RiskOwner2}} | {{MitigationStrategy2}} | {{RiskStatus2}} |

### Delivery Plan

#### Sprint Breakdown
**Sprint 1: {{Sprint1Title}}**
- Sprint Goal: {{Sprint1Goal}}
- Duration: {{Sprint1Duration}}
- Stories: {{Story1}}, {{Story2}}, {{Story3}}

**Sprint 2: {{Sprint2Title}}**
- Sprint Goal: {{Sprint2Goal}}
- Duration: {{Sprint2Duration}}
- Stories: {{Story4}}, {{Story5}}

### Success Criteria
- [ ] All user stories meet acceptance criteria
- [ ] Performance requirements satisfied
- [ ] Security requirements validated
- [ ] Stakeholder approval received`,
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
        content: `Create detailed feature specifications with wireframes, user flows, and technical requirements.

# Feature Specification Document
## {{FeatureName}}

### Document Information
- **Feature Name**: {{FeatureName}}
- **Feature ID**: {{FeatureID}}
- **Product**: {{ProductName}}
- **Version**: {{FeatureVersion}}
- **Created By**: {{FeatureOwner}}
- **Creation Date**: {{CreationDate}}
- **Last Updated**: {{LastUpdated}}
- **Status**: {{FeatureStatus}}
- **Priority**: {{FeaturePriority}}

### Feature Overview

#### Business Context
**Problem Statement**: {{ProblemStatement}}
**Business Value**: {{BusinessValue}}
**User Impact**: {{UserImpact}}
**Strategic Alignment**: {{StrategicAlignment}}

#### Feature Summary
{{FeatureSummary}}

### User Experience Design

#### User Personas
**Primary Persona**: {{PrimaryPersona}}
- **Demographics**: {{PersonaDemographics}}
- **Goals**: {{PersonaGoals}}
- **Pain Points**: {{PersonaPainPoints}}
- **Behavior Patterns**: {{BehaviorPatterns}}

**Secondary Persona**: {{SecondaryPersona}}
- **Demographics**: {{PersonaDemographics2}}
- **Goals**: {{PersonaGoals2}}
- **Pain Points**: {{PersonaPainPoints2}}

#### User Journey Map
\`\`\`
Step 1: {{JourneyStep1}}
├─ User Action: {{UserAction1}}
├─ Pain Points: {{PainPoints1}}
├─ Opportunities: {{Opportunities1}}
└─ Touchpoints: {{Touchpoints1}}

Step 2: {{JourneyStep2}}
├─ User Action: {{UserAction2}}
├─ Pain Points: {{PainPoints2}}
├─ Opportunities: {{Opportunities2}}
└─ Touchpoints: {{Touchpoints2}}

Step 3: {{JourneyStep3}}
├─ User Action: {{UserAction3}}
├─ Pain Points: {{PainPoints3}}
├─ Opportunities: {{Opportunities3}}
└─ Touchpoints: {{Touchpoints3}}
\`\`\`

#### User Flow Diagram
\`\`\`
[Entry Point] → [Authentication Check] → [Feature Access]
     ↓                    ↓                    ↓
[Landing Page] → [Form Submission] → [Processing] → [Confirmation]
     ↓                    ↓                    ↓           ↓
[Help/Support] ← [Error Handling] ← [Validation] → [Success State]
\`\`\`

### Wireframes and UI Specifications

#### Key Screens

##### Screen 1: {{ScreenName1}}
**Purpose**: {{ScreenPurpose1}}
**Layout**: {{ScreenLayout1}}

**UI Components**:
- Header: {{HeaderDescription1}}
- Navigation: {{NavigationDescription1}}
- Main Content: {{MainContentDescription1}}
- Sidebar: {{SidebarDescription1}}
- Footer: {{FooterDescription1}}

**Interactive Elements**:
- Primary Actions: {{PrimaryActions1}}
- Secondary Actions: {{SecondaryActions1}}
- Form Elements: {{FormElements1}}
- Data Display: {{DataDisplay1}}

**Wireframe**:
\`\`\`
+----------------------------------+
|            Header                |
|   Logo  |  Navigation  | User    |
+----------------------------------+
| Sidebar |        Main Content    |
|         |                        |
|  Menu   |   {{ContentArea1}}     |
|  Items  |                        |
|         |   {{ContentArea2}}     |
|         |                        |
|         |   [Primary Button]     |
+----------------------------------+
|            Footer                |
+----------------------------------+
\`\`\`

##### Screen 2: {{ScreenName2}}
**Purpose**: {{ScreenPurpose2}}
**Layout**: {{ScreenLayout2}}

**UI Components**:
- Header: {{HeaderDescription2}}
- Main Content: {{MainContentDescription2}}
- Action Panel: {{ActionPanelDescription2}}

**Wireframe**:
\`\`\`
+----------------------------------+
|            Header                |
+----------------------------------+
|                                  |
|     {{MainContentArea}}          |
|                                  |
|  +---------------------------+   |
|  |    {{ActionPanel}}        |   |
|  |  [Button1] [Button2]     |   |
|  +---------------------------+   |
+----------------------------------+
\`\`\`

### Functional Requirements

#### Core Features

##### Feature 1: {{CoreFeature1}}
**Description**: {{CoreFeature1Description}}
**User Story**: As a {{UserRole1}}, I want to {{Capability1}} so that {{Benefit1}}.

**Functional Requirements**:
- FR-1.1: The system shall {{Requirement1}}
- FR-1.2: The system shall {{Requirement2}}
- FR-1.3: The system shall {{Requirement3}}

**Business Rules**:
- BR-1.1: {{BusinessRule1}}
- BR-1.2: {{BusinessRule2}}

**Acceptance Criteria**:
- [ ] Given {{GivenCondition1}}, when {{WhenAction1}}, then {{ThenResult1}}
- [ ] Given {{GivenCondition2}}, when {{WhenAction2}}, then {{ThenResult2}}
- [ ] Given {{GivenCondition3}}, when {{WhenAction3}}, then {{ThenResult3}}

##### Feature 2: {{CoreFeature2}}
**Description**: {{CoreFeature2Description}}
**User Story**: As a {{UserRole2}}, I want to {{Capability2}} so that {{Benefit2}}.

**Functional Requirements**:
- FR-2.1: The system shall {{Requirement4}}
- FR-2.2: The system shall {{Requirement5}}
- FR-2.3: The system shall {{Requirement6}}

**Business Rules**:
- BR-2.1: {{BusinessRule3}}
- BR-2.2: {{BusinessRule4}}

**Acceptance Criteria**:
- [ ] Given {{GivenCondition4}}, when {{WhenAction4}}, then {{ThenResult4}}
- [ ] Given {{GivenCondition5}}, when {{WhenAction5}}, then {{ThenResult5}}

#### Supporting Features

##### Feature 3: {{SupportingFeature1}}
**Description**: {{SupportingFeature1Description}}
**User Story**: As a {{UserRole3}}, I want to {{Capability3}} so that {{Benefit3}}.

**Functional Requirements**:
- FR-3.1: The system shall {{Requirement7}}
- FR-3.2: The system shall {{Requirement8}}

### Technical Specifications

#### Architecture Requirements
**System Architecture**: {{SystemArchitecture}}
**Design Patterns**: {{DesignPatterns}}
**Integration Points**: {{IntegrationPoints}}

#### Data Model
\`\`\`sql
-- Core Data Entities
CREATE TABLE {{EntityName1}} (
    Id uniqueidentifier PRIMARY KEY,
    {{Field1}} {{DataType1}} {{Constraints1}},
    {{Field2}} {{DataType2}} {{Constraints2}},
    {{Field3}} {{DataType3}} {{Constraints3}},
    CreatedDate datetime2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedDate datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy nvarchar(255) NOT NULL,
    ModifiedBy nvarchar(255) NOT NULL
);

CREATE TABLE {{EntityName2}} (
    Id uniqueidentifier PRIMARY KEY,
    {{EntityName1}}Id uniqueidentifier NOT NULL,
    {{Field1}} {{DataType1}} {{Constraints1}},
    {{Field2}} {{DataType2}} {{Constraints2}},
    FOREIGN KEY ({{EntityName1}}Id) REFERENCES {{EntityName1}}(Id)
);
\`\`\`

#### API Specifications
\`\`\`yaml
# REST API Endpoints
/api/{{resource}}:
  get:
    summary: {{GetSummary}}
    parameters:
      - name: {{ParamName1}}
        in: query
        required: {{Required1}}
        schema:
          type: {{ParamType1}}
      - name: {{ParamName2}}
        in: query
        required: {{Required2}}
        schema:
          type: {{ParamType2}}
    responses:
      200:
        description: {{SuccessDescription}}
        content:
          application/json:
            schema:
              type: object
              properties:
                {{PropertyName1}}:
                  type: {{PropertyType1}}
                {{PropertyName2}}:
                  type: {{PropertyType2}}
      400:
        description: Bad request
      404:
        description: Resource not found
      500:
        description: Internal server error

  post:
    summary: {{PostSummary}}
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              {{RequestProperty1}}:
                type: {{RequestType1}}
              {{RequestProperty2}}:
                type: {{RequestType2}}
    responses:
      201:
        description: Resource created successfully
      400:
        description: Invalid request data
      500:
        description: Internal server error
\`\`\`

### Non-Functional Requirements

#### Performance Requirements
- **Response Time**: {{ResponseTimeRequirement}}
- **Throughput**: {{ThroughputRequirement}}
- **Concurrent Users**: {{ConcurrentUsersRequirement}}
- **Data Volume**: {{DataVolumeRequirement}}

#### Security Requirements
- **Authentication**: {{AuthenticationRequirement}}
- **Authorization**: {{AuthorizationRequirement}}
- **Data Encryption**: {{EncryptionRequirement}}
- **Audit Logging**: {{AuditRequirement}}

#### Usability Requirements
- **Accessibility**: {{AccessibilityRequirement}}
- **Browser Support**: {{BrowserSupportRequirement}}
- **Mobile Responsiveness**: {{MobileRequirement}}
- **User Experience**: {{UXRequirement}}

### Integration Requirements

#### External Systems
| System Name | Integration Type | Protocol | Data Exchange | Frequency |
|-------------|------------------|----------|---------------|-----------|
| {{ExternalSystem1}} | {{IntegrationType1}} | {{Protocol1}} | {{DataExchange1}} | {{Frequency1}} |
| {{ExternalSystem2}} | {{IntegrationType2}} | {{Protocol2}} | {{DataExchange2}} | {{Frequency2}} |

#### Internal Systems
| System Name | Integration Point | Data Flow | Dependencies |
|-------------|-------------------|-----------|--------------|
| {{InternalSystem1}} | {{IntegrationPoint1}} | {{DataFlow1}} | {{Dependencies1}} |
| {{InternalSystem2}} | {{IntegrationPoint2}} | {{DataFlow2}} | {{Dependencies2}} |

### Testing Strategy

#### Test Scenarios
**Scenario 1: {{TestScenario1}}**
- **Objective**: {{TestObjective1}}
- **Steps**: {{TestSteps1}}
- **Expected Result**: {{ExpectedResult1}}
- **Pass Criteria**: {{PassCriteria1}}

**Scenario 2: {{TestScenario2}}**
- **Objective**: {{TestObjective2}}
- **Steps**: {{TestSteps2}}
- **Expected Result**: {{ExpectedResult2}}
- **Pass Criteria**: {{PassCriteria2}}

#### Test Types
- **Unit Testing**: {{UnitTestingApproach}}
- **Integration Testing**: {{IntegrationTestingApproach}}
- **User Acceptance Testing**: {{UATApproach}}
- **Performance Testing**: {{PerformanceTestingApproach}}
- **Security Testing**: {{SecurityTestingApproach}}

### Implementation Plan

#### Development Phases
**Phase 1: {{Phase1Name}}** ({{Phase1Duration}})
- {{Phase1Objective}}
- Deliverables: {{Phase1Deliverables}}
- Success Criteria: {{Phase1SuccessCriteria}}

**Phase 2: {{Phase2Name}}** ({{Phase2Duration}})
- {{Phase2Objective}}
- Deliverables: {{Phase2Deliverables}}
- Success Criteria: {{Phase2SuccessCriteria}}

**Phase 3: {{Phase3Name}}** ({{Phase3Duration}})
- {{Phase3Objective}}
- Deliverables: {{Phase3Deliverables}}
- Success Criteria: {{Phase3SuccessCriteria}}

#### Risk Assessment
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| {{Risk1}} | {{Impact1}} | {{Probability1}} | {{Mitigation1}} |
| {{Risk2}} | {{Impact2}} | {{Probability2}} | {{Mitigation2}} |
| {{Risk3}} | {{Impact3}} | {{Probability3}} | {{Mitigation3}} |

### Success Metrics

#### Key Performance Indicators
- **User Adoption**: {{AdoptionMetric}}
- **User Satisfaction**: {{SatisfactionMetric}}
- **Performance**: {{PerformanceMetric}}
- **Business Impact**: {{BusinessImpactMetric}}

#### Acceptance Criteria
- [ ] {{AcceptanceCriteria1}}
- [ ] {{AcceptanceCriteria2}}
- [ ] {{AcceptanceCriteria3}}
- [ ] All functional requirements implemented
- [ ] All non-functional requirements met
- [ ] User acceptance testing passed
- [ ] Performance benchmarks achieved
- [ ] Security requirements validated

### Appendices

#### Appendix A: Design Assets
- Wireframes: {{WireframeLocation}}
- Mockups: {{MockupLocation}}
- Style Guide: {{StyleGuideLocation}}

#### Appendix B: Technical Documentation
- API Documentation: {{APIDocLocation}}
- Database Schema: {{SchemaDocLocation}}
- Architecture Diagrams: {{ArchitectureDocLocation}}

#### Appendix C: Testing Documentation
- Test Plans: {{TestPlanLocation}}
- Test Cases: {{TestCaseLocation}}
- Test Results: {{TestResultLocation}}`,
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
        content: `Establish code review standards with security, performance, and maintainability checkpoints.

# Comprehensive Code Review Checklist
## Quality Assurance and Best Practices Guide

### Pre-Review Checklist

#### Developer Self-Review
- [ ] **Code Compilation**: Code compiles without errors or warnings
- [ ] **Local Testing**: All tests pass locally
- [ ] **Code Formatting**: Code follows established formatting standards
- [ ] **Commit Messages**: Clear, descriptive commit messages following conventions
- [ ] **Branch Strategy**: Feature branch is up-to-date with main/develop branch
- [ ] **Documentation**: README and inline documentation updated as needed

#### Pull Request Information
- [ ] **Clear Description**: PR description explains what was changed and why
- [ ] **Linked Issues**: References to related issues or tickets
- [ ] **Screenshots/Demos**: Visual evidence for UI changes
- [ ] **Breaking Changes**: Any breaking changes clearly documented
- [ ] **Migration Notes**: Database or configuration changes documented

### Code Quality Review

#### Code Structure and Organization
- [ ] **Single Responsibility**: Each function/class has a single, clear purpose
- [ ] **DRY Principle**: No unnecessary code duplication
- [ ] **SOLID Principles**: Code follows SOLID design principles where applicable
- [ ] **Naming Conventions**: Variables, functions, and classes have meaningful names
- [ ] **Code Organization**: Logical file and folder structure
- [ ] **Complexity**: Functions are reasonably sized and not overly complex
- [ ] **Abstraction**: Appropriate level of abstraction used

#### Coding Standards Compliance
- [ ] **Style Guide**: Code follows team/project style guide
- [ ] **Indentation**: Consistent indentation throughout
- [ ] **Line Length**: Lines don't exceed maximum length (typically 80-120 characters)
- [ ] **Spacing**: Proper spacing around operators and after keywords
- [ ] **Comments**: Code is appropriately commented, especially complex logic
- [ ] **TODO/FIXME**: No temporary TODO/FIXME comments in production code

### Functionality Review

#### Logic and Implementation
- [ ] **Requirements Met**: Code satisfies all stated requirements
- [ ] **Edge Cases**: Edge cases and boundary conditions handled appropriately
- [ ] **Error Scenarios**: Proper handling of error scenarios
- [ ] **Input Validation**: All user inputs validated and sanitized
- [ ] **Business Logic**: Business rules correctly implemented
- [ ] **Data Flow**: Data flows correctly through the application
- [ ] **State Management**: Application state managed consistently

#### Algorithm Efficiency
- [ ] **Time Complexity**: Algorithms have appropriate time complexity
- [ ] **Space Complexity**: Memory usage is optimized
- [ ] **Database Queries**: Efficient database queries without N+1 problems
- [ ] **Caching Strategy**: Appropriate use of caching where beneficial
- [ ] **Lazy Loading**: Expensive operations are lazy-loaded when possible

### Security Review

#### Authentication and Authorization
- [ ] **Authentication**: User authentication properly implemented
- [ ] **Authorization**: User permissions checked before sensitive operations
- [ ] **Session Management**: Sessions handled securely
- [ ] **Password Handling**: Passwords properly hashed and salted
- [ ] **JWT Tokens**: Tokens have appropriate expiration and validation
- [ ] **Role-Based Access**: Role-based access control implemented correctly

#### Data Protection
- [ ] **Input Sanitization**: All inputs sanitized to prevent injection attacks
- [ ] **SQL Injection**: Protection against SQL injection attacks
- [ ] **XSS Prevention**: Cross-site scripting vulnerabilities addressed
- [ ] **CSRF Protection**: Cross-site request forgery protection implemented
- [ ] **Data Encryption**: Sensitive data encrypted in transit and at rest
- [ ] **PII Handling**: Personal information handled according to privacy regulations
- [ ] **Logging Security**: No sensitive data logged in plain text

#### Secure Coding Practices
- [ ] **Hardcoded Secrets**: No hardcoded passwords, API keys, or secrets
- [ ] **Environment Variables**: Sensitive configuration in environment variables
- [ ] **Third-party Dependencies**: Dependencies are up-to-date and secure
- [ ] **File Uploads**: File upload functionality secure against malicious files
- [ ] **API Security**: APIs have proper rate limiting and authentication
- [ ] **Headers Security**: Security headers properly configured

### Performance Review

#### Performance Optimization
- [ ] **Database Performance**: Queries are optimized and indexed appropriately
- [ ] **Memory Usage**: No memory leaks or excessive memory consumption
- [ ] **Resource Cleanup**: Proper cleanup of resources (connections, files, etc.)
- [ ] **Asynchronous Operations**: Appropriate use of async/await patterns
- [ ] **Bulk Operations**: Bulk operations used instead of loops where applicable
- [ ] **Caching Implementation**: Effective caching strategy implemented
- [ ] **Connection Pooling**: Database connection pooling configured properly

#### Scalability Considerations
- [ ] **Load Handling**: Code can handle expected load
- [ ] **Concurrent Access**: Thread-safe implementation where required
- [ ] **Horizontal Scaling**: Code supports horizontal scaling
- [ ] **Resource Utilization**: Efficient use of CPU and memory resources
- [ ] **Background Jobs**: Long-running tasks moved to background processing
- [ ] **API Rate Limiting**: Rate limiting implemented for public APIs

### Testing Review

#### Test Coverage
- [ ] **Unit Tests**: Adequate unit test coverage (minimum 80%)
- [ ] **Integration Tests**: Key integration points tested
- [ ] **End-to-End Tests**: Critical user journeys covered by E2E tests
- [ ] **Test Quality**: Tests are meaningful and test actual functionality
- [ ] **Mock Usage**: Appropriate use of mocks and stubs
- [ ] **Test Data**: Test data is representative and covers edge cases
- [ ] **Test Isolation**: Tests are independent and don't interfere with each other

#### Test Implementation
- [ ] **Test Naming**: Test names clearly describe what is being tested
- [ ] **Arrange-Act-Assert**: Tests follow AAA pattern
- [ ] **Test Performance**: Tests run efficiently and don't slow down CI/CD
- [ ] **Flaky Tests**: No flaky or intermittently failing tests
- [ ] **Test Documentation**: Complex test scenarios documented
- [ ] **Test Maintenance**: Tests are maintainable and readable

### Documentation Review

#### Code Documentation
- [ ] **API Documentation**: Public APIs documented with examples
- [ ] **Inline Comments**: Complex logic explained with comments
- [ ] **Function Documentation**: Function parameters and return values documented
- [ ] **Class Documentation**: Class purpose and usage documented
- [ ] **Configuration Documentation**: Configuration options documented
- [ ] **Architecture Documentation**: High-level architecture decisions documented

#### User Documentation
- [ ] **README Updates**: README file updated with new features
- [ ] **User Guide**: User-facing documentation updated
- [ ] **Migration Guide**: Migration instructions for breaking changes
- [ ] **Deployment Notes**: Deployment and configuration notes
- [ ] **Troubleshooting**: Common issues and solutions documented

### Database Review

#### Schema Changes
- [ ] **Migration Scripts**: Database migrations are reversible
- [ ] **Index Strategy**: Appropriate indexes created for query performance
- [ ] **Constraint Validation**: Proper foreign key constraints and validations
- [ ] **Data Types**: Appropriate data types for columns
- [ ] **Normalization**: Database properly normalized to reduce redundancy
- [ ] **Backup Considerations**: Impact on backup and recovery procedures
- [ ] **Performance Impact**: Schema changes won't negatively impact performance

#### Data Handling
- [ ] **Data Integrity**: Data integrity maintained across operations
- [ ] **Transaction Management**: Proper use of database transactions
- [ ] **Concurrency Control**: Handling of concurrent data modifications
- [ ] **Data Validation**: Server-side validation for all data changes
- [ ] **Audit Trail**: Important data changes logged for audit purposes

### DevOps and Deployment

#### CI/CD Integration
- [ ] **Build Process**: Code builds successfully in CI environment
- [ ] **Test Automation**: All tests run automatically in CI pipeline
- [ ] **Code Quality Gates**: Quality gates pass (coverage, static analysis)
- [ ] **Security Scanning**: Security vulnerability scanning passes
- [ ] **Dependency Checks**: Dependency vulnerability checks pass
- [ ] **Environment Parity**: Development environment matches production

#### Deployment Readiness
- [ ] **Configuration Management**: Environment-specific configurations handled properly
- [ ] **Feature Flags**: Feature flags used for gradual rollout if applicable
- [ ] **Rollback Plan**: Clear rollback strategy defined
- [ ] **Monitoring**: Appropriate logging and monitoring implemented
- [ ] **Health Checks**: Health check endpoints implemented
- [ ] **Resource Requirements**: Resource requirements documented

### Review Process

#### Reviewer Responsibilities
- [ ] **Thorough Review**: All aspects of the checklist considered
- [ ] **Constructive Feedback**: Feedback is constructive and educational
- [ ] **Knowledge Sharing**: Opportunities for knowledge sharing identified
- [ ] **Code Understanding**: Reviewer understands the changes being made
- [ ] **Testing**: Manual testing performed where appropriate
- [ ] **Documentation Review**: Associated documentation reviewed

#### Review Outcomes
- [ ] **Approval**: Code meets all quality standards
- [ ] **Request Changes**: Specific issues identified and communicated
- [ ] **Follow-up**: Action items for follow-up work identified
- [ ] **Learning Notes**: Key learnings documented for team knowledge

### Post-Review Actions

#### After Approval
- [ ] **Merge Strategy**: Appropriate merge strategy used
- [ ] **Deployment**: Deployment process followed
- [ ] **Monitoring**: Post-deployment monitoring performed
- [ ] **Documentation Update**: Final documentation updates completed
- [ ] **Team Communication**: Relevant team members notified of changes

#### Continuous Improvement
- [ ] **Process Feedback**: Feedback on review process collected
- [ ] **Checklist Updates**: Checklist updated based on lessons learned
- [ ] **Tool Improvement**: Suggestions for tooling improvements noted
- [ ] **Training Needs**: Training needs identified and planned

### Severity Levels

#### Critical Issues (Must Fix)
- Security vulnerabilities
- Functionality breaks existing features
- Performance regressions
- Data loss or corruption risks
- Compliance violations

#### Major Issues (Should Fix)
- Poor performance
- Maintainability concerns
- Missing test coverage
- Documentation gaps
- Non-compliance with coding standards

#### Minor Issues (Consider Fixing)
- Code style inconsistencies
- Optimization opportunities
- Refactoring suggestions
- Enhanced error messages
- Additional test cases

### Review Sign-off

#### Final Checklist
- [ ] **All Critical Issues Resolved**
- [ ] **Major Issues Addressed or Acknowledged**
- [ ] **Tests Pass**: All automated tests passing
- [ ] **Documentation Complete**: Required documentation completed
- [ ] **Deployment Ready**: Code ready for deployment

#### Reviewer Sign-off
**Reviewer Name**: {{ReviewerName}}
**Review Date**: {{ReviewDate}}
**Approval Status**: {{ApprovalStatus}}
**Additional Notes**: {{AdditionalNotes}}

This comprehensive code review checklist ensures high-quality, secure, and maintainable code while promoting knowledge sharing and continuous improvement within the development team.`,
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
        content: `Define Git workflow with branching strategy, merge policies, and release management procedures.

# Git Workflow Template
## Branch Strategy and Development Process

### Overview
This document defines the Git workflow strategy, branching model, merge policies, and release management procedures for the project team.

### Branch Strategy

#### Main Branches

##### main/master Branch
- **Purpose**: Production-ready code
- **Protection**: Protected branch with required reviews
- **Merge Strategy**: Squash and merge from release branches
- **Direct Commits**: Prohibited except for hotfixes
- **Auto-Deploy**: Automatically deploys to production

##### develop Branch
- **Purpose**: Integration branch for features
- **Protection**: Protected with required CI checks
- **Merge Strategy**: Merge commits from feature branches
- **Auto-Deploy**: Automatically deploys to staging environment

#### Supporting Branches

##### Feature Branches
**Naming Convention**: \`feature/JIRA-123-short-description\`
**Branch From**: develop
**Merge To**: develop
**Lifespan**: Until feature completion

**Branch Creation**:
\`\`\`bash
# Create and switch to feature branch
git checkout develop
git pull origin develop
git checkout -b feature/PROJ-123-user-authentication

# Push to remote
git push -u origin feature/PROJ-123-user-authentication
\`\`\`

##### Release Branches
**Naming Convention**: \`release/v1.2.0\`
**Branch From**: develop
**Merge To**: main and develop
**Lifespan**: Until release deployment

**Branch Creation**:
\`\`\`bash
# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Update version numbers
npm version minor --no-git-tag-version
git add package.json package-lock.json
git commit -m "Bump version to 1.2.0"
git push -u origin release/v1.2.0
\`\`\`

##### Hotfix Branches
**Naming Convention**: \`hotfix/v1.1.1-critical-bug-fix\`
**Branch From**: main
**Merge To**: main and develop
**Lifespan**: Until hotfix deployment

**Branch Creation**:
\`\`\`bash
# Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/v1.1.1-security-patch

# Apply fix and bump patch version
npm version patch --no-git-tag-version
git add .
git commit -m "Fix: Security vulnerability in authentication"
git push -u origin hotfix/v1.1.1-security-patch
\`\`\`

### Development Workflow

#### Feature Development Process

**Step 1: Create Feature Branch**
\`\`\`bash
# Sync with latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/PROJ-456-shopping-cart
git push -u origin feature/PROJ-456-shopping-cart
\`\`\`

**Step 2: Development Work**
\`\`\`bash
# Regular commits with meaningful messages
git add .
git commit -m "feat: Add product to cart functionality

- Implement AddToCart service method
- Add cart state management
- Include unit tests for cart operations
- Update API documentation

Closes PROJ-456"

# Push changes regularly
git push origin feature/PROJ-456-shopping-cart
\`\`\`

**Step 3: Keep Branch Updated**
\`\`\`bash
# Regularly sync with develop to avoid conflicts
git checkout develop
git pull origin develop
git checkout feature/PROJ-456-shopping-cart
git merge develop

# Or use rebase for cleaner history
git rebase develop
\`\`\`

**Step 4: Create Pull Request**
- Create PR from feature branch to develop
- Fill out PR template with description
- Link related JIRA tickets
- Request code review from team members
- Ensure CI/CD checks pass

#### Code Review Process

**Review Checklist**:
- [ ] Code follows coding standards
- [ ] Adequate test coverage
- [ ] Documentation updated
- [ ] No breaking changes without migration
- [ ] Security considerations addressed
- [ ] Performance impact evaluated

**Approval Requirements**:
- Minimum 2 reviewers approval
- All CI checks must pass
- No unresolved conversations
- Branch must be up-to-date with develop

### Commit Message Guidelines

#### Commit Message Format
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

#### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependency updates
- **ci**: CI/CD configuration changes
- **breaking**: Breaking changes

#### Examples
\`\`\`bash
# Feature commit
git commit -m "feat(auth): Add OAuth2 integration

- Implement OAuth2 authentication flow
- Add Google and Microsoft providers
- Include refresh token management
- Update user profile handling

Closes PROJ-123"

# Bug fix commit
git commit -m "fix(cart): Resolve quantity update issue

- Fix cart quantity not updating in state
- Add validation for negative quantities
- Include regression test for cart operations

Fixes PROJ-456"

# Breaking change commit
git commit -m "feat(api): Restructure user endpoints

BREAKING CHANGE: User API endpoints have been restructured
- /api/user -> /api/v2/users
- Response format changed to include metadata
- Authentication header now required for all endpoints

Migration guide available in MIGRATION.md

Closes PROJ-789"
\`\`\`

### Merge Strategies

#### Feature to Develop
**Strategy**: Merge commit (preserve branch history)
\`\`\`bash
git checkout develop
git pull origin develop
git merge --no-ff feature/PROJ-123-feature-name
git push origin develop
\`\`\`

#### Release to Main
**Strategy**: Squash and merge (clean main history)
\`\`\`bash
git checkout main
git pull origin main
git merge --squash release/v1.2.0
git commit -m "Release v1.2.0

- Feature A: Description
- Feature B: Description
- Bug fixes and improvements

Release notes: https://github.com/project/releases/v1.2.0"
git push origin main
git tag v1.2.0
git push origin v1.2.0
\`\`\`

#### Hotfix Process
\`\`\`bash
# Merge to main
git checkout main
git merge --squash hotfix/v1.1.1-security-patch
git commit -m "Hotfix v1.1.1: Security patch"
git push origin main
git tag v1.1.1
git push origin v1.1.1

# Merge to develop
git checkout develop
git merge main
git push origin develop
\`\`\`

### Release Management

#### Release Process

**Phase 1: Release Planning**
1. Create release branch from develop
2. Update version numbers
3. Update CHANGELOG.md
4. Create release notes draft

**Phase 2: Testing and Stabilization**
1. Deploy release branch to staging
2. Run full test suite
3. Conduct user acceptance testing
4. Fix any critical issues in release branch

**Phase 3: Release Deployment**
1. Merge release branch to main
2. Deploy to production
3. Create GitHub release with notes
4. Merge back to develop
5. Clean up release branch

#### Version Numbering
Follow Semantic Versioning (SemVer): \`MAJOR.MINOR.PATCH\`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

#### Release Notes Template
\`\`\`markdown
# Release v{{version}}

## 🚀 New Features
- {{feature1}}: {{description1}}
- {{feature2}}: {{description2}}

## 🐛 Bug Fixes  
- {{bugfix1}}: {{description1}}
- {{bugfix2}}: {{description2}}

## 🔧 Improvements
- {{improvement1}}: {{description1}}
- {{improvement2}}: {{description2}}

## 💥 Breaking Changes
- {{breaking1}}: {{description1}}
  Migration: {{migration1}}

## 📚 Documentation
- {{doc1}}: {{description1}}

## 🏗️ Technical Changes
- {{tech1}}: {{description1}}

## Contributors
- @{{contributor1}}
- @{{contributor2}}
\`\`\`

### Branch Protection Rules

#### Main Branch Protection
- Require pull request reviews
- Require status checks to pass
- Restrict pushes to admins only
- Require linear history
- Include administrators in restrictions

#### Develop Branch Protection  
- Require status checks to pass
- Allow squash and merge
- Delete head branches automatically
- Require conversation resolution

### CI/CD Integration

#### Automated Checks
\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Build application
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
\`\`\`

#### Deployment Triggers
- **Staging**: Automatic deployment on develop branch updates
- **Production**: Automatic deployment on main branch updates
- **Preview**: Deployment for pull requests to develop

### Git Hooks

#### Pre-commit Hook
\`\`\`bash
#!/bin/sh
# .git/hooks/pre-commit

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Commit aborted."
  exit 1
fi

# Run tests
npm run test
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi

# Check commit message format
commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci|breaking)(\(.+\))?: .{1,50}'
if ! grep -qE "$commit_regex" "$1"; then
  echo "Invalid commit message format. Please follow conventional commits."
  exit 1
fi
\`\`\`

#### Pre-push Hook
\`\`\`bash
#!/bin/sh
# .git/hooks/pre-push

# Prevent direct pushes to protected branches
protected_branch='main'
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')

if [ $protected_branch = $current_branch ]; then
  echo "Direct pushes to main branch are not allowed."
  echo "Please create a pull request."
  exit 1
fi
\`\`\`

### Troubleshooting Common Issues

#### Merge Conflicts
\`\`\`bash
# When conflicts occur during merge
git status # Check conflicted files
# Edit files to resolve conflicts
git add <resolved-files>
git commit -m "Resolve merge conflicts"
\`\`\`

#### Accidental Commits to Wrong Branch
\`\`\`bash
# Move commits to correct branch
git log --oneline -n 5 # Find commit hash
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1 # Remove from wrong branch
\`\`\`

#### Updating Pull Request
\`\`\`bash
# Force push changes to update PR
git add .
git commit -m "Address review comments"
git push origin feature/branch-name
\`\`\`

### Team Guidelines

#### Daily Practices
- Pull latest changes before starting work
- Push work daily to remote branches
- Keep feature branches small and focused
- Write descriptive commit messages
- Update documentation with code changes

#### Code Review Standards
- Review within 24 hours
- Provide constructive feedback
- Test changes locally when needed
- Approve only when confident
- Use GitHub's suggestion feature for small fixes

#### Branch Housekeeping
- Delete feature branches after merge
- Regular cleanup of stale branches
- Keep local repository synchronized
- Use \`git branch -d\` for safe deletion

This Git workflow ensures code quality, collaboration efficiency, and release reliability for the development team.`,
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
        content: `Establish clear definition of done criteria including testing, documentation, and deployment requirements.

# Definition of Done Template
## Quality Standards and Completion Criteria

### Overview
This document defines the comprehensive criteria that must be met before any work item (user story, task, or feature) can be considered "done" and ready for production deployment.

### Universal Definition of Done
Every work item must satisfy ALL the following criteria before being marked as complete:

#### Code Quality Standards
- [ ] **Code Review Completed**: All code changes have been reviewed and approved by at least 2 team members
- [ ] **Coding Standards Compliance**: Code follows established coding standards and style guides
- [ ] **No Code Smells**: Code is clean, readable, and maintainable
- [ ] **Error Handling**: Proper error handling and logging implemented
- [ ] **Security Best Practices**: Security considerations addressed (input validation, authentication, authorization)
- [ ] **Performance Considerations**: Code meets performance requirements and doesn't introduce performance regressions

#### Testing Requirements
- [ ] **Unit Tests**: Unit tests written with minimum 80% code coverage
- [ ] **Integration Tests**: Integration tests cover all external dependencies and services
- [ ] **End-to-End Tests**: Critical user paths covered by automated E2E tests
- [ ] **Manual Testing**: Functionality manually tested by QA team
- [ ] **Edge Cases Tested**: Boundary conditions and edge cases verified
- [ ] **Regression Testing**: Existing functionality confirmed to work correctly
- [ ] **Cross-Browser Testing**: Functionality verified across supported browsers
- [ ] **Mobile Responsiveness**: UI tested on mobile devices (if applicable)

#### Documentation Standards
- [ ] **Code Documentation**: Complex code sections have inline comments and documentation
- [ ] **API Documentation**: Public APIs documented with examples and schema
- [ ] **README Updated**: Project README updated with new features or changes
- [ ] **User Documentation**: User-facing documentation updated
- [ ] **Technical Documentation**: Architecture and design decisions documented
- [ ] **Release Notes**: Changes documented in release notes/changelog

#### Security & Compliance
- [ ] **Security Review**: Security implications assessed and addressed
- [ ] **Data Protection**: Personal data handling complies with privacy regulations
- [ ] **Access Controls**: Proper authentication and authorization implemented
- [ ] **Input Validation**: All user inputs validated and sanitized
- [ ] **Audit Logging**: Security-relevant actions logged appropriately
- [ ] **Vulnerability Scanning**: Code scanned for known vulnerabilities

#### Configuration & Environment
- [ ] **Environment Configuration**: Works correctly in all target environments
- [ ] **Configuration Management**: Environment-specific settings properly configured
- [ ] **Database Migrations**: Database changes scripted and tested
- [ ] **Feature Flags**: Feature flags configured if applicable
- [ ] **Environment Variables**: Required environment variables documented

#### Performance & Scalability
- [ ] **Performance Testing**: Performance benchmarks met
- [ ] **Load Testing**: System handles expected load
- [ ] **Memory Usage**: No memory leaks detected
- [ ] **Database Performance**: Database queries optimized
- [ ] **Caching Strategy**: Appropriate caching implemented
- [ ] **Resource Utilization**: Efficient use of system resources

#### Deployment & Operations
- [ ] **Build Success**: Code builds successfully in CI/CD pipeline
- [ ] **Deployment Tested**: Deployment process tested in staging environment
- [ ] **Rollback Plan**: Rollback procedure defined and tested
- [ ] **Monitoring**: Appropriate monitoring and alerting configured
- [ ] **Health Checks**: Health check endpoints implemented
- [ ] **Log Analysis**: Logs reviewed for errors or warnings

#### User Experience
- [ ] **Usability Testing**: Feature usability validated with users
- [ ] **Accessibility**: WCAG guidelines followed for accessibility
- [ ] **User Feedback**: Feedback from stakeholders incorporated
- [ ] **UI/UX Review**: Design consistency maintained
- [ ] **User Journey**: Complete user workflows verified

#### Business Requirements
- [ ] **Acceptance Criteria**: All defined acceptance criteria satisfied
- [ ] **Business Logic**: Business rules correctly implemented
- [ ] **Stakeholder Approval**: Feature approved by product owner/stakeholders
- [ ] **Requirements Traceability**: Requirements linked to implementation
- [ ] **Value Delivered**: Feature delivers expected business value

### Team-Specific Definition of Done

#### Development Team
- [ ] **Code Standards**: Follows team's coding conventions
- [ ] **Git Workflow**: Proper branching and commit message standards
- [ ] **Peer Review**: Code reviewed by senior developer
- [ ] **Knowledge Transfer**: Complex implementations explained to team
- [ ] **Technical Debt**: Technical debt documented and planned

#### QA Team
- [ ] **Test Cases**: Comprehensive test cases created and executed
- [ ] **Bug Verification**: All related bugs verified as fixed
- [ ] **Test Data**: Test data cleanup completed
- [ ] **Automation**: Test automation updated for new features
- [ ] **Test Reports**: Test execution results documented

#### DevOps Team
- [ ] **CI/CD Pipeline**: Pipeline updated for new requirements
- [ ] **Infrastructure**: Infrastructure changes deployed and tested
- [ ] **Monitoring**: Monitoring dashboards updated
- [ ] **Alerts**: Alert rules configured for new features
- [ ] **Capacity Planning**: Resource requirements assessed

### Feature-Specific Criteria

#### Web Application Features
- [ ] **Responsive Design**: Works on all target screen sizes
- [ ] **Browser Compatibility**: Tested on all supported browsers
- [ ] **SEO Optimization**: Meta tags and SEO elements implemented
- [ ] **Analytics Tracking**: User interaction tracking implemented
- [ ] **Error Pages**: Custom error pages implemented

#### API Development
- [ ] **API Documentation**: OpenAPI/Swagger documentation complete
- [ ] **Versioning**: API versioning strategy implemented
- [ ] **Rate Limiting**: Rate limiting configured
- [ ] **Authentication**: API authentication working correctly
- [ ] **Error Responses**: Consistent error response format
- [ ] **Backwards Compatibility**: Breaking changes documented

#### Database Changes
- [ ] **Migration Scripts**: Database migration scripts created
- [ ] **Data Validation**: Data integrity maintained
- [ ] **Performance Impact**: Database performance impact assessed
- [ ] **Backup Strategy**: Backup and recovery procedures updated
- [ ] **Rollback Scripts**: Rollback scripts for database changes

#### Integration Features
- [ ] **Third-party Services**: External service integration tested
- [ ] **Error Handling**: Integration failure scenarios handled
- [ ] **Timeout Configuration**: Appropriate timeouts configured
- [ ] **Circuit Breaker**: Circuit breaker pattern implemented if needed
- [ ] **Retry Logic**: Retry mechanisms implemented

### Quality Gates

#### Pre-Development
- [ ] Requirements clearly defined and understood
- [ ] Design approved by stakeholders
- [ ] Technical approach agreed upon
- [ ] Dependencies identified and available

#### Development Phase
- [ ] Daily code reviews completed
- [ ] Continuous integration passing
- [ ] Unit tests maintained above threshold
- [ ] Code quality metrics met

#### Pre-Testing
- [ ] Feature complete according to requirements
- [ ] Self-testing completed by developer
- [ ] Code merged to testing branch
- [ ] Test environment deployed successfully

#### Pre-Release
- [ ] All test phases completed successfully
- [ ] Stakeholder acceptance obtained
- [ ] Production deployment plan approved
- [ ] Go-live checklist completed

### Exception Handling

#### Emergency Fixes
For critical production issues, the following abbreviated DoD may be used:
- [ ] Fix addresses the critical issue
- [ ] Code review by senior team member
- [ ] Basic testing completed
- [ ] Rollback plan ready
- [ ] Post-deployment monitoring plan
- [ ] Full DoD to be completed post-release

#### Technical Debt Items
- [ ] Technical debt clearly documented
- [ ] Impact assessment completed
- [ ] Remediation plan created
- [ ] Timeline for resolution agreed

### Verification Checklist

#### Developer Self-Check
Before marking work as complete, developers must verify:
- [ ] All DoD items applicable to the work completed
- [ ] Code compiles without warnings
- [ ] All tests pass locally
- [ ] Documentation updated
- [ ] Ready for code review

#### Review Checklist
Reviewers must verify:
- [ ] DoD criteria met
- [ ] Code quality standards satisfied
- [ ] Tests adequate and passing
- [ ] Documentation complete
- [ ] Business requirements satisfied

### Metrics and Monitoring

#### Definition of Done Compliance
Track the following metrics:
- Percentage of items meeting full DoD on first attempt
- Average time from "code complete" to "done"
- Number of production issues from incomplete DoD
- Team adherence to DoD standards

#### Quality Indicators
- Code coverage percentage
- Number of bugs found in production
- Time to resolve DoD-related issues
- Stakeholder satisfaction with delivered features

### Tools and Automation

#### Automated DoD Checks
- [ ] **CI/CD Pipeline**: Automated build and test execution
- [ ] **Code Quality Gates**: SonarQube or similar tool integration
- [ ] **Security Scanning**: Automated vulnerability scanning
- [ ] **Performance Testing**: Automated performance regression tests
- [ ] **Documentation Generation**: Automated API documentation generation

#### DoD Tracking Tools
- **JIRA**: DoD checklist in ticket templates
- **GitHub**: Pull request templates with DoD items
- **Confluence**: DoD documentation and guidelines
- **Slack**: DoD compliance reminders and notifications

### Training and Onboarding

#### New Team Member Onboarding
- [ ] DoD training completed
- [ ] Understanding of quality standards verified
- [ ] First few work items mentored for DoD compliance
- [ ] Access to DoD tools and processes granted

#### Continuous Learning
- Regular DoD review meetings
- Sharing of DoD best practices
- Updates to DoD based on lessons learned
- Team retrospectives on DoD effectiveness

### Review and Updates

#### Regular DoD Reviews
- **Monthly**: Team review of DoD effectiveness
- **Quarterly**: DoD updates based on feedback
- **Annually**: Comprehensive DoD revision
- **Ad-hoc**: Updates for new tools or processes

#### Version Control
- DoD changes tracked in version control
- Communication of DoD updates to all team members
- Historical versions maintained for reference
- Change rationale documented

This Definition of Done ensures consistent quality standards across all deliverables and provides clear criteria for work completion. It should be customized based on team needs and project requirements while maintaining high quality standards.`,
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
        content: `Create structured test plans with coverage requirements, test cases, and execution strategies.

# Comprehensive Test Plan Template
## {{ProjectName}} - {{TestingPhase}} Testing

### Document Information
- **Test Plan ID**: {{TestPlanID}}
- **Project**: {{ProjectName}}
- **Version**: {{ProjectVersion}}
- **Test Manager**: {{TestManager}}
- **Created Date**: {{CreationDate}}
- **Last Updated**: {{LastUpdated}}
- **Review Date**: {{ReviewDate}}
- **Approval Date**: {{ApprovalDate}}
- **Status**: {{TestPlanStatus}}

### Test Plan Overview

#### Scope and Objectives
**Testing Scope**: {{TestingScope}}
**Primary Objectives**:
1. {{TestObjective1}}
2. {{TestObjective2}}
3. {{TestObjective3}}

**Out of Scope**:
- {{OutOfScope1}}
- {{OutOfScope2}}
- {{OutOfScope3}}

#### Quality Goals
- **Functionality**: Verify all functional requirements are implemented correctly
- **Performance**: Ensure system meets performance requirements under expected load
- **Security**: Validate security controls and data protection measures
- **Usability**: Confirm user interface is intuitive and accessible
- **Reliability**: Ensure system stability and error handling
- **Compatibility**: Verify cross-browser and cross-platform compatibility

### Application Under Test

#### System Overview
**Application Name**: {{ApplicationName}}
**Application Type**: {{ApplicationType}}
**Architecture**: {{SystemArchitecture}}
**Technology Stack**: {{TechnologyStack}}
**Database**: {{DatabaseType}}
**Integration Points**: {{IntegrationPoints}}

#### Features to be Tested
| Feature | Priority | Complexity | Test Approach |
|---------|----------|------------|---------------|
| {{Feature1}} | {{Priority1}} | {{Complexity1}} | {{TestApproach1}} |
| {{Feature2}} | {{Priority2}} | {{Complexity2}} | {{TestApproach2}} |
| {{Feature3}} | {{Priority3}} | {{Complexity3}} | {{TestApproach3}} |
| {{Feature4}} | {{Priority4}} | {{Complexity4}} | {{TestApproach4}} |

#### Features Not to be Tested
- {{ExcludedFeature1}}: {{ExclusionReason1}}
- {{ExcludedFeature2}}: {{ExclusionReason2}}
- {{ExcludedFeature3}}: {{ExclusionReason3}}

### Test Strategy

#### Test Levels
**Unit Testing**
- **Scope**: Individual components and functions
- **Coverage Target**: 90% code coverage
- **Tools**: {{UnitTestingTools}}
- **Responsibility**: Development team
- **Execution**: Automated in CI/CD pipeline

**Integration Testing**
- **Scope**: Component interactions and data flow
- **Coverage**: All integration points
- **Tools**: {{IntegrationTestingTools}}
- **Responsibility**: Development and QA teams
- **Execution**: Automated and manual testing

**System Testing**
- **Scope**: End-to-end system functionality
- **Coverage**: All system requirements
- **Tools**: {{SystemTestingTools}}
- **Responsibility**: QA team
- **Execution**: Manual and automated testing

**User Acceptance Testing**
- **Scope**: Business requirements validation
- **Coverage**: Critical business workflows
- **Tools**: {{UATTools}}
- **Responsibility**: Business stakeholders
- **Execution**: Manual testing with stakeholders

#### Test Types

##### Functional Testing
**Smoke Testing**
- **Purpose**: Basic functionality verification
- **Scope**: Critical path workflows
- **Execution**: After each deployment
- **Duration**: 1-2 hours

**Regression Testing**
- **Purpose**: Ensure existing functionality unchanged
- **Scope**: All previously tested features
- **Execution**: After each major change
- **Duration**: 4-8 hours

**End-to-End Testing**
- **Purpose**: Complete business workflow validation
- **Scope**: User journeys from start to finish
- **Execution**: Before each release
- **Duration**: 8-16 hours

##### Non-Functional Testing
**Performance Testing**
- **Load Testing**: Normal expected load
- **Stress Testing**: Beyond normal capacity
- **Volume Testing**: Large amounts of data
- **Scalability Testing**: System growth capacity
- **Tools**: {{PerformanceTestingTools}}

**Security Testing**
- **Authentication Testing**: Login and access controls
- **Authorization Testing**: Role-based permissions
- **Input Validation Testing**: Injection attacks prevention
- **Session Management Testing**: Session security
- **Tools**: {{SecurityTestingTools}}

**Usability Testing**
- **Navigation Testing**: User interface flow
- **Content Testing**: Information clarity
- **Accessibility Testing**: WCAG compliance
- **Cross-Browser Testing**: Browser compatibility
- **Tools**: {{UsabilityTestingTools}}

### Test Environment

#### Environment Configuration
**Test Environment 1: Development**
- **Purpose**: Developer testing and debugging
- **URL**: {{DevEnvironmentURL}}
- **Database**: {{DevDatabase}}
- **Data**: Synthetic test data
- **Access**: Development team

**Test Environment 2: QA**
- **Purpose**: Formal testing and validation
- **URL**: {{QAEnvironmentURL}}
- **Database**: {{QADatabase}}
- **Data**: Production-like data (anonymized)
- **Access**: QA team and stakeholders

**Test Environment 3: Staging**
- **Purpose**: Pre-production validation
- **URL**: {{StagingEnvironmentURL}}
- **Database**: {{StagingDatabase}}
- **Data**: Production data copy
- **Access**: Limited to release team

#### Environment Requirements
- **Hardware**: {{HardwareRequirements}}
- **Software**: {{SoftwareRequirements}}
- **Network**: {{NetworkRequirements}}
- **Security**: {{SecurityRequirements}}

#### Test Data Management
**Test Data Categories**:
- **Master Data**: {{MasterDataDescription}}
- **Transactional Data**: {{TransactionalDataDescription}}
- **Reference Data**: {{ReferenceDataDescription}}

**Data Refresh Strategy**:
- **Frequency**: {{DataRefreshFrequency}}
- **Process**: {{DataRefreshProcess}}
- **Validation**: {{DataValidationProcess}}

### Test Schedule

#### Test Phases Timeline
| Phase | Start Date | End Date | Duration | Dependencies |
|-------|------------|----------|----------|--------------|
| Test Planning | {{PlanningStartDate}} | {{PlanningEndDate}} | {{PlanningDuration}} | Requirements finalized |
| Test Design | {{DesignStartDate}} | {{DesignEndDate}} | {{DesignDuration}} | Test planning complete |
| Test Execution | {{ExecutionStartDate}} | {{ExecutionEndDate}} | {{ExecutionDuration}} | Test environment ready |
| Defect Resolution | {{DefectStartDate}} | {{DefectEndDate}} | {{DefectDuration}} | Defects identified |
| Test Closure | {{ClosureStartDate}} | {{ClosureEndDate}} | {{ClosureDuration}} | All testing complete |

#### Milestone Schedule
- **Test Plan Approval**: {{TestPlanApprovalDate}}
- **Test Case Review**: {{TestCaseReviewDate}}
- **Test Execution Start**: {{ExecutionStartDate}}
- **Performance Testing**: {{PerformanceTestingDate}}
- **Security Testing**: {{SecurityTestingDate}}
- **User Acceptance Testing**: {{UATDate}}
- **Go-Live Decision**: {{GoLiveDecisionDate}}

### Test Cases

#### Test Case Design Standards
**Test Case ID Format**: {{TestCaseIDFormat}}
**Test Case Structure**:
- Test Case ID
- Test Case Title
- Test Objective
- Test Priority
- Preconditions
- Test Steps
- Expected Results
- Actual Results
- Pass/Fail Status
- Defect Links

#### Test Case Categories

##### Functional Test Cases
**Category: User Management**
| Test Case ID | Title | Priority | Status |
|-------------|-------|----------|---------|
| {{TC_ID_001}} | {{TC_Title_001}} | {{Priority_001}} | {{Status_001}} |
| {{TC_ID_002}} | {{TC_Title_002}} | {{Priority_002}} | {{Status_002}} |
| {{TC_ID_003}} | {{TC_Title_003}} | {{Priority_003}} | {{Status_003}} |

**Category: Data Management**
| Test Case ID | Title | Priority | Status |
|-------------|-------|----------|---------|
| {{TC_ID_101}} | {{TC_Title_101}} | {{Priority_101}} | {{Status_101}} |
| {{TC_ID_102}} | {{TC_Title_102}} | {{Priority_102}} | {{Status_102}} |
| {{TC_ID_103}} | {{TC_Title_103}} | {{Priority_103}} | {{Status_103}} |

#### Sample Test Case
**Test Case ID**: TC_LOGIN_001
**Title**: Verify successful user login with valid credentials
**Objective**: Ensure users can log in with correct username and password
**Priority**: High
**Category**: Authentication

**Preconditions**:
- User account exists in system
- User has valid credentials
- Login page is accessible

**Test Steps**:
1. Navigate to login page
2. Enter valid username: "{{ValidUsername}}"
3. Enter valid password: "{{ValidPassword}}"
4. Click "Login" button
5. Verify successful login

**Expected Results**:
- User is redirected to dashboard
- Welcome message displays user name
- Navigation menu is visible
- Session is established

**Test Data**:
- Username: {{TestUsername}}
- Password: {{TestPassword}}

### Test Coverage

#### Requirements Traceability
| Requirement ID | Description | Test Cases | Coverage Status |
|---------------|-------------|------------|-----------------|
| {{REQ_001}} | {{ReqDescription_001}} | {{TestCases_001}} | {{Coverage_001}} |
| {{REQ_002}} | {{ReqDescription_002}} | {{TestCases_002}} | {{Coverage_002}} |
| {{REQ_003}} | {{ReqDescription_003}} | {{TestCases_003}} | {{Coverage_003}} |

#### Code Coverage Targets
- **Unit Tests**: 90% line coverage, 85% branch coverage
- **Integration Tests**: 80% integration point coverage
- **System Tests**: 100% critical path coverage
- **User Acceptance Tests**: 100% business requirement coverage

#### Test Coverage Metrics
**Functional Coverage**:
- Requirements covered: {{RequirementsCovered}} / {{TotalRequirements}}
- Features tested: {{FeaturesTested}} / {{TotalFeatures}}
- User stories validated: {{StoriesValidated}} / {{TotalStories}}

**Technical Coverage**:
- Code coverage: {{CodeCoverage}}%
- API endpoints tested: {{APIsCovered}} / {{TotalAPIs}}
- Database operations tested: {{DBOperationsTested}} / {{TotalDBOperations}}

### Defect Management

#### Defect Classification
**Severity Levels**:
- **Critical**: System crash, data corruption, security breach
- **High**: Major functionality broken, no workaround
- **Medium**: Functionality broken, workaround available  
- **Low**: Minor issue, cosmetic problems

**Priority Levels**:
- **P1**: Fix immediately, blocks testing
- **P2**: Fix before release
- **P3**: Fix in next release
- **P4**: Fix when resources available

#### Defect Workflow
1. **Discovery**: Defect identified during testing
2. **Logging**: Defect logged in tracking system
3. **Triage**: Severity and priority assigned
4. **Assignment**: Defect assigned to developer
5. **Resolution**: Developer fixes defect
6. **Verification**: QA verifies fix
7. **Closure**: Defect closed if verified

#### Defect Metrics
**Target Metrics**:
- **Defect Leakage**: < 5% defects found in production
- **Defect Removal Efficiency**: > 95%
- **Critical Defects**: 0 critical defects in production
- **Defect Resolution Time**: < 2 days for critical, < 5 days for high

### Test Execution

#### Test Execution Process
1. **Environment Preparation**: Set up test environment and data
2. **Test Case Execution**: Execute test cases according to schedule
3. **Result Recording**: Document actual results and pass/fail status
4. **Defect Reporting**: Log defects for failed test cases
5. **Progress Tracking**: Update test execution progress
6. **Status Reporting**: Provide regular status updates

#### Test Execution Schedule
**Week 1: Smoke Testing**
- Execute critical path test cases
- Verify basic functionality
- Validate environment stability

**Week 2-3: Functional Testing**
- Execute all functional test cases
- Perform integration testing
- Conduct API testing

**Week 4: Non-Functional Testing**
- Performance testing
- Security testing
- Usability testing

**Week 5: User Acceptance Testing**
- Business stakeholder testing
- End-user workflow validation
- Sign-off activities

### Risk Assessment

#### Test Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| {{TestRisk1}} | {{Impact1}} | {{Probability1}} | {{Mitigation1}} |
| {{TestRisk2}} | {{Impact2}} | {{Probability2}} | {{Mitigation2}} |
| {{TestRisk3}} | {{Impact3}} | {{Probability3}} | {{Mitigation3}} |

#### Contingency Plans
**Risk**: Test environment unavailable
**Contingency**: Use backup environment or extend timeline

**Risk**: Key personnel unavailable
**Contingency**: Cross-train team members, use external resources

**Risk**: Major defects discovered late
**Contingency**: Implement phased release approach

### Entry and Exit Criteria

#### Test Phase Entry Criteria
- [ ] Requirements baseline established
- [ ] Test environment configured and validated
- [ ] Test data prepared and loaded
- [ ] Test team trained and ready
- [ ] Code deployment completed
- [ ] Smoke test passed

#### Test Phase Exit Criteria
- [ ] All planned test cases executed
- [ ] {{ExitCriteriaPercentage}}% of test cases passed
- [ ] No critical or high priority defects open
- [ ] Performance benchmarks met
- [ ] Security requirements validated
- [ ] User acceptance testing completed
- [ ] Test closure report approved

### Deliverables

#### Test Deliverables
- **Test Plan Document**: This document
- **Test Case Repository**: Detailed test cases
- **Test Execution Reports**: Daily/weekly progress reports
- **Defect Reports**: Defect tracking and resolution status
- **Test Coverage Report**: Requirements and code coverage analysis
- **Performance Test Report**: Load and performance testing results
- **Security Test Report**: Security testing findings
- **User Acceptance Test Report**: Business stakeholder sign-off
- **Test Closure Report**: Final summary and recommendations

### Team and Responsibilities

#### Test Team Structure
| Role | Name | Responsibilities |
|------|------|-----------------|
| Test Manager | {{TestManagerName}} | Overall test planning and coordination |
| Senior QA Analyst | {{SeniorQAName}} | Test design and execution oversight |
| QA Analyst | {{QAAnalystName}} | Test case execution and defect reporting |
| Performance Tester | {{PerformanceTesterName}} | Performance and load testing |
| Security Tester | {{SecurityTesterName}} | Security testing and vulnerability assessment |
| Automation Engineer | {{AutomationEngineerName}} | Test automation framework and scripts |

#### RACI Matrix
| Activity | Test Manager | Senior QA | QA Analyst | Dev Team | Business |
|----------|-------------|-----------|------------|----------|----------|
| Test Planning | R | A | C | C | I |
| Test Design | A | R | R | C | C |
| Test Execution | A | R | R | C | I |
| Defect Management | A | R | R | R | I |
| User Acceptance | I | A | C | C | R |

### Approval and Sign-off

#### Review and Approval
| Role | Name | Review Date | Approval Date | Signature |
|------|------|-------------|---------------|-----------|
| Test Manager | {{TestManagerName}} | {{ReviewDate1}} | {{ApprovalDate1}} | |
| Project Manager | {{ProjectManagerName}} | {{ReviewDate2}} | {{ApprovalDate2}} | |
| Development Lead | {{DevLeadName}} | {{ReviewDate3}} | {{ApprovalDate3}} | |
| Business Analyst | {{BAName}} | {{ReviewDate4}} | {{ApprovalDate4}} | |

This comprehensive test plan ensures thorough testing coverage and quality assurance for the project deliverables.`,
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
        content: `Define bug reporting standards with reproduction steps, environment details, and severity classification.

# Bug Report Template
## Structured Issue Reporting and Tracking

### Bug Report Information
- **Bug ID**: {{BugID}}
- **Reporter**: {{ReporterName}}
- **Date Reported**: {{ReportDate}}
- **Assigned To**: {{AssignedDeveloper}}
- **Priority**: {{BugPriority}}
- **Severity**: {{BugSeverity}}
- **Status**: {{BugStatus}}
- **Component**: {{AffectedComponent}}
- **Version**: {{AffectedVersion}}

### Summary
**Bug Title**: {{BugTitle}}
**Brief Description**: {{BugSummary}}

### Environment Information

#### System Environment
- **Operating System**: {{OperatingSystem}}
- **Browser**: {{BrowserName}} {{BrowserVersion}}
- **Screen Resolution**: {{ScreenResolution}}
- **Device**: {{DeviceType}} ({{DeviceModel}})
- **Network**: {{NetworkType}} ({{NetworkSpeed}})

#### Application Environment
- **Environment**: {{Environment}} (Development/Staging/Production)
- **Application Version**: {{ApplicationVersion}}
- **Build Number**: {{BuildNumber}}
- **Database Version**: {{DatabaseVersion}}
- **API Version**: {{APIVersion}}

#### User Context
- **User Type**: {{UserType}} (Admin/Regular User/Guest)
- **User Role**: {{UserRole}}
- **Permissions**: {{UserPermissions}}
- **User ID**: {{UserID}} (if applicable)
- **Session Duration**: {{SessionDuration}}

### Detailed Description

#### What Happened?
{{DetailedDescription}}

#### What Was Expected?
{{ExpectedBehavior}}

#### What Actually Occurred?
{{ActualBehavior}}

#### Impact Assessment
- **User Impact**: {{UserImpact}}
- **Business Impact**: {{BusinessImpact}}
- **Frequency**: {{BugFrequency}}
- **Affected Users**: {{AffectedUserCount}}

### Reproduction Steps

#### Prerequisites
{{Prerequisites}}

#### Step-by-Step Instructions
1. {{Step1}}
2. {{Step2}}
3. {{Step3}}
4. {{Step4}}
5. {{Step5}}

#### Expected Result at Each Step
1. **Step 1**: {{ExpectedResult1}}
2. **Step 2**: {{ExpectedResult2}}
3. **Step 3**: {{ExpectedResult3}}
4. **Step 4**: {{ExpectedResult4}}
5. **Step 5**: {{ExpectedResult5}}

#### Actual Result at Each Step
1. **Step 1**: {{ActualResult1}}
2. **Step 2**: {{ActualResult2}}
3. **Step 3**: {{ActualResult3}}
4. **Step 4**: {{ActualResult4}}
5. **Step 5**: {{ActualResult5}}

### Reproducibility
- **Consistency**: {{Consistency}} (Always/Sometimes/Rarely)
- **Attempts**: {{ReproductionAttempts}} out of {{TotalAttempts}} attempts
- **Conditions**: {{SpecificConditions}}
- **Time Pattern**: {{TimePattern}} (Morning/Evening/Random)
- **Data Dependency**: {{DataDependency}}

### Screenshots and Media

#### Screenshots
- **Screenshot 1**: {{Screenshot1Description}}
  - File: {{Screenshot1File}}
  - Annotations: {{Screenshot1Annotations}}

- **Screenshot 2**: {{Screenshot2Description}}
  - File: {{Screenshot2File}}
  - Annotations: {{Screenshot2Annotations}}

#### Video Recording
- **Video**: {{VideoDescription}}
  - File: {{VideoFile}}
  - Duration: {{VideoDuration}}
  - Key Timestamps: {{VideoTimestamps}}

#### Log Files
- **Application Logs**: {{ApplicationLogFile}}
- **Error Logs**: {{ErrorLogFile}}
- **Network Logs**: {{NetworkLogFile}}
- **Browser Console**: {{BrowserConsoleOutput}}

### Error Details

#### Error Messages
\`\`\`
{{ErrorMessage1}}
\`\`\`

\`\`\`
{{ErrorMessage2}}
\`\`\`

#### Stack Trace
\`\`\`
{{StackTrace}}
\`\`\`

#### Network Requests
**Failed Request**:
- **URL**: {{FailedRequestURL}}
- **Method**: {{RequestMethod}}
- **Status Code**: {{StatusCode}}
- **Response**: {{ErrorResponse}}

**Request Headers**:
\`\`\`
{{RequestHeaders}}
\`\`\`

**Response Headers**:
\`\`\`
{{ResponseHeaders}}
\`\`\`

#### Database Errors
- **Query**: {{FailedQuery}}
- **Error**: {{DatabaseError}}
- **Connection**: {{DatabaseConnection}}

### Test Data

#### Sample Data Used
\`\`\`json
{
  "{{DataField1}}": "{{DataValue1}}",
  "{{DataField2}}": "{{DataValue2}}",
  "{{DataField3}}": {{DataValue3}},
  "{{DataField4}}": [
    "{{ArrayValue1}}",
    "{{ArrayValue2}}"
  ]
}
\`\`\`

#### Input Values
- **Valid Input**: {{ValidInputExample}}
- **Invalid Input**: {{InvalidInputExample}}
- **Edge Case Input**: {{EdgeCaseInputExample}}
- **Boundary Values**: {{BoundaryValues}}

### Workaround

#### Temporary Solution
{{TemporarySolution}}

#### Steps for Workaround
1. {{WorkaroundStep1}}
2. {{WorkaroundStep2}}
3. {{WorkaroundStep3}}

#### Workaround Limitations
- {{WorkaroundLimitation1}}
- {{WorkaroundLimitation2}}
- {{WorkaroundLimitation3}}

### Related Information

#### Related Bugs
- **Similar Issues**: {{RelatedBugIDs}}
- **Duplicate Reports**: {{DuplicateBugIDs}}
- **Parent Issue**: {{ParentIssueID}}
- **Child Issues**: {{ChildIssueIDs}}

#### Recent Changes
- **Code Changes**: {{RecentCodeChanges}}
- **Configuration Changes**: {{ConfigurationChanges}}
- **Infrastructure Changes**: {{InfrastructureChanges}}
- **Data Changes**: {{DataChanges}}

#### Additional Context
- **Feature Flags**: {{FeatureFlags}}
- **A/B Tests**: {{ABTests}}
- **Third-party Services**: {{ThirdPartyServices}}
- **External Dependencies**: {{ExternalDependencies}}

### Priority and Severity Classification

#### Severity Levels
**Critical (S1)**:
- System crash or data corruption
- Security vulnerability
- Complete feature failure
- Affects all users

**High (S2)**:
- Major functionality broken
- No reasonable workaround
- Affects significant user base
- Performance degradation

**Medium (S3)**:
- Feature partially working
- Workaround available
- Affects some users
- Minor performance impact

**Low (S4)**:
- Cosmetic issues
- Documentation errors
- Enhancement requests
- Minimal user impact

#### Priority Levels
**P1 (Urgent)**:
- Fix immediately
- Blocks critical functionality
- Security issue

**P2 (High)**:
- Fix in current sprint
- Important feature broken
- Many users affected

**P3 (Medium)**:
- Fix in next release
- Standard priority
- Some users affected

**P4 (Low)**:
- Fix when time permits
- Nice to have
- Few users affected

### Investigation Notes

#### Initial Analysis
{{InitialAnalysis}}

#### Root Cause Hypothesis
{{RootCauseHypothesis}}

#### Investigation Steps Taken
1. {{InvestigationStep1}}
2. {{InvestigationStep2}}
3. {{InvestigationStep3}}

#### Findings
{{InvestigationFindings}}

### Resolution

#### Root Cause
{{RootCause}}

#### Solution Implemented
{{SolutionDescription}}

#### Code Changes
\`\`\`{{CodeLanguage}}
{{CodeChanges}}
\`\`\`

#### Configuration Changes
{{ConfigurationFixes}}

#### Test Cases Added
{{TestCasesAdded}}

#### Prevention Measures
{{PreventionMeasures}}

### Testing and Verification

#### Test Plan
1. {{TestStep1}}
2. {{TestStep2}}
3. {{TestStep3}}

#### Verification Results
- **Manual Testing**: {{ManualTestResults}}
- **Automated Testing**: {{AutomatedTestResults}}
- **Regression Testing**: {{RegressionTestResults}}
- **Performance Testing**: {{PerformanceTestResults}}

#### Sign-off
- **Developer**: {{DeveloperSignoff}}
- **QA Engineer**: {{QASignoff}}
- **Product Owner**: {{ProductOwnerSignoff}}

### Communication

#### Stakeholder Notification
- **Users Notified**: {{UsersNotified}}
- **Communication Method**: {{CommunicationMethod}}
- **Notification Date**: {{NotificationDate}}
- **Follow-up Required**: {{FollowupRequired}}

#### Release Notes
{{ReleaseNotesEntry}}

### Metrics and Tracking

#### Time Tracking
- **Time to Reproduce**: {{TimeToReproduce}}
- **Investigation Time**: {{InvestigationTime}}
- **Development Time**: {{DevelopmentTime}}
- **Testing Time**: {{TestingTime}}
- **Total Resolution Time**: {{TotalResolutionTime}}

#### Quality Metrics
- **Defect Escape Rate**: {{DefectEscapeRate}}
- **Reopen Count**: {{ReopenCount}}
- **Customer Impact Score**: {{CustomerImpactScore}}
- **Fix Quality Score**: {{FixQualityScore}}

### Lessons Learned

#### What Went Well
- {{PositiveLearning1}}
- {{PositiveLearning2}}
- {{PositiveLearning3}}

#### Areas for Improvement
- {{ImprovementArea1}}
- {{ImprovementArea2}}
- {{ImprovementArea3}}

#### Process Improvements
- {{ProcessImprovement1}}
- {{ProcessImprovement2}}
- {{ProcessImprovement3}}

### Checklist

#### Reporter Checklist
- [ ] Clear and descriptive title
- [ ] Detailed reproduction steps
- [ ] Environment information provided
- [ ] Screenshots/videos attached
- [ ] Expected vs actual behavior described
- [ ] Severity and priority assessed
- [ ] Workaround identified (if any)

#### Developer Checklist
- [ ] Bug reproduced successfully
- [ ] Root cause identified
- [ ] Solution implemented and tested
- [ ] Code review completed
- [ ] Automated tests added
- [ ] Documentation updated
- [ ] Release notes updated

#### QA Checklist
- [ ] Fix verified in test environment
- [ ] Regression testing completed
- [ ] Edge cases tested
- [ ] User acceptance criteria met
- [ ] Sign-off provided
- [ ] Bug marked as resolved

This comprehensive bug report template ensures all necessary information is captured for effective bug tracking, investigation, and resolution.`,
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
        content: `Create clear acceptance criteria using Given-When-Then format for behavior-driven development.

# Acceptance Criteria Template
## Behavior-Driven Development Standards

### Overview
This template defines the standard format for writing acceptance criteria using the Given-When-Then (Gherkin) syntax to ensure clear, testable, and comprehensive requirements definition.

### User Story Context
**Epic**: {{EpicTitle}}
**User Story**: {{UserStoryTitle}}
**Story ID**: {{StoryID}}
**Priority**: {{StoryPriority}}
**Story Points**: {{StoryPoints}}

**User Story Statement**:
As a {{UserRole}}
I want {{DesiredCapability}}
So that {{BusinessValue}}

### Acceptance Criteria Format

#### Standard Given-When-Then Format
\`\`\`gherkin
Given {{PreconditionState}}
  And {{AdditionalPrecondition}}
When {{UserAction}}
  And {{AdditionalAction}}
Then {{ExpectedOutcome}}
  And {{AdditionalOutcome}}
\`\`\`

### Primary Acceptance Criteria

#### Scenario 1: {{ScenarioTitle1}}
**Description**: {{ScenarioDescription1}}
**Priority**: {{ScenarioPriority1}}

\`\`\`gherkin
Given {{PreconditionState1}}
  And {{PreconditionState2}}
When {{UserAction1}}
  And {{UserAction2}}
Then {{ExpectedResult1}}
  And {{ExpectedResult2}}
  And {{ExpectedResult3}}
\`\`\`

**Business Rules**:
- {{BusinessRule1}}
- {{BusinessRule2}}
- {{BusinessRule3}}

**UI/UX Requirements**:
- {{UIRequirement1}}
- {{UIRequirement2}}
- {{UIRequirement3}}

#### Scenario 2: {{ScenarioTitle2}}
**Description**: {{ScenarioDescription2}}
**Priority**: {{ScenarioPriority2}}

\`\`\`gherkin
Given {{PreconditionState1}}
  And {{PreconditionState2}}
When {{UserAction1}}
Then {{ExpectedResult1}}
  And {{ExpectedResult2}}
\`\`\`

**Validation Rules**:
- {{ValidationRule1}}
- {{ValidationRule2}}
- {{ValidationRule3}}

#### Scenario 3: {{ScenarioTitle3}}
**Description**: {{ScenarioDescription3}}
**Priority**: {{ScenarioPriority3}}

\`\`\`gherkin
Given {{PreconditionState1}}
When {{UserAction1}}
  And {{UserAction2}}
Then {{ExpectedResult1}}
  And {{ExpectedResult2}}
\`\`\`

### Edge Cases and Error Scenarios

#### Error Scenario 1: {{ErrorScenarioTitle1}}
\`\`\`gherkin
Given {{ErrorPrecondition1}}
When {{ErrorAction1}}
Then {{ErrorResult1}}
  And {{ErrorMessage1}} is displayed
  And {{ErrorHandling1}} occurs
\`\`\`

#### Error Scenario 2: {{ErrorScenarioTitle2}}
\`\`\`gherkin
Given {{ErrorPrecondition2}}
When {{ErrorAction2}}
Then {{ErrorResult2}}
  And {{ErrorMessage2}} is displayed
  And {{SystemBehavior2}} is maintained
\`\`\`

#### Boundary Conditions
\`\`\`gherkin
Given {{BoundaryCondition1}}
When {{BoundaryAction1}}
Then {{BoundaryResult1}}

Given {{BoundaryCondition2}}
When {{BoundaryAction2}}
Then {{BoundaryResult2}}
\`\`\`

### Data Requirements

#### Valid Data Scenarios
\`\`\`gherkin
Given {{DataSetup1}}
  And {{DataSetup2}}
When {{DataAction1}}
Then {{DataResult1}}
  And {{DataValidation1}}
\`\`\`

#### Invalid Data Scenarios
\`\`\`gherkin
Given {{InvalidDataSetup1}}
When {{InvalidDataAction1}}
Then {{InvalidDataResult1}}
  And {{ValidationError1}} is shown
\`\`\`

#### Data Examples Table
| {{Field1}} | {{Field2}} | {{Field3}} | Expected Result |
|------------|------------|------------|-----------------|
| {{Value1a}} | {{Value2a}} | {{Value3a}} | {{Result1}} |
| {{Value1b}} | {{Value2b}} | {{Value3b}} | {{Result2}} |
| {{Value1c}} | {{Value2c}} | {{Value3c}} | {{Result3}} |

### Performance Criteria

#### Performance Scenario 1
\`\`\`gherkin
Given {{PerformanceCondition1}}
When {{PerformanceAction1}}
Then {{PerformanceResult1}}
  And the response time is less than {{ResponseTime1}} seconds
  And the system handles {{ConcurrentUsers1}} concurrent users
\`\`\`

#### Performance Scenario 2
\`\`\`gherkin
Given {{PerformanceCondition2}}
  And {{LoadCondition2}}
When {{PerformanceAction2}}
Then {{PerformanceResult2}}
  And the page loads within {{PageLoadTime2}} seconds
  And memory usage remains below {{MemoryLimit2}}
\`\`\`

### Security Criteria

#### Authentication Scenario
\`\`\`gherkin
Given {{AuthenticationCondition}}
When {{AuthenticationAction}}
Then {{AuthenticationResult}}
  And {{SecurityBehavior1}}
  And {{SecurityBehavior2}}
\`\`\`

#### Authorization Scenario
\`\`\`gherkin
Given {{AuthorizationCondition}}
When {{UnauthorizedAction}}
Then {{AuthorizationResult}}
  And {{SecurityMessage}} is displayed
  And {{LoggingBehavior}} occurs
\`\`\`

### Accessibility Criteria

#### Screen Reader Support
\`\`\`gherkin
Given {{AccessibilityCondition1}}
When {{ScreenReaderAction}}
Then {{AccessibilityResult1}}
  And {{ScreenReaderFeedback}}
\`\`\`

#### Keyboard Navigation
\`\`\`gherkin
Given {{KeyboardCondition}}
When {{KeyboardNavigation}}
Then {{KeyboardResult}}
  And {{FocusManagement}}
\`\`\`

#### Color Contrast
\`\`\`gherkin
Given {{ColorCondition}}
When {{ColorValidation}}
Then {{ColorResult}}
  And {{ContrastRatio}} meets WCAG standards
\`\`\`

### Cross-Platform Criteria

#### Browser Compatibility
\`\`\`gherkin
Given {{BrowserCondition}}
  And I am using {{BrowserName}} {{BrowserVersion}}
When {{BrowserAction}}
Then {{BrowserResult}}
  And {{CrossBrowserBehavior}}
\`\`\`

#### Mobile Responsiveness
\`\`\`gherkin
Given {{MobileCondition}}
  And I am using {{DeviceType}} with {{ScreenSize}}
When {{MobileAction}}
Then {{MobileResult}}
  And {{ResponsiveDesign}}
\`\`\`

### Integration Criteria

#### API Integration
\`\`\`gherkin
Given {{APICondition}}
When {{APICall}}
Then {{APIResult}}
  And {{IntegrationBehavior1}}
  And {{IntegrationBehavior2}}
\`\`\`

#### Database Integration
\`\`\`gherkin
Given {{DatabaseCondition}}
When {{DatabaseAction}}
Then {{DatabaseResult}}
  And {{DataPersistence}}
  And {{DataIntegrity}}
\`\`\`

### Non-Functional Requirements

#### Usability Criteria
\`\`\`gherkin
Given {{UsabilityCondition}}
When {{UsabilityAction}}
Then {{UsabilityResult}}
  And {{UserExperience1}}
  And {{UserExperience2}}
\`\`\`

#### Maintainability Criteria
- Code coverage must be ≥ {{CoverageThreshold}}%
- Code complexity must be ≤ {{ComplexityThreshold}}
- Documentation must be updated
- Logging must capture {{LoggingRequirements}}

#### Scalability Criteria
\`\`\`gherkin
Given {{ScalabilityCondition}}
When {{ScalabilityLoad}}
Then {{ScalabilityResult}}
  And the system scales to {{ScaleTarget}}
\`\`\`

### Definition of Done Integration

#### Technical Requirements
- [ ] All acceptance criteria scenarios pass
- [ ] Code review completed
- [ ] Unit tests cover all scenarios
- [ ] Integration tests validate end-to-end flows
- [ ] Performance criteria met
- [ ] Security criteria validated
- [ ] Accessibility criteria verified

#### Quality Requirements
- [ ] No critical or high severity bugs
- [ ] User experience validated
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Documentation updated

### Testing Guidelines

#### Manual Testing Scenarios
Each Given-When-Then scenario should be:
- Manually executable by QA team
- Clear and unambiguous
- Independent of other scenarios
- Focused on user behavior
- Verifiable with expected outcomes

#### Automated Testing Integration
\`\`\`gherkin
# Example Cucumber/SpecFlow test
Feature: {{FeatureName}}
  As a {{UserRole}}
  I want {{DesiredCapability}}
  So that {{BusinessValue}}

  Scenario: {{ScenarioTitle1}}
    Given {{PreconditionState1}}
      And {{PreconditionState2}}
    When {{UserAction1}}
      And {{UserAction2}}
    Then {{ExpectedResult1}}
      And {{ExpectedResult2}}
\`\`\`

#### Test Data Management
- **Test Data Setup**: {{TestDataSetup}}
- **Data Cleanup**: {{DataCleanup}}
- **Data Privacy**: {{DataPrivacy}}
- **Data Consistency**: {{DataConsistency}}

### Stakeholder Review

#### Business Stakeholder Approval
- [ ] Product Owner reviewed acceptance criteria
- [ ] Business rules validated
- [ ] User experience approved
- [ ] Edge cases considered

#### Technical Review
- [ ] Technical feasibility confirmed
- [ ] Integration points identified
- [ ] Performance implications assessed
- [ ] Security considerations reviewed

#### QA Review
- [ ] Testability validated
- [ ] Test scenarios complete
- [ ] Automation possibilities identified
- [ ] Edge cases covered

### Common Anti-Patterns to Avoid

#### Vague Criteria
❌ **Poor Example**:
\`\`\`
Given I am on the page
When I do something
Then it should work
\`\`\`

✅ **Good Example**:
\`\`\`gherkin
Given I am on the user registration page
  And all required fields are empty
When I click the "Register" button
Then I see validation messages for all required fields
  And the form is not submitted
  And I remain on the registration page
\`\`\`

#### Implementation Details
❌ **Avoid**: Technical implementation details
✅ **Focus**: User behavior and business outcomes

#### Missing Edge Cases
❌ **Incomplete**: Only happy path scenarios
✅ **Complete**: Include error, boundary, and edge cases

### Traceability Matrix

| Acceptance Criteria | Test Case ID | Status | Automation |
|-------------------|--------------|---------|------------|
| {{AC1}} | {{TC1}} | {{Status1}} | {{Automation1}} |
| {{AC2}} | {{TC2}} | {{Status2}} | {{Automation2}} |
| {{AC3}} | {{TC3}} | {{Status3}} | {{Automation3}} |

### Review and Approval

#### Review Checklist
- [ ] All scenarios follow Given-When-Then format
- [ ] Criteria are testable and measurable
- [ ] Edge cases and error scenarios included
- [ ] Performance and security criteria defined
- [ ] Non-functional requirements specified
- [ ] Stakeholder approval obtained

#### Sign-off
- **Product Owner**: {{ProductOwnerSignoff}}
- **Tech Lead**: {{TechLeadSignoff}}
- **QA Lead**: {{QALeadSignoff}}
- **UX Designer**: {{UXDesignerSignoff}}

This comprehensive acceptance criteria template ensures clear, testable, and complete requirements definition using behavior-driven development principles.`,
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
        content: `Structure release notes with feature highlights, bug fixes, breaking changes, and migration guides.

# Release Notes Template
## {{ProductName}} Version {{ReleaseVersion}}

### Release Information
- **Release Version**: {{ReleaseVersion}}
- **Release Date**: {{ReleaseDate}}
- **Release Type**: {{ReleaseType}}
- **Build Number**: {{BuildNumber}}
- **Release Manager**: {{ReleaseManager}}
- **Development Team**: {{DevelopmentTeam}}

### Executive Summary
{{ExecutiveSummary}}

This release includes {{FeatureCount}} new features, {{EnhancementCount}} enhancements, and {{BugFixCount}} bug fixes. The release focuses on {{ReleaseFocus}} while maintaining backward compatibility with previous versions.

**Key Highlights**:
- {{KeyHighlight1}}
- {{KeyHighlight2}}
- {{KeyHighlight3}}

### What's New

#### New Features

##### Feature 1: {{NewFeature1}}
**Description**: {{NewFeature1Description}}
**Benefit**: {{NewFeature1Benefit}}
**Availability**: {{NewFeature1Availability}}

**How to Use**:
1. {{Usage1Step1}}
2. {{Usage1Step2}}
3. {{Usage1Step3}}

##### Feature 2: {{NewFeature2}}
**Description**: {{NewFeature2Description}}
**Benefit**: {{NewFeature2Benefit}}
**Availability**: {{NewFeature2Availability}}

**Configuration Requirements**:
\`\`\`json
{
  "{{ConfigKey1}}": "{{ConfigValue1}}",
  "{{ConfigKey2}}": "{{ConfigValue2}}",
  "{{ConfigKey3}}": {{ConfigValue3}}
}
\`\`\`

### Enhancements

#### Performance Improvements
- **{{PerformanceImprovement1}}**: {{PerformanceDescription1}}
  - Performance Gain: {{PerformanceGain1}}
  - Impact: {{PerformanceImpact1}}
  
- **{{PerformanceImprovement2}}**: {{PerformanceDescription2}}
  - Performance Gain: {{PerformanceGain2}}
  - Impact: {{PerformanceImpact2}}

#### Security Enhancements
- **{{SecurityEnhancement1}}**: {{SecurityDescription1}}
  - Security Level: {{SecurityLevel1}}
  - Compliance: {{ComplianceImpact1}}

### Bug Fixes

#### Critical Bug Fixes
| Bug ID | Description | Impact | Resolution |
|--------|-------------|---------|------------|
| {{BugID1}} | {{BugDescription1}} | {{BugImpact1}} | {{BugResolution1}} |
| {{BugID2}} | {{BugDescription2}} | {{BugImpact2}} | {{BugResolution2}} |
| {{BugID3}} | {{BugDescription3}} | {{BugImpact3}} | {{BugResolution3}} |

### Breaking Changes

#### API Changes
**Deprecated APIs** (will be removed in {{DeprecationVersion}}):
- \`{{DeprecatedAPI1}}\`: Use \`{{ReplacementAPI1}}\` instead
- \`{{DeprecatedAPI2}}\`: Use \`{{ReplacementAPI2}}\` instead

**Modified APIs**:
- \`{{ModifiedAPI1}}\`: {{APIChangeDescription1}}
  - **Before**: \`{{APIBefore1}}\`
  - **After**: \`{{APIAfter1}}\`
  - **Migration**: {{MigrationSteps1}}

### Installation and Upgrade

#### New Installation
**Step 1: Download and Extract**
\`\`\`bash
# Download the release
wget {{DownloadURL}}

# Extract the files
tar -xzf {{ReleasePackage}}
cd {{InstallationDirectory}}
\`\`\`

**Step 2: Configuration**
\`\`\`bash
# Copy configuration template
cp config/{{ConfigTemplate}} config/{{ConfigFile}}

# Edit configuration file
nano config/{{ConfigFile}}
\`\`\`

#### Upgrade from Previous Version
**Preparation**:
1. **Backup Current Installation**
   \`\`\`bash
   ./scripts/backup.sh
   \`\`\`

2. **Stop Services**
   \`\`\`bash
   ./scripts/stop.sh
   \`\`\`

**Upgrade Process**:
1. **Extract New Version**
   \`\`\`bash
   tar -xzf {{ReleasePackage}} --strip-components=1 -C {{InstallationDirectory}}
   \`\`\`

2. **Run Database Migrations**
   \`\`\`bash
   ./scripts/migrate-database.sh
   \`\`\`

3. **Start Services**
   \`\`\`bash
   ./scripts/start.sh
   \`\`\`

### Known Issues

#### Open Issues
| Issue ID | Description | Severity | Workaround | Target Fix |
|----------|-------------|----------|------------|-------------|
| {{IssueID1}} | {{IssueDescription1}} | {{IssueSeverity1}} | {{Workaround1}} | {{TargetFix1}} |
| {{IssueID2}} | {{IssueDescription2}} | {{IssueSeverity2}} | {{Workaround2}} | {{TargetFix2}} |

#### Browser Compatibility
| Browser | Version | Support Level | Known Issues |
|---------|---------|---------------|--------------|
| Chrome | {{ChromeVersion}}+ | Full Support | None |
| Firefox | {{FirefoxVersion}}+ | Full Support | {{FirefoxIssues}} |
| Safari | {{SafariVersion}}+ | Full Support | {{SafariIssues}} |
| Edge | {{EdgeVersion}}+ | Full Support | None |

### System Requirements

#### Minimum Requirements
- **Operating System**: {{MinimumOS}}
- **Memory**: {{MinimumRAM}} GB RAM
- **Storage**: {{MinimumStorage}} GB free space
- **Processor**: {{MinimumProcessor}}
- **Network**: {{MinimumNetwork}}

#### Dependencies
| Dependency | Minimum Version | Recommended Version | Notes |
|------------|-----------------|---------------------|-------|
| {{Dependency1}} | {{MinVersion1}} | {{RecVersion1}} | {{Notes1}} |
| {{Dependency2}} | {{MinVersion2}} | {{RecVersion2}} | {{Notes2}} |

### Support and Documentation

#### Documentation Updates
- **User Guide**: Updated with new features and workflows
- **API Documentation**: Complete API reference with examples
- **Administrator Guide**: Installation and configuration guide

#### Support Information
- **Support Portal**: {{SupportPortalURL}}
- **Documentation**: {{DocumentationURL}}
- **Community Forum**: {{CommunityForumURL}}
- **Bug Reporting**: {{BugReportingURL}}

### Contributors

#### Development Team
- {{Developer1}}: {{Developer1Contribution}}
- {{Developer2}}: {{Developer2Contribution}}
- {{Developer3}}: {{Developer3Contribution}}

#### Quality Assurance Team
- {{QAEngineer1}}: {{QAEngineer1Contribution}}
- {{QAEngineer2}}: {{QAEngineer2Contribution}}

### Legal and Compliance

#### License Information
This software is released under {{LicenseType}}. See LICENSE file for details.

#### Third-Party Components
| Component | Version | License | Changes |
|-----------|---------|---------|---------|
| {{Component1}} | {{ComponentVersion1}} | {{ComponentLicense1}} | {{ComponentChanges1}} |
| {{Component2}} | {{ComponentVersion2}} | {{ComponentLicense2}} | {{ComponentChanges2}} |

---

**Note**: For technical support or questions about this release, please contact our support team at {{SupportEmail}} or visit {{SupportURL}}.

**Release Team**: {{ReleaseTeam}}
**Release Date**: {{ReleaseDateFinal}}`,
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
        content: `Create comprehensive deployment guides with environment setup, configuration, and rollback procedures.

# Deployment Guide Template
## Production Deployment and Release Management

### Overview
This guide provides comprehensive instructions for deploying applications to production with proper environment configuration, monitoring setup, and rollback procedures.

### Pre-Deployment Checklist

#### Code Quality Verification
- [ ] **Code Review**: All code changes reviewed and approved
- [ ] **Test Coverage**: Minimum 80% code coverage achieved
- [ ] **Security Scan**: No critical vulnerabilities detected
- [ ] **Performance Testing**: Load testing completed successfully
- [ ] **Documentation**: Deployment documentation updated
- [ ] **Change Approval**: Change request approved by stakeholders

#### Environment Readiness
- [ ] **Infrastructure**: Target environment provisioned and ready
- [ ] **Dependencies**: All required services and databases available
- [ ] **Configuration**: Environment-specific configurations prepared
- [ ] **Secrets**: All required secrets and API keys configured
- [ ] **Database**: Database migrations tested and ready
- [ ] **Monitoring**: Monitoring and alerting systems configured

#### Team Coordination
- [ ] **Stakeholder Notification**: All stakeholders informed of deployment
- [ ] **Maintenance Window**: Maintenance window scheduled if required
- [ ] **Team Availability**: Key team members available for deployment
- [ ] **Communication Channels**: Incident response channels ready
- [ ] **Rollback Team**: Rollback team identified and prepared

### Deployment Environments

#### Environment Hierarchy
1. **Development**: {{DevEnvironmentURL}}
2. **Testing**: {{TestEnvironmentURL}}
3. **Staging**: {{StagingEnvironmentURL}}
4. **Production**: {{ProductionEnvironmentURL}}

#### Environment Specifications
| Environment | Purpose | Configuration | Access |
|-------------|---------|---------------|---------|
| Development | Feature development | {{DevConfig}} | {{DevAccess}} |
| Testing | QA testing | {{TestConfig}} | {{TestAccess}} |
| Staging | Production replica | {{StagingConfig}} | {{StagingAccess}} |
| Production | Live system | {{ProductionConfig}} | {{ProductionAccess}} |

### Deployment Strategy

#### Blue-Green Deployment
**Overview**: Maintain two identical production environments (Blue and Green)

**Process**:
1. **Current State**: Traffic routes to Blue environment
2. **Deploy to Green**: Deploy new version to Green environment
3. **Testing**: Validate Green environment functionality
4. **Switch Traffic**: Route traffic from Blue to Green
5. **Monitor**: Monitor Green environment performance
6. **Cleanup**: Update Blue environment for next deployment

**Benefits**:
- Zero-downtime deployments
- Instant rollback capability
- Complete environment isolation
- Full production testing

#### Rolling Deployment
**Overview**: Gradually replace instances with new version

**Process**:
1. **Instance Replacement**: Replace instances one by one
2. **Health Checks**: Verify each instance health before proceeding
3. **Load Balancer**: Update load balancer configuration
4. **Gradual Rollout**: Continue until all instances updated
5. **Validation**: Validate entire system functionality

**Benefits**:
- Gradual risk mitigation
- Resource efficiency
- Continuous availability
- Early issue detection

#### Canary Deployment
**Overview**: Deploy to small subset of users initially

**Process**:
1. **Canary Release**: Deploy to 5% of production traffic
2. **Monitoring**: Monitor metrics and user feedback
3. **Validation**: Validate performance and functionality
4. **Gradual Increase**: Increase traffic percentage gradually
5. **Full Rollout**: Complete deployment after validation

**Benefits**:
- Risk mitigation
- Real user feedback
- Performance validation
- Quick rollback if issues

### Pre-Production Deployment

#### Staging Environment Deployment

**Step 1: Environment Preparation**
\`\`\`bash
# Update staging environment
kubectl config use-context staging
kubectl get pods --all-namespaces
kubectl get services --all-namespaces

# Verify environment health
curl -f {{StagingHealthCheckURL}} || exit 1
\`\`\`

**Step 2: Database Migration**
\`\`\`bash
# Backup staging database
pg_dump -h {{StagingDBHost}} -U {{StagingDBUser}} -d {{StagingDBName}} > staging_backup_{{Date}}.sql

# Run migrations
npm run db:migrate:staging
npm run db:seed:staging

# Verify migrations
npm run db:verify:staging
\`\`\`

**Step 3: Application Deployment**
\`\`\`bash
# Build application
docker build -t {{AppName}}:{{Version}} .
docker tag {{AppName}}:{{Version}} {{Registry}}/{{AppName}}:{{Version}}
docker push {{Registry}}/{{AppName}}:{{Version}}

# Deploy to staging
kubectl apply -f k8s/staging/
kubectl rollout status deployment/{{AppName}} -n staging
kubectl get pods -n staging
\`\`\`

**Step 4: Staging Validation**
\`\`\`bash
# Run integration tests
npm run test:integration:staging

# Run end-to-end tests
npm run test:e2e:staging

# Verify application functionality
curl -f {{StagingAppURL}}/health
curl -f {{StagingAppURL}}/api/status
\`\`\`

### Production Deployment

#### Step 1: Pre-Deployment Validation

**System Health Check**
\`\`\`bash
# Check production system health
kubectl config use-context production
kubectl get nodes
kubectl get pods --all-namespaces | grep -v Running

# Check resource utilization
kubectl top nodes
kubectl top pods --all-namespaces

# Verify external dependencies
curl -f {{ExternalService1URL}}/health
curl -f {{ExternalService2URL}}/status
\`\`\`

**Database Preparation**
\`\`\`sql
-- Create production database backup
pg_dump -h {{ProductionDBHost}} -U {{ProductionDBUser}} -d {{ProductionDBName}} > prod_backup_{{Timestamp}}.sql

-- Verify backup integrity
pg_restore --list prod_backup_{{Timestamp}}.sql

-- Check database connections
SELECT count(*) FROM pg_stat_activity;
\`\`\`

#### Step 2: Deployment Execution

**Blue-Green Deployment Process**

**Phase 1: Green Environment Preparation**
\`\`\`bash
# Switch to green environment context
export TARGET_ENV=green
kubectl config use-context production-green

# Deploy application to green
envsubst < k8s/production/deployment.yaml | kubectl apply -f -
kubectl rollout status deployment/{{AppName}} -n production-green

# Verify green environment
kubectl get pods -n production-green
kubectl get services -n production-green
\`\`\`

**Phase 2: Database Migration**
\`\`\`bash
# Run database migrations on production
export DATABASE_URL={{ProductionDatabaseURL}}
npm run db:migrate:production

# Verify migration success
npm run db:verify:production
\`\`\`

**Phase 3: Application Configuration**
\`\`\`bash
# Update configuration
kubectl create configmap app-config \\
  --from-file=config/production.json \\
  -n production-green

# Update secrets
kubectl create secret generic app-secrets \\
  --from-literal=api-key={{ProductionAPIKey}} \\
  --from-literal=db-password={{ProductionDBPassword}} \\
  -n production-green
\`\`\`

**Phase 4: Health Validation**
\`\`\`bash
# Wait for pods to be ready
kubectl wait --for=condition=Ready pod -l app={{AppName}} -n production-green --timeout=300s

# Perform health checks
GREEN_URL=$(kubectl get service {{AppName}} -n production-green -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -f http://$GREEN_URL/health
curl -f http://$GREEN_URL/api/status

# Run smoke tests
npm run test:smoke:production -- --url=$GREEN_URL
\`\`\`

#### Step 3: Traffic Switching

**Load Balancer Configuration**
\`\`\`bash
# Update load balancer to route to green
kubectl patch service {{AppName}}-lb -p '{"spec":{"selector":{"version":"green"}}}' -n production

# Verify traffic routing
curl -I {{ProductionURL}}/health

# Monitor traffic distribution
kubectl logs -f deployment/{{AppName}} -n production-green
\`\`\`

**Gradual Traffic Migration**
\`\`\`bash
# Route 10% traffic to green
kubectl apply -f k8s/traffic-split/10-percent.yaml

# Monitor metrics for 15 minutes
sleep 900

# Route 50% traffic to green
kubectl apply -f k8s/traffic-split/50-percent.yaml

# Monitor metrics for 15 minutes
sleep 900

# Route 100% traffic to green
kubectl apply -f k8s/traffic-split/100-percent.yaml
\`\`\`

#### Step 4: Post-Deployment Validation

**System Monitoring**
\`\`\`bash
# Check application logs
kubectl logs -f deployment/{{AppName}} -n production-green --tail=100

# Monitor error rates
curl {{MonitoringURL}}/api/metrics/error-rate

# Check response times
curl {{MonitoringURL}}/api/metrics/response-time

# Verify database connections
kubectl exec -it deployment/{{AppName}} -n production-green -- npm run db:health
\`\`\`

**Functional Verification**
\`\`\`bash
# Run production health checks
npm run test:health:production

# Verify critical user journeys
npm run test:critical-path:production

# Check integration points
npm run test:integration:production
\`\`\`

### Configuration Management

#### Environment Variables
\`\`\`bash
# Production environment variables
export NODE_ENV=production
export DATABASE_URL={{ProductionDatabaseURL}}
export REDIS_URL={{ProductionRedisURL}}
export API_KEY={{ProductionAPIKey}}
export LOG_LEVEL=info
export PORT=8080
\`\`\`

#### Kubernetes Configuration
\`\`\`yaml
# production-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{AppName}}-config
  namespace: production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "8080"
  DATABASE_POOL_SIZE: "20"
  REDIS_POOL_SIZE: "10"
---
apiVersion: v1
kind: Secret
metadata:
  name: {{AppName}}-secrets
  namespace: production
type: Opaque
stringData:
  DATABASE_URL: "{{ProductionDatabaseURL}}"
  REDIS_URL: "{{ProductionRedisURL}}"
  API_KEY: "{{ProductionAPIKey}}"
  JWT_SECRET: "{{ProductionJWTSecret}}"
\`\`\`

#### Application Configuration
\`\`\`json
{
  "database": {
    "host": "{{ProductionDBHost}}",
    "port": {{ProductionDBPort}},
    "name": "{{ProductionDBName}}",
    "ssl": true,
    "poolSize": 20
  },
  "redis": {
    "host": "{{ProductionRedisHost}}",
    "port": {{ProductionRedisPort}},
    "password": "{{ProductionRedisPassword}}"
  },
  "monitoring": {
    "enabled": true,
    "endpoint": "{{MonitoringEndpoint}}",
    "level": "info"
  },
  "features": {
    "rateLimit": true,
    "caching": true,
    "compression": true
  }
}
\`\`\`

### Monitoring and Alerting

#### Health Check Endpoints
\`\`\`javascript
// Health check implementation
app.get('/health', async (req, res) => {
  try {
    // Database health
    await db.query('SELECT 1');
    
    // Redis health
    await redis.ping();
    
    // External service health
    await checkExternalServices();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
\`\`\`

#### Monitoring Dashboard Setup
\`\`\`bash
# Install monitoring stack
kubectl apply -f monitoring/prometheus/
kubectl apply -f monitoring/grafana/
kubectl apply -f monitoring/alertmanager/

# Configure application metrics
kubectl apply -f monitoring/app-metrics.yaml

# Verify monitoring setup
kubectl get pods -n monitoring
\`\`\`

#### Alert Configuration
\`\`\`yaml
# alerting-rules.yaml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
\`\`\`

### Rollback Procedures

#### Automatic Rollback Triggers
- Error rate > 5% for 2 minutes
- Response time > 1 second for 5 minutes
- Health check failures > 50% for 1 minute
- Database connection failures > 10% for 1 minute

#### Manual Rollback Process

**Step 1: Immediate Traffic Switch**
\`\`\`bash
# Switch traffic back to blue (previous version)
kubectl patch service {{AppName}}-lb -p '{"spec":{"selector":{"version":"blue"}}}' -n production

# Verify traffic switch
curl -I {{ProductionURL}}/health
\`\`\`

**Step 2: Rollback Database**
\`\`\`bash
# If database rollback needed
pg_restore -h {{ProductionDBHost}} -U {{ProductionDBUser}} -d {{ProductionDBName}} prod_backup_{{Timestamp}}.sql

# Verify database integrity
npm run db:verify:production
\`\`\`

**Step 3: System Validation**
\`\`\`bash
# Validate rollback success
npm run test:health:production
npm run test:critical-path:production

# Monitor system stability
kubectl logs -f deployment/{{AppName}} -n production-blue --tail=100
\`\`\`

#### Automated Rollback Script
\`\`\`bash
#!/bin/bash
# automated-rollback.sh

echo "Starting automated rollback..."

# Switch traffic to previous version
kubectl patch service {{AppName}}-lb -p '{"spec":{"selector":{"version":"blue"}}}' -n production

# Wait for traffic switch
sleep 30

# Validate rollback
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" {{ProductionURL}}/health)

if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "Rollback successful"
  # Send success notification
  curl -X POST {{SlackWebhook}} -d '{"text":"Rollback completed successfully"}'
else
  echo "Rollback failed"
  # Send failure notification
  curl -X POST {{SlackWebhook}} -d '{"text":"Rollback failed - manual intervention required"}'
fi
\`\`\`

### Communication Plan

#### Stakeholder Notifications

**Pre-Deployment**
- [ ] **Development Team**: Deployment schedule communicated
- [ ] **QA Team**: Testing completion confirmed
- [ ] **Operations Team**: Deployment window scheduled
- [ ] **Business Stakeholders**: Maintenance window notified
- [ ] **Customer Support**: Potential issues briefed

**During Deployment**
- [ ] **Status Updates**: Regular status updates to stakeholders
- [ ] **Issue Reporting**: Immediate issue reporting channels active
- [ ] **Progress Tracking**: Deployment progress tracked and communicated

**Post-Deployment**
- [ ] **Success Notification**: Deployment success communicated
- [ ] **Performance Report**: Initial performance metrics shared
- [ ] **Known Issues**: Any known issues documented and communicated

#### Communication Templates

**Deployment Start Notification**
\`\`\`
Subject: [DEPLOYMENT] {{AppName}} v{{Version}} - Deployment Started

Team,

The deployment of {{AppName}} version {{Version}} to production has begun.

Timeline:
- Start Time: {{StartTime}}
- Expected Duration: {{ExpectedDuration}}
- Completion ETA: {{CompletionETA}}

Deployment Lead: {{DeploymentLead}}
Rollback Contact: {{RollbackContact}}

We will provide updates every {{UpdateInterval}} minutes.

Thanks,
DevOps Team
\`\`\`

**Deployment Completion Notification**
\`\`\`
Subject: [SUCCESS] {{AppName}} v{{Version}} - Deployment Completed

Team,

The deployment of {{AppName}} version {{Version}} has been completed successfully.

Results:
- Deployment Time: {{ActualDeploymentTime}}
- Downtime: {{Downtime}}
- Performance: {{PerformanceMetrics}}

New Features:
- {{Feature1}}
- {{Feature2}}
- {{Feature3}}

Monitor Dashboard: {{MonitoringURL}}

Thanks,
DevOps Team
\`\`\`

### Post-Deployment Activities

#### Monitoring Period
- **Duration**: 24 hours post-deployment
- **Metrics**: Error rates, response times, resource utilization
- **Alerts**: All production alerts active
- **On-call**: Extended on-call coverage

#### Documentation Updates
- [ ] **Deployment Log**: Document deployment details
- [ ] **Configuration Changes**: Record configuration updates
- [ ] **Known Issues**: Document any known issues
- [ ] **Lessons Learned**: Capture lessons learned

#### Performance Analysis
\`\`\`bash
# Generate performance report
curl {{MonitoringURL}}/api/reports/deployment/{{DeploymentID}}

# Compare pre and post deployment metrics
npm run generate:performance-report -- --deployment={{DeploymentID}}
\`\`\`

### Checklist and Sign-off

#### Deployment Checklist
- [ ] Pre-deployment validation completed
- [ ] Staging deployment successful
- [ ] Production backup created
- [ ] Database migrations applied
- [ ] Application deployment completed
- [ ] Health checks passed
- [ ] Monitoring configured
- [ ] Rollback plan tested
- [ ] Stakeholders notified

#### Sign-off Requirements
- **Technical Lead**: {{TechnicalLeadSignoff}}
- **DevOps Lead**: {{DevOpsLeadSignoff}}
- **QA Lead**: {{QALeadSignoff}}
- **Product Owner**: {{ProductOwnerSignoff}}

This comprehensive deployment guide ensures reliable, monitored, and reversible production deployments with proper stakeholder communication and risk management.`,
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
        content: `Define environment setup procedures for development, staging, and production environments.

# Environment Setup Template
## Development Environment Configuration

### Overview
This guide provides comprehensive instructions for setting up development, testing, and production environments with all necessary tools, dependencies, and configurations.

### Prerequisites

#### System Requirements
**Development Environment**:
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 20.04+
- **RAM**: Minimum 16GB (32GB recommended)
- **Storage**: Minimum 50GB free space (SSD recommended)
- **CPU**: 4+ cores (8+ cores recommended)
- **Network**: Stable internet connection

**Additional Tools**:
- **Git**: Version 2.30+ for version control
- **Docker**: Version 20.10+ for containerization
- **Node.js**: Version 18+ LTS for JavaScript development
- **Package Manager**: npm 8+ or yarn 1.22+

### Development Environment Setup

#### Step 1: Install Core Tools

**Install Git**
\`\`\`bash
# Windows (using chocolatey)
choco install git

# macOS (using homebrew)
brew install git

# Ubuntu
sudo apt update && sudo apt install git

# Verify installation
git --version
\`\`\`

**Install Node.js and npm**
\`\`\`bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
\`\`\`

**Install Docker**
\`\`\`bash
# Windows: Download Docker Desktop from docker.com
# macOS: Download Docker Desktop from docker.com

# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
\`\`\`

#### Step 2: IDE and Development Tools

**Visual Studio Code Setup**
\`\`\`bash
# Download and install VS Code
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
\`\`\`

**VS Code Configuration**
\`\`\`json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
\`\`\`

**VS Code Extensions Configuration**
\`\`\`json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-docker",
    "ms-vscode.vscode-git-graph"
  ]
}
\`\`\`

#### Step 3: Project Setup

**Clone Repository**
\`\`\`bash
# Clone the project repository
git clone {{RepositoryURL}}
cd {{ProjectName}}

# Configure Git user
git config user.name "{{YourName}}"
git config user.email "{{YourEmail}}"
\`\`\`

**Install Dependencies**
\`\`\`bash
# Install project dependencies
npm install

# or using yarn
yarn install

# Verify installation
npm list --depth=0
\`\`\`

**Environment Configuration**
\`\`\`bash
# Copy environment template
cp .env.example .env.development

# Edit environment variables
code .env.development
\`\`\`

**Development Environment Variables**
\`\`\`env
# .env.development
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://{{devuser}}:{{devpassword}}@localhost:5432/{{devdatabase}}
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET={{development_jwt_secret}}
JWT_EXPIRES_IN=24h

# External Services
API_KEY={{development_api_key}}
WEBHOOK_URL={{development_webhook_url}}

# Feature Flags
ENABLE_LOGGING=true
ENABLE_METRICS=false
ENABLE_DEBUG=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration
SMTP_HOST={{dev_smtp_host}}
SMTP_PORT=587
SMTP_USER={{dev_smtp_user}}
SMTP_PASS={{dev_smtp_password}}
\`\`\`

#### Step 4: Database Setup

**PostgreSQL Installation**
\`\`\`bash
# Using Docker (recommended for development)
docker run --name postgres-dev \\
  -e POSTGRES_DB={{devdatabase}} \\
  -e POSTGRES_USER={{devuser}} \\
  -e POSTGRES_PASSWORD={{devpassword}} \\
  -p 5432:5432 \\
  -d postgres:15

# or install locally
# Windows: Download from postgresql.org
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib
\`\`\`

**Database Migration**
\`\`\`bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Verify database setup
npm run db:health
\`\`\`

**Redis Installation**
\`\`\`bash
# Using Docker
docker run --name redis-dev \\
  -p 6379:6379 \\
  -d redis:7-alpine

# or install locally
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server

# Verify Redis connection
redis-cli ping
\`\`\`

### Testing Environment Setup

#### Test Database Configuration
\`\`\`bash
# Create test database
createdb {{testdatabase}}

# Set test environment variables
cp .env.development .env.test
\`\`\`

**Test Environment Variables**
\`\`\`env
# .env.test
NODE_ENV=test
PORT=3001
API_URL=http://localhost:3001

# Test Database
DATABASE_URL=postgresql://{{testuser}}:{{testpassword}}@localhost:5432/{{testdatabase}}
REDIS_URL=redis://localhost:6380

# Test Configuration
JWT_SECRET={{test_jwt_secret}}
ENABLE_LOGGING=false
ENABLE_METRICS=false
ENABLE_DEBUG=false

# Test Services
API_KEY={{test_api_key}}
MOCK_EXTERNAL_SERVICES=true
\`\`\`

#### Test Infrastructure
\`\`\`bash
# Start test Redis instance
docker run --name redis-test \\
  -p 6380:6379 \\
  -d redis:7-alpine

# Run test migrations
npm run db:migrate:test

# Verify test environment
npm run test:setup
npm run test:health
\`\`\`

### Staging Environment Setup

#### Infrastructure Requirements
**Server Specifications**:
- **CPU**: 4 cores minimum
- **RAM**: 8GB minimum  
- **Storage**: 100GB SSD
- **Network**: Static IP with SSL certificate
- **OS**: Ubuntu 20.04 LTS

#### Server Preparation
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget unzip software-properties-common

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
docker --version
docker-compose --version
node --version
npm --version
\`\`\`

#### Application Deployment
\`\`\`bash
# Clone repository
git clone {{RepositoryURL}} /opt/{{ProjectName}}
cd /opt/{{ProjectName}}

# Configure environment
cp .env.example .env.staging
sudo nano .env.staging
\`\`\`

**Staging Environment Variables**
\`\`\`env
# .env.staging
NODE_ENV=staging
PORT=8080
API_URL=https://{{staging_domain}}

# Database
DATABASE_URL=postgresql://{{staging_db_user}}:{{staging_db_password}}@{{staging_db_host}}:5432/{{staging_db_name}}
REDIS_URL=redis://{{staging_redis_host}}:6379

# Security
JWT_SECRET={{staging_jwt_secret}}
JWT_EXPIRES_IN=2h

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/{{staging_domain}}.crt
SSL_KEY_PATH=/etc/ssl/private/{{staging_domain}}.key

# Monitoring
ENABLE_LOGGING=true
ENABLE_METRICS=true
LOG_LEVEL=info

# External Services
API_KEY={{staging_api_key}}
WEBHOOK_URL={{staging_webhook_url}}

# Performance
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000
\`\`\`

#### Database and Services Setup
\`\`\`bash
# Setup PostgreSQL
docker run --name postgres-staging \\
  -e POSTGRES_DB={{staging_db_name}} \\
  -e POSTGRES_USER={{staging_db_user}} \\
  -e POSTGRES_PASSWORD={{staging_db_password}} \\
  -p 5432:5432 \\
  -v postgres_staging_data:/var/lib/postgresql/data \\
  -d postgres:15

# Setup Redis
docker run --name redis-staging \\
  -p 6379:6379 \\
  -v redis_staging_data:/data \\
  -d redis:7-alpine redis-server --appendonly yes

# Run migrations
npm run db:migrate:staging
npm run db:seed:staging
\`\`\`

### Production Environment Setup

#### Infrastructure Requirements
**Server Specifications**:
- **CPU**: 8+ cores
- **RAM**: 32GB minimum
- **Storage**: 500GB+ SSD with backup
- **Network**: Load balancer with SSL termination
- **OS**: Ubuntu 20.04 LTS (hardened)

#### Security Hardening
\`\`\`bash
# Update system and install security updates
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades

# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

# Configure SSH security
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
# Set: PubkeyAuthentication yes

sudo systemctl restart sshd

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
\`\`\`

#### Production Application Setup
\`\`\`bash
# Create application user
sudo useradd -m -s /bin/bash {{app_user}}
sudo usermod -aG docker {{app_user}}

# Setup application directory
sudo mkdir -p /opt/{{ProjectName}}
sudo chown {{app_user}}:{{app_user}} /opt/{{ProjectName}}

# Switch to application user
sudo su - {{app_user}}

# Clone and setup application
git clone {{RepositoryURL}} /opt/{{ProjectName}}
cd /opt/{{ProjectName}}

# Install dependencies
npm ci --only=production
\`\`\`

**Production Environment Variables**
\`\`\`env
# .env.production
NODE_ENV=production
PORT=8080
API_URL=https://{{production_domain}}

# Database (managed service recommended)
DATABASE_URL=postgresql://{{prod_db_user}}:{{prod_db_password}}@{{prod_db_host}}:5432/{{prod_db_name}}?ssl=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis (managed service recommended)
REDIS_URL=redis://{{prod_redis_host}}:6379
REDIS_PASSWORD={{prod_redis_password}}

# Security
JWT_SECRET={{production_jwt_secret}}
JWT_EXPIRES_IN=1h
SESSION_SECRET={{production_session_secret}}

# SSL and Security Headers
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
CSP_POLICY=default-src 'self'

# Logging and Monitoring
LOG_LEVEL=warn
ENABLE_METRICS=true
METRICS_ENDPOINT={{metrics_endpoint}}
ERROR_REPORTING_DSN={{error_reporting_dsn}}

# External Services
API_KEY={{production_api_key}}
WEBHOOK_URL={{production_webhook_url}}
WEBHOOK_SECRET={{production_webhook_secret}}

# Performance and Scaling
NODE_OPTIONS=--max-old-space-size=4096
CLUSTER_MODE=true
CLUSTER_WORKERS=4
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000

# File Upload and Storage
MAX_FILE_SIZE=52428800
STORAGE_TYPE=s3
S3_BUCKET={{production_s3_bucket}}
S3_REGION={{production_s3_region}}
AWS_ACCESS_KEY_ID={{production_aws_access_key}}
AWS_SECRET_ACCESS_KEY={{production_aws_secret_key}}

# Email Service
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY={{production_sendgrid_key}}
FROM_EMAIL={{production_from_email}}
\`\`\`

#### Production Database Setup
\`\`\`bash
# Use managed database service (recommended)
# AWS RDS, Google Cloud SQL, or Azure Database

# Connection testing
psql "{{DATABASE_URL}}" -c "SELECT version();"

# Run production migrations
npm run db:migrate:production
\`\`\`

#### Load Balancer Configuration
\`\`\`nginx
# /etc/nginx/sites-available/{{ProjectName}}
upstream {{ProjectName}}_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
}

server {
    listen 80;
    server_name {{production_domain}};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name {{production_domain}};

    ssl_certificate /etc/ssl/certs/{{production_domain}}.crt;
    ssl_certificate_key /etc/ssl/private/{{production_domain}}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://{{ProjectName}}_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://{{ProjectName}}_backend/health;
        access_log off;
    }
}
\`\`\`

### Docker Configuration

#### Development Docker Compose
\`\`\`yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: {{devdatabase}}
      POSTGRES_USER: {{devuser}}
      POSTGRES_PASSWORD: {{devpassword}}
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
\`\`\`

#### Production Docker Compose
\`\`\`yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
\`\`\`

### Environment Validation

#### Development Environment Validation
\`\`\`bash
# Health check script
#!/bin/bash
echo "Validating development environment..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version)"
else
    echo "✗ Node.js not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✓ npm $(npm --version)"
else
    echo "✗ npm not available"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
else
    echo "✗ Docker not installed"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✓ Git $(git --version | cut -d' ' -f3)"
else
    echo "✗ Git not installed"
    exit 1
fi

# Check project dependencies
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "✓ Dependencies installed"
    else
        echo "✗ Dependencies not installed. Run 'npm install'"
        exit 1
    fi
else
    echo "✗ package.json not found"
    exit 1
fi

# Check environment file
if [ -f ".env.development" ]; then
    echo "✓ Development environment file exists"
else
    echo "✗ .env.development file missing"
    exit 1
fi

echo "✓ Development environment validation complete"
\`\`\`

#### Production Environment Validation
\`\`\`bash
# Production validation script
#!/bin/bash
echo "Validating production environment..."

# Check system resources
MEMORY=$(free -g | awk 'NR==2{printf "%.1f", $2}')
DISK=$(df -h / | awk 'NR==2{printf "%d", $4}')
CPU=$(nproc)

echo "System Resources:"
echo "  Memory: \${MEMORY}GB"
echo "  CPU Cores: \${CPU}"
echo "  Disk Space: \${DISK}GB available"

if (( $(echo "$MEMORY < 8.0" | bc -l) )); then
    echo "⚠ Warning: Memory below recommended 8GB"
fi

if (( CPU < 4 )); then
    echo "⚠ Warning: CPU cores below recommended 4"
fi

# Check services
services=("docker" "nginx" "postgresql")
for service in "\${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "✓ $service is running"
    else
        echo "✗ $service is not running"
    fi
done

# Check SSL certificate
if [ -f "/etc/ssl/certs/{{production_domain}}.crt" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/ssl/certs/{{production_domain}}.crt | cut -d= -f2)
    echo "✓ SSL Certificate expires: $EXPIRY"
else
    echo "✗ SSL Certificate not found"
fi

# Check application health
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo "✓ Application health check passed"
else
    echo "✗ Application health check failed (HTTP $HEALTH_RESPONSE)"
fi

echo "✓ Production environment validation complete"
\`\`\`

### Environment Monitoring

#### System Monitoring Setup
\`\`\`bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup log monitoring
sudo apt install -y logwatch
sudo nano /etc/logwatch/logwatch.conf
\`\`\`

#### Application Monitoring
\`\`\`javascript
// monitoring.js
const express = require('express');
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

module.exports = { metricsMiddleware, register: prometheus.register };
\`\`\`

### Troubleshooting Common Issues

#### Development Environment Issues

**Node.js Version Conflicts**
\`\`\`bash
# Use Node Version Manager
nvm list
nvm install 18
nvm use 18
nvm alias default 18
\`\`\`

**Port Already in Use**
\`\`\`bash
# Find process using port
lsof -ti:3000
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm start
\`\`\`

**Database Connection Issues**
\`\`\`bash
# Check PostgreSQL status
docker ps | grep postgres
docker logs postgres-dev

# Reset database
docker rm -f postgres-dev
docker run --name postgres-dev ...
\`\`\`

#### Production Environment Issues

**SSL Certificate Problems**
\`\`\`bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/{{production_domain}}.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --nginx
\`\`\`

**High Memory Usage**
\`\`\`bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Restart application
sudo systemctl restart {{ProjectName}}
\`\`\`

**Database Performance Issues**
\`\`\`sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check database connections
SELECT count(*) FROM pg_stat_activity;
\`\`\`

### Environment Maintenance

#### Regular Maintenance Tasks
\`\`\`bash
# Weekly maintenance script
#!/bin/bash

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker images
docker image prune -f
docker volume prune -f

# Check disk space
df -h
du -sh /var/log/*

# Rotate logs
sudo logrotate -f /etc/logrotate.conf

# Check SSL certificate expiry
sudo certbot certificates

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

echo "Maintenance complete"
\`\`\`

#### Security Updates
\`\`\`bash
# Security update script
#!/bin/bash

# Update security packages
sudo apt update
sudo apt list --upgradable | grep -i security
sudo unattended-upgrade -v

# Update Docker images
docker-compose pull
docker-compose up -d

# Check for vulnerable packages
npm audit
npm audit fix

echo "Security updates complete"
\`\`\`

This comprehensive environment setup guide ensures consistent, secure, and properly configured environments across all deployment stages.`,
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
        content: `Establish incident response procedures with escalation paths, communication protocols, and resolution tracking.

# Incident Response Plan Template
## Emergency Response and Crisis Management

### Overview
This document outlines the comprehensive incident response plan for handling system outages, security breaches, and critical operational issues with defined escalation paths, communication protocols, and recovery procedures.

### Incident Classification

#### Severity Levels

##### Critical (P1) - Business Critical Impact
**Characteristics**:
- Complete system outage affecting all users
- Security breach with data exposure
- Payment processing failure
- Data corruption or loss
- Revenue-impacting outages

**Response Time**: Immediate (≤ 15 minutes)
**Escalation**: C-level executives, all on-call teams
**Communication**: All stakeholders, public status page

##### High (P2) - Significant Impact
**Characteristics**:
- Partial system outage affecting major features
- Performance degradation affecting >50% users
- Authentication system issues
- Third-party integration failures
- Non-critical data inconsistencies

**Response Time**: Within 30 minutes
**Escalation**: Engineering management, product leads
**Communication**: Internal teams, affected customers

##### Medium (P3) - Moderate Impact
**Characteristics**:
- Minor feature issues affecting <25% users
- Non-critical service degradation
- Cosmetic UI problems with workarounds
- Internal tool failures

**Response Time**: Within 2 hours
**Escalation**: Team leads, assigned engineers
**Communication**: Development teams, minimal external

##### Low (P4) - Minimal Impact
**Characteristics**:
- Documentation errors
- Minor UI inconsistencies
- Internal process issues
- Non-user-facing problems

**Response Time**: Next business day
**Escalation**: Individual contributors
**Communication**: Team level only

### Incident Response Team

#### Core Team Structure

##### Incident Commander (IC)
**Responsibilities**:
- Overall incident coordination and decision making
- Communication with stakeholders and executives
- Resource allocation and team coordination
- Post-incident review leadership

**Skills Required**:
- Strong technical background
- Excellent communication skills
- Decision-making under pressure
- Leadership experience

**Contact Information**:
- Primary IC: {{PrimaryICName}} - {{PrimaryICPhone}} - {{PrimaryICEmail}}
- Secondary IC: {{SecondaryICName}} - {{SecondaryICPhone}} - {{SecondaryICEmail}}

##### Technical Lead
**Responsibilities**:
- Technical investigation and diagnosis
- Solution implementation and testing
- Technical communication to IC
- Recovery procedure execution

**Skills Required**:
- Deep system knowledge
- Debugging and troubleshooting expertise
- Understanding of infrastructure and architecture

**Contact Information**:
- Primary: {{TechLeadName}} - {{TechLeadPhone}} - {{TechLeadEmail}}
- Secondary: {{BackupTechLeadName}} - {{BackupTechLeadPhone}} - {{BackupTechLeadEmail}}

##### Communications Lead
**Responsibilities**:
- Customer and stakeholder communication
- Status page updates
- Media relations if required
- Internal team notifications

**Contact Information**:
- Primary: {{CommsLeadName}} - {{CommsLeadPhone}} - {{CommsLeadEmail}}
- Secondary: {{BackupCommsLeadName}} - {{BackupCommsLeadPhone}} - {{BackupCommsLeadEmail}}

##### Subject Matter Experts (SMEs)
**Database SME**: {{DatabaseSMEName}} - {{DatabaseSMEPhone}} - {{DatabaseSMEEmail}}
**Security SME**: {{SecuritySMEName}} - {{SecuritySMEPhone}} - {{SecuritySMEEmail}}
**Infrastructure SME**: {{InfraSMEName}} - {{InfraSMEPhone}} - {{InfraSMEEmail}}
**Application SME**: {{AppSMEName}} - {{AppSMEPhone}} - {{AppSMEEmail}}

#### Extended Support Team
**Engineering Manager**: {{EngManagerName}} - {{EngManagerPhone}} - {{EngManagerEmail}}
**Product Manager**: {{ProductManagerName}} - {{ProductManagerPhone}} - {{ProductManagerEmail}}
**Customer Success**: {{CustomerSuccessName}} - {{CustomerSuccessPhone}} - {{CustomerSuccessEmail}}
**Legal Counsel**: {{LegalCounselName}} - {{LegalCounselPhone}} - {{LegalCounselEmail}}

### Detection and Alerting

#### Automated Monitoring
**System Alerts**:
- Application performance monitoring (APM)
- Infrastructure monitoring (CPU, memory, disk)
- Database performance and availability
- Network connectivity and latency
- Security event detection

**Alert Configuration**:
\`\`\`yaml
# Example Prometheus alerting rules
groups:
  - name: critical-alerts
    rules:
      - alert: ServiceDown
        expr: up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API service is down"
          runbook: "https://runbook.example.com/service-down"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          runbook: "https://runbook.example.com/high-error-rate"
\`\`\`

**Escalation Matrix**:
| Alert Severity | Response Time | Notification Method | Escalation Path |
|---------------|---------------|-------------------|-----------------|
| Critical | 5 minutes | Phone + SMS + Email | On-call → Manager → Director → VP |
| High | 15 minutes | SMS + Email | On-call → Manager → Director |
| Medium | 30 minutes | Email + Slack | On-call → Team Lead |
| Low | 2 hours | Email | Assigned Engineer |

#### Manual Detection
**Customer Reports**:
- Customer support ticket escalation
- Social media monitoring
- Direct customer communication
- Partner organization reports

**Internal Discovery**:
- Engineering team identification
- QA testing discovery
- Business team reporting
- Routine maintenance discovery

### Response Procedures

#### Initial Response (0-15 minutes)

**Step 1: Incident Detection and Verification**
\`\`\`bash
# Verify incident scope and impact
curl -I {{ProductionURL}}/health
kubectl get pods --all-namespaces | grep -v Running
tail -f /var/log/application.log | grep ERROR
\`\`\`

**Step 2: Initial Assessment**
- Confirm incident severity and classification
- Determine potential user impact and affected systems
- Assess immediate safety and security implications
- Document initial findings in incident tracking system

**Step 3: Team Assembly**
- Page Incident Commander based on severity level
- Notify core response team members
- Establish incident war room (physical or virtual)
- Create incident tracking ticket with initial details

**Step 4: Communication Initiation**
- Update internal status dashboard
- Notify customer success and support teams
- Prepare initial customer communication
- Alert executives for P1/P2 incidents

#### Investigation and Diagnosis (15-60 minutes)

**Technical Investigation Process**:
\`\`\`bash
# System health check
kubectl top nodes
kubectl top pods --all-namespaces
df -h
free -m

# Application logs analysis
tail -n 1000 /var/log/application.log | grep -E "(ERROR|FATAL|CRITICAL)"
journalctl -u {{service-name}} --since "1 hour ago"

# Database health check
psql -c "SELECT version();"
psql -c "SELECT count(*) FROM pg_stat_activity;"
psql -c "SELECT * FROM pg_stat_replication;"

# Network connectivity
ping {{external-service-endpoint}}
nslookup {{domain-name}}
telnet {{service-host}} {{service-port}}
\`\`\`

**Data Collection**:
- System metrics and performance data
- Application logs and error messages
- User reports and affected account information
- Network traffic and connectivity data
- Recent deployment and configuration changes

**Root Cause Analysis**:
- Timeline construction of events leading to incident
- Correlation of metrics, logs, and user reports
- Identification of potential contributing factors
- Hypothesis formation and testing

#### Containment and Mitigation (30-120 minutes)

**Immediate Actions**:
\`\`\`bash
# Traffic diversion (if applicable)
kubectl patch service {{service-name}} -p '{"spec":{"selector":{"version":"stable"}}}'

# Scale resources if performance-related
kubectl scale deployment {{deployment-name}} --replicas=10

# Database failover (if required)
pg_ctl promote -D {{data-directory}}

# Cache flush (if required)
redis-cli FLUSHALL
\`\`\`

**Service Restoration**:
- Implementation of immediate fixes or workarounds
- Rollback to previous stable version if necessary
- Resource scaling or reallocation
- Third-party service switching or backup activation

**Impact Limitation**:
- User access restriction if security-related
- Feature flag toggles to disable affected functionality
- Load balancer configuration to route around issues
- CDN or proxy configuration changes

### Communication Protocols

#### Internal Communication

**Incident War Room**:
- Physical location: {{WarRoomLocation}}
- Virtual meeting: {{WarRoomURL}}
- Communication tools: Slack channel #incident-response
- Conference bridge: {{ConferenceBridgeNumber}}

**Status Updates**:
- Frequency: Every 15 minutes for P1, 30 minutes for P2
- Recipients: Response team, management, stakeholders
- Format: Structured update template with current status, next steps, ETA

**Update Template**:
\`\`\`
INCIDENT UPDATE #{{UpdateNumber}} - {{Timestamp}}

STATUS: {{CurrentStatus}}
IMPACT: {{UserImpact}}
AFFECTED SYSTEMS: {{AffectedSystems}}
NEXT STEPS: {{NextSteps}}
ETA TO RESOLUTION: {{ETA}}
RESPONDERS: {{ActiveResponders}}

INVESTIGATION SUMMARY:
{{InvestigationSummary}}

ACTIONS TAKEN:
- {{Action1}}
- {{Action2}}
- {{Action3}}
\`\`\`

#### External Communication

**Customer Communication Strategy**:
- Transparency and honesty about impact
- Regular updates on progress
- Clear explanation of workarounds
- Realistic timelines and expectations

**Status Page Updates**:
\`\`\`markdown
## {{ServiceName}} Experiencing {{IssueType}}

**Posted**: {{Timestamp}}
**Status**: {{Status}}
**Affected Components**: {{Components}}

We are currently experiencing {{IssueDescription}}. Our team is actively investigating and working to resolve this issue.

**Impact**: {{UserImpact}}
**Workaround**: {{AvailableWorkaround}}
**Next Update**: {{NextUpdateTime}}

We apologize for any inconvenience and will provide updates as more information becomes available.
\`\`\`

**Social Media Communication**:
- Platform: Twitter (@{{CompanyHandle}})
- Tone: Professional, empathetic, informative
- Frequency: Major updates only
- Coordination: Through communications lead

#### Stakeholder Notification

**Executive Briefing Format**:
\`\`\`
EXECUTIVE INCIDENT BRIEF - {{IncidentID}}

SITUATION: {{OneSentenceSummary}}
IMPACT: {{BusinessImpact}}
  - Users Affected: {{UserCount}}
  - Revenue Impact: {{RevenueImpact}}
  - Duration: {{IncidentDuration}}

RESPONSE: {{ResponseActions}}
RESOLUTION ETA: {{ResolutionETA}}
COMMUNICATION STATUS: {{CommunicationStatus}}

NEXT EXECUTIVE UPDATE: {{NextUpdate}}
\`\`\`

**Board/Investor Notification**:
- Trigger: P1 incidents lasting >2 hours or with significant business impact
- Method: Direct email and phone call from CEO/CTO
- Content: Business impact, customer communication status, resolution plan

### Recovery and Resolution

#### Service Restoration Process

**Validation Steps**:
\`\`\`bash
# System health verification
curl -f {{ProductionURL}}/health
kubectl get pods --all-namespaces | grep -v Running
systemctl status {{critical-services}}

# Performance validation
ab -n 1000 -c 10 {{ProductionURL}}/api/test
wrk -t12 -c400 -d30s {{ProductionURL}}

# Functional testing
npm run test:smoke:production
npm run test:integration:production
curl -f {{ProductionURL}}/api/critical-endpoint
\`\`\`

**Recovery Checklist**:
- [ ] Primary systems fully operational
- [ ] Performance metrics within normal ranges
- [ ] Database integrity verified
- [ ] Security systems functioning correctly
- [ ] Monitoring and alerting restored
- [ ] Backup systems synchronized
- [ ] External integrations validated
- [ ] User authentication working
- [ ] Critical business functions tested

**Gradual Restoration**:
1. **Internal Testing**: Verify fixes in isolated environment
2. **Canary Release**: Route 5% of traffic to test stability
3. **Gradual Rollout**: Increase traffic percentage incrementally
4. **Full Restoration**: Complete service restoration after validation
5. **Monitoring**: Extended monitoring period post-restoration

#### Resolution Communication

**Internal Resolution Notification**:
\`\`\`
INCIDENT RESOLVED - {{IncidentID}}

RESOLUTION TIME: {{Timestamp}}
TOTAL DURATION: {{TotalDuration}}
ROOT CAUSE: {{RootCause}}
FIX APPLIED: {{FixDescription}}

IMPACT SUMMARY:
- Users Affected: {{TotalUsersAffected}}
- Peak Error Rate: {{PeakErrorRate}}
- Service Downtime: {{DowntimeDuration}}

POST-INCIDENT ACTIONS:
- Post-mortem scheduled: {{PostMortemDate}}
- Process improvements: {{ProcessImprovements}}
- System enhancements: {{SystemEnhancements}}
\`\`\`

**Customer Resolution Update**:
\`\`\`markdown
## {{ServiceName}} - Issue Resolved

**Updated**: {{Timestamp}}
**Status**: Resolved
**Resolution Time**: {{ResolutionTime}}

The issue affecting {{AffectedService}} has been fully resolved. All systems are now operating normally.

**What happened**: {{BriefExplanation}}
**How we fixed it**: {{FixDescription}}
**What we're doing to prevent this**: {{PreventionMeasures}}

We sincerely apologize for any inconvenience this may have caused. If you continue to experience any issues, please contact our support team.

Thank you for your patience.
\`\`\`

### Post-Incident Activities

#### Post-Incident Review (PIR)

**PIR Schedule**:
- P1 incidents: Within 24 hours
- P2 incidents: Within 48 hours  
- P3 incidents: Within 1 week
- P4 incidents: Monthly review batch

**PIR Participants**:
- Incident Commander
- Technical Lead
- All responding engineers
- Engineering Manager
- Product Manager
- Customer Success representative

**PIR Agenda Template**:
1. **Incident Timeline Review** (20 minutes)
   - Detection to resolution timeline
   - Key decision points and actions
   - Communication effectiveness review

2. **Root Cause Analysis** (30 minutes)
   - Technical root cause identification
   - Contributing factors analysis
   - Process and human factors review

3. **Response Effectiveness** (20 minutes)
   - Team coordination evaluation
   - Tool and process adequacy
   - Communication quality assessment

4. **Action Items Definition** (20 minutes)
   - Technical improvements needed
   - Process enhancements required
   - Training and documentation gaps

5. **Prevention Strategy** (10 minutes)
   - Long-term prevention measures
   - Investment priorities
   - Timeline for improvements

#### PIR Report Template

\`\`\`markdown
# Post-Incident Review: {{IncidentTitle}}

## Incident Summary
- **Incident ID**: {{IncidentID}}
- **Date**: {{IncidentDate}}
- **Duration**: {{TotalDuration}}
- **Severity**: {{IncidentSeverity}}
- **Customer Impact**: {{CustomerImpact}}

## Timeline of Events
| Time | Event | Actions Taken |
|------|-------|---------------|
| {{Time1}} | {{Event1}} | {{Actions1}} |
| {{Time2}} | {{Event2}} | {{Actions2}} |
| {{Time3}} | {{Event3}} | {{Actions3}} |

## Root Cause Analysis

### Primary Root Cause
{{PrimaryRootCause}}

### Contributing Factors
1. {{ContributingFactor1}}
2. {{ContributingFactor2}}
3. {{ContributingFactor3}}

### Why Analysis
**Why did this happen?** {{Why1}}
**Why was that the case?** {{Why2}}
**Why was that allowed?** {{Why3}}
**Why wasn't this prevented?** {{Why4}}
**Why didn't our safeguards work?** {{Why5}}

## What Went Well
- {{PositiveAspect1}}
- {{PositiveAspect2}}
- {{PositiveAspect3}}

## What Went Poorly
- {{IssueArea1}}
- {{IssueArea2}}
- {{IssueArea3}}

## Action Items

### Immediate Actions (< 1 week)
- [ ] {{ImmediateAction1}} - Owner: {{Owner1}} - Due: {{DueDate1}}
- [ ] {{ImmediateAction2}} - Owner: {{Owner2}} - Due: {{DueDate2}}

### Short-term Actions (1-4 weeks)
- [ ] {{ShortTermAction1}} - Owner: {{Owner1}} - Due: {{DueDate1}}
- [ ] {{ShortTermAction2}} - Owner: {{Owner2}} - Due: {{DueDate2}}

### Long-term Actions (1-3 months)
- [ ] {{LongTermAction1}} - Owner: {{Owner1}} - Due: {{DueDate1}}
- [ ] {{LongTermAction2}} - Owner: {{Owner2}} - Due: {{DueDate2}}

## Prevention Measures
{{PreventionStrategy}}

## Lessons Learned
{{LessonsLearned}}
\`\`\`

### Continuous Improvement

#### Metrics and KPIs
**Response Metrics**:
- Mean Time to Detection (MTTD)
- Mean Time to Response (MTTR)
- Mean Time to Resolution (MTTR)
- False positive alert rate
- Escalation accuracy rate

**Quality Metrics**:
- Post-incident action completion rate
- Incident recurrence rate
- Customer satisfaction with incident handling
- Communication effectiveness score

#### Process Enhancement
**Regular Reviews**:
- Monthly incident metrics review
- Quarterly response plan updates
- Semi-annual training assessments
- Annual comprehensive plan review

**Training Program**:
- New team member incident response training
- Regular fire drill exercises
- Cross-team knowledge sharing sessions
- External incident response training

**Documentation Maintenance**:
- Runbook updates based on incident learnings
- Contact information verification
- Tool and system access validation
- Communication template refinement

This comprehensive incident response plan ensures rapid, coordinated, and effective response to system incidents while minimizing impact and facilitating continuous improvement.`,
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
        content: `Plan scheduled maintenance windows with impact assessment, rollback procedures, and communication plans.

# Maintenance Schedule Template
## Planned Maintenance and System Updates

### Overview
This template provides a structured approach to planning, executing, and communicating scheduled maintenance activities to ensure minimal disruption to users and business operations.

### Maintenance Classification

#### Maintenance Types

##### Critical Maintenance
**Characteristics**:
- Security patches requiring immediate implementation
- System vulnerabilities affecting data integrity
- Infrastructure failures requiring emergency fixes
- Regulatory compliance updates with deadlines

**Scheduling**: Emergency window (immediate implementation)
**Duration**: Variable based on urgency
**Communication**: All stakeholders with 2-hour notice minimum

##### Major Maintenance
**Characteristics**:
- Database schema changes
- Infrastructure upgrades
- Major software version updates
- Performance optimization requiring downtime

**Scheduling**: Planned weekend or off-peak hours
**Duration**: 2-8 hours
**Communication**: All stakeholders with 48-72 hour notice

##### Minor Maintenance
**Characteristics**:
- Configuration updates
- Minor bug fixes
- Routine system updates
- Monitoring system improvements

**Scheduling**: Low-traffic periods
**Duration**: 30 minutes - 2 hours
**Communication**: Internal teams with 24-48 hour notice

##### Routine Maintenance
**Characteristics**:
- Log rotation and cleanup
- Backup verification
- Certificate renewals
- Health check updates

**Scheduling**: Automated or low-impact periods
**Duration**: Under 30 minutes
**Communication**: Internal notification only

### Maintenance Planning Framework

#### Pre-Planning Phase (1-4 weeks before)

**Requirements Assessment**:
- **Maintenance Scope**: {{MaintenanceScope}}
- **Business Impact**: {{ExpectedImpact}}
- **Technical Requirements**: {{TechnicalRequirements}}
- **Resource Needs**: {{RequiredResources}}
- **Risk Assessment**: {{IdentifiedRisks}}

**Stakeholder Identification**:
- **Technical Team**: {{TechnicalTeamMembers}}
- **Business Stakeholders**: {{BusinessStakeholders}}
- **Customer-Facing Teams**: {{CustomerFacingTeams}}
- **Executive Sponsors**: {{ExecutiveSponsors}}

**Impact Analysis**:
\`\`\`
MAINTENANCE IMPACT ASSESSMENT

AFFECTED SYSTEMS:
- Primary: {{PrimarySystems}}
- Secondary: {{SecondarySystems}}
- Dependencies: {{DependentSystems}}

USER IMPACT:
- Affected Users: {{AffectedUserCount}}
- Service Disruption: {{ServiceDisruption}}
- Feature Limitations: {{FeatureLimitations}}
- Workarounds Available: {{AvailableWorkarounds}}

BUSINESS IMPACT:
- Revenue Impact: {{RevenueImpact}}
- Operational Impact: {{OperationalImpact}}
- Customer Experience: {{CustomerExperienceImpact}}
- SLA Implications: {{SLAImplications}}
\`\`\`

#### Scheduling Phase (1-2 weeks before)

**Optimal Window Analysis**:
\`\`\`bash
# Traffic analysis for optimal scheduling
SELECT 
    EXTRACT(hour FROM timestamp) as hour,
    EXTRACT(dow FROM timestamp) as day_of_week,
    AVG(request_count) as avg_requests,
    AVG(active_users) as avg_users
FROM usage_metrics 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY hour, day_of_week
ORDER BY avg_requests ASC;
\`\`\`

**Maintenance Window Definition**:
- **Preferred Window**: {{PreferredWindow}}
- **Alternative Window**: {{AlternativeWindow}}
- **Backup Window**: {{BackupWindow}}
- **Total Duration**: {{EstimatedDuration}}
- **Buffer Time**: {{BufferTime}}

**Resource Allocation**:
- **Technical Lead**: {{MaintenanceLead}}
- **Engineering Team**: {{EngineeringTeam}}
- **Operations Team**: {{OperationsTeam}}
- **Communication Lead**: {{CommunicationLead}}
- **Backup Personnel**: {{BackupPersonnel}}

### Maintenance Execution Plan

#### Pre-Maintenance Checklist (24-48 hours before)

**System Preparation**:
- [ ] **Backup Verification**: All critical data backed up and verified
- [ ] **Rollback Plan**: Complete rollback procedures documented and tested
- [ ] **Monitoring Setup**: Enhanced monitoring and alerting configured
- [ ] **Team Coordination**: All team members confirmed and briefed
- [ ] **Tool Preparation**: All required tools and access verified

**Pre-Maintenance Tasks**:
\`\`\`bash
# System health check
#!/bin/bash

echo "Pre-maintenance system health check - $(date)"

# Check system resources
echo "=== System Resources ==="
free -h
df -h
uptime

# Check service status
echo "=== Service Status ==="
systemctl status {{service1}}
systemctl status {{service2}}
systemctl status {{service3}}

# Check database connectivity
echo "=== Database Health ==="
psql -c "SELECT version();"
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check external dependencies
echo "=== External Dependencies ==="
curl -I {{externalService1}}/health
curl -I {{externalService2}}/health

# Create maintenance backup
echo "=== Backup Creation ==="
pg_dump {{database}} > maintenance_backup_$(date +%Y%m%d_%H%M%S).sql

echo "Pre-maintenance check completed - $(date)"
\`\`\`

**Communication Preparation**:
- [ ] **Status Page**: Maintenance notice posted
- [ ] **Customer Notification**: Email/notification sent to affected users
- [ ] **Internal Notification**: All teams notified of maintenance window
- [ ] **Executive Brief**: Leadership informed of maintenance schedule
- [ ] **Support Team**: Customer service team prepared for inquiries

#### Maintenance Execution (During window)

**Maintenance Phases**:

**Phase 1: System Preparation (First 15 minutes)**
\`\`\`bash
# Enable maintenance mode
echo "Starting maintenance mode - $(date)"

# Update load balancer to show maintenance page
kubectl patch ingress {{app-ingress}} -p '{"spec":{"rules":[{"host":"{{domain}}","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"maintenance-page","port":{"number":80}}}}]}}]}}'

# Verify maintenance page is active
curl -I {{productionURL}} | grep "503\|502"

# Drain active connections gracefully
sleep 30

# Stop application services in order
systemctl stop {{application-service}}
systemctl stop {{worker-service}}
systemctl stop {{cache-service}}
\`\`\`

**Phase 2: Maintenance Implementation**
\`\`\`bash
# Execute maintenance tasks
echo "Executing maintenance tasks - $(date)"

# Database maintenance tasks
{{DatabaseMaintenanceTasks}}

# Application updates
{{ApplicationUpdateTasks}}

# Infrastructure changes
{{InfrastructureChangeTasks}}

# Configuration updates
{{ConfigurationUpdateTasks}}
\`\`\`

**Phase 3: System Validation and Startup**
\`\`\`bash
# Start services in reverse order
systemctl start {{cache-service}}
systemctl start {{worker-service}}
systemctl start {{application-service}}

# Wait for services to be ready
sleep 60

# Health check verification
curl -f {{internalHealthEndpoint}} || exit 1

# Database connectivity test
psql -c "SELECT 1;" || exit 1

# Application functionality test
npm run test:smoke || exit 1
\`\`\`

**Phase 4: Traffic Restoration**
\`\`\`bash
# Restore normal traffic routing
kubectl patch ingress {{app-ingress}} -p '{"spec":{"rules":[{"host":"{{domain}}","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"{{app-service}}","port":{"number":80}}}}]}}]}}'

# Verify application is accessible
curl -f {{productionURL}}/health

# Monitor error rates and performance
watch 'curl -s {{monitoringURL}}/api/metrics/errors'
\`\`\`

**Real-time Monitoring During Maintenance**:
\`\`\`bash
# Continuous monitoring script
#!/bin/bash

while [ -f "/tmp/maintenance.lock" ]; do
    echo "=== $(date) ==="
    
    # System resources
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
    echo "Memory: $(free | awk '/Mem/{printf("%.2f%"), $3/$2*100}')"
    echo "Disk: $(df -h / | awk '/\//{print $5}')"
    
    # Service status
    for service in {{service1}} {{service2}} {{service3}}; do
        status=$(systemctl is-active $service)
        echo "$service: $status"
    done
    
    sleep 60
done
\`\`\`

### Communication Templates

#### Pre-Maintenance Communication

**Customer Notification Email**:
\`\`\`
Subject: Scheduled Maintenance - {{ServiceName}} - {{MaintenanceDate}}

Dear {{CustomerName}},

We will be performing scheduled maintenance on {{ServiceName}} to improve performance and security.

MAINTENANCE DETAILS:
- Date: {{MaintenanceDate}}
- Start Time: {{StartTime}} {{TimeZone}}
- Estimated Duration: {{Duration}}
- Expected End Time: {{EndTime}} {{TimeZone}}

IMPACT:
{{ExpectedImpact}}

WHAT TO EXPECT:
- {{ServiceName}} will be temporarily unavailable
- {{FeatureAffected}} features will not be accessible
- {{WorkaroundOptions}} (if any available)

PREPARATION:
- Save your work before the maintenance window
- Plan alternative workflows if needed
- Contact support if you have urgent needs before maintenance

We apologize for any inconvenience and appreciate your patience as we work to improve our service.

For updates, visit: {{StatusPageURL}}
Questions? Contact: {{SupportContact}}

Best regards,
{{CompanyName}} Team
\`\`\`

**Status Page Update**:
\`\`\`markdown
## Scheduled Maintenance - {{MaintenanceDate}}

**Status**: Scheduled
**Start**: {{StartTime}} {{TimeZone}}
**Duration**: {{ExpectedDuration}}
**Impact**: {{ImpactLevel}}

We have scheduled maintenance to implement important updates and improvements to {{ServiceName}}.

**Affected Services**:
- {{Service1}} - Full outage
- {{Service2}} - Limited functionality
- {{Service3}} - No impact expected

**What we're doing**:
{{MaintenanceDescription}}

**Expected improvements**:
- {{Improvement1}}
- {{Improvement2}}
- {{Improvement3}}

We'll provide updates throughout the maintenance window. Thank you for your patience.
\`\`\`

#### During Maintenance Communication

**Progress Updates**:
\`\`\`
MAINTENANCE UPDATE #{{UpdateNumber}} - {{Timestamp}}

STATUS: {{CurrentPhase}}
PROGRESS: {{CompletionPercentage}}% complete
NEXT PHASE: {{NextPhase}}
REVISED ETA: {{RevisedETA}}

COMPLETED TASKS:
- {{CompletedTask1}}
- {{CompletedTask2}}
- {{CompletedTask3}}

CURRENT ACTIVITY:
{{CurrentActivity}}

ISSUES ENCOUNTERED:
{{IssuesIfAny}}

Next update in {{UpdateInterval}} minutes.
\`\`\`

#### Post-Maintenance Communication

**Completion Notification**:
\`\`\`markdown
## Maintenance Completed Successfully

**Updated**: {{CompletionTime}}
**Status**: Completed
**Actual Duration**: {{ActualDuration}}

Our scheduled maintenance has been completed successfully. All services are now fully operational.

**What was accomplished**:
- {{Accomplishment1}}
- {{Accomplishment2}}
- {{Accomplishment3}}

**Performance improvements**:
- {{PerformanceImprovement1}}
- {{PerformanceImprovement2}}

**Testing completed**:
- Full system functionality verified
- Performance benchmarks met
- Security validations passed

If you experience any issues, please contact our support team immediately.

Thank you for your patience during this maintenance window.
\`\`\`

### Rollback Procedures

#### Rollback Decision Criteria
- Maintenance duration exceeds planned window by >50%
- Critical system failures during maintenance
- Data integrity issues discovered
- Performance degradation beyond acceptable levels
- Unexpected user impact beyond planned scope

#### Rollback Execution
\`\`\`bash
#!/bin/bash
# Emergency rollback procedure

echo "INITIATING EMERGENCY ROLLBACK - $(date)"

# Stop current maintenance activities
pkill -f "maintenance-script"

# Restore from backup
echo "Restoring database from backup..."
pg_restore -d {{database}} maintenance_backup_{{timestamp}}.sql

# Revert configuration changes
echo "Reverting configuration..."
git checkout {{previous-config-commit}}
systemctl reload {{service-name}}

# Restart services with previous version
echo "Starting services with previous version..."
docker-compose -f docker-compose.rollback.yml up -d

# Verify rollback success
sleep 60
curl -f {{healthEndpoint}} || echo "ROLLBACK FAILED - MANUAL INTERVENTION REQUIRED"

# Update status communications
echo "ROLLBACK COMPLETED - $(date)"
\`\`\`

### Post-Maintenance Activities

#### Validation and Monitoring
**Extended Monitoring Period**: 24-48 hours post-maintenance
- **Performance Metrics**: Response times, error rates, throughput
- **System Health**: Resource utilization, service availability
- **User Experience**: Customer feedback, support ticket volume
- **Data Integrity**: Database consistency checks, backup verification

#### Post-Maintenance Report
\`\`\`markdown
# Maintenance Report - {{MaintenanceDate}}

## Executive Summary
{{ExecutiveSummary}}

## Maintenance Details
- **Scheduled Window**: {{ScheduledWindow}}
- **Actual Duration**: {{ActualDuration}}
- **Maintenance Type**: {{MaintenanceType}}
- **Team Lead**: {{MaintenanceLead}}

## Tasks Completed
- {{Task1}} - {{Status1}}
- {{Task2}} - {{Status2}}
- {{Task3}} - {{Status3}}

## Issues and Resolutions
{{IssuesAndResolutions}}

## Performance Impact
- **Before Maintenance**: {{BeforeMetrics}}
- **After Maintenance**: {{AfterMetrics}}
- **Improvement**: {{ImprovementMetrics}}

## Customer Impact
- **Affected Users**: {{AffectedUserCount}}
- **Support Tickets**: {{SupportTicketCount}}
- **Customer Feedback**: {{CustomerFeedback}}

## Lessons Learned
{{LessonsLearned}}

## Next Scheduled Maintenance
{{NextMaintenanceSchedule}}
\`\`\`

### Continuous Improvement

#### Maintenance Metrics
- **Schedule Accuracy**: Maintenance completed within planned window
- **Communication Effectiveness**: Customer satisfaction with notifications
- **Rollback Rate**: Percentage of maintenance requiring rollbacks
- **Performance Impact**: System performance before/after maintenance

#### Process Enhancement
- **Monthly Reviews**: Maintenance process effectiveness evaluation
- **Quarterly Planning**: Upcoming maintenance schedule and resource planning
- **Annual Assessment**: Comprehensive maintenance strategy review

This comprehensive maintenance schedule template ensures well-planned, communicated, and executed maintenance activities with minimal business disruption.`,
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
        content: `Plan team capacity, resource allocation, and workload distribution for sprint and release planning.

# Capacity Planning Template
## Resource and Workload Management

### Overview
This template provides a comprehensive framework for planning team capacity, allocating resources effectively, and distributing workload for optimal sprint and release planning outcomes.

### Team Capacity Assessment

#### Team Structure Analysis
**Development Team Composition**:
- **Senior Developers**: {{SeniorDevCount}} × {{SeniorDevCapacity}} hours/week = {{SeniorDevTotal}} hours
- **Mid-level Developers**: {{MidDevCount}} × {{MidDevCapacity}} hours/week = {{MidDevTotal}} hours  
- **Junior Developers**: {{JuniorDevCount}} × {{JuniorDevCapacity}} hours/week = {{JuniorDevTotal}} hours
- **DevOps Engineers**: {{DevOpsCount}} × {{DevOpsCapacity}} hours/week = {{DevOpsTotal}} hours
- **QA Engineers**: {{QACount}} × {{QACapacity}} hours/week = {{QATotal}} hours
- **UI/UX Designers**: {{DesignCount}} × {{DesignCapacity}} hours/week = {{DesignTotal}} hours

**Total Weekly Capacity**: {{TotalWeeklyHours}} hours

#### Individual Capacity Factors
**Team Member Assessment**:
| Name | Role | Base Hours | Availability % | Effective Hours | Skills | Current Load |
|------|------|------------|----------------|-----------------|---------|--------------|
| {{Member1}} | {{Role1}} | {{BaseHours1}} | {{Availability1}} | {{EffectiveHours1}} | {{Skills1}} | {{Load1}} |
| {{Member2}} | {{Role2}} | {{BaseHours2}} | {{Availability2}} | {{EffectiveHours2}} | {{Skills2}} | {{Load2}} |
| {{Member3}} | {{Role3}} | {{BaseHours3}} | {{Availability3}} | {{EffectiveHours3}} | {{Skills3}} | {{Load3}} |

**Capacity Adjustment Factors**:
- **Training Time**: {{TrainingHours}} hours/week
- **Administrative Tasks**: {{AdminHours}} hours/week  
- **Support and Maintenance**: {{SupportHours}} hours/week
- **Code Review and Mentoring**: {{ReviewHours}} hours/week
- **Meeting Overhead**: {{MeetingHours}} hours/week

**Adjusted Team Capacity**: {{AdjustedCapacity}} hours/week

### Sprint Capacity Planning

#### Sprint Parameters
**Sprint Configuration**:
- **Sprint Duration**: {{SprintLength}} weeks
- **Total Calendar Days**: {{CalendarDays}}
- **Working Days**: {{WorkingDays}}
- **Holiday/PTO Days**: {{NonWorkingDays}}
- **Effective Working Days**: {{EffectiveWorkingDays}}

#### Historical Velocity Analysis
\`\`\`
VELOCITY TRACKING (Last 6 Sprints)

Sprint N-5: {{VelocityN5}} story points ({{HoursN5}} hours)
Sprint N-4: {{VelocityN4}} story points ({{HoursN4}} hours)
Sprint N-3: {{VelocityN3}} story points ({{HoursN3}} hours)
Sprint N-2: {{VelocityN2}} story points ({{HoursN2}} hours)
Sprint N-1: {{VelocityN1}} story points ({{HoursN1}} hours)

Average Velocity: {{AvgVelocity}} story points
Standard Deviation: {{VelocityStdDev}}
Confidence Range: {{VelocityMin}} - {{VelocityMax}} story points

Team's Hour-to-Point Ratio: {{HourToPointRatio}} hours/point
\`\`\`

#### Capacity Allocation by Work Type
\`\`\`
CAPACITY DISTRIBUTION

New Features: {{NewFeaturePercent}}% ({{NewFeatureHours}} hours)
Bug Fixes: {{BugFixPercent}}% ({{BugFixHours}} hours)
Technical Debt: {{TechDebtPercent}}% ({{TechDebtHours}} hours)
Research/Spikes: {{ResearchPercent}}% ({{ResearchHours}} hours)
Support/Maintenance: {{SupportPercent}}% ({{SupportHours}} hours)
Testing: {{TestingPercent}}% ({{TestingHours}} hours)

Total Planned: {{TotalPlannedHours}} hours
Available Capacity: {{AvailableCapacity}} hours
Buffer/Contingency: {{BufferHours}} hours ({{BufferPercent}}%)
\`\`\`

### Workload Distribution Strategy

#### Skill-Based Assignment
**Frontend Development**:
- **Required Skills**: React, TypeScript, CSS, UI/UX
- **Available Team Members**: {{FrontendTeamMembers}}
- **Total Capacity**: {{FrontendCapacity}} hours
- **Current Allocation**: {{FrontendAllocation}} hours
- **Available Capacity**: {{FrontendAvailable}} hours

**Backend Development**:
- **Required Skills**: Node.js, PostgreSQL, API design, System architecture
- **Available Team Members**: {{BackendTeamMembers}}
- **Total Capacity**: {{BackendCapacity}} hours
- **Current Allocation**: {{BackendAllocation}} hours
- **Available Capacity**: {{BackendAvailable}} hours

**DevOps/Infrastructure**:
- **Required Skills**: Docker, Kubernetes, CI/CD, Cloud platforms
- **Available Team Members**: {{DevOpsTeamMembers}}
- **Total Capacity**: {{DevOpsCapacity}} hours
- **Current Allocation**: {{DevOpsAllocation}} hours
- **Available Capacity**: {{DevOpsAvailable}} hours

**Quality Assurance**:
- **Required Skills**: Testing frameworks, Automation, Manual testing
- **Available Team Members**: {{QATeamMembers}}
- **Total Capacity**: {{QACapacity}} hours
- **Current Allocation**: {{QAAllocation}} hours
- **Available Capacity**: {{QAAvailable}} hours

#### Task Complexity and Effort Estimation
**Estimation Guidelines**:
- **XS (1-2 hours)**: Simple bug fixes, minor UI updates, configuration changes
- **S (4-8 hours)**: Component updates, simple features, routine integrations
- **M (1-3 days)**: Medium features, API implementations, database migrations
- **L (3-5 days)**: Complex features, major integrations, architectural changes
- **XL (1-2 weeks)**: Large features, system redesigns, major refactoring

**Estimation Matrix**:
| Complexity | Frontend | Backend | DevOps | QA | Design |
|------------|----------|---------|--------|----|---------| 
| XS | {{XS_Frontend}} | {{XS_Backend}} | {{XS_DevOps}} | {{XS_QA}} | {{XS_Design}} |
| S | {{S_Frontend}} | {{S_Backend}} | {{S_DevOps}} | {{S_QA}} | {{S_Design}} |
| M | {{M_Frontend}} | {{M_Backend}} | {{M_DevOps}} | {{M_QA}} | {{M_Design}} |
| L | {{L_Frontend}} | {{L_Backend}} | {{L_DevOps}} | {{L_QA}} | {{L_Design}} |
| XL | {{XL_Frontend}} | {{XL_Backend}} | {{XL_DevOps}} | {{XL_QA}} | {{XL_Design}} |

### Resource Allocation Framework

#### Priority-Based Allocation
**Priority Levels**:
1. **P0 (Critical)**: Production issues, security vulnerabilities, blockers
2. **P1 (High)**: Key features, important bug fixes, performance issues
3. **P2 (Medium)**: Standard features, minor improvements, technical debt
4. **P3 (Low)**: Nice-to-have features, optimizations, research items

**Allocation Rules**:
- P0: Immediate allocation, interrupt current work if necessary
- P1: Allocated within current sprint, may require reprioritization
- P2: Allocated in current or next sprint based on capacity
- P3: Allocated when higher priority work is completed

#### Cross-Functional Dependencies
**Dependency Mapping**:
\`\`\`mermaid
graph TD
    A[Requirements Analysis] --> B[Design Phase]
    B --> C[Frontend Development]
    B --> D[Backend Development]
    C --> E[Integration Testing]
    D --> E
    E --> F[QA Testing]
    F --> G[DevOps Deployment]
    
    H[Performance Testing] --> G
    I[Security Review] --> G
\`\`\`

**Critical Path Analysis**:
- **Longest Path**: {{CriticalPath}}
- **Bottleneck Identification**: {{BottleneckAreas}}
- **Dependency Risks**: {{DependencyRisks}}
- **Mitigation Strategies**: {{MitigationStrategies}}

### Capacity Planning Tools and Metrics

#### Planning Spreadsheet Template
\`\`\`
SPRINT {{SprintNumber}} CAPACITY PLANNING

Team Member | Role | Available Hours | Assigned Tasks | Estimated Hours | Remaining Capacity
{{Member1}} | {{Role1}} | {{AvailableHours1}} | {{Tasks1}} | {{EstimatedHours1}} | {{RemainingCapacity1}}
{{Member2}} | {{Role2}} | {{AvailableHours2}} | {{Tasks2}} | {{EstimatedHours2}} | {{RemainingCapacity2}}
{{Member3}} | {{Role3}} | {{AvailableHours3}} | {{Tasks3}} | {{EstimatedHours3}} | {{RemainingCapacity3}}

TOTALS: Available: {{TotalAvailable}} | Assigned: {{TotalAssigned}} | Remaining: {{TotalRemaining}}
\`\`\`

#### Velocity Tracking
\`\`\`python
# Velocity calculation script
def calculate_team_velocity(sprints_data):
    completed_points = []
    for sprint in sprints_data:
        completed_points.append(sprint['completed_story_points'])
    
    avg_velocity = sum(completed_points) / len(completed_points)
    velocity_trend = calculate_trend(completed_points)
    
    return {
        'average_velocity': avg_velocity,
        'trend': velocity_trend,
        'last_sprint': completed_points[-1],
        'confidence_range': calculate_confidence_range(completed_points)
    }

# Usage example
sprint_data = [
    {'sprint': 'Sprint 25', 'completed_story_points': {{Sprint25Points}}},
    {'sprint': 'Sprint 26', 'completed_story_points': {{Sprint26Points}}},
    {'sprint': 'Sprint 27', 'completed_story_points': {{Sprint27Points}}},
]

velocity_metrics = calculate_team_velocity(sprint_data)
\`\`\`

#### Burndown Tracking
\`\`\`
SPRINT BURNDOWN - Sprint {{SprintNumber}}

Day 1: Remaining: {{Day1Remaining}} hours ({{Day1Percent}}% complete)
Day 2: Remaining: {{Day2Remaining}} hours ({{Day2Percent}}% complete)
Day 3: Remaining: {{Day3Remaining}} hours ({{Day3Percent}}% complete)
...
Day {{SprintLength}}: Remaining: {{FinalRemaining}} hours ({{FinalPercent}}% complete)

Ideal Burndown Rate: {{IdealRate}} hours/day
Actual Burndown Rate: {{ActualRate}} hours/day
Trend: {{BurndownTrend}}
Projected Completion: {{ProjectedCompletion}}
\`\`\`

### Release Planning Considerations

#### Multi-Sprint Planning
**Release Timeline**:
- **Release Version**: {{ReleaseVersion}}
- **Target Date**: {{TargetReleaseDate}}
- **Sprint Count**: {{SprintCount}} sprints
- **Development Sprints**: {{DevSprintCount}}
- **Hardening Sprints**: {{HardeningSprintCount}}
- **Buffer Sprints**: {{BufferSprintCount}}

**Feature Roadmap**:
| Feature | Priority | Effort (SP) | Sprint Assignment | Dependencies | Risk Level |
|---------|----------|-------------|-------------------|--------------|-------------|
| {{Feature1}} | {{Priority1}} | {{Effort1}} | {{Sprint1}} | {{Dependencies1}} | {{Risk1}} |
| {{Feature2}} | {{Priority2}} | {{Effort2}} | {{Sprint2}} | {{Dependencies2}} | {{Risk2}} |
| {{Feature3}} | {{Priority3}} | {{Effort3}} | {{Sprint3}} | {{Dependencies3}} | {{Risk3}} |

#### Risk Assessment and Mitigation
**Capacity Risks**:
- **Team Member Availability**: {{AvailabilityRisks}}
- **Skill Gaps**: {{SkillGaps}}
- **External Dependencies**: {{ExternalDependencies}}
- **Technical Complexity**: {{TechnicalComplexity}}

**Mitigation Strategies**:
- **Cross-Training**: {{CrossTrainingPlan}}
- **External Resources**: {{ExternalResourcePlan}}
- **Scope Flexibility**: {{ScopeAdjustmentPlan}}
- **Contingency Planning**: {{ContingencyPlan}}

### Continuous Optimization

#### Performance Metrics
**Team Efficiency Metrics**:
- **Sprint Completion Rate**: {{CompletionRate}}%
- **Story Point Accuracy**: {{EstimationAccuracy}}%
- **Cycle Time**: {{AverageCycleTime}} days
- **Lead Time**: {{AverageLeadTime}} days
- **Defect Rate**: {{DefectRate}} defects/story point
- **Velocity Stability**: {{VelocityStability}}

#### Process Improvements
**Retrospective Actions**:
- **Capacity Planning Accuracy**: {{PlanningAccuracy}}
- **Workload Distribution Effectiveness**: {{DistributionEffectiveness}}
- **Resource Utilization Rate**: {{UtilizationRate}}
- **Team Satisfaction**: {{TeamSatisfaction}}

**Optimization Opportunities**:
- **Bottleneck Elimination**: {{BottleneckActions}}
- **Skill Development**: {{SkillDevelopmentPlan}}
- **Process Streamlining**: {{ProcessImprovements}}
- **Tool Enhancement**: {{ToolImprovements}}

### Capacity Planning Checklist

#### Sprint Planning Checklist
- [ ] **Team Availability**: Confirmed all team member availability and PTO
- [ ] **Capacity Calculation**: Calculated effective team capacity for sprint
- [ ] **Velocity Reference**: Reviewed historical velocity and trends
- [ ] **Workload Distribution**: Balanced work across team members and skills
- [ ] **Dependency Mapping**: Identified and planned for all dependencies
- [ ] **Risk Assessment**: Evaluated capacity risks and mitigation strategies
- [ ] **Buffer Planning**: Allocated appropriate buffer for unknowns
- [ ] **Stakeholder Alignment**: Confirmed capacity plan with stakeholders

#### Release Planning Checklist
- [ ] **Multi-Sprint View**: Planned capacity across multiple sprints
- [ ] **Feature Prioritization**: Aligned feature priorities with capacity
- [ ] **Resource Requirements**: Identified specialized skill requirements
- [ ] **External Dependencies**: Planned for external team dependencies
- [ ] **Risk Mitigation**: Developed contingency plans for capacity risks
- [ ] **Milestone Alignment**: Aligned capacity plan with key milestones
- [ ] **Stakeholder Communication**: Communicated capacity constraints and impacts

This comprehensive capacity planning template ensures optimal resource allocation and realistic planning for sustainable team performance.`,
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
        content: `Identify project risks with impact assessment, probability analysis, and mitigation strategies.

# Risk Assessment Template
## Project Risk Management and Mitigation Planning

### Overview
This template provides a comprehensive framework for identifying, analyzing, and mitigating project risks to ensure successful project delivery and minimize potential negative impacts.

### Risk Identification Framework

#### Risk Categories

##### Technical Risks
**Technology and Implementation Risks**:
- **Architecture Complexity**: System design complexity beyond team expertise
- **Technology Stack**: Using unproven or unfamiliar technologies
- **Integration Challenges**: Complex third-party integrations or legacy system connections
- **Scalability Issues**: System performance under expected load
- **Security Vulnerabilities**: Data protection and system security concerns
- **Technical Debt**: Accumulated code quality issues affecting development speed

**Development Process Risks**:
- **Code Quality**: Inconsistent development standards and practices
- **Testing Coverage**: Inadequate testing strategies and coverage
- **Documentation**: Missing or outdated technical documentation
- **Deployment Complexity**: Complex or unreliable deployment processes
- **Tool Dependencies**: Critical dependency on specific tools or platforms

##### Resource Risks
**Team and Personnel Risks**:
- **Key Person Dependency**: Critical knowledge concentrated in individual team members
- **Skill Gaps**: Missing technical or domain expertise in the team
- **Team Availability**: Team member availability and competing priorities
- **Resource Allocation**: Insufficient resources allocated to critical tasks
- **Team Turnover**: Risk of key team members leaving during the project

**Budget and Financial Risks**:
- **Budget Overrun**: Project costs exceeding allocated budget
- **Resource Costs**: Unexpected increases in personnel or technology costs
- **Opportunity Cost**: Resources diverted from other strategic initiatives
- **Vendor Costs**: Changes in third-party service pricing or licensing

##### Schedule Risks
**Timeline and Delivery Risks**:
- **Scope Creep**: Uncontrolled expansion of project requirements
- **Estimation Accuracy**: Underestimated effort for complex tasks
- **Dependency Delays**: External dependencies causing project delays
- **Change Management**: Impact of requirement changes on timeline
- **Critical Path**: Tasks on critical path facing delays

**External Dependency Risks**:
- **Third-party Services**: Reliability and availability of external services
- **Vendor Deliverables**: Delays or quality issues from external vendors
- **Regulatory Changes**: Changes in compliance requirements affecting project
- **Market Conditions**: External market factors impacting project relevance

##### Business Risks
**Strategic and Business Risks**:
- **Requirements Clarity**: Unclear or changing business requirements
- **Stakeholder Alignment**: Misaligned expectations among stakeholders
- **Market Fit**: Product-market fit and user acceptance risks
- **Competitive Landscape**: Competitive threats during development
- **Business Continuity**: Impact on existing business operations

**Compliance and Legal Risks**:
- **Regulatory Compliance**: Meeting industry-specific regulations
- **Data Privacy**: GDPR, CCPA, and other privacy regulation compliance
- **Intellectual Property**: Patent or copyright infringement risks
- **Contractual Obligations**: Meeting contractual commitments and SLAs

### Risk Assessment Matrix

#### Risk Probability Scale
**Probability Levels**:
1. **Very Low (1)**: 0-10% chance of occurrence
2. **Low (2)**: 11-30% chance of occurrence  
3. **Medium (3)**: 31-60% chance of occurrence
4. **High (4)**: 61-80% chance of occurrence
5. **Very High (5)**: 81-100% chance of occurrence

#### Risk Impact Scale
**Impact Levels**:
1. **Very Low (1)**: Minimal impact, easily managed within normal processes
2. **Low (2)**: Minor impact on schedule, budget, or quality
3. **Medium (3)**: Moderate impact requiring management attention and resources
4. **High (4)**: Significant impact requiring senior management intervention
5. **Very High (5)**: Severe impact threatening project success or business operations

#### Risk Priority Matrix
\`\`\`
RISK PRIORITY MATRIX

        IMPACT
        1    2    3    4    5
PROB 5| 5   10   15   20   25
    4 | 4    8   12   16   20
    3 | 3    6    9   12   15
    2 | 2    4    6    8   10
    1 | 1    2    3    4    5

Risk Priority Levels:
- Critical (20-25): Immediate action required
- High (12-19): Action plan within 1 week
- Medium (6-11): Monitor closely, plan mitigation
- Low (3-5): Monitor and document
- Minimal (1-2): Accept and log
\`\`\`

### Risk Register Template

\`\`\`
PROJECT RISK REGISTER - {{ProjectName}}

Risk ID: {{RiskID}}
Risk Category: {{RiskCategory}}
Risk Title: {{RiskTitle}}
Risk Description: {{RiskDescription}}

ASSESSMENT:
Probability: {{RiskProbability}} ({{ProbabilityDescription}})
Impact: {{RiskImpact}} ({{ImpactDescription}})
Risk Score: {{RiskScore}} ({{RiskPriority}})

IMPACT ANALYSIS:
Schedule Impact: {{ScheduleImpact}}
Budget Impact: {{BudgetImpact}}
Quality Impact: {{QualityImpact}}
Business Impact: {{BusinessImpact}}

ROOT CAUSE ANALYSIS:
Primary Cause: {{PrimaryCause}}
Contributing Factors:
- {{ContributingFactor1}}
- {{ContributingFactor2}}
- {{ContributingFactor3}}

RISK OWNER: {{RiskOwner}}
IDENTIFICATION DATE: {{IdentificationDate}}
LAST UPDATED: {{LastUpdated}}
STATUS: {{RiskStatus}}

MITIGATION STRATEGY:
Prevention Actions: {{PreventionActions}}
Contingency Plans: {{ContingencyPlans}}
Monitoring Indicators: {{MonitoringIndicators}}
\`\`\`

### Detailed Risk Analysis

#### Risk #1: Key Person Dependency
**Risk Description**: {{KeyPersonRiskDescription}}

**Probability Assessment**: {{KeyPersonProbability}} ({{KeyPersonProbabilityReason}})
**Impact Assessment**: {{KeyPersonImpact}} ({{KeyPersonImpactReason}})
**Risk Score**: {{KeyPersonScore}}

**Specific Impacts**:
- **Knowledge Loss**: {{KnowledgeLossImpact}}
- **Project Delays**: {{ProjectDelayImpact}}
- **Quality Reduction**: {{QualityImpact}}
- **Team Morale**: {{TeamMoraleImpact}}

**Mitigation Strategies**:
- **Knowledge Transfer**: {{KnowledgeTransferPlan}}
- **Documentation**: {{DocumentationPlan}}
- **Cross-Training**: {{CrossTrainingPlan}}
- **Backup Resources**: {{BackupResourcePlan}}

#### Risk #2: Technology Integration Complexity
**Risk Description**: {{IntegrationRiskDescription}}

**Probability Assessment**: {{IntegrationProbability}} ({{IntegrationProbabilityReason}})
**Impact Assessment**: {{IntegrationImpact}} ({{IntegrationImpactReason}})
**Risk Score**: {{IntegrationScore}}

**Technical Considerations**:
- **API Compatibility**: {{APICompatibilityRisk}}
- **Data Mapping**: {{DataMappingComplexity}}
- **Performance Impact**: {{PerformanceRisk}}
- **Error Handling**: {{ErrorHandlingComplexity}}

**Mitigation Approaches**:
- **Proof of Concept**: {{POCPlan}}
- **Vendor Engagement**: {{VendorEngagementPlan}}
- **Alternative Solutions**: {{AlternativeSolutions}}
- **Testing Strategy**: {{IntegrationTestingPlan}}

#### Risk #3: Scope Creep
**Risk Description**: {{ScopeCreepDescription}}

**Probability Assessment**: {{ScopeCreepProbability}} ({{ScopeCreepReason}})
**Impact Assessment**: {{ScopeCreepImpact}} ({{ScopeCreepImpactReason}})
**Risk Score**: {{ScopeCreepScore}}

**Contributing Factors**:
- **Requirements Clarity**: {{RequirementsClarityIssues}}
- **Stakeholder Management**: {{StakeholderManagementIssues}}
- **Change Control**: {{ChangeControlWeaknesses}}
- **Communication Gaps**: {{CommunicationGaps}}

**Control Measures**:
- **Change Control Process**: {{ChangeControlProcess}}
- **Scope Documentation**: {{ScopeDocumentationPlan}}
- **Stakeholder Approval**: {{StakeholderApprovalProcess}}
- **Impact Assessment**: {{ImpactAssessmentProcess}}

### Risk Mitigation Strategies

#### Prevention-Focused Strategies
**Eliminate the Risk**:
- **Process Changes**: {{ProcessChanges}}
- **Technology Choices**: {{TechnologyChoices}}
- **Resource Allocation**: {{ResourceAllocationChanges}}
- **Vendor Selection**: {{VendorSelectionCriteria}}

**Reduce Risk Probability**:
- **Team Training**: {{TeamTrainingPlan}}
- **Process Improvements**: {{ProcessImprovements}}
- **Quality Gates**: {{QualityGateImplementation}}
- **Regular Reviews**: {{RegularReviewProcess}}

#### Response-Focused Strategies
**Reduce Risk Impact**:
- **Parallel Development**: {{ParallelDevelopmentStrategy}}
- **Backup Plans**: {{BackupPlanDetails}}
- **Resource Buffer**: {{ResourceBufferStrategy}}
- **Phased Implementation**: {{PhasedImplementationPlan}}

**Transfer Risk**:
- **Insurance Coverage**: {{InsuranceCoverage}}
- **Vendor Contracts**: {{VendorContractTerms}}
- **Service Level Agreements**: {{SLAAgreements}}
- **Third-party Services**: {{ThirdPartyServices}}

**Accept Risk**:
- **Risk Tolerance**: {{RiskToleranceLevels}}
- **Contingency Reserves**: {{ContingencyReserves}}
- **Monitoring Plans**: {{RiskMonitoringPlans}}
- **Response Triggers**: {{ResponseTriggers}}

### Risk Monitoring and Control

#### Risk Monitoring Framework
**Monitoring Frequency**:
- **Critical Risks**: Daily monitoring and weekly reporting
- **High Risks**: Weekly monitoring and bi-weekly reporting
- **Medium Risks**: Bi-weekly monitoring and monthly reporting
- **Low Risks**: Monthly monitoring and quarterly reporting

**Key Risk Indicators (KRIs)**:
\`\`\`
TECHNICAL RISKS:
- Code Complexity Metrics: {{CodeComplexityThreshold}}
- Test Coverage: {{TestCoverageThreshold}}
- Defect Density: {{DefectDensityThreshold}}
- Performance Metrics: {{PerformanceThreshold}}

SCHEDULE RISKS:
- Sprint Velocity: {{VelocityThreshold}}
- Burn Rate: {{BurnRateThreshold}}
- Milestone Achievement: {{MilestoneThreshold}}
- Dependency Status: {{DependencyStatusThreshold}}

RESOURCE RISKS:
- Team Utilization: {{UtilizationThreshold}}
- Skill Gap Analysis: {{SkillGapThreshold}}
- Team Satisfaction: {{SatisfactionThreshold}}
- Knowledge Distribution: {{KnowledgeDistributionThreshold}}
\`\`\`

#### Risk Escalation Process
**Escalation Triggers**:
- Risk score increases by {{ScoreIncreaseThreshold}} points
- New critical risk identified
- Mitigation strategy proves ineffective
- Risk impact exceeds defined thresholds

**Escalation Path**:
1. **Level 1**: Project Manager (for medium/high risks)
2. **Level 2**: Program Manager/Director (for high/critical risks)
3. **Level 3**: Executive Sponsor/VP (for critical risks with business impact)
4. **Level 4**: CEO/Board (for risks threatening business continuity)

### Risk Communication and Reporting

#### Risk Status Dashboard
\`\`\`
RISK DASHBOARD - {{ReportingPeriod}}

RISK SUMMARY:
Critical Risks: {{CriticalRiskCount}}
High Risks: {{HighRiskCount}}  
Medium Risks: {{MediumRiskCount}}
Low Risks: {{LowRiskCount}}

TRENDING:
New Risks: {{NewRisksCount}}
Closed Risks: {{ClosedRisksCount}}
Escalated Risks: {{EscalatedRisksCount}}
Mitigated Risks: {{MitigatedRisksCount}}

TOP 3 RISKS:
1. {{TopRisk1}} (Score: {{TopRisk1Score}})
2. {{TopRisk2}} (Score: {{TopRisk2Score}})  
3. {{TopRisk3}} (Score: {{TopRisk3Score}})

MITIGATION STATUS:
On Track: {{OnTrackMitigationCount}}
At Risk: {{AtRiskMitigationCount}}
Overdue: {{OverdueMitigationCount}}
\`\`\`

#### Risk Report Template
\`\`\`
RISK ASSESSMENT REPORT
Project: {{ProjectName}}
Reporting Period: {{ReportingPeriod}}
Report Date: {{ReportDate}}
Prepared By: {{PreparedBy}}

EXECUTIVE SUMMARY:
{{ExecutiveSummary}}

KEY RISKS AND STATUS:
{{KeyRisksStatus}}

MITIGATION PROGRESS:
{{MitigationProgress}}

RECOMMENDATIONS:
{{Recommendations}}

NEXT PERIOD FOCUS:
{{NextPeriodFocus}}
\`\`\`

### Lessons Learned and Continuous Improvement

#### Risk Assessment Effectiveness
**Assessment Accuracy**:
- **Probability Accuracy**: {{ProbabilityAccuracy}}%
- **Impact Accuracy**: {{ImpactAccuracy}}%
- **Timeline Accuracy**: {{TimelineAccuracy}}%
- **Mitigation Effectiveness**: {{MitigationEffectiveness}}%

**Process Improvements**:
- **Identification Process**: {{IdentificationImprovements}}
- **Assessment Methods**: {{AssessmentImprovements}}
- **Mitigation Strategies**: {{MitigationImprovements}}
- **Monitoring Systems**: {{MonitoringImprovements}}

### Risk Assessment Checklist

#### Initial Risk Assessment
- [ ] **Risk Identification**: Comprehensive risk identification completed
- [ ] **Stakeholder Input**: Input gathered from all key stakeholders
- [ ] **Risk Categorization**: Risks properly categorized and documented
- [ ] **Probability Assessment**: Realistic probability assessments completed
- [ ] **Impact Analysis**: Thorough impact analysis for each risk
- [ ] **Risk Scoring**: Risk scores calculated and priorities assigned
- [ ] **Owner Assignment**: Risk owners assigned and acknowledged
- [ ] **Mitigation Planning**: Initial mitigation strategies defined

#### Ongoing Risk Management
- [ ] **Regular Reviews**: Risk register reviewed and updated regularly
- [ ] **Monitoring Systems**: Risk monitoring systems operational
- [ ] **Escalation Process**: Clear escalation process communicated
- [ ] **Mitigation Tracking**: Mitigation action progress tracked
- [ ] **Communication Plan**: Risk communication plan executed
- [ ] **Lessons Learned**: Risk lessons captured and applied
- [ ] **Process Improvement**: Risk management process continuously improved

This comprehensive risk assessment template ensures systematic identification, analysis, and management of project risks throughout the project lifecycle.`,
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
        content: `Map stakeholders with influence analysis, communication preferences, and engagement strategies.

# Stakeholder Analysis Template
## Stakeholder Identification and Engagement Planning

### Overview
This template provides a comprehensive framework for identifying, analyzing, and managing stakeholders throughout the project lifecycle to ensure successful project outcomes and strong stakeholder relationships.

### Stakeholder Identification Framework

#### Stakeholder Categories

##### Internal Stakeholders

**Executive Level**:
- **Project Sponsor**: {{SponsorName}} - {{SponsorRole}}
  - **Influence**: Very High
  - **Interest**: High  
  - **Power**: Budget approval, strategic decisions
  - **Expectations**: {{SponsorExpectations}}

- **Department Heads**: {{DepartmentHeads}}
  - **Influence**: High
  - **Interest**: Medium-High
  - **Power**: Resource allocation, process changes
  - **Expectations**: {{DepartmentExpectations}}

**Management Level**:
- **Product Manager**: {{ProductManagerName}}
  - **Influence**: High
  - **Interest**: Very High
  - **Power**: Feature prioritization, roadmap decisions
  - **Expectations**: {{ProductManagerExpectations}}

- **Engineering Manager**: {{EngineeringManagerName}}
  - **Influence**: High
  - **Interest**: High
  - **Power**: Technical decisions, team allocation
  - **Expectations**: {{EngineeringManagerExpectations}}

**Operational Level**:
- **Development Team**: {{DevelopmentTeam}}
  - **Influence**: Medium
  - **Interest**: High
  - **Power**: Implementation quality, timeline
  - **Expectations**: {{DevelopmentTeamExpectations}}

- **QA Team**: {{QATeam}}
  - **Influence**: Medium
  - **Interest**: High
  - **Power**: Quality standards, release approval
  - **Expectations**: {{QATeamExpectations}}

##### External Stakeholders

**Customer-Facing**:
- **End Users**: {{EndUserSegments}}
  - **Influence**: High (through usage patterns)
  - **Interest**: Very High
  - **Power**: Adoption, feedback, retention
  - **Expectations**: {{EndUserExpectations}}

- **Customer Support**: {{CustomerSupportTeam}}
  - **Influence**: Medium
  - **Interest**: High
  - **Power**: User experience insights
  - **Expectations**: {{CustomerSupportExpectations}}

**Business Partners**:
- **Vendors/Suppliers**: {{VendorsList}}
  - **Influence**: Medium
  - **Interest**: Medium
  - **Power**: Service delivery, integration support
  - **Expectations**: {{VendorExpectations}}

- **Integration Partners**: {{IntegrationPartners}}
  - **Influence**: Medium-High
  - **Interest**: Medium
  - **Power**: Technical compatibility, joint solutions
  - **Expectations**: {{PartnerExpectations}}

**Regulatory/Compliance**:
- **Compliance Officers**: {{ComplianceOfficers}}
  - **Influence**: High
  - **Interest**: Medium
  - **Power**: Regulatory approval, audit requirements
  - **Expectations**: {{ComplianceExpectations}}

### Stakeholder Analysis Matrix

#### Power-Interest Grid
\`\`\`
STAKEHOLDER POWER-INTEREST MATRIX

           INTEREST
           Low    Medium    High
POWER High | A  |   B    |   C
     Med   | D  |   E    |   F
     Low   | G  |   H    |   I

Engagement Strategy:
A (High Power, Low Interest): Keep Satisfied
B (High Power, Medium Interest): Manage Closely  
C (High Power, High Interest): Manage Closely
D (Medium Power, Low Interest): Monitor
E (Medium Power, Medium Interest): Keep Informed
F (Medium Power, High Interest): Keep Informed
G (Low Power, Low Interest): Monitor
H (Low Power, Medium Interest): Keep Informed
I (Low Power, High Interest): Keep Informed
\`\`\`

#### Detailed Stakeholder Assessment
\`\`\`
STAKEHOLDER PROFILE TEMPLATE

Name: {{StakeholderName}}
Role: {{StakeholderRole}}
Organization: {{StakeholderOrganization}}
Contact: {{StakeholderContact}}

INFLUENCE ASSESSMENT:
Power Level: {{PowerLevel}} (High/Medium/Low)
Interest Level: {{InterestLevel}} (High/Medium/Low)
Decision Authority: {{DecisionAuthority}}
Resource Control: {{ResourceControl}}
Network Influence: {{NetworkInfluence}}

ANALYSIS:
Primary Concerns: {{PrimaryConcerns}}
Success Criteria: {{SuccessCriteria}}
Potential Objections: {{PotentialObjections}}
Communication Preferences: {{CommunicationPreferences}}
Availability: {{Availability}}

RELATIONSHIP DYNAMICS:
Current Relationship: {{CurrentRelationship}}
Historical Context: {{HistoricalContext}}
Key Allies: {{KeyAllies}}
Potential Conflicts: {{PotentialConflicts}}

ENGAGEMENT APPROACH:
Strategy: {{EngagementStrategy}}
Frequency: {{CommunicationFrequency}}
Methods: {{CommunicationMethods}}
Key Messages: {{KeyMessages}}
\`\`\`

### Stakeholder Register

| Stakeholder | Power | Interest | Influence | Attitude | Engagement Strategy | Owner |
|-------------|-------|----------|-----------|----------|-------------------|-------|
| {{Stakeholder1}} | {{Power1}} | {{Interest1}} | {{Influence1}} | {{Attitude1}} | {{Strategy1}} | {{Owner1}} |
| {{Stakeholder2}} | {{Power2}} | {{Interest2}} | {{Influence2}} | {{Attitude2}} | {{Strategy2}} | {{Owner2}} |
| {{Stakeholder3}} | {{Power3}} | {{Interest3}} | {{Influence3}} | {{Attitude3}} | {{Strategy3}} | {{Owner3}} |

**Legend**:
- **Power**: H=High, M=Medium, L=Low
- **Interest**: H=High, M=Medium, L=Low
- **Influence**: H=High, M=Medium, L=Low
- **Attitude**: S=Supportive, N=Neutral, R=Resistant, U=Unknown

### Communication Planning

#### Communication Strategy by Stakeholder Group

##### High Power, High Interest (Key Players)
**Stakeholders**: {{KeyPlayerslist}}

**Communication Approach**:
- **Frequency**: Weekly or bi-weekly updates
- **Methods**: Face-to-face meetings, detailed reports, presentations
- **Content**: Comprehensive project status, risks, decisions needed
- **Timing**: Advance notice for major decisions, real-time for critical issues

**Sample Communication Plan**:
\`\`\`
WEEKLY EXECUTIVE UPDATE

To: {{ExecutiveStakeholders}}
From: {{ProjectManager}}
Subject: {{ProjectName}} - Week {{WeekNumber}} Update

EXECUTIVE SUMMARY:
Project Status: {{OverallStatus}}
Key Accomplishments: {{KeyAccomplishments}}
Upcoming Milestones: {{UpcomingMilestones}}
Critical Issues: {{CriticalIssues}}

METRICS DASHBOARD:
Schedule: {{ScheduleStatus}} ({{ScheduleVariance}})
Budget: {{BudgetStatus}} ({{BudgetVariance}})
Quality: {{QualityMetrics}}
Risk: {{RiskStatus}}

DECISIONS NEEDED:
1. {{Decision1}} - By {{DecisionDate1}}
2. {{Decision2}} - By {{DecisionDate2}}

NEXT WEEK PRIORITIES:
- {{Priority1}}
- {{Priority2}}
- {{Priority3}}
\`\`\`

##### Medium Power, High Interest (Keep Informed)
**Stakeholders**: {{MediumPowerStakeholders}}

**Communication Approach**:
- **Frequency**: Bi-weekly updates, milestone communications
- **Methods**: Email updates, team meetings, project dashboards
- **Content**: Progress updates, relevant changes, upcoming impacts
- **Timing**: Regular schedule with ad-hoc updates for significant changes

##### High Power, Low Interest (Keep Satisfied)
**Stakeholders**: {{HighPowerLowInterest}}

**Communication Approach**:
- **Frequency**: Monthly or milestone-based updates
- **Methods**: Executive summaries, brief presentations
- **Content**: High-level progress, major milestones, budget status
- **Timing**: Scheduled intervals with alerts for major issues

#### Communication Matrix
\`\`\`
COMMUNICATION RESPONSIBILITY MATRIX

                   Exec    PM     Eng    QA    Design  Users
Project Status     R,A     R,A    I      I     I       I
Technical Issues   I       R,A    R,A    C     I       -
Quality Metrics    C       R,A    I      R,A   I       I
Budget Updates     R,A     C      -      -     -       -
Schedule Changes   R,A     R,A    C      C     C       I
Release Plans      C       R,A    C      C     C       R,A

R = Responsible, A = Accountable, C = Consulted, I = Informed
\`\`\`

### Engagement Strategies

#### Building Stakeholder Support

**For Supporters**:
- **Leverage Influence**: Use their support to influence neutral or resistant stakeholders
- **Regular Updates**: Keep them informed to maintain their support
- **Recognition**: Acknowledge their contributions publicly
- **Feedback Loop**: Regularly seek their input and advice

**For Neutral Stakeholders**:
- **Education**: Provide clear information about project benefits
- **Address Concerns**: Proactively identify and address potential concerns
- **Quick Wins**: Demonstrate early value to build confidence
- **Personal Connection**: Understand their personal motivations and goals

**For Resistant Stakeholders**:
- **Root Cause Analysis**: Understand the source of resistance
- **Stakeholder Mapping**: Identify influencers who can help address resistance
- **Gradual Engagement**: Start with small, non-threatening interactions
- **Address Concerns**: Directly address their specific objections
- **Alternative Solutions**: Explore compromises or alternative approaches

#### Managing Difficult Stakeholders

**The Skeptic**:
- **Strategy**: Provide concrete evidence and data
- **Approach**: Acknowledge their concerns and provide detailed responses
- **Communication**: Use facts, metrics, and case studies
- **Timeline**: Allow time for them to process information

**The Busy Executive**:
- **Strategy**: Respect their time with concise, high-value communications
- **Approach**: Focus on business impact and strategic alignment
- **Communication**: Executive summaries, key decision points only
- **Timeline**: Work around their schedule, provide materials in advance

**The Detail-Oriented**:
- **Strategy**: Provide comprehensive documentation and analysis
- **Approach**: Be thorough and prepared for detailed questions
- **Communication**: Technical specifications, detailed project plans
- **Timeline**: Allow extra time for their review and questions

### Stakeholder Engagement Activities

#### Regular Engagement Activities

**Quarterly Stakeholder Reviews**:
- **Participants**: All key stakeholders
- **Duration**: 2-3 hours
- **Agenda**: 
  - Project progress review
  - Upcoming milestone preview
  - Risk and issue discussion
  - Feedback and input session
  - Q&A session

**Monthly Status Meetings**:
- **Participants**: Management-level stakeholders
- **Duration**: 1 hour
- **Format**: Presentation + discussion
- **Focus**: Progress, issues, decisions needed

**Sprint Reviews/Demos**:
- **Participants**: Product stakeholders, end users
- **Duration**: 1-2 hours
- **Format**: Live demonstration + feedback
- **Focus**: Feature functionality, user experience

#### Special Engagement Activities

**Stakeholder Workshops**:
- **Requirements Gathering**: {{RequirementsWorkshopPlan}}
- **Design Reviews**: {{DesignReviewPlan}}
- **User Acceptance**: {{UserAcceptancePlan}}
- **Go-Live Planning**: {{GoLivePlanningPlan}}

**One-on-One Meetings**:
- **Frequency**: Monthly or as needed
- **Purpose**: Address specific concerns, build relationships
- **Duration**: 30-60 minutes
- **Follow-up**: Action items and commitments documented

### Risk Management for Stakeholders

#### Stakeholder-Related Risks

**High-Risk Scenarios**:
1. **Key Stakeholder Departure**
   - **Risk**: Loss of support, knowledge, or decision-making authority
   - **Mitigation**: Identify backup stakeholders, document decisions, maintain relationships

2. **Conflicting Stakeholder Priorities**
   - **Risk**: Project paralysis, scope creep, team confusion
   - **Mitigation**: Clear escalation process, documented priorities, regular alignment sessions

3. **Stakeholder Disengagement**
   - **Risk**: Lack of input, late feedback, poor adoption
   - **Mitigation**: Regular check-ins, value demonstrations, addressing concerns

**Risk Monitoring**:
\`\`\`
STAKEHOLDER RISK INDICATORS

Engagement Level:
- Meeting attendance rates: {{AttendanceRate}}
- Response time to communications: {{ResponseTime}}
- Feedback quality and quantity: {{FeedbackQuality}}

Support Level:
- Public statements about project: {{PublicStatements}}
- Resource allocation decisions: {{ResourceDecisions}}
- Escalation patterns: {{EscalationPatterns}}

Communication Effectiveness:
- Clarity of requirements: {{RequirementsClarity}}
- Decision-making speed: {{DecisionSpeed}}
- Conflict resolution time: {{ConflictResolution}}
\`\`\`

### Measuring Stakeholder Engagement

#### Key Performance Indicators

**Engagement Metrics**:
- **Stakeholder Satisfaction Score**: {{SatisfactionScore}}/10
- **Communication Effectiveness**: {{CommunicationEffectiveness}}%
- **Decision Timeliness**: {{DecisionTimeliness}} days average
- **Issue Resolution Time**: {{IssueResolutionTime}} days average

**Participation Metrics**:
- **Meeting Attendance**: {{MeetingAttendance}}%
- **Feedback Response Rate**: {{FeedbackResponseRate}}%
- **Review Participation**: {{ReviewParticipation}}%

#### Stakeholder Feedback Collection

**Regular Surveys**:
\`\`\`
STAKEHOLDER SATISFACTION SURVEY

Project: {{ProjectName}}
Period: {{SurveyPeriod}}

Communication Effectiveness:
1. How would you rate the frequency of project communications?
   □ Too Frequent □ Just Right □ Too Infrequent

2. How would you rate the quality of information provided?
   □ Excellent □ Good □ Fair □ Poor

3. Are you receiving information in your preferred format?
   □ Yes □ No (please specify preferred format: _________)

Decision Making:
4. How satisfied are you with your level of involvement in decisions?
   □ Very Satisfied □ Satisfied □ Neutral □ Dissatisfied

5. Are project decisions being made in a timely manner?
   □ Always □ Usually □ Sometimes □ Rarely

Overall Satisfaction:
6. How would you rate your overall satisfaction with stakeholder management?
   1-10 scale: {{SatisfactionRating}}

7. What improvements would you suggest?
   {{SuggestionsFeedback}}
\`\`\`

### Continuous Improvement

#### Stakeholder Management Review Process

**Monthly Reviews**:
- Stakeholder register updates
- Engagement strategy effectiveness
- Communication plan adjustments
- Risk assessment updates

**Quarterly Assessments**:
- Comprehensive stakeholder analysis
- Relationship mapping updates
- Engagement strategy revisions
- Lessons learned documentation

**Project Retrospectives**:
- Stakeholder management effectiveness
- Communication success factors
- Relationship building outcomes
- Recommendations for future projects

This comprehensive stakeholder analysis template ensures systematic identification, analysis, and management of all project stakeholders for successful project outcomes and strong relationships.`,
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
        content: `Plan user experience research with user personas, testing scenarios, and feedback collection methods.

# UX Research Plan Template
## User Experience Research and Testing Framework

### Overview
This template provides a comprehensive framework for planning, conducting, and analyzing user experience research to inform design decisions and improve product usability.

### Research Objectives and Goals

#### Primary Research Questions
**Core Questions**:
1. **User Behavior**: {{UserBehaviorQuestion}}
2. **Usability Issues**: {{UsabilityQuestion}}  
3. **Feature Effectiveness**: {{FeatureEffectivenessQuestion}}
4. **User Satisfaction**: {{UserSatisfactionQuestion}}
5. **Accessibility**: {{AccessibilityQuestion}}

**Success Metrics**:
- **Task Completion Rate**: {{TaskCompletionTarget}}%
- **Task Success Time**: {{TaskTimeTarget}} seconds
- **Error Rate**: <{{ErrorRateTarget}}%
- **User Satisfaction**: {{SatisfactionTarget}}/10
- **System Usability Scale (SUS)**: {{SUSTarget}}+

#### Research Scope
**In Scope**:
- {{InScopeItem1}}
- {{InScopeItem2}}
- {{InScopeItem3}}

**Out of Scope**:
- {{OutOfScopeItem1}}
- {{OutOfScopeItem2}}
- {{OutOfScopeItem3}}

### User Research Strategy

#### Target Audience Analysis

##### Primary User Personas

**Persona 1: {{Persona1Name}}**
\`\`\`
PERSONA PROFILE

Demographics:
- Age: {{Persona1Age}}
- Role: {{Persona1Role}}
- Experience Level: {{Persona1Experience}}
- Location: {{Persona1Location}}

Goals:
- Primary: {{Persona1PrimaryGoal}}
- Secondary: {{Persona1SecondaryGoal}}
- Personal: {{Persona1PersonalGoal}}

Frustrations:
- {{Persona1Frustration1}}
- {{Persona1Frustration2}}
- {{Persona1Frustration3}}

Technology Comfort:
- Device Usage: {{Persona1DeviceUsage}}
- Technical Skills: {{Persona1TechnicalSkills}}
- Preferred Platforms: {{Persona1PreferredPlatforms}}

Behavioral Patterns:
- Usage Frequency: {{Persona1UsageFrequency}}
- Time Constraints: {{Persona1TimeConstraints}}
- Context of Use: {{Persona1ContextOfUse}}

Quote: "{{Persona1Quote}}"
\`\`\`

**Persona 2: {{Persona2Name}}**
\`\`\`
PERSONA PROFILE

Demographics:
- Age: {{Persona2Age}}
- Role: {{Persona2Role}}
- Experience Level: {{Persona2Experience}}
- Location: {{Persona2Location}}

Goals:
- Primary: {{Persona2PrimaryGoal}}
- Secondary: {{Persona2SecondaryGoal}}
- Personal: {{Persona2PersonalGoal}}

Frustrations:
- {{Persona2Frustration1}}
- {{Persona2Frustration2}}
- {{Persona2Frustration3}}

Technology Comfort:
- Device Usage: {{Persona2DeviceUsage}}
- Technical Skills: {{Persona2TechnicalSkills}}
- Preferred Platforms: {{Persona2PreferredPlatforms}}

Behavioral Patterns:
- Usage Frequency: {{Persona2UsageFrequency}}
- Time Constraints: {{Persona2TimeConstraints}}
- Context of Use: {{Persona2ContextOfUse}}

Quote: "{{Persona2Quote}}"
\`\`\`

##### User Segmentation
\`\`\`
USER SEGMENTATION MATRIX

Segment          | % of Users | Primary Needs        | Key Characteristics
-----------------|------------|---------------------|-------------------
{{Segment1}}     | {{Pct1}}%  | {{Needs1}}          | {{Characteristics1}}
{{Segment2}}     | {{Pct2}}%  | {{Needs2}}          | {{Characteristics2}}
{{Segment3}}     | {{Pct3}}%  | {{Needs3}}          | {{Characteristics3}}
{{Segment4}}     | {{Pct4}}%  | {{Needs4}}          | {{Characteristics4}}
\`\`\`

### Research Methodology

#### Mixed Methods Approach

##### Qualitative Research Methods

**User Interviews**
- **Purpose**: Deep understanding of user needs, motivations, and pain points
- **Participants**: {{InterviewParticipantCount}} users per persona
- **Duration**: {{InterviewDuration}} minutes per session
- **Format**: {{InterviewFormat}} (in-person/remote)
- **Recording**: {{RecordingMethod}}

**Interview Script Template**:
\`\`\`
INTERVIEW INTRODUCTION (5 minutes)
- Introduction and role explanation
- Consent for recording and data use
- Confidentiality assurance
- Overview of session structure

BACKGROUND QUESTIONS (10 minutes)
1. Can you tell me about your role and how you currently {{UserContext}}?
2. What tools or applications do you use most frequently?
3. What are your biggest challenges with {{RelevantDomain}}?

EXPERIENCE QUESTIONS (20 minutes)
4. Walk me through your typical workflow when {{SpecificTask}}.
5. What works well in your current process?
6. What frustrations do you encounter?
7. How do you currently handle {{SpecificScenario}}?

PRODUCT-SPECIFIC QUESTIONS (15 minutes)
8. [Demo/show prototype] What are your first impressions?
9. How would this fit into your current workflow?
10. What would make this more useful for you?

CLOSING (5 minutes)
- Any additional thoughts or questions?
- Thank you and next steps
\`\`\`

**Usability Testing**
- **Methodology**: {{UsabilityTestingMethod}}
- **Test Environment**: {{TestEnvironment}}
- **Tasks**: {{TaskCount}} core user tasks
- **Participants**: {{UsabilityParticipantCount}} per persona
- **Moderation**: {{ModerationStyle}}

##### Quantitative Research Methods

**User Surveys**
- **Sample Size**: {{SurveySampleSize}} participants
- **Distribution Method**: {{DistributionMethod}}
- **Response Target**: {{ResponseRateTarget}}% response rate
- **Timeline**: {{SurveyTimeline}}

**Analytics Review**
- **Current Metrics**: {{AnalyticsScope}}
- **Key Performance Indicators**: 
  - {{KPI1}}: {{KPI1Baseline}}
  - {{KPI2}}: {{KPI2Baseline}}
  - {{KPI3}}: {{KPI3Baseline}}
- **Analysis Period**: {{AnalysisPeriod}}

### Research Execution Plan

#### Phase 1: Discovery Research ({{Phase1Duration}})

**Week 1-2: Preparation**
- [ ] Finalize research questions and hypotheses
- [ ] Develop interview guides and survey instruments
- [ ] Recruit participants for interviews and usability testing
- [ ] Set up testing environment and tools
- [ ] Conduct pilot interviews and testing sessions

**Participant Recruitment**:
\`\`\`
RECRUITMENT CRITERIA

Primary Criteria (Must Have):
- {{PrimaryCriteria1}}
- {{PrimaryCriteria2}}
- {{PrimaryCriteria3}}

Secondary Criteria (Nice to Have):
- {{SecondaryCriteria1}}
- {{SecondaryCriteria2}}
- {{SecondaryCriteria3}}

Exclusion Criteria:
- {{ExclusionCriteria1}}
- {{ExclusionCriteria2}}
- {{ExclusionCriteria3}}

Compensation: {{ParticipantCompensation}}
\`\`\`

**Week 3-4: Data Collection**
- [ ] Conduct user interviews
- [ ] Deploy user surveys
- [ ] Analyze existing analytics data
- [ ] Document initial findings and patterns

#### Phase 2: Evaluative Research ({{Phase2Duration}})

**Week 1: Prototype Development**
- [ ] Create testable prototypes based on discovery insights
- [ ] Develop usability testing scenarios and tasks
- [ ] Prepare testing materials and consent forms
- [ ] Set up recording and analysis tools

**Usability Testing Scenarios**:
\`\`\`
SCENARIO 1: {{Scenario1Name}}
Context: {{Scenario1Context}}
Goal: {{Scenario1Goal}}
Tasks:
1. {{Task1Description}}
   Success Criteria: {{Task1Success}}
2. {{Task2Description}}
   Success Criteria: {{Task2Success}}
3. {{Task3Description}}
   Success Criteria: {{Task3Success}}

SCENARIO 2: {{Scenario2Name}}
Context: {{Scenario2Context}}
Goal: {{Scenario2Goal}}
Tasks:
1. {{Task4Description}}
   Success Criteria: {{Task4Success}}
2. {{Task5Description}}
   Success Criteria: {{Task5Success}}
\`\`\`

**Week 2-3: Testing Execution**
- [ ] Conduct moderated usability testing sessions
- [ ] Run unmoderated remote testing (if applicable)
- [ ] Collect System Usability Scale (SUS) scores
- [ ] Gather post-test feedback and satisfaction ratings

**Week 4: Analysis and Reporting**
- [ ] Analyze usability testing results
- [ ] Identify key usability issues and opportunities
- [ ] Prioritize findings based on severity and frequency
- [ ] Prepare recommendations and design implications

### Testing Scenarios and Tasks

#### Core User Journey Testing

**Journey 1: {{Journey1Name}}**
\`\`\`
USER STORY: As a {{UserType}}, I want to {{UserGoal}} so that {{UserBenefit}}.

TASK BREAKDOWN:
Task 1.1: {{Task1_1}}
- Expected Time: {{ExpectedTime1_1}} seconds
- Success Criteria: {{SuccessCriteria1_1}}
- Error Scenarios: {{ErrorScenarios1_1}}

Task 1.2: {{Task1_2}}
- Expected Time: {{ExpectedTime1_2}} seconds
- Success Criteria: {{SuccessCriteria1_2}}
- Error Scenarios: {{ErrorScenarios1_2}}

MEASUREMENT CRITERIA:
- Task Completion: {{TaskCompletionCriteria}}
- Task Efficiency: {{TaskEfficiencyCriteria}}
- User Satisfaction: {{UserSatisfactionCriteria}}
- Error Recovery: {{ErrorRecoveryCriteria}}
\`\`\`

#### Accessibility Testing

**Accessibility Scenarios**:
- **Screen Reader Navigation**: {{ScreenReaderScenario}}
- **Keyboard-Only Navigation**: {{KeyboardScenario}}
- **Color Blindness Simulation**: {{ColorBlindnessScenario}}
- **Mobile Accessibility**: {{MobileAccessibilityScenario}}

**WCAG 2.1 Checklist**:
- [ ] **Perceivable**: Text alternatives, captions, color contrast
- [ ] **Operable**: Keyboard accessible, timing, seizures
- [ ] **Understandable**: Readable, predictable, input assistance
- [ ] **Robust**: Compatible with assistive technologies

### Data Collection Framework

#### Quantitative Data Collection

**Performance Metrics**:
\`\`\`javascript
// Usability Testing Metrics Template
const usabilityMetrics = {
  taskCompletion: {
    task1: { completed: 0, total: 0, rate: 0 },
    task2: { completed: 0, total: 0, rate: 0 },
    task3: { completed: 0, total: 0, rate: 0 }
  },
  taskTime: {
    task1: { times: [], average: 0, median: 0 },
    task2: { times: [], average: 0, median: 0 },
    task3: { times: [], average: 0, median: 0 }
  },
  errors: {
    total: 0,
    byTask: { task1: 0, task2: 0, task3: 0 },
    byType: { navigation: 0, input: 0, comprehension: 0 }
  },
  satisfaction: {
    scores: [],
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }
};
\`\`\`

**Survey Questions**:
\`\`\`
POST-TASK QUESTIONNAIRE

Task Difficulty (1-7 scale):
1. How difficult was this task to complete?
   Very Easy [1] [2] [3] [4] [5] [6] [7] Very Difficult

Task Satisfaction (1-7 scale):
2. How satisfied were you with your ability to complete this task?
   Very Dissatisfied [1] [2] [3] [4] [5] [6] [7] Very Satisfied

OVERALL EXPERIENCE

System Usability Scale (SUS):
1. I think that I would like to use this system frequently.
   Strongly Disagree [1] [2] [3] [4] [5] Strongly Agree

2. I found the system unnecessarily complex.
   Strongly Disagree [1] [2] [3] [4] [5] Strongly Agree

[Continue with all 10 SUS questions...]

Net Promoter Score:
How likely are you to recommend this product to a friend or colleague?
0 [Not at all likely] ... 10 [Extremely likely]
\`\`\`

#### Qualitative Data Collection

**Observation Template**:
\`\`\`
USABILITY TESTING OBSERVATION SHEET

Participant: {{ParticipantID}}
Date: {{TestDate}}
Task: {{TaskName}}

BEHAVIORAL OBSERVATIONS:
Time Started: {{StartTime}}
Time Completed: {{EndTime}}
Task Completion: {{Completed/Partial/Failed}}

INTERACTION PATTERNS:
Navigation Approach: {{NavigationApproach}}
Search Behavior: {{SearchBehavior}}
Error Recovery: {{ErrorRecovery}}

VERBAL FEEDBACK:
Positive Comments: {{PositiveComments}}
Negative Comments: {{NegativeComments}}
Confusion Points: {{ConfusionPoints}}
Suggestions: {{UserSuggestions}}

EMOTIONAL INDICATORS:
Frustration Level: {{FrustrationLevel}}
Confidence Level: {{ConfidenceLevel}}
Overall Mood: {{OverallMood}}
\`\`\`

### Analysis and Reporting

#### Data Analysis Framework

**Quantitative Analysis**:
\`\`\`python
# Python script for usability metrics analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_usability_data(data):
    results = {}
    
    # Task completion analysis
    results['completion_rates'] = {
        task: (completed/total)*100 
        for task, (completed, total) in data['completion'].items()
    }
    
    # Task time analysis
    results['time_analysis'] = {
        task: {
            'mean': np.mean(times),
            'median': np.median(times),
            'std_dev': np.std(times)
        }
        for task, times in data['task_times'].items()
    }
    
    # Error analysis
    results['error_rates'] = {
        task: (errors/attempts)*100
        for task, (errors, attempts) in data['errors'].items()
    }
    
    # SUS score calculation
    sus_scores = data['sus_responses']
    results['sus_score'] = calculate_sus_score(sus_scores)
    
    return results

def calculate_sus_score(responses):
    # SUS scoring algorithm
    total = 0
    for i, response in enumerate(responses):
        if i % 2 == 0:  # Odd-numbered questions
            total += response - 1
        else:  # Even-numbered questions
            total += 5 - response
    
    return (total * 2.5)
\`\`\`

**Thematic Analysis for Qualitative Data**:
1. **Data Familiarization**: Read through all transcripts and notes
2. **Initial Coding**: Identify key themes and patterns
3. **Theme Development**: Group codes into meaningful themes
4. **Theme Refinement**: Review and refine theme definitions
5. **Reporting**: Present themes with supporting quotes

#### Research Findings Template

\`\`\`
UX RESEARCH FINDINGS REPORT

EXECUTIVE SUMMARY:
{{ExecutiveSummary}}

KEY INSIGHTS:
1. {{KeyInsight1}}
2. {{KeyInsight2}}
3. {{KeyInsight3}}

USABILITY METRICS:
- Overall Task Completion: {{OverallCompletion}}%
- Average Task Time: {{AverageTaskTime}} seconds
- Error Rate: {{OverallErrorRate}}%
- SUS Score: {{SUSScore}}/100
- User Satisfaction: {{UserSatisfaction}}/10

CRITICAL USABILITY ISSUES:
Issue 1: {{Issue1Title}}
- Severity: {{Issue1Severity}}
- Frequency: {{Issue1Frequency}}%
- Impact: {{Issue1Impact}}
- Recommendation: {{Issue1Recommendation}}

Issue 2: {{Issue2Title}}
- Severity: {{Issue2Severity}}
- Frequency: {{Issue2Frequency}}%
- Impact: {{Issue2Impact}}
- Recommendation: {{Issue2Recommendation}}

DESIGN OPPORTUNITIES:
1. {{Opportunity1}}
2. {{Opportunity2}}
3. {{Opportunity3}}

USER PERSONAS UPDATE:
{{PersonaUpdates}}

NEXT STEPS:
{{NextSteps}}
\`\`\`

### Implementation and Follow-up

#### Design Recommendations

**Priority Level 1 (Critical)**:
- {{P1Recommendation1}}
- {{P1Recommendation2}}
- {{P1Recommendation3}}

**Priority Level 2 (Important)**:
- {{P2Recommendation1}}
- {{P2Recommendation2}}
- {{P2Recommendation3}}

**Priority Level 3 (Nice to Have)**:
- {{P3Recommendation1}}
- {{P3Recommendation2}}
- {{P3Recommendation3}}

#### Success Measurement

**Pre/Post Comparison Metrics**:
- Task Completion Rate: {{PreCompletion}}% → Target: {{PostCompletion}}%
- Average Task Time: {{PreTime}}s → Target: {{PostTime}}s
- User Satisfaction: {{PreSatisfaction}}/10 → Target: {{PostSatisfaction}}/10
- Error Rate: {{PreErrors}}% → Target: {{PostErrors}}%

#### Continuous Research Plan

**Ongoing Research Activities**:
- **Monthly User Feedback**: {{MonthlyFeedbackPlan}}
- **Quarterly Usability Testing**: {{QuarterlyTestingPlan}}
- **Annual User Research**: {{AnnualResearchPlan}}
- **A/B Testing Program**: {{ABTestingProgram}}

This comprehensive UX research plan template ensures systematic user research that leads to actionable insights and improved user experiences.`,
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
