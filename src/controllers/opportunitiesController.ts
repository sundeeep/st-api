import type { Context } from "elysia";
import { successResponse, messageResponse } from "../utils/response.util";
import * as opportunitiesService from "../services/opportunities.service";
import type { SuccessResponse } from "../types/response.types";

interface CreateOpportunityBody {
  title: string;
  description: string;
  type: "fulltime" | "parttime" | "internship" | "gig";
  yearsOfExperienceRequired: number;
  compensation: string;
  organizationId: string;
}

interface UpdateOpportunityBody {
  title?: string;
  description?: string;
  type?: "fulltime" | "parttime" | "internship" | "gig";
  yearsOfExperienceRequired?: number;
  compensation?: string;
  organizationId?: string;
}

interface OpportunityParams {
  id: string;
  [key: string]: string;
}

interface AuthenticatedContext extends Context {
  user: {
    id: string;
    phoneNumber: string;
    role: string;
  };
}

export const createOpportunity = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as CreateOpportunityBody;
  const opportunity = await opportunitiesService.createOpportunity({
    ...body,
    postedById: context.user.id,
  });
  return successResponse(opportunity, "Opportunity created successfully");
};

export const getAllOpportunities = async (): Promise<SuccessResponse> => {
  const opportunities = await opportunitiesService.getAllOpportunities();
  return successResponse(opportunities, "Opportunities fetched successfully");
};

export const getOpportunityById = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const opportunity = await opportunitiesService.getOpportunityById(params.id);
  return successResponse(opportunity, "Opportunity fetched successfully");
};

export const updateOpportunity = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  const body = context.body as UpdateOpportunityBody;
  const opportunity = await opportunitiesService.updateOpportunity(params.id, body);
  return successResponse(opportunity, "Opportunity updated successfully");
};

export const deleteOpportunity = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OpportunityParams;
  await opportunitiesService.deleteOpportunity(params.id);
  return messageResponse("Opportunity deleted successfully");
};
