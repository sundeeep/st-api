import { Elysia, t } from "elysia";
import { authenticate } from "../../auth/auth.middleware";
import * as interactionsController from "./student.controller";

const studentInteractionsRoutes = new Elysia({ prefix: "/student/interactions" })
  .post(
    "/:targetType/:targetId/like",
    async (context) => {
      const authContext = await authenticate(context);
      return interactionsController.likeContentHandler(authContext);
    },
    {
      params: t.Object({
        targetType: t.Union([t.Literal("event"), t.Literal("quiz")]),
        targetId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Interactions"],
        summary: "Like content",
        description: "Like an event or quiz",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:targetType/:targetId/like",
    async (context) => {
      const authContext = await authenticate(context);
      return interactionsController.unlikeContentHandler(authContext);
    },
    {
      params: t.Object({
        targetType: t.Union([t.Literal("event"), t.Literal("quiz")]),
        targetId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Interactions"],
        summary: "Unlike content",
        description: "Remove like from an event or quiz",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/:targetType/:targetId/bookmark",
    async (context) => {
      const authContext = await authenticate(context);
      return interactionsController.bookmarkContentHandler(authContext);
    },
    {
      params: t.Object({
        targetType: t.Union([t.Literal("event"), t.Literal("quiz")]),
        targetId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Interactions"],
        summary: "Bookmark content",
        description: "Bookmark an event or quiz",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/:targetType/:targetId/bookmark",
    async (context) => {
      const authContext = await authenticate(context);
      return interactionsController.unbookmarkContentHandler(authContext);
    },
    {
      params: t.Object({
        targetType: t.Union([t.Literal("event"), t.Literal("quiz")]),
        targetId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Interactions"],
        summary: "Unbookmark content",
        description: "Remove bookmark from an event or quiz",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentInteractionsRoutes;
