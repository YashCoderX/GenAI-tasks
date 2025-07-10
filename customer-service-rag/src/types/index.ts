export interface Review {
  id: number;
  title: string;
  text: string;
  rating: number;
  date: string;
  category: string;
  customer: string;
  useful: boolean;
}

export interface SearchResult {
  answer: string;
  relevantReviews: Array<{
    title: string;
    text: string;
    rating: number;
    date: string;
    category: string;
    useful?: boolean;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult['relevantReviews'];
  responseTime?: number;
} 