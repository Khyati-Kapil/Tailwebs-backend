# Assignment Workflow Portal - Backend

Node.js + Express backend for a role-based assignment workflow portal.

## Features
- JWT authentication with role-based access control (teacher, student)
- Assignment lifecycle: `Draft -> Published -> Completed`
- Student submissions (one per assignment)
- Due-date enforcement on submissions
- Teacher view of submissions + review marking
- Pagination on assignment list

## Tech
- Node.js, Express
- MongoDB + Mongoose
- JWT auth
- Zod input validation

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` using the template:
   ```bash
   cp .env.example .env
   ```
3. Update `MONGODB_URI` and `JWT_SECRET` in `.env`.

## Seed Users
Create a teacher and student for local testing:
```bash
npm run seed
```

## Run
- Dev mode:
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```

## API Summary
Base URL: `/api`

### Auth
- `POST /auth/login`
  - Body: `{ "email": "...", "password": "..." }`
  - Response: `{ token, role, user }`

### Assignments (Teacher)
- `GET /assignments?status=Draft|Published|Completed&page=1&limit=10`
- `POST /assignments`
  - Body: `{ "title": "...", "description": "...", "dueDate": "2026-03-20T12:00:00.000Z" }`
- `PATCH /assignments/:id` (Draft only)
- `DELETE /assignments/:id` (Draft only)
- `POST /assignments/:id/status` (Draft -> Published -> Completed)
  - Body: `{ "status": "Published" }` or `{ "status": "Completed" }`
- `GET /assignments/:id/submissions`

### Assignments (Student)
- `GET /assignments` (only Published)
- `GET /assignments/:id` (only Published)

### Submissions (Student)
- `POST /submissions`
  - Body: `{ "assignmentId": "...", "answerText": "..." }`
- `GET /submissions/mine?assignmentId=...`

### Submissions (Teacher)
- `PATCH /submissions/:id/review`

## Notes
- All protected routes require `Authorization: Bearer <token>`.
- Students can submit only once per assignment.
- Submissions are blocked after `dueDate`.
