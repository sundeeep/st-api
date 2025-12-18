import { db } from "./connection";
import { domains } from "./schema/domains.schema";
import { skills } from "./schema/skills.schema";

/**
 * Predefined domains
 */
const domainsList = [
  "Software Development",
  "Data Science",
  "UI/UX Design",
  "Digital Marketing",
  "Product Management",
  "Business Analysis",
  "DevOps Engineering",
  "Cyber Security",
  "Mobile Development",
  "Cloud Architecture",
];

/**
 * Predefined skills
 */
const skillsList = [
  // Programming Languages
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",

  // Frontend
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "SASS",

  // Backend
  "Node.js",
  "Express.js",
  "NestJS",
  "Django",
  "Flask",
  "Spring Boot",
  "Laravel",
  "Ruby on Rails",

  // Databases
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "Firebase",

  // DevOps & Cloud
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "CI/CD",
  "Jenkins",
  "GitHub Actions",

  // Tools
  "Git",
  "Figma",
  "Jira",
  "Postman",
  "VS Code",

  // Others
  "REST API",
  "GraphQL",
  "Microservices",
  "Agile",
  "Scrum",
];

/**
 * Seed database with domains and skills
 */
export const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding database...");

    // Seed domains
    console.log("📁 Inserting domains...");
    for (const domainName of domainsList) {
      await db.insert(domains).values({ name: domainName }).onConflictDoNothing();
    }

    // Seed skills
    console.log("💡 Inserting skills...");
    for (const skillName of skillsList) {
      await db.insert(skills).values({ name: skillName }).onConflictDoNothing();
    }

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

// Run seed if called directly
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
