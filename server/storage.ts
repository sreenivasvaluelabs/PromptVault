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
