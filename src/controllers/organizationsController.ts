import type { Context } from "elysia";
import { successResponse, messageResponse } from "../utils/response.util";
import * as organizationsService from "../services/organizations.service";
import type { SuccessResponse } from "../types/response.types";

interface CreateOrganizationBody {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  location?: string;
}

interface UpdateOrganizationBody {
  name?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  location?: string;
}

interface OrganizationParams {
  id: string;
}

interface AuthenticatedContext extends Context {
  user: {
    id: string;
    phoneNumber: string;
    role: string;
  };
}

export const createOrganization = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as CreateOrganizationBody;
  const organization = await organizationsService.createOrganization({
    ...body,
    createdById: context.user.id,
  });
  return successResponse(organization, "Organization created successfully");
};

export const getAllOrganizations = async (): Promise<SuccessResponse> => {
  const organizations = await organizationsService.getAllOrganizations();
  return successResponse(organizations, "Organizations fetched successfully");
};

export const getOrganizationById = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OrganizationParams;
  const organization = await organizationsService.getOrganizationById(params.id);
  return successResponse(organization, "Organization fetched successfully");
};

export const updateOrganization = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OrganizationParams;
  const body = context.body as UpdateOrganizationBody;
  const organization = await organizationsService.updateOrganization(params.id, body);
  return successResponse(organization, "Organization updated successfully");
};

export const deleteOrganization = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as OrganizationParams;
  await organizationsService.deleteOrganization(params.id);
  return messageResponse("Organization deleted successfully");
};
