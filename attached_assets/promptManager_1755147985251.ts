import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import Fuse from 'fuse.js';

interface PromptData {
    metadata: {
        version: string;
        description: string;
        platform: string;
        architecture: string;
        created: string;
        updated?: string;
        author: string;
    };
    categories: {
        foundation?: { [key: string]: ComponentCategory };
        feature?: { [key: string]: ComponentCategory };
        project?: { [key: string]: ComponentCategory };
        components?: { [key: string]: ComponentCategory };
        testing?: { [key: string]: ComponentCategory };
        styling?: { [key: string]: ComponentCategory };
        sdlc_templates?: { [key: string]: ComponentCategory };
    };
    sdlc_stages: {
        [key: string]: {
            name: string;
            description: string;
        };
    };
    component_snippets?: {
        [key: string]: string[];
    };
}

interface ComponentCategory {
    name: string;
    description: string;
    prompts: {
        [key: string]: {
            prompt: string;
            context: string;
            tags: string[];
        };
    };
}

interface PromptItem {
    id: string;
    component: string;
    sdlcStage: string;
    title: string;
    description: string;
    prompt: string;
    context: string;
    tags: string[];
}

export class PromptManager {
    private context: vscode.ExtensionContext;
    private promptData: PromptData | null = null;
    private promptItems: PromptItem[] = [];
    private fuse: Fuse<PromptItem> | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadPromptData();
    }

    private async loadPromptData(): Promise<void> {
        try {
            // Try different possible paths for the promptData.json file
            let promptDataPath = path.join(this.context.extensionPath, 'out', 'promptData.json');
            
            // Check if file exists, if not try the src directory (for development)
            if (!fs.existsSync(promptDataPath)) {
                promptDataPath = path.join(this.context.extensionPath, 'src', 'promptData.json');
            }
            
            // If still not found, try the extension root
            if (!fs.existsSync(promptDataPath)) {
                promptDataPath = path.join(this.context.extensionPath, 'promptData.json');
            }

            const rawData = fs.readFileSync(promptDataPath, 'utf8');
            this.promptData = JSON.parse(rawData) as PromptData;
            this.processPromptData();
            this.initializeFuse();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load prompt data: ${error}`);
        }
    }

    private processPromptData(): void {
        if (!this.promptData) return;

        this.promptItems = [];
        
        // Process all category types (foundation, feature, project, components, testing, styling, sdlc_templates)
        const categoryTypes = ['foundation', 'feature', 'project', 'components', 'testing', 'styling', 'sdlc_templates'];
        
        for (const categoryType of categoryTypes) {
            const categoryComponents = this.promptData.categories[categoryType as keyof typeof this.promptData.categories];
            
            if (categoryComponents) {
                for (const [componentKey, component] of Object.entries(categoryComponents)) {
                    for (const [sdlcKey, promptInfo] of Object.entries(component.prompts)) {
                        const sdlcStage = this.promptData.sdlc_stages[sdlcKey];
                        this.promptItems.push({
                            id: `${categoryType}-${componentKey}-${sdlcKey}`,
                            component: componentKey,
                            sdlcStage: sdlcKey,
                            title: `${component.name} (${categoryType.charAt(0).toUpperCase() + categoryType.slice(1)})`,
                            description: `${component.description}`,
                            prompt: promptInfo.prompt,
                            context: promptInfo.context,
                            tags: [...promptInfo.tags, categoryType]
                        });
                    }
                }
            }
        }
    }

    private initializeFuse(): void {
        const options = {
            keys: ['title', 'description', 'tags', 'component', 'sdlcStage'],
            threshold: 0.3,
            includeScore: true
        };
        this.fuse = new Fuse(this.promptItems, options);
    }

    public async openPromptPalette(): Promise<void> {
        const quickPickItems = this.promptItems.map(item => ({
            label: item.title,
            description: item.description,
            detail: `Tags: ${item.tags.join(', ')}`,
            item: item
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a prompt to insert',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            this.insertPrompt(selected.item);
        }
    }

    public async insertPromptAtCursor(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active text editor found.');
            return;
        }

        // Try to suggest prompts based on current context
        const suggestions = this.getContextualSuggestions(editor);
        if (suggestions.length > 0) {
            const quickPickItems = suggestions.map(item => ({
                label: item.title,
                description: item.description,
                detail: `Tags: ${item.tags.join(', ')}`,
                item: item
            }));

            const selected = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select a contextual prompt',
                matchOnDescription: true
            });

            if (selected) {
                this.insertPrompt(selected.item);
            }
        } else {
            this.openPromptPalette();
        }
    }

    public async searchPrompts(): Promise<void> {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Enter search term for prompts',
            placeHolder: 'e.g., carousel, validation, testing'
        });

        if (!searchTerm || !this.fuse) {
            return;
        }

        const results = this.fuse.search(searchTerm);
        const quickPickItems = results.map(result => ({
            label: result.item.title,
            description: result.item.description,
            detail: `Score: ${(1 - (result.score || 0)).toFixed(2)} | Tags: ${result.item.tags.join(', ')}`,
            item: result.item
        }));

        if (quickPickItems.length === 0) {
            vscode.window.showInformationMessage('No prompts found for the search term.');
            return;
        }

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: `Found ${quickPickItems.length} prompts for "${searchTerm}"`,
            matchOnDescription: true
        });

        if (selected) {
            this.insertPrompt(selected.item);
        }
    }

    public async filterByComponent(): Promise<void> {
        if (!this.promptData) return;

        // First, let user select category type
        const categoryTypes = Object.keys(this.promptData.categories).map(categoryType => ({
            label: categoryType.charAt(0).toUpperCase() + categoryType.slice(1),
            description: `${categoryType} layer components`,
            key: categoryType
        }));

        const selectedCategory = await vscode.window.showQuickPick(categoryTypes, {
            placeHolder: 'Select a component category'
        });

        if (!selectedCategory) return;

        const categoriesData = this.promptData.categories;
        const categoryComponents = categoriesData[selectedCategory.key as keyof typeof categoriesData];
        if (!categoryComponents) return;

        const components = Object.entries(categoryComponents).map(([key, component]) => ({
            label: component.name,
            description: component.description,
            key: key,
            category: selectedCategory.key
        }));

        const selected = await vscode.window.showQuickPick(components, {
            placeHolder: `Select a ${selectedCategory.label} component`
        });

        if (!selected) return;

        const componentPrompts = this.promptItems.filter(item => 
            item.component === selected.key && item.tags.includes(selected.category)
        );
        const quickPickItems = componentPrompts.map(item => ({
            label: item.title,
            description: item.description,
            detail: `Tags: ${item.tags.join(', ')}`,
            item: item
        }));

        const selectedPrompt = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: `Select a prompt for ${selected.label}`
        });

        if (selectedPrompt) {
            this.insertPrompt(selectedPrompt.item);
        }
    }

    public async filterBySDLCStage(): Promise<void> {
        if (!this.promptData) return;

        const stages = Object.entries(this.promptData.sdlc_stages).map(([key, stage]) => ({
            label: stage.name,
            description: stage.description,
            key: key
        }));

        const selected = await vscode.window.showQuickPick(stages, {
            placeHolder: 'Select an SDLC stage'
        });

        if (!selected) return;

        const stagePrompts = this.promptItems.filter(item => item.sdlcStage === selected.key);
        const quickPickItems = stagePrompts.map(item => ({
            label: item.title,
            description: item.description,
            detail: `Tags: ${item.tags.join(', ')}`,
            item: item
        }));

        const selectedPrompt = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: `Select a prompt for ${selected.label}`
        });

        if (selectedPrompt) {
            this.insertPrompt(selectedPrompt.item);
        }
    }

    private insertPrompt(promptItem: PromptItem): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active text editor found.');
            return;
        }

        const config = vscode.workspace.getConfiguration('dxpPromptLibrary');
        const enableInlineComments = config.get('enableInlineComments', true);
        const promptPrefix = config.get('promptPrefix', '// DXP Prompt:');

        let insertText = promptItem.prompt;

        if (enableInlineComments) {
            // Format as comment for GitHub Copilot
            const lines = promptItem.prompt.split('\n');
            const commentedLines = lines.map(line => 
                line.trim() ? `${promptPrefix} ${line}` : promptPrefix
            );
            insertText = commentedLines.join('\n') + '\n\n';
        }

        const position = editor.selection.active;
        editor.edit(editBuilder => {
            editBuilder.insert(position, insertText);
        });

        // Show success message
        vscode.window.showInformationMessage(
            `Inserted prompt: ${promptItem.title}`,
            'Copy to Clipboard'
        ).then(selection => {
            if (selection === 'Copy to Clipboard') {
                vscode.env.clipboard.writeText(promptItem.prompt);
            }
        });
    }

    private getContextualSuggestions(editor: vscode.TextEditor): PromptItem[] {
        const document = editor.document;
        const fileName = path.basename(document.fileName).toLowerCase();
        const fileContent = document.getText().toLowerCase();
        const languageId = document.languageId;

        const suggestions: PromptItem[] = [];

        // File name-based suggestions
        if (fileName.includes('controller')) {
            suggestions.push(...this.promptItems.filter(item => 
                (item.tags.includes('feature') && item.tags.includes('controller')) ||
                (item.tags.includes('project') && item.tags.includes('controller'))
            ));
        }

        if (fileName.includes('test')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('testing')
            ));
        }

        if (fileName.includes('model') || fileName.includes('viewmodel')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('viewmodel') || item.tags.includes('model')
            ));
        }

        if (fileName.includes('service')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('service') || item.tags.includes('foundation')
            ));
        }

        // Content-based suggestions
        if (fileContent.includes('carousel')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.component === 'carousel' || item.tags.includes('carousel')
            ));
        }

        if (fileContent.includes('form') || fileContent.includes('validation')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.component === 'custom_forms' || item.tags.includes('forms') || item.tags.includes('validation')
            ));
        }

        if (fileContent.includes('navigation') || fileContent.includes('menu')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.component === 'navigation' || item.tags.includes('navigation')
            ));
        }

        if (fileContent.includes('search')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.component === 'search' || item.tags.includes('search')
            ));
        }

        if (fileContent.includes('cache') || fileContent.includes('caching')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('cache') || item.tags.includes('caching')
            ));
        }

        if (fileContent.includes('config')) {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('configuration')
            ));
        }

        // Language-based suggestions
        if (languageId === 'csharp') {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('foundation') || item.tags.includes('feature')
            ));
        }

        if (languageId === 'scss' || languageId === 'css') {
            suggestions.push(...this.promptItems.filter(item => 
                item.tags.includes('styling') || item.tags.includes('scss')
            ));
        }

        // Remove duplicates and return top 5
        const uniqueSuggestions = suggestions.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );

        return uniqueSuggestions.slice(0, 5);
    }

    public onEditorChanged(): void {
        // Could implement auto-suggestions on editor change
        const config = vscode.workspace.getConfiguration('dxpPromptLibrary');
        if (!config.get('autoSuggest')) return;

        // Implementation for auto-suggestions could go here
    }

    public onDocumentChanged(_event: vscode.TextDocumentChangeEvent): void {
        // Could implement real-time prompt suggestions based on typing
        const config = vscode.workspace.getConfiguration('dxpPromptLibrary');
        if (!config.get('autoSuggest')) return;

        // Implementation for document change handling could go here
    }

    public enableAutoSuggestions(): void {
        // Implementation for enabling auto-suggestions
        // Could register additional providers or listeners
    }
}
