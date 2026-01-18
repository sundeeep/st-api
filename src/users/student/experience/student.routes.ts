import { Elysia, t } from "elysia";
import { authenticate } from "../../../auth/auth.middleware";
import * as experienceController from "./student.controller";

const studentExperienceRoutes = new Elysia({ prefix: "/student/experience" })
  .post(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return experienceController.createExperienceHandler(authContext);
    },
    {
      body: t.Object({
        organization: t.String({ minLength: 2, maxLength: 255 }),
        role: t.String({ minLength: 2, maxLength: 255 }),
        employmentType: t.Optional(
          t.Union([
            t.Literal("full-time"),
            t.Literal("part-time"),
            t.Literal("internship"),
            t.Literal("contract"),
            t.Literal("freelance"),
          ])
        ),
        location: t.Optional(t.String({ maxLength: 255 })),
        startDate: t.String({ format: "date", description: "Start date in YYYY-MM-DD format" }),
        endDate: t.Optional(
          t.String({ format: "date", description: "End date in YYYY-MM-DD format (null if currently working)" })
        ),
        isCurrentlyWorking: t.Optional(t.Boolean({ default: false })),
      }),
      detail: {
        tags: ["Student - Experience"],
        summary: "Create experience record",
        description: "Add a new work experience record to user profile",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return experienceController.getUserExperiencesHandler(authContext);
    },
    {
      detail: {
        tags: ["Student - Experience"],
        summary: "Get all experience records",
        description: "Get all work experience records for the authenticated user",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return experienceController.getExperienceByIdHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Experience"],
        summary: "Get experience by ID",
        description: "Get a specific work experience record by ID",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .put(
    "/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return experienceController.updateExperienceHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        organization: t.Optional(t.String({ minLength: 2, maxLength: 255 })),
        role: t.Optional(t.String({ minLength: 2, maxLength: 255 })),
        employmentType: t.Optional(
          t.Union([
            t.Literal("full-time"),
            t.Literal("part-time"),
            t.Literal("internship"),
            t.Literal("contract"),
            t.Literal("freelance"),
            t.Null(),
          ])
        ),
        location: t.Optional(t.Union([t.String(), t.Null()])),
        startDate: t.Optional(t.String({ format: "date" })),
        endDate: t.Optional(t.Union([t.String({ format: "date" }), t.Null()])),
        isCurrentlyWorking: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Student - Experience"],
        summary: "Update experience record",
        description: "Update an existing work experience record",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .delete(
    "/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return experienceController.deleteExperienceHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Experience"],
        summary: "Delete experience record",
        description: "Delete a work experience record",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentExperienceRoutes;
