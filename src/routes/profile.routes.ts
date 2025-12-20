import { Elysia, t } from "elysia";
import { authPlugin } from "../middlewares/auth.middleware";
import { getMyProfileHandler, getProfileByUsernameHandler } from "../controllers/profileController";

/**
 * Profile routes for fetching complete user profile
 */
const profileRoutes = new Elysia()
  .use(authPlugin)
  .get("/me", getMyProfileHandler, {
    detail: {
      tags: ["Profile"],
      summary: "Get my complete profile",
      description:
        "Fetch complete profile of authenticated user with all related data (domain, skills, education, experience, profile links)",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/:username", getProfileByUsernameHandler, {
    params: t.Object({
      username: t.String({ minLength: 3, maxLength: 50, description: "Username of the user" }),
    }),
    detail: {
      tags: ["Profile"],
      summary: "Get profile by username",
      description: "Fetch complete profile of any user by their username (public endpoint)",
    },
  });

export default profileRoutes;
