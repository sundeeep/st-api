export interface CreateArticleBody {
  title: string;
  slug: string;
  excerpt?: string;
  content: unknown; // JSONB - can be any JSON structure
  coverImage?: string;
  isPublished?: boolean;
  publishedAt?: string;
}

export interface UpdateArticleBody {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: unknown | null; // JSONB
  coverImage?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}

export interface ArticleFilters {
  page?: string;
  limit?: string;
  isPublished?: "true" | "false";
  authorId?: string;
}
