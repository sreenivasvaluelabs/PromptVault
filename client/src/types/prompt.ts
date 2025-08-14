export interface PromptItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  component: string;
  sdlcStage: string;
  tags: string[];
  context: string;
  metadata?: Record<string, any>;
}

export interface CategoryInfo {
  key: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface SearchResult {
  item: PromptItem;
  score?: number;
}
