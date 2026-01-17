import type { Context } from "elysia";
import * as eventService from "./admin.service";
import { successResponse, paginatedResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import type {
  AuthenticatedContext,
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateEventBody,
  UpdateEventBody,
  CreateTicketCategoryBody,
  UpdateTicketCategoryBody,
  EventFilters,
  OrderFilters,
  AttendeeFilters,
} from "./admin.types";

interface CategoryParams {
  id: string;
  [key: string]: string;
}

interface EventParams {
  id: string;
  [key: string]: string;
}

interface TicketParams {
  ticketId: string;
  [key: string]: string;
}

export const createCategoryHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const body = context.body as CreateCategoryBody;
  const category = await eventService.createCategory(body, context.userId);
  return successResponse(category, "Category created successfully");
};

export const getCategoriesHandler = async (): Promise<SuccessResponse> => {
  const categories = await eventService.getCategories();
  return successResponse(categories, "Categories fetched successfully");
};

export const updateCategoryHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as CategoryParams;
  const body = context.body as UpdateCategoryBody;
  const category = await eventService.updateCategory(params.id, body);
  return successResponse(category, "Category updated successfully");
};

export const deleteCategoryHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as CategoryParams;
  const result = await eventService.deleteCategory(params.id);
  return successResponse(result, "Category deleted successfully");
};

export const createEventHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const body = context.body as CreateEventBody;
  const event = await eventService.createEvent(body);
  return successResponse(event, "Event created successfully");
};

export const getEventsHandler = async (context: Context): Promise<SuccessResponse> => {
  const filters: EventFilters = {
    categoryId: context.query?.categoryId as string | undefined,
    status: context.query?.status as "draft" | "published" | "cancelled" | "completed" | undefined,
    city: context.query?.city as string | undefined,
    state: context.query?.state as string | undefined,
    startDate: context.query?.startDate as string | undefined,
    endDate: context.query?.endDate as string | undefined,
    search: context.query?.search as string | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await eventService.getEvents(filters);

  return paginatedResponse(
    result.events,
    parseInt(filters.page || "1"),
    parseInt(filters.limit || "10"),
    result.total,
    "Events fetched successfully"
  );
};

export const getEventByIdHandler = async (context: Context): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const event = await eventService.getEventById(params.id);
  return successResponse(event, "Event fetched successfully");
};

export const updateEventHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const body = context.body as UpdateEventBody;
  const event = await eventService.updateEvent(params.id, body);
  return successResponse(event, "Event updated successfully");
};

export const deleteEventHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const result = await eventService.deleteEvent(params.id);
  return successResponse(result, "Event deleted successfully");
};

export const publishEventHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const event = await eventService.publishEvent(params.id);
  return successResponse(event, "Event published successfully");
};

export const cancelEventHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const event = await eventService.cancelEvent(params.id);
  return successResponse(event, "Event cancelled successfully");
};

export const getEventAnalyticsHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const analytics = await eventService.getEventAnalytics(params.id);
  return successResponse(analytics, "Analytics fetched successfully");
};

export const createTicketCategoryHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const body = context.body as CreateTicketCategoryBody;
  const ticket = await eventService.createTicketCategory(params.id, body);
  return successResponse(ticket, "Ticket category created successfully");
};

export const updateTicketCategoryHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as TicketParams;
  const body = context.body as UpdateTicketCategoryBody;
  const ticket = await eventService.updateTicketCategory(params.ticketId, body);
  return successResponse(ticket, "Ticket category updated successfully");
};

export const deleteTicketCategoryHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as TicketParams;
  const result = await eventService.deleteTicketCategory(params.ticketId);
  return successResponse(result, "Ticket category deleted successfully");
};

export const getEventOrdersHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const filters: OrderFilters = {
    paymentStatus: context.query?.paymentStatus as "pending" | "completed" | "failed" | "expired" | undefined,
    startDate: context.query?.startDate as string | undefined,
    endDate: context.query?.endDate as string | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await eventService.getEventOrders(params.id, filters);

  return paginatedResponse(
    result.orders,
    parseInt(filters.page || "1"),
    parseInt(filters.limit || "10"),
    result.total,
    "Orders fetched successfully"
  );
};

export const getEventAttendeesHandler = async (
  context: AuthenticatedContext
): Promise<SuccessResponse> => {
  const params = context.params as EventParams;
  const filters: AttendeeFilters = {
    ticketCategoryId: context.query?.ticketCategoryId as string | undefined,
    checkedIn: context.query?.checkedIn as "true" | "false" | undefined,
    search: context.query?.search as string | undefined,
    page: context.query?.page as string | undefined,
    limit: context.query?.limit as string | undefined,
  };

  const result = await eventService.getEventAttendees(params.id, filters);

  return paginatedResponse(
    result.attendees,
    parseInt(filters.page || "1"),
    parseInt(filters.limit || "10"),
    result.total,
    "Attendees fetched successfully"
  );
};

export const checkInTicketHandler = async (context: AuthenticatedContext): Promise<SuccessResponse> => {
  const params = context.params as TicketParams;
  const ticket = await eventService.checkInTicket(params.ticketId, context.userId);
  return successResponse(ticket, "Ticket checked in successfully");
};
