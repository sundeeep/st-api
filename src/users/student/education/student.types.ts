export interface CreateEducationBody {
  institutionName: string;
  degree?: string;
  course?: string;
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  isCurrentlyStudying?: boolean;
  gradeValue?: string; // Decimal as string
  gradeType?: "percentage" | "cgpa" | "gpa";
}

export interface UpdateEducationBody {
  institutionName?: string;
  degree?: string;
  course?: string;
  startDate?: string;
  endDate?: string | null;
  isCurrentlyStudying?: boolean;
  gradeValue?: string | null;
  gradeType?: "percentage" | "cgpa" | "gpa" | null;
}
