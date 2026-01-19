export interface CreateCompanyBody {
  name: string;
  website?: string;
  logo?: string;
  description?: string;
  location?: string;
}

export interface UpdateCompanyBody {
  name?: string;
  website?: string | null;
  logo?: string | null;
  description?: string | null;
  location?: string | null;
}

export interface CreateOpportunityBody {
  companyId: string;
  title: string;
  opportunityType: "internship" | "full_time";
  description?: string;
  stipend?: string; // decimal as string
  salaryRange?: string;
  duration?: string;
  location?: string;
}

export interface UpdateOpportunityBody {
  companyId?: string;
  title?: string;
  opportunityType?: "internship" | "full_time";
  description?: string | null;
  stipend?: string | null;
  salaryRange?: string | null;
  duration?: string | null;
  location?: string | null;
  isActive?: boolean;
}

export interface CreateQuestionBody {
  question: string;
  questionType: "short_text" | "long_text" | "yes_no" | "number" | "url" | "file";
  isRequired?: boolean;
}

export interface UpdateQuestionBody {
  question?: string;
  questionType?: "short_text" | "long_text" | "yes_no" | "number" | "url" | "file";
  isRequired?: boolean;
}

export interface ApplicationFilters {
  page?: string;
  limit?: string;
  opportunityId?: string;
  status?: "applied" | "shortlisted" | "interview" | "selected" | "rejected" | "withdrawn";
}

export interface UpdateApplicationStatusBody {
  status: "applied" | "shortlisted" | "interview" | "selected" | "rejected" | "withdrawn";
}
