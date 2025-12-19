import { db } from "../db";
import { domains } from "../db/schema/domains.schema";
import { skills } from "../db/schema/skills.schema";

export const getAllDomains = async () => {
  return await db.select().from(domains).orderBy(domains.name);
};

export const getAllSkills = async () => {
  return await db.select().from(skills).orderBy(skills.name);
};
