# Student Tribe API - Setup Guide

🌐 **Live API:** [https://st-api.sureshalabani.site](https://st-api.sureshalabani.site)  
📚 **API Documentation:** [https://st-api.sureshalabani.site/swagger](https://st-api.sureshalabani.site/swagger)

---

## Prerequisites

Install Bun runtime:

**Windows:**

```bash
powershell -c "irm bun.sh/install.ps1|iex"
```

**Mac/Linux:**

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify:

```bash
bun --version
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd app
bun install
```

### 2. Environment Setup

Copy the example file and configure:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials (see below for Neon DB setup).

### 3. Database Setup (Neon PostgreSQL)

**Get your database:**

1. Go to [neon.tech](https://neon.tech/) and sign up (free)
2. Create a new project
3. Copy the connection string from dashboard
4. Paste it in `.env` as `DATABASE_URL`

**Apply schema:**

```bash
bun run db:push
```

**Optional - View database:**

```bash
bun run db:studio
```

### 4. Run Server

```bash
bun run dev
```

Server starts at `http://localhost:3000`

---

## API Documentation

Swagger UI: `http://localhost:3000/swagger`

---

## Available Commands

```bash
bun run dev          # Start development server with hot reload
bun run start        # Production server
bun run db:push      # Apply schema changes to database
bun run db:generate  # Generate migration files
bun run db:studio    # Open Drizzle Studio (DB GUI)
bun run db:seed      # Seed test data
```

---

## API Overview

### Authentication Flow

1. **Send OTP**: `POST /api/otp/send` - Send OTP to phone number
2. **Verify OTP**: `POST /api/otp/verify` - Returns JWT token

### Onboarding Flow (Requires JWT)

1. **Basic Info**: `POST /api/onboarding/basic-info`

   - Fields: displayName, username, email, profileImage (optional)

2. **Domain & Skills**: `POST /api/onboarding/profile`

   - Select domain and skills

3. **Education**: `POST /api/onboarding/education`

   - Add education details

4. **Experience**: `POST /api/onboarding/experience`

   - Add work experience

5. **Profile Links**: `POST /api/onboarding/profile-links`

   - Links: LinkedIn, GitHub, Behance, Portfolio, Personal Website, Twitter (all optional)

6. **Complete**: `POST /api/onboarding/complete`
   - Mark onboarding as complete

### Get Options

- **Domains**: `GET /api/options/domains`
- **Skills**: `GET /api/options/skills`
- **Education Options**: `GET /api/options/education-options` - Get degree and field dropdown options

### Profile

- **My Profile**: `GET /api/profile/me` - Get complete profile (requires auth token)
- **Profile by Username**: `GET /api/profile/:username` - Get any user's profile (public)

---

## Project Structure

```
app/
├── src/
│   ├── config/          # Environment configuration
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── db/
│   │   └── schema/      # Database table definitions
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Authentication, error handling
│   └── utils/           # Helper functions
├── drizzle/
│   └── migrations/      # Database migrations
├── .env                 # Environment variables
└── package.json
```

---

## Testing

**Health Check:**

```bash
curl http://localhost:3000/health
```

**Example Response:**

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "uptime": 123.45,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production"
  }
}
```

---

## Troubleshooting

### Database Issues

- Verify DATABASE_URL in `.env`
- Check internet connection (if using cloud database)

### Dependency Issues

```bash
rm -rf node_modules
bun install
```

---

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL (Neon - Serverless)
- **ORM**: Drizzle
- **Validation**: Elysia's built-in type system
- **Authentication**: JWT + Phone OTP (Twilio)
- **Deployment**: Render

---

For detailed API documentation with request/response examples, check Swagger at `http://localhost:3000/swagger`
