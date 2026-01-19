import { Elysia, t } from "elysia";
import * as studentController from "./student.controller";

const studentArticleRoutes = new Elysia({ prefix: "/student/articles" })
  .get(
    "/",
    studentController.getArticlesHandler,
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Student - Articles"],
        summary: "Browse articles",
        description: "Get all published articles with pagination",
      },
    }
  )
  .get(
    "/:id",
    studentController.getArticleByIdOrSlugHandler,
    {
      params: t.Object({
        id: t.String({ description: "Article ID (UUID) or slug" }),
      }),
      detail: {
        tags: ["Student - Articles"],
        summary: "View article",
        description: "Get article details by ID or slug (only published articles)",
      },
    }
  );

export default studentArticleRoutes;
