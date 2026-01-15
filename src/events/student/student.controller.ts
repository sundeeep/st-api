import { Context } from "elysia";
import * as eventService from "./student.service";
import type { AuthenticatedContext } from "../../auth/auth.types";
import { successResponse } from "../../utils/response.util";
import type { SuccessResponse } from "../../types/response.types";
import { EventListFilters, BookTicketRequest } from "./student.types";

export const browseEventsHandler = async (context: Context): Promise<SuccessResponse> => {
  const query = context.query as Record<string, string>;
  const authContext = context as Partial<AuthenticatedContext>;
  const userId = authContext.user?.id;

  const filters: EventListFilters = {
    categoryId: query.categoryId,
    city: query.city,
    state: query.state,
    startDate: query.startDate,
    endDate: query.endDate,
    search: query.search,
    page: query.page ? parseInt(query.page, 10) : undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  };

  const result = await eventService.browseEvents(filters, userId);
  return successResponse(result, "Events fetched successfully");
};

export const getEventDetailsHandler = async (context: Context): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const authContext = context as Partial<AuthenticatedContext>;
  const userId = authContext.user?.id;
  const event = await eventService.getEventDetails(id, userId);
  return successResponse(event, "Event details fetched successfully");
};

export const bookTicketsHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { id } = context.params as { id: string };
  const request = context.body as BookTicketRequest;
  const userId = context.user.id;

  const booking = await eventService.bookTickets(userId, id, request);
  return successResponse(
    booking,
    "Booking created successfully. Complete payment before expiry to confirm tickets."
  );
};

export const getMyOrdersHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const query = context.query as Record<string, string>;
  const userId = context.user.id;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;

  const result = await eventService.getMyOrders(userId, page, limit);
  return successResponse(result, "Orders fetched successfully");
};

export const getMyTicketsHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const query = context.query as Record<string, string>;
  const userId = context.user.id;
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;

  const result = await eventService.getMyTickets(userId, page, limit);
  return successResponse(result, "Tickets fetched successfully");
};

export const getTicketDetailsHandler = async (
  context: AuthenticatedContext & Context
): Promise<SuccessResponse> => {
  const { ticketId } = context.params as { ticketId: string };
  const userId = context.user.id;

  const ticket = await eventService.getTicketDetails(userId, ticketId);
  return successResponse(ticket, "Ticket details fetched successfully");
};
