import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 DXP Extension - PRODUCTION VERSION ACTIVATING');
    
    // Show immediate activation proof
    vscode.window.showInformationMessage('🚀 DXP Extension Activated Successfully!');
    
    // CRITICAL: Register ALL commands FIRST, with bulletproof implementations
    console.log('📝 Registering commands with bulletproof handlers...');
    
    let promptManager: any = null; // Will be loaded later
    
    try {
        // 1. Test command - simplest possible
        const testCommand = vscode.commands.registerCommand('dxpPromptLibrary.test', () => {
            console.log('✅ TEST COMMAND EXECUTED');
            const status = promptManager ? 'with full PromptManager functionality' : 'in basic mode';
            vscode.window.showInformationMessage(`✅ DXP Extension is working perfectly ${status}! 🎉`);
        });
        context.subscriptions.push(testCommand);
        console.log('✅ Test command registered');

        // 2. Open Prompt Palette - with enhanced implementation using real prompt data
        const openPromptPalette = vscode.commands.registerCommand('dxpPromptLibrary.openPromptPalette', async () => {
            console.log('🎯 openPromptPalette executed');
            try {
                if (promptManager) {
                    await promptManager.openPromptPalette();
                } else {
                    // Enhanced implementation with real Sitecore Helix prompts
                    const prompts = [
                        {
                            label: '🏗️ Sitecore Helix: Create Foundation Module',
                            description: 'Generate a complete Foundation layer module with services and utilities',
                            detail: 'Creates foundation module structure, DI configuration, and base services'
                        },
                        {
                            label: '🎯 Sitecore Helix: Create Feature Module',
                            description: 'Generate a Feature layer module with controllers, models, and views',
                            detail: 'Creates feature module with MVC components and data templates'
                        },
                        {
                            label: '🚀 Sitecore Helix: Create Project Module',
                            description: 'Generate a Project layer module with site-specific implementations',
                            detail: 'Creates project module with site configuration and layouts'
                        },
                        {
                            label: '🎠 Sitecore Component: Carousel',
                            description: 'Generate responsive carousel component with accessibility features',
                            detail: 'Creates carousel with data templates, controllers, views, and TypeScript'
                        },
                        {
                            label: '📝 Sitecore Component: Custom Forms',
                            description: 'Generate dynamic form builder with validation and submission handling',
                            detail: 'Creates form component with validation, file upload, and GDPR compliance'
                        },
                        {
                            label: '🧭 Sitecore Component: Navigation',
                            description: 'Generate multi-level responsive navigation with breadcrumbs',
                            detail: 'Creates navigation with search integration and accessibility features'
                        }
                    ];
                    
                    const selected = await vscode.window.showQuickPick(prompts, {
                        placeHolder: 'Select a DXP prompt template',
                        matchOnDescription: true,
                        matchOnDetail: true
                    });
                    
                    if (selected) {
                        await generateSitecoreCode(selected.label, context);
                    }
                }
            } catch (error) {
                console.error('Error in openPromptPalette:', error);
                vscode.window.showErrorMessage(`Prompt Palette error: ${error}`);
            }
        });
        context.subscriptions.push(openPromptPalette);
        console.log('✅ Open Prompt Palette command registered');

        // 3. Insert Prompt - with enhanced implementation using prompt data
        const insertPrompt = vscode.commands.registerCommand('dxpPromptLibrary.insertPrompt', async () => {
            console.log('🎯 insertPrompt executed');
            try {
                if (promptManager) {
                    await promptManager.insertPromptAtCursor();
                } else {
                    // Enhanced implementation with real Sitecore prompts
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showWarningMessage('No active editor found');
                        return;
                    }
                    
                    const prompts = [
                        {
                            label: '🏗️ Foundation Service Interface',
                            snippet: `// Foundation service interface
public interface I{{ServiceName}}Service
{
    Task<{{ReturnType}}> {{MethodName}}Async({{Parameters}});
    void LogOperation(string operation, object data = null);
}`,
                            description: 'Creates a foundation layer service interface'
                        },
                        {
                            label: '🎯 Feature Controller Action',
                            snippet: `// Feature controller action
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
                            description: 'Creates a feature controller action with error handling'
                        },
                        {
                            label: '📝 Glass Mapper Model',
                            snippet: `// Glass Mapper model interface
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
                            description: 'Creates a Glass Mapper model interface'
                        },
                        {
                            label: '🎨 Razor View Template',
                            snippet: `@model {{Namespace}}.{{ViewModelName}}

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
                            description: 'Creates an accessible Razor view template'
                        },
                        {
                            label: '🧪 Unit Test Template',
                            snippet: `// Unit test for {{ComponentName}}
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
                            description: 'Creates a unit test with mocking setup'
                        },
                        {
                            label: '🎭 SCSS Component Styles',
                            snippet: `// {{ComponentName}} component styles (BEM methodology)
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
                            description: 'Creates responsive SCSS component styles'
                        }
                    ];
                    
                    const selected = await vscode.window.showQuickPick(prompts, {
                        placeHolder: 'Select code snippet to insert',
                        matchOnDescription: true
                    });
                    
                    if (selected) {
                        const position = editor.selection.active;
                        await editor.edit(editBuilder => {
                            editBuilder.insert(position, selected.snippet + '\n\n');
                        });
                        
                        vscode.window.showInformationMessage(`✅ Inserted ${selected.label} snippet!`);
                    }
                }
            } catch (error) {
                console.error('Error in insertPrompt:', error);
                vscode.window.showErrorMessage(`Insert Prompt error: ${error}`);
            }
        });
        context.subscriptions.push(insertPrompt);
        console.log('✅ Insert Prompt command registered');

        // 4. Search Prompts - with enhanced implementation using comprehensive search
        const searchPrompts = vscode.commands.registerCommand('dxpPromptLibrary.searchPrompts', async () => {
            console.log('🎯 searchPrompts executed');
            try {
                if (promptManager) {
                    await promptManager.searchPrompts();
                } else {
                    // Enhanced search implementation with comprehensive prompt database
                    const searchTerm = await vscode.window.showInputBox({
                        prompt: 'Search DXP prompts and templates',
                        placeHolder: 'Enter search term (e.g., "controller", "helix", "carousel", "testing")',
                        title: '🔍 DXP Prompt Search'
                    });
                    
                    if (searchTerm && searchTerm.trim()) {
                        const searchResults = await performPromptSearch(searchTerm.toLowerCase());
                        
                        if (searchResults.length === 0) {
                            vscode.window.showInformationMessage(`No prompts found for "${searchTerm}". Try terms like: controller, model, test, carousel, foundation`);
                            return;
                        }

                        const selected = await vscode.window.showQuickPick(searchResults, {
                            placeHolder: `Found ${searchResults.length} results for "${searchTerm}"`,
                            matchOnDescription: true,
                            matchOnDetail: true
                        });

                        if (selected) {
                            await handleSearchResult(selected, context);
                        }
                    }
                }
            } catch (error) {
                console.error('Error in searchPrompts:', error);
                vscode.window.showErrorMessage(`Search error: ${error}`);
            }
        });
        context.subscriptions.push(searchPrompts);
        console.log('✅ Search Prompts command registered');

        // 5. Filter by Component - with enhanced implementation using real data
        const filterByComponent = vscode.commands.registerCommand('dxpPromptLibrary.filterByComponent', async () => {
            console.log('🎯 filterByComponent executed');
            try {
                if (promptManager) {
                    await promptManager.filterByComponent();
                } else {
                    const components = [
                        {
                            label: '🏗️ Foundation',
                            description: 'Base services, utilities, and shared functionality',
                            detail: 'Logging, caching, configuration, dependency injection'
                        },
                        {
                            label: '🎯 Feature', 
                            description: 'Business logic components and functionality',
                            detail: 'Controllers, models, views, services specific to features'
                        },
                        {
                            label: '🚀 Project',
                            description: 'Site-specific implementations and configurations',
                            detail: 'Layouts, site settings, project-specific overrides'
                        },
                        {
                            label: '🎠 Components',
                            description: 'Reusable UI components (Carousel, Forms, Navigation)',
                            detail: 'Interactive components with data templates and styling'
                        },
                        {
                            label: '📊 Data Templates',
                            description: 'Sitecore data template definitions and serialization',
                            detail: 'Content types, field definitions, template inheritance'
                        },
                        {
                            label: '🎨 Frontend',
                            description: 'CSS/SCSS, TypeScript, and responsive design',
                            detail: 'Styling, JavaScript functionality, accessibility features'
                        },
                        {
                            label: '🧪 Testing',
                            description: 'Unit tests, integration tests, and test utilities',
                            detail: 'MSTest, mocking, test data builders, automation'
                        }
                    ];
                    
                    const selected = await vscode.window.showQuickPick(components, {
                        placeHolder: 'Filter prompts by Helix component type',
                        matchOnDescription: true,
                        matchOnDetail: true
                    });
                    
                    if (selected) {
                        await showComponentPrompts(selected.label);
                    }
                }
            } catch (error) {
                console.error('Error in filterByComponent:', error);
                vscode.window.showErrorMessage(`Filter error: ${error}`);
            }
        });
        context.subscriptions.push(filterByComponent);
        console.log('✅ Filter by Component command registered');

        // 6. Filter by SDLC - with enhanced implementation using comprehensive SDLC stages
        const filterBySDLC = vscode.commands.registerCommand('dxpPromptLibrary.filterBySDLC', async () => {
            console.log('🎯 filterBySDLC executed');
            try {
                if (promptManager) {
                    await promptManager.filterBySDLCStage();
                } else {
                    // Enhanced SDLC implementation with comprehensive stages and practices
                    const stages = [
                        {
                            label: '📋 Planning & Analysis',
                            description: 'Requirements gathering, architecture design, and project planning',
                            detail: 'User stories, technical specifications, architecture diagrams, project setup'
                        },
                        {
                            label: '💻 Development & Implementation',
                            description: 'Coding, component development, and feature implementation',
                            detail: 'Controllers, models, views, services, data templates, frontend components'
                        },
                        {
                            label: '🧪 Testing & Quality Assurance',
                            description: 'Unit testing, integration testing, and quality validation',
                            detail: 'Unit tests, integration tests, E2E tests, performance testing, security testing'
                        },
                        {
                            label: '🚀 Deployment & DevOps',
                            description: 'CI/CD pipelines, deployment automation, and environment management',
                            detail: 'Azure DevOps, PowerShell scripts, environment configuration, monitoring'
                        },
                        {
                            label: '🔧 Maintenance & Support',
                            description: 'Monitoring, troubleshooting, optimization, and ongoing support',
                            detail: 'Performance monitoring, log analysis, security updates, documentation'
                        },
                        {
                            label: '📈 Optimization & Enhancement',
                            description: 'Performance tuning, feature enhancements, and continuous improvement',
                            detail: 'Performance optimization, A/B testing, user feedback, feature expansion'
                        }
                    ];
                    
                    const selected = await vscode.window.showQuickPick(stages, {
                        placeHolder: 'Filter prompts by SDLC stage',
                        matchOnDescription: true,
                        matchOnDetail: true
                    });
                    
                    if (selected) {
                        await showSDLCPrompts(selected.label);
                    }
                }
            } catch (error) {
                console.error('Error in filterBySDLC:', error);
                vscode.window.showErrorMessage(`SDLC filter error: ${error}`);
            }
        });
        context.subscriptions.push(filterBySDLC);
        console.log('✅ Filter by SDLC command registered');

        console.log('🎉 ALL 6 COMMANDS REGISTERED SUCCESSFULLY!');
        
        // Immediate verification
        setTimeout(() => {
            vscode.commands.getCommands(true).then(commands => {
                const dxpCommands = commands.filter(cmd => cmd.startsWith('dxpPromptLibrary'));
                console.log(`🔍 Verification: ${dxpCommands.length}/6 DXP commands found`);
                console.log('📋 Found commands:', dxpCommands);
                
                if (dxpCommands.length === 6) {
                    console.log('✅ All commands verified in command registry');
                } else {
                    console.warn(`⚠️ Only ${dxpCommands.length}/6 commands found in registry`);
                }
            });
        }, 500);
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR during command registration:', error);
        vscode.window.showErrorMessage(`Extension activation failed: ${error}`);
    }
    
    // Helper function to generate Sitecore code
    async function generateSitecoreCode(templateType: string, context: vscode.ExtensionContext) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                // Create new file if no editor is open
                const doc = await vscode.workspace.openTextDocument({
                    content: '',
                    language: 'csharp'
                });
                await vscode.window.showTextDocument(doc);
            }
            
            let codeTemplate = '';
            let fileName = '';
            
            switch (templateType) {
                case '🏗️ Sitecore Helix: Create Foundation Module':
                    codeTemplate = generateFoundationModule();
                    fileName = 'FoundationModule.cs';
                    break;
                case '🎯 Sitecore Helix: Create Feature Module':
                    codeTemplate = generateFeatureModule();
                    fileName = 'FeatureModule.cs';
                    break;
                case '🚀 Sitecore Helix: Create Project Module':
                    codeTemplate = generateProjectModule();
                    fileName = 'ProjectModule.cs';
                    break;
                case '🎠 Sitecore Component: Carousel':
                    codeTemplate = generateCarouselComponent();
                    fileName = 'CarouselController.cs';
                    break;
                case '📝 Sitecore Component: Custom Forms':
                    codeTemplate = generateCustomFormsComponent();
                    fileName = 'CustomFormsController.cs';
                    break;
                case '🧭 Sitecore Component: Navigation':
                    codeTemplate = generateNavigationComponent();
                    fileName = 'NavigationController.cs';
                    break;
                default:
                    codeTemplate = '// Selected template: ' + templateType + '\n// Code generation coming soon!';
            }
            
            // Insert the generated code
            const currentEditor = vscode.window.activeTextEditor;
            if (currentEditor) {
                const position = currentEditor.selection.active;
                await currentEditor.edit(editBuilder => {
                    editBuilder.insert(position, codeTemplate);
                });
                
                vscode.window.showInformationMessage(`✅ Generated ${fileName} - Sitecore Helix code ready!`);
            }
            
        } catch (error) {
            console.error('Error generating code:', error);
            vscode.window.showErrorMessage(`Code generation error: ${error}`);
        }
    }

    // Helper function to show component-specific prompts
    async function showComponentPrompts(componentType: string) {
        const prompts: { [key: string]: any[] } = {
            '🏗️ Foundation': [
                { label: 'Service Interface', description: 'Create foundation service interface with DI' },
                { label: 'Logging Service', description: 'Implement logging service with Sitecore.Diagnostics' },
                { label: 'Cache Service', description: 'Create caching service with Sitecore cache' },
                { label: 'Configuration Service', description: 'Build configuration service for settings' },
                { label: 'DI Configuration', description: 'Set up dependency injection configuration' }
            ],
            '🎯 Feature': [
                { label: 'Controller Action', description: 'Create feature controller with error handling' },
                { label: 'View Model', description: 'Build view model with validation' },
                { label: 'Glass Mapper Model', description: 'Create Glass Mapper interface for data template' },
                { label: 'Service Layer', description: 'Implement feature-specific service' },
                { label: 'Razor View', description: 'Create accessible Razor view template' }
            ],
            '🚀 Project': [
                { label: 'Site Controller', description: 'Create project-specific site controller' },
                { label: 'Layout View', description: 'Build main layout view for site' },
                { label: 'Site Configuration', description: 'Configure site settings and multi-site setup' },
                { label: 'Global Navigation', description: 'Implement site-wide navigation components' },
                { label: 'Asset Pipeline', description: 'Set up CSS/JS bundling and optimization' }
            ],
            '🎠 Components': [
                { label: 'Carousel Component', description: 'Generate responsive carousel with accessibility' },
                { label: 'Form Component', description: 'Create dynamic form builder with validation' },
                { label: 'Navigation Component', description: 'Build multi-level responsive navigation' },
                { label: 'Search Component', description: 'Implement search with auto-complete' },
                { label: 'Media Gallery', description: 'Create responsive image/video gallery' }
            ],
            '📊 Data Templates': [
                { label: 'Base Template', description: 'Create base template with common fields' },
                { label: 'Content Template', description: 'Build content template with rich text and media' },
                { label: 'Settings Template', description: 'Create configuration/settings template' },
                { label: 'Template Serialization', description: 'Generate serialization files for TDS/Unicorn' },
                { label: 'Template Validation', description: 'Add field validation and business rules' }
            ],
            '🎨 Frontend': [
                { label: 'SCSS Component', description: 'Create component styles with BEM methodology' },
                { label: 'TypeScript Module', description: 'Build TypeScript module for interactivity' },
                { label: 'Responsive Grid', description: 'Implement CSS Grid/Flexbox layout system' },
                { label: 'Accessibility Features', description: 'Add ARIA labels and keyboard navigation' },
                { label: 'Animation Library', description: 'Create CSS animations and transitions' }
            ],
            '🧪 Testing': [
                { label: 'Unit Test', description: 'Create unit test with mocking setup' },
                { label: 'Integration Test', description: 'Build integration test for Sitecore components' },
                { label: 'Test Data Builder', description: 'Create test data builder pattern' },
                { label: 'Mock Configuration', description: 'Set up mocking for Sitecore context' },
                { label: 'E2E Test', description: 'Create end-to-end test with Selenium' }
            ]
        };

        const componentPrompts = prompts[componentType] || [];
        
        if (componentPrompts.length === 0) {
            vscode.window.showInformationMessage(`No specific prompts available for ${componentType} yet.`);
            return;
        }

        const selected = await vscode.window.showQuickPick(componentPrompts, {
            placeHolder: `Select ${componentType} prompt template`,
            matchOnDescription: true
        });

        if (selected) {
            await insertComponentSnippet(selected, componentType);
        }
    }
    
    // Helper function to insert component-specific code snippets
    async function insertComponentSnippet(selected: any, componentType: string) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                const doc = await vscode.workspace.openTextDocument({
                    content: '',
                    language: 'csharp'
                });
                await vscode.window.showTextDocument(doc);
            }

            const snippets = getComponentSnippets();
            const key = `${componentType}-${selected.label}`;
            const snippet = snippets[key] || snippets[selected.label] || `// ${selected.label} implementation\n// Generated for ${componentType}`;

            const currentEditor = vscode.window.activeTextEditor;
            if (currentEditor) {
                const position = currentEditor.selection.active;
                await currentEditor.edit(editBuilder => {
                    editBuilder.insert(position, snippet + '\n\n');
                });
                
                vscode.window.showInformationMessage(`✅ Inserted ${selected.label} code snippet for ${componentType}!`);
            }
        } catch (error) {
            console.error('Error inserting component snippet:', error);
            vscode.window.showErrorMessage(`Error inserting snippet: ${error}`);
        }
    }

    // Component-specific code snippets
    function getComponentSnippets(): { [key: string]: string } {
        return {
            // Foundation Layer Snippets
            'Service Interface': `// Foundation service interface
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

            'Logging Service': `// Foundation logging service implementation
public interface IAdvancedLoggingService : Foundation.YourModule.ILoggingService
{
    void LogPerformance(string operation, TimeSpan duration);
    void LogUserAction(string userId, string action, object context = null);
    void LogSecurityEvent(string eventType, string details);
}

public class AdvancedLoggingService : IAdvancedLoggingService
{
    private readonly ILogger<AdvancedLoggingService> _logger;

    public AdvancedLoggingService(ILogger<AdvancedLoggingService> logger)
    {
        _logger = logger;
    }

    public void LogError(string message, Exception exception = null)
    {
        _logger.LogError(exception, message);
        Sitecore.Diagnostics.Log.Error(message, exception, this);
    }

    public void LogInformation(string message)
    {
        _logger.LogInformation(message);
        Sitecore.Diagnostics.Log.Info(message, this);
    }

    public void LogWarning(string message)
    {
        _logger.LogWarning(message);
        Sitecore.Diagnostics.Log.Warn(message, this);
    }

    public void LogPerformance(string operation, TimeSpan duration)
    {
        _logger.LogInformation("Performance: {Operation} completed in {Duration}ms", 
            operation, duration.TotalMilliseconds);
    }

    public void LogUserAction(string userId, string action, object context = null)
    {
        _logger.LogInformation("User Action: {UserId} performed {Action} with context {@Context}", 
            userId, action, context);
    }

    public void LogSecurityEvent(string eventType, string details)
    {
        _logger.LogWarning("Security Event: {EventType} - {Details}", eventType, details);
    }
}`,

            'Cache Service': `// Foundation cache service with advanced features
public interface IAdvancedCacheService : Foundation.YourModule.ICacheService
{
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class;
    void InvalidatePattern(string pattern);
    ICacheStatistics GetStatistics();
}

public class AdvancedCacheService : IAdvancedCacheService
{
    private readonly Sitecore.Caching.Cache _cache;
    private readonly ILogger<AdvancedCacheService> _logger;

    public AdvancedCacheService(ILogger<AdvancedCacheService> logger)
    {
        _logger = logger;
        _cache = Sitecore.Caching.CacheManager.GetNamedInstance("Foundation.AdvancedCache", 
            StringUtil.ParseSizeString("50MB"));
    }

    public T Get<T>(string key) where T : class
    {
        return _cache.GetValue(key) as T;
    }

    public void Set<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        var expirationTime = expiration ?? TimeSpan.FromHours(1);
        _cache.Add(key, value, DateTime.UtcNow.Add(expirationTime));
        _logger.LogDebug("Cache set: {Key} expires in {Expiration}", key, expirationTime);
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
        _logger.LogDebug("Cache removed: {Key}", key);
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class
    {
        var cached = Get<T>(key);
        if (cached != null) return cached;

        var value = await factory();
        if (value != null)
        {
            Set(key, value, expiration);
        }
        return value;
    }

    public void InvalidatePattern(string pattern)
    {
        var keysToRemove = new List<string>();
        foreach (var key in _cache.GetCacheKeys())
        {
            if (key.ToString().Contains(pattern))
            {
                keysToRemove.Add(key.ToString());
            }
        }

        foreach (var key in keysToRemove)
        {
            _cache.Remove(key);
        }
        
        _logger.LogInformation("Invalidated {Count} cache entries matching pattern: {Pattern}", 
            keysToRemove.Count, pattern);
    }

    public ICacheStatistics GetStatistics()
    {
        return new CacheStatistics
        {
            Count = _cache.Count,
            Size = _cache.Size,
            MaxSize = _cache.MaxSize,
            HitRatio = _cache.HitRatio
        };
    }
}

public interface ICacheStatistics
{
    long Count { get; }
    long Size { get; }
    long MaxSize { get; }
    double HitRatio { get; }
}

public class CacheStatistics : ICacheStatistics
{
    public long Count { get; set; }
    public long Size { get; set; }
    public long MaxSize { get; set; }
    public double HitRatio { get; set; }
}`,

            'Configuration Service': `// Foundation configuration service with environment support
public interface IConfigurationService
{
    T GetValue<T>(string key, T defaultValue = default(T));
    string GetConnectionString(string name);
    bool IsFeatureEnabled(string featureName);
    IConfigurationSection GetSection(string sectionName);
    void RefreshConfiguration();
}

public class ConfigurationService : IConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ConfigurationService> _logger;
    private readonly IMemoryCache _cache;

    public ConfigurationService(
        IConfiguration configuration, 
        ILogger<ConfigurationService> logger,
        IMemoryCache cache)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger;
        _cache = cache;
    }

    public T GetValue<T>(string key, T defaultValue = default(T))
    {
        try
        {
            var cacheKey = $"config:{key}";
            if (_cache.TryGetValue(cacheKey, out T cachedValue))
            {
                return cachedValue;
            }

            var value = _configuration.GetValue<T>(key, defaultValue);
            _cache.Set(cacheKey, value, TimeSpan.FromMinutes(30));
            
            _logger.LogDebug("Configuration value retrieved: {Key} = {Value}", key, value);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving configuration value for key: {Key}", key);
            return defaultValue;
        }
    }

    public string GetConnectionString(string name)
    {
        var connectionString = _configuration.GetConnectionString(name);
        if (string.IsNullOrEmpty(connectionString))
        {
            _logger.LogWarning("Connection string not found: {Name}", name);
        }
        return connectionString;
    }

    public bool IsFeatureEnabled(string featureName)
    {
        var key = $"Features:{featureName}:Enabled";
        return GetValue<bool>(key, false);
    }

    public IConfigurationSection GetSection(string sectionName)
    {
        return _configuration.GetSection(sectionName);
    }

    public void RefreshConfiguration()
    {
        if (_configuration is IConfigurationRoot configRoot)
        {
            configRoot.Reload();
            _cache.Remove("config:*"); // Clear cached configuration values
            _logger.LogInformation("Configuration refreshed");
        }
    }
}

// Configuration extensions for Sitecore
public static class SitecoreConfigurationExtensions
{
    public static string GetSitecoreConnectionString(this IConfigurationService configService)
    {
        return configService.GetConnectionString("Sitecore.ConnectionStrings.Core");
    }

    public static string GetSitecoreLicense(this IConfigurationService configService)
    {
        return configService.GetValue<string>("Sitecore.Licensing.LicenseFile");
    }

    public static bool IsPublishingEnabled(this IConfigurationService configService)
    {
        return configService.IsFeatureEnabled("Publishing");
    }
}`,

            'DI Configuration': `// Foundation dependency injection configuration
public class FoundationServicesConfigurator
{
    public static void ConfigureServices(IServiceCollection services)
    {
        // Register foundation services
        services.AddScoped<IConfigurationService, ConfigurationService>();
        services.AddScoped<IAdvancedLoggingService, AdvancedLoggingService>();
        services.AddScoped<IAdvancedCacheService, AdvancedCacheService>();
        
        // Add performance monitoring
        services.AddScoped<IPerformanceMonitor, PerformanceMonitor>();
        
        // Add health checks
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database")
            .AddCheck<SitecoreHealthCheck>("sitecore");
            
        // Add memory cache
        services.AddMemoryCache();
        
        // Add HTTP client factory
        services.AddHttpClient();
        
        // Register configuration validators
        services.AddScoped<IConfigurationValidator, ConfigurationValidator>();
    }
}

// Sitecore DI extensions
public static class SitecoreDependencyExtensions
{
    public static void AddSitecoreFoundationServices(this IServiceContainer container)
    {
        container.Register<IConfigurationService, ConfigurationService>(Lifestyle.Singleton);
        container.Register<IAdvancedLoggingService, AdvancedLoggingService>(Lifestyle.Singleton);
        container.Register<IAdvancedCacheService, AdvancedCacheService>(Lifestyle.Singleton);
    }
}

// Service registration attribute for automatic discovery
[ServiceRegistration(typeof(IConfigurationService), Lifetime = ServiceLifetime.Singleton)]
public class ConfigurationServiceRegistration : IServicesConfigurator
{
    public void Configure(IServiceCollection serviceCollection)
    {
        serviceCollection.AddSingleton<IConfigurationService, ConfigurationService>();
    }
}`,

            // Feature Layer Snippets
            'Controller Action': `// Feature controller action with comprehensive error handling
[HttpGet]
public ActionResult {{ActionName}}()
{
    using var activity = Activity.StartActivity("{{ActionName}}");
    
    try
    {
        var datasource = GetDatasource<I{{ModelName}}>();
        if (datasource == null)
        {
            _loggingService.LogWarning("No datasource found for {{ActionName}}");
            return View(new {{ViewModelName}}(null));
        }

        var viewModel = new {{ViewModelName}}(datasource)
        {
            // Add any additional properties
            IsEditMode = Sitecore.Context.PageMode.IsExperienceEditor,
            CurrentLanguage = Sitecore.Context.Language.Name
        };
        
        _loggingService.LogInformation("{{ActionName}} rendered for item: {ItemId}", datasource.Id);
        return View(viewModel);
    }
    catch (Exception ex)
    {
        _loggingService.LogError("Error rendering {{ActionName}}", ex);
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        return View(new {{ViewModelName}}(null));
    }
}

[HttpPost]
[ValidateAntiForgeryToken]
public async Task<ActionResult> {{ActionName}}Post({{PostModelName}} model)
{
    if (!ModelState.IsValid)
    {
        return Json(new { success = false, errors = GetModelErrors() });
    }

    try
    {
        // Process the post data
        var result = await _{{serviceName}}.ProcessAsync(model);
        
        return Json(new { success = true, data = result });
    }
    catch (Exception ex)
    {
        _loggingService.LogError("Error processing {{ActionName}} post", ex);
        return Json(new { success = false, message = "An error occurred processing your request." });
    }
}

private string[] GetModelErrors()
{
    return ModelState.Values
        .SelectMany(v => v.Errors)
        .Select(e => e.ErrorMessage)
        .ToArray();
}`,

            'View Model': `// Feature view model with validation and display logic
public class {{ViewModelName}}
{
    public I{{ModelName}} Datasource { get; }
    public bool HasContent => Datasource != null && !string.IsNullOrEmpty(Datasource.{{PrimaryField}});
    public bool IsEditMode { get; set; }
    public string CurrentLanguage { get; set; }

    // Computed properties
    public string DisplayTitle => Datasource?.{{TitleField}} ?? Datasource?.DisplayName ?? "Untitled";
    public string SafeDescription => !string.IsNullOrEmpty(Datasource?.{{DescriptionField}}) 
        ? Datasource.{{DescriptionField}} 
        : "No description available";

    public {{ViewModelName}}(I{{ModelName}} datasource)
    {
        Datasource = datasource;
    }

    // Helper methods
    public string GetImageUrl(int maxWidth = 0, int maxHeight = 0)
    {
        if (Datasource?.{{ImageField}} == null) return string.Empty;
        
        var image = Datasource.{{ImageField}};
        if (maxWidth > 0 || maxHeight > 0)
        {
            var parameters = new NameValueCollection();
            if (maxWidth > 0) parameters["mw"] = maxWidth.ToString();
            if (maxHeight > 0) parameters["mh"] = maxHeight.ToString();
            
            return MediaManager.GetMediaUrl(image.MediaItem, parameters);
        }
        
        return image.Src;
    }

    public string GetLinkUrl()
    {
        if (Datasource?.{{LinkField}} == null) return "#";
        
        return Datasource.{{LinkField}}.Url;
    }

    public string GetLinkTarget()
    {
        if (Datasource?.{{LinkField}} == null) return "";
        
        return Datasource.{{LinkField}}.Target;
    }

    public bool HasValidLink()
    {
        return Datasource?.{{LinkField}} != null && 
               !string.IsNullOrEmpty(Datasource.{{LinkField}}.Url) &&
               Datasource.{{LinkField}}.Url != "#";
    }
}`,

            'Glass Mapper Model': `// Glass Mapper model with comprehensive field mapping
[SitecoreType(TemplateId = "{{{TemplateId}}}", AutoMap = true)]
public interface I{{ModelName}}
{
    [SitecoreId]
    Guid Id { get; set; }

    [SitecoreInfo(SitecoreInfoType.DisplayName)]
    string DisplayName { get; set; }

    [SitecoreInfo(SitecoreInfoType.Name)]
    string Name { get; set; }

    [SitecoreInfo(SitecoreInfoType.Url)]
    string Url { get; set; }

    [SitecoreInfo(SitecoreInfoType.Path)]
    string Path { get; set; }

    [SitecoreField("{{TitleFieldName}}")]
    string {{TitleProperty}} { get; set; }

    [SitecoreField("{{DescriptionFieldName}}")]
    string {{DescriptionProperty}} { get; set; }

    [SitecoreField("{{ImageFieldName}}")]
    Glass.Mapper.Sc.Fields.Image {{ImageProperty}} { get; set; }

    [SitecoreField("{{LinkFieldName}}")]
    Glass.Mapper.Sc.Fields.Link {{LinkProperty}} { get; set; }

    [SitecoreField("{{DateFieldName}}")]
    DateTime {{DateProperty}} { get; set; }

    [SitecoreField("{{CheckboxFieldName}}")]
    bool {{CheckboxProperty}} { get; set; }

    [SitecoreField("{{NumberFieldName}}")]
    float {{NumberProperty}} { get; set; }

    [SitecoreField("{{MultilistFieldName}}")]
    IEnumerable<I{{RelatedModelName}}> {{MultilistProperty}} { get; set; }

    [SitecoreField("{{DroplinkFieldName}}")]
    I{{RelatedModelName}} {{DroplinkProperty}} { get; set; }

    [SitecoreParent]
    I{{ParentModelName}} Parent { get; set; }

    [SitecoreChildren]
    IEnumerable<I{{ChildModelName}}> Children { get; set; }
}

// Concrete implementation for testing
public class {{ModelName}} : I{{ModelName}}
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; }
    public string Name { get; set; }
    public string Url { get; set; }
    public string Path { get; set; }
    public string {{TitleProperty}} { get; set; }
    public string {{DescriptionProperty}} { get; set; }
    public Glass.Mapper.Sc.Fields.Image {{ImageProperty}} { get; set; }
    public Glass.Mapper.Sc.Fields.Link {{LinkProperty}} { get; set; }
    public DateTime {{DateProperty}} { get; set; }
    public bool {{CheckboxProperty}} { get; set; }
    public float {{NumberProperty}} { get; set; }
    public IEnumerable<I{{RelatedModelName}}> {{MultilistProperty}} { get; set; }
    public I{{RelatedModelName}} {{DroplinkProperty}} { get; set; }
    public I{{ParentModelName}} Parent { get; set; }
    public IEnumerable<I{{ChildModelName}}> Children { get; set; }
}`,

            'Service Layer': `// Feature service layer implementation
public interface I{{ServiceName}}Service
{
    Task<{{ModelName}}ViewModel> GetViewModelAsync(I{{ModelName}} datasource);
    Task<IEnumerable<{{ModelName}}ViewModel>> GetListAsync(int pageSize = 10, int pageNumber = 1);
    Task<{{ServiceName}}Result> ProcessAsync({{ServiceName}}Request request);
    Task<bool> ValidateAsync({{ModelName}}ViewModel model);
}

public class {{ServiceName}}Service : I{{ServiceName}}Service
{
    private readonly ISitecoreContext _sitecoreContext;
    private readonly ILoggingService _loggingService;
    private readonly ICacheService _cacheService;
    private readonly IMapper _mapper;

    public {{ServiceName}}Service(
        ISitecoreContext sitecoreContext,
        ILoggingService loggingService,
        ICacheService cacheService,
        IMapper mapper)
    {
        _sitecoreContext = sitecoreContext;
        _loggingService = loggingService;
        _cacheService = cacheService;
        _mapper = mapper;
    }

    public async Task<{{ModelName}}ViewModel> GetViewModelAsync(I{{ModelName}} datasource)
    {
        if (datasource == null)
        {
            _loggingService.LogWarning("{{ServiceName}}: Null datasource provided");
            return new {{ModelName}}ViewModel();
        }

        try
        {
            var cacheKey = $"{{ServiceName}}:{datasource.Id}";
            var cached = _cacheService.Get<{{ModelName}}ViewModel>(cacheKey);
            if (cached != null)
            {
                return cached;
            }

            var viewModel = _mapper.Map<{{ModelName}}ViewModel>(datasource);
            
            // Add additional business logic
            await EnrichViewModelAsync(viewModel, datasource);
            
            _cacheService.Set(cacheKey, viewModel, TimeSpan.FromMinutes(30));
            _loggingService.LogInformation("{{ServiceName}}: ViewModel created for item {ItemId}", datasource.Id);
            
            return viewModel;
        }
        catch (Exception ex)
        {
            _loggingService.LogError("{{ServiceName}}: Error creating view model", ex);
            return new {{ModelName}}ViewModel();
        }
    }

    public async Task<IEnumerable<{{ModelName}}ViewModel>> GetListAsync(int pageSize = 10, int pageNumber = 1)
    {
        try
        {
            var items = _sitecoreContext.QuerySingle<I{{ModelName}}>("fast:/sitecore/content//*[@@templateid='{{{TEMPLATE-ID}}}']")
                ?.Children?.OfType<I{{ModelName}}>()
                ?.Where(item => item.{{PropertyName}} != null)
                ?.Skip((pageNumber - 1) * pageSize)
                ?.Take(pageSize)
                ?? Enumerable.Empty<I{{ModelName}}>();

            var viewModels = new List<{{ModelName}}ViewModel>();
            foreach (var item in items)
            {
                var vm = await GetViewModelAsync(item);
                viewModels.Add(vm);
            }

            return viewModels;
        }
        catch (Exception ex)
        {
            _loggingService.LogError("{{ServiceName}}: Error getting list", ex);
            return Enumerable.Empty<{{ModelName}}ViewModel>();
        }
    }

    public async Task<{{ServiceName}}Result> ProcessAsync({{ServiceName}}Request request)
    {
        try
        {
            // Validate request
            var validationResult = await ValidateRequestAsync(request);
            if (!validationResult.IsValid)
            {
                return new {{ServiceName}}Result
                {
                    Success = false,
                    Errors = validationResult.Errors
                };
            }

            // Process the request
            var result = await ExecuteBusinessLogicAsync(request);
            
            _loggingService.LogInformation("{{ServiceName}}: Request processed successfully");
            return result;
        }
        catch (Exception ex)
        {
            _loggingService.LogError("{{ServiceName}}: Error processing request", ex);
            return new {{ServiceName}}Result
            {
                Success = false,
                Errors = new[] { "An error occurred processing your request." }
            };
        }
    }

    public async Task<bool> ValidateAsync({{ModelName}}ViewModel model)
    {
        if (model == null) return false;

        // Add custom validation logic
        var validationErrors = new List<string>();
        
        if (string.IsNullOrEmpty(model.{{PropertyName}}))
        {
            validationErrors.Add("{{PropertyName}} is required");
        }

        return validationErrors.Count == 0;
    }

    private async Task EnrichViewModelAsync({{ModelName}}ViewModel viewModel, I{{ModelName}} datasource)
    {
        // Add related data, computed properties, etc.
        viewModel.IsEditMode = Sitecore.Context.PageMode.IsExperienceEditor;
        viewModel.LastModified = datasource.Statistics?.Updated ?? DateTime.MinValue;
        
        // Add any async operations here
        await Task.CompletedTask;
    }

    private async Task<ValidationResult> ValidateRequestAsync({{ServiceName}}Request request)
    {
        var errors = new List<string>();
        
        if (request == null)
        {
            errors.Add("Request cannot be null");
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors.ToArray()
        };
    }

    private async Task<{{ServiceName}}Result> ExecuteBusinessLogicAsync({{ServiceName}}Request request)
    {
        // Implement your business logic here
        await Task.Delay(100); // Simulate async operation
        
        return new {{ServiceName}}Result
        {
            Success = true,
            Data = "Processing completed successfully"
        };
    }
}

// Supporting classes
public class {{ServiceName}}Request
{
    public string {{PropertyName}} { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
}

public class {{ServiceName}}Result
{
    public bool Success { get; set; }
    public string[] Errors { get; set; } = Array.Empty<string>();
    public object Data { get; set; }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public string[] Errors { get; set; } = Array.Empty<string>();
}`,

            'Razor View': `@* Feature Razor view with accessibility and performance optimization *@
@model {{ModelName}}ViewModel
@{
    ViewBag.Title = Model?.Title ?? "{{ComponentName}}";
    Layout = "~/Views/Shared/_Layout.cshtml";
}

@if (Model != null && Model.HasContent)
{
    <section class="{{kebab-case-component}}" 
             role="region" 
             aria-labelledby="{{kebab-case-component}}-heading"
             data-component="{{ComponentName}}"
             data-tracking="{{ComponentName}}.View">
        
        @* Component heading *@
        @if (!string.IsNullOrEmpty(Model.Title))
        {
            <h2 id="{{kebab-case-component}}-heading" class="{{kebab-case-component}}__title">
                @Html.Sitecore().Field("Title", Model.Datasource)
            </h2>
        }

        @* Component description *@
        @if (!string.IsNullOrEmpty(Model.Description))
        {
            <div class="{{kebab-case-component}}__description">
                @Html.Sitecore().Field("Description", Model.Datasource)
            </div>
        }

        @* Main content area *@
        <div class="{{kebab-case-component}}__content">
            @if (Model.Items?.Any() == true)
            {
                <ul class="{{kebab-case-component}}__list" role="list">
                    @foreach (var item in Model.Items)
                    {
                        <li class="{{kebab-case-component}}__item" role="listitem">
                            <article class="{{kebab-case-component}}__card">
                                @* Item image *@
                                @if (item.Image != null && !item.Image.Empty)
                                {
                                    <div class="{{kebab-case-component}}__image-container">
                                        @Html.Sitecore().Field("Image", item, new { 
                                            @class = "{{kebab-case-component}}__image",
                                            alt = item.ImageAlt ?? item.Title,
                                            loading = "lazy",
                                            width = "300",
                                            height = "200"
                                        })
                                    </div>
                                }

                                @* Item content *@
                                <div class="{{kebab-case-component}}__item-content">
                                    @if (!string.IsNullOrEmpty(item.Title))
                                    {
                                        <h3 class="{{kebab-case-component}}__item-title">
                                            @if (!string.IsNullOrEmpty(item.Url))
                                            {
                                                <a href="@item.Url" 
                                                   class="{{kebab-case-component}}__item-link"
                                                   @(item.OpenInNewWindow ? "target=\"_blank\" rel=\"noopener noreferrer\"" : "")>
                                                    @item.Title
                                                </a>
                                            }
                                            else
                                            {
                                                @item.Title
                                            }
                                        </h3>
                                    }

                                    @if (!string.IsNullOrEmpty(item.Summary))
                                    {
                                        <p class="{{kebab-case-component}}__item-summary">
                                            @Html.Raw(item.Summary)
                                        </p>
                                    }

                                    @* Call to action *@
                                    @if (!string.IsNullOrEmpty(item.CtaText) && !string.IsNullOrEmpty(item.CtaUrl))
                                    {
                                        <div class="{{kebab-case-component}}__item-actions">
                                            <a href="@item.CtaUrl" 
                                               class="{{kebab-case-component}}__cta btn btn--primary"
                                               @(item.CtaOpenInNewWindow ? "target=\"_blank\" rel=\"noopener noreferrer\"" : "")
                                               aria-describedby="{{kebab-case-component}}-@item.Id-summary">
                                                @item.CtaText
                                                @if (item.CtaOpenInNewWindow)
                                                {
                                                    <span class="sr-only">(opens in new window)</span>
                                                }
                                            </a>
                                        </div>
                                    }
                                </div>

                                @* Metadata *@
                                @if (Model.ShowMetadata && item.LastModified.HasValue)
                                {
                                    <footer class="{{kebab-case-component}}__item-meta">
                                        <time datetime="@item.LastModified.Value.ToString("yyyy-MM-dd")" 
                                              class="{{kebab-case-component}}__date">
                                            Last updated: @item.LastModified.Value.ToString("MMMM dd, yyyy")
                                        </time>
                                    </footer>
                                }
                            </article>
                        </li>
                    }
                </ul>

                @* Pagination *@
                @if (Model.ShowPagination && Model.TotalPages > 1)
                {
                    <nav class="{{kebab-case-component}}__pagination" 
                         aria-label="{{ComponentName}} pagination"
                         role="navigation">
                        <ul class="pagination">
                            @if (Model.CurrentPage > 1)
                            {
                                <li class="pagination__item">
                                    <a href="@Url.Action("Index", new { page = Model.CurrentPage - 1 })" 
                                       class="pagination__link pagination__link--prev"
                                       aria-label="Go to previous page">
                                        <span aria-hidden="true">&laquo;</span>
                                        Previous
                                    </a>
                                </li>
                            }

                            @for (int i = Math.Max(1, Model.CurrentPage - 2); i <= Math.Min(Model.TotalPages, Model.CurrentPage + 2); i++)
                            {
                                <li class="pagination__item @(i == Model.CurrentPage ? "pagination__item--current" : "")">
                                    @if (i == Model.CurrentPage)
                                    {
                                        <span class="pagination__link pagination__link--current" 
                                              aria-current="page"
                                              aria-label="Current page, page @i">
                                            @i
                                        </span>
                                    }
                                    else
                                    {
                                        <a href="@Url.Action("Index", new { page = i })" 
                                           class="pagination__link"
                                           aria-label="Go to page @i">
                                            @i
                                        </a>
                                    }
                                </li>
                            }

                            @if (Model.CurrentPage < Model.TotalPages)
                            {
                                <li class="pagination__item">
                                    <a href="@Url.Action("Index", new { page = Model.CurrentPage + 1 })" 
                                       class="pagination__link pagination__link--next"
                                       aria-label="Go to next page">
                                        Next
                                        <span aria-hidden="true">&raquo;</span>
                                    </a>
                                </li>
                            }
                        </ul>
                    </nav>
                }
            }
            else
            {
                @* Empty state *@
                <div class="{{kebab-case-component}}__empty" role="status">
                    <p class="{{kebab-case-component}}__empty-message">
                        @(Model.EmptyMessage ?? "No items to display at this time.")
                    </p>
                </div>
            }
        </div>

        @* Loading indicator for AJAX content *@
        <div class="{{kebab-case-component}}__loading" 
             role="status" 
             aria-live="polite" 
             aria-label="Loading content"
             style="display: none;">
            <div class="spinner" aria-hidden="true"></div>
            <span class="sr-only">Loading...</span>
        </div>
    </section>
}
else if (Sitecore.Context.PageMode.IsExperienceEditor)
{
    @* Experience Editor placeholder *@
    <div class="{{kebab-case-component}} {{kebab-case-component}}--empty">
        <div class="{{kebab-case-component}}__placeholder">
            <h3>{{ComponentName}} Component</h3>
            <p>Please select a datasource to configure this component.</p>
        </div>
    </div>
}

@* Component-specific scripts *@
@section Scripts {
    @if (Model?.HasInteractivity == true)
    {
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Initialize {{ComponentName}} component
                const component = document.querySelector('[data-component="{{ComponentName}}"]');
                if (component) {
                    new {{ComponentName}}Component(component, @Html.Raw(Json.Encode(Model.ClientSettings)));
                }
            });
        </script>
    }
}

@* Structured data for SEO *@
@if (Model?.EnableStructuredData == true && Model.Items?.Any() == true)
{
    <script type="application/ld+json">
    {
        "@@context": "https://schema.org",
        "@@type": "ItemList",
        "name": "@Model.Title",
        "description": "@Model.Description",
        "numberOfItems": @Model.Items.Count(),
        "itemListElement": [
            @for (int i = 0; i < Model.Items.Count(); i++)
            {
                var item = Model.Items.ElementAt(i);
                @:{
                    "@@type": "ListItem",
                    "position": @(i + 1),
                    "name": "@item.Title",
                    "description": "@Html.Raw(Html.StripHtml(item.Summary))",
                    @if (!string.IsNullOrEmpty(item.Url))
                    {
                        @:"url": "@Request.Url.GetLeftPart(UriPartial.Authority)@item.Url"
                    }
                }@(i < Model.Items.Count() - 1 ? "," : "")
            }
        ]
    }
    </script>
}`,

            // Testing Snippets
            'Unit Test': `// Comprehensive unit test with mocking
[TestClass]
public class {{ControllerName}}Tests
{
    private Mock<ISitecoreContext> _mockSitecoreContext;
    private Mock<I{{ServiceName}}> _mock{{ServiceName}};
    private Mock<ILoggingService> _mockLoggingService;
    private {{ControllerName}} _controller;

    [TestInitialize]
    public void Setup()
    {
        _mockSitecoreContext = new Mock<ISitecoreContext>();
        _mock{{ServiceName}} = new Mock<I{{ServiceName}}>();
        _mockLoggingService = new Mock<ILoggingService>();
        
        _controller = new {{ControllerName}}(
            _mockSitecoreContext.Object,
            _mock{{ServiceName}}.Object,
            _mockLoggingService.Object);
    }

    [TestMethod]
    public void {{TestMethodName}}_WithValidData_ReturnsViewWithModel()
    {
        // Arrange
        var testData = new {{ModelName}}
        {
            Id = Guid.NewGuid(),
            {{PropertyName}} = "{{TestValue}}",
            DisplayName = "Test Item"
        };

        _mockSitecoreContext
            .Setup(x => x.GetCurrentItem<I{{ModelName}}>())
            .Returns(testData);

        // Act
        var result = _controller.{{ActionName}}() as ViewResult;

        // Assert
        Assert.IsNotNull(result);
        Assert.IsInstanceOfType(result.Model, typeof({{ViewModelName}}));
        
        var viewModel = result.Model as {{ViewModelName}};
        Assert.IsNotNull(viewModel.Datasource);
        Assert.AreEqual(testData.{{PropertyName}}, viewModel.Datasource.{{PropertyName}});
        
        _mockLoggingService.Verify(
            x => x.LogInformation(It.IsAny<string>(), It.IsAny<object[]>()), 
            Times.Once);
    }

    [TestMethod]
    public void {{TestMethodName}}_WithNullDatasource_ReturnsEmptyModel()
    {
        // Arrange
        _mockSitecoreContext
            .Setup(x => x.GetCurrentItem<I{{ModelName}}>())
            .Returns((I{{ModelName}})null);

        // Act
        var result = _controller.{{ActionName}}() as ViewResult;

        // Assert
        Assert.IsNotNull(result);
        var viewModel = result.Model as {{ViewModelName}};
        Assert.IsNotNull(viewModel);
        Assert.IsNull(viewModel.Datasource);
        Assert.IsFalse(viewModel.HasContent);
    }

    [TestMethod]
    public void {{TestMethodName}}_WithException_LogsErrorAndReturnsEmptyModel()
    {
        // Arrange
        _mockSitecoreContext
            .Setup(x => x.GetCurrentItem<I{{ModelName}}>())
            .Throws(new Exception("Test exception"));

        // Act
        var result = _controller.{{ActionName}}() as ViewResult;

        // Assert
        Assert.IsNotNull(result);
        var viewModel = result.Model as {{ViewModelName}};
        Assert.IsNotNull(viewModel);
        Assert.IsNull(viewModel.Datasource);
        
        _mockLoggingService.Verify(
            x => x.LogError(It.IsAny<string>(), It.IsAny<Exception>()), 
            Times.Once);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _controller?.Dispose();
    }
}`,

            'Integration Test': `// Integration test for Sitecore components
[TestClass]
public class {{ComponentName}}IntegrationTests
{
    private TestContext testContextInstance;
    private {{ComponentName}}Controller _controller;
    private Mock<ISitecoreContext> _mockSitecoreContext;
    private TestDatabase _testDatabase;

    public TestContext TestContext
    {
        get { return testContextInstance; }
        set { testContextInstance = value; }
    }

    [TestInitialize]
    public void Setup()
    {
        // Initialize Sitecore test database
        _testDatabase = new TestDatabase("master");
        
        // Create test content structure
        var homeItem = _testDatabase.CreateItem("Home", Templates.HomePage.ID);
        var testItem = _testDatabase.CreateItem("Test Item", Templates.{{ComponentName}}.ID, homeItem);
        
        // Setup Glass Mapper context
        var context = new SitecoreContext(_testDatabase.Database);
        _mockSitecoreContext = new Mock<ISitecoreContext>();
        _mockSitecoreContext.Setup(x => x.GetCurrentItem<I{{ModelName}}>())
                           .Returns(context.GetItem<I{{ModelName}}>(testItem));

        // Initialize controller with dependencies
        var logger = new Mock<ILoggingService>();
        var cache = new Mock<ICacheService>();
        
        _controller = new {{ComponentName}}Controller(
            _mockSitecoreContext.Object,
            logger.Object,
            cache.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _testDatabase?.Dispose();
    }

    [TestMethod]
    public void Index_WithValidSitecoreItem_ReturnsCorrectView()
    {
        // Arrange
        var expectedTitle = "Test Component Title";
        var testItem = _testDatabase.GetItem("/sitecore/content/Home/Test Item");
        testItem.Editing.BeginEdit();
        testItem["Title"] = expectedTitle;
        testItem.Editing.EndEdit();

        // Act
        var result = _controller.Index() as ViewResult;

        // Assert
        Assert.IsNotNull(result);
        Assert.IsInstanceOfType(result.Model, typeof({{ComponentName}}ViewModel));
        
        var model = result.Model as {{ComponentName}}ViewModel;
        Assert.AreEqual(expectedTitle, model.Title);
    }

    [TestMethod]
    public void Index_WithMissingDatasource_ReturnsEmptyModel()
    {
        // Arrange
        _mockSitecoreContext.Setup(x => x.GetCurrentItem<I{{ModelName}}>())
                           .Returns((I{{ModelName}})null);

        // Act
        var result = _controller.Index() as ViewResult;

        // Assert
        Assert.IsNotNull(result);
        var model = result.Model as {{ComponentName}}ViewModel;
        Assert.IsNotNull(model);
        Assert.IsTrue(string.IsNullOrEmpty(model.Title));
    }

    [TestMethod]
    public void Component_RendersCorrectly_InExperienceEditor()
    {
        // Arrange
        using (new SecurityDisabler())
        using (new EditContext(Context.Item))
        {
            Context.PageMode = PageMode.Edit;

            // Act
            var result = _controller.Index() as ViewResult;

            // Assert
            Assert.IsNotNull(result);
            // Add specific Experience Editor assertions
        }
    }

    [TestMethod]
    public void Component_HandlesErrors_Gracefully()
    {
        // Arrange
        _mockSitecoreContext.Setup(x => x.GetCurrentItem<I{{ModelName}}>())
                           .Throws(new Exception("Test exception"));

        // Act & Assert
        var result = _controller.Index() as ViewResult;
        Assert.IsNotNull(result);
        
        // Verify error handling behavior
        var model = result.Model as {{ComponentName}}ViewModel;
        Assert.IsNotNull(model);
    }
}`,

            'Test Data Builder': `// Test data builder pattern for creating test objects
public class {{ModelName}}TestDataBuilder
{
    private I{{ModelName}} _model;
    private readonly Mock<I{{ModelName}}> _mockModel;

    public {{ModelName}}TestDataBuilder()
    {
        _mockModel = new Mock<I{{ModelName}}>();
        SetDefaults();
    }

    private void SetDefaults()
    {
        _mockModel.Setup(x => x.Id).Returns(Guid.NewGuid());
        _mockModel.Setup(x => x.Name).Returns("Test {{ModelName}}");
        _mockModel.Setup(x => x.DisplayName).Returns("Test Display Name");
        _mockModel.Setup(x => x.Url).Returns("/test-url");
        _mockModel.Setup(x => x.{{PropertyName}}).Returns("Default Value");
        _mockModel.Setup(x => x.CreatedDate).Returns(DateTime.UtcNow.AddDays(-1));
        _mockModel.Setup(x => x.LastModified).Returns(DateTime.UtcNow);
    }

    public {{ModelName}}TestDataBuilder WithId(Guid id)
    {
        _mockModel.Setup(x => x.Id).Returns(id);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithName(string name)
    {
        _mockModel.Setup(x => x.Name).Returns(name);
        _mockModel.Setup(x => x.DisplayName).Returns(name);
        return this;
    }

    public {{ModelName}}TestDataBuilder With{{PropertyName}}(string value)
    {
        _mockModel.Setup(x => x.{{PropertyName}}).Returns(value);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithUrl(string url)
    {
        _mockModel.Setup(x => x.Url).Returns(url);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithChildren(params I{{ModelName}}[] children)
    {
        _mockModel.Setup(x => x.Children).Returns(children);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithParent(I{{ModelName}} parent)
    {
        _mockModel.Setup(x => x.Parent).Returns(parent);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithImage(string imageUrl = "/test-image.jpg", string alt = "Test Image")
    {
        var mockImage = new Mock<Glass.Mapper.Sc.Fields.Image>();
        mockImage.Setup(x => x.Src).Returns(imageUrl);
        mockImage.Setup(x => x.Alt).Returns(alt);
        mockImage.Setup(x => x.Empty).Returns(false);
        
        _mockModel.Setup(x => x.Image).Returns(mockImage.Object);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithEmptyImage()
    {
        var mockImage = new Mock<Glass.Mapper.Sc.Fields.Image>();
        mockImage.Setup(x => x.Empty).Returns(true);
        
        _mockModel.Setup(x => x.Image).Returns(mockImage.Object);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithRichText(string content)
    {
        var mockRichText = new Mock<Glass.Mapper.Sc.Fields.RichText>();
        mockRichText.Setup(x => x.Raw).Returns(content);
        mockRichText.Setup(x => x.Rendered).Returns(content);
        
        _mockModel.Setup(x => x.Content).Returns(mockRichText.Object);
        return this;
    }

    public {{ModelName}}TestDataBuilder WithTemplateId(Guid templateId)
    {
        _mockModel.Setup(x => x.TemplateId).Returns(templateId);
        return this;
    }

    public {{ModelName}}TestDataBuilder AsPublished()
    {
        _mockModel.Setup(x => x.Statistics.Published).Returns(DateTime.UtcNow);
        return this;
    }

    public {{ModelName}}TestDataBuilder AsUnpublished()
    {
        _mockModel.Setup(x => x.Statistics.Published).Returns((DateTime?)null);
        return this;
    }

    public I{{ModelName}} Build()
    {
        return _mockModel.Object;
    }

    public Mock<I{{ModelName}}> BuildMock()
    {
        return _mockModel;
    }

    // Static factory methods for common scenarios
    public static {{ModelName}}TestDataBuilder Create()
    {
        return new {{ModelName}}TestDataBuilder();
    }

    public static {{ModelName}}TestDataBuilder CreateEmpty()
    {
        var builder = new {{ModelName}}TestDataBuilder();
        builder._mockModel.Setup(x => x.{{PropertyName}}).Returns(string.Empty);
        builder._mockModel.Setup(x => x.DisplayName).Returns(string.Empty);
        return builder;
    }

    public static {{ModelName}}TestDataBuilder CreateWithChildren(int childCount = 3)
    {
        var builder = new {{ModelName}}TestDataBuilder();
        var children = Enumerable.Range(1, childCount)
            .Select(i => Create()
                .WithName($"Child {i}")
                .With{{PropertyName}}($"Child Value {i}")
                .Build())
            .ToArray();
        
        return builder.WithChildren(children);
    }
}

// Usage example in tests:
/*
[TestMethod]
public void TestMethod_Example()
{
    // Arrange
    var testData = {{ModelName}}TestDataBuilder
        .Create()
        .WithName("Custom Test Name")
        .With{{PropertyName}}("Custom Value")
        .WithChildren(
            {{ModelName}}TestDataBuilder.Create().WithName("Child 1").Build(),
            {{ModelName}}TestDataBuilder.Create().WithName("Child 2").Build())
        .Build();

    // Act & Assert
    // Use testData in your test
}
*/`,

            'Mock Configuration': `// Mock configuration for Sitecore context and services
public static class SitecoreMockHelper
{
    public static Mock<ISitecoreContext> CreateMockSitecoreContext()
    {
        var mockContext = new Mock<ISitecoreContext>();
        
        // Setup common Sitecore context behaviors
        mockContext.Setup(x => x.Database).Returns(CreateMockDatabase().Object);
        mockContext.Setup(x => x.Site).Returns(CreateMockSite().Object);
        
        return mockContext;
    }

    public static Mock<Database> CreateMockDatabase()
    {
        var mockDatabase = new Mock<Database>();
        mockDatabase.Setup(x => x.Name).Returns("master");
        return mockDatabase;
    }

    public static Mock<SiteContext> CreateMockSite()
    {
        var mockSite = new Mock<SiteContext>();
        mockSite.Setup(x => x.Name).Returns("website");
        mockSite.Setup(x => x.StartPath).Returns("/sitecore/content/home");
        return mockSite;
    }

    public static Mock<ILoggingService> CreateMockLoggingService()
    {
        var mockLogger = new Mock<ILoggingService>();
        
        // Setup logging methods to capture calls for verification
        var loggedMessages = new List<string>();
        var loggedErrors = new List<Exception>();
        
        mockLogger.Setup(x => x.LogInformation(It.IsAny<string>()))
                 .Callback<string>(msg => loggedMessages.Add(msg));
                 
        mockLogger.Setup(x => x.LogError(It.IsAny<string>(), It.IsAny<Exception>()))
                 .Callback<string, Exception>((msg, ex) => 
                 {
                     loggedMessages.Add(msg);
                     loggedErrors.Add(ex);
                 });

        // Store captured data for test assertions
        mockLogger.Setup(x => x.GetLoggedMessages()).Returns(() => loggedMessages);
        mockLogger.Setup(x => x.GetLoggedErrors()).Returns(() => loggedErrors);
        
        return mockLogger;
    }

    public static Mock<ICacheService> CreateMockCacheService()
    {
        var mockCache = new Mock<ICacheService>();
        var cacheStorage = new Dictionary<string, object>();
        
        // Setup cache behaviors
        mockCache.Setup(x => x.Get<It.IsAnyType>(It.IsAny<string>()))
                .Returns<string>(key => cacheStorage.ContainsKey(key) ? (T)cacheStorage[key] : default(T));
                
        mockCache.Setup(x => x.Set<It.IsAnyType>(It.IsAny<string>(), It.IsAny<It.IsAnyType>(), It.IsAny<TimeSpan?>()))
                .Callback<string, object, TimeSpan?>((key, value, expiry) => cacheStorage[key] = value);
                
        mockCache.Setup(x => x.Remove(It.IsAny<string>()))
                .Callback<string>(key => cacheStorage.Remove(key));

        return mockCache;
    }

    public static Mock<HttpContextBase> CreateMockHttpContext()
    {
        var mockHttpContext = new Mock<HttpContextBase>();
        var mockRequest = new Mock<HttpRequestBase>();
        var mockResponse = new Mock<HttpResponseBase>();
        var mockSession = new Mock<HttpSessionStateBase>();
        var mockServer = new Mock<HttpServerUtilityBase>();

        // Setup HTTP context components
        mockHttpContext.Setup(x => x.Request).Returns(mockRequest.Object);
        mockHttpContext.Setup(x => x.Response).Returns(mockResponse.Object);
        mockHttpContext.Setup(x => x.Session).Returns(mockSession.Object);
        mockHttpContext.Setup(x => x.Server).Returns(mockServer.Object);

        // Setup request details
        mockRequest.Setup(x => x.Url).Returns(new Uri("https://localhost/test"));
        mockRequest.Setup(x => x.UserAgent).Returns("Test User Agent");
        mockRequest.Setup(x => x.UserHostAddress).Returns("127.0.0.1");

        return mockHttpContext;
    }

    public static Mock<ControllerContext> CreateMockControllerContext()
    {
        var mockControllerContext = new Mock<ControllerContext>();
        var mockHttpContext = CreateMockHttpContext();
        
        mockControllerContext.Setup(x => x.HttpContext).Returns(mockHttpContext.Object);
        
        return mockControllerContext;
    }

    public static void SetupSitecoreItem<T>(Mock<ISitecoreContext> mockContext, T item) where T : class
    {
        mockContext.Setup(x => x.GetCurrentItem<T>()).Returns(item);
        mockContext.Setup(x => x.GetItem<T>(It.IsAny<string>())).Returns(item);
        mockContext.Setup(x => x.GetItem<T>(It.IsAny<Guid>())).Returns(item);
    }

    public static void SetupSitecoreItemQuery<T>(Mock<ISitecoreContext> mockContext, IEnumerable<T> items) where T : class
    {
        mockContext.Setup(x => x.Query<T>(It.IsAny<string>())).Returns(items);
        mockContext.Setup(x => x.QuerySingle<T>(It.IsAny<string>())).Returns(items.FirstOrDefault());
    }

    public static void VerifyLoggingCalls(Mock<ILoggingService> mockLogger, Times informationTimes, Times errorTimes)
    {
        mockLogger.Verify(x => x.LogInformation(It.IsAny<string>()), informationTimes);
        mockLogger.Verify(x => x.LogError(It.IsAny<string>(), It.IsAny<Exception>()), errorTimes);
    }

    public static void VerifyCacheCalls(Mock<ICacheService> mockCache, string key, Times getTimes, Times setTimes)
    {
        mockCache.Verify(x => x.Get<It.IsAnyType>(key), getTimes);
        mockCache.Verify(x => x.Set<It.IsAnyType>(key, It.IsAny<It.IsAnyType>(), It.IsAny<TimeSpan?>()), setTimes);
    }
}

// Base test class with common setup
public abstract class SitecoreTestBase
{
    protected Mock<ISitecoreContext> MockSitecoreContext;
    protected Mock<ILoggingService> MockLoggingService;
    protected Mock<ICacheService> MockCacheService;
    protected Mock<HttpContextBase> MockHttpContext;

    [TestInitialize]
    public virtual void BaseSetup()
    {
        MockSitecoreContext = SitecoreMockHelper.CreateMockSitecoreContext();
        MockLoggingService = SitecoreMockHelper.CreateMockLoggingService();
        MockCacheService = SitecoreMockHelper.CreateMockCacheService();
        MockHttpContext = SitecoreMockHelper.CreateMockHttpContext();

        // Setup HttpContext for controllers
        HttpContext.Current = new HttpContext(
            new HttpRequest("", "https://localhost/", ""),
            new HttpResponse(new StringWriter()));
    }

    [TestCleanup]
    public virtual void BaseCleanup()
    {
        HttpContext.Current = null;
    }

    protected void AssertNoErrorsLogged()
    {
        SitecoreMockHelper.VerifyLoggingCalls(MockLoggingService, Times.AtLeastOnce(), Times.Never());
    }

    protected void AssertErrorWasLogged()
    {
        SitecoreMockHelper.VerifyLoggingCalls(MockLoggingService, Times.AtLeastOnce(), Times.AtLeastOnce());
    }
}`,

            'E2E Test': `// End-to-end test with Selenium WebDriver
[TestClass]
public class {{ComponentName}}E2ETests
{
    private IWebDriver _driver;
    private WebDriverWait _wait;
    private string _baseUrl = "https://localhost:44300"; // Configure as needed

    [TestInitialize]
    public void Setup()
    {
        // Configure Chrome driver with options
        var chromeOptions = new ChromeOptions();
        chromeOptions.AddArguments("--headless"); // Run in headless mode for CI/CD
        chromeOptions.AddArguments("--no-sandbox");
        chromeOptions.AddArguments("--disable-dev-shm-usage");
        chromeOptions.AddArguments("--window-size=1920,1080");

        _driver = new ChromeDriver(chromeOptions);
        _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(30));
    }

    [TestCleanup]
    public void Cleanup()
    {
        _driver?.Quit();
        _driver?.Dispose();
    }

    [TestMethod]
    public void {{ComponentName}}_LoadsSuccessfully_OnHomePage()
    {
        // Arrange
        var homePageUrl = $"{_baseUrl}/";

        // Act
        _driver.Navigate().GoToUrl(homePageUrl);

        // Assert
        var component = _wait.Until(driver => 
            driver.FindElement(By.CssSelector("[data-component='{{ComponentName}}']")));
        
        Assert.IsNotNull(component);
        Assert.IsTrue(component.Displayed);
    }

    [TestMethod]
    public void {{ComponentName}}_DisplaysCorrectContent_WhenConfigured()
    {
        // Arrange
        var testPageUrl = $"{_baseUrl}/test-page";

        // Act
        _driver.Navigate().GoToUrl(testPageUrl);

        // Assert
        var componentTitle = _wait.Until(driver => 
            driver.FindElement(By.CssSelector(".{{kebab-case-component}}__title")));
        
        Assert.IsTrue(componentTitle.Displayed);
        Assert.IsFalse(string.IsNullOrEmpty(componentTitle.Text));
    }

    [TestMethod]
    public void {{ComponentName}}_RespondsToUserInteraction()
    {
        // Arrange
        _driver.Navigate().GoToUrl($"{_baseUrl}/interactive-page");
        var interactiveElement = _wait.Until(driver => 
            driver.FindElement(By.CssSelector(".{{kebab-case-component}}__interactive-element")));

        // Act
        interactiveElement.Click();

        // Assert
        var resultElement = _wait.Until(driver => 
            driver.FindElement(By.CssSelector(".{{kebab-case-component}}__result")));
        
        Assert.IsTrue(resultElement.Displayed);
    }

    [TestMethod]
    public void {{ComponentName}}_IsAccessible_WithKeyboardNavigation()
    {
        // Arrange
        _driver.Navigate().GoToUrl($"{_baseUrl}/accessibility-test");

        // Act
        var body = _driver.FindElement(By.TagName("body"));
        body.SendKeys(Keys.Tab); // Navigate to first interactive element
        body.SendKeys(Keys.Tab); // Navigate to component
        body.SendKeys(Keys.Enter); // Activate component

        // Assert
        var focusedElement = _driver.SwitchTo().ActiveElement();
        Assert.IsTrue(focusedElement.GetAttribute("class").Contains("{{kebab-case-component}}"));
    }

    [TestMethod]
    public void {{ComponentName}}_LoadsOnMobileViewport()
    {
        // Arrange
        _driver.Manage().Window.Size = new Size(375, 667); // iPhone 6/7/8 size

        // Act
        _driver.Navigate().GoToUrl($"{_baseUrl}/mobile-test");

        // Assert
        var component = _wait.Until(driver => 
            driver.FindElement(By.CssSelector("[data-component='{{ComponentName}}']")));
        
        Assert.IsTrue(component.Displayed);
        
        // Check mobile-specific styling
        var mobileClass = component.GetAttribute("class");
        Assert.IsTrue(mobileClass.Contains("{{kebab-case-component}}--mobile") || 
                     component.GetCssValue("display") != "none");
    }

    [TestMethod]
    public void {{ComponentName}}_HandlesFormSubmission_Successfully()
    {
        // Arrange
        _driver.Navigate().GoToUrl($"{_baseUrl}/form-test");
        
        var form = _wait.Until(driver => 
            driver.FindElement(By.CssSelector(".{{kebab-case-component}}__form")));
        
        var input = form.FindElement(By.CssSelector("input[name='testField']"));
        var submitButton = form.FindElement(By.CssSelector("button[type='submit']"));

        // Act
        input.SendKeys("Test Value");
        submitButton.Click();

        // Assert
        var successMessage = _wait.Until(driver => 
            driver.FindElement(By.CssSelector(".{{kebab-case-component}}__success-message")));
        
        Assert.IsTrue(successMessage.Displayed);
        Assert.IsTrue(successMessage.Text.Contains("success"));
    }

    [TestMethod]
    public void {{ComponentName}}_LoadsWithPerformanceRequirements()
    {
        // Arrange
        var stopwatch = Stopwatch.StartNew();

        // Act
        _driver.Navigate().GoToUrl($"{_baseUrl}/performance-test");
        var component = _wait.Until(driver => 
            driver.FindElement(By.CssSelector("[data-component='{{ComponentName}}']")));
        
        stopwatch.Stop();

        // Assert
        Assert.IsTrue(component.Displayed);
        Assert.IsTrue(stopwatch.ElapsedMilliseconds < 3000, 
            $"Component took {stopwatch.ElapsedMilliseconds}ms to load, exceeding 3 second requirement");
    }

    [TestMethod]
    public void {{ComponentName}}_HandlesErrorStates_Gracefully()
    {
        // Arrange
        _driver.Navigate().GoToUrl($"{_baseUrl}/error-test");

        // Act & Assert
        var errorComponent = _wait.Until(driver => 
            driver.FindElement(By.CssSelector(".{{kebab-case-component}}--error")));
        
        Assert.IsTrue(errorComponent.Displayed);
        
        var errorMessage = errorComponent.FindElement(By.CssSelector(".{{kebab-case-component}}__error-message"));
        Assert.IsTrue(errorMessage.Displayed);
        Assert.IsFalse(string.IsNullOrEmpty(errorMessage.Text));
    }

    [TestMethod]
    public void {{ComponentName}}_SupportsMultipleInstances_OnSamePage()
    {
        // Arrange
        _driver.Navigate().GoToUrl($"{_baseUrl}/multiple-instances");

        // Act
        var components = _wait.Until(driver => 
            driver.FindElements(By.CssSelector("[data-component='{{ComponentName}}']")));

        // Assert
        Assert.IsTrue(components.Count > 1, "Expected multiple component instances on the page");
        
        foreach (var component in components)
        {
            Assert.IsTrue(component.Displayed);
        }
    }

    // Helper methods for common E2E operations
    private void WaitForElementToBeClickable(By locator)
    {
        _wait.Until(ExpectedConditions.ElementToBeClickable(locator));
    }

    private void WaitForElementToBeVisible(By locator)
    {
        _wait.Until(ExpectedConditions.ElementIsVisible(locator));
    }

    private void TakeScreenshot(string testName)
    {
        var screenshot = ((ITakesScreenshot)_driver).GetScreenshot();
        var fileName = $"{testName}_{DateTime.Now:yyyyMMdd_HHmmss}.png";
        screenshot.SaveAsFile(Path.Combine("Screenshots", fileName));
    }
}`,

            // Frontend Snippets
            'SCSS Component': `// {{ComponentName}} component styles following BEM methodology
.{{kebab-case-component-name}} {
  // Container
  display: block;
  margin: 0;
  padding: 0;
  
  // CSS Custom Properties for theming
  --{{component}}-bg-color: #ffffff;
  --{{component}}-text-color: #333333;
  --{{component}}-border-color: #e0e0e0;
  --{{component}}-hover-color: #f5f5f5;
  --{{component}}-focus-color: #0066cc;
  
  background-color: var(--{{component}}-bg-color);
  color: var(--{{component}}-text-color);

  // Elements
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--{{component}}-border-color);
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--{{component}}-text-color);
    
    @media (max-width: 768px) {
      font-size: 1.25rem;
    }
  }

  &__content {
    padding: 1rem;
    line-height: 1.6;
  }

  &__description {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: var(--{{component}}-text-color);
  }

  &__image {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    
    &--responsive {
      width: 100%;
      object-fit: cover;
    }
  }

  &__button {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--{{component}}-border-color);
    background-color: var(--{{component}}-bg-color);
    color: var(--{{component}}-text-color);
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background-color: var(--{{component}}-hover-color);
      transform: translateY(-1px);
    }
    
    &:focus {
      outline: 2px solid var(--{{component}}-focus-color);
      outline-offset: 2px;
    }
    
    &--primary {
      background-color: var(--{{component}}-focus-color);
      color: white;
      border-color: var(--{{component}}-focus-color);
    }
  }

  // Modifiers
  &--featured {
    background-color: var(--{{component}}-hover-color);
    border: 2px solid var(--{{component}}-focus-color);
    
    .{{kebab-case-component-name}}__title {
      color: var(--{{component}}-focus-color);
    }
  }

  &--compact {
    .{{kebab-case-component-name}}__header {
      padding: 0.5rem;
    }
    
    .{{kebab-case-component-name}}__content {
      padding: 0.5rem;
    }
  }

  // States
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease;
  }

  // Responsive breakpoints
  @media (max-width: 1200px) {
    &__content {
      padding: 0.75rem;
    }
  }

  @media (max-width: 768px) {
    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    &__button {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    &__content {
      padding: 0.5rem;
    }
    
    &__button {
      width: 100%;
      justify-content: center;
    }
  }

  // Dark mode support
  @media (prefers-color-scheme: dark) {
    --{{component}}-bg-color: #1a1a1a;
    --{{component}}-text-color: #ffffff;
    --{{component}}-border-color: #333333;
    --{{component}}-hover-color: #2a2a2a;
  }

  // High contrast mode support
  @media (prefers-contrast: high) {
    --{{component}}-border-color: #000000;
    border-width: 2px;
  }

  // Reduced motion support
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
}

// Utility classes for this component
.{{kebab-case-component-name}}-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.{{kebab-case-component-name}}-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  
  .{{kebab-case-component-name}} {
    flex: 1 1 300px;
  }
}`,

            // Project Layer Snippets
            'Site Controller': `// Project layer site controller
using System;
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;

namespace Project.{{SiteName}}.Controllers
{
    /// <summary>
    /// Site-specific controller for {{SiteName}}
    /// </summary>
    public class {{SiteName}}Controller : SitecoreController
    {
        private readonly Foundation.YourModule.ILoggingService _loggingService;
        private readonly Foundation.YourModule.ICacheService _cacheService;
        private readonly ISiteService _siteService;

        public {{SiteName}}Controller(
            Foundation.YourModule.ILoggingService loggingService,
            Foundation.YourModule.ICacheService cacheService,
            ISiteService siteService)
        {
            _loggingService = loggingService;
            _cacheService = cacheService;
            _siteService = siteService;
        }

        public ActionResult Index()
        {
            try
            {
                var siteSettings = _siteService.GetSiteSettings();
                var viewModel = new {{SiteName}}ViewModel
                {
                    SiteSettings = siteSettings,
                    NavigationMenu = _siteService.GetMainNavigation(),
                    Footer = _siteService.GetFooterContent(),
                    IsEditMode = Sitecore.Context.PageMode.IsExperienceEditor
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error in {{SiteName}} home page", ex);
                return View(new {{SiteName}}ViewModel());
            }
        }

        public ActionResult GlobalSearch(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return Json(new { results = new object[0] }, JsonRequestBehavior.AllowGet);
                }

                var searchResults = _siteService.SearchContent(query);
                return Json(new { results = searchResults }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                _loggingService.LogError($"Error in global search for query: {query}", ex);
                return Json(new { error = "Search temporarily unavailable" }, JsonRequestBehavior.AllowGet);
            }
        }
    }

    public interface ISiteService
    {
        SiteSettings GetSiteSettings();
        NavigationModel GetMainNavigation();
        FooterModel GetFooterContent();
        IEnumerable<SearchResultModel> SearchContent(string query);
    }

    public class {{SiteName}}ViewModel
    {
        public SiteSettings SiteSettings { get; set; }
        public NavigationModel NavigationMenu { get; set; }
        public FooterModel Footer { get; set; }
        public bool IsEditMode { get; set; }
    }
}`,

            'Layout View': `@* Project layer main layout view *@
@model Project.{{SiteName}}.Models.LayoutViewModel
<!DOCTYPE html>
<html lang="@Model.Language">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewBag.Title - @Model.SiteSettings.SiteName</title>
    
    @* SEO Meta Tags *@
    <meta name="description" content="@ViewBag.MetaDescription" />
    <meta name="keywords" content="@ViewBag.MetaKeywords" />
    <meta name="author" content="@Model.SiteSettings.Author" />
    
    @* Open Graph Meta Tags *@
    <meta property="og:title" content="@ViewBag.Title" />
    <meta property="og:description" content="@ViewBag.MetaDescription" />
    <meta property="og:image" content="@ViewBag.OgImage" />
    <meta property="og:url" content="@Request.Url.AbsoluteUri" />
    <meta property="og:type" content="website" />
    
    @* Favicon *@
    <link rel="icon" type="image/x-icon" href="@Model.SiteSettings.FaviconUrl" />
    <link rel="apple-touch-icon" sizes="180x180" href="@Model.SiteSettings.AppleTouchIconUrl" />
    
    @* Stylesheets *@
    @Styles.Render("~/bundles/css")
    @RenderSection("Styles", required: false)
    
    @* JSON-LD Structured Data *@
    <script type="application/ld+json">
    {
        "@@context": "https://schema.org",
        "@@type": "WebSite",
        "name": "@Model.SiteSettings.SiteName",
        "url": "@Request.Url.GetLeftPart(UriPartial.Authority)",
        "description": "@Model.SiteSettings.SiteDescription",
        "potentialAction": {
            "@@type": "SearchAction",
            "target": "@Request.Url.GetLeftPart(UriPartial.Authority)/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    }
    </script>
</head>
<body class="@ViewBag.BodyClass" data-site="@Model.SiteSettings.SiteId">
    @* Skip to content for accessibility *@
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    @* Site header *@
    <header class="site-header" role="banner">
        <div class="container">
            @* Site logo and branding *@
            <div class="site-branding">
                <a href="@Model.SiteSettings.HomeUrl" class="site-logo">
                    <img src="@Model.SiteSettings.LogoUrl" 
                         alt="@Model.SiteSettings.SiteName" 
                         width="200" 
                         height="60" />
                </a>
            </div>
            
            @* Main navigation *@
            @Html.Action("MainNavigation", "Navigation")
            
            @* Site utilities *@
            <div class="site-utilities">
                @* Global search *@
                <div class="global-search">
                    <form action="/search" method="get" role="search">
                        <label for="global-search-input" class="sr-only">Search</label>
                        <input type="search" 
                               id="global-search-input"
                               name="q" 
                               placeholder="Search..." 
                               autocomplete="off"
                               aria-describedby="search-help" />
                        <button type="submit" aria-label="Submit search">
                            <span class="icon-search" aria-hidden="true"></span>
                        </button>
                    </form>
                    <div id="search-help" class="sr-only">Enter search terms and press enter</div>
                </div>
                
                @* Language selector (if multilingual) *@
                @if (Model.SiteSettings.IsMultilingual)
                {
                    @Html.Action("LanguageSelector", "Language")
                }
            </div>
        </div>
    </header>
    
    @* Main content area *@
    <main id="main-content" class="main-content" role="main">
        @* Breadcrumbs *@
        @Html.Action("Breadcrumbs", "Navigation")
        
        @* Page content *@
        <div class="page-content">
            @RenderBody()
        </div>
    </main>
    
    @* Site footer *@
    <footer class="site-footer" role="contentinfo">
        <div class="container">
            @Html.Action("Footer", "Footer")
        </div>
    </footer>
    
    @* JavaScript *@
    @Scripts.Render("~/bundles/js")
    @RenderSection("Scripts", required: false)
    
    @* Analytics and tracking *@
    @if (!string.IsNullOrEmpty(Model.SiteSettings.GoogleAnalyticsId))
    {
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=@Model.SiteSettings.GoogleAnalyticsId"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '@Model.SiteSettings.GoogleAnalyticsId');
        </script>
    }
    
    @* Cookie consent banner *@
    @Html.Action("CookieConsent", "Privacy")
</body>
</html>`,

            'Site Configuration': `// Project layer site configuration
using System.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;

namespace Project.{{SiteName}}.Configuration
{
    /// <summary>
    /// Site-specific configuration and dependency injection setup
    /// </summary>
    public class {{SiteName}}Configurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            // Register site-specific services
            serviceCollection.AddScoped<ISiteService, SiteService>();
            serviceCollection.AddScoped<INavigationService, NavigationService>();
            serviceCollection.AddScoped<ISearchService, SearchService>();
            serviceCollection.AddScoped<IEmailService, EmailService>();
            
            // Register site settings
            serviceCollection.AddSingleton<ISiteSettings>(provider => 
                new SiteSettings
                {
                    SiteId = "{{SiteName}}",
                    SiteName = ConfigurationManager.AppSettings["{{SiteName}}.SiteName"] ?? "{{SiteName}}",
                    SiteUrl = ConfigurationManager.AppSettings["{{SiteName}}.SiteUrl"] ?? "https://localhost",
                    DatabaseName = ConfigurationManager.AppSettings["{{SiteName}}.Database"] ?? "web",
                    CacheTimeout = TimeSpan.FromMinutes(int.Parse(ConfigurationManager.AppSettings["{{SiteName}}.CacheTimeout"] ?? "30")),
                    EnableAnalytics = bool.Parse(ConfigurationManager.AppSettings["{{SiteName}}.EnableAnalytics"] ?? "true"),
                    GoogleAnalyticsId = ConfigurationManager.AppSettings["{{SiteName}}.GoogleAnalyticsId"],
                    EnableCookieConsent = bool.Parse(ConfigurationManager.AppSettings["{{SiteName}}.EnableCookieConsent"] ?? "true")
                });
            
            // Register AutoMapper profiles
            serviceCollection.AddAutoMapper(typeof({{SiteName}}MappingProfile));
            
            // Register HTTP clients
            serviceCollection.AddHttpClient<IExternalApiService, ExternalApiService>(client =>
            {
                client.BaseAddress = new Uri(ConfigurationManager.AppSettings["{{SiteName}}.ApiBaseUrl"] ?? "https://api.example.com");
                client.DefaultRequestHeaders.Add("User-Agent", "{{SiteName}}/1.0");
                client.Timeout = TimeSpan.FromSeconds(30);
            });
        }
    }

    /// <summary>
    /// Site settings configuration
    /// </summary>
    public interface ISiteSettings
    {
        string SiteId { get; }
        string SiteName { get; }
        string SiteUrl { get; }
        string DatabaseName { get; }
        TimeSpan CacheTimeout { get; }
        bool EnableAnalytics { get; }
        string GoogleAnalyticsId { get; }
        bool EnableCookieConsent { get; }
        bool IsMultilingual { get; }
        string[] SupportedLanguages { get; }
    }

    public class SiteSettings : ISiteSettings
    {
        public string SiteId { get; set; }
        public string SiteName { get; set; }
        public string SiteUrl { get; set; }
        public string DatabaseName { get; set; }
        public TimeSpan CacheTimeout { get; set; }
        public bool EnableAnalytics { get; set; }
        public string GoogleAnalyticsId { get; set; }
        public bool EnableCookieConsent { get; set; }
        public bool IsMultilingual { get; set; }
        public string[] SupportedLanguages { get; set; } = new[] { "en" };
    }

    /// <summary>
    /// AutoMapper profile for site-specific mappings
    /// </summary>
    public class {{SiteName}}MappingProfile : Profile
    {
        public {{SiteName}}MappingProfile()
        {
            // Configure mappings between Sitecore items and view models
            CreateMap<ISitecoreItem, ViewModelBase>()
                .ForMember(dest => dest.IsEditMode, opt => opt.MapFrom(src => Sitecore.Context.PageMode.IsExperienceEditor))
                .ForMember(dest => dest.LastModified, opt => opt.MapFrom(src => src.Statistics.Updated));
                
            CreateMap<INavigationItem, NavigationViewModel>()
                .ForMember(dest => dest.IsActive, opt => opt.Ignore())
                .ForMember(dest => dest.HasChildren, opt => opt.MapFrom(src => src.Children.Any()));
        }
    }

    /// <summary>
    /// Environment-specific configuration
    /// </summary>
    public static class EnvironmentConfiguration
    {
        public static bool IsDevelopment => Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        public static bool IsProduction => Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production";
        
        public static string GetConnectionString(string name)
        {
            return ConfigurationManager.ConnectionStrings[name]?.ConnectionString;
        }
        
        public static T GetAppSetting<T>(string key, T defaultValue = default(T))
        {
            var value = ConfigurationManager.AppSettings[key];
            if (string.IsNullOrEmpty(value))
                return defaultValue;
                
            try
            {
                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch
            {
                return defaultValue;
            }
        }
    }
}`,

            'Global Navigation': `// Global navigation component for Project layer
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;

namespace Project.{{SiteName}}.Controllers
{
    /// <summary>
    /// Global navigation controller for site-wide navigation elements
    /// </summary>
    public class GlobalNavigationController : SitecoreController
    {
        private readonly INavigationService _navigationService;
        private readonly Foundation.YourModule.ILoggingService _loggingService;
        private readonly Foundation.YourModule.ICacheService _cacheService;

        public GlobalNavigationController(
            INavigationService navigationService,
            Foundation.YourModule.ILoggingService loggingService,
            Foundation.YourModule.ICacheService cacheService)
        {
            _navigationService = navigationService;
            _loggingService = loggingService;
            _cacheService = cacheService;
        }

        /// <summary>
        /// Main navigation header
        /// </summary>
        public ActionResult Header()
        {
            try
            {
                var cacheKey = "GlobalNav:Header:" + Sitecore.Context.Language.Name;
                var cached = _cacheService.Get<HeaderNavigationViewModel>(cacheKey);
                
                if (cached != null)
                {
                    return View(cached);
                }

                var viewModel = new HeaderNavigationViewModel
                {
                    MainMenu = _navigationService.GetMainMenuItems(),
                    UtilityMenu = _navigationService.GetUtilityMenuItems(),
                    Logo = _navigationService.GetSiteLogo(),
                    SearchEnabled = _navigationService.IsSearchEnabled(),
                    LanguageSelector = _navigationService.GetLanguageOptions()
                };

                _cacheService.Set(cacheKey, viewModel, TimeSpan.FromMinutes(30));
                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering header navigation", ex);
                return View(new HeaderNavigationViewModel());
            }
        }

        /// <summary>
        /// Footer navigation
        /// </summary>
        public ActionResult Footer()
        {
            try
            {
                var cacheKey = "GlobalNav:Footer:" + Sitecore.Context.Language.Name;
                var cached = _cacheService.Get<FooterNavigationViewModel>(cacheKey);
                
                if (cached != null)
                {
                    return View(cached);
                }

                var viewModel = new FooterNavigationViewModel
                {
                    FooterColumns = _navigationService.GetFooterColumns(),
                    SocialMedia = _navigationService.GetSocialMediaLinks(),
                    Copyright = _navigationService.GetCopyrightInfo(),
                    LegalLinks = _navigationService.GetLegalLinks(),
                    ContactInfo = _navigationService.GetContactInformation()
                };

                _cacheService.Set(cacheKey, viewModel, TimeSpan.FromMinutes(60));
                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering footer navigation", ex);
                return View(new FooterNavigationViewModel());
            }
        }

        /// <summary>
        /// Mobile navigation menu
        /// </summary>
        public ActionResult MobileMenu()
        {
            try
            {
                var viewModel = new MobileMenuViewModel
                {
                    MenuItems = _navigationService.GetMobileMenuItems(),
                    QuickActions = _navigationService.GetQuickActions(),
                    UserAccount = _navigationService.GetUserAccountInfo()
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering mobile menu", ex);
                return View(new MobileMenuViewModel());
            }
        }

        /// <summary>
        /// Sitemap for SEO
        /// </summary>
        public ActionResult Sitemap()
        {
            try
            {
                var sitemapItems = _navigationService.GetSitemapItems();
                return View(sitemapItems);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering sitemap", ex);
                return View(Enumerable.Empty<SitemapItem>());
            }
        }
    }

    // View Models
    public class HeaderNavigationViewModel
    {
        public IEnumerable<NavigationItem> MainMenu { get; set; } = Enumerable.Empty<NavigationItem>();
        public IEnumerable<NavigationItem> UtilityMenu { get; set; } = Enumerable.Empty<NavigationItem>();
        public LogoViewModel Logo { get; set; } = new LogoViewModel();
        public bool SearchEnabled { get; set; }
        public IEnumerable<LanguageOption> LanguageSelector { get; set; } = Enumerable.Empty<LanguageOption>();
    }

    public class FooterNavigationViewModel
    {
        public IEnumerable<FooterColumn> FooterColumns { get; set; } = Enumerable.Empty<FooterColumn>();
        public IEnumerable<SocialMediaLink> SocialMedia { get; set; } = Enumerable.Empty<SocialMediaLink>();
        public CopyrightInfo Copyright { get; set; } = new CopyrightInfo();
        public IEnumerable<NavigationItem> LegalLinks { get; set; } = Enumerable.Empty<NavigationItem>();
        public ContactInfo ContactInfo { get; set; } = new ContactInfo();
    }

    public class MobileMenuViewModel
    {
        public IEnumerable<NavigationItem> MenuItems { get; set; } = Enumerable.Empty<NavigationItem>();
        public IEnumerable<QuickAction> QuickActions { get; set; } = Enumerable.Empty<QuickAction>();
        public UserAccountInfo UserAccount { get; set; } = new UserAccountInfo();
    }

    // Supporting Models
    public class NavigationItem
    {
        public string Title { get; set; }
        public string Url { get; set; }
        public bool OpenInNewWindow { get; set; }
        public string CssClass { get; set; }
        public bool IsActive { get; set; }
        public bool HasChildren { get; set; }
        public IEnumerable<NavigationItem> Children { get; set; } = Enumerable.Empty<NavigationItem>();
        public string Icon { get; set; }
        public string Description { get; set; }
    }

    public class LogoViewModel
    {
        public string ImageUrl { get; set; }
        public string AltText { get; set; }
        public string LinkUrl { get; set; }
        public int Width { get; set; } = 200;
        public int Height { get; set; } = 60;
    }

    public class FooterColumn
    {
        public string Title { get; set; }
        public IEnumerable<NavigationItem> Links { get; set; } = Enumerable.Empty<NavigationItem>();
        public string Content { get; set; }
    }

    public class SocialMediaLink
    {
        public string Platform { get; set; }
        public string Url { get; set; }
        public string Icon { get; set; }
        public string Title { get; set; }
    }

    public class CopyrightInfo
    {
        public string Text { get; set; }
        public int Year { get; set; } = DateTime.Now.Year;
        public string CompanyName { get; set; }
    }

    public class ContactInfo
    {
        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Hours { get; set; }
    }
}`,

            'Asset Pipeline': `// Asset pipeline configuration for Project layer
using System.Web.Optimization;

namespace Project.{{SiteName}}.App_Start
{
    /// <summary>
    /// Bundle and optimization configuration for {{SiteName}}
    /// </summary>
    public static class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            // Foundation CSS - Core framework styles
            bundles.Add(new StyleBundle("~/bundles/foundation/css").Include(
                "~/Content/foundation/reset.css",
                "~/Content/foundation/grid.css",
                "~/Content/foundation/typography.css",
                "~/Content/foundation/forms.css",
                "~/Content/foundation/utilities.css"
            ));

            // Feature CSS - Component-specific styles
            bundles.Add(new StyleBundle("~/bundles/features/css").Include(
                "~/Content/features/navigation.css",
                "~/Content/features/carousel.css",
                "~/Content/features/forms.css",
                "~/Content/features/search.css",
                "~/Content/features/media-gallery.css"
            ));

            // Project CSS - Site-specific styles
            bundles.Add(new StyleBundle("~/bundles/project/css").Include(
                "~/Content/project/{{site-name}}/variables.css",
                "~/Content/project/{{site-name}}/layout.css",
                "~/Content/project/{{site-name}}/pages.css",
                "~/Content/project/{{site-name}}/responsive.css",
                "~/Content/project/{{site-name}}/print.css"
            ));

            // Main CSS bundle - Combined for production
            bundles.Add(new StyleBundle("~/bundles/css").Include(
                "~/bundles/foundation/css",
                "~/bundles/features/css", 
                "~/bundles/project/css"
            ));

            // Foundation JavaScript - Core utilities
            bundles.Add(new ScriptBundle("~/bundles/foundation/js").Include(
                "~/Scripts/foundation/polyfills.js",
                "~/Scripts/foundation/utilities.js",
                "~/Scripts/foundation/analytics.js",
                "~/Scripts/foundation/accessibility.js"
            ));

            // Feature JavaScript - Component functionality
            bundles.Add(new ScriptBundle("~/bundles/features/js").Include(
                "~/Scripts/features/navigation.js",
                "~/Scripts/features/carousel.js",
                "~/Scripts/features/forms.js",
                "~/Scripts/features/search.js",
                "~/Scripts/features/media-gallery.js"
            ));

            // Project JavaScript - Site-specific functionality
            bundles.Add(new ScriptBundle("~/bundles/project/js").Include(
                "~/Scripts/project/{{site-name}}/app.js",
                "~/Scripts/project/{{site-name}}/tracking.js",
                "~/Scripts/project/{{site-name}}/customizations.js"
            ));

            // Main JavaScript bundle
            bundles.Add(new ScriptBundle("~/bundles/js").Include(
                "~/bundles/foundation/js",
                "~/bundles/features/js",
                "~/bundles/project/js"
            ));

            // Vendor libraries
            bundles.Add(new ScriptBundle("~/bundles/vendor/js").Include(
                "~/Scripts/vendor/jquery-{version}.js",
                "~/Scripts/vendor/swiper.min.js",
                "~/Scripts/vendor/lazysizes.min.js"
            ));

            // Critical CSS for above-the-fold content
            bundles.Add(new StyleBundle("~/bundles/critical/css").Include(
                "~/Content/critical/layout.css",
                "~/Content/critical/navigation.css",
                "~/Content/critical/hero.css"
            ));

            // Configure optimization settings
            ConfigureOptimizationSettings(bundles);
        }

        private static void ConfigureOptimizationSettings(BundleCollection bundles)
        {
            // Enable optimization in production
            BundleTable.EnableOptimizations = !System.Web.HttpContext.Current.IsDebuggingEnabled;

            // Configure CSS minification
            bundles.UseCdn = true;
            
            // Custom CSS transformer for SCSS compilation
            foreach (var bundle in bundles.OfType<StyleBundle>())
            {
                bundle.Transforms.Add(new ScssTransform());
                bundle.Transforms.Add(new CssMinify());
            }

            // Custom JavaScript transformer
            foreach (var bundle in bundles.OfType<ScriptBundle>())
            {
                bundle.Transforms.Add(new JsMinify());
            }
        }
    }

    /// <summary>
    /// SCSS transformation for development
    /// </summary>
    public class ScssTransform : IBundleTransform
    {
        public void Process(BundleContext context, BundleResponse response)
        {
            if (context.HttpContext.IsDebuggingEnabled)
            {
                // In development, compile SCSS to CSS
                var scssEngine = new ScssEngine();
                response.Content = scssEngine.Compile(response.Content);
            }
        }
    }

    /// <summary>
    /// Asset versioning for cache busting
    /// </summary>
    public static class AssetVersioning
    {
        private static readonly Dictionary<string, string> _assetVersions = new Dictionary<string, string>();

        public static string GetVersionedUrl(string assetPath)
        {
            if (_assetVersions.ContainsKey(assetPath))
            {
                return _assetVersions[assetPath];
            }

            var fileInfo = new FileInfo(HttpContext.Current.Server.MapPath(assetPath));
            if (fileInfo.Exists)
            {
                var version = fileInfo.LastWriteTime.Ticks.ToString("x");
                var versionedUrl = $"{assetPath}?v={version}";
                _assetVersions[assetPath] = versionedUrl;
                return versionedUrl;
            }

            return assetPath;
        }

        public static IHtmlString VersionedStylesheet(string path)
        {
            var versionedPath = GetVersionedUrl(path);
            return new HtmlString($"<link rel=\"stylesheet\" href=\"{versionedPath}\" />");
        }

        public static IHtmlString VersionedScript(string path)
        {
            var versionedPath = GetVersionedUrl(path);
            return new HtmlString($"<script src=\"{versionedPath}\"></script>");
        }
    }

    /// <summary>
    /// Critical CSS inlining for performance
    /// </summary>
    public static class CriticalCssHelper
    {
        public static IHtmlString InlineCriticalCss()
        {
            var criticalCssPath = HttpContext.Current.Server.MapPath("~/Content/critical.min.css");
            if (File.Exists(criticalCssPath))
            {
                var criticalCss = File.ReadAllText(criticalCssPath);
                return new HtmlString($"<style>{criticalCss}</style>");
            }
            return new HtmlString("");
        }

        public static IHtmlString PreloadStylesheet(string path)
        {
            return new HtmlString($"<link rel=\"preload\" href=\"{path}\" as=\"style\" onload=\"this.onload=null;this.rel='stylesheet'\" />");
        }
    }
}

/*
Gulp/Webpack configuration for advanced asset processing:

// gulpfile.js
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const rev = require('gulp-rev');

// SCSS compilation
gulp.task('scss', function() {
    return gulp.src('Content/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(rev())
        .pipe(gulp.dest('Content/dist/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('Content/dist'));
});

// JavaScript bundling
gulp.task('js', function() {
    return gulp.src('Scripts/src/**/*.js')
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest('Scripts/dist'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('Scripts/dist'));
});

// Image optimization
gulp.task('images', function() {
    return gulp.src('Content/images/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('Content/dist/images'));
});

// Watch for changes
gulp.task('watch', function() {
    gulp.watch('Content/scss/**/*.scss', ['scss']);
    gulp.watch('Scripts/src/**/*.js', ['js']);
    gulp.watch('Content/images/**/*', ['images']);
});

gulp.task('default', ['scss', 'js', 'images', 'watch']);
*/`,

            // Component Snippets
            'Carousel Component': `// Advanced carousel component for Project layer
@Html.Action("Carousel", "Components", new { datasourceId = Model.DatasourceId })

// CarouselComponent.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;

namespace Feature.Carousel.Controllers
{
    public class CarouselController : SitecoreController
    {
        public ActionResult Index()
        {
            var datasource = GetDatasource<ICarouselDatasource>();
            var viewModel = new CarouselViewModel
            {
                Slides = GetCarouselSlides(datasource),
                Settings = GetCarouselSettings(datasource),
                UniqueId = Guid.NewGuid().ToString("N")[..8]
            };
            
            return View(viewModel);
        }
    }

    public class CarouselViewModel
    {
        public IEnumerable<CarouselSlide> Slides { get; set; }
        public CarouselSettings Settings { get; set; }
        public string UniqueId { get; set; }
    }

    public class CarouselSlide
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public string ImageAlt { get; set; }
        public string LinkUrl { get; set; }
        public string LinkText { get; set; }
        public bool OpenInNewWindow { get; set; }
    }
}

/*
JavaScript for carousel functionality:

class AdvancedCarousel {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            autoplay: true,
            autoplayDelay: 5000,
            loop: true,
            pagination: true,
            navigation: true,
            slidesPerView: 1,
            spaceBetween: 20,
            breakpoints: {
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            },
            ...options
        };
        
        this.init();
    }

    init() {
        this.swiper = new Swiper(this.element, this.options);
        this.setupAccessibility();
        this.setupAnalytics();
    }

    setupAccessibility() {
        // Add ARIA labels and keyboard navigation
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Image carousel');
    }

    setupAnalytics() {
        // Track slide interactions
        this.swiper.on('slideChange', () => {
            gtag('event', 'carousel_slide_change', {
                slide_index: this.swiper.activeIndex
            });
        });
    }
}
*/`,

            'Form Component': `// Dynamic form component
@model Feature.Forms.Models.DynamicFormViewModel

<form class="dynamic-form" 
      data-form-id="@Model.FormId" 
      data-validation="true"
      novalidate>
      
    @Html.AntiForgeryToken()
    
    @foreach (var field in Model.Fields)
    {
        <div class="form-field form-field--@field.Type.ToString().ToLower()">
            @Html.Partial("FormField", field)
        </div>
    }
    
    <div class="form-actions">
        <button type="submit" class="btn btn--primary">
            @Model.SubmitText
        </button>
    </div>
    
    <div class="form-messages" role="status" aria-live="polite"></div>
</form>

// FormFieldPartial.cshtml
@model Feature.Forms.Models.FormField

@switch (Model.Type)
{
    case FormFieldType.Text:
        <label for="@Model.Id">@Model.Label @if(Model.Required){<span class="required">*</span>}</label>
        <input type="text" 
               id="@Model.Id" 
               name="@Model.Name"
               value="@Model.Value"
               placeholder="@Model.Placeholder"
               @(Model.Required ? "required" : "")
               aria-describedby="@Model.Id-help" />
        break;
        
    case FormFieldType.Email:
        <label for="@Model.Id">@Model.Label @if(Model.Required){<span class="required">*</span>}</label>
        <input type="email" 
               id="@Model.Id" 
               name="@Model.Name"
               value="@Model.Value"
               placeholder="@Model.Placeholder"
               @(Model.Required ? "required" : "")
               aria-describedby="@Model.Id-help" />
        break;
        
    case FormFieldType.TextArea:
        <label for="@Model.Id">@Model.Label @if(Model.Required){<span class="required">*</span>}</label>
        <textarea id="@Model.Id" 
                  name="@Model.Name"
                  placeholder="@Model.Placeholder"
                  rows="4"
                  @(Model.Required ? "required" : "")
                  aria-describedby="@Model.Id-help">@Model.Value</textarea>
        break;
}

@if (!string.IsNullOrEmpty(Model.HelpText))
{
    <div id="@Model.Id-help" class="field-help">@Model.HelpText</div>
}`,

            'Navigation Component': `// Responsive navigation component
@model Feature.Navigation.Models.NavigationViewModel

<nav class="main-navigation" role="navigation" aria-label="Main menu">
    <button class="nav-toggle" 
            aria-expanded="false" 
            aria-controls="main-menu"
            aria-label="Toggle navigation">
        <span class="nav-toggle__line"></span>
        <span class="nav-toggle__line"></span>
        <span class="nav-toggle__line"></span>
    </button>
    
    <ul id="main-menu" class="nav-menu" role="menubar">
        @foreach (var item in Model.MenuItems)
        {
            <li class="nav-item @(item.HasChildren ? "nav-item--has-dropdown" : "")" role="none">
                @if (item.HasChildren)
                {
                    <button class="nav-link nav-link--dropdown" 
                            aria-expanded="false"
                            aria-haspopup="true"
                            role="menuitem">
                        @item.Title
                        <span class="nav-dropdown-icon" aria-hidden="true"></span>
                    </button>
                    
                    <ul class="nav-dropdown" role="menu" aria-label="@item.Title submenu">
                        @foreach (var child in item.Children)
                        {
                            <li role="none">
                                <a href="@child.Url" 
                                   class="nav-dropdown__link"
                                   role="menuitem"
                                   @(child.OpenInNewWindow ? "target=\"_blank\" rel=\"noopener\"" : "")>
                                    @child.Title
                                </a>
                            </li>
                        }
                    </ul>
                }
                else
                {
                    <a href="@item.Url" 
                       class="nav-link @(item.IsActive ? "nav-link--active" : "")"
                       role="menuitem"
                       @(item.IsActive ? "aria-current=\"page\"" : "")
                       @(item.OpenInNewWindow ? "target=\"_blank\" rel=\"noopener\"" : "")>
                        @item.Title
                    </a>
                }
            </li>
        }
    </ul>
</nav>`,

            'Search Component': `// Global search component with autocomplete
@model Feature.Search.Models.SearchViewModel

<div class="search-component" data-component="search">
    <form class="search-form" role="search" action="/search" method="get">
        <div class="search-input-wrapper">
            <label for="search-input" class="sr-only">Search</label>
            <input type="search" 
                   id="search-input"
                   name="q" 
                   value="@Model.Query"
                   placeholder="Search..."
                   autocomplete="off"
                   aria-describedby="search-help"
                   data-autocomplete="true" />
            
            <button type="submit" class="search-submit" aria-label="Submit search">
                <span class="icon-search" aria-hidden="true"></span>
            </button>
            
            <div id="search-help" class="sr-only">
                Enter search terms and press enter or click search button
            </div>
        </div>
        
        <!-- Autocomplete suggestions -->
        <div class="search-suggestions" 
             role="listbox" 
             aria-label="Search suggestions"
             hidden>
            <!-- Populated via JavaScript -->
        </div>
    </form>
    
    @if (Model.HasResults)
    {
        <div class="search-results">
            <h2>Search Results (@Model.TotalResults found)</h2>
            
            @foreach (var result in Model.Results)
            {
                <article class="search-result">
                    <h3><a href="@result.Url">@Html.Raw(result.HighlightedTitle)</a></h3>
                    <p class="search-result__snippet">@Html.Raw(result.HighlightedSnippet)</p>
                    <div class="search-result__meta">
                        <span class="search-result__url">@result.Url</span>
                        <time class="search-result__date">@result.LastModified.ToString("MMM dd, yyyy")</time>
                    </div>
                </article>
            }
            
            @Html.Partial("Pagination", Model.Pagination)
        </div>
    }
    else if (!string.IsNullOrEmpty(Model.Query))
    {
        <div class="search-no-results">
            <h2>No results found</h2>
            <p>Try adjusting your search terms or browse our categories.</p>
        </div>
    }
</div>`,

            'Media Gallery': `// Responsive media gallery with lightbox
@model Feature.MediaGallery.Models.MediaGalleryViewModel

<div class="media-gallery" data-component="media-gallery">
    @if (!string.IsNullOrEmpty(Model.Title))
    {
        <h2 class="media-gallery__title">@Model.Title</h2>
    }
    
    <div class="media-gallery__grid" role="region" aria-label="Photo gallery">
        @foreach (var item in Model.MediaItems)
        {
            <figure class="media-gallery__item">
                <button class="media-gallery__trigger" 
                        data-lightbox-trigger
                        data-src="@item.FullSizeUrl"
                        data-caption="@item.Caption"
                        aria-label="View @item.AltText in full size">
                    
                    <img src="@item.ThumbnailUrl" 
                         alt="@item.AltText"
                         loading="lazy"
                         class="media-gallery__image" />
                    
                    <div class="media-gallery__overlay">
                        <span class="media-gallery__zoom-icon" aria-hidden="true"></span>
                    </div>
                </button>
                
                @if (!string.IsNullOrEmpty(item.Caption))
                {
                    <figcaption class="media-gallery__caption">@item.Caption</figcaption>
                }
            </figure>
        }
    </div>
</div>

<!-- Lightbox modal -->
<div class="lightbox" 
     role="dialog" 
     aria-modal="true" 
     aria-labelledby="lightbox-title"
     hidden>
    <div class="lightbox__backdrop" data-lightbox-close></div>
    <div class="lightbox__content">
        <button class="lightbox__close" 
                data-lightbox-close
                aria-label="Close lightbox">
            <span aria-hidden="true">&times;</span>
        </button>
        
        <img class="lightbox__image" 
             src="" 
             alt="" 
             id="lightbox-title" />
        
        <div class="lightbox__caption"></div>
        
        <div class="lightbox__controls">
            <button class="lightbox__prev" aria-label="Previous image">&lsaquo;</button>
            <button class="lightbox__next" aria-label="Next image">&rsaquo;</button>
        </div>
    </div>
</div>`
        };
    }
    
    // Code generation functions
    function generateFoundationModule(): string {
        return `// Foundation Module - Base Services and Utilities
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;

namespace Foundation.YourModule
{
    /// <summary>
    /// Foundation module providing core services and utilities following Helix architecture
    /// </summary>
    public class ServicesConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            // Register foundation services
            serviceCollection.AddScoped<ILoggingService, LoggingService>();
            serviceCollection.AddScoped<ICacheService, CacheService>();
            serviceCollection.AddScoped<IConfigurationService, ConfigurationService>();
        }
    }

    /// <summary>
    /// Base logging service for foundation layer
    /// </summary>
    public interface ILoggingService
    {
        void LogError(string message, Exception exception = null);
        void LogInformation(string message);
        void LogWarning(string message);
    }

    public class LoggingService : ILoggingService
    {
        public void LogError(string message, Exception exception = null)
        {
            Sitecore.Diagnostics.Log.Error(message, exception, this);
        }

        public void LogInformation(string message)
        {
            Sitecore.Diagnostics.Log.Info(message, this);
        }

        public void LogWarning(string message)
        {
            Sitecore.Diagnostics.Log.Warn(message, this);
        }
    }

    /// <summary>
    /// Base caching service for foundation layer
    /// </summary>
    public interface ICacheService
    {
        T Get<T>(string key) where T : class;
        void Set<T>(string key, T value, TimeSpan? expiration = null) where T : class;
        void Remove(string key);
    }

    public class CacheService : ICacheService
    {
        private readonly Sitecore.Caching.Cache _cache;

        public CacheService()
        {
            _cache = Sitecore.Caching.CacheManager.GetNamedInstance("Foundation.YourModule", StringUtil.ParseSizeString("10MB"));
        }

        public T Get<T>(string key) where T : class
        {
            return _cache.GetValue(key) as T;
        }

        public void Set<T>(string key, T value, TimeSpan? expiration = null) where T : class
        {
            var expirationTime = expiration ?? TimeSpan.FromHours(1);
            _cache.Add(key, value, DateTime.UtcNow.Add(expirationTime));
        }

        public void Remove(string key)
        {
            _cache.Remove(key);
        }
    }
}

// TODO: Add unit tests for foundation services
// TODO: Configure dependency injection in Foundation.DI module
// TODO: Add configuration settings in Foundation.Configuration module
`;
    }

    function generateFeatureModule(): string {
        return `// Feature Module - Business Logic and Components
using System;
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;
using Glass.Mapper.Sc;

namespace Feature.YourFeature.Controllers
{
    /// <summary>
    /// Feature controller following Helix architecture principles
    /// </summary>
    public class YourFeatureController : SitecoreController
    {
        private readonly ISitecoreContext _sitecoreContext;
        private readonly Foundation.YourModule.ILoggingService _loggingService;

        public YourFeatureController(
            ISitecoreContext sitecoreContext,
            Foundation.YourModule.ILoggingService loggingService)
        {
            _sitecoreContext = sitecoreContext ?? throw new ArgumentNullException(nameof(sitecoreContext));
            _loggingService = loggingService ?? throw new ArgumentNullException(nameof(loggingService));
        }

        public ActionResult Index()
        {
            try
            {
                var datasource = GetDatasource<IYourFeatureModel>();
                var viewModel = new YourFeatureViewModel(datasource);
                
                _loggingService.LogInformation($"YourFeature rendered for item: {datasource?.Id}");
                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering YourFeature", ex);
                return View(new YourFeatureViewModel(null));
            }
        }

        private T GetDatasource<T>() where T : class
        {
            if (RenderingContext.Current?.Rendering?.Item != null)
            {
                return _sitecoreContext.Cast<T>(RenderingContext.Current.Rendering.Item);
            }
            return _sitecoreContext.GetCurrentItem<T>();
        }
    }

    /// <summary>
    /// Glass Mapper model for YourFeature data template
    /// </summary>
    [SitecoreType(TemplateId = "{YOUR-TEMPLATE-ID}", AutoMap = true)]
    public interface IYourFeatureModel
    {
        [SitecoreId]
        Guid Id { get; set; }

        [SitecoreField("Title")]
        string Title { get; set; }

        [SitecoreField("Description")]
        string Description { get; set; }

        [SitecoreField("Image")]
        Glass.Mapper.Sc.Fields.Image Image { get; set; }

        [SitecoreField("Link")]
        Glass.Mapper.Sc.Fields.Link Link { get; set; }
    }

    /// <summary>
    /// View model for YourFeature component
    /// </summary>
    public class YourFeatureViewModel
    {
        public IYourFeatureModel Datasource { get; }
        public bool HasContent => Datasource != null && !string.IsNullOrEmpty(Datasource.Title);

        public YourFeatureViewModel(IYourFeatureModel datasource)
        {
            Datasource = datasource;
        }
    }
}

// TODO: Create corresponding Razor view in Views/YourFeature/Index.cshtml
// TODO: Create data template in Sitecore with fields: Title, Description, Image, Link
// TODO: Add rendering definition in Sitecore
// TODO: Create unit tests for controller and view model
// TODO: Add CSS/SCSS styles following BEM methodology
// TODO: Add TypeScript for any interactive functionality
`;
    }

    function generateProjectModule(): string {
        return `// Project Module - Site-specific Implementation
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;

namespace Project.YourSite.Controllers
{
    /// <summary>
    /// Project-specific controller for site-wide functionality
    /// </summary>
    public class SiteController : SitecoreController
    {
        private readonly Foundation.YourModule.ILoggingService _loggingService;
        private readonly Foundation.YourModule.IConfigurationService _configurationService;

        public SiteController(
            Foundation.YourModule.ILoggingService loggingService,
            Foundation.YourModule.IConfigurationService configurationService)
        {
            _loggingService = loggingService;
            _configurationService = configurationService;
        }

        /// <summary>
        /// Header component for the site
        /// </summary>
        public ActionResult Header()
        {
            var viewModel = new HeaderViewModel
            {
                SiteName = _configurationService.GetSetting("SiteName", "Your Site"),
                LogoUrl = _configurationService.GetSetting("LogoUrl", "/images/logo.png"),
                ShowSearch = _configurationService.GetBoolSetting("ShowHeaderSearch", true)
            };

            return View(viewModel);
        }

        /// <summary>
        /// Footer component for the site
        /// </summary>
        public ActionResult Footer()
        {
            var viewModel = new FooterViewModel
            {
                CopyrightText = _configurationService.GetSetting("CopyrightText", "© 2025 Your Site"),
                ShowSocialLinks = _configurationService.GetBoolSetting("ShowSocialLinks", true),
                ContactEmail = _configurationService.GetSetting("ContactEmail", "contact@yoursite.com")
            };

            return View(viewModel);
        }
    }

    /// <summary>
    /// Header view model
    /// </summary>
    public class HeaderViewModel
    {
        public string SiteName { get; set; }
        public string LogoUrl { get; set; }
        public bool ShowSearch { get; set; }
    }

    /// <summary>
    /// Footer view model
    /// </summary>
    public class FooterViewModel
    {
        public string CopyrightText { get; set; }
        public bool ShowSocialLinks { get; set; }
        public string ContactEmail { get; set; }
    }
}

// Project Module Configuration
namespace Project.YourSite.DI
{
    using Microsoft.Extensions.DependencyInjection;
    using Sitecore.DependencyInjection;

    public class ServicesConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            // Register project-specific services
            serviceCollection.AddScoped<ISiteSettingsService, SiteSettingsService>();
            serviceCollection.AddScoped<INavigationService, NavigationService>();
        }
    }
}

// TODO: Create layout views for the site (Main.cshtml, etc.)
// TODO: Configure site definition in Sitecore
// TODO: Set up multi-site configuration if needed
// TODO: Create CSS/SCSS for site-specific styling
// TODO: Configure CDN and static asset handling
// TODO: Set up analytics and tracking codes
`;
    }

    function generateCarouselComponent(): string {
        return `// Carousel Component - Responsive carousel with accessibility features
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;
using Glass.Mapper.Sc;

namespace Feature.Carousel.Controllers
{
    /// <summary>
    /// Carousel component controller with accessibility and responsive features
    /// </summary>
    public class CarouselController : SitecoreController
    {
        private readonly ISitecoreContext _sitecoreContext;
        private readonly Foundation.YourModule.ILoggingService _loggingService;

        public CarouselController(
            ISitecoreContext sitecoreContext,
            Foundation.YourModule.ILoggingService loggingService)
        {
            _sitecoreContext = sitecoreContext;
            _loggingService = loggingService;
        }

        public ActionResult Index()
        {
            try
            {
                var datasource = GetDatasource<ICarouselModel>();
                var slides = GetCarouselSlides(datasource);
                var renderingParameters = GetRenderingParameters();

                var viewModel = new CarouselViewModel
                {
                    Datasource = datasource,
                    Slides = slides,
                    AutoPlay = renderingParameters.AutoPlay,
                    AutoPlayInterval = renderingParameters.AutoPlayInterval,
                    ShowIndicators = renderingParameters.ShowIndicators,
                    ShowArrows = renderingParameters.ShowArrows,
                    InfiniteLoop = renderingParameters.InfiniteLoop
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering Carousel component", ex);
                return View(new CarouselViewModel());
            }
        }

        private ICarouselModel GetDatasource<T>() where T : class
        {
            if (RenderingContext.Current?.Rendering?.Item != null)
            {
                return _sitecoreContext.Cast<ICarouselModel>(RenderingContext.Current.Rendering.Item);
            }
            return _sitecoreContext.GetCurrentItem<ICarouselModel>();
        }

        private IEnumerable<ICarouselSlideModel> GetCarouselSlides(ICarouselModel datasource)
        {
            return datasource?.Slides?.Where(slide => slide != null) ?? Enumerable.Empty<ICarouselSlideModel>();
        }

        private CarouselRenderingParameters GetRenderingParameters()
        {
            var parameters = RenderingContext.Current?.Rendering?.Parameters;
            return new CarouselRenderingParameters
            {
                AutoPlay = parameters?["AutoPlay"] == "1",
                AutoPlayInterval = int.TryParse(parameters?["AutoPlayInterval"], out var interval) ? interval : 5000,
                ShowIndicators = parameters?["ShowIndicators"] != "0",
                ShowArrows = parameters?["ShowArrows"] != "0",
                InfiniteLoop = parameters?["InfiniteLoop"] != "0"
            };
        }
    }

    /// <summary>
    /// Glass Mapper model for Carousel data template
    /// </summary>
    [SitecoreType(TemplateId = "{CAROUSEL-TEMPLATE-ID}", AutoMap = true)]
    public interface ICarouselModel
    {
        [SitecoreId]
        Guid Id { get; set; }

        [SitecoreField("Title")]
        string Title { get; set; }

        [SitecoreField("Slides")]
        IEnumerable<ICarouselSlideModel> Slides { get; set; }
    }

    /// <summary>
    /// Glass Mapper model for Carousel Slide data template
    /// </summary>
    [SitecoreType(TemplateId = "{CAROUSEL-SLIDE-TEMPLATE-ID}", AutoMap = true)]
    public interface ICarouselSlideModel
    {
        [SitecoreId]
        Guid Id { get; set; }

        [SitecoreField("Title")]
        string Title { get; set; }

        [SitecoreField("Description")]
        string Description { get; set; }

        [SitecoreField("Image")]
        Glass.Mapper.Sc.Fields.Image Image { get; set; }

        [SitecoreField("Link")]
        Glass.Mapper.Sc.Fields.Link Link { get; set; }

        [SitecoreField("AltText")]
        string AltText { get; set; }
    }

    /// <summary>
    /// View model for Carousel component
    /// </summary>
    public class CarouselViewModel
    {
        public ICarouselModel Datasource { get; set; }
        public IEnumerable<ICarouselSlideModel> Slides { get; set; } = Enumerable.Empty<ICarouselSlideModel>();
        public bool AutoPlay { get; set; }
        public int AutoPlayInterval { get; set; } = 5000;
        public bool ShowIndicators { get; set; } = true;
        public bool ShowArrows { get; set; } = true;
        public bool InfiniteLoop { get; set; } = true;
        public bool HasSlides => Slides?.Any() == true;
        public string CarouselId => $"carousel-{Datasource?.Id.ToString("N") ?? Guid.NewGuid().ToString("N")}";
    }

    /// <summary>
    /// Rendering parameters for Carousel component
    /// </summary>
    public class CarouselRenderingParameters
    {
        public bool AutoPlay { get; set; }
        public int AutoPlayInterval { get; set; }
        public bool ShowIndicators { get; set; }
        public bool ShowArrows { get; set; }
        public bool InfiniteLoop { get; set; }
    }
}

/*
TypeScript for Carousel functionality:

export class CarouselComponent {
    private carousel: HTMLElement;
    private slides: HTMLElement[];
    private currentSlide: number = 0;
    private autoPlayInterval: number;
    private autoPlayTimer?: number;

    constructor(carouselId: string, options: CarouselOptions) {
        this.carousel = document.getElementById(carouselId)!;
        this.slides = Array.from(this.carousel.querySelectorAll('.carousel-slide'));
        this.autoPlayInterval = options.autoPlayInterval || 5000;
        
        this.init();
        
        if (options.autoPlay) {
            this.startAutoPlay();
        }
    }

    private init(): void {
        this.setupEventListeners();
        this.setupAccessibility();
        this.showSlide(0);
    }

    private setupEventListeners(): void {
        // Keyboard navigation
        this.carousel.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    this.nextSlide();
                    break;
            }
        });

        // Touch/swipe support
        let startX: number;
        this.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        this.carousel.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }
        });
    }

    private setupAccessibility(): void {
        this.carousel.setAttribute('role', 'region');
        this.carousel.setAttribute('aria-label', 'Image carousel');
        
        this.slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', \`Slide \${index + 1} of \${this.slides.length}\`);
        });
    }

    public nextSlide(): void {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(this.currentSlide);
    }

    public previousSlide(): void {
        this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
        this.showSlide(this.currentSlide);
    }

    private showSlide(index: number): void {
        this.slides.forEach((slide, i) => {
            slide.style.transform = \`translateX(\${(i - index) * 100}%)\`;
            slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
        });
    }

    private startAutoPlay(): void {
        this.autoPlayTimer = window.setInterval(() => {
            this.nextSlide();
        }, this.autoPlayInterval);
    }

    public stopAutoPlay(): void {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
        }
    }
}
*/

// TODO: Create Razor view with accessibility features
// TODO: Create SCSS styles following BEM methodology  
// TODO: Add data templates for Carousel and CarouselSlide
// TODO: Create rendering parameters template
// TODO: Add unit tests for controller logic
// TODO: Add E2E tests for carousel functionality
`;
    }

    function generateCustomFormsComponent(): string {
        return `// Custom Forms Component - Dynamic form builder with validation
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web.Mvc;
using System.Threading.Tasks;
using Sitecore.Mvc.Controllers;

namespace Feature.CustomForms.Controllers
{
    /// <summary>
    /// Custom Forms controller with dynamic form generation and validation
    /// </summary>
    public class CustomFormsController : SitecoreController
    {
        private readonly IFormBuilderService _formBuilderService;
        private readonly IFormSubmissionService _submissionService;
        private readonly Foundation.YourModule.ILoggingService _loggingService;

        public CustomFormsController(
            IFormBuilderService formBuilderService,
            IFormSubmissionService submissionService,
            Foundation.YourModule.ILoggingService loggingService)
        {
            _formBuilderService = formBuilderService;
            _submissionService = submissionService;
            _loggingService = loggingService;
        }

        public ActionResult Index()
        {
            try
            {
                var formDefinition = _formBuilderService.GetFormDefinition(RenderingContext.Current?.Rendering?.Item);
                var viewModel = new CustomFormViewModel
                {
                    FormDefinition = formDefinition,
                    FormId = Guid.NewGuid().ToString()
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering Custom Form", ex);
                return View(new CustomFormViewModel());
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Submit(FormSubmissionModel submission)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, errors = GetModelErrors() });
                }

                var validationResult = await _submissionService.ValidateSubmission(submission);
                if (!validationResult.IsValid)
                {
                    return Json(new { success = false, errors = validationResult.Errors });
                }

                var submissionId = await _submissionService.ProcessSubmission(submission);
                
                _loggingService.LogInformation($"Form submission processed: {submissionId}");
                
                return Json(new { 
                    success = true, 
                    message = "Form submitted successfully!",
                    submissionId = submissionId 
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error processing form submission", ex);
                return Json(new { success = false, errors = new[] { "An error occurred processing your submission." } });
            }
        }

        private string[] GetModelErrors()
        {
            return ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToArray();
        }
    }

    /// <summary>
    /// Form builder service interface
    /// </summary>
    public interface IFormBuilderService
    {
        FormDefinition GetFormDefinition(Sitecore.Data.Items.Item formItem);
        IEnumerable<FormField> GetFormFields(FormDefinition definition);
    }

    /// <summary>
    /// Form submission service interface
    /// </summary>
    public interface IFormSubmissionService
    {
        Task<ValidationResult> ValidateSubmission(FormSubmissionModel submission);
        Task<string> ProcessSubmission(FormSubmissionModel submission);
        Task SendNotifications(FormSubmissionModel submission);
    }

    /// <summary>
    /// Form definition model
    /// </summary>
    public class FormDefinition
    {
        public string FormId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public IEnumerable<FormField> Fields { get; set; } = Enumerable.Empty<FormField>();
        public FormSettings Settings { get; set; } = new FormSettings();
    }

    /// <summary>
    /// Form field model
    /// </summary>
    public class FormField
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Label { get; set; }
        public FormFieldType Type { get; set; }
        public bool Required { get; set; }
        public string Placeholder { get; set; }
        public string HelpText { get; set; }
        public IEnumerable<FormFieldOption> Options { get; set; } = Enumerable.Empty<FormFieldOption>();
        public ValidationRule[] ValidationRules { get; set; } = Array.Empty<ValidationRule>();
    }

    /// <summary>
    /// Form field types
    /// </summary>
    public enum FormFieldType
    {
        Text,
        Email,
        Phone,
        Number,
        TextArea,
        Select,
        Checkbox,
        Radio,
        FileUpload,
        Date,
        Hidden
    }

    /// <summary>
    /// Form field option for select/radio/checkbox fields
    /// </summary>
    public class FormFieldOption
    {
        public string Value { get; set; }
        public string Text { get; set; }
        public bool Selected { get; set; }
    }

    /// <summary>
    /// Form settings
    /// </summary>
    public class FormSettings
    {
        public bool RequireAuthentication { get; set; }
        public bool EnableCaptcha { get; set; }
        public bool SaveToDatabase { get; set; }
        public bool SendEmailNotification { get; set; }
        public string SuccessMessage { get; set; } = "Thank you for your submission!";
        public string RedirectUrl { get; set; }
        public int MaxFileSize { get; set; } = 5; // MB
        public string[] AllowedFileTypes { get; set; } = { ".pdf", ".doc", ".docx", ".jpg", ".png" };
    }

    /// <summary>
    /// Form submission model
    /// </summary>
    public class FormSubmissionModel
    {
        public string FormId { get; set; }
        public Dictionary<string, object> FieldValues { get; set; } = new Dictionary<string, object>();
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public string UserAgent { get; set; }
        public string IpAddress { get; set; }
    }

    /// <summary>
    /// Validation result
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string[] Errors { get; set; } = Array.Empty<string>();
    }

    /// <summary>
    /// Validation rule
    /// </summary>
    public class ValidationRule
    {
        public string Type { get; set; } // "required", "email", "minLength", "maxLength", "pattern"
        public string Value { get; set; }
        public string ErrorMessage { get; set; }
    }

    /// <summary>
    /// Custom form view model
    /// </summary>
    public class CustomFormViewModel
    {
        public FormDefinition FormDefinition { get; set; }
        public string FormId { get; set; }
        public bool HasFields => FormDefinition?.Fields?.Any() == true;
    }
}

/*
JavaScript for dynamic form functionality:

class CustomFormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.init();
    }

    init() {
        this.setupValidation();
        this.setupConditionalFields();
        this.setupFileUpload();
        this.setupFormSubmission();
    }

    setupValidation() {
        // Real-time validation
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('blur', (e) => this.validateField(e.target));
            field.addEventListener('input', (e) => this.clearFieldError(e.target));
        });
    }

    validateField(field) {
        const rules = JSON.parse(field.dataset.validationRules || '[]');
        const errors = [];

        rules.forEach(rule => {
            if (!this.validateRule(field.value, rule)) {
                errors.push(rule.errorMessage);
            }
        });

        this.displayFieldErrors(field, errors);
        return errors.length === 0;
    }

    validateRule(value, rule) {
        switch (rule.type) {
            case 'required':
                return value.trim() !== '';
            case 'email':
                return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
            case 'minLength':
                return value.length >= parseInt(rule.value);
            case 'maxLength':
                return value.length <= parseInt(rule.value);
            case 'pattern':
                return new RegExp(rule.value).test(value);
            default:
                return true;
        }
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                return;
            }

            const formData = new FormData(this.form);
            
            try {
                const response = await fetch('/CustomForms/Submit', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess(result.message);
                } else {
                    this.showErrors(result.errors);
                }
            } catch (error) {
                this.showErrors(['An error occurred submitting the form.']);
            }
        });
    }
}
*/

// TODO: Implement IFormBuilderService and IFormSubmissionService
// TODO: Create data templates for form definitions and fields
// TODO: Add GDPR compliance features (consent checkboxes, data retention)
// TODO: Implement file upload with virus scanning
// TODO: Add form analytics and conversion tracking
// TODO: Create admin interface for form management
// TODO: Add email templates for notifications
// TODO: Implement form export functionality (Excel, CSV)
`;
    }

    function generateNavigationComponent(): string {
        return `// Navigation Component - Multi-level responsive navigation
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Sitecore.Mvc.Controllers;
using Glass.Mapper.Sc;

namespace Feature.Navigation.Controllers
{
    /// <summary>
    /// Navigation controller with multi-level menu and breadcrumbs
    /// </summary>
    public class NavigationController : SitecoreController
    {
        private readonly ISitecoreContext _sitecoreContext;
        private readonly INavigationService _navigationService;
        private readonly Foundation.YourModule.ILoggingService _loggingService;

        public NavigationController(
            ISitecoreContext sitecoreContext,
            INavigationService navigationService,
            Foundation.YourModule.ILoggingService loggingService)
        {
            _sitecoreContext = sitecoreContext;
            _navigationService = navigationService;
            _loggingService = loggingService;
        }

        /// <summary>
        /// Main navigation menu
        /// </summary>
        public ActionResult MainMenu()
        {
            try
            {
                var currentItem = _sitecoreContext.GetCurrentItem<INavigationItem>();
                var rootItem = _navigationService.GetNavigationRoot(currentItem);
                var menuItems = _navigationService.GetNavigationItems(rootItem, 3); // 3 levels deep

                var viewModel = new MainMenuViewModel
                {
                    MenuItems = menuItems,
                    CurrentItem = currentItem
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering main navigation", ex);
                return View(new MainMenuViewModel());
            }
        }

        /// <summary>
        /// Breadcrumb navigation
        /// </summary>
        public ActionResult Breadcrumbs()
        {
            try
            {
                var currentItem = _sitecoreContext.GetCurrentItem<INavigationItem>();
                var breadcrumbs = _navigationService.GetBreadcrumbs(currentItem);

                var viewModel = new BreadcrumbViewModel
                {
                    Items = breadcrumbs,
                    ShowHome = true,
                    ShowCurrentPage = true
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering breadcrumbs", ex);
                return View(new BreadcrumbViewModel());
            }
        }

        /// <summary>
        /// Left navigation for current section
        /// </summary>
        public ActionResult LeftNavigation()
        {
            try
            {
                var currentItem = _sitecoreContext.GetCurrentItem<INavigationItem>();
                var sectionRoot = _navigationService.GetSectionRoot(currentItem);
                var navItems = _navigationService.GetNavigationItems(sectionRoot, 2);

                var viewModel = new LeftNavigationViewModel
                {
                    SectionRoot = sectionRoot,
                    NavigationItems = navItems,
                    CurrentItem = currentItem
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error rendering left navigation", ex);
                return View(new LeftNavigationViewModel());
            }
        }
    }

    /// <summary>
    /// Navigation service interface
    /// </summary>
    public interface INavigationService
    {
        INavigationItem GetNavigationRoot(INavigationItem currentItem);
        INavigationItem GetSectionRoot(INavigationItem currentItem);
        IEnumerable<INavigationItem> GetNavigationItems(INavigationItem rootItem, int maxLevels);
        IEnumerable<INavigationItem> GetBreadcrumbs(INavigationItem currentItem);
        bool IsItemInNavigation(INavigationItem item);
        bool IsCurrentItem(INavigationItem item, INavigationItem currentItem);
        bool IsAncestorOfCurrentItem(INavigationItem item, INavigationItem currentItem);
    }

    /// <summary>
    /// Navigation service implementation
    /// </summary>
    public class NavigationService : INavigationService
    {
        private readonly ISitecoreContext _sitecoreContext;

        public NavigationService(ISitecoreContext sitecoreContext)
        {
            _sitecoreContext = sitecoreContext;
        }

        public INavigationItem GetNavigationRoot(INavigationItem currentItem)
        {
            // Find the site root or navigation root
            var item = currentItem;
            while (item?.Parent != null && !item.IsNavigationRoot)
            {
                item = item.Parent;
            }
            return item;
        }

        public INavigationItem GetSectionRoot(INavigationItem currentItem)
        {
            // Find the section root (typically 2nd level)
            var item = currentItem;
            var root = GetNavigationRoot(currentItem);
            
            while (item?.Parent != null && item.Parent.Id != root.Id)
            {
                item = item.Parent;
            }
            
            return item ?? currentItem;
        }

        public IEnumerable<INavigationItem> GetNavigationItems(INavigationItem rootItem, int maxLevels)
        {
            return GetNavigationItemsRecursive(rootItem, 0, maxLevels);
        }

        private IEnumerable<INavigationItem> GetNavigationItemsRecursive(INavigationItem item, int currentLevel, int maxLevels)
        {
            if (item == null || currentLevel >= maxLevels) yield break;

            if (IsItemInNavigation(item))
            {
                yield return item;

                foreach (var child in item.Children?.Where(IsItemInNavigation) ?? Enumerable.Empty<INavigationItem>())
                {
                    foreach (var descendant in GetNavigationItemsRecursive(child, currentLevel + 1, maxLevels))
                    {
                        yield return descendant;
                    }
                }
            }
        }

        public IEnumerable<INavigationItem> GetBreadcrumbs(INavigationItem currentItem)
        {
            var breadcrumbs = new List<INavigationItem>();
            var item = currentItem;

            while (item != null)
            {
                if (IsItemInNavigation(item))
                {
                    breadcrumbs.Insert(0, item);
                }
                item = item.Parent;
            }

            return breadcrumbs;
        }

        public bool IsItemInNavigation(INavigationItem item)
        {
            return item != null && 
                   item.ShowInNavigation && 
                   !string.IsNullOrEmpty(item.NavigationTitle);
        }

        public bool IsCurrentItem(INavigationItem item, INavigationItem currentItem)
        {
            return item?.Id == currentItem?.Id;
        }

        public bool IsAncestorOfCurrentItem(INavigationItem item, INavigationItem currentItem)
        {
            var current = currentItem?.Parent;
            while (current != null)
            {
                if (current.Id == item.Id)
                    return true;
                current = current.Parent;
            }
            return false;
        }
    }

    /// <summary>
    /// Glass Mapper model for navigation items
    /// </summary>
    [SitecoreType(AutoMap = true)]
    public interface INavigationItem
    {
        [SitecoreId]
        Guid Id { get; set; }

        [SitecoreField("Navigation Title")]
        string NavigationTitle { get; set; }

        [SitecoreInfo(SitecoreInfoType.DisplayName)]
        string DisplayName { get; set; }

        [SitecoreInfo(SitecoreInfoType.Url)]
        string Url { get; set; }

        [SitecoreField("Show in Navigation")]
        bool ShowInNavigation { get; set; }

        [SitecoreField("Is Navigation Root")]
        bool IsNavigationRoot { get; set; }

        [SitecoreField("Navigation Description")]
        string NavigationDescription { get; set; }

        [SitecoreField("Open in New Window")]
        bool OpenInNewWindow { get; set; }

        [SitecoreParent]
        INavigationItem Parent { get; set; }

        [SitecoreChildren]
        IEnumerable<INavigationItem> Children { get; set; }
    }

    /// <summary>
    /// Main menu view model
    /// </summary>
    public class MainMenuViewModel
    {
        public IEnumerable<INavigationItem> MenuItems { get; set; } = Enumerable.Empty<INavigationItem>();
        public INavigationItem CurrentItem { get; set; }
        public bool HasMenuItems => MenuItems?.Any() == true;
    }

    /// <summary>
    /// Breadcrumb view model
    /// </summary>
    public class BreadcrumbViewModel
    {
        public IEnumerable<INavigationItem> Items { get; set; } = Enumerable.Empty<INavigationItem>();
        public bool ShowHome { get; set; } = true;
        public bool ShowCurrentPage { get; set; } = true;
        public bool HasBreadcrumbs => Items?.Any() == true;
    }

    /// <summary>
    /// Left navigation view model
    /// </summary>
    public class LeftNavigationViewModel
    {
        public INavigationItem SectionRoot { get; set; }
        public IEnumerable<INavigationItem> NavigationItems { get; set; } = Enumerable.Empty<INavigationItem>();
        public INavigationItem CurrentItem { get; set; }
        public bool HasNavigationItems => NavigationItems?.Any() == true;
    }
}

/*
SCSS for responsive navigation:

.main-navigation {
  &__list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    
    @media (max-width: 768px) {
      flex-direction: column;
      position: fixed;
      top: 60px;
      left: -100%;
      width: 100%;
      background: white;
      transition: left 0.3s ease;
      
      &--open {
        left: 0;
      }
    }
  }

  &__item {
    position: relative;
    
    &:hover .main-navigation__submenu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }

  &__link {
    display: block;
    padding: 1rem;
    text-decoration: none;
    transition: background-color 0.2s;
    
    &:hover,
    &:focus {
      background-color: #f5f5f5;
    }
    
    &--current {
      font-weight: bold;
      background-color: #e3f2fd;
    }
  }

  &__submenu {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 200px;
    background: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    z-index: 1000;
    
    @media (max-width: 768px) {
      position: static;
      opacity: 1;
      visibility: visible;
      transform: none;
      box-shadow: none;
      margin-left: 1rem;
    }
  }

  &__toggle {
    display: none;
    
    @media (max-width: 768px) {
      display: block;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  }
}

.breadcrumbs {
  &__list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    flex-wrap: wrap;
  }

  &__item {
    &:not(:last-child)::after {
      content: ' / ';
      margin: 0 0.5rem;
      color: #666;
    }
  }

  &__link {
    color: #0066cc;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
    
    &--current {
      color: #333;
      pointer-events: none;
    }
  }
}
*/

// TODO: Create Razor views for MainMenu, Breadcrumbs, and LeftNavigation
// TODO: Add data templates with navigation fields
// TODO: Implement search functionality in navigation
// TODO: Add mobile hamburger menu JavaScript
// TODO: Create sitemap generation functionality
// TODO: Add navigation caching for performance
// TODO: Implement mega menu support for large sites
// TODO: Add structured data for breadcrumbs (JSON-LD)
`;
    }
    
    // STEP 2: Try to load PromptManager AFTER commands are stable
    setTimeout(() => {
        try {
            console.log('🔧 Attempting to load PromptManager...');
            const { PromptManager } = require('./promptManager');
            promptManager = new PromptManager(context);
            console.log('✅ PromptManager loaded successfully!');
            
            // Setup event listeners
            const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(() => {
                if (promptManager) promptManager.onEditorChanged();
            });
            
            const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
                if (promptManager) promptManager.onDocumentChanged(event);
            });
            
            context.subscriptions.push(onDidChangeActiveTextEditor, onDidChangeTextDocument);
            
            // Initialize auto-suggestions if enabled
            const config = vscode.workspace.getConfiguration('dxpPromptLibrary');
            if (config.get('autoSuggest')) {
                promptManager.enableAutoSuggestions();
            }
            
            vscode.window.showInformationMessage('🎉 DXP Prompt Library fully loaded! All Sitecore/Helix features available.');
            
        } catch (error) {
            console.warn('⚠️ PromptManager failed to load, but commands still work in basic mode:', error);
            vscode.window.showInformationMessage('📝 DXP Extension running in basic mode. Core commands available.');
        }
    }, 2000); // Delay PromptManager loading to ensure commands are registered first

    // Helper function for comprehensive prompt search
    async function performPromptSearch(searchTerm: string): Promise<any[]> {
        try {
            // Try to load search data from promptData.json if available
            const promptDataPath = path.join(__dirname, 'promptData.json');
            let searchResults: any[] = [];
            
            if (require('fs').existsSync(promptDataPath)) {
                const promptData = JSON.parse(require('fs').readFileSync(promptDataPath, 'utf8'));
                
                // Extract searchable items from JSON data
                if (promptData.categories && promptData.categories.components) {
                    for (const [componentKey, component] of Object.entries(promptData.categories.components as any)) {
                        const comp = component as any;
                        for (const [promptKey, promptInfo] of Object.entries(comp.prompts)) {
                            const prompt = promptInfo as any;
                            searchResults.push({
                                label: `${comp.name} - ${promptKey}`,
                                description: comp.description,
                                detail: prompt.prompt.substring(0, 100) + '...',
                                category: 'Components',
                                keywords: prompt.tags || [],
                                promptData: prompt.prompt,
                                context: prompt.context
                            });
                        }
                    }
                }
            }
            
            // Fallback to hardcoded list if JSON loading fails
            if (searchResults.length === 0) {
                searchResults = [
                    // Foundation prompts
                    { label: '🏗️ Foundation Service Interface', description: 'Create foundation service interface with DI', detail: 'Foundation layer service with dependency injection', category: 'Foundation', keywords: ['foundation', 'service', 'interface', 'di', 'dependency'] },
                    { label: '🏗️ Logging Service', description: 'Implement logging service with Sitecore.Diagnostics', detail: 'Comprehensive logging with Sitecore integration', category: 'Foundation', keywords: ['logging', 'diagnostics', 'foundation', 'service'] },
                    { label: '🏗️ Cache Service', description: 'Create caching service with Sitecore cache', detail: 'Caching implementation with Sitecore cache manager', category: 'Foundation', keywords: ['cache', 'caching', 'foundation', 'performance'] },
                    
                    // Feature prompts
                    { label: '🎯 Feature Controller', description: 'Create feature controller with error handling', detail: 'MVC controller with proper error handling and logging', category: 'Feature', keywords: ['controller', 'feature', 'mvc', 'error', 'handling'] },
                    { label: '🎯 Glass Mapper Model', description: 'Create Glass Mapper interface for data template', detail: 'Model interface with Glass Mapper attributes', category: 'Feature', keywords: ['model', 'glass', 'mapper', 'template', 'interface'] },
                    { label: '🎯 View Model', description: 'Build view model with validation', detail: 'View model with proper validation and business logic', category: 'Feature', keywords: ['viewmodel', 'view', 'model', 'validation'] },
                    { label: '🎯 Razor View', description: 'Create accessible Razor view template', detail: 'Responsive Razor view with accessibility features', category: 'Feature', keywords: ['razor', 'view', 'template', 'accessibility', 'responsive'] },
                    
                    // Project prompts
                    { label: '🚀 Site Controller', description: 'Create project-specific site controller', detail: 'Project layer controller for site-wide functionality', category: 'Project', keywords: ['project', 'site', 'controller', 'layout'] },
                    { label: '🚀 Layout View', description: 'Build main layout view for site', detail: 'Master layout with navigation and footer', category: 'Project', keywords: ['layout', 'master', 'site', 'navigation'] },
                    { label: '🚀 Site Configuration', description: 'Configure site settings and multi-site setup', detail: 'Multi-site configuration and settings', category: 'Project', keywords: ['configuration', 'site', 'settings', 'multisite'] },
                    
                    // Component prompts
                    { label: '🎠 Carousel Component', description: 'Generate responsive carousel with accessibility', detail: 'Responsive carousel with touch support and accessibility', category: 'Components', keywords: ['carousel', 'responsive', 'accessibility', 'touch'] },
                    { label: '📝 Custom Forms', description: 'Create dynamic form builder with validation', detail: 'Form builder with validation and submission handling', category: 'Components', keywords: ['forms', 'validation', 'dynamic', 'builder'] },
                    { label: '🧭 Navigation', description: 'Build multi-level responsive navigation', detail: 'Multi-level navigation with breadcrumbs', category: 'Components', keywords: ['navigation', 'menu', 'breadcrumbs', 'responsive'] },
                    { label: '🔍 Search Component', description: 'Intelligent search with auto-complete', detail: 'Search with faceting and auto-complete', category: 'Components', keywords: ['search', 'autocomplete', 'faceting', 'solr'] },
                    { label: '🎨 Media Gallery', description: 'Responsive image and video gallery', detail: 'Gallery with lazy loading and lightbox', category: 'Components', keywords: ['gallery', 'media', 'lazy', 'lightbox'] },
                    
                    // Testing prompts
                    { label: '🧪 Unit Test', description: 'Create unit test with mocking setup', detail: 'Comprehensive unit test with mocking framework', category: 'Testing', keywords: ['unit', 'test', 'mock', 'testing', 'mstest'] },
                    { label: '🧪 Integration Test', description: 'Build integration test for Sitecore components', detail: 'Integration test with Sitecore context', category: 'Testing', keywords: ['integration', 'test', 'sitecore', 'context'] },
                    { label: '🧪 E2E Test', description: 'Create end-to-end test with Selenium', detail: 'Browser automation test with Selenium', category: 'Testing', keywords: ['e2e', 'selenium', 'automation', 'browser', 'test'] },
                    { label: '🧪 Performance Test', description: 'Load testing and performance benchmarks', detail: 'Performance testing with k6 or similar tools', category: 'Testing', keywords: ['performance', 'load', 'benchmark', 'k6'] },
                    { label: '🧪 Accessibility Test', description: 'WCAG compliance and accessibility validation', detail: 'Accessibility testing with axe-core', category: 'Testing', keywords: ['accessibility', 'wcag', 'axe', 'compliance'] },
                    
                    // Frontend prompts
                    { label: '🎨 SCSS Component', description: 'Create component styles with BEM methodology', detail: 'Responsive SCSS with BEM naming convention', category: 'Frontend', keywords: ['scss', 'css', 'bem', 'responsive', 'styles'] },
                    { label: '🎨 TypeScript Module', description: 'Build TypeScript module for interactivity', detail: 'TypeScript module with proper typing and error handling', category: 'Frontend', keywords: ['typescript', 'javascript', 'module', 'interactive'] },
                    { label: '🎨 Responsive Grid', description: 'Implement CSS Grid/Flexbox layout system', detail: 'Modern CSS layout with Grid and Flexbox', category: 'Frontend', keywords: ['grid', 'flexbox', 'layout', 'responsive', 'css'] },
                    { label: '🎨 Animation Library', description: 'Create CSS animations and transitions', detail: 'Smooth animations with CSS and JavaScript', category: 'Frontend', keywords: ['animation', 'css', 'transition', 'effects'] },
                    
                    // DevOps/Deployment prompts
                    { label: '🚀 Azure DevOps Pipeline', description: 'Create CI/CD pipeline for Sitecore deployment', detail: 'Complete Azure DevOps pipeline with build and deployment', category: 'DevOps', keywords: ['azure', 'devops', 'pipeline', 'cicd', 'deployment'] },
                    { label: '🚀 Docker Setup', description: 'Containerization for development and deployment', detail: 'Docker compose and configuration for Sitecore development', category: 'DevOps', keywords: ['docker', 'container', 'sitecore', 'development'] },
                    { label: '🚀 Environment Configuration', description: 'Multi-environment setup and management', detail: 'Configuration management for different environments', category: 'DevOps', keywords: ['environment', 'configuration', 'management', 'settings'] },
                    { label: '🚀 Monitoring Setup', description: 'Application monitoring and alerting', detail: 'Monitoring with Application Insights and health checks', category: 'DevOps', keywords: ['monitoring', 'alerting', 'insights', 'health'] },
                    { label: '🚀 SSL Configuration', description: 'HTTPS setup and certificate management', detail: 'SSL/TLS configuration and certificate automation', category: 'DevOps', keywords: ['ssl', 'https', 'certificate', 'security'] },
                    
                    // Maintenance prompts
                    { label: '🔧 Log Analysis', description: 'Log aggregation and analysis setup', detail: 'ELK stack configuration for log analysis', category: 'Maintenance', keywords: ['logging', 'elk', 'analysis', 'serilog'] },
                    { label: '🔧 Performance Optimization', description: 'Performance tuning and optimization guides', detail: 'Performance optimization for Sitecore applications', category: 'Maintenance', keywords: ['performance', 'optimization', 'tuning', 'cache'] },
                    { label: '🔧 Security Updates', description: 'Security patch management and updates', detail: 'Security update procedures and vulnerability management', category: 'Maintenance', keywords: ['security', 'patches', 'updates', 'vulnerability'] },
                    { label: '🔧 Backup Strategy', description: 'Backup and disaster recovery procedures', detail: 'Comprehensive backup and recovery strategy', category: 'Maintenance', keywords: ['backup', 'recovery', 'disaster', 'strategy'] }
                ];
            }

            return searchResults.filter(prompt => {
                const searchLower = searchTerm.toLowerCase();
                return prompt.label.toLowerCase().includes(searchLower) ||
                       prompt.description.toLowerCase().includes(searchLower) ||
                       prompt.detail.toLowerCase().includes(searchLower) ||
                       prompt.category.toLowerCase().includes(searchLower) ||
                       (prompt.keywords && prompt.keywords.some((keyword: string) => keyword.toLowerCase().includes(searchLower)));
            });
        } catch (error) {
            console.error('Error in performPromptSearch:', error);
            return [];
        }
    }

    // Helper function to handle search results
    async function handleSearchResult(selectedResult: any, context: vscode.ExtensionContext) {
        try {
            // Check if it's a complete template that should generate code
            if (selectedResult.label.includes('Foundation') || 
                selectedResult.label.includes('Feature') || 
                selectedResult.label.includes('Project') ||
                selectedResult.label.includes('Component')) {                // For Foundation/Feature/Project templates, generate full modules
                    if (selectedResult.category === 'Foundation') {
                        await generateSitecoreCode('🏗️ Sitecore Helix: Create Foundation Module', context);
                    } else if (selectedResult.category === 'Feature') {
                        await generateSitecoreCode('🎯 Sitecore Helix: Create Feature Module', context);
                    } else if (selectedResult.category === 'Project') {
                        await generateSitecoreCode('🚀 Sitecore Helix: Create Project Module', context);
                    } else if (selectedResult.category === 'Components') {
                        if (selectedResult.label.includes('Carousel')) {
                            await generateSitecoreCode('🎠 Sitecore Component: Carousel', context);
                        } else if (selectedResult.label.includes('Forms')) {
                            await generateSitecoreCode('📝 Sitecore Component: Custom Forms', context);
                        } else if (selectedResult.label.includes('Navigation')) {
                            await generateSitecoreCode('🧭 Sitecore Component: Navigation', context);
                        }
                    } else {
                        // For other items, insert snippet
                        await insertRelatedSnippet(selectedResult);
                    }
            } else {
                // For other prompts, insert snippet or show more options
                const action = await vscode.window.showQuickPick([
                    { label: '📝 Insert Code Snippet', description: 'Insert a code snippet for this template' },
                    { label: '📖 Show Implementation Guide', description: 'Display step-by-step implementation guide' },
                    { label: '🔗 Open Documentation', description: 'Open relevant documentation and best practices' }
                ], {
                    placeHolder: `What would you like to do with "${selectedResult.label}"?`
                });

                if (action) {
                    switch (action.label) {
                        case '📝 Insert Code Snippet':
                            await insertRelatedSnippet(selectedResult);
                            break;
                        case '📖 Show Implementation Guide':
                            await showImplementationGuide(selectedResult);
                            break;
                        case '🔗 Open Documentation':
                            await openRelatedDocumentation(selectedResult);
                            break;
                    }
                }
            }
        } catch (error) {
            console.error('Error handling search result:', error);
            vscode.window.showErrorMessage(`Error handling search result: ${error}`);
        }
    }

    // Helper function to show SDLC-specific prompts
    async function showSDLCPrompts(sdlcStage: string) {
        const sdlcPrompts: { [key: string]: any[] } = {
            '📋 Planning & Analysis': [
                { label: 'User Story Template', description: 'Create comprehensive user stories with acceptance criteria' },
                { label: 'Technical Requirements', description: 'Document technical requirements and constraints' },
                { label: 'Architecture Diagram', description: 'Generate Helix architecture documentation' },
                { label: 'API Specification', description: 'Create API documentation and OpenAPI specs' },
                { label: 'Data Model Design', description: 'Design Sitecore data templates and relationships' },
                { label: 'Security Requirements', description: 'Define security requirements and compliance needs' }
            ],
            '💻 Development & Implementation': [
                { label: 'Foundation Module', description: 'Create complete Foundation layer module' },
                { label: 'Feature Module', description: 'Generate Feature layer with MVC components' },
                { label: 'Project Module', description: 'Build Project layer with site-specific code' },
                { label: 'Component Library', description: 'Create reusable UI component collection' },
                { label: 'API Endpoints', description: 'Implement REST API with proper error handling' },
                { label: 'Database Integration', description: 'Set up Entity Framework and data access' }
            ],
            '🧪 Testing & Quality Assurance': [
                { label: 'Unit Test Suite', description: 'Comprehensive unit tests with mocking' },
                { label: 'Integration Tests', description: 'Integration tests for Sitecore components' },
                { label: 'E2E Test Framework', description: 'End-to-end testing with Selenium' },
                { label: 'Performance Tests', description: 'Load testing and performance benchmarks' },
                { label: 'Security Testing', description: 'Security testing and vulnerability assessment' },
                { label: 'Accessibility Testing', description: 'WCAG compliance and accessibility validation' }
            ],
            '🚀 Deployment & DevOps': [
                { label: 'Azure DevOps Pipeline', description: 'Create CI/CD pipeline for Sitecore deployment' },
                { label: 'Docker Setup', description: 'Containerization for development and deployment' },
                { label: 'Environment Configuration', description: 'Multi-environment setup and management' },
                { label: 'Monitoring Setup', description: 'Application monitoring and alerting' },
                { label: 'Backup Strategy', description: 'Backup and disaster recovery procedures' },
                { label: 'SSL Configuration', description: 'HTTPS setup and certificate management' }
            ],
            '🔧 Maintenance & Support': [
                { label: 'Monitoring Dashboard', description: 'Application health monitoring and dashboards' },
                { label: 'Log Analysis', description: 'Log aggregation and analysis setup' },
                { label: 'Performance Optimization', description: 'Performance tuning and optimization guides' },
                { label: 'Troubleshooting Guide', description: 'Common issues and resolution procedures' },
                { label: 'Security Updates', description: 'Security patch management and updates' },
                { label: 'User Documentation', description: 'End-user and admin documentation' }
            ],
            '📈 Optimization & Enhancement': [
                { label: 'Performance Analysis', description: 'Performance profiling and optimization recommendations' },
                { label: 'A/B Testing Setup', description: 'A/B testing framework and analytics integration' },
                { label: 'User Feedback System', description: 'Feedback collection and analysis system' },
                { label: 'Feature Enhancement', description: 'Feature improvement and expansion templates' },
                { label: 'Analytics Integration', description: 'Advanced analytics and tracking setup' },
                { label: 'Scalability Planning', description: 'Scalability assessment and improvement plan' }
            ]
        };

        const stagePrompts = sdlcPrompts[sdlcStage] || [];
        
        if (stagePrompts.length === 0) {
            vscode.window.showInformationMessage(`No specific prompts available for ${sdlcStage} yet.`);
            return;
        }

        const selected = await vscode.window.showQuickPick(stagePrompts, {
            placeHolder: `Select ${sdlcStage} template`,
            matchOnDescription: true
        });

        if (selected) {
            await handleSDLCSelection(selected, sdlcStage);
        }
    }

    // Helper function to handle SDLC selection
    async function handleSDLCSelection(selection: any, stage: string) {
        const action = await vscode.window.showQuickPick([
            { label: '📝 Generate Template', description: 'Create template or code for this item' },
            { label: '📖 Show Best Practices', description: 'Display best practices and guidelines' },
            { label: '🔗 Open Resources', description: 'Open relevant documentation and resources' }
        ], {
            placeHolder: `What would you like to do with "${selection.label}"?`
        });

        if (action) {
            switch (action.label) {
                case '📝 Generate Template':
                    await generateSDLCTemplate(selection, stage);
                    break;
                case '📖 Show Best Practices':
                    await showBestPractices(selection, stage);
                    break;
                case '🔗 Open Resources':
                    await openSDLCResources(selection, stage);
                    break;
            }
        }
    }

    // Additional helper functions for enhanced functionality
    async function insertRelatedSnippet(item: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        let snippet = `// ${item.label} - ${item.description}\n// TODO: Implement ${item.label}\n`;
        
        if (item.category === 'Foundation') {
            snippet += `// Foundation layer implementation\n// Add service interface and implementation\n`;
        } else if (item.category === 'Feature') {
            snippet += `// Feature layer implementation\n// Add controller, model, and view\n`;
        } else if (item.category === 'Testing') {
            snippet += `// Testing implementation\n// Add test setup and assertions\n`;
        }

        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, snippet + '\n');
        });

        vscode.window.showInformationMessage(`✅ Inserted snippet for ${item.label}!`);
    }

    async function showImplementationGuide(item: any) {
        const guide = `# Implementation Guide: ${item.label}

## Description
${item.description}

## Category
${item.category}

## Implementation Steps
1. Set up the basic structure
2. Implement core functionality
3. Add error handling and logging
4. Create unit tests
5. Add documentation

## Best Practices
- Follow Helix architecture principles
- Use dependency injection
- Implement proper error handling
- Add comprehensive logging
- Include unit tests

## Related Resources
- Sitecore Helix Documentation
- Best Practices Guide
- Code Examples`;

        // Create and show the guide in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: guide,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }

    async function openRelatedDocumentation(item: any) {
        const urls = {
            'Foundation': 'https://helix.sitecore.net/principles/architecture-principles/layers.html',
            'Feature': 'https://helix.sitecore.net/principles/architecture-principles/layers.html',
            'Project': 'https://helix.sitecore.net/principles/architecture-principles/layers.html',
            'Testing': 'https://docs.microsoft.com/en-us/dotnet/core/testing/',
            'DevOps': 'https://docs.microsoft.com/en-us/azure/devops/'
        };

        const url = urls[item.category as keyof typeof urls] || 'https://helix.sitecore.net/';
        vscode.env.openExternal(vscode.Uri.parse(url));
        vscode.window.showInformationMessage(`Opening documentation for ${item.category}...`);
    }

    async function generateSDLCTemplate(selection: any, stage: string) {
        // Generate templates based on SDLC stage and selection
        const templates: { [key: string]: string } = {
            'User Story Template': `# User Story: ${selection.label}

## As a [user type]
I want [functionality]
So that [business value]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Definition of Done
- [ ] Code implemented
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated`,

            'Unit Test Suite': `// Unit Test Suite Template
[TestClass]
public class {{ComponentName}}Tests
{
    private Mock<ISitecoreContext> _mockContext;
    private Mock<ILoggingService> _mockLogger;
    private {{ComponentName}}Controller _controller;

    [TestInitialize]
    public void Setup()
    {
        _mockContext = new Mock<ISitecoreContext>();
        _mockLogger = new Mock<ILoggingService>();
        _controller = new {{ComponentName}}Controller(_mockContext.Object, _mockLogger.Object);
    }

    [TestMethod]
    public void Method_ValidInput_ReturnsExpectedResult()
    {
        // Arrange
        var testData = new TestModel { Property = "TestValue" };
        _mockContext.Setup(x => x.GetCurrentItem<ITestModel>()).Returns(testData);

        // Act
        var result = _controller.Index() as ViewResult;

        // Assert
        Assert.IsNotNull(result);
        Assert.IsInstanceOfType(result.Model, typeof(TestViewModel));
    }
}`,

            'Azure DevOps Pipeline': `# Azure DevOps Pipeline Template
trigger:
- main
- develop

pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'

stages:
- stage: Build
  displayName: 'Build Stage'
  jobs:
  - job: Build
    displayName: 'Build Job'
    steps:
    - task: NuGetRestore@1
      displayName: 'Restore NuGet packages'
    
    - task: VSBuild@1
      displayName: 'Build solution'
      inputs:
        solution: '**/*.sln'
        configuration: '$(buildConfiguration)'
    
    - task: VSTest@2
      displayName: 'Run tests'
      inputs:
        testAssemblyPattern: '**/*Tests.dll'
        configuration: '$(buildConfiguration)'`
            };

        const template = templates[selection.label] || getExtendedSDLCTemplate(selection.label, stage);
        
        const doc = await vscode.workspace.openTextDocument({
            content: template,
            language: selection.label.includes('Pipeline') ? 'yaml' : selection.label.includes('Story') ? 'markdown' : 'csharp'
        });
        await vscode.window.showTextDocument(doc);
        
        vscode.window.showInformationMessage(`✅ Generated ${selection.label} template!`);
    }

    // Extended SDLC template generator
    function getExtendedSDLCTemplate(label: string, stage: string): string {
        const extendedTemplates: { [key: string]: string } = {
            'Technical Requirements': `# Technical Requirements Document

## Project Overview
- **Project Name**: [Project Name]
- **Version**: [Version Number]
- **Date**: ${new Date().toLocaleDateString()}

## Technical Requirements

### Functional Requirements
1. **User Authentication**
   - SSO integration with Azure AD
   - Role-based access control
   - Session management

2. **Content Management**
   - Sitecore Experience Platform integration
   - Multi-language support
   - Workflow approval process

3. **Performance Requirements**
   - Page load time < 3 seconds
   - Support for 1000+ concurrent users
   - 99.9% uptime SLA

### Non-Functional Requirements
1. **Security**
   - HTTPS enforcement
   - OWASP security guidelines
   - Data encryption at rest and in transit

2. **Scalability**
   - Horizontal scaling capability
   - Load balancing support
   - CDN integration

3. **Maintainability**
   - Helix architecture compliance
   - Comprehensive logging
   - Automated testing coverage > 80%

### Technology Stack
- **Frontend**: React/Vue.js, TypeScript, SCSS
- **Backend**: .NET Core, C#, Sitecore XP
- **Database**: SQL Server, MongoDB (for analytics)
- **DevOps**: Azure DevOps, Docker, Kubernetes
- **Monitoring**: Application Insights, ELK Stack`,

            'Architecture Diagram': `# Architecture Documentation

## Sitecore Helix Architecture

### Layer Structure
\`\`\`
Project Layer
├── Project.Website
├── Project.Common
└── Project.Serialization

Feature Layer
├── Feature.Navigation
├── Feature.Search
├── Feature.Forms
└── Feature.Media

Foundation Layer
├── Foundation.Logging
├── Foundation.Cache
├── Foundation.DI
└── Foundation.Configuration
\`\`\`

### Dependencies Flow
- Project → Feature → Foundation
- No circular dependencies
- Clear separation of concerns

### Component Architecture
\`\`\`mermaid
graph TD
    A[Frontend] --> B[Controller]
    B --> C[Service Layer]
    C --> D[Repository]
    D --> E[Data Access]
    E --> F[Database]
    
    B --> G[Cache Service]
    B --> H[Logging Service]
    C --> I[External APIs]
\`\`\`

### Security Architecture
- Authentication: Azure AD B2C
- Authorization: Role-based (RBAC)
- Data Protection: TLS 1.3, AES-256
- API Security: OAuth 2.0, JWT tokens`,

            'API Specification': `# API Specification Document

## Base Information
- **Base URL**: https://api.yoursite.com/v1
- **Authentication**: Bearer Token (JWT)
- **Content Type**: application/json

## Endpoints

### Authentication
\`\`\`http
POST /auth/login
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}

Response:
{
    "token": "string",
    "expires": "datetime",
    "user": {
        "id": "string",
        "name": "string",
        "roles": ["string"]
    }
}
\`\`\`

### Content Management
\`\`\`http
GET /content/{id}
Authorization: Bearer {token}

Response:
{
    "id": "string",
    "title": "string",
    "content": "string",
    "lastModified": "datetime",
    "author": "string"
}
\`\`\`

### Error Responses
\`\`\`json
{
    "error": {
        "code": "string",
        "message": "string",
        "details": ["string"]
    }
}
\`\`\``,

            'Data Model Design': `# Sitecore Data Template Design

## Template Hierarchy

### Base Templates
\`\`\`
/sitecore/templates/Foundation/Base Templates/
├── _Standard Values
├── _Metadata
└── _SEO Fields
\`\`\`

### Content Templates
\`\`\`
/sitecore/templates/Feature/Content/
├── Article
│   ├── Title (Single-Line Text)
│   ├── Summary (Multi-Line Text)
│   ├── Body (Rich Text)
│   ├── Image (Image)
│   └── Tags (Multilist)
├── Event
│   ├── Event Name (Single-Line Text)
│   ├── Start Date (Datetime)
│   ├── End Date (Datetime)
│   └── Location (Single-Line Text)
└── Product
    ├── Product Name (Single-Line Text)
    ├── Price (Number)
    ├── Description (Rich Text)
    └── Category (Droplink)
\`\`\`

### Glass Mapper Models
\`\`\`csharp
[SitecoreType(TemplateId = "{ARTICLE-TEMPLATE-ID}")]
public interface IArticle : IBaseContent
{
    [SitecoreField("Title")]
    string Title { get; set; }
    
    [SitecoreField("Summary")]
    string Summary { get; set; }
    
    [SitecoreField("Body")]
    string Body { get; set; }
    
    [SitecoreField("Image")]
    Glass.Mapper.Sc.Fields.Image Image { get; set; }
    
    [SitecoreField("Tags")]
    IEnumerable<ITag> Tags { get; set; }
}
\`\`\``,

            'Security Requirements': `# Security Requirements Document

## Security Framework
- **Standard**: OWASP Top 10 compliance
- **Certification**: ISO 27001, SOC 2 Type II
- **Regulations**: GDPR, CCPA compliance

## Authentication & Authorization
- **Multi-Factor Authentication**: Required for admin users
- **Password Policy**: Minimum 12 characters, complexity requirements
- **Session Management**: 30-minute timeout, secure session handling
- **Role-Based Access Control**: Granular permissions

## Data Protection
- **Encryption in Transit**: TLS 1.3 minimum
- **Encryption at Rest**: AES-256
- **Key Management**: Azure Key Vault
- **Data Classification**: Public, Internal, Confidential, Restricted

## Security Controls
- **Input Validation**: Server-side validation for all inputs
- **Output Encoding**: Prevent XSS attacks
- **SQL Injection Prevention**: Parameterized queries only
- **CSRF Protection**: Anti-forgery tokens
- **Content Security Policy**: Strict CSP headers

## Monitoring & Logging
- **Security Event Logging**: All authentication events
- **Anomaly Detection**: Unusual access patterns
- **Incident Response**: 24/7 monitoring
- **Audit Trail**: Complete user action logging

## Compliance Requirements
- **Data Retention**: 7 years for financial data
- **Right to be Forgotten**: GDPR compliance
- **Data Portability**: User data export capability
- **Breach Notification**: 72-hour notification requirement`,

            'Performance Tests': `# Performance Testing Suite

## Load Testing Configuration
\`\`\`yaml
# k6 Load Test Configuration
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.02'],   // Error rate under 2%
  },
};
\`\`\`

## Performance Benchmarks
- **Homepage Load Time**: < 2 seconds
- **Search Results**: < 1 second
- **Form Submission**: < 3 seconds
- **Image Load Time**: < 1 second
- **API Response Time**: < 500ms

## Monitoring Metrics
\`\`\`csharp
// Performance monitoring attributes
[MethodImpl(MethodImplOptions.NoInlining)]
public ActionResult Index()
{
    using var activity = Activity.StartActivity("Homepage.Index");
    var stopwatch = Stopwatch.StartNew();
    
    try
    {
        // Controller logic
        var result = View(viewModel);
        
        // Log performance metrics
        _logger.LogInformation("Homepage rendered in {ElapsedMs}ms", 
            stopwatch.ElapsedMilliseconds);
            
        return result;
    }
    finally
    {
        stopwatch.Stop();
    }
}
\`\`\``,

            'Accessibility Testing': `# Accessibility Testing Guide

## WCAG 2.1 AA Compliance Checklist

### Level A Requirements
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Page has proper heading structure (h1-h6)
- [ ] Content is keyboard accessible
- [ ] No seizure-inducing content

### Level AA Requirements
- [ ] Color contrast ratio 4.5:1 for normal text
- [ ] Color contrast ratio 3:1 for large text
- [ ] Text can be resized to 200% without horizontal scrolling
- [ ] Focus indicators are visible
- [ ] Page has skip navigation links

## Automated Testing Tools
\`\`\`javascript
// axe-core integration for automated testing
describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    await page.goto('http://localhost:3000');
    const results = await page.evaluate(() => {
      return axe.run();
    });
    
    expect(results.violations).toHaveLength(0);
  });
});
\`\`\`

## Manual Testing Checklist
- [ ] Navigation with keyboard only
- [ ] Screen reader compatibility (NVDA, JAWS)
- [ ] High contrast mode testing
- [ ] Mobile accessibility testing
- [ ] Voice control testing

## ARIA Implementation
\`\`\`html
<!-- Proper ARIA labeling examples -->
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a href="#" role="menuitem" aria-haspopup="true">Products</a>
      <ul role="menu" aria-label="Products submenu">
        <li role="none">
          <a href="#" role="menuitem">Software</a>
        </li>
      </ul>
    </li>
  </ul>
</nav>
\`\`\``,

            'Docker Setup': `# Docker Configuration

## Development Environment
\`\`\`dockerfile
# Dockerfile for Sitecore development
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Project.Website/Project.Website.csproj", "Project.Website/"]
RUN dotnet restore "Project.Website/Project.Website.csproj"
COPY . .
WORKDIR "/src/Project.Website"
RUN dotnet build "Project.Website.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Project.Website.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Project.Website.dll"]
\`\`\`

## Docker Compose
\`\`\`yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
    depends_on:
      - database
      
  database:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      SA_PASSWORD: "YourPassword123!"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
      
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
\`\`\``,

            'Monitoring Setup': `# Application Monitoring Configuration

## Application Insights Setup
\`\`\`csharp
// Startup.cs configuration
public void ConfigureServices(IServiceCollection services)
{
    services.AddApplicationInsightsTelemetry();
    
    // Custom telemetry
    services.AddSingleton<ITelemetryInitializer, CustomTelemetryInitializer>();
    services.AddScoped<IPerformanceTracker, PerformanceTracker>();
}

public class CustomTelemetryInitializer : ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        telemetry.Context.GlobalProperties["Environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        telemetry.Context.GlobalProperties["Version"] = Assembly.GetExecutingAssembly().GetName().Version?.ToString();
    }
}
\`\`\`

## Health Checks
\`\`\`csharp
// Health check configuration
services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<ExternalApiHealthCheck>("external-api")
    .AddCheck<CacheHealthCheck>("cache");

// Health check endpoint
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
\`\`\`

## Custom Metrics
\`\`\`csharp
public class PerformanceTracker : IPerformanceTracker
{
    private readonly TelemetryClient _telemetryClient;
    
    public void TrackDependency(string dependencyName, TimeSpan duration, bool success)
    {
        _telemetryClient.TrackDependency(dependencyName, "HTTP", DateTime.UtcNow.Subtract(duration), duration, success);
    }
    
    public void TrackCustomEvent(string eventName, Dictionary<string, string> properties = null)
    {
        _telemetryClient.TrackEvent(eventName, properties);
    }
}
\`\`\``,

            'Log Analysis': `# Log Analysis and Management

## Structured Logging with Serilog
\`\`\`csharp
// Program.cs configuration
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentUserName()
    .WriteTo.Console()
    .WriteTo.File("logs/application-.txt", rollingInterval: RollingInterval.Day)
    .WriteTo.ApplicationInsights(TelemetryConfiguration.Active, TelemetryConverter.Traces)
    .CreateLogger();

// Usage in controllers
public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    
    public ActionResult Index()
    {
        _logger.LogInformation("Homepage requested by {User} from {IPAddress}", 
            User.Identity.Name, HttpContext.Connection.RemoteIpAddress);
            
        using (_logger.BeginScope("HomePageRendering"))
        {
            // Page rendering logic
        }
        
        return View();
    }
}
\`\`\`

## ELK Stack Configuration
\`\`\`yaml
# docker-compose.yml for ELK stack
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
      
  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
      
  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
\`\`\`

## Log Query Examples
\`\`\`
// Application Insights KQL queries
requests
| where timestamp > ago(1h)
| summarize count() by bin(timestamp, 5m), resultCode
| render timechart

exceptions
| where timestamp > ago(24h)
| summarize count() by type, bin(timestamp, 1h)
| render columnchart
\`\`\``
        };

        return extendedTemplates[label] || `// Template for ${label}
// Generated for ${stage}
// This template provides comprehensive implementation guidance and best practices.
// Customize this template based on your specific project requirements.

## Implementation Steps:
1. Review the requirements and scope
2. Set up the development environment
3. Implement core functionality
4. Add comprehensive testing
5. Document the implementation
6. Deploy and monitor

## Best Practices:
- Follow Helix architecture principles
- Implement proper error handling and logging
- Use dependency injection patterns
- Write comprehensive unit tests
- Document all public interfaces
- Follow security best practices

## Related Resources:
- Sitecore Helix Documentation
- .NET Development Best Practices
- Testing Framework Guidelines`;
    }

    async function showBestPractices(selection: any, stage: string) {
        const practices = `# Best Practices: ${selection.label}

## ${stage} Best Practices

### Key Principles
- Follow Sitecore Helix architecture
- Implement proper error handling
- Use dependency injection
- Write comprehensive tests
- Document your code

### Implementation Guidelines
- Start with interfaces
- Use meaningful naming conventions
- Implement proper logging
- Handle exceptions gracefully
- Follow SOLID principles

### Quality Assurance
- Code reviews are mandatory
- Unit tests must pass
- Integration tests required
- Performance considerations
- Security best practices`;

        const doc = await vscode.workspace.openTextDocument({
            content: practices,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }

    async function openSDLCResources(selection: any, stage: string) {
        const resourceUrls: { [key: string]: string } = {
            'Planning': 'https://www.atlassian.com/agile/project-management/requirements',
            'Development': 'https://helix.sitecore.net/',
            'Testing': 'https://docs.microsoft.com/en-us/dotnet/core/testing/',
            'Deployment': 'https://docs.microsoft.com/en-us/azure/devops/',
            'Maintenance': 'https://docs.sitecore.com/',
            'Optimization': 'https://docs.sitecore.com/developers/101/platform-administration-and-architecture/en/performance-tuning.html'
        };

        const url = resourceUrls[stage.split(' ')[1]] || 'https://helix.sitecore.net/';
        vscode.env.openExternal(vscode.Uri.parse(url));
        vscode.window.showInformationMessage(`Opening resources for ${stage}...`);
    }
}

export function deactivate() {
    console.log('🛑 DXP Extension deactivated');
}
