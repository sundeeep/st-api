import { usersProfile } from "../../auth/auth.schema";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, uuid, timestamp, index, pgEnum, unique } from "drizzle-orm/pg-core";

export const contentTypeEnum = pgEnum("content_type", ["event", "quiz"]);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    targetType: contentTypeEnum("targetType").notNull(),
    targetId: uuid("targetId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      uniqueUserTarget: unique("unique_likes_user_target").on(
        table.userId,
        table.targetType,
        table.targetId
      ),
    },
    {
      userTargetIdx: index("idx_likes_user_target").on(
        table.userId,
        table.targetType,
        table.targetId
      ),
    },
    {
      targetIdx: index("idx_likes_target").on(table.targetType, table.targetId),
    },
    {
      userIdx: index("idx_likes_user").on(table.userId, table.createdAt),
    },
  ]
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => usersProfile.id, { onDelete: "cascade" }),
    targetType: contentTypeEnum("targetType").notNull(),
    targetId: uuid("targetId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    {
      uniqueUserTarget: unique("unique_bookmarks_user_target").on(
        table.userId,
        table.targetType,
        table.targetId
      ),
    },
    {
      userTargetIdx: index("idx_bookmarks_user_target").on(
        table.userId,
        table.targetType,
        table.targetId
      ),
    },
    {
      userIdx: index("idx_bookmarks_user").on(table.userId, table.createdAt),
    },
  ]
);

export type ContentType = "event" | "quiz";

export type Like = InferSelectModel<typeof likes>;
export type NewLike = InferInsertModel<typeof likes>;

export type Bookmark = InferSelectModel<typeof bookmarks>;
export type NewBookmark = InferInsertModel<typeof bookmarks>;
