export interface CreateExperienceBody {
  organization: string;
  role: string;
  employmentType?: "full-time" | "part-time" | "internship" | "contract" | "freelance";
  location?: string;
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  isCurrentlyWorking?: boolean;
}

export interface UpdateExperienceBody {
  organization?: string;
  role?: string;
  employmentType?: "full-time" | "part-time" | "internship" | "contract" | "freelance" | null;
  location?: string | null;
  startDate?: string;
  endDate?: string | null;
  isCurrentlyWorking?: boolean;
}
