import { useQuery } from "@tanstack/react-query";
import { PromptItem } from "@/types/prompt";

export function usePrompts() {
  return useQuery<PromptItem[]>({
    queryKey: ["/api/prompts"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePrompt(id: string) {
  return useQuery<PromptItem>({
    queryKey: ["/api/prompts", id],
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePromptsByCategory(category: string) {
  return useQuery<PromptItem[]>({
    queryKey: ["/api/prompts/category", category],
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchPrompts(query: string) {
  return useQuery<PromptItem[]>({
    queryKey: ["/api/prompts/search", query],
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
