import { successResponse, messageResponse } from "../utils/response.util";
import * as applicationsService from "../services/applications.service";

export const applyToOpportunity = async (context: any) => {
  const { body, user } = context;
  const application = await applicationsService.createApplication({
    ...body,
    studentId: user.id,
  });
  return successResponse(application, "Application submitted successfully");
};

export const getAllApplications = async () => {
  const applications = await applicationsService.getAllApplications();
  return successResponse(applications, "Applications fetched successfully");
};

export const getApplicationById = async (context: any) => {
  const { params } = context;
  const application = await applicationsService.getApplicationById(params.id);
  return successResponse(application, "Application fetched successfully");
};

export const getMyApplications = async (context: any) => {
  const { user } = context;
  const applications = await applicationsService.getStudentApplications(user.id);
  return successResponse(applications, "Your applications fetched successfully");
};

export const updateApplicationStatus = async (context: any) => {
  const { params, body } = context;
  const application = await applicationsService.updateApplicationStatus(params.id, body.status);
  return successResponse(application, "Application status updated successfully");
};

export const deleteApplication = async (context: any) => {
  const { params } = context;
  await applicationsService.deleteApplication(params.id);
  return messageResponse("Application deleted successfully");
};
