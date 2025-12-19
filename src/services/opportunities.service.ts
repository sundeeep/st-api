import { db } from "../db";
import { opportunities, organizations, type NewOpportunity } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../utils/errors.util";
import { sanitizeString, sanitizeMarkdown } from "../utils/sanitization.util";

export const createOpportunity = async (data: NewOpportunity) => {
  const sanitizedData = {
    ...data,
    title: sanitizeString(data.title),
    description: sanitizeMarkdown(data.description),
    compensation: sanitizeString(data.compensation),
  };

  const [opportunity] = await db.insert(opportunities).values(sanitizedData).returning();
  return opportunity;
};

export const getAllOpportunities = async () => {
  return await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      yearsOfExperienceRequired: opportunities.yearsOfExperienceRequired,
      type: opportunities.type,
      compensation: opportunities.compensation,
      organizationId: opportunities.organizationId,
      postedById: opportunities.postedById,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
      organization: {
        id: organizations.id,
        title: organizations.title,
        logo: organizations.logo,
        city: organizations.city,
      },
    })
    .from(opportunities)
    .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .orderBy(opportunities.createdAt);
};

export const getOpportunityById = async (id: string) => {
  const [opportunity] = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      yearsOfExperienceRequired: opportunities.yearsOfExperienceRequired,
      type: opportunities.type,
      compensation: opportunities.compensation,
      organizationId: opportunities.organizationId,
      postedById: opportunities.postedById,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
      organization: {
        id: organizations.id,
        title: organizations.title,
        description: organizations.description,
        type: organizations.type,
        logo: organizations.logo,
        city: organizations.city,
      },
    })
    .from(opportunities)
    .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(opportunities.id, id));

  if (!opportunity) {
    throw NotFoundError("Opportunity not found");
  }

  return opportunity;
};

export const updateOpportunity = async (id: string, data: Partial<NewOpportunity>) => {
  await getOpportunityById(id);

  const sanitizedData: Partial<NewOpportunity> & { updatedAt: Date } = {
    ...data,
    updatedAt: new Date(),
  };
  if (data.title) sanitizedData.title = sanitizeString(data.title);
  if (data.description) sanitizedData.description = sanitizeMarkdown(data.description);
  if (data.compensation) sanitizedData.compensation = sanitizeString(data.compensation);

  const [updated] = await db
    .update(opportunities)
    .set(sanitizedData)
    .where(eq(opportunities.id, id))
    .returning();

  return updated;
};

export const deleteOpportunity = async (id: string) => {
  await getOpportunityById(id);
  const [deleted] = await db.delete(opportunities).where(eq(opportunities.id, id)).returning();
  return deleted;
};
