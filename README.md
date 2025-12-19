# 🎓 Student Tribe API

A comprehensive backend API for student community platform built with **Elysia.js** and **Bun** runtime.

## ✨ Features

- 🔐 **OTP Authentication** with Twilio SMS integration
- 👥 **User Management** with role-based access (Admin/Student)
- 📝 **Multi-step Onboarding** (Profile, Education, Experience, Skills)
- 🏢 **Organizations Management**
- 💼 **Job Opportunities** (Full-time, Part-time, Internship, Gig)
- 📄 **Application System** with status tracking
- 📚 **Quiz System** with auto-grading and pagination
- ☁️ **AWS S3 Integration** for file uploads (Resume, Logos)
- 📖 **Auto-generated Swagger Documentation**
- 🐳 **Docker Support** with multi-stage builds
- 🛡️ **Security Features** (Input sanitization, JWT, Auth middleware)

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.1.34 or higher
- PostgreSQL 16+
- (Optional) Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd app

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Edit .env with your actual values
# Update DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
bun run db:push

# Seed database (optional)
bun run db:seed

# Start development server
bun run dev
```

Server will start at: **http://localhost:3000**

---

## 🐳 Docker Quick Start

```bash
# Production mode
docker-compose up -d

# Development mode (with Drizzle Studio)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app
```

See [DOCKER.md](./DOCKER.md) for detailed Docker documentation.

---

## 📚 API Documentation

### Swagger UI

**URL:** http://localhost:3000/swagger

### Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication

Most endpoints require JWT token:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📂 Project Structure

```
app/
├── src/
│   ├── config/          # Environment configuration
│   ├── controllers/     # Request handlers
│   ├── db/
│   │   ├── schema/      # Drizzle ORM schemas
│   │   └── index.ts     # Database connection
│   ├── middlewares/     # Auth, Admin, Error handling
│   ├── routes/          # API routes with validation
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Helper functions
│   └── index.ts         # Application entry point
├── drizzle/             # Database migrations
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
└── package.json
```

---

## 🛠️ Available Scripts

```bash
# Development
bun run dev              # Start dev server with hot reload

# Production
bun run start            # Start production server

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema to database
bun run db:studio        # Open Drizzle Studio (GUI)
bun run db:seed          # Seed database with test data

# Docker
docker-compose up -d     # Start production containers
docker-compose down      # Stop containers
docker-compose logs -f   # View logs
```

---

## 🔐 API Endpoints Overview

### Authentication

- `POST /api/otp/send` - Send OTP to phone number
- `POST /api/otp/verify` - Verify OTP and login
- `POST /api/otp/resend` - Resend OTP

### Onboarding

- `POST /api/onboarding/basic-info` - Update name, email, password
- `POST /api/onboarding/profile` - Select domain and skills
- `POST /api/onboarding/education` - Add education details
- `POST /api/onboarding/experience` - Add work experience
- `POST /api/onboarding/complete` - Complete onboarding
- `GET /api/onboarding/status` - Get onboarding progress

### Organizations (Admin)

- `POST /api/admin/organizations` - Create organization
- `GET /api/admin/organizations` - List all organizations
- `GET /api/admin/organizations/:id` - Get organization details
- `PUT /api/admin/organizations/:id` - Update organization
- `DELETE /api/admin/organizations/:id` - Delete organization

### Opportunities (Admin)

- `POST /api/admin/opportunities` - Create opportunity
- `GET /api/admin/opportunities` - List all opportunities
- `GET /api/admin/opportunities/:id` - Get opportunity details
- `PUT /api/admin/opportunities/:id` - Update opportunity
- `DELETE /api/admin/opportunities/:id` - Delete opportunity

### Opportunities (Student)

- `GET /api/opportunities` - Browse available opportunities
- `GET /api/opportunities/:id` - View opportunity details
- `POST /api/opportunities/:id/apply` - Apply to opportunity
- `GET /api/my-applications` - View my applications

### Applications (Admin)

- `GET /api/admin/applications` - View all applications
- `GET /api/admin/applications/:id` - View application details
- `PATCH /api/admin/applications/:id/status` - Update status

### Quizzes (Admin)

- `POST /api/admin/quizzes` - Create quiz
- `GET /api/admin/quizzes` - List all quizzes
- `POST /api/admin/quizzes/:id/questions` - Add question
- `GET /api/admin/quizzes/:id/attempts` - View attempts

### Quizzes (Student)

- `GET /api/quizzes` - List active quizzes
- `GET /api/quizzes/:id/questions` - Get questions (paginated)
- `POST /api/quizzes/:id/submit` - Submit quiz answers
- `GET /api/quizzes/my-attempts` - View my attempts

### File Upload

- `POST /api/s3/presigned-url` - Get S3 upload URL

### Options

- `GET /api/options/domains` - Get available domains
- `GET /api/options/skills` - Get available skills

---

## 🏗️ Tech Stack

- **Runtime:** [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Framework:** [Elysia.js](https://elysiajs.com/) - Blazing fast web framework
- **Database:** PostgreSQL 16
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Validation:** TypeBox (Elysia native)
- **Authentication:** JWT + OTP (Twilio)
- **File Storage:** AWS S3
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker & Docker Compose

---

## 🛡️ Security Features

✅ JWT-based authentication  
✅ Role-based access control (Admin/Student)  
✅ Input sanitization (XSS prevention)  
✅ S3 URL validation  
✅ Rate limiting on OTP requests  
✅ Password hashing (bcrypt)  
✅ Database query parameterization  
✅ CORS enabled  
✅ Global error handling

---

## 📊 Database Schema

### Core Tables

- `users` - User accounts
- `domains` - Available study domains
- `skills` - Available skills
- `user_skills` - User-skill mapping

### Onboarding

- `user_education` - Education records
- `user_experience` - Work experience
- `otp_verifications` - OTP tracking

### Organizations & Opportunities

- `organizations` - Companies/institutions
- `opportunities` - Job postings
- `opportunity_applications` - Applications

### Quizzes

- `quizzes` - Quiz metadata
- `quiz_questions` - Questions (with options as JSONB)
- `quiz_attempts` - Student submissions

---

## 🧪 Testing

### Manual Testing

Use Swagger UI at `/swagger` for interactive API testing.

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "timestamp": "2025-12-19T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

---

## 🚀 Deployment

### Deploy with Docker

```bash
# Build production image
docker build -t student-tribe:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  student-tribe:latest
```

### Deploy to Railway

```bash
railway login
railway init
railway up
```

### Deploy to Render

1. Connect GitHub repository
2. Select "Docker" environment
3. Set environment variables
4. Deploy

See [DOCKER.md](./DOCKER.md) for detailed deployment guide.

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ using Bun and Elysia.js

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 📞 Support

For support, email your-email@example.com or open an issue.

---

**Happy Coding! 🚀**
