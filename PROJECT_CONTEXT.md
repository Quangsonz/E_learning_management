# PROJECT_CONTEXT.md — E-Learning Management System

> **Mục đích:** Tài liệu này là nguồn sự thật duy nhất (single source of truth) về kiến trúc, cấu trúc file, model dữ liệu, API routes, luồng xác thực và các quy ước của dự án. Mọi thay đổi code MỚI hoặc SỬA ĐỔI đều phải tham chiếu file này trước để đảm bảo đồng bộ.

---

## 1. TỔNG QUAN DỰ ÁN

| Thông tin | Giá trị |
|---|---|
| Tên dự án | E-Learning Management System |
| Loại ứng dụng | Full-stack Web App (SPA + REST API) |
| Ngôn ngữ | Backend: Node.js (CommonJS) · Frontend: TypeScript/React |
| Database | MongoDB Atlas (Mongoose ODM) |
| Cloud Storage | Cloudinary (ảnh, video) |
| Thanh toán | Stripe (Payment Intent + Webhook) |
| Realtime | Socket.IO |
| Tài liệu API | Swagger UI tại `/api-docs` |

---

## 2. CẤU TRÚC THƯ MỤC GỐC

```
E-Learning-Managerment/
├── backend/          ← Node.js Express API server
├── frontend/         ← React + Vite SPA
├── PROJECT_CONTEXT.md  ← File này (single source of truth)
├── DESIGN_SYSTEM.md
├── System_Design_Document.md
└── README.md
```

---

## 3. BACKEND

### 3.1 Stack & Dependencies

| Package | Phiên bản | Mục đích |
|---|---|---|
| express | ^5.2.1 | Web framework |
| mongoose | ^9.7.0 | MongoDB ODM |
| jsonwebtoken | ^9.0.3 | JWT auth |
| bcryptjs | ^3.0.3 | Hash password |
| cloudinary | ^2.10.0 | Upload ảnh/video |
| stripe | ^22.3.0 | Payment |
| socket.io | ^4.8.3 | Realtime notifications |
| multer | ^2.1.1 | File upload middleware |
| nodemailer | ^8.0.11 | Gửi email |
| pdfkit | ^0.19.1 | Tạo PDF certificate |
| qrcode | ^1.5.4 | Tạo QR code cho certificate |
| slugify | ^1.6.9 | Tạo slug cho course |
| helmet | ^8.2.0 | Security headers |
| express-rate-limit | ^8.5.2 | Rate limiting (100 req/hour/IP) |
| joi | ^18.2.1 | Validation |
| swagger-jsdoc + swagger-ui-express | ^6 / ^5 | API docs |

**Entry Point:** `server.js` → `src/app.js`

**Environment Variables (`.env`):**
```
PORT=5000
NODE_ENV=development
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<secret>
JWT_EXPIRES_IN=1d
CLOUDINARY_URL=<cloudinary url>
```

### 3.2 Khởi động server

```bash
cd backend
npm run dev      # Development (nodemon)
npm start        # Production
npm test         # Jest tests
```

### 3.3 Cấu trúc thư mục Backend

```
backend/
├── server.js              ← Entry: Kết nối DB, khởi tạo HTTP server + Socket.IO
└── src/
    ├── app.js             ← Express app, middleware, routes mounting
    ├── config/
    │   ├── database.js    ← Kết nối MongoDB
    │   ├── cloudinary.js  ← Cấu hình Cloudinary
    │   └── swagger.js     ← Swagger config (JSDoc spec)
    ├── models/            ← Mongoose Schemas (xem mục 4)
    ├── controllers/       ← Xử lý request, gọi service, trả response
    ├── services/          ← Business logic thuần (không dùng req/res)
    ├── routes/            ← Route definitions + Swagger JSDoc
    ├── middlewares/       ← Auth, error, role, permission, upload
    ├── repositories/      ← Data access layer
    ├── socket/
    │   └── index.js       ← Socket.IO init + sendNotificationToUser()
    └── utils/
        ├── appError.js    ← Custom error class
        └── catchAsync.js  ← Async error wrapper
```

### 3.4 Middleware Stack (theo thứ tự trong app.js)

1. `helmet()` — Security HTTP headers
2. `express-rate-limit` — 100 req/hour/IP cho `/api`
3. `morgan('dev')` — Request logging (chỉ development)
4. **`POST /api/payments/webhook`** — Stripe webhook (**PHẢI trước express.json**)
5. `express.json({ limit: '10kb' })` — Body parser JSON
6. `express.urlencoded()` — Body parser URL-encoded
7. `cors()` — CORS
8. `router.use('/api', routes)` — Routes
9. Swagger UI tại `/api-docs`
10. 404 handler
11. Global error handler (`error.middleware.js`)

---

## 4. DATABASE MODELS (MongoDB / Mongoose)

### 4.1 User

**Collection:** `users`

| Field | Type | Mô tả |
|---|---|---|
| name | String (required) | Tên người dùng |
| email | String (required, unique, lowercase) | Email |
| password | String (required, min 6, select: false) | Hashed bằng bcryptjs (cost 12) |
| role | Enum: `student` / `teacher` / `admin` | Default: `student` |
| avatar | String | Default: `default-avatar.png` |
| isVerified | Boolean | Default: false |
| verificationToken | String | Token xác minh email (hashed) |
| passwordResetToken | String | Token reset pass (hashed) |
| passwordResetExpires | Date | Hết hạn sau 10 phút |
| refreshToken | String | Refresh token |
| studyStreakDays | Number | Số ngày học liên tiếp |
| preferences | [ObjectId → Category] | Danh mục yêu thích (gợi ý khóa học) |
| totalFocusMinutes | Number | Tổng thời gian học (phút) |
| studyHistory | Array {date, focusMinutes, lessonsCompleted} | Lịch sử học theo ngày |
| xp | Number | Điểm kinh nghiệm (XP) |
| level | Number | Cấp độ |
| badges | Array {name, icon, description, awardedAt} | Huy hiệu |
| wishlist | [ObjectId → Course] | Khóa học yêu thích |

**Indexes:** `role`, `xp -1` (leaderboard)

**Instance Methods:**
- `correctPassword(candidate, hashed)` — So sánh password
- `createPasswordResetToken()` — Tạo token reset (raw), lưu hashed vào DB
- `createEmailVerificationToken()` — Tạo token verify email

### 4.2 Course

**Collection:** `courses`

| Field | Type | Mô tả |
|---|---|---|
| title | String (required) | Tiêu đề |
| slug | String (unique) | Auto-tạo từ title (slugify) |
| description | String (required) | Mô tả |
| price | Number (min 0, required) | Giá khóa học |
| instructor | ObjectId → User (required) | Giảng viên |
| category | ObjectId → Category (required) | Danh mục |
| status | Enum: `draft` / `published` | Default: `draft` |
| thumbnailUrl | String | Ảnh thumbnail |
| averageRating | Number (0–5) | Default: 0 |

**Indexes:** `{status, category}`, `instructor`, full-text `{title, description}`

**Auto-populate:** Pre-find populate `instructor` (name, email, role, avatar) và `category` (name, slug)

### 4.3 Lesson

**Collection:** `lessons`

| Field | Type | Mô tả |
|---|---|---|
| course | ObjectId → Course (required) | Khóa học chứa bài học |
| title | String (required) | Tiêu đề bài học |
| videoUrl | String (required) | URL video (Cloudinary) |
| duration | Number | Thời lượng (giây), default 0 |
| order | Number (required) | Thứ tự trong khóa học |

**Index:** `{course, order}`

### 4.4 Enrollment

**Collection:** `enrollments`

| Field | Type | Mô tả |
|---|---|---|
| student | ObjectId → User (required) | Học viên |
| course | ObjectId → Course (required) | Khóa học |
| paymentStatus | Enum: `pending` / `completed` / `failed` | Default: `pending` |
| enrolledAt | Date | Default: Date.now |

**Index:** `{student, course}` (unique) — Chặn mua lại cùng 1 khóa

### 4.5 Progress

**Collection:** `progresses`

| Field | Type | Mô tả |
|---|---|---|
| student | ObjectId → User (required) | Học viên |
| course | ObjectId → Course (required) | Khóa học |
| completedLessons | [ObjectId → Lesson] | Danh sách bài đã hoàn thành |
| progressPercentage | Number (0–100) | % tiến độ |
| lastAccessedLesson | ObjectId → Lesson | Bài học truy cập gần nhất |
| isCompleted | Boolean | Đã hoàn thành khóa học chưa |
| lastStudiedAt | Date | Dùng tính study streak |
| videoProgress | Map(lessonId → seconds) | Vị trí video đang xem |
| bookmarks | Array {lesson, time, note, createdAt} | Bookmark video |

**Index:** `{student, course}` (unique)

### 4.6 Quiz

**Collection:** `quizzes`

| Field | Type | Mô tả |
|---|---|---|
| course | ObjectId → Course (required) | Khóa học |
| title | String (required) | Tiêu đề quiz |
| passingScore | Number 0–100 (required) | Điểm đỗ (%) |
| timeLimit | Number | Giới hạn thời gian (phút) |
| scheduledAt | Date | Thời điểm bắt đầu |
| dueDate | Date | Hạn nộp bài |

**Index:** `course`

### 4.7 Question

**Collection:** `questions` — Câu hỏi của quiz (quiz: ObjectId → Quiz)

### 4.8 Result

**Collection:** `results` — Kết quả làm quiz của học viên

### 4.9 Order

**Collection:** `orders`

| Field | Type | Mô tả |
|---|---|---|
| user | ObjectId → User (required) | Người mua |
| course | ObjectId → Course (required) | Khóa học |
| amount | Number (required) | Số tiền |
| currency | String | Default: `usd` |
| stripePaymentIntentId | String (unique, sparse) | ID từ Stripe |
| status | Enum: `pending` / `paid` / `failed` | Default: `pending` |

**Indexes:** `stripePaymentIntentId`, `{user, course}`

### 4.10 Certificate

**Collection:** `certificates`

| Field | Type | Mô tả |
|---|---|---|
| student | ObjectId → User (required) | Học viên |
| course | ObjectId → Course (required) | Khóa học |
| certificateId | String (required, unique) | UUID duy nhất |
| issueDate | Date | Ngày cấp |
| pdfUrl | String | URL PDF certificate (Cloudinary) |
| validationUrl | String | URL xác thực công khai |
| qrCode | String | Data QR code |

### 4.11 Notification

**Collection:** `notifications`

| Field | Type | Mô tả |
|---|---|---|
| recipient | ObjectId → User (required) | Người nhận |
| title | String (required) | Tiêu đề thông báo |
| message | String (required) | Nội dung |
| type | Enum: `system` / `course` / `payment` / `certificate` | Default: `system` |
| link | String | URL điều hướng khi click |
| isRead | Boolean | Default: false |

**Indexes:** `{recipient, isRead}`, `{createdAt: -1}`

### 4.12 Review

**Collection:** `reviews`

| Field | Type | Mô tả |
|---|---|---|
| student | ObjectId → User (required) | Học viên |
| course | ObjectId → Course (required) | Khóa học |
| rating | Number 1–5 (required) | Đánh giá sao |
| comment | String (required, max 1000) | Nhận xét |
| instructorReply | String (max 1000) | Phản hồi của giảng viên |

**Index:** `{student, course}` (unique), `course`

### 4.13 Category

**Collection:** `categories` — Danh mục khóa học (name, slug)

### 4.14 Discussion / Comment

**Collections:** `discussions`, `comments` — Thảo luận trong bài học

---

## 5. API ROUTES

**Base URL:** `http://localhost:5000/api`

### 5.1 Auth — `/api/auth`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Public | Đăng ký tài khoản |
| POST | `/auth/login` | Public | Đăng nhập, trả về JWT |
| POST | `/auth/logout` | Bearer | Đăng xuất |
| POST | `/auth/forgot-password` | Public | Gửi email reset password |
| PATCH | `/auth/reset-password/:token` | Public | Đặt lại mật khẩu |
| GET | `/auth/verify-email/:token` | Public | Xác minh email |

**Response format (login/register):**
```json
{
  "status": "success",
  "token": "<jwt>",
  "data": { "user": { "_id", "name", "email", "role", "avatar", ... } }
}
```

### 5.2 Users — `/api/users`

| Method | Endpoint | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/users/me` | Bearer | All | Lấy profile cá nhân |
| PATCH | `/users/updateMe` | Bearer | All | Cập nhật profile |
| PATCH | `/users/changePassword` | Bearer | All | Đổi mật khẩu |
| GET | `/users/leaderboard` | Bearer | All | Bảng xếp hạng XP |
| GET | `/users/wishlist` | Bearer | All | Lấy wishlist |
| POST | `/users/wishlist` | Bearer | All | Toggle khóa học vào/ra wishlist |
| GET | `/users` | Bearer | admin, teacher | Danh sách người dùng |
| POST | `/users` | Bearer | admin | Tạo user mới |
| GET | `/users/:id` | Bearer | admin | Lấy user theo ID |
| PATCH | `/users/:id` | Bearer | admin | Cập nhật user |
| DELETE | `/users/:id` | Bearer | admin | Xóa user |

### 5.3 Courses — `/api/courses`

| Method | Endpoint | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/courses` | Optional | All | Danh sách khóa học (chỉ published) |
| GET | `/courses/my-courses` | Bearer | teacher, admin | Khóa học của mình |
| GET | `/courses/recommendations` | Optional | All | Gợi ý khóa học |
| GET | `/courses/:id` | Optional | All | Chi tiết khóa học |
| POST | `/courses` | Bearer | teacher, admin | Tạo khóa học |
| PATCH | `/courses/:id` | Bearer | teacher, admin | Cập nhật khóa học |
| DELETE | `/courses/:id` | Bearer | teacher, admin | Xóa khóa học |
| GET | `/courses/:courseId/lessons` | Bearer | All | Danh sách bài học |
| GET | `/courses/:courseId/quizzes` | Optional | All | Danh sách quiz |
| GET | `/courses/:courseId/reviews` | Public | All | Danh sách đánh giá |
| POST | `/courses/:courseId/reviews` | Bearer | All | Đánh giá khóa học |
| PATCH | `/courses/:courseId/reviews/:id/reply` | Bearer | teacher, admin | Phản hồi review |

### 5.4 Enrollments — `/api/enrollments`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/enrollments` | Bearer | Lấy danh sách enrollment |
| POST | `/enrollments` | Bearer | Đăng ký khóa học |

### 5.5 Progress — `/api/progress`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/progress/:courseId` | Bearer | Lấy tiến độ học |
| POST | `/progress/:courseId/complete-lesson` | Bearer | Đánh dấu bài học hoàn thành |
| PATCH | `/progress/:courseId/video-progress` | Bearer | Lưu vị trí video |
| POST | `/progress/:courseId/bookmark` | Bearer | Thêm bookmark |

### 5.6 Quiz — `/api/quizzes`

| Method | Endpoint | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/quizzes/:courseId` | Bearer | All | Lấy quiz theo course |
| POST | `/quizzes` | Bearer | teacher, admin | Tạo quiz |
| PATCH | `/quizzes/:id` | Bearer | teacher, admin | Cập nhật quiz |
| POST | `/quizzes/:id/submit` | Bearer | student | Nộp bài quiz |
| GET | `/quizzes/:id/results` | Bearer | All | Xem kết quả quiz |

### 5.7 Student Dashboard — `/api/students/:id/dashboard`

> Chỉ role `student` và `admin` có quyền. Route dùng `mergeParams: true`.

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/summary` | Tổng hợp toàn bộ dashboard (Promise.all 6 API con) |
| GET | `/stats` | Stats tổng quan (learningRing, streak, avg score...) |
| GET | `/active-courses` | Các khóa đang học (enrolled + chưa hoàn thành) |
| GET | `/upcoming-quizzes` | Quiz chưa làm, còn trong thời hạn |
| GET | `/recent-activities` | Hoạt động gần đây (max 10 mục) |
| GET | `/recommended-courses` | Gợi ý theo preferences, fallback theo rating |
| GET | `/announcements` | 5 thông báo mới nhất |

### 5.8 Analytics — `/api/analytics`

Dành cho Teacher/Admin — thống kê doanh thu, học viên, khóa học.

### 5.9 Categories — `/api/categories`

CRUD danh mục (admin quản lý). GET public cho tất cả.

### 5.10 Certificates — `/api/certificates`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/certificates` | Bearer | Lấy certificates của học viên |
| GET | `/certificates/verify/:certId` | Public | Xác thực certificate công khai |

### 5.11 Notifications — `/api/notifications`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/notifications` | Bearer | Lấy thông báo |
| PATCH | `/notifications/:id/read` | Bearer | Đánh dấu đã đọc |

### 5.12 Payments — `/api/payments`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/payments/create-intent` | Bearer | Tạo Stripe Payment Intent |
| POST | `/payments/webhook` | Raw body | Stripe webhook xử lý thanh toán |

### 5.13 Upload — `/api/upload`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/upload/image` | Bearer | Upload ảnh lên Cloudinary |
| POST | `/upload/video` | Bearer | Upload video lên Cloudinary |

### 5.14 Discussions — `/api/courses/:courseId/lessons/:lessonId/discussions`

---

## 6. PHÂN QUYỀN (RBAC)

### 6.1 Roles

| Role | Mô tả |
|---|---|
| `student` | Học viên — mặc định khi đăng ký |
| `teacher` | Giảng viên — tạo và quản lý khóa học |
| `admin` | Quản trị viên — full quyền |

### 6.2 Permissions theo Role

| Permission | student | teacher | admin |
|---|---|---|---|
| `enroll_course` | ✅ | — | — |
| `view_enrolled_course` | ✅ | — | — |
| `submit_quiz` | ✅ | — | — |
| `review_course` | ✅ | — | — |
| `view_own_progress` | ✅ | — | — |
| `create_course` | — | ✅ | ✅ |
| `edit_own_course` | — | ✅ | ✅ |
| `delete_own_course` | — | ✅ | ✅ |
| `manage_lessons` | — | ✅ | ✅ |
| `create_quiz` | — | ✅ | ✅ |
| `view_teacher_stats` | — | ✅ | ✅ |
| `view_students` | — | ✅ | ✅ |
| `manage_users` | — | — | ✅ |
| `manage_categories` | — | — | ✅ |
| `approve_courses` | — | — | ✅ |
| `view_statistics` | — | — | ✅ |
| `manage_all` | — | — | ✅ |

### 6.3 Auth Middleware (auth.middleware.js)

```
exports.protect            ← Xác thực JWT, gắn req.user (BẮT BUỘC login)
exports.optionalProtect    ← Có token thì gắn req.user, không có thì next()
exports.verifyToken        ← Alias của protect
exports.restrictTo(...roles) ← Kiểm tra role, dùng SAU protect
exports.isAdmin            ← Chỉ admin
exports.isTeacher          ← Teacher hoặc admin
```

**Middleware order chuẩn:** `protect` → `restrictTo/requireRole` → `requirePermission` → controller

---

## 7. SOCKET.IO

**File:** `backend/src/socket/index.js`

- **Auth:** Middleware verify JWT từ `socket.handshake.auth.token`
- **`connectedUsers`:** Map `userId → Set<socketId>` (hỗ trợ multi-device/multi-tab)
- **Event emitted:** `new_notification` → phát tới tất cả socket của user

**API Export:**
```js
socketLayer.init(server)                          // Khởi tạo (gọi trong server.js)
socketLayer.sendNotificationToUser(userId, data)  // Gửi thông báo realtime
```

---

## 8. FRONTEND

### 8.1 Stack & Dependencies

| Package | Phiên bản | Mục đích |
|---|---|---|
| React | ^18.2.0 | UI framework |
| TypeScript | ^5.2.2 | Type safety |
| Vite | ^5.1.1 | Build tool & dev server |
| react-router-dom | ^6.14.1 | Routing (v6) |
| @reduxjs/toolkit | ^1.9.5 | State management |
| react-redux | ^8.1.1 | Redux bindings |
| @tanstack/react-query | ^4.35.0 | Server state / caching |
| axios | ^1.4.0 | HTTP client |
| framer-motion | ^10.12.16 | Animations |
| lucide-react | ^1.22.0 | Icons |
| recharts | ^3.9.0 | Charts (dashboard) |
| socket.io-client | ^4.8.3 | Realtime |
| @stripe/react-stripe-js | ^6.6.0 | Stripe checkout |
| i18next + react-i18next | ^26 / ^17 | Internationalization (vi/en) |
| @dnd-kit/* | — | Drag & Drop (CurriculumEditor) |
| tailwindcss | ^3.4.7 | CSS utility (devDep) |

### 8.2 Khởi động frontend

```bash
cd frontend
npm run dev          # Dev server (Vite, port 5173)
npm run build        # Production build
npm test             # Vitest
npm run storybook    # Storybook port 6006
npm run test:e2e     # Playwright E2E
```

### 8.3 Cấu trúc thư mục Frontend

```
frontend/src/
├── main.tsx              ← Entry: Provider tree (Redux, QueryClient, Theme, Auth)
├── App.tsx               ← Routes + SiteLayout logic
├── i18n.ts               ← i18next config + translations (vi/en inlined)
├── setupTests.ts
│
├── pages/
│   ├── Splash.tsx        ← Landing/intro page (/)
│   ├── Home.tsx          ← Student dashboard (trang chủ sau login)
│   ├── CourseList.tsx    ← Danh sách khóa học
│   ├── CourseDetail.tsx  ← Chi tiết khóa học
│   ├── Checkout.tsx      ← Thanh toán Stripe
│   ├── Learning.tsx      ← Giao diện học bài (video player)
│   ├── MyLearning.tsx    ← Khóa học của tôi
│   ├── Quiz.tsx          ← Làm bài kiểm tra
│   ├── Profile.tsx       ← Trang cá nhân
│   ├── Settings.tsx      ← Cài đặt tài khoản
│   ├── Wishlist.tsx      ← Danh sách yêu thích
│   ├── Leaderboard.tsx   ← Bảng xếp hạng XP
│   ├── CertificateVerify.tsx ← Xác minh chứng chỉ (public)
│   ├── AdminDashboard.tsx    ← Quản trị viên (no layout)
│   ├── TeacherDashboard.tsx  ← Tổng quan giảng viên
│   ├── TeacherCourses.tsx    ← Danh sách khóa (teacher)
│   ├── CourseManagementTab.tsx
│   ├── CategoryManagementTab.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   └── teacher/
│       ├── CourseBuilder.tsx     ← Tạo khóa học mới
│       └── CurriculumEditor.tsx  ← Chỉnh sửa curriculum (dnd-kit)
│
├── components/
│   ├── layout/
│   │   ├── SiteLayout.tsx        ← Header + Sidebar + Content wrapper
│   │   └── AppErrorBoundary.tsx
│   ├── auth/
│   │   └── ProtectedRoute.tsx    ← Route guard (check auth + roles)
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Toast.tsx
│   │   ├── StateViews.tsx        ← LoadingScreen, EmptyState, ErrorState
│   │   ├── GlassPanel.tsx
│   │   ├── PageShell.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── StarBackground.tsx
│   │   ├── CanvasPrimitives.tsx
│   │   └── index.ts              ← Re-exports tất cả UI components
│   ├── course/
│   │   ├── CourseCurriculum.tsx
│   │   └── CourseReviews.tsx
│   ├── admin/
│   └── ContinueLearning/
│
├── contexts/
│   ├── AuthContext.tsx   ← AuthProvider + useAuth() hook
│   └── ThemeContext.tsx  ← ThemeProvider + useTheme() hook
│
├── store/
│   ├── store.ts          ← Redux store config
│   ├── hooks.ts          ← useAppDispatch, useAppSelector
│   └── slices/
│       └── authSlice.ts  ← Auth state, persist to localStorage
│
├── services/             ← Axios API wrappers (1 file = 1 domain)
│   ├── axios.ts          ← axiosInstance config + interceptors
│   ├── auth.api.ts
│   ├── user.api.ts
│   ├── course.api.ts
│   ├── lesson.api.ts
│   ├── enrollment.api.ts
│   ├── progress.api.ts
│   ├── quiz.api.ts
│   ├── review.api.ts
│   ├── category.api.ts
│   ├── discussion.api.ts
│   ├── analytics.api.ts
│   ├── payment.api.ts
│   └── upload.api.ts
│
├── queries/
│   └── queryClient.ts    ← React Query client config
│
├── hooks/
│   ├── useCountUp.ts
│   ├── useSimulatedLoading.ts
│   └── useSocket.ts      ← Socket.IO client hook
│
├── animations/           ← Framer Motion animation variants
│
└── styles/
    ├── tokens.css        ← CSS variables (design tokens)
    ├── components.css    ← Component-level styles
    ├── tailwind.css      ← Tailwind directives (@tailwind base/components/utilities)
    └── ui.css            ← Utility styles
```

### 8.4 Provider Tree (main.tsx)

```
StrictMode
  └── Redux Provider (store)
        └── QueryClientProvider (queryClient)
              └── ThemeProvider
                    └── BrowserRouter
                          └── AuthProvider  ← dùng useNavigate, PHẢI trong BrowserRouter
                                └── App
```

### 8.5 Route Structure (App.tsx)

**Không có SiteLayout (no header/sidebar):**
- `/` và `/splash` → `<Splash />`
- `/login` → `<Login />`
- `/register` → `<Register />`
- `/forgot-password` → `<ForgotPassword />`
- `/reset-password` → `<ResetPassword />`
- `/unauthorized` → `<UnauthorizedPage />`
- `/certificates/verify/:certificateId` → `<CertificateVerify />`
- `/admin-dashboard` → `<AdminDashboard />` (role: admin)

**Có SiteLayout:**
- `/home`, `/dashboard` → `<Home />` (mọi user đã login)
- `/courses` → `<CourseList />`
- `/courses/:courseId` → `<CourseDetail />`
- `/checkout/:courseId` → `<Checkout />`
- `/learning` → `<MyLearning />`
- `/courses/:courseId/learn` → `<Learning />`
- `/courses/:courseId/quizzes/:quizId/take` → `<Quiz />`
- `/profile` → `<Profile />`
- `/wishlist` → `<Wishlist />`
- `/leaderboard` → `<Leaderboard />`
- `/settings` → `<Settings />`
- `/teacher-dashboard` → `<TeacherDashboard />` (roles: teacher, admin)
- `/teacher-courses` → `<TeacherCourses />` (roles: teacher, admin)
- `/teacher/courses/new` → `<CourseBuilder />` (roles: teacher, admin)
- `/teacher/courses/:courseId/curriculum` → `<CurriculumEditor />` (roles: teacher, admin)

---

## 9. STATE MANAGEMENT (Redux)

### authSlice.ts — Auth State

**State shape:**
```typescript
{
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**AuthUser interface:**
```typescript
interface AuthUser {
  _id: string;
  id?: string;           // Alias của _id (auto-normalized)
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string;
  isVerified: boolean;
  studyStreakDays?: number;
  totalFocusMinutes?: number;
  studyHistory?: { date: string; focusMinutes: number; lessonsCompleted: number }[];
  xp?: number;
  level?: number;
  badges?: { name: string; icon: string; description: string; awardedAt: string }[];
  createdAt?: string;
}
```

**Persistence:** Token + user lưu localStorage:
- Key token: `elearning_token`
- Key user: `elearning_user`

**Actions:**
- `setAuth({accessToken, refreshToken?, user?})` — Sau login/register
- `clearAuth()` — Logout
- `updateUser(Partial<AuthUser>)` — Cập nhật profile
- `setLoading(boolean)` — Loading state

**Selectors:**
- `selectCurrentUser` — User object hoặc null
- `selectAccessToken` — JWT token hoặc null
- `selectIsAuthenticated` — Boolean
- `selectIsAdmin` — true nếu role === 'admin'
- `selectIsTeacher` — true nếu role === 'teacher' hoặc 'admin'

---

## 10. AUTH FLOW

### 10.1 Login Flow
1. User POST `/api/auth/login` → nhận JWT token
2. `authContext.login()` → dispatch `setAuth({token, user})`
3. `authSlice` persist vào localStorage
4. `axiosInstance` interceptor tự động đính token vào mọi request

### 10.2 Auto-logout (Token expired)
1. Backend trả 401 hoặc 403
2. `axiosInstance` response interceptor detect → dispatch `clearAuth()` → redirect `/login?expired=true`

### 10.3 App Startup Sync
- Nếu có token trong localStorage nhưng user null → `AuthContext` tự gọi `GET /users/me` để refresh user data

### 10.4 ProtectedRoute Logic
- Check `isAuthenticated` từ Redux store → redirect `/login` nếu chưa login
- Check `allowedRoles` nếu có → redirect `/unauthorized` nếu sai role

---

## 11. HTTP CLIENT (axios.ts)

```
Base URL: import.meta.env.VITE_API_URL hoặc fallback '/api'
```

**Request interceptor:** Tự động thêm `Authorization: Bearer <token>` từ Redux store

**Response interceptor:** Nếu 401/403 (không phải `/auth/login` hoặc `/auth/register`) → clearAuth + redirect `/login?expired=true`

---

## 12. QUY ƯỚC CODE

### Backend

- **File naming:** `<domain>.<layer>.js` (vd: `course.controller.js`, `course.service.js`)
- **Error handling:** `catchAsync(async (req, res, next) => ...)` + `AppError(message, statusCode)`
- **Response format chuẩn:**
  ```json
  { "status": "success", "data": { ... } }
  { "status": "error", "message": "..." }
  ```
- **Module system:** CommonJS (`require` / `module.exports`)
- **Middleware order:** `protect` → `restrictTo/requireRole` → `requirePermission` → controller

### Frontend

- **File naming:** PascalCase cho components/pages (`.tsx`), camelCase cho hooks/services (`.ts`)
- **API services:** Mỗi domain có 1 file trong `services/` (vd: `course.api.ts`), export object
- **State:** Redux chỉ cho **auth state**; dùng **React Query** cho server state
- **Styling:** TailwindCSS utility classes + CSS variables từ `styles/tokens.css`
- **Icons:** `lucide-react`
- **Animations:** `framer-motion`
- **Data fetching pattern:** `services/<domain>.api.ts` → dùng trực tiếp hoặc qua React Query

---

## 13. LUỒNG NGHIỆP VỤ QUAN TRỌNG

### 13.1 Đăng ký khóa học (Enrollment Flow)
```
CourseDetail → [Enroll click]
  ├── price === 0 → POST /api/enrollments → redirect /courses/:id/learn
  └── price > 0  → redirect /checkout/:courseId
                      → POST /api/payments/create-intent
                      → Stripe Elements (payment)
                      → Stripe Webhook: payment_intent.succeeded
                          → Update Order (paid)
                          → Create Enrollment (completed)
                          → Create Notification
```

### 13.2 Học bài (Learning Flow)
```
Learning.tsx
  ├── GET /api/progress/:courseId       ← Load tiến độ
  ├── GET /api/courses/:id/lessons      ← Load danh sách bài
  ├── Video playback
  │   └── PATCH /api/progress/:courseId/video-progress  ← Auto-save vị trí
  └── [Complete lesson button]
      └── POST /api/progress/:courseId/complete-lesson
              ← Update completedLessons, tính progressPercentage
              ← Nếu 100% → Tạo Certificate tự động
```

### 13.3 Làm Quiz (Quiz Flow)
```
Quiz.tsx (/courses/:courseId/quizzes/:quizId/take)
  ├── GET /api/quizzes/:courseId        ← Load quiz info
  └── [Submit]
      └── POST /api/quizzes/:id/submit  ← Tính điểm, lưu Result
              ← Cộng XP nếu pass
              ← Emit Socket new_notification
```

### 13.4 Dashboard Summary (1-request pattern)
```
Home.tsx
  └── GET /api/students/:id/dashboard/summary
        ← Backend: Promise.all([stats, activeCourses, quizzes, activities, recommendations, announcements])
        ← Nếu 1 service lỗi → field = null, không crash toàn bộ
```

### 13.5 Notification Realtime
```
Backend service tạo notification
  └── notificationService.create() → save DB
      └── socketLayer.sendNotificationToUser(userId, data)
            → emit 'new_notification' đến tất cả socket của user

Frontend (useSocket.ts)
  └── socket.on('new_notification', handler)
        → update notification state trong UI (SiteLayout)
```

---

## 14. ĐIỂM CHÚ Ý QUAN TRỌNG

> **[CRITICAL]** Stripe Webhook (`POST /api/payments/webhook`) PHẢI được mount TRƯỚC `express.json()` trong app.js vì cần raw body. Không được thay đổi thứ tự.

> **[CRITICAL]** `AuthProvider` PHẢI nằm bên trong `BrowserRouter` vì dùng `useNavigate`.

> **[WARNING]** Course slug auto-generate từ title. Nếu đổi title → slug thay đổi → có thể break URL cũ. Cân nhắc khi thiết kế edit flow.

> **[WARNING]** `/admin-dashboard` không có SiteLayout. Nó render layout riêng bên trong component.

> **[NOTE]** `selectIsTeacher` trả `true` cho cả role `teacher` lẫn `admin`. Teacher cũng có nhiều quyền admin-like.

> **[NOTE]** `optionalProtect` dùng cho route public nhưng muốn personalize (vd: `GET /courses` - biết user đã enroll chưa).

> **[NOTE]** Redux chỉ dùng cho auth. Mọi data khác (courses, progress...) dùng React Query hoặc local state.

> **[NOTE]** `ProtectedRoute` component ở `components/auth/ProtectedRoute.tsx`, không phải trong `pages/auth/`.

> **[NOTE]** `axiosInstance` base URL lấy từ env `VITE_API_URL`. Vite proxy có thể được dùng để chuyển `/api` sang `localhost:5000`.

---

## 15. FILE QUAN TRỌNG THEO CHỨC NĂNG

| Chức năng | Backend | Frontend |
|---|---|---|
| **Auth** | `auth.controller.js`, `auth.service.js`, `auth.routes.js` | `auth.api.ts`, `authSlice.ts`, `AuthContext.tsx`, `Login.tsx`, `Register.tsx` |
| **User/Profile** | `user.controller.js`, `user.service.js`, `user.routes.js` | `user.api.ts`, `Profile.tsx`, `Settings.tsx` |
| **Courses** | `course.controller.js`, `course.service.js`, `course.routes.js` | `course.api.ts`, `CourseList.tsx`, `CourseDetail.tsx` |
| **Lessons** | `lesson.controller.js`, `lesson.service.js`, `lesson.routes.js` | `lesson.api.ts`, `Learning.tsx` |
| **Enrollment** | `enrollment.controller.js`, `enrollment.service.js` | `enrollment.api.ts`, `Checkout.tsx` |
| **Progress** | `progress.controller.js`, `progress.service.js` | `progress.api.ts`, `Learning.tsx` |
| **Quiz** | `quiz.controller.js`, `quiz.service.js`, `quiz.routes.js` | `quiz.api.ts`, `Quiz.tsx` |
| **Payment** | `payment.controller.js`, `payment.routes.js` | `payment.api.ts`, `Checkout.tsx` |
| **Certificate** | `certificate.controller.js`, `certificate.service.js` | `CertificateVerify.tsx` |
| **Notification** | `notification.controller.js`, `notification.service.js` | `useSocket.ts`, `SiteLayout.tsx` |
| **Dashboard** | `dashboard.controller.js`, `dashboard.service.js`, `dashboard.routes.js` | `Home.tsx` |
| **Teacher** | `analytics.controller.js`, `analytics.service.js` | `TeacherDashboard.tsx`, `CourseBuilder.tsx`, `CurriculumEditor.tsx` |
| **Admin** | `user.controller.js` (admin routes) | `AdminDashboard.tsx`, `CourseManagementTab.tsx`, `CategoryManagementTab.tsx` |
| **Middleware** | `auth.middleware.js`, `permissionMiddleware.js`, `roleMiddleware.js` | `ProtectedRoute.tsx` |
| **Realtime** | `socket/index.js` | `hooks/useSocket.ts` |

---

*Tạo lần đầu: 2026-07-01 | Cập nhật khi có thay đổi kiến trúc quan trọng*
