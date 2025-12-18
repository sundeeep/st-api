import { z } from "zod";
import { Elysia } from "elysia";
import {
  getRequest,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/authController";

// Zod schemas
const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
});

const authRoutes = new Elysia({ prefix: "/auth" })
  .get("/", getRequest)
  .get("/:id", getUserById, {
    params: userIdSchema,
  })
  .post("/", createUser, {
    body: createUserSchema,
  })
  .put("/:id", updateUser, {
    params: userIdSchema,
    body: updateUserSchema,
  })
  .delete("/:id", deleteUser, {
    params: userIdSchema,
  });

export default authRoutes;
