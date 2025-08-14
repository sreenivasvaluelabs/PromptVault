import { useState } from "react";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrompts } from "@/hooks/use-prompts";
import { PromptItem } from "@/types/prompt";
import { categoryConfig } from "@/lib/prompt-data";

interface PromptSidebarProps {
  onSelectPrompt: (prompt: PromptItem) => void;
  selectedPromptId?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function PromptSidebar({ 
  onSelectPrompt, 
  selectedPromptId, 
  isOpen, 
  onToggle 
}: PromptSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["foundation"]) // Start with foundation expanded
  );
  const { data: prompts = [], isLoading } = usePrompts();

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, PromptItem[]>);

  const getIconClass = (iconName: string) => {
    const iconMap: Record<string, string> = {
      "cog": "fas fa-cog",
      "puzzle-piece": "fas fa-puzzle-piece", 
      "sitemap": "fas fa-sitemap",
      "cubes": "fas fa-cubes",
      "vial": "fas fa-vial",
      "paint-brush": "fas fa-paint-brush",
      "project-diagram": "fas fa-project-diagram"
    };
    return iconMap[iconName] || "fas fa-circle";
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out z-30",
        "fixed lg:relative h-full",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Categories</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="text-cognizant-blue hover:text-cognizant-dark-blue text-sm"
              >
                Collapse All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-cognizant-light-blue text-cognizant-blue text-xs rounded-full">
              {prompts.length} Total Prompts
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {prompts.filter(p => p.category !== 'sdlc_templates').length} Components
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {prompts.filter(p => p.category === 'sdlc_templates').length} SDLC Templates
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {categoryConfig.map((category) => {
                const categoryPrompts = groupedPrompts[category.key] || [];
                const isExpanded = expandedCategories.has(category.key);
                
                return (
                  <div key={category.key} className="category-group">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.key)}
                      className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <i className={`${getIconClass(category.icon)} text-cognizant-blue`} />
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {categoryPrompts.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-cognizant-blue transition-colors" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-cognizant-blue transition-colors" />
                      )}
                    </button>
                    
                    {/* Category Items */}
                    {isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {categoryPrompts.map((prompt) => (
                          <button
                            key={prompt.id}
                            onClick={() => onSelectPrompt(prompt)}
                            className={cn(
                              "block w-full p-2 text-sm text-left rounded-md transition-colors",
                              selectedPromptId === prompt.id
                                ? "bg-cognizant-light-blue text-cognizant-blue"
                                : "text-gray-700 hover:bg-cognizant-light-blue hover:text-cognizant-blue"
                            )}
                          >
                            <div className="flex items-start space-x-2">
                              <i className="fas fa-cube text-xs mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{prompt.title}</div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {prompt.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
