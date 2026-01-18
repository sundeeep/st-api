import { Elysia, t } from "elysia";
import { requireAdmin } from "../../middlewares/admin.middleware";
import * as userController from "./admin.controller";

const adminUserRoutes = new Elysia({ prefix: "/admin/users" })
  .get(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return userController.getUsersHandler(adminContext);
    },
    {
      query: t.Object({
        role: t.Optional(t.Union([t.Literal("student"), t.Literal("admin")])),
        isActive: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        onboardingComplete: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        search: t.Optional(t.String()),
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Admin - Users"],
        summary: "Get all users",
        description: "Get paginated list of users for admin dashboard with filters",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default adminUserRoutes;
