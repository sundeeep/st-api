import { Elysia } from "elysia";
import {
  getDomainsHandler,
  getSkillsHandler,
  getEducationOptionsHandler,
} from "../controllers/optionsController";

/**
 * Options routes (domains, skills, education options for selection)
 */
const optionsRoutes = new Elysia()
  .get("/domains", getDomainsHandler, {
    detail: {
      tags: ["Domains & Skills"],
      summary: "Get all domains",
      description: "Fetch all available domains for user selection",
    },
  })
  .get("/skills", getSkillsHandler, {
    detail: {
      tags: ["Domains & Skills"],
      summary: "Get all skills",
      description: "Fetch all available skills for user selection",
    },
  })
  .get("/education-options", getEducationOptionsHandler, {
    detail: {
      tags: ["Domains & Skills"],
      summary: "Get education options",
      description: "Fetch all available degree and field of study options for education form",
    },
  });

export default optionsRoutes;
