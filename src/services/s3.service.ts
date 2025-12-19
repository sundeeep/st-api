import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.config";
import { BadRequestError } from "../utils/errors.util";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_FILE_TYPES = {
  organizations: {
    mimeTypes: ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"],
    extensions: ["png", "svg", "jpeg", "jpg"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  resumes: {
    mimeTypes: ["application/pdf"],
    extensions: ["pdf"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

const ALLOWED_FOLDERS = ["organizations", "resumes"];

const validateFileUpload = (fileName: string, fileType: string, folder: string) => {
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw BadRequestError(`Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(", ")}`);
  }

  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  if (!fileExtension) {
    throw BadRequestError("File must have an extension");
  }

  const folderConfig = ALLOWED_FILE_TYPES[folder as keyof typeof ALLOWED_FILE_TYPES];
  if (!folderConfig) {
    throw BadRequestError(`No configuration found for folder: ${folder}`);
  }

  if (!folderConfig.extensions.includes(fileExtension)) {
    throw BadRequestError(
      `Invalid file extension for ${folder}. Allowed: ${folderConfig.extensions.join(", ")}`
    );
  }

  if (!folderConfig.mimeTypes.includes(fileType)) {
    throw BadRequestError(
      `Invalid file type for ${folder}. Allowed: ${folderConfig.mimeTypes.join(", ")}`
    );
  }
};

export const generatePresignedUrl = async (
  fileName: string,
  fileType: string,
  folder: string
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> => {
  validateFileUpload(fileName, fileType, folder);

  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
  const key = `${folder}/${uniqueFileName}`;

  const folderConfig = ALLOWED_FILE_TYPES[folder as keyof typeof ALLOWED_FILE_TYPES];

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ContentLength: folderConfig.maxSize,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const fileUrl = `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

export const extractKeyFromUrl = (url: string): string | null => {
  const bucketUrl = `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/`;
  if (url.startsWith(bucketUrl)) {
    return url.replace(bucketUrl, "");
  }
  return null;
};
