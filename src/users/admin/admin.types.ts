export interface UserFilters {
  role?: "student" | "admin";
  isActive?: "true" | "false";
  onboardingComplete?: "true" | "false";
  search?: string;
  page?: string;
  limit?: string;
}
