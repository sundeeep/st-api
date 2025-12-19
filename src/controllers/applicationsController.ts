import type { Context } from "elysia";
import { successResponse, messageResponse } from "../utils/response.util";
import * as applicationsService from "../services/applications.service";
import type { SuccessResponse } from "../types/response.types";

interface CreateApplicationBody {
  opportunityId: string;
  resume: string;
  salaryExpectations?: string;
}

interface UpdateApplicationStatusBody {
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "accepted";
}

interface ApplicationParams {
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

export const applyToOpportunity = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const body = context.body as CreateApplicationBody;
  const application = await applicationsService.createApplication({
    ...body,
    studentId: context.user.id,
  });
  return successResponse(application, "Application submitted successfully");
};

export const getAllApplications = async (): Promise<SuccessResponse> => {
  const applications = await applicationsService.getAllApplications();
  return successResponse(applications, "Applications fetched successfully");
};

export const getApplicationById = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as ApplicationParams;
  const application = await applicationsService.getApplicationById(params.id);
  return successResponse(application, "Application fetched successfully");
};

export const getMyApplications = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const applications = await applicationsService.getStudentApplications(context.user.id);
  return successResponse(applications, "Your applications fetched successfully");
};

export const updateApplicationStatus = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as ApplicationParams;
  const body = context.body as UpdateApplicationStatusBody;
  const application = await applicationsService.updateApplicationStatus(params.id, body.status);
  return successResponse(application, "Application status updated successfully");
};

export const deleteApplication = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as ApplicationParams;
  await applicationsService.deleteApplication(params.id);
  return messageResponse("Application deleted successfully");
};
