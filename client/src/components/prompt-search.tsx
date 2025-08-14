import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchPrompts } from "@/hooks/use-prompts";
import { PromptItem } from "@/types/prompt";

interface PromptSearchProps {
  onSelectPrompt: (prompt: PromptItem) => void;
  className?: string;
}

export function PromptSearch({ onSelectPrompt, className = "" }: PromptSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: searchResults = [], isLoading } = useSearchPrompts(query);

  useEffect(() => {
    setIsOpen(query.length > 2 && searchResults.length > 0);
  }, [query, searchResults]);

  const handleSelectPrompt = (prompt: PromptItem) => {
    onSelectPrompt(prompt);
    setQuery("");
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search prompts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 border-gray-300 focus:ring-2 focus:ring-cognizant-blue focus:border-transparent"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          )}
          
          {searchResults.length === 0 && !isLoading && query.length > 2 && (
            <div className="p-4 text-center text-gray-500">No prompts found</div>
          )}

          {searchResults.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleSelectPrompt(prompt)}
              className="w-full text-left p-4 hover:bg-cognizant-light-blue border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{prompt.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {prompt.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {prompt.category}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
