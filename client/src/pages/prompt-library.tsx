import { useState } from "react";
import { Menu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptSidebar } from "@/components/prompt-sidebar";
import { PromptDisplay } from "@/components/prompt-display";
import { PromptSearch } from "@/components/prompt-search";
import { PromptItem } from "@/types/prompt";

export default function PromptLibrary() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const getBreadcrumb = () => {
    if (!selectedPrompt) return "Select a prompt";
    const categoryName = selectedPrompt.category
      .charAt(0).toUpperCase() + 
      selectedPrompt.category.slice(1).replace('_', ' ');
    return `${categoryName} > ${selectedPrompt.title}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              {/* Developer Platform logo representation */}
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">DX</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Developer Experience Platform</h1>
                <p className="text-sm text-gray-500">
                  Code Templates • SDLC Workflows • Best Practices
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <PromptSearch
              onSelectPrompt={handleSelectPrompt}
              className="hidden md:block w-64"
            />
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <PromptSidebar
          onSelectPrompt={handleSelectPrompt}
          selectedPromptId={selectedPrompt?.id}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <button 
                      onClick={() => setSelectedPrompt(null)}
                      className="text-gray-500 hover:text-cognizant-blue"
                    >
                      Home
                    </button>
                  </li>
                  <li className="text-gray-500">/</li>
                  <li className="text-gray-900 font-medium">{getBreadcrumb()}</li>
                </ol>
              </nav>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4">
              <PromptSearch onSelectPrompt={handleSelectPrompt} />
            </div>

            {/* Content Area */}
            <PromptDisplay prompt={selectedPrompt} />
          </div>
        </main>
      </div>
    </div>
  );
}
