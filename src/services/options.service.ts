import { db } from "../db";
import { domains } from "../db/schema/domains.schema";
import { skills } from "../db/schema/skills.schema";

export const getAllDomains = async () => {
  return await db.select().from(domains).orderBy(domains.name);
};

export const getAllSkills = async () => {
  return await db.select().from(skills).orderBy(skills.name);
};

export const getEducationOptions = async () => {
  return {
    degrees: [
      { value: "10th_standard", label: "10th Standard" },
      { value: "12th_intermediate", label: "12th/Intermediate" },
      { value: "diploma", label: "Diploma" },
      { value: "bachelors", label: "Bachelor's Degree (B.Tech, B.Sc, B.Com, BA, BBA)" },
      { value: "masters", label: "Master's Degree (M.Tech, M.Sc, MBA, MA)" },
      { value: "phd", label: "PhD/Doctorate" },
      { value: "other", label: "Other" },
    ],
    fields: [
      { value: "computer_science", label: "Computer Science & IT" },
      { value: "engineering", label: "Engineering (Mechanical, Civil, Electrical, etc.)" },
      { value: "business_management", label: "Business & Management" },
      { value: "commerce", label: "Commerce & Finance" },
      { value: "arts_humanities", label: "Arts & Humanities" },
      { value: "science", label: "Science (Physics, Chemistry, Biology)" },
      { value: "medical", label: "Medical & Healthcare" },
      { value: "law", label: "Law" },
      { value: "design", label: "Design & Creative Arts" },
      { value: "other", label: "Other" },
    ],
  };
};
