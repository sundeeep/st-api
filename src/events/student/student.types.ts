export interface EventListFilters {
  categoryId?: string;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EventListItem {
  id: string;
  name: string;
  slug: string;
  posterImage: string | null;
  coverImage: string | null;
  categoryId: string | null;
  categoryName: string | null;
  shortDescription: string | null;
  startTime: string | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
  totalCapacity: number | null;
  bookedCount: number;
  availableTickets: number;
  minPrice: number;
  maxPrice: number;
  status: "draft" | "published" | "cancelled" | "completed";
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface EventDetail {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  posterImage: string | null;
  coverImage: string | null;
  schedules: EventScheduleDetail[];
  venue: VenueDetail | null;
  host: HostDetail | null;
  totalCapacity: number | null;
  bookedCount: number;
  status: "draft" | "published" | "cancelled" | "completed";
  ticketCategories: TicketCategoryDetail[];
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface EventScheduleDetail {
  id: string;
  startTime: string;
  timeZone: string | null;
  isActive: boolean;
}

export interface VenueDetail {
  id: string;
  name: string;
  slug: string;
  capacity: number | null;
  address: AddressDetail | null;
  googleMapsUrl: string | null;
}

export interface AddressDetail {
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
}

export interface HostDetail {
  id: string;
  hostName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isVerified: boolean;
}

export interface TicketCategoryDetail {
  id: string;
  ticketTitle: string;
  description: string | null;
  price: number;
  quantity: number;
  soldCount: number;
  availableCount: number;
  saleStartDate: string | null;
  saleEndDate: string | null;
  minPerOrder: number;
  maxPerOrder: number;
  isActive: boolean;
}

export interface BookTicketRequest {
  ticketCategoryId: string;
  quantity: number;
}

export interface BookTicketResponse {
  orderId: string;
  orderNumber: string;
  eventId: string;
  eventName: string;
  ticketCategoryTitle: string;
  quantity: number;
  ticketPrice: number;
  platformFee: number;
  totalAmount: number;
  paymentStatus: "pending" | "completed" | "failed" | "expired";
  expiresAt: string | null;
  createdAt: string;
  razorpay: {
    orderId: string;
    keyId: string;
    amount: number;
    currency: string;
  };
}

export interface MyOrder {
  orderId: string;
  eventId: string;
  eventName: string;
  startTime: string | null;
  venueName: string | null;
  city: string | null;
  coverImage: string | null;
  ticketCategoryTitle: string;
  quantity: number;
  ticketPrice: number;
  platformFee: number;
  totalAmount: number;
  paymentStatus: "pending" | "completed" | "failed" | "expired";
  paymentId: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface MyTicket {
  ticketId: string;
  qrCode: string;
  orderId: string;
  eventId: string;
  eventName: string;
  startTime: string | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
  coverImage: string | null;
  ticketCategoryTitle: string;
  ticketPrice: number;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  seatNumber: string | null;
}

export interface TicketDetail {
  ticketId: string;
  qrCode: string;
  seatNumber: string | null;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  event: {
    id: string;
    name: string;
    coverImage: string | null;
    startTime: string | null;
    timeZone: string | null;
    venueName: string | null;
    city: string | null;
    state: string | null;
    status: string;
  };
  ticketCategory: {
    id: string;
    ticketTitle: string;
    price: number;
  };
  order: {
    id: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
  };
}
