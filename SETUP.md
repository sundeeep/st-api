# Bun + Elysia + Drizzle Setup Guide

## 🚀 Project Setup Complete!

This project uses:
- **Bun** - Fast JavaScript runtime
- **Elysia** - Fast web framework optimized for Bun
- **Drizzle ORM** - TypeScript ORM for PostgreSQL
- **Zod** - Schema validation
- **Functional Components** - No class-based approach

## 📁 Project Structure

```
app/
├── src/
│   ├── config/          # Configuration files
│   │   └── env.config.ts
│   ├── controllers/     # Route controllers
│   │   └── authController.ts
│   ├── db/             # Database setup
│   │   ├── connection.ts
│   │   ├── index.ts
│   │   └── schema/
│   │       ├── index.ts
│   │       └── users.schema.ts
│   ├── middlewares/    # Middleware functions
│   │   └── errorHandler.middleware.ts
│   ├── models/         # Database models
│   │   └── user.model.ts
│   ├── routes/         # Route definitions
│   │   └── auth.routes.ts
│   ├── types/          # TypeScript types
│   │   └── response.types.ts
│   ├── utils/          # Utility functions
│   │   ├── errors.util.ts
│   │   └── response.util.ts
│   └── index.ts        # Application entry point
├── drizzle.config.ts   # Drizzle configuration
├── package.json
└── tsconfig.json
```

## 🔧 Step-by-Step Setup Instructions

### 1. Create Environment File

Create a `.env` file in the `app` directory:

```bash
cd app
touch .env
```

Add the following content to `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important:** Replace `username`, `password`, and `database_name` with your actual PostgreSQL credentials.

### 2. Install Dependencies (if needed)

```bash
bun install
```

### 3. Setup PostgreSQL Database

Make sure you have PostgreSQL installed and running. Create a database:

```sql
CREATE DATABASE your_database_name;
```

### 4. Generate and Run Migrations

```bash
# Generate migration files from schema
bun run db:generate

# Push schema to database (for development)
bun run db:push

# Or run migrations (for production)
bun run db:migrate
```

### 5. Start Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`

## 📊 Available Scripts

```bash
bun run dev          # Start development server with hot reload
bun run start        # Start production server
bun run db:generate  # Generate migration files from schema
bun run db:migrate   # Run pending migrations
bun run db:push      # Push schema directly to database (dev only)
bun run db:studio    # Open Drizzle Studio (database GUI)
```

## 🎯 API Endpoints

All endpoints return standardized JSON responses.

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Available Routes

#### Health Check
```
GET /health
```

#### Users (Mock Data - Replace with DB Operations)
```
GET    /api/auth         # Get all users
GET    /api/auth/:id     # Get user by ID
POST   /api/auth         # Create new user
PUT    /api/auth/:id     # Update user
DELETE /api/auth/:id     # Delete user
```

## 🧰 Key Features

### ✅ Global Error Handler
- Automatically catches all errors
- Returns standardized error responses
- Includes stack traces in development mode
- Handles validation, not found, and custom errors

### ✅ Custom Error Classes
Available error classes:
- `ValidationError` - 400 Bad Request
- `NotFoundError` - 404 Not Found
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `ConflictError` - 409 Conflict
- `BadRequestError` - 400 Bad Request
- `DatabaseError` - 500 Internal Server Error
- `InternalServerError` - 500 Internal Server Error

Usage example:
```typescript
import { NotFoundError } from '../utils/errors.util';

if (!user) {
  throw new NotFoundError('User not found');
}
```

### ✅ Response Utilities
```typescript
import { successResponse, messageResponse, paginatedResponse } from '../utils/response.util';

// Simple success response
return successResponse(data, 'Success message');

// Message only response
return messageResponse('Operation completed');

// Paginated response
return paginatedResponse(items, page, limit, total);
```

### ✅ Drizzle ORM Setup
- Type-safe database queries
- Schema definitions in `src/db/schema/`
- Connection pool configured
- Migration support

## 🔐 Database Model Pattern (Functional)

See `src/models/user.model.ts` for a complete example of functional database operations:

```typescript
// Example: Get user by ID
const user = await getUserById('user-id');

// Example: Create user
const newUser = await createUser({
  name: 'John Doe',
  email: 'john@example.com'
});
```

## 📝 Adding New Features

### 1. Add New Schema
Create a new file in `src/db/schema/`:

```typescript
// src/db/schema/posts.schema.ts
import { pgTable, varchar, uuid, timestamp } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: varchar('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

Export it in `src/db/schema/index.ts`:
```typescript
export * from './posts.schema';
```

### 2. Create Model
Create `src/models/post.model.ts` with database operations (functional approach).

### 3. Create Controller
Create `src/controllers/postController.ts` with route handlers.

### 4. Create Routes
Create `src/routes/post.routes.ts` and import it in `src/index.ts`.

### 5. Generate & Run Migrations
```bash
bun run db:generate
bun run db:push
```

## 🎨 Best Practices

1. **Use functional components only** - No classes
2. **Always use error classes** - Don't throw raw strings
3. **Use response utilities** - Maintain consistent response structure
4. **Validate input** - Use Zod schemas in routes
5. **Type everything** - Leverage TypeScript
6. **Separate concerns** - Keep models, controllers, and routes separate

## 🐛 Troubleshooting

### Database Connection Fails
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists
- Check credentials

### Migration Errors
```bash
# Reset and regenerate migrations
rm -rf drizzle/migrations
bun run db:generate
bun run db:push
```

### Port Already in Use
Change PORT in .env file or kill the process:
```bash
# Find process on port 3000
lsof -ti:3000

# Kill it
kill -9 <PID>
```

## 📚 Next Steps

1. ✅ Setup complete
2. Replace mock data in controllers with actual database operations
3. Add authentication/authorization
4. Add more routes and features
5. Add tests
6. Add logging
7. Deploy to production

## 🔗 Documentation Links

- [Bun Documentation](https://bun.sh/docs)
- [Elysia Documentation](https://elysiajs.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Zod Documentation](https://zod.dev)

---

**Happy Coding! 🚀**

