import { db } from "../db";
import { organizations, type NewOrganization } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError, BadRequestError } from "../utils/errors.util";
import { deleteFromS3, extractKeyFromUrl } from "./s3.service";
import { sanitizeString, isValidS3Url } from "../utils/sanitization.util";
import { env } from "../config/env.config";

export const createOrganization = async (data: NewOrganization) => {
  if (data.logo && !isValidS3Url(data.logo, env.AWS_S3_BUCKET_NAME, env.AWS_REGION)) {
    throw BadRequestError("Invalid logo URL. Must be from our S3 bucket");
  }

  const sanitizedData = {
    ...data,
    title: sanitizeString(data.title),
    description: sanitizeString(data.description),
    city: sanitizeString(data.city),
  };

  const [organization] = await db.insert(organizations).values(sanitizedData).returning();
  return organization;
};

export const getAllOrganizations = async () => {
  return await db.select().from(organizations).orderBy(organizations.createdAt);
};

export const getOrganizationById = async (id: string) => {
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));

  if (!organization) {
    throw NotFoundError("Organization not found");
  }

  return organization;
};

export const updateOrganization = async (id: string, data: Partial<NewOrganization>) => {
  const existing = await getOrganizationById(id);

  if (data.logo && !isValidS3Url(data.logo, env.AWS_S3_BUCKET_NAME, env.AWS_REGION)) {
    throw BadRequestError("Invalid logo URL. Must be from our S3 bucket");
  }

  const sanitizedData: any = { ...data, updatedAt: new Date() };
  if (data.title) sanitizedData.title = sanitizeString(data.title);
  if (data.description) sanitizedData.description = sanitizeString(data.description);
  if (data.city) sanitizedData.city = sanitizeString(data.city);

  const [updated] = await db
    .update(organizations)
    .set(sanitizedData)
    .where(eq(organizations.id, id))
    .returning();

  if (data.logo && existing.logo && existing.logo !== data.logo) {
    const oldKey = extractKeyFromUrl(existing.logo);
    if (oldKey) {
      await deleteFromS3(oldKey).catch(() => {});
    }
  }

  return updated;
};

export const deleteOrganization = async (id: string) => {
  const organization = await getOrganizationById(id);

  await db.delete(organizations).where(eq(organizations.id, id));

  if (organization.logo) {
    const key = extractKeyFromUrl(organization.logo);
    if (key) {
      await deleteFromS3(key).catch(() => {});
    }
  }

  return organization;
};
