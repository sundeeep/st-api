import { Elysia, t } from "elysia";
import { requireAdmin } from "../../middlewares/admin.middleware";
import * as adminController from "./admin.controller";

const adminArticleRoutes = new Elysia({ prefix: "/admin/articles" })
  .post(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.createArticleHandler(adminContext);
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        slug: t.String({ minLength: 1, maxLength: 255, pattern: "^[a-z0-9-]+$" }),
        excerpt: t.Optional(t.String({ maxLength: 500 })),
        content: t.Any(), // JSONB - accepts any JSON structure
        coverImage: t.Optional(t.String({ maxLength: 500 })),
        isPublished: t.Optional(t.Boolean({ default: false })),
        publishedAt: t.Optional(t.String({ format: "date-time" })),
      }),
      detail: {
        tags: ["Admin - Articles"],
        summary: "Create article",
        description: "Create a new article with rich JSONB content",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.getArticlesHandler(adminContext);
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        isPublished: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        authorId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Admin - Articles"],
        summary: "Get all articles",
        description: "Returns list of all articles with pagination and filters",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.getArticleByIdHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Articles"],
        summary: "Get article by ID",
        description: "Get detailed article information",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.updateArticleHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        slug: t.Optional(t.String({ minLength: 1, maxLength: 255, pattern: "^[a-z0-9-]+$" })),
        excerpt: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        content: t.Optional(t.Any()),
        coverImage: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        isPublished: t.Optional(t.Boolean()),
        publishedAt: t.Optional(t.Union([t.String({ format: "date-time" }), t.Null()])),
      }),
      detail: {
        tags: ["Admin - Articles"],
        summary: "Update article",
        description: "Update article details",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.deleteArticleHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Articles"],
        summary: "Delete article",
        description: "Delete an article",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default adminArticleRoutes;
