import { Elysia, t } from "elysia";
import {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/applicationsController";
import { adminPlugin } from "../middlewares/admin.middleware";

const applicationsAdminRoutes = new Elysia({ prefix: "/applications" })
  .use(adminPlugin)
  .get("/", getAllApplications, {
    detail: {
      tags: ["Admin - Applications"],
      summary: "List all applications",
      description: "Get all opportunity applications with details. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/:id", getApplicationById, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Application ID" }),
    }),
    detail: {
      tags: ["Admin - Applications"],
      summary: "Get application by ID",
      description: "Get details of a specific application. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .put("/:id/status", updateApplicationStatus, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Application ID" }),
    }),
    body: t.Object({
      status: t.Union(
        [
          t.Literal("pending"),
          t.Literal("reviewed"),
          t.Literal("shortlisted"),
          t.Literal("rejected"),
          t.Literal("accepted"),
        ],
        { description: "Application status" }
      ),
    }),
    detail: {
      tags: ["Admin - Applications"],
      summary: "Update application status",
      description: "Change the status of an application. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .delete("/:id", deleteApplication, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Application ID" }),
    }),
    detail: {
      tags: ["Admin - Applications"],
      summary: "Delete application",
      description: "Delete an application. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  });

export default applicationsAdminRoutes;
