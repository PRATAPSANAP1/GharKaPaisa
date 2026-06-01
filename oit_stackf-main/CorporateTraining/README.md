# OIT_STACK Preparation Portal

A comprehensive full-stack web application to help students prepare for campus placements. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Features

### Student Module
- **Aptitude Tests** — Math, Verbal, Non-Verbal reasoning with timed MCQs
- **Technical Tests** — C, C++, Java, Python, DBMS, OS, CN, OOP
- **Coding Practice** — Online code editor with Judge0 compiler (C, C++, Java, Python, JS)
- **AI Interview Bot** — Practice HR and Technical interviews with AI feedback
- **Leaderboard** — Global ranking based on test scores and coding performance
- **Result Analytics** — Detailed performance charts and insights
- **Daily Streak** — Track your consistency with streak indicators
- **Profile Management** — Update personal information

### Admin Module
- **Dashboard** — Overview of platform statistics and activity
- **Question Management** — CRUD + bulk import for MCQ questions
- **Test Management** — Create and configure tests with timers, negative marking
- **Coding Problem Management** — Add problems with test cases and starter code
- **Category Management** — Organize content by categories and subcategories
- **Student Management** — View, edit, and manage student accounts
- **Result Analytics** — View all results with detailed analytics
- **Performance Reports** — Charts and graphs for student performance

### Platform Features
- 🔒 JWT Authentication with role-based access
- 🌙 Dark/Light theme toggle
- 📱 Fully responsive design
- ⏱️ Real-time test timer with auto-submit
- 💾 Auto-save answers during tests
- 📊 Interactive charts and graphs
- 🔍 Search, filter, and pagination
- 🎨 Modern UI with glassmorphism effects

---

## 🧠 Core Logics & Workflows

### 1. Authentication & Role-Based Access Control
- **Logic**: Users register/login through the frontend. The backend validates credentials using `bcryptjs` and signs a JSON Web Token (JWT).
- **Protection**: Express middleware verifies the JWT in incoming request headers. It protects sensitive routes from unauthorized access, ensuring only admins can access the admin panel and students can access tests.

### 2. Test Evaluation Logic
- **Workflow**: Students start a timed MCQ test. The frontend uses a realtime timer synced with the test's duration. 
- **Auto-submit**: If the timer hits zero, the test is automatically submitted.
- **Scoring**: Backend compares submitted answers with correct answers. It awards positive points for correct answers and deducts points based on the negative marking configuration for incorrect ones.

### 3. Coding Sandbox & Execution Logic
- **Workflow**: Students write code in the Monaco Editor. Upon submission, the frontend sends the code, language, and problem ID to the backend.
- **Execution**: The backend fetches all test cases (both visible and hidden) from the database and forwards them to the **Judge0 Compiler API** for execution.
- **Validation**: Outputs are compared against expected results. If all test cases pass within the predefined CPU time and memory limits, the submission is marked as `Accepted`.

### 4. AI Interview Logic
- **Workflow**: A student initiates an interview. The backend connects to **OpenAI's API** to act as the interviewer.
- **Evaluation**: As the user provides answers, the AI generates context-aware follow-up questions. At the end, a specialized prompt instructs the AI to evaluate the entire transcript and provide constructive feedback, strengths, weaknesses, and a final score.

---

## 🔗 External Connections & Integrations

- **MongoDB Atlas**: Serves as the primary database connection, storing structured schemas using Mongoose (Users, Questions, Tests, Code Submissions).
- **Judge0 Compiler API (RapidAPI)**: Connects to the backend via REST. It receives base64 encoded source code and test cases, executing them in isolated, secure sandboxes (Docker containers), returning standard output and execution time metrics.
- **OpenAI API**: Connected to the backend to power the AI Interviewer and feedback generation mechanisms.
- **Frontend-Backend Bridge**: The React frontend communicates with the Node.js backend using **Axios**. Interceptors automatically attach the JWT token to every request header.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS 3, Redux Toolkit, React Router 6 |
| **Backend** | Node.js, Express.js 4 |
| **Database** | MongoDB with Mongoose |
| **Auth** | JWT + bcryptjs |
| **Code Editor** | Monaco Editor |
| **Compiler** | Judge0 API |
| **AI** | OpenAI API (GPT-3.5/4) |
| **Charts** | Recharts |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
├── client/                  # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Page layout wrappers
│   │   ├── pages/           # Route-level pages
│   │   │   ├── auth/        # Login, Register, Forgot Password
│   │   │   ├── student/     # Student pages
│   │   │   └── admin/       # Admin pages
│   │   ├── redux/           # Redux store & slices
│   │   ├── routes/          # Route protection
│   │   ├── services/        # Axios API services
│   │   └── utils/           # Helpers & constants
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                  # Express Backend
│   ├── config/              # DB & env config
│   ├── controllers/         # Route handlers
│   ├── middleware/           # Auth, admin, error handling
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── seeds/               # Database seeders
│   ├── utils/               # Helpers
│   └── server.js            # Entry point
│
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd task2
```

### 2. Setup Backend
```bash
cd server

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your values:
#   MONGODB_URI=your_mongodb_uri
#   JWT_SECRET=your_secret_key
#   OPENAI_API_KEY=your_openai_key (optional)
#   JUDGE0_API_KEY=your_rapidapi_key (optional)

# Seed default admin account
npm run seed

# Start development server
npm run dev
```

### 3. Setup Frontend
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### Default Admin Credentials
- **Email**: admin@oitstack.com
- **Password**: Admin@123

⚠️ **Change the admin password after first login!**

---

## 🔑 Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | JWT expiry (default: 7d) | No |
| `OPENAI_API_KEY` | OpenAI API key for AI Interview | For AI |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 compiler | For Coding |
| `JUDGE0_API_URL` | Judge0 API endpoint | For Coding |
| `EMAIL_HOST` | SMTP host for emails | For Email |
| `EMAIL_PORT` | SMTP port | For Email |
| `EMAIL_USER` | SMTP username | For Email |
| `EMAIL_PASS` | SMTP password | For Email |
| `CLIENT_URL` | Frontend URL for CORS | Yes |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (default: http://localhost:5000/api) |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests` | List tests |
| POST | `/api/tests/:id/start` | Start a test |
| POST | `/api/tests/:id/submit` | Submit test answers |

### Coding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coding/problems` | List coding problems |
| POST | `/api/coding/run` | Run code |
| POST | `/api/coding/submit` | Submit code |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/start` | Start AI interview |
| POST | `/api/interview/answer` | Send answer |
| POST | `/api/interview/end` | End interview & get feedback |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/questions` | Manage questions |
| GET/POST | `/api/tests` | Manage tests |
| GET/POST | `/api/coding/problems` | Manage coding problems |
| GET | `/api/analytics/*` | View analytics |
| GET | `/api/users` | Manage users |

---

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set root directory to `client`
4. Set `VITE_API_URL` environment variable
5. Deploy

### Backend (Render/Railway)
1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set root directory to `server`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add all environment variables
7. Deploy

### Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get connection string
3. Update `MONGODB_URI` in server environment

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Built for

**OIT_STACK (Malnad College of Engineering), Hassan**  
Placement Preparation Portal for Campus Recruitment

---

*Made with ❤️ for students, by students*
