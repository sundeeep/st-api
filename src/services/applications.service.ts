import { db } from "../db";
import {
  opportunityApplications,
  opportunities,
  organizations,
  users,
  type NewOpportunityApplication,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors.util";
import { deleteFromS3, extractKeyFromUrl } from "./s3.service";
import { sanitizeString, isValidS3Url } from "../utils/sanitization.util";
import { env } from "../config/env.config";

export const createApplication = async (data: NewOpportunityApplication) => {
  if (!isValidS3Url(data.resume, env.AWS_S3_BUCKET_NAME, env.AWS_REGION)) {
    throw BadRequestError("Invalid resume URL. Must be from our S3 bucket");
  }

  const existing = await db
    .select()
    .from(opportunityApplications)
    .where(
      and(
        eq(opportunityApplications.opportunityId, data.opportunityId),
        eq(opportunityApplications.studentId, data.studentId)
      )
    );

  if (existing.length > 0) {
    throw ConflictError("You have already applied to this opportunity");
  }

  const sanitizedData = {
    ...data,
    salaryExpectations: data.salaryExpectations
      ? sanitizeString(data.salaryExpectations)
      : data.salaryExpectations,
  };

  const [application] = await db.insert(opportunityApplications).values(sanitizedData).returning();
  return application;
};

export const getAllApplications = async () => {
  return await db
    .select({
      id: opportunityApplications.id,
      opportunityId: opportunityApplications.opportunityId,
      studentId: opportunityApplications.studentId,
      resume: opportunityApplications.resume,
      salaryExpectations: opportunityApplications.salaryExpectations,
      status: opportunityApplications.status,
      appliedAt: opportunityApplications.appliedAt,
      opportunity: {
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
      },
      organization: {
        id: organizations.id,
        title: organizations.title,
        logo: organizations.logo,
      },
      student: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(opportunityApplications)
    .leftJoin(opportunities, eq(opportunityApplications.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .leftJoin(users, eq(opportunityApplications.studentId, users.id))
    .orderBy(opportunityApplications.appliedAt);
};

export const getApplicationById = async (id: string) => {
  const [application] = await db
    .select({
      id: opportunityApplications.id,
      opportunityId: opportunityApplications.opportunityId,
      studentId: opportunityApplications.studentId,
      resume: opportunityApplications.resume,
      salaryExpectations: opportunityApplications.salaryExpectations,
      status: opportunityApplications.status,
      appliedAt: opportunityApplications.appliedAt,
      opportunity: {
        id: opportunities.id,
        title: opportunities.title,
        description: opportunities.description,
        type: opportunities.type,
        compensation: opportunities.compensation,
      },
      organization: {
        id: organizations.id,
        title: organizations.title,
        logo: organizations.logo,
        city: organizations.city,
      },
      student: {
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      },
    })
    .from(opportunityApplications)
    .leftJoin(opportunities, eq(opportunityApplications.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .leftJoin(users, eq(opportunityApplications.studentId, users.id))
    .where(eq(opportunityApplications.id, id));

  if (!application) {
    throw NotFoundError("Application not found");
  }

  return application;
};

export const getStudentApplications = async (studentId: string) => {
  return await db
    .select({
      id: opportunityApplications.id,
      opportunityId: opportunityApplications.opportunityId,
      resume: opportunityApplications.resume,
      salaryExpectations: opportunityApplications.salaryExpectations,
      status: opportunityApplications.status,
      appliedAt: opportunityApplications.appliedAt,
      opportunity: {
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        compensation: opportunities.compensation,
      },
      organization: {
        id: organizations.id,
        title: organizations.title,
        logo: organizations.logo,
        city: organizations.city,
      },
    })
    .from(opportunityApplications)
    .leftJoin(opportunities, eq(opportunityApplications.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(eq(opportunityApplications.studentId, studentId))
    .orderBy(opportunityApplications.appliedAt);
};

export const updateApplicationStatus = async (
  id: string,
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "accepted"
) => {
  await getApplicationById(id);

  const [updated] = await db
    .update(opportunityApplications)
    .set({ status })
    .where(eq(opportunityApplications.id, id))
    .returning();

  return updated;
};

export const deleteApplication = async (id: string) => {
  const application = await getApplicationById(id);

  await db.delete(opportunityApplications).where(eq(opportunityApplications.id, id));

  if (application.resume) {
    const key = extractKeyFromUrl(application.resume);
    if (key) {
      await deleteFromS3(key).catch(() => {});
    }
  }

  return application;
};
