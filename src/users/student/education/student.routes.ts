import { Elysia, t } from "elysia";
import { authenticate } from "../../../auth/auth.middleware";
import * as educationController from "./student.controller";

const studentEducationRoutes = new Elysia({ prefix: "/student/education" })
  .post(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return educationController.createEducationHandler(authContext);
    },
    {
      body: t.Object({
        institutionName: t.String({ minLength: 2, maxLength: 255 }),
        degree: t.Optional(t.String({ maxLength: 255 })),
        course: t.Optional(t.String({ maxLength: 255 })),
        startDate: t.String({ format: "date", description: "Start date in YYYY-MM-DD format" }),
        endDate: t.Optional(
          t.String({ format: "date", description: "End date in YYYY-MM-DD format (null if currently studying)" })
        ),
        isCurrentlyStudying: t.Optional(t.Boolean({ default: false })),
        gradeValue: t.Optional(t.String({ description: "Grade value as decimal string" })),
        gradeType: t.Optional(t.Union([t.Literal("percentage"), t.Literal("cgpa"), t.Literal("gpa")])),
      }),
      detail: {
        tags: ["Student - Education"],
        summary: "Create education record",
        description: "Add a new education record to user profile",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return educationController.getUserEducationsHandler(authContext);
    },
    {
      detail: {
        tags: ["Student - Education"],
        summary: "Get all education records",
        description: "Get all education records for the authenticated user",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return educationController.getEducationByIdHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Education"],
        summary: "Get education by ID",
        description: "Get a specific education record by ID",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .put(
    "/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return educationController.updateEducationHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        institutionName: t.Optional(t.String({ minLength: 2, maxLength: 255 })),
        degree: t.Optional(t.String({ maxLength: 255 })),
        course: t.Optional(t.String({ maxLength: 255 })),
        startDate: t.Optional(t.String({ format: "date" })),
        endDate: t.Optional(t.Union([t.String({ format: "date" }), t.Null()])),
        isCurrentlyStudying: t.Optional(t.Boolean()),
        gradeValue: t.Optional(t.Union([t.String(), t.Null()])),
        gradeType: t.Optional(t.Union([t.Literal("percentage"), t.Literal("cgpa"), t.Literal("gpa"), t.Null()])),
      }),
      detail: {
        tags: ["Student - Education"],
        summary: "Update education record",
        description: "Update an existing education record",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .delete(
    "/:id",
    async (context) => {
      const authContext = await authenticate(context);
      return educationController.deleteEducationHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Education"],
        summary: "Delete education record",
        description: "Delete an education record",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentEducationRoutes;
