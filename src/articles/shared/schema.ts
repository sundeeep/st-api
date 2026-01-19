import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
  jsonb,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersProfile } from "../../auth/auth.schema";

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content").notNull(), // Rich content stored as JSONB
    coverImage: text("coverImage"),
    likeCount: integer("likeCount").default(0),
    isPublished: boolean("isPublished").default(false).notNull(),
    publishedAt: timestamp("publishedAt"),
    authorId: uuid("authorId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    {
      slugIdx: index("idx_articles_slug").on(table.slug),
      authorIdx: index("idx_articles_author").on(table.authorId),
      publishedCreatedIdx: index("idx_articles_published_created").on(table.isPublished, table.createdAt),
    },
  ]
);

export type Article = InferSelectModel<typeof articles>;
export type NewArticle = InferInsertModel<typeof articles>;
