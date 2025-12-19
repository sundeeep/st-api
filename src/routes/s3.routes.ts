import { Elysia, t } from "elysia";
import { getPresignedUrl } from "../controllers/s3Controller";
import { authPlugin } from "../middlewares/auth.middleware";

const s3Routes = new Elysia({ prefix: "/s3" })
  .use(authPlugin)
  .post("/presigned-url", getPresignedUrl, {
    body: t.Object({
      fileName: t.String({ minLength: 1, description: "Original file name (e.g., logo.png)" }),
      fileType: t.String({
        minLength: 1,
        description: "MIME type (e.g., image/png, application/pdf)",
      }),
      folder: t.String({
        minLength: 1,
        description: "S3 folder (e.g., organizations, resumes)",
      }),
    }),
    detail: {
      tags: ["S3"],
      summary: "Generate presigned URL",
      description:
        "Generate a presigned URL for uploading files to S3. Returns uploadUrl for upload and fileUrl for storage.",
      security: [{ BearerAuth: [] }],
    },
  });

export default s3Routes;
