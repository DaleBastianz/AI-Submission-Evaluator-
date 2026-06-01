# AI Submission Evaluator

[![GitHub](https://img.shields.io/github/license/DaleBastianz/AI-Submission-Evaluator-)](https://github.com/DaleBastianz/AI-Submission-Evaluator-/blob/main/LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwind-css)](https://tailwindcss.com/)

## 🎓 Overview

AI Submission Evaluator is a comprehensive educational platform powered by Google Gemini AI. It provides students with instant, detailed feedback on assignments while giving educators powerful tools to manage submissions, generate study materials, and track learning progress.


## ✨ Key Features

### 📝 Assignment Evaluation
- **Multiple Submission Types**: Text, file uploads (PDF/DOCX), or URL links
- **AI-Powered Grading**: Instant evaluation with detailed feedback
- **Plagiarism Detection**: AI flags potential academic integrity issues
- **Criteria-Based Scoring**: Breakdown across multiple evaluation dimensions

### 🤖 AI Study Assistant
- **AI Professor**: Chat with an AI tutor for subject-specific help
- **Exam Tutor**: Generate practice questions and study guides
- **Past Papers Solver**: Get step-by-step solutions to past exam questions

### 📚 Content Management
- **Content Hub**: Upload and organize lecture materials
- **References Generator**: Automatically create citations in APA, MLA, Harvard formats
- **Mind Map Visualizer**: Create knowledge maps from study content

### 👥 User Management
- **Authentication**: Secure login/register with NextAuth.js
- **Student Dashboard**: Track submission history and progress
- **Admin Panel**: Review, filter, and override AI grades

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DaleBastianz/AI-Submission-Evaluator-.git
cd AI-Submission-Evaluator-
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env.local`):
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
GEMINI_API_KEY="your-google-api-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_PASSWORD="your-secure-admin-password"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🎬 Demo Video

A demo video can help reviewers quickly understand the app. To add a demo video to this repository:

- Place an MP4 file at `public/demo/demo.mp4` (H.264 for broad browser support).
- Start the dev server (`npm run dev`).
- Open `http://localhost:3000/demo/` to view the demo player.

If you want the video included in the repository, add the file to `public/demo/demo.mp4` and commit it. Alternatively, host the video elsewhere (YouTube/Vimeo) and link to it from this README.

## 📁 Project Structure

```
AI-Submission-Evaluator-/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/                      # Authentication pages
│   ├── register/
│   ├── submit-assignment/          # Assignment submission
│   ├── my-results/                 # Student results dashboard
│   ├── admin/                      # Admin panel
│   ├── dashboard/                  # User dashboard
│   ├── ai-professor/               # AI chatbot
│   ├── exam-tutor/                 # Exam preparation
│   ├── past-papers/                # Past papers solver
│   ├── content-hub/                # Lecture materials
│   ├── references/                 # Citation generator
│   └── api/                        # API routes
│       ├── auth/                   # Authentication endpoints
│       ├── submit-assignment/      # Submission handler
│       ├── results/                # Results retrieval
│       ├── ai-professor/           # AI chat endpoint
│       ├── exam-tutor/             # Exam generation
│       └── ...
├── components/                     # Reusable UI components
├── lib/                            # Utility functions
│   ├── evaluator.ts               # AI evaluation engine
│   ├── gemini.ts                  # Gemini API client
│   ├── auth.ts                    # Authentication logic
│   └── ...
├── prisma/
│   └── schema.prisma              # Database schema
└── public/                         # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: Google Gemini API
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with dark glassmorphism theme

## 📸 Screenshots


## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub (already done!)
2. Visit [Vercel](https://vercel.com) and import your repository
3. Configure environment variables in Vercel dashboard
4. Deploy — Vercel will automatically build and deploy your app

Every git push will trigger an automatic deployment.

### Environment Variables for Production

Make sure to set these in your Vercel project settings:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL
- `ADMIN_PASSWORD` - Secure admin password

## 🔒 Security Considerations

- All API routes are protected with authentication
- Admin functions require admin password verification
- Password hashing with bcrypt
- Environment variables for sensitive data
- CORS protection on API routes

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/submit-assignment` | POST | Submit assignment for evaluation |
| `/api/results` | GET | Get student's submission history |
| `/api/ai-professor/ask` | POST | Chat with AI professor |
| `/api/exam-tutor/generate` | POST | Generate practice questions |
| `/api/past-papers/solve` | POST | Solve past paper questions |
| `/api/references/generate` | POST | Generate citations |
| `/api/content-hub/upload` | POST | Upload lecture materials |
| `/api/dashboard` | GET | Get user dashboard data |

## 🤝 Contributing

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git commit -m "feat: add your feature"
   ```

3. Push and create a pull request to `develop`

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for AI capabilities
- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://www.prisma.io/) for the type-safe ORM

---

**Built with ❤️ for education**