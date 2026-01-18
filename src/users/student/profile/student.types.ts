export interface UpdateProfileBody {
  fullName?: string;
  aboutMe?: string | null;
  birthday?: string | null; // YYYY-MM-DD format
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  profileImage?: string | null;
  address?: {
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
  } | null;
}