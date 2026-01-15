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
  title: string;
  coverImage: string | null;
  categoryId: string | null;
  categoryName: string | null;
  eventDate: string;
  eventTime: string | null;
  venueName: string;
  city: string;
  state: string;
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
  title: string;
  coverImage: string | null;
  description: {
    content: string;
  };
  eventDate: string;
  eventTime: string | null;
  timeZone: string | null;
  duration: number | null;
  venueName: string;
  address: string;
  city: string;
  state: string;
  pincode: string | null;
  googleMapsUrl: string | null;
  totalCapacity: number | null;
  bookedCount: number;
  hostName: string | null;
  hostEmail: string | null;
  hostPhone: string | null;
  status: "draft" | "published" | "cancelled" | "completed";
  ticketCategories: TicketCategoryDetail[];
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
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
  eventTitle: string;
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
  eventTitle: string;
  eventDate: string;
  eventTime: string | null;
  venueName: string;
  city: string;
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
  eventTitle: string;
  eventDate: string;
  eventTime: string | null;
  venueName: string;
  address: string;
  city: string;
  state: string;
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
    title: string;
    coverImage: string | null;
    eventDate: string;
    eventTime: string | null;
    timeZone: string | null;
    duration: number | null;
    venueName: string;
    address: string;
    city: string;
    state: string;
    pincode: string | null;
    googleMapsUrl: string | null;
    hostName: string | null;
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
