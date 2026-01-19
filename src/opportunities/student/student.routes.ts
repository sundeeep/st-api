import { Elysia, t } from "elysia";
import { authenticate } from "../../auth/auth.middleware";
import * as studentController from "./student.controller";

const studentOpportunityRoutes = new Elysia({ prefix: "/student/opportunities" })
  .get(
    "/",
    studentController.getOpportunitiesHandler,
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Student - Opportunities"],
        summary: "Browse opportunities",
        description: "Get all active opportunities available for application with pagination",
      },
    }
  )
  .get(
    "/:id",
    studentController.getOpportunityByIdHandler,
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Opportunities"],
        summary: "View opportunity details",
        description: "Get detailed information about an opportunity including questions",
      },
    }
  )
  .post(
    "/:id/apply",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.applyToOpportunityHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        answers: t.Array(
          t.Object({
            questionId: t.String({ format: "uuid" }),
            answer: t.Union([t.String(), t.Null()]),
          })
        ),
      }),
      detail: {
        tags: ["Student - Opportunities"],
        summary: "Apply to opportunity",
        description: "Submit application to an opportunity with answers to questions",
        security: [{ BearerAuth: [] }],
      },
    }
  );

const studentApplicationRoutes = new Elysia({ prefix: "/student/applications" })
  .get(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return studentController.getMyApplicationsHandler(authContext);
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Student - Opportunities"],
        summary: "View my applications",
        description: "Get all applications submitted by the authenticated student",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default new Elysia().use(studentOpportunityRoutes).use(studentApplicationRoutes);
