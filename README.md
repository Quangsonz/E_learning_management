# E-Learning Management System (Enterprise Grade)

An advanced, production-ready E-Learning platform built with the MERN stack. Designed with a premium Glassmorphism aesthetic and a robust architecture, it delivers a high-end experience for Students, Instructors, and Administrators.

![Platform Overview](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop)

---

## 🚀 Key Features

### 🎓 For Students
- **Cinematic Learning Experience:** High-end video player with timestamp bookmarks and progress persistence.
- **Gamification Engine:** Earn XP, level up, and unlock achievements (Badges) by completing lessons, passing quizzes, and maintaining study streaks.
- **Realtime Community Q&A:** Ask questions tied directly to specific lessons and get answers from peers and instructors in real time.
- **Smart Quizzes:** Auto-grading assessments with random question pools.
- **Verifiable Certificates:** Download PDF certificates with embedded QR codes and validation hashes to prove course completion.
- **Focus Dashboard:** Track your daily learning heatmap, streak days, and total focus minutes.

### 👨‍🏫 For Instructors
- **Drag-and-Drop Curriculum Builder:** Easily build and reorder course modules and video lessons.
- **Revenue & Analytics Dashboard:** Monitor student retention, drop-off rates, course popularity, and total revenue.
- **Content Ownership:** Reply directly to student reviews and moderate Q&A discussions.

### 🛡️ For Administrators
- **Moderation Queue:** Full control over content quality. Instructors can only submit drafts; Admins must review and publish them to the marketplace.
- **Platform Analytics:** Global view of active users, total sales, and platform health.
- **Role-Based Access Control (RBAC):** Strict boundaries between Student, Instructor, and Admin privileges.

---

## 🛠️ Technology Stack

**Frontend**
- React 18 & TypeScript
- Vite (Next-generation frontend tooling)
- Tailwind CSS (Vanilla CSS + Utility classes for maximum flexibility)
- Zustand (Lightweight global state management)
- React Router DOM v6
- React Query (Data fetching, caching & synchronization)
- Socket.IO-Client (Realtime bi-directional events)
- Framer Motion (Micro-animations and layout transitions)
- dnd-kit (Accessible drag-and-drop toolkit)

**Backend**
- Node.js & Express.js
- MongoDB & Mongoose (NoSQL Database)
- Socket.IO (Real-time web socket server)
- JWT (JSON Web Tokens for secure authentication)
- Bcrypt.js (Password hashing)
- Multer & Cloudinary (File and Image Uploads)
- PDFKit & QRCode (Dynamic Certificate generation)

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd E-Learning-Managerment
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory based on the following template:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=30d
   ```
   Run the backend:
   ```bash
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
   Run the frontend:
   ```bash
   npm run dev
   ```

---

## 📂 Architecture Overview

```text
E-Learning-Managerment/
├── backend/                  # Express.js REST API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Mongoose schemas (User, Course, Progress, Result, etc.)
│   │   ├── routes/           # API Endpoints mapped to controllers
│   │   ├── services/         # Core business logic (XP, Auth, Enrollments)
│   │   ├── socket/           # Realtime event handlers
│   │   └── utils/            # Helper functions, AppError
│   └── server.js             # Entry point
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── components/       # Reusable UI components (Buttons, Layouts, Charts)
    │   ├── contexts/         # React Contexts (ThemeContext)
    │   ├── hooks/            # Custom hooks (useSocket)
    │   ├── pages/            # View-level components (Home, Learning, Profile)
    │   ├── services/         # API fetchers (axios wrappers)
    │   ├── store/            # Zustand global stores (authStore)
    │   └── index.css         # Global styles and design tokens
    └── package.json
```

---

## 🎨 Design Philosophy
The UI follows a **Premium Dark-Mode First Glassmorphism** aesthetic. We prioritize:
- **Rich Aesthetics**: Vibrant color palettes (Indigo, Cyan, Rose) against deep slate backgrounds.
- **Dynamic Interaction**: Hover effects, micro-animations, and smooth routing transitions.
- **Clarity**: Asymmetrical grids, clean typography (Inter/Roboto), and spacious padding to reduce cognitive load during learning.

---
_Crafted with passion for modern education._
