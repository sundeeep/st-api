import { successResponse, messageResponse } from "../utils/response.util";
import * as opportunitiesService from "../services/opportunities.service";

export const createOpportunity = async (context: any) => {
  const { body, user } = context;
  const opportunity = await opportunitiesService.createOpportunity({
    ...body,
    postedById: user.id,
  });
  return successResponse(opportunity, "Opportunity created successfully");
};

export const getAllOpportunities = async () => {
  const opportunities = await opportunitiesService.getAllOpportunities();
  return successResponse(opportunities, "Opportunities fetched successfully");
};

export const getOpportunityById = async (context: any) => {
  const { params } = context;
  const opportunity = await opportunitiesService.getOpportunityById(params.id);
  return successResponse(opportunity, "Opportunity fetched successfully");
};

export const updateOpportunity = async (context: any) => {
  const { params, body } = context;
  const opportunity = await opportunitiesService.updateOpportunity(params.id, body);
  return successResponse(opportunity, "Opportunity updated successfully");
};

export const deleteOpportunity = async (context: any) => {
  const { params } = context;
  await opportunitiesService.deleteOpportunity(params.id);
  return messageResponse("Opportunity deleted successfully");
};
