import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  companies,
  opportunities,
  opportunityQuestions,
  opportunityApplications,
  opportunityApplicationAnswers,
} from "../shared/schema";
import { usersProfile } from "../../auth/auth.schema";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors.util";
import type {
  CreateCompanyBody,
  UpdateCompanyBody,
  CreateOpportunityBody,
  UpdateOpportunityBody,
  CreateQuestionBody,
  UpdateQuestionBody,
  ApplicationFilters,
  UpdateApplicationStatusBody,
} from "./admin.types";

/**
 * Create company
 */
export async function createCompany(data: CreateCompanyBody) {
  // Check if company with same name exists
  const [existing] = await db
    .select()
    .from(companies)
    .where(eq(companies.name, data.name))
    .limit(1);

  if (existing) {
    throw ConflictError("Company with this name already exists");
  }

  const [company] = await db
    .insert(companies)
    .values({
      name: data.name,
      website: data.website || null,
      logo: data.logo || null,
      description: data.description || null,
      location: data.location || null,
    })
    .returning();

  return company;
}

/**
 * Update company
 */
export async function updateCompany(companyId: string, data: UpdateCompanyBody) {
  // Check if company exists
  const [existing] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!existing) {
    throw NotFoundError("Company not found");
  }

  // Check name uniqueness if name is being updated
  if (data.name && data.name !== existing.name) {
    const [duplicate] = await db
      .select()
      .from(companies)
      .where(eq(companies.name, data.name))
      .limit(1);

    if (duplicate) {
      throw ConflictError("Company with this name already exists");
    }
  }

  const updateData: Partial<typeof companies.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.logo !== undefined) updateData.logo = data.logo;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;

  const [updated] = await db
    .update(companies)
    .set(updateData)
    .where(eq(companies.id, companyId))
    .returning();

  return updated;
}

/**
 * Get all companies
 */
export async function getCompanies() {
  const companiesList = await db
    .select()
    .from(companies)
    .orderBy(companies.createdAt);

  return companiesList;
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company) {
    throw NotFoundError("Company not found");
  }

  return company;
}

/**
 * Create opportunity
 */
export async function createOpportunity(data: CreateOpportunityBody) {
  // Verify company exists
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, data.companyId))
    .limit(1);

  if (!company) {
    throw NotFoundError("Company not found");
  }

  const [opportunity] = await db
    .insert(opportunities)
    .values({
      companyId: data.companyId,
      title: data.title,
      opportunityType: data.opportunityType,
      description: data.description || null,
      stipend: data.stipend || null,
      salaryRange: data.salaryRange || null,
      duration: data.duration || null,
      location: data.location || null,
      isActive: true,
    })
    .returning();

  return opportunity;
}

/**
 * Update opportunity
 */
export async function updateOpportunity(opportunityId: string, data: UpdateOpportunityBody) {
  // Check if opportunity exists
  const [existing] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!existing) {
    throw NotFoundError("Opportunity not found");
  }

  // Verify company exists if companyId is being updated
  if (data.companyId && data.companyId !== existing.companyId) {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))
      .limit(1);

    if (!company) {
      throw NotFoundError("Company not found");
    }
  }

  const updateData: Partial<typeof opportunities.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.companyId !== undefined) updateData.companyId = data.companyId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.opportunityType !== undefined) updateData.opportunityType = data.opportunityType;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.stipend !== undefined) updateData.stipend = data.stipend;
  if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(opportunities)
    .set(updateData)
    .where(eq(opportunities.id, opportunityId))
    .returning();

  return updated;
}

/**
 * Activate opportunity
 */
export async function activateOpportunity(opportunityId: string) {
  const [opportunity] = await db
    .update(opportunities)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(opportunities.id, opportunityId))
    .returning();

  if (!opportunity) {
    throw NotFoundError("Opportunity not found");
  }

  return opportunity;
}

/**
 * Get all opportunities with pagination
 */
export async function getOpportunities(page: string = "1", limit: string = "10") {
  const pageNum = parseInt(page || "1");
  const limitNum = Math.min(parseInt(limit || String(DEFAULT_PAGE_LIMIT)), MAX_PAGE_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  // Run count and data queries in parallel
  const [opportunitiesList, totalCount] = await Promise.all([
    db
      .select({
        opportunity: opportunities,
        company: companies,
      })
      .from(opportunities)
      .innerJoin(companies, eq(opportunities.companyId, companies.id))
      .orderBy(desc(opportunities.createdAt))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunities),
  ]);

  return {
    opportunities: opportunitiesList.map((item) => ({
      ...item.opportunity,
      company: item.company,
    })),
    total: totalCount[0]?.count || 0,
  };
}

/**
 * Get opportunity by ID
 */
export async function getOpportunityById(opportunityId: string) {
  const [result] = await db
    .select({
      opportunity: opportunities,
      company: companies,
    })
    .from(opportunities)
    .innerJoin(companies, eq(opportunities.companyId, companies.id))
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!result) {
    throw NotFoundError("Opportunity not found");
  }

  return {
    ...result.opportunity,
    company: result.company,
  };
}

/**
 * Create opportunity question
 */
export async function createQuestion(opportunityId: string, data: CreateQuestionBody) {
  // Verify opportunity exists
  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!opportunity) {
    throw NotFoundError("Opportunity not found");
  }

  const [question] = await db
    .insert(opportunityQuestions)
    .values({
      opportunityId,
      question: data.question,
      questionType: data.questionType,
      isRequired: data.isRequired !== undefined ? data.isRequired : true,
    })
    .returning();

  return question;
}

/**
 * Update question
 */
export async function updateQuestion(questionId: string, data: UpdateQuestionBody) {
  // Check if question exists
  const [existing] = await db
    .select()
    .from(opportunityQuestions)
    .where(eq(opportunityQuestions.id, questionId))
    .limit(1);

  if (!existing) {
    throw NotFoundError("Question not found");
  }

  const updateData: Partial<typeof opportunityQuestions.$inferInsert> = {};

  if (data.question !== undefined) updateData.question = data.question;
  if (data.questionType !== undefined) updateData.questionType = data.questionType;
  if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;

  const [updated] = await db
    .update(opportunityQuestions)
    .set(updateData)
    .where(eq(opportunityQuestions.id, questionId))
    .returning();

  return updated;
}

/**
 * Delete question
 */
export async function deleteQuestion(questionId: string) {
  const [question] = await db
    .select()
    .from(opportunityQuestions)
    .where(eq(opportunityQuestions.id, questionId))
    .limit(1);

  if (!question) {
    throw NotFoundError("Question not found");
  }

  await db.delete(opportunityQuestions).where(eq(opportunityQuestions.id, questionId));

  return { deleted: true, id: questionId };
}

/**
 * Get questions for opportunity
 */
export async function getOpportunityQuestions(opportunityId: string) {
  // Verify opportunity exists
  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!opportunity) {
    throw NotFoundError("Opportunity not found");
  }

  const questions = await db
    .select()
    .from(opportunityQuestions)
    .where(eq(opportunityQuestions.opportunityId, opportunityId))
    .orderBy(opportunityQuestions.createdAt);

  return questions;
}

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 100;

/**
 * Get all applications with pagination and filters
 */
export async function getApplications(filters: ApplicationFilters) {
  const page = parseInt(filters.page || "1");
  const limit = Math.min(parseInt(filters.limit || String(DEFAULT_PAGE_LIMIT)), MAX_PAGE_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.opportunityId) {
    conditions.push(eq(opportunityApplications.opportunityId, filters.opportunityId));
  }

  if (filters.status) {
    conditions.push(eq(opportunityApplications.status, filters.status));
  }

  // Run count and data queries in parallel
  const [applicationsList, totalCount] = await Promise.all([
    db
      .select({
        application: opportunityApplications,
        user: {
          id: usersProfile.id,
          fullName: usersProfile.fullName,
          email: usersProfile.email,
          mobile: usersProfile.mobile,
          profileImage: usersProfile.profileImage,
        },
        opportunity: {
          id: opportunities.id,
          title: opportunities.title,
          opportunityType: opportunities.opportunityType,
        },
        company: {
          id: companies.id,
          name: companies.name,
          logo: companies.logo,
        },
      })
      .from(opportunityApplications)
      .innerJoin(usersProfile, eq(opportunityApplications.userId, usersProfile.id))
      .innerJoin(opportunities, eq(opportunityApplications.opportunityId, opportunities.id))
      .innerJoin(companies, eq(opportunities.companyId, companies.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(opportunityApplications.appliedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunityApplications)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  const formattedApplications = applicationsList.map((item) => ({
    id: item.application.id,
    status: item.application.status,
    appliedAt: item.application.appliedAt,
    updatedAt: item.application.updatedAt,
    user: item.user,
    opportunity: item.opportunity,
    company: item.company,
  }));

  return {
    applications: formattedApplications,
    total: totalCount[0]?.count || 0,
  };
}

/**
 * Get application by ID with all answers
 */
export async function getApplicationById(applicationId: string) {
  // Get application with user, opportunity, and company
  const [applicationData] = await db
    .select({
      application: opportunityApplications,
      user: {
        id: usersProfile.id,
        fullName: usersProfile.fullName,
        email: usersProfile.email,
        mobile: usersProfile.mobile,
        profileImage: usersProfile.profileImage,
      },
      opportunity: {
        id: opportunities.id,
        title: opportunities.title,
        opportunityType: opportunities.opportunityType,
        description: opportunities.description,
        location: opportunities.location,
      },
      company: {
        id: companies.id,
        name: companies.name,
        logo: companies.logo,
        website: companies.website,
      },
    })
    .from(opportunityApplications)
    .innerJoin(usersProfile, eq(opportunityApplications.userId, usersProfile.id))
    .innerJoin(opportunities, eq(opportunityApplications.opportunityId, opportunities.id))
    .innerJoin(companies, eq(opportunities.companyId, companies.id))
    .where(eq(opportunityApplications.id, applicationId))
    .limit(1);

  if (!applicationData) {
    throw NotFoundError("Application not found");
  }

  // Get all answers for this application
  const answers = await db
    .select({
      id: opportunityApplicationAnswers.id,
      answer: opportunityApplicationAnswers.answer,
      createdAt: opportunityApplicationAnswers.createdAt,
      question: {
        id: opportunityQuestions.id,
        question: opportunityQuestions.question,
        questionType: opportunityQuestions.questionType,
        isRequired: opportunityQuestions.isRequired,
      },
    })
    .from(opportunityApplicationAnswers)
    .innerJoin(
      opportunityQuestions,
      eq(opportunityApplicationAnswers.questionId, opportunityQuestions.id)
    )
    .where(eq(opportunityApplicationAnswers.applicationId, applicationId))
    .orderBy(opportunityQuestions.createdAt);

  return {
    id: applicationData.application.id,
    status: applicationData.application.status,
    appliedAt: applicationData.application.appliedAt,
    updatedAt: applicationData.application.updatedAt,
    user: applicationData.user,
    opportunity: applicationData.opportunity,
    company: applicationData.company,
    answers: answers.map((a) => ({
      id: a.id,
      answer: a.answer,
      createdAt: a.createdAt,
      question: a.question,
    })),
  };
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  data: UpdateApplicationStatusBody
) {
  // Check if application exists
  const [existing] = await db
    .select()
    .from(opportunityApplications)
    .where(eq(opportunityApplications.id, applicationId))
    .limit(1);

  if (!existing) {
    throw NotFoundError("Application not found");
  }

  const [updated] = await db
    .update(opportunityApplications)
    .set({
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(opportunityApplications.id, applicationId))
    .returning();

  return updated;
}