import { Elysia, t } from "elysia";
import { getAllOpportunities, getOpportunityById } from "../controllers/opportunitiesController";
import { applyToOpportunity, getMyApplications } from "../controllers/applicationsController";
import { authPlugin } from "../middlewares/auth.middleware";

const studentRoutes = new Elysia()
  .get("/opportunities", getAllOpportunities, {
    detail: {
      tags: ["Student - Opportunities"],
      summary: "Browse all opportunities",
      description: "Get all available job/internship opportunities. No authentication required.",
    },
  })
  .get("/opportunities/:id", getOpportunityById, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Opportunity ID" }),
    }),
    detail: {
      tags: ["Student - Opportunities"],
      summary: "View opportunity details",
      description:
        "Get detailed information about a specific opportunity. No authentication required.",
    },
  })
  .use(authPlugin)
  .post("/opportunities/:id/apply", applyToOpportunity, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Opportunity ID" }),
    }),
    body: t.Object({
      opportunityId: t.String({ format: "uuid", description: "Opportunity ID to apply to" }),
      resume: t.String({ format: "uri", description: "Resume PDF URL from S3" }),
      salaryExpectations: t.Optional(t.String({ description: "Expected salary/stipend" })),
    }),
    detail: {
      tags: ["Student - Opportunities"],
      summary: "Apply to opportunity",
      description: "Submit application to an opportunity. Student authentication required.",
      security: [{ BearerAuth: [] }],
    },
  })
  .get("/my-applications", getMyApplications, {
    detail: {
      tags: ["Student - Opportunities"],
      summary: "View my applications",
      description: "Get all applications submitted by the authenticated student.",
      security: [{ BearerAuth: [] }],
    },
  });

export default studentRoutes;
