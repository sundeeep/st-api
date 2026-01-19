import type { Context } from "elysia";
import * as adminService from "./admin.service";
import { successResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type { AuthenticatedContext } from "../../auth/auth.types";
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
import { paginatedResponse } from "../../utils/response.util";

interface CompanyParams {
  id: string;
  [key: string]: string;
}

interface OpportunityParams {
  id: string;
  [key: string]: string;
}

export const createCompanyHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const body = context.body as CreateCompanyBody;
  const company = await adminService.createCompany(body);
  return successResponse(company, "Company created successfully");
};

export const getCompaniesHandler = async (): Promise<SuccessResponse> => {
  const companies = await adminService.getCompanies();
  return successResponse(companies, "Companies fetched successfully");
};

export const updateCompanyHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as CompanyParams;
  const body = context.body as UpdateCompanyBody;
  const company = await adminService.updateCompany(params.id, body);
  return successResponse(company, "Company updated successfully");
};

export const createOpportunityHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const body = context.body as CreateOpportunityBody;
  const opportunity = await adminService.createOpportunity(body);
  return successResponse(opportunity, "Opportunity created successfully");
};

export const getOpportunitiesHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as { page?: string; limit?: string };
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  const { opportunities, total } = await adminService.getOpportunities(query.page, query.limit);
  return paginatedResponse(opportunities, page, limit, total, "Opportunities fetched successfully");
};

export const updateOpportunityHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const body = context.body as UpdateOpportunityBody;
  const opportunity = await adminService.updateOpportunity(params.id, body);
  return successResponse(opportunity, "Opportunity updated successfully");
};

export const activateOpportunityHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const opportunity = await adminService.activateOpportunity(params.id);
  return successResponse(opportunity, "Opportunity activated successfully");
};

interface QuestionParams {
  id: string;
  [key: string]: string;
}

export const createQuestionHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const body = context.body as CreateQuestionBody;
  const question = await adminService.createQuestion(params.id, body);
  return successResponse(question, "Question created successfully");
};

export const getOpportunityQuestionsHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const questions = await adminService.getOpportunityQuestions(params.id);
  return successResponse(questions, "Questions fetched successfully");
};

export const updateQuestionHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as QuestionParams;
  const body = context.body as UpdateQuestionBody;
  const question = await adminService.updateQuestion(params.id, body);
  return successResponse(question, "Question updated successfully");
};

export const deleteQuestionHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as QuestionParams;
  const result = await adminService.deleteQuestion(params.id);
  return successResponse(result, "Question deleted successfully");
};

interface ApplicationParams {
  id: string;
  [key: string]: string;
}

export const getApplicationsHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as ApplicationFilters;
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");

  const { applications, total } = await adminService.getApplications(query);

  return paginatedResponse(applications, page, limit, total, "Applications fetched successfully");
};

export const getApplicationByIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as ApplicationParams;
  const application = await adminService.getApplicationById(params.id);
  return successResponse(application, "Application fetched successfully");
};

export const updateApplicationStatusHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as ApplicationParams;
  const body = context.body as UpdateApplicationStatusBody;
  const application = await adminService.updateApplicationStatus(params.id, body);
  return successResponse(application, "Application status updated successfully");
};
