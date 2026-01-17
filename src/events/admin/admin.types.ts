import type { Context } from "elysia";

export interface AuthenticatedContext extends Context {
  user: {
    id: string;
    mobile: string;
    email?: string;
    role: string;
    onboardingComplete: boolean;
  };
  userId: string;
}

export interface CreateCategoryBody {
  name: string;
  icon?: string;
}

export interface UpdateCategoryBody {
  name?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CreateEventBody {
  categoryId?: string;
  hostId?: string;
  venueId?: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  posterImage?: string;
  coverImage?: string;
  totalCapacity?: number;
  platformFeeType?: "percentage" | "fixed" | "both";
  platformFeePercentage?: number;
  platformFeeFixed?: number;
}

export interface UpdateEventBody {
  categoryId?: string;
  hostId?: string;
  venueId?: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  posterImage?: string;
  coverImage?: string;
  totalCapacity?: number;
  platformFeeType?: "percentage" | "fixed" | "both";
  platformFeePercentage?: number;
  platformFeeFixed?: number;
  isFeatured?: boolean;
  status?: "draft" | "published" | "cancelled" | "completed";
  isActive?: boolean;
}

export interface CreateTicketCategoryBody {
  ticketTitle: string;
  description?: string;
  price: number;
  quantity: number;
  saleStartDate?: string;
  saleEndDate?: string;
  minPerOrder?: number;
  maxPerOrder?: number;
}

export interface UpdateTicketCategoryBody {
  ticketTitle?: string;
  description?: string;
  price?: number;
  quantity?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  minPerOrder?: number;
  maxPerOrder?: number;
  isActive?: boolean;
}

export interface EventFilters {
  categoryId?: string;
  status?: "draft" | "published" | "cancelled" | "completed";
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface OrderFilters {
  paymentStatus?: "pending" | "completed" | "failed" | "expired";
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export interface AttendeeFilters {
  ticketCategoryId?: string;
  checkedIn?: "true" | "false";
  search?: string;
  page?: string;
  limit?: string;
}
