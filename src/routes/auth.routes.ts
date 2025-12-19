import { Elysia, t } from "elysia";
import {
  getRequest,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/authController";

const authRoutes = new Elysia({ prefix: "/auth" })
  .get("/", getRequest, {
    detail: {
      tags: ["Authentication"],
      summary: "Get all users",
      description: "Fetch all users (mock data)",
    },
  })
  .get("/:id", getUserById, {
    params: t.Object({
      id: t.String({ pattern: "^\\d+$", description: "User ID" }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Get user by ID",
      description: "Fetch a specific user by ID (mock data)",
    },
  })
  .post("/", createUser, {
    body: t.Object({
      name: t.String({ minLength: 2, description: "User name" }),
      email: t.String({ format: "email", description: "User email" }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Create user",
      description: "Create a new user (mock data)",
    },
  })
  .put("/:id", updateUser, {
    params: t.Object({
      id: t.String({ pattern: "^\\d+$", description: "User ID" }),
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 2, description: "User name" })),
      email: t.Optional(t.String({ format: "email", description: "User email" })),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Update user",
      description: "Update user details (mock data)",
    },
  })
  .delete("/:id", deleteUser, {
    params: t.Object({
      id: t.String({ pattern: "^\\d+$", description: "User ID" }),
    }),
    detail: {
      tags: ["Authentication"],
      summary: "Delete user",
      description: "Delete a user (mock data)",
    },
  });

export default authRoutes;
