import * as optionsService from "../services/options.service";
import { successResponse } from "../utils/response.util";

export const getDomainsHandler = async () => {
  const domains = await optionsService.getAllDomains();
  return successResponse(domains, "Domains fetched successfully");
};

export const getSkillsHandler = async () => {
  const skills = await optionsService.getAllSkills();
  return successResponse(skills, "Skills fetched successfully");
};
