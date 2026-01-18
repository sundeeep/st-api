import { Elysia, t } from "elysia";
import { authenticate } from "../../../auth/auth.middleware";
import * as usernameController from "./student.controller";

const studentUsernameRoutes = new Elysia({ prefix: "/student/username" })
  .put(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return usernameController.updateUsernameHandler(authContext);
    },
    {
      body: t.Object({
        username: t.String({
          minLength: 3,
          maxLength: 30,
          pattern: "^[a-z0-9_-]+$",
          description: "Unique username (lowercase, alphanumeric, underscore, dash only)",
        }),
      }),
      detail: {
        tags: ["Student - Profile"],
        summary: "Update username (Step 2)",
        description: "Set or update username for the authenticated user",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentUsernameRoutes;