# OIT STACK Preparation Platform

This document outlines the complete feature set, architecture, and capabilities of the OIT STACK Preparation platform.

## 🚀 Overview
The OIT STACK Preparation platform is a comprehensive learning and assessment system designed to help students prepare for technical and aptitude interviews. It features a robust role-based architecture serving both Administrators (faculty/content creators) and Students.

## 🛠️ Technology Stack
- **Frontend**: React.js, Vite, Tailwind CSS, Zustand (State Management), Lucide React (Icons).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB.
- **Authentication**: JWT (JSON Web Tokens) with strict session management.
- **Hosting/Deployment**: Vercel (Frontend), Render/Railway (Backend).

---

## 👨‍🎓 Student Panel Features

### 1. Authentication & Security
- Secure Login & Registration.
- **Strict Session Management**: Only one active session is allowed per user. Logging in on a new device automatically logs you out from previous devices.
- **Idle Timeout**: Automatic logout after a period of inactivity to ensure security.

### 2. Student Dashboard
- Visual overview of overall performance, tests taken, and average scores.
- Quick links to resume learning or take new tests.
- Recent activity feed.

### 3. Subject Hubs
- **Aptitude Hub**: Access to Quantitative (Math), Verbal, and Non-Verbal reasoning tests.
- **Technical Hub**: Access to Technical MCQs, Interview preparation, and Coding challenges.
- Modern, tabbed interface to switch seamlessly between different subject areas.

### 4. Advanced Test / Quiz Interface
The test-taking environment is designed to simulate real-world competitive exams (like TCS NQT, Infosys, etc.).
- **Right Sidebar (Question Palette)**: 
  - Displays a grid of all question numbers.
  - Color-coded indicators to show question status: 
    - 🟩 Answered
    - 🟥 Not Answered
    - 🟪 Marked for Review
    - ⬜ Not Visited
- **Bottom Navigation Controls**:
  - `Previous` / `Next`: Navigate between questions.
  - `Mark for Review`: Flag a question to revisit later.
  - `Clear Response`: Remove the selected answer.
  - `End Test / Submit`: Submit the exam for grading.
- **Top Bar**: Live countdown timer that automatically submits the exam when time expires.
- **Responsive Layout**: Full-screen, distraction-free environment that works smoothly across devices.

### 5. Results & Analytics
- Detailed post-test analysis showing score, time taken, and accuracy.
- Question-by-question breakdown showing the correct answer versus the user's selected answer.

---

## 👨‍💼 Admin Panel Features

### 1. Admin Dashboard
- High-level metrics: Total students, total active tests, total questions in the bank.
- Quick navigation shortcuts.

### 2. Centralized Subject Hubs
- **Unified Aptitude Hub**: A single, clean interface to manage all Aptitude (Math, Verbal, Non-Verbal) tests and questions without unnecessary dropdowns.
- **Technical Hub**: Manage technical assessments.
- **Tabbed Management**: Instantly toggle between viewing "Tests" and "Question Pool" for any selected subject.

### 3. Advanced Test Creation Engine
Admins have granular control over how tests are built and delivered.
- **Basic Configuration**: Test name, duration, passing score, difficulty level.
- **Advanced Controls**:
  - Enable/Disable Negative Marking (with custom penalty values).
  - Toggle randomizing question order and scrambling answer options.
  - Set active/inactive status and optional Start/End dates for availability.
- **Multi-Section Tests**: A single test can contain multiple sections (e.g., Section 1: Math, Section 2: Verbal).
- **Dual Question Selection Modes**:
  1. **Automatic (Random)**: Admin enters a target number (e.g., 10), and the system randomly selects 10 questions from that category's pool.
  2. **Manual Selection**: Admin clicks "Select Questions" to open a modal containing the entire question bank for that category, allowing them to hand-pick specific questions using checkboxes.

### 4. Question Bank Management
- Rich text support for adding complex questions (code snippets, formatting).
- Categorize questions by subject and difficulty.
- Easy tools to view, edit, or delete existing questions.

### 5. Student Management
- View all registered students.
- Monitor student activity and performance.

---

## 🎨 UI/UX Design Aesthetics
- **Premium Interface**: Uses glassmorphism, soft gradients (indigo/violet), and modern typography (Inter).
- **Dark/Light Mode Ready**: The UI relies on `slate` and `indigo` color scales with carefully crafted hover and transition micro-animations.
- **Feedback & Loaders**: Toast notifications for all actions (success/error) and skeleton loaders during data fetches ensure a smooth user experience.
