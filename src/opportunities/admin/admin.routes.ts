import { Elysia, t } from "elysia";
import { requireAdmin } from "../../middlewares/admin.middleware";
import * as adminController from "./admin.controller";

const adminCompanyRoutes = new Elysia({ prefix: "/admin/companies" })
  .post(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.createCompanyHandler(adminContext);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        website: t.Optional(t.String({ maxLength: 500 })),
        logo: t.Optional(t.String({ maxLength: 500 })),
        description: t.Optional(t.String({ maxLength: 2000 })),
        location: t.Optional(t.String({ maxLength: 255 })),
      }),
      detail: {
        tags: ["Admin - Companies"],
        summary: "Create company",
        description: "Create a new company that can post opportunities",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get("/", adminController.getCompaniesHandler, {
    detail: {
      tags: ["Admin - Companies"],
      summary: "Get all companies",
      description: "Returns list of all companies",
      security: [{ BearerAuth: [] }],
    },
  })
  .put(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.updateCompanyHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        website: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        logo: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        description: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        location: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
      }),
      detail: {
        tags: ["Admin - Companies"],
        summary: "Update company",
        description: "Update company details",
        security: [{ BearerAuth: [] }],
      },
    }
  );

const adminOpportunityRoutes = new Elysia({ prefix: "/admin/opportunities" })
  .post(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.createOpportunityHandler(adminContext);
    },
    {
      body: t.Object({
        companyId: t.String({ format: "uuid" }),
        title: t.String({ minLength: 1, maxLength: 255 }),
        opportunityType: t.Union([t.Literal("internship"), t.Literal("full_time")]),
        description: t.Optional(t.String({ maxLength: 5000 })),
        stipend: t.Optional(t.String()),
        salaryRange: t.Optional(t.String({ maxLength: 100 })),
        duration: t.Optional(t.String({ maxLength: 100 })),
        location: t.Optional(t.String({ maxLength: 255 })),
      }),
      detail: {
        tags: ["Admin - Opportunities"],
        summary: "Create opportunity",
        description: "Create a new internship or full-time opportunity",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/",
    adminController.getOpportunitiesHandler,
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin - Opportunities"],
        summary: "Get all opportunities",
        description: "Returns list of all opportunities with company details (paginated)",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.updateOpportunityHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        companyId: t.Optional(t.String({ format: "uuid" })),
        title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        opportunityType: t.Optional(t.Union([t.Literal("internship"), t.Literal("full_time")])),
        description: t.Optional(t.Union([t.String({ maxLength: 5000 }), t.Null()])),
        stipend: t.Optional(t.Union([t.String(), t.Null()])),
        salaryRange: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        duration: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        location: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin - Opportunities"],
        summary: "Update opportunity",
        description: "Update opportunity details",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .post(
    "/:id/activate",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.activateOpportunityHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Opportunities"],
        summary: "Activate opportunity",
        description: "Set opportunity as active",
        security: [{ BearerAuth: [] }],
      },
    }
  );

const adminQuestionRoutes = new Elysia()
  .post(
    "/admin/opportunities/:id/questions",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.createQuestionHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        question: t.String({ minLength: 1, maxLength: 500 }),
        questionType: t.Union([
          t.Literal("short_text"),
          t.Literal("long_text"),
          t.Literal("yes_no"),
          t.Literal("number"),
          t.Literal("url"),
          t.Literal("file"),
        ]),
        isRequired: t.Optional(t.Boolean({ default: true })),
      }),
      detail: {
        tags: ["Admin - Opportunity Questions"],
        summary: "Add question to opportunity",
        description: "Add a custom question to an opportunity application form",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/admin/opportunities/:id/questions",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.getOpportunityQuestionsHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Opportunity Questions"],
        summary: "Get opportunity questions",
        description: "Get all questions for an opportunity",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/admin/questions/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.updateQuestionHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        question: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        questionType: t.Optional(
          t.Union([
            t.Literal("short_text"),
            t.Literal("long_text"),
            t.Literal("yes_no"),
            t.Literal("number"),
            t.Literal("url"),
            t.Literal("file"),
          ])
        ),
        isRequired: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin - Opportunity Questions"],
        summary: "Update question",
        description: "Update a question",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .delete(
    "/admin/questions/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.deleteQuestionHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Opportunity Questions"],
        summary: "Delete question",
        description: "Delete a question",
        security: [{ BearerAuth: [] }],
      },
    }
  );

const adminApplicationRoutes = new Elysia({ prefix: "/admin/applications" })
  .get(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.getApplicationsHandler(adminContext);
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        opportunityId: t.Optional(t.String({ format: "uuid" })),
        status: t.Optional(
          t.Union([
            t.Literal("applied"),
            t.Literal("shortlisted"),
            t.Literal("interview"),
            t.Literal("selected"),
            t.Literal("rejected"),
            t.Literal("withdrawn"),
          ])
        ),
      }),
      detail: {
        tags: ["Admin - Opportunity Applications"],
        summary: "Get all applications",
        description: "Returns list of all opportunity applications with pagination and filters",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.getApplicationByIdHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Opportunity Applications"],
        summary: "Get application by ID",
        description: "Get detailed application information including all answers",
        security: [{ BearerAuth: [] }],
      },
    }
  )
  .put(
    "/:id/status",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return adminController.updateApplicationStatusHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal("applied"),
          t.Literal("shortlisted"),
          t.Literal("interview"),
          t.Literal("selected"),
          t.Literal("rejected"),
          t.Literal("withdrawn"),
        ]),
      }),
      detail: {
        tags: ["Admin - Opportunity Applications"],
        summary: "Update application status",
        description: "Update the status of an opportunity application",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default new Elysia()
  .use(adminCompanyRoutes)
  .use(adminOpportunityRoutes)
  .use(adminQuestionRoutes)
  .use(adminApplicationRoutes);