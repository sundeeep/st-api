import { successResponse } from "../utils/response.util";
import { generatePresignedUrl } from "../services/s3.service";

export const getPresignedUrl = async (context: any) => {
  const { body } = context;
  const result = await generatePresignedUrl(body.fileName, body.fileType, body.folder);
  return successResponse(result, "Presigned URL generated successfully");
};
