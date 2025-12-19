import { Elysia, t } from "elysia";
import {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} from "../controllers/opportunitiesController";
import { adminPlugin } from "../middlewares/admin.middleware";

const opportunitiesRoutes = new Elysia({ prefix: "/opportunities" })
  .use(adminPlugin)
  .post("/", createOpportunity, {
    body: t.Object({
      title: t.String({ minLength: 2, description: "Job/Internship title" }),
      description: t.String({ minLength: 10, description: "Description in markdown format" }),
      yearsOfExperienceRequired: t.Number({
        minimum: 0,
        description: "Required years of experience",
      }),
      type: t.Union(
        [t.Literal("fulltime"), t.Literal("parttime"), t.Literal("internship"), t.Literal("gig")],
        { description: "Opportunity type" }
      ),
      compensation: t.String({ minLength: 1, description: "Salary/Stipend details" }),
      organizationId: t.String({ format: "uuid", description: "Organization ID" }),
    }),
    detail: {
      tags: ["Admin - Opportunities"],
      summary: "Create opportunity",
      description: "Create a new job/internship opportunity. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/", getAllOpportunities, {
    detail: {
      tags: ["Admin - Opportunities"],
      summary: "List all opportunities",
      description: "Get all opportunities with organization details. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/:id", getOpportunityById, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Opportunity ID" }),
    }),
    detail: {
      tags: ["Admin - Opportunities"],
      summary: "Get opportunity by ID",
      description: "Get details of a specific opportunity. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .put("/:id", updateOpportunity, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Opportunity ID" }),
    }),
    body: t.Object({
      title: t.Optional(t.String({ minLength: 2, description: "Job/Internship title" })),
      description: t.Optional(t.String({ minLength: 10, description: "Description in markdown" })),
      yearsOfExperienceRequired: t.Optional(
        t.Number({ minimum: 0, description: "Required years of experience" })
      ),
      type: t.Optional(
        t.Union([
          t.Literal("fulltime"),
          t.Literal("parttime"),
          t.Literal("internship"),
          t.Literal("gig"),
        ])
      ),
      compensation: t.Optional(t.String({ minLength: 1, description: "Salary/Stipend details" })),
      organizationId: t.Optional(t.String({ format: "uuid", description: "Organization ID" })),
    }),
    detail: {
      tags: ["Admin - Opportunities"],
      summary: "Update opportunity",
      description: "Update opportunity details. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .delete("/:id", deleteOpportunity, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Opportunity ID" }),
    }),
    detail: {
      tags: ["Admin - Opportunities"],
      summary: "Delete opportunity",
      description: "Delete an opportunity. Admin access required.",
      security: [{ BearerAuth: [] }],
    },
  });

export default opportunitiesRoutes;
