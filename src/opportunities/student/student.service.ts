import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  opportunities,
  opportunityQuestions,
  opportunityApplications,
  opportunityApplicationAnswers,
  companies,
} from "../shared/schema";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors.util";
import type { ApplyToOpportunityBody } from "./student.types";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 20;

/**
 * Get all active opportunities for students
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
      .where(eq(opportunities.isActive, true))
      .orderBy(desc(opportunities.createdAt))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunities)
      .where(eq(opportunities.isActive, true)),
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
 * Get opportunity by ID with questions (for students)
 */
export async function getOpportunityById(opportunityId: string) {
  const [result] = await db
    .select({
      opportunity: opportunities,
      company: companies,
    })
    .from(opportunities)
    .innerJoin(companies, eq(opportunities.companyId, companies.id))
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.isActive, true)))
    .limit(1);

  if (!result) {
    throw NotFoundError("Opportunity not found or not active");
  }

  // Get questions for this opportunity
  const questions = await db
    .select()
    .from(opportunityQuestions)
    .where(eq(opportunityQuestions.opportunityId, opportunityId))
    .orderBy(opportunityQuestions.createdAt);

  return {
    ...result.opportunity,
    company: result.company,
    questions,
  };
}

/**
 * Apply to an opportunity
 */
export async function applyToOpportunity(userId: string, opportunityId: string, data: ApplyToOpportunityBody) {
  // Verify opportunity exists and is active
  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.isActive, true)))
    .limit(1);

  if (!opportunity) {
    throw NotFoundError("Opportunity not found or not active");
  }

  // Check if user already applied
  const [existingApplication] = await db
    .select()
    .from(opportunityApplications)
    .where(and(eq(opportunityApplications.opportunityId, opportunityId), eq(opportunityApplications.userId, userId)))
    .limit(1);

  if (existingApplication) {
    throw ConflictError("You have already applied to this opportunity");
  }

  // Get all questions for this opportunity
  const questions = await db
    .select()
    .from(opportunityQuestions)
    .where(eq(opportunityQuestions.opportunityId, opportunityId));

  // Validate that all required questions have answers
  const requiredQuestions = questions.filter((q) => q.isRequired);
  const providedQuestionIds = new Set(data.answers.map((a) => a.questionId));

  for (const reqQuestion of requiredQuestions) {
    if (!providedQuestionIds.has(reqQuestion.id)) {
      throw BadRequestError(`Required question '${reqQuestion.question}' must be answered`);
    }
  }

  // Validate that all provided questionIds exist
  const questionIdsSet = new Set(questions.map((q) => q.id));
  for (const answer of data.answers) {
    if (!questionIdsSet.has(answer.questionId)) {
      throw BadRequestError(`Question with ID ${answer.questionId} does not belong to this opportunity`);
    }
  }

  // Create application
  const [application] = await db
    .insert(opportunityApplications)
    .values({
      opportunityId,
      userId,
      status: "applied",
    })
    .returning();

  // Create answers
  if (data.answers.length > 0) {
    await db.insert(opportunityApplicationAnswers).values(
      data.answers.map((answer) => ({
        applicationId: application.id,
        questionId: answer.questionId,
        answer: answer.answer,
      }))
    );
  }

  return application;
}

/**
 * Get student's own applications
 */
export async function getMyApplications(userId: string, page: string = "1", limit: string = "10") {
  const pageNum = parseInt(page || "1");
  const limitNum = Math.min(parseInt(limit || String(DEFAULT_PAGE_LIMIT)), MAX_PAGE_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  // Run count and data queries in parallel
  const [applicationsList, totalCount] = await Promise.all([
    db
      .select({
        application: opportunityApplications,
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
      .innerJoin(opportunities, eq(opportunityApplications.opportunityId, opportunities.id))
      .innerJoin(companies, eq(opportunities.companyId, companies.id))
      .where(eq(opportunityApplications.userId, userId))
      .orderBy(desc(opportunityApplications.appliedAt))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunityApplications)
      .where(eq(opportunityApplications.userId, userId)),
  ]);

  const formattedApplications = applicationsList.map((item) => ({
    id: item.application.id,
    status: item.application.status,
    appliedAt: item.application.appliedAt,
    updatedAt: item.application.updatedAt,
    opportunity: item.opportunity,
    company: item.company,
  }));

  return {
    applications: formattedApplications,
    total: totalCount[0]?.count || 0,
  };
}
