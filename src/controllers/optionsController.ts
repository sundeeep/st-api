import * as optionsService from "../services/options.service";
import { successResponse } from "../utils/response.util";

/**
 * Get all domains
 */
export const getDomainsHandler = async () => {
  const domains = await optionsService.getAllDomains();
  return successResponse(domains, "Domains fetched successfully");
};

/**
 * Get all skills
 */
export const getSkillsHandler = async () => {
  const skills = await optionsService.getAllSkills();
  return successResponse(skills, "Skills fetched successfully");
};
