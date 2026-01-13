import { Elysia, t } from "elysia";
import { requireAdmin } from "../../middlewares/admin.middleware";
import * as eventController from "./admin.controller";

const adminEventRoutes = new Elysia({ prefix: "/admin/events" })
  .post(
    "/category",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.createCategoryHandler(adminContext);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
      }),
      detail: {
        tags: ["Admin - Event Categories"],
        summary: "Create event category",
        description: "Create a new event category (e.g., Workshops, College Events)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get("/categories", eventController.getCategoriesHandler, {
    detail: {
      tags: ["Admin - Event Categories"],
      summary: "Get all event categories",
      description: "Returns list of all event categories",
    },
  })

  .put(
    "/category/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.updateCategoryHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin - Event Categories"],
        summary: "Update event category",
        description: "Update an existing event category",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .delete(
    "/category/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.deleteCategoryHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Event Categories"],
        summary: "Delete event category",
        description: "Delete an event category (only if no events exist)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .post(
    "/",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.createEventHandler(adminContext);
    },
    {
      body: t.Object({
        categoryId: t.Optional(t.String({ format: "uuid" })),
        title: t.String({ minLength: 3, maxLength: 200 }),
        coverImage: t.Optional(t.String()),
        description: t.Object({
          content: t.String(),
        }),
        eventDate: t.String({ format: "date" }),
        eventTime: t.Optional(t.String()),
        timeZone: t.Optional(t.String()),
        duration: t.Optional(t.Number({ minimum: 1 })),
        venueName: t.String({ minLength: 2 }),
        address: t.String({ minLength: 5 }),
        city: t.String({ minLength: 2 }),
        state: t.String({ minLength: 2 }),
        pincode: t.Optional(t.String({ pattern: "^[0-9]{6}$" })),
        googleMapsUrl: t.Optional(t.String()),
        totalCapacity: t.Optional(t.Number({ minimum: 1 })),
        platformFeeType: t.Optional(
          t.Union([t.Literal("percentage"), t.Literal("fixed"), t.Literal("both")])
        ),
        platformFeePercentage: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        platformFeeFixed: t.Optional(t.Number({ minimum: 0 })),
        hostName: t.Optional(t.String()),
        hostEmail: t.Optional(t.String({ format: "email" })),
        hostPhone: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin - Events"],
        summary: "Create event",
        description: "Create a new event",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get("/", eventController.getEventsHandler, {
    query: t.Object({
      categoryId: t.Optional(t.String({ format: "uuid" })),
      status: t.Optional(
        t.Union([
          t.Literal("draft"),
          t.Literal("published"),
          t.Literal("cancelled"),
          t.Literal("completed"),
        ])
      ),
      city: t.Optional(t.String()),
      state: t.Optional(t.String()),
      startDate: t.Optional(t.String({ format: "date" })),
      endDate: t.Optional(t.String({ format: "date" })),
      search: t.Optional(t.String()),
      page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
    }),
    detail: {
      tags: ["Admin - Events"],
      summary: "Get all events",
      description: "Get paginated list of events with filters",
    },
  })

  .get("/:id", eventController.getEventByIdHandler, {
    params: t.Object({
      id: t.String({ format: "uuid" }),
    }),
    detail: {
      tags: ["Admin - Events"],
      summary: "Get event by ID",
      description: "Get detailed information about a specific event including tickets",
    },
  })

  .put(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.updateEventHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        categoryId: t.Optional(t.String({ format: "uuid" })),
        title: t.Optional(t.String({ minLength: 3, maxLength: 200 })),
        coverImage: t.Optional(t.String()),
        description: t.Optional(
          t.Object({
            content: t.String(),
          })
        ),
        eventDate: t.Optional(t.String({ format: "date" })),
        eventTime: t.Optional(t.String()),
        timeZone: t.Optional(t.String()),
        duration: t.Optional(t.Number({ minimum: 1 })),
        venueName: t.Optional(t.String({ minLength: 2 })),
        address: t.Optional(t.String({ minLength: 5 })),
        city: t.Optional(t.String({ minLength: 2 })),
        state: t.Optional(t.String({ minLength: 2 })),
        pincode: t.Optional(t.String({ pattern: "^[0-9]{6}$" })),
        googleMapsUrl: t.Optional(t.String()),
        totalCapacity: t.Optional(t.Number({ minimum: 1 })),
        platformFeeType: t.Optional(
          t.Union([t.Literal("percentage"), t.Literal("fixed"), t.Literal("both")])
        ),
        platformFeePercentage: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        platformFeeFixed: t.Optional(t.Number({ minimum: 0 })),
        hostName: t.Optional(t.String()),
        hostEmail: t.Optional(t.String({ format: "email" })),
        hostPhone: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("draft"),
            t.Literal("published"),
            t.Literal("cancelled"),
            t.Literal("completed"),
          ])
        ),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin - Events"],
        summary: "Update event",
        description: "Update event details",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .delete(
    "/:id",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.deleteEventHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Events"],
        summary: "Delete event",
        description: "Delete an event (only if no completed bookings)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .put(
    "/:id/publish",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.publishEventHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Events"],
        summary: "Publish event",
        description: "Publish an event to make it visible to students",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .patch(
    "/:id/cancel",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.cancelEventHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Events"],
        summary: "Cancel event",
        description: "Cancel a published event",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/:id/analytics",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.getEventAnalyticsHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Analytics"],
        summary: "Get event analytics",
        description: "Get statistics for an event (bookings, revenue, attendance)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .post(
    "/:id/tickets",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.createTicketCategoryHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        ticketTitle: t.String({ minLength: 2, maxLength: 100 }),
        description: t.Optional(t.String()),
        price: t.Number({ minimum: 0 }),
        quantity: t.Number({ minimum: 1 }),
        saleStartDate: t.Optional(t.String({ format: "date-time" })),
        saleEndDate: t.Optional(t.String({ format: "date-time" })),
        minPerOrder: t.Optional(t.Number({ minimum: 1 })),
        maxPerOrder: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
      }),
      detail: {
        tags: ["Admin - Event Tickets"],
        summary: "Create ticket category",
        description: "Add a new ticket category to an event",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .put(
    "/tickets/:ticketId",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.updateTicketCategoryHandler(adminContext);
    },
    {
      params: t.Object({
        ticketId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        ticketTitle: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number({ minimum: 0 })),
        quantity: t.Optional(t.Number({ minimum: 1 })),
        saleStartDate: t.Optional(t.String({ format: "date-time" })),
        saleEndDate: t.Optional(t.String({ format: "date-time" })),
        minPerOrder: t.Optional(t.Number({ minimum: 1 })),
        maxPerOrder: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Admin - Event Tickets"],
        summary: "Update ticket category",
        description: "Update ticket category details",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .delete(
    "/tickets/:ticketId",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.deleteTicketCategoryHandler(adminContext);
    },
    {
      params: t.Object({
        ticketId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Event Tickets"],
        summary: "Delete ticket category",
        description: "Delete a ticket category (only if no orders exist)",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/:id/orders",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.getEventOrdersHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        paymentStatus: t.Optional(
          t.Union([
            t.Literal("pending"),
            t.Literal("completed"),
            t.Literal("failed"),
            t.Literal("expired"),
          ])
        ),
        startDate: t.Optional(t.String({ format: "date" })),
        endDate: t.Optional(t.String({ format: "date" })),
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Admin - Event Orders"],
        summary: "Get event orders",
        description: "Get paginated list of orders for an event",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .get(
    "/:id/attendees",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.getEventAttendeesHandler(adminContext);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        ticketCategoryId: t.Optional(t.String({ format: "uuid" })),
        checkedIn: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        search: t.Optional(t.String()),
        page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
        limit: t.Optional(t.String({ pattern: "^[0-9]+$" })),
      }),
      detail: {
        tags: ["Admin - Event Attendees"],
        summary: "Get event attendees",
        description: "Get paginated list of ticket holders with check-in status",
        security: [{ BearerAuth: [] }],
      },
    }
  )

  .post(
    "/tickets/:ticketId/checkin",
    async (context) => {
      const adminContext = await requireAdmin(context);
      return eventController.checkInTicketHandler(adminContext);
    },
    {
      params: t.Object({
        ticketId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin - Event Attendees"],
        summary: "Check-in ticket",
        description: "Scan QR code and mark ticket as checked-in",
        security: [{ BearerAuth: [] }],
      },
    }
  );

export default adminEventRoutes;
