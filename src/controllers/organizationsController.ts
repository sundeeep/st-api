import { successResponse, messageResponse } from "../utils/response.util";
import * as organizationsService from "../services/organizations.service";

export const createOrganization = async (context: any) => {
  const { body, user } = context;
  const organization = await organizationsService.createOrganization({
    ...body,
    createdById: user.id,
  });
  return successResponse(organization, "Organization created successfully");
};

export const getAllOrganizations = async () => {
  const organizations = await organizationsService.getAllOrganizations();
  return successResponse(organizations, "Organizations fetched successfully");
};

export const getOrganizationById = async (context: any) => {
  const { params } = context;
  const organization = await organizationsService.getOrganizationById(params.id);
  return successResponse(organization, "Organization fetched successfully");
};

export const updateOrganization = async (context: any) => {
  const { params, body } = context;
  const organization = await organizationsService.updateOrganization(params.id, body);
  return successResponse(organization, "Organization updated successfully");
};

export const deleteOrganization = async (context: any) => {
  const { params } = context;
  await organizationsService.deleteOrganization(params.id);
  return messageResponse("Organization deleted successfully");
};
