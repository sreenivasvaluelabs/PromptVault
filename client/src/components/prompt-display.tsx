import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PromptItem } from "@/types/prompt";
import { usePrompts } from "@/hooks/use-prompts";

interface PromptDisplayProps {
  prompt: PromptItem | null;
}

export function PromptDisplay({ prompt }: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { data: allPrompts = [] } = usePrompts();

  const copyToClipboard = async (text: string, type: "prompt" | "content" = "prompt") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: `${type === "prompt" ? "Prompt" : "Content"} copied successfully`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getRelatedPrompts = (currentPrompt: PromptItem) => {
    return allPrompts
      .filter(p => p.id !== currentPrompt.id)
      .map(p => ({
        ...p,
        relevance: p.tags.filter(tag => currentPrompt.tags.includes(tag)).length
      }))
      .filter(p => p.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 4);
  };

  if (!prompt) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-code text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Developer Experience Platform
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Your comprehensive toolkit for modern software development with code templates, SDLC workflows, and best practices
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-cubes text-blue-600 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{allPrompts.filter(p => p.category !== 'sdlc_templates').length}</h3>
                <p className="text-gray-600">Component Templates</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-project-diagram text-green-600 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{allPrompts.filter(p => p.category === 'sdlc_templates').length}</h3>
                <p className="text-gray-600">SDLC Templates</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-layer-group text-blue-600 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">7</h3>
                <p className="text-gray-600">Categories</p>
              </div>
            </div>

            {/* Getting Started */}
            <Card className="text-left max-w-2xl mx-auto">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Browse Categories</h4>
                      <p className="text-gray-600 text-sm">
                        Explore the 7 main categories in the left sidebar to find the templates you need.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Select a Template</h4>
                      <p className="text-gray-600 text-sm">
                        Click on any template title to view its content and implementation details.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Copy & Use</h4>
                      <p className="text-gray-600 text-sm">
                        Use the copy button to quickly add templates to your development workflow.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const relatedPrompts = getRelatedPrompts(prompt);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Prompt Header */}
        <Card className="mb-6">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{prompt.title}</h1>
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-lg">{prompt.description}</p>
              </div>
              <Button
                onClick={() => copyToClipboard(prompt.content)}
                className="bg-cognizant-blue hover:bg-cognizant-dark-blue text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Prompt Content */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Prompt Content
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(prompt.content, "content")}
                  className="text-cognizant-blue hover:text-cognizant-dark-blue"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {prompt.content}
              </pre>
            </div>

            {/* Context Information */}
            {prompt.context && prompt.context !== "implementation" && (
              <div className="mt-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Context & Usage
                  </h3>
                  <p className="text-sm text-blue-800">{prompt.context}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Prompts */}
        {relatedPrompts.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Related Prompts</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedPrompts.map((related) => (
                  <div
                    key={related.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <h4 className="font-medium text-gray-900 mb-1 group-hover:text-cognizant-blue">
                      {related.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{related.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 capitalize">
                        {related.category}
                      </span>
                      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-cognizant-blue" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
