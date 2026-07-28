# MeetMind

MeetMind is an AI-powered meeting assistant that automatically records, transcribes, summarizes, and organizes meetings into actionable insights.

Instead of manually taking notes or remembering every discussion, MeetMind converts conversations into structured summaries, key decisions, and action items so teams can focus on the meeting instead of note-taking.

---

# Features

### Meeting Recording

* Record meetings directly from the application.
* Upload existing meeting audio files.

### AI Transcription

* Converts speech into accurate text.
* Supports long meeting recordings.

### AI Meeting Summary

* Generates concise summaries of the entire meeting.
* Highlights the most important discussion points.

### Action Items

* Extracts tasks discussed during the meeting.
* Identifies responsible team members whenever possible.

### Key Decisions

* Detects important decisions made during the meeting.
* Keeps all major outcomes organized in one place.

### Search Past Meetings

* Access previous meeting notes and summaries.
* Quickly find important discussions without replaying recordings.

### User Authentication

* Secure user registration and login.
* Maintains a personal meeting history for every user.

---

# Why MeetMind?

Meetings often generate valuable ideas, decisions, and tasks, but keeping track of everything manually is time-consuming and inefficient.

MeetMind automates the documentation process by converting meeting conversations into structured notes, helping users:

* Focus on discussions instead of taking notes.
* Never miss important decisions.
* Save time on documentation.
* Keep meeting information organized and easily accessible.

---

# How It Works

```
Record or Upload Meeting
           │
           ▼
Speech-to-Text Processing
           │
           ▼
AI Analysis
           │
   ┌───────┼────────┐
   │       │        │
   ▼       ▼        ▼
Summary  Tasks  Decisions
           │
           ▼
Store in Database
           │
           ▼
View Anytime
```

---

# Tech Stack

## Frontend

* React
* Vite
* JavaScript
* CSS

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL

## AI Services

* OpenAI API
* Speech-to-Text
* Natural Language Processing (NLP)

## Deployment

* Vercel

---

# Project Structure

```
MeetMind/
│
├── client/          # React frontend
├── server/          # Backend APIs
├── database/        # Database configuration
├── public/
└── README.md
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/anshitasingh2006/meetmind.git
cd meetmind
```

---

## 2. Install Dependencies

Install frontend dependencies:

```bash
npm install
```

If the backend is in a separate folder:

```bash
cd server
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file and add the required environment variables.

Example:

```env
DATABASE_URL=your_postgresql_database_url
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_secret_key
```

Add any additional API keys required by the project.

---

## 4. Run the Application

Start the frontend:

```bash
npm run dev
```

Start the backend:

```bash
npm start
```

---

# Production Deployment

The project is deployed using Vercel.

Before deployment, configure the following environment variables in your Vercel project settings:

| Variable       | Description                        |
| -------------- | ---------------------------------- |
| DATABASE_URL   | PostgreSQL connection string       |
| OPENAI_API_KEY | OpenAI API key                     |
| JWT_SECRET     | Secret key used for authentication |

Redeploy the application after updating the environment variables.

---

# Future Improvements

* Google Calendar and Outlook integration
* Real-time meeting transcription
* Speaker identification
* Team collaboration features
* Email meeting summaries
* Multi-language support
* AI-generated follow-up emails
* Meeting analytics dashboard

---

# Screenshots

Add screenshots of the following pages:

* Home Page
* Meeting Dashboard
* Meeting Summary
* Action Items
* Login Page

---

# Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

# License

This project is intended for educational and personal use.

---

# Author

**Anshita Singh**

GitHub: https://github.com/anshitasingh2006
