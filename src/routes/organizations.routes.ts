import { Elysia, t } from "elysia";
import {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organizationsController";
import { adminPlugin } from "../middlewares/admin.middleware";

const organizationsRoutes = new Elysia({ prefix: "/organizations" })
  .use(adminPlugin)
  .post("/", createOrganization, {
    body: t.Object({
      title: t.String({ minLength: 2, description: "Organization name" }),
      description: t.String({ minLength: 10, description: "Organization description" }),
      type: t.Union(
        [
          t.Literal("non-profit"),
          t.Literal("for-profit"),
          t.Literal("ngo"),
          t.Literal("public"),
          t.Literal("private"),
          t.Literal("ppp"),
        ],
        { description: "Organization type" }
      ),
      city: t.String({ minLength: 2, description: "City location" }),
      logo: t.Optional(t.String({ format: "uri", description: "Logo URL (S3)" })),
    }),
    detail: {
      tags: ["Admin - Organizations"],
      summary: "Create organization",
      description: "Create a new organization. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/", getAllOrganizations, {
    detail: {
      tags: ["Admin - Organizations"],
      summary: "List all organizations",
      description: "Get all organizations. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/:id", getOrganizationById, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Organization ID" }),
    }),
    detail: {
      tags: ["Admin - Organizations"],
      summary: "Get organization by ID",
      description: "Get details of a specific organization. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .put("/:id", updateOrganization, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Organization ID" }),
    }),
    body: t.Object({
      title: t.Optional(t.String({ minLength: 2, description: "Organization name" })),
      description: t.Optional(t.String({ minLength: 10, description: "Organization description" })),
      type: t.Optional(
        t.Union([
          t.Literal("non-profit"),
          t.Literal("for-profit"),
          t.Literal("ngo"),
          t.Literal("public"),
          t.Literal("private"),
          t.Literal("ppp"),
        ])
      ),
      city: t.Optional(t.String({ minLength: 2, description: "City location" })),
      logo: t.Optional(t.String({ format: "uri", description: "Logo URL (S3)" })),
    }),
    detail: {
      tags: ["Admin - Organizations"],
      summary: "Update organization",
      description: "Update organization details. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .delete("/:id", deleteOrganization, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Organization ID" }),
    }),
    detail: {
      tags: ["Admin - Organizations"],
      summary: "Delete organization",
      description: "Delete an organization. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  });

export default organizationsRoutes;
