import { Elysia, t } from "elysia";
import { authenticate } from "../../../auth/auth.middleware";
import * as profileController from "./student.controller";

const studentProfileRoutes = new Elysia({ prefix: "/student/profile" })
  .put(
    "/",
    async (context) => {
      const authContext = await authenticate(context);
      return profileController.updateProfileHandler(authContext);
    },
    {
      body: t.Object({
        fullName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        aboutMe: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        birthday: t.Optional(t.Union([t.String({ format: "date" }), t.Null()])),
        gender: t.Optional(
          t.Union([
            t.Literal("male"),
            t.Literal("female"),
            t.Literal("other"),
            t.Literal("prefer_not_to_say"),
            t.Null(),
          ])
        ),
        profileImage: t.Optional(t.Union([t.String({ format: "uri", maxLength: 500 }), t.Null()])),
        address: t.Optional(
          t.Union([
            t.Object({
              streetAddress: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
              city: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
              state: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
              pincode: t.Optional(t.Union([t.String({ maxLength: 20 }), t.Null()])),
              country: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
            }),
            t.Null(),
          ])
        ),
      }),
      detail: {
        tags: ["Student - Profile"],
        summary: "Update personal info (Step 3)",
        description:
          "Update personal information including fullName, aboutMe, birthday, gender, profileImage, and address",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentProfileRoutes;