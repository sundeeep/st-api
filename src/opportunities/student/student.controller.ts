import { Context } from "elysia";
import * as studentService from "./student.service";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type { AuthenticatedContext } from "../../auth/auth.types";
import type { ApplyToOpportunityBody } from "./student.types";

interface OpportunityParams {
  id: string;
  [key: string]: string;
}

export const getOpportunitiesHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as { page?: string; limit?: string };
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  const { opportunities, total } = await studentService.getOpportunities(query.page, query.limit);
  return paginatedResponse(opportunities, page, limit, total, "Opportunities fetched successfully");
};

export const getOpportunityByIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const opportunity = await studentService.getOpportunityById(params.id);
  return successResponse(opportunity, "Opportunity fetched successfully");
};

export const applyToOpportunityHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const body = context.body as ApplyToOpportunityBody;
  const userId = context.user.id;

  const application = await studentService.applyToOpportunity(userId, params.id, body);
  return successResponse(application, "Application submitted successfully");
};

export const getMyApplicationsHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const userId = context.user.id;
  const query = context.query as { page?: string; limit?: string };
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  const { applications, total } = await studentService.getMyApplications(userId, query.page, query.limit);
  return paginatedResponse(applications, page, limit, total, "Applications fetched successfully");
};
