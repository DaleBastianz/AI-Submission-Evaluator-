# AI Submission Evaluator

## Overview

AI Submission Evaluator is a Next.js application built to accept assignment submissions, evaluate them using Google Gemini AI, and display structured AI feedback.

![Home Page](assets/screenshot-home.png)

It supports:
- text-based submissions
- file uploads for PDF/DOCX and plain text/code files
- URL link submissions with content extraction
- results search per student email
- admin review, filtering, and score override

The UI uses Tailwind CSS with a dark glassmorphism theme and the backend runs on Next.js App Router with Prisma for PostgreSQL.

## Screenshots

### Home Page
![Home Page](assets/screenshot-home.png)

### Assignment Submission Form
![Assignment Submission Form](assets/screenshot-submit.png)

### Evaluation Results
![Evaluation Results](assets/screenshot-results.png)

---

## Project Structure

- `app/page.tsx` — homepage with navigation links
- `app/submit-assignment/page.tsx` — assignment submission panel
- `app/my-results/page.tsx` — student results dashboard
- `app/admin/page.tsx` — admin panel for review and overrides
- `app/api/submit-assignment/route.ts` — submission backend endpoint
- `app/api/results/route.ts` — search submissions by email
- `app/api/admin/submissions/route.ts` — filtered admin listing
- `app/api/admin/override/route.ts` — admin grade override
- `lib/evaluator.ts` — Gemini evaluation engine
- `lib/prisma.ts` — Prisma client wrapper
- `prisma/schema.prisma` — DB schema definition

---

## Key Panels and Flow

### 1. Home Page

The home page introduces the system and links to:
- Submit Assignment
- My Results
- Admin Dashboard

This is the landing experience and entry point for all users.

### 2. Submit Assignment Panel

This panel is the core user-facing submission screen.

#### Supported modes:
- **Text** — paste assignment text or code directly.
- **File** — upload PDF, DOCX, TXT, MD, HTML, code files, and other text-based formats.
- **Link** — submit a GitHub or web URL to evaluate content extracted from that page.

#### How it works:
1. The user enters name, email, title, and selects a submission type.
2. Based on the type, the page shows the corresponding input control.
3. On submit, the form posts to `/api/submit-assignment` with `FormData`.
4. The backend extracts submission content:
   - text mode uses `contentText`
   - link mode fetches the web page or GitHub README content
   - file mode saves the file and extracts text from PDF, DOCX, or plain text/code files
5. The backend sends the extracted content to the AI evaluator.
6. The system stores the result in the `Submission` table and returns structured AI feedback.

### 3. Results Dashboard

The My Results page allows users to search by email.

#### Flow:
1. Enter the student email.
2. The UI requests `/api/results?email=...`.
3. The backend returns all submissions matching that email.
4. The page displays each submission with:
   - assignment title
   - submission type
   - score and grade
   - expandable feedback details
   - criteria breakdown

This panel is for students or reviewers to inspect the AI evaluation history.

### 4. Admin Panel

Admin access is protected by `ADMIN_PASSWORD`.

#### Features:
- login via password
- filter submissions by type, score range, and date range
- review submission details
- override AI grade and score

#### How it operates:
1. The admin enters the password and unlocks the dashboard.
2. Filters are applied and `/api/admin/submissions` is requested with query parameters.
3. The backend validates the password and returns matching submissions.
4. The admin can expand a submission to see AI feedback and override values.
5. Override changes are submitted to `/api/admin/override`.
6. The endpoint updates the Prisma `Submission` record.

---

## Backend API Endpoints

### `POST /api/submit-assignment`

Accepts `FormData` with:
- `name`
- `email`
- `title`
- `type` (`text` | `file` | `link`)
- `contentText` (for text submissions)
- `assignmentFile` (for file uploads)
- `link` (for URL submissions)

The route:
- validates required fields
- extracts text from the submission
- calls `evaluateSubmission`
- saves the result to Prisma
- returns `score`, `grade`, `feedback`, and `submissionId`

### `GET /api/results?email=...`

Returns all submissions for a given email address.

### `GET /api/admin/submissions?password=...&type=...&minScore=...&maxScore=...&startDate=...&endDate=...`

Returns admin-filtered submissions. Password auth is required.

### `PUT /api/admin/override`

Accepts JSON body with:
- `password`
- `submissionId`
- `grade`
- `score`

Updates admin overrides on the selected submission.

---

## AI Evaluation Engine

The evaluation logic is implemented in `lib/evaluator.ts`.

### AI flow:
1. The backend builds a system prompt with the submission content.
2. It uses Google Generative Language via the Gemini endpoint.
3. The request is sent using the `generateContent` REST API.
4. It tries a fallback list of supported models:
   - `gemini-2.5-pro`
   - `gemini-2.5-flash-lite`
   - `gemini-2.0-flash`
5. The response is parsed for candidate text.
6. The system extracts the JSON object and validates it with `zod`.

### Expected feedback schema:
- `score`: 0-100
- `grade`: A, B, C, D, F
- `criteria`: numeric ratings for understanding, code quality, creativity, completeness, documentation, real_world
- `strengths`: array of strings
- `weaknesses`: array of strings
- `improvements`: array of strings
- `plagiarism_flag`: boolean
- `ai_generated_flag`: boolean
- `final_feedback`: string

---

## Database Schema

`prisma/schema.prisma` defines the `Submission` model:

- `id`
- `name`
- `email`
- `title`
- `type`
- `contentText`
- `fileUrl`
- `link`
- `aiScore`
- `aiGrade`
- `aiFeedback` (JSON)
- `createdAt`
- `updatedAt`

---

## Environment Variables

Create `.env.local` with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
GEMINI_API_KEY="YOUR_GOOGLE_API_KEY"
YOUTUBE_API_KEY="YOUR_YOUTUBE_API_KEY"
ADMIN_PASSWORD="your-admin-password"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Important:
- `DATABASE_URL` must point to your PostgreSQL database.
- `GEMINI_API_KEY` is used to call Google Gemini.
- `ADMIN_PASSWORD` secures the admin dashboard.

---

## Setup and Run

```bash
npm install
```

If you need to sync the database schema:

```bash
npx prisma db push
```

Then start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## User Flow Summary

### Student / user flow
1. Open the homepage.
2. Go to `Submit Assignment`.
3. Choose a submission type.
4. Enter name, email, title, and submit.
5. Receive instant AI score and feedback.
6. Optionally go to `My Results` and search by email.

### Admin flow
1. Open `Admin`.
2. Enter the admin password.
3. Filter submissions by type, score, and date.
4. Read AI feedback and review criteria.
5. Override score or grade if needed.

---

## Notes

- The system saves feedback as JSON and reuses it across dashboards.
- File uploads are stored under `public/uploads` and accessible by URL if `NEXT_PUBLIC_APP_URL` is set.
- The admin dashboard uses query string password auth and should be secured further for production.

If you want, I can also add a quick `README` section for deployment or describe how to extend the system with plagiarism detection or email notifications.