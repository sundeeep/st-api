import { Elysia, t } from "elysia";
import { authenticate } from "../../auth/auth.middleware";
import * as eventController from "./student.controller";

const studentEventRoutes = new Elysia({ prefix: "/student/events" })
  .get(
    "/",
    eventController.browseEventsHandler,
    {
      query: t.Object({
        categoryId: t.Optional(t.String({ format: "uuid" })),
        city: t.Optional(t.String()),
        state: t.Optional(t.String()),
        startDate: t.Optional(t.String({ format: "date" })),
        endDate: t.Optional(t.String({ format: "date" })),
        search: t.Optional(t.String()),
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Student - Events"],
        summary: "Browse events",
        description: "Get paginated list of published events with filters",
      },
    }
  )

  .get(
    "/my-orders",
    async (context) => {
      const authContext = await authenticate(context);
      return eventController.getMyOrdersHandler(authContext);
    },
    {
      query: t.Object({
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Student - Event Orders"],
        summary: "Get my orders",
        description: "Get paginated list of user's event orders",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/my-tickets",
    async (context) => {
      const authContext = await authenticate(context);
      return eventController.getMyTicketsHandler(authContext);
    },
    {
      query: t.Object({
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Student - Event Tickets"],
        summary: "Get my tickets",
        description: "Get paginated list of user's confirmed event tickets with QR codes",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/:id",
    eventController.getEventDetailsHandler,
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Events"],
        summary: "Get event details",
        description: "Get detailed information about a specific event including available tickets",
      },
    }
  )

  .post(
    "/:id/book",
    async (context) => {
      const authContext = await authenticate(context);
      return eventController.bookTicketsHandler(authContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        ticketCategoryId: t.String({ format: "uuid" }),
        quantity: t.Number({ minimum: 1, maximum: 10 }),
      }),
      detail: {
        tags: ["Student - Event Booking"],
        summary: "Book event tickets",
        description: "Create an order for event tickets. Payment must be completed before expiry.",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/tickets/:ticketId",
    async (context) => {
      const authContext = await authenticate(context);
      return eventController.getTicketDetailsHandler(authContext);
    },
    {
      params: t.Object({
        ticketId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Student - Event Tickets"],
        summary: "Get ticket details",
        description: "Get detailed information about a specific ticket including QR code and check-in status",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default studentEventRoutes;
