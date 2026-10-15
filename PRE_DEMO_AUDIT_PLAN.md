# PRE-DEMO PROJECT AUDIT & ACCEPTANCE PLAN
## HỆ THỐNG QUẢN LÝ HỌC TẬP TRỰC TUYẾN (E-LEARNING MANAGEMENT SYSTEM)

- **Dự án:** Đồ án tốt nghiệp E-Learning Management System (MERN Stack + TypeScript)
- **Ngày thực hiện Audit Baseline (Phase 0):** 14/10/2026
- **Tình trạng mã nguồn:** Branch `main`, Git working tree sạch (`clean`, không có thay đổi chưa commit)
- **Quy tắc Phase 0:** Không can thiệp sửa đổi mã nguồn nghiệp vụ; chạy baseline test/build thực tế; truy vết luồng End-to-End từ giao diện đến cơ sở dữ liệu.

---

## 1. KIẾN TRÚC THỰC TẾ CỦA HỆ THỐNG

### 1.1. Tổng quan kiến trúc
Hệ thống được xây dựng theo kiến trúc **Client-Server tách biệt (Decoupled SPA + RESTful API)**:
- **Frontend SPA:** Single Page Application phát triển bằng **React 18**, **Vite 5**, **TypeScript 5.2**, định tuyến bằng **React Router v6**. Quản lý trạng thái bằng **Redux Toolkit** (Global Auth state) kết hợp **TanStack Query (React Query v4)** (Server State, caching, invalidation).
- **Backend API:** **Node.js (CommonJS)**, framework **Express 5.2.1**, cơ chế nạp lớp phân tầng chuẩn: `routes -> middlewares -> controllers -> services -> repositories -> models`.
- **Database:** **MongoDB** (Object Data Modeling thông qua **Mongoose 9.7.0**), sử dụng MongoDB memory server cho testing môi trường cô lập và MongoDB Atlas / Local MongoDB cho runtime.
- **Media & File Storage:** **Cloudinary** (lưu trữ video bài giảng chất lượng cao, hình ảnh khóa học, avatar) kết hợp xử lý stream qua `streamifier` và `multer`. Hỗ trợ nhúng video **YouTube**.
- **Thanh toán:** Tích hợp đa cổng: **Stripe** (PaymentIntent API + Webhook xác thực chữ ký) và **VietQR** (Mã QR chuyển khoản chuẩn NAPAS với tiền tố định danh đơn hàng).
- **Realtime Layer:** **Socket.IO 4.8.3** với JWT Authentication handshake, quản lý multi-socket per user qua `Set<socketId>` để phát thông báo thời gian thực (`new_notification`).
- **Bảo mật & Tối ưu:** `helmet` (Security Headers), `compression` (Gzip/Brotli), `express-rate-limit` (chống Brute-force & ReDoS với cơ chế phân hạng dynamic limiter cho Admin/Teacher), `sanitize.middleware` (chống NoSQL Injection và XSS), xác thực phân quyền kép RBAC (`requireRole` + `requirePermission`).

```
[ Client Browser (React + Vite + TS) ]
                │
                │ HTTPS / REST API + WebSocket (Socket.IO)
                ▼
      [ Express 5.2 API Server ]
      ┌─────────────────────────────────────────────────────────┐
      │ Middlewares:                                            │
      │  ├─ Trust Proxy / Helmet / Compression                  │
      │  ├─ CORS Handler (Localhost / Vercel allowlist)         │
      │  ├─ Stripe Webhook (Raw body handler)                   │
      │  ├─ Dynamic Rate Limiter & Sanitize (NoSQL/XSS)         │
      │  ├─ JWT Protect & RBAC (Role + Permission)              │
      │  └─ Request Filter & Error Middleware                   │
      ├─────────────────────────────────────────────────────────┤
      │ Controllers -> Services -> Repositories                 │
      └───────┬─────────────────────────┬──────────────┬────────┘
              │                         │              │
              ▼                         ▼              ▼
     [ MongoDB Database ]         [ Cloudinary ]   [ Stripe / VietQR ]
```

---

## 2. DANH SÁCH TRANG, MODULE VÀ CHỨC NĂNG

### 2.1. Phía Frontend (Pages & Features)

| Route | Component | Quyền hạn | Chức năng nghiệp vụ thực tế |
|---|---|---|---|
| `/` & `/splash` | `Splash.tsx` | Public | Giới thiệu dự án, định vị thương hiệu, điều hướng nhanh |
| `/home` & `/dashboard` | `Home.tsx` | Yêu cầu Login | Trang chủ học viên: Banner khóa học nổi bật, lọc theo danh mục, gợi ý khóa học trending/recommended, tiếp tục học nhanh khóa gần nhất |
| `/courses` & `/course-list` | `CourseList.tsx` | Yêu cầu Login | Danh sách khóa học có bộ lọc giá, cấp độ, tìm kiếm từ khóa, phân trang |
| `/courses/:courseId` | `CourseDetail.tsx` | Yêu cầu Login | Chi tiết khóa học: xem trailer/preview video, giáo trình động (Modules/Lessons), đánh giá của học viên, mua/đăng ký khóa học, thêm vào Wishlist |
| `/checkout/:courseId` | `Checkout.tsx` | Yêu cầu Login | Thanh toán khóa học: Hỗ trợ thẻ tín dụng quốc tế qua Stripe Element và Quét mã VietQR chuyển khoản ngân hàng |
| `/courses/:courseId/learn` | `Learning.tsx` | Student (Enrolled) / Teacher / Admin | Phòng học trực tuyến: Trình phát video Cloudinary/YouTube, chỉnh tốc độ/độ phân giải, bookmark mốc thời gian, tự động lưu tiến trình video, thảo luận bài học, nộp bài tập, làm bài tập trắc nghiệm ngẫu nhiên, claim chứng chỉ PDF khi đạt 100% |
| `/learning` | `MyLearning.tsx` | Yêu cầu Login | Danh sách các khóa học đã ghi danh kèm thanh tiến độ học tập |
| `/courses/:courseId/quizzes/:quizId/take` | `Quiz.tsx` | Student (Enrolled) / Teacher / Admin | Làm bài trắc nghiệm tính giờ, kiểm tra đáp án tự động (Auto-grading), lưu điểm và tính XP |
| `/profile` | `Profile.tsx` | Yêu cầu Login | Xem thông tin cá nhân, level, XP, chuỗi ngày học liên tục (streak), lịch sử học tập (study history), huy hiệu (badges) |
| `/settings` | `Settings.tsx` | Yêu cầu Login | Cập nhật hồ sơ (tên, avatar), đổi mật khẩu |
| `/wishlist` | `Wishlist.tsx` | Yêu cầu Login | Xem và quản lý danh sách các khóa học đã lưu |
| `/leaderboard` | `Leaderboard.tsx` | Yêu cầu Login | Bảng xếp hạng học viên theo điểm kinh nghiệm (XP) |
| `/certificates/verify/:certificateId` | `CertificateVerify.tsx` | Public | Trang xác thực chứng chỉ số công khai: kiểm tra tính hợp lệ qua mã chứng chỉ, xem thông tin người học và tải file PDF |
| `/teacher-dashboard` | `TeacherDashboard.tsx` | Teacher, Admin | Bảng điều khiển giảng viên: thống kê số học viên, doanh thu, chấm điểm bài tập học viên nộp, gửi yêu cầu rút tiền (payout) |
| `/teacher-courses` | `TeacherCourses.tsx` | Teacher, Admin | Danh sách khóa học do giảng viên quản lý, thống kê đánh giá, tạo khóa học mới |
| `/teacher/courses/new` | `CourseBuilder.tsx` | Teacher, Admin | Wizard tạo khóa học: thông tin tiêu đề, mô tả, danh mục, cấp độ, học phí, upload ảnh bìa Cloudinary |
| `/teacher/courses/:courseId/curriculum` | `CurriculumEditor.tsx` | Teacher, Admin | Soạn thảo giáo trình khóa học: Kéo thả sắp xếp Modules/Lessons (dnd-kit), upload video lên Cloudinary, tạo Quiz trắc nghiệm, tạo bài tập Assignment |
| `/admin-dashboard/:tabId` | `AdminDashboard.tsx` | Admin | Trung tâm điều hành: Platform Pulse, quản lý Users (toggle suspend, CRUD), phê duyệt khóa học (Moderation queue), quản lý Categories, duyệt đơn ứng tuyển giáo viên, phê duyệt chuyển khoản rút tiền, xem Audit Logs |
| `/login` | `Login.tsx` | Public | Đăng nhập tài khoản bằng Email/Password, điều hướng theo vai trò |
| `/register` | `Register.tsx` | Public | Đăng ký tài khoản học viên mới, kích hoạt bảo vệ mật khẩu |
| `/forgot-password` & `/reset-password` | `ForgotPassword.tsx`, `ResetPassword.tsx` | Public | Quên mật khẩu và đặt lại mật khẩu qua token |

---

## 3. DANH SÁCH API VÀ ENTITY QUAN TRỌNG

### 3.1. Danh mục Entity Database (MongoDB Models)

1. **User (`users`):** Lưu trữ tài khoản, bcrypt hashed password, vai trò (`student`, `teacher`, `admin`), trạng thái `isActive`, điểm kinh nghiệm `xp`, `level`, `studyStreakDays`, mảng lịch sử `studyHistory`, danh sách `badges`, `wishlist`.
2. **Course (`courses`):** Lưu khóa học, `title` & `description` hỗ trợ đa ngôn ngữ `{vi, en}`, `price`, `estimatedPrice`, `instructor`, `category`, trạng thái `status` (`draft`, `pending_review`, `published`), `thumbnailUrl`, `averageRating`.
3. **Module (`modules`):** Chương học thuộc khóa học, `course`, `title`, `order`, quản lý cascade delete lessons liên quan.
4. **Lesson (`lessons`):** Bài học, `course`, `module`, `title`, `videoUrl`, `videoPublicId`, `provider` (`cloudinary`/`youtube`), `duration`, `order`, cờ học thử `isFreePreview`.
5. **Enrollment (`enrollments`):** Ghi danh học tập, unique index `{student, course}`, `paymentStatus` (`pending`, `completed`, `failed`), `enrolledAt`.
6. **Progress (`progresses`):** Tiến trình học, unique index `{student, course}`, danh sách `completedLessons`, `progressPercentage` (0-100), `lastAccessedLesson`, `videoProgress` (Map lưu giây), `bookmarks`.
7. **Quiz (`quizzes`):** Bài kiểm tra trắc nghiệm, `course`, `title`, `passingScore`, `timeLimit`.
8. **Question (`questions`):** Câu hỏi trắc nghiệm, liên kết `quiz` hoặc `lesson`, `text`, `points`, mảng các lựa chọn `options: [{ text, isCorrect }]`, `explanation`.
9. **Result (`results`):** Kết quả bài thi của học viên, `student`, `quiz`, `course`, `score`, `scorePercentage`, `isPassed`.
10. **Order (`orders`):** Đơn hàng thanh toán, `user`, `course`, `amount`, `currency`, `stripePaymentIntentId`, `status` (`pending`, `paid`, `failed`).
11. **Certificate (`certificates`):** Chứng chỉ cấp phát, `student`, `course`, `certificateId` (UUID ngắn), `pdfUrl`, `validationUrl`, `qrCode`, `issueDate`.
12. **Review (`reviews`):** Đánh giá khóa học, unique index `{student, course}`, `rating` (1-5), `comment`, `instructorReply`.
13. **Notification (`notifications`):** Thông báo hệ thống thời gian thực, `recipient`, `title`, `message`, `type`, `link`, `isRead`.
14. **Category (`categories`):** Phân loại khóa học, `name` (hỗ trợ đa ngữ), `slug`, `description`.
15. **Discussion & Comment (`discussions`, `comments`):** Diễn đàn hỏi đáp trong từng bài học.
16. **Assignment & AssignmentSubmission (`assignments`, `assignmentsubmissions`):** Bài tập tự luận và nộp bài kèm chấm điểm của giáo viên.
17. **TeacherApplication (`teacherapplications`):** Đơn ứng tuyển làm giảng viên của học viên gửi tới Admin.
18. **PayoutRequest (`payoutrequests`):** Đơn yêu cầu rút tiền của giảng viên gửi tới Admin kèm biên lai chuyển khoản.
19. **AuditLog (`auditlogs`):** Nhật ký ghi nhận toàn bộ hành động can thiệp của Quản trị viên (Admin Action Logger).

### 3.2. Danh mục REST API cốt lõi

- **Authentication (`/api/auth`):**
  - `POST /register`, `POST /login`, `POST /logout`
  - `POST /forgot-password`, `PATCH /reset-password/:token`, `GET /verify-email/:token`
- **Users (`/api/users`):**
  - `GET /me`, `PATCH /updateMe`, `PATCH /changePassword`
  - `GET /wishlist`, `POST /wishlist` (toggle)
  - `GET /leaderboard`
  - `GET /` (Teacher/Admin), `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/toggle-active` (Admin)
- **Courses (`/api/courses`):**
  - `GET /` (Public/Filtered), `GET /recommendations`, `GET /my-courses`, `GET /:id`
  - `POST /`, `PATCH /:id`, `DELETE /:id` (Teacher/Admin)
  - `PATCH /:id/approve` (Admin only)
  - `GET /:courseId/reviews`, `POST /:courseId/reviews`, `PATCH /:courseId/reviews/:id/reply`
- **Modules & Lessons (`/api/courses/:courseId/modules` & `/api/courses/:courseId/lessons`):**
  - `GET /`, `GET /:id` (Public/Masked video link if not enrolled)
  - `POST /`, `PATCH /:id`, `DELETE /:id` (Teacher/Admin)
  - `PATCH /reorder` (Sắp xếp lại thứ tự chương/bài)
- **Enrollments (`/api/enrollments`):**
  - `GET /` (Lấy danh sách khóa đã ghi danh)
  - `POST /` (Ghi danh trực tiếp cho khóa học miễn phí)
- **Progress (`/api/progress`):**
  - `GET /statistics`, `GET /:courseId`
  - `POST /:courseId/lessons/:lessonId/complete` (Hoàn thành bài giảng)
  - `POST /:courseId/lessons/:lessonId/video-progress` (Lưu vị trí video)
  - `POST /:courseId/lessons/:lessonId/bookmarks` (Lưu mốc bookmark)
- **Quizzes (`/api/quizzes`):**
  - `GET /courses/:courseId/quizzes`
  - `GET /:quizId/take` (Lấy đề thi - ẩn đáp án đúng)
  - `POST /:quizId/submit` (Nộp bài & tự động chấm điểm)
  - `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:quizId/questions` (Teacher/Admin)
- **Payments (`/api/payments`):**
  - `POST /create-payment-intent` (Stripe)
  - `POST /webhook` (Stripe Webhook xử lý ghi danh tự động)
  - `POST /create-qr-order`, `POST /confirm-qr-payment` (VietQR)
- **Certificates (`/api/certificates`):**
  - `POST /claim/:courseId` (Yêu cầu cấp chứng chỉ khi 100% tiến độ)
  - `GET /my-certificates`
  - `GET /verify/:certificateId` (Public xác thực)
  - `GET /:certificateId/pdf` (Tải file PDF)
- **Admin Management (`/api/admin`):**
  - `GET /pending-counts`, `GET /moderation/courses`
  - `GET /teacher-applications`, `POST /teacher-applications/:id/action`
  - `GET /payouts`, `PATCH /payouts/:id/complete`
  - `GET /audit-logs`
  - `POST /teacher-applications/apply` (Học viên gửi đơn)
  - `POST /payouts/request` (Giảng viên rút tiền)

---

## 4. MA TRẬN TÍNH NĂNG THEO VAI TRÒ (RBAC MATRIX)

| Chức năng | Khách (Guest) | Học viên (Student) | Giảng viên (Teacher) | Quản trị viên (Admin) |
|---|:---:|:---:|:---:|:---:|
| Xem Landing Page, Danh mục, Khóa học | ✅ | ✅ | ✅ | ✅ |
| Xem Video bài học Free Preview | ✅ | ✅ | ✅ | ✅ |
| Xem chi tiết & đề cương khóa học | ✅ | ✅ | ✅ | ✅ |
| Xác thực chứng chỉ công khai (`/verify`) | ✅ | ✅ | ✅ | ✅ |
| Đăng ký / Đăng nhập / Quên mật khẩu | ✅ | ✅ | ✅ | ✅ |
| Mua khóa học (Stripe / VietQR) | ❌ | ✅ | ❌ | ❌ |
| Học bài & Xem toàn bộ video bài giảng | ❌ | ✅ (Đã mua) | ✅ (Khóa của mình) | ✅ (Toàn quyền) |
| Lưu tiến độ, đánh dấu hoàn thành bài học | ❌ | ✅ | ❌ | ✅ |
| Tham gia làm Quiz & Nhận điểm | ❌ | ✅ | ❌ | ✅ |
| Nộp bài tập Assignment | ❌ | ✅ | ❌ | ❌ |
| Nhận chứng chỉ hoàn thành khóa học | ❌ | ✅ (100% tiến độ) | ❌ | ❌ |
| Đánh giá (Review/Rating) khóa học | ❌ | ✅ (Đã ghi danh) | ❌ | ❌ |
| Quản lý Wishlist & Xem Leaderboard XP | ❌ | ✅ | ✅ | ✅ |
| Gửi đơn ứng tuyển làm Giảng viên | ❌ | ✅ | ❌ | ❌ |
| Tạo và quản lý Khóa học của mình | ❌ | ❌ | ✅ | ✅ |
| Soạn thảo giáo trình (Module/Lesson/Video) | ❌ | ❌ | ✅ | ✅ |
| Tạo đề kiểm tra Quiz & Câu hỏi trắc nghiệm | ❌ | ❌ | ✅ | ✅ |
| Chấm điểm bài tập Assignment của học viên | ❌ | ❌ | ✅ | ✅ |
| Trả lời Review của học viên | ❌ | ❌ | ✅ | ✅ |
| Xem thống kê doanh thu cá nhân & Rút tiền | ❌ | ❌ | ✅ | ❌ |
| Duyệt khóa học (Course Moderation Queue) | ❌ | ❌ | ❌ | ✅ |
| Duyệt đơn ứng tuyển Giảng viên | ❌ | ❌ | ❌ | ✅ |
| Duyệt chuyển khoản yêu cầu rút tiền | ❌ | ❌ | ❌ | ✅ |
| Quản lý tài khoản (Khóa/Mở khóa User) | ❌ | ❌ | ❌ | ✅ |
| Quản lý Danh mục khóa học (Categories) | ❌ | ❌ | ❌ | ✅ |
| Xem Platform Pulse & Audit Logs hệ thống | ❌ | ❌ | ❌ | ✅ |

---

## 5. KẾT QUẢ BASELINE TESTS / BUILD (THỰC NGHIỆM THỰC TẾ)

Tất cả các lệnh kiểm tra an toàn đã được kích hoạt trực tiếp trên môi trường máy trạm:

### 5.1. Backend Unit & Security Tests
- **Lệnh thực hiện:** `npm test` trong thư mục `backend/`
- **Kết quả:**
  - **Suites:** 9 passed / 9 total (100%)
  - **Tests:** 64 passed / 64 total (100%)
  - **Thời gian chạy:** 46.185 s
  - **Chi tiết suites:**
    - `tests/unit/module.service.test.js`: PASS
    - `tests/unit/auth.service.test.js`: PASS
    - `tests/unit/search.service.test.js`: PASS
    - `tests/unit/category.service.test.js`: PASS
    - `tests/unit/course.service.test.js`: PASS
    - `tests/unit/quiz.service.test.js`: PASS
    - `tests/security/audit_remediations.test.js`: PASS
    - `tests/security/security.test.js`: PASS
    - `tests/integration/auth.integration.test.js`: PASS
  - **Ghi chú Console:** Mailer thông báo lỗi thiếu thông tin cấu hình `Missing credentials for "PLAIN"`, nhưng mã nguồn đã bọc try-catch an toàn nên không gây crash tiến trình đăng ký.

### 5.2. Frontend Tests
- **Lệnh thực hiện:** `npm test` (`vitest run`) trong thư mục `frontend/`
- **Kết quả:**
  - **Test Files:** 3 passed / 3 total (100%)
  - **Tests:** 10 passed / 10 total (100%)
  - **Thời gian chạy:** 42.21 s
  - **Chi tiết suites:**
    - `src/store/slices/authSlice.test.ts`: 3 passed
    - `src/pages/auth/Login.test.tsx`: 3 passed
    - `src/components/course/CourseCurriculum.test.tsx`: 4 passed

### 5.3. Frontend TypeScript & Production Build
- **Lệnh thực hiện:** `npm run build` (`tsc && vite build`) trong thư mục `frontend/`
- **Kết quả:**
  - TypeScript Compiler (`tsc`): **0 errors**
  - Vite Bundler: **Biên dịch thành công 2,949 modules trong 22.25s**
  - Dung lượng bundle tối ưu qua code splitting:
    - HTML: 1.10 kB
    - CSS: 167.61 kB (gzip: 25.14 kB)
    - Code-split chunks: 48 JS files được chia nhỏ tương ứng từng trang (`AdminDashboard`, `CurriculumEditor`, `Learning`, `CourseDetail`, `Home`,...).

### 5.4. Đa ngôn ngữ (i18n Sync Check)
- **Thực nghiệm:** Kiểm tra đối soát toàn bộ keys giữa `src/locales/vi.json` (80.4 kB) và `src/locales/en.json` (67.1 kB) bằng Node script.
- **Kết quả:** **1,396 keys hoàn toàn khớp 1:1**, không có key nào bị thiếu giữa 2 ngôn ngữ.

---

## 6. DANH SÁCH VẤN ĐỀ ĐÃ BIẾT VÀ KHU VỰC RỦI RO (FINDINGS)

Qua truy vết sâu luồng mã nguồn từ UI -> API -> Service -> Database, phát hiện các lỗi nghiêm trọng sau đây cần được xử lý có kiểm soát:

### FINDING 1: [P1 - Critical] Lỗi thiếu toán tử nguyên tử MongoDB `$set` trong `bulkWrite` gây sập API khi sắp xếp lại Module / Lesson
- **File liên quan:** 
  - `backend/src/services/module.service.js` (Dòng 170-174)
  - `backend/src/services/lesson.service.js` (Dòng 261-271)
- **Vị trí code:**
  ```javascript
  // module.service.js:
  const bulkOps = orderedModules.map((item) => ({
    updateOne: {
      filter: { _id: item.id, course: courseId },
      update: { order: item.order } // THIẾU $set!
    }
  }));

  // lesson.service.js:
  const bulkOps = orderedLessons.map((item) => {
    ...
    return {
      updateOne: {
        filter: { _id: item.id, course: courseId },
        update: updateFields // THIẾU $set!
      }
    };
  });
  ```
- **Điều kiện gây lỗi:** Khi Giảng viên hoặc Admin dùng tính năng kéo thả (Drag & Drop) sắp xếp lại thứ tự bài học hoặc chương học trên trang `CurriculumEditor.tsx`, frontend gọi API `PATCH /courses/:courseId/modules/reorder` hoặc `PATCH /courses/:courseId/lessons/reorder`.
- **Ảnh hưởng:** MongoDB Driver và Mongoose sẽ từ chối truy vấn và ném ngoại lệ: `MongoServerError: Update document requires atomic operators`. Tính năng sắp xếp giáo trình bị lỗi 500 trên môi trường chạy thực tế! (Sở dĩ unit test trước đó pass là do hàm `bulkWrite` bị Mock).
- **Hướng sửa:** Bọc dữ liệu cập nhật trong toán tử nguyên tử: `update: { $set: { order: item.order } }` và `update: { $set: updateFields }`.
- **Regression test cần thiết:** Viết test integration thực tế với MongoDB Memory Server (không mock `bulkWrite`) để kiểm tra `reorderModules` và `reorderLessons`.

---

### FINDING 2: [P1 - Critical] `ReferenceError: AppError is not defined` trong `lesson.controller.js`
- **File liên quan:** `backend/src/controllers/lesson.controller.js` (Dòng 64)
- **Vị trí code:**
  ```javascript
  // lesson.controller.js dòng 63-65:
  if (!lessons || !Array.isArray(lessons)) {
    return next(new AppError('Invalid lessons data', 400));
  }
  ```
- **Điều kiện gây lỗi:** Client gửi payload không hợp lệ lên route `reorderLessons`.
- **Ảnh hưởng:** Do ở đầu file `lesson.controller.js` chưa `require('../utils/appError')`, Node.js sẽ ném `ReferenceError: AppError is not defined` và gây lỗi 500 Unhandled Error thay vì trả về mã lỗi 400 chuẩn cho client.
- **Hướng sửa:** Bổ sung `const AppError = require('../utils/appError');` ở đầu file `lesson.controller.js`.
- **Regression test cần thiết:** Test gọi endpoint `reorderLessons` với body rỗng và xác nhận nhận mã lỗi 400.

---

### FINDING 3: [P1 - Critical] Crash giao diện React tại trang Xác thực chứng chỉ (`CertificateVerify.tsx`) do render trực tiếp Object đa ngữ
- **File liên quan:** `frontend/src/pages/CertificateVerify.tsx` (Dòng 186)
- **Vị trí code:**
  ```tsx
  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
    {data.course?.title}
  </h2>
  ```
- **Điều kiện gây lỗi:** Người dùng hoặc nhà tuyển dụng mở link quét mã QR chứng chỉ công khai (`/certificates/verify/:certificateId`). Nếu khóa học có tiêu đề dạng đa ngữ `{ vi: string, en: string }` (Mixed Type trong Mongoose Course Schema).
- **Ảnh hưởng:** React 18 lập tức ném lỗi: `Error: Objects are not valid as a React child (found: object with keys {vi, en})`. Toàn bộ trang xác thực chứng chỉ sẽ bị crash màn hình trắng (hoặc Error Boundary) trước mặt ban giám khảo / nhà tuyển dụng.
- **Hướng sửa:** Import và sử dụng helper `useLocalizedValue()` trong `CertificateVerify.tsx` để render: `{lv(data.course?.title)}`.
- **Regression test cần thiết:** Viết component test cho `CertificateVerify` với mock data chứa `course.title = { vi: 'Khóa học React', en: 'React Course' }`.

---

### FINDING 4: [P1 - Critical] Tiêu đề khóa học bị biến thành chuỗi rác `"[object Object]"` trong file PDF Chứng chỉ và Notification
- **File liên quan:**
  - `backend/src/services/certificate.service.js` (Dòng 38, dòng 56)
  - `backend/src/utils/pdfGenerator.js` (Dòng 9, dòng 111)
  - `backend/src/services/enrollment.service.js` (Dòng 71)
  - `backend/src/services/discussion.service.js` (Dòng 44)
- **Vị trí code:**
  ```javascript
  // certificate.service.js:
  const pdfUrl = await generateCertificate(user.name, course.title, certId, qrCodeDataUrl);
  // pdfGenerator.js:
  str = String(str); // Khi courseTitle là {vi, en}, String(courseTitle) -> "[object Object]"
  doc.text(clean(courseTitle), { align: 'center' });
  ```
- **Điều kiện gây lỗi:** Học viên hoàn thành 100% khóa học và bấm "Nhận chứng chỉ" đối với bất kỳ khóa học nào có tiêu đề đa ngữ.
- **Ảnh hưởng:** File PDF chứng chỉ in ra chữ to giữa trang ghi là: **"Đã hoàn thành xuất sắc khóa học [object Object]"**, đồng thời thông báo Socket/Notification gửi về chuông người dùng cũng ghi nhận chuỗi `[object Object]`. Đây là lỗi rất mất điểm trong buổi bảo vệ đồ án tốt nghiệp.
- **Hướng sửa:** Tạo hàm trích xuất chuỗi an toàn `extractTitle(title, lang)` trên backend để lấy chuỗi tiếng Việt hoặc tiếng Anh phù hợp trước khi truyền vào PDFKit và Notification.
- **Regression test cần thiết:** Unit test `generateCertificate` với `courseTitle` là cả string thông thường lẫn object `{ vi, en }`.

---

### FINDING 5: [P2 - Major] Nguy cơ vỡ giới hạn Validator (`max: 100`) của `Progress` khi tính phần trăm hoàn thành bài học
- **File liên quan:** `backend/src/services/progress.service.js` (Dòng 89)
- **Vị trí code:**
  ```javascript
  progress.progressPercentage = Math.round((progress.completedLessons.length / totalLessonsCount) * 100);
  ```
- **Điều kiện gây lỗi:** Nếu một bài học bị xóa khỏi khóa học sau khi học viên đã hoàn thành, hoặc nếu mảng `completedLessons` chứa ID dư thừa, tỉ lệ `completedLessons.length / totalLessonsCount` có thể vượt quá 1 (ví dụ 110%).
- **Ảnh hưởng:** Schema `Progress` quy định `progressPercentage: { max: 100 }`. Khi `progress.save()` được gọi, Mongoose sẽ ném lỗi `ValidationError: Path progressPercentage (110) is more than maximum allowed value (100)`, làm toàn bộ hành động bấm "Hoàn thành bài học" của học viên bị lỗi 400/500.
- **Hướng sửa:** Lọc các ID trong `completedLessons` phải thuộc về tập `allLessons` hiện hữu của khóa học, và ép chặn bằng `Math.min(100, Math.max(0, ...))`.
- **Regression test cần thiết:** Test case hoàn thành bài học khi số lượng bài học trong khóa học thay đổi.

---

### FINDING 6: [P2 - Major] Lỗ hổng thiếu Unit & Integration Test ở các module nghiệp vụ quan trọng
- **File liên quan:** Cấu trúc thư mục `backend/tests/` và `frontend/src/`
- **Ảnh hưởng:** 
  - Backend hoàn toàn chưa có test cho các luồng: `lesson.service`, `enrollment.service`, `progress.service`, `certificate.service`, `payment.service`, `admin.controller`.
  - Frontend chỉ có 3 file test nhỏ, chiếm chưa tới 5% số components và pages.
- **Hướng sửa:** Bổ sung regression tests tập trung vào các luồng quan trọng nhất trước khi demo.

---

### FINDING 7: [P3 - Minor] Độ lệch kiến trúc (Architectural Drift) ở Student Dashboard
- **File liên quan:** 
  - `backend/src/routes/dashboard.routes.js`
  - `frontend/src/pages/Home.tsx`
- **Hiện trạng:** Backend xây dựng 7 API con chuyên sâu cho Dashboard học viên tại `/api/students/:id/dashboard/*` (`summary`, `stats`, `active-courses`, `upcoming-quizzes`,...). Tuy nhiên ở Frontend, các trang `/home` và `/dashboard` hiện tái sử dụng component `Home.tsx` (dạng Course Catalog + Hero Banner + Testimonials + Recommendations). Các chỉ số học tập được hiển thị trực tiếp tại trang `Profile.tsx` thay vì gọi cụm API này.
- **Đánh giá:** Không gây lỗi crash hệ thống, nhưng cần lưu ý tài liệu hóa rõ ràng trong đồ án để tránh việc hội đồng chấm hỏi về sự khác biệt giữa tài liệu đặc tả và trải nghiệm thực tế trên UI.

---

## 7. KẾ HOÀNH AUDIT VÀ SỬA LỖI THEO TỪNG PHASE

Để đảm bảo việc sửa lỗi có kiểm soát, không phá vỡ tính ổn định của hệ thống trước ngày demo, kế hoạch triển khai được chia làm 4 Phase tiếp theo:

### PHASE 1: SỬA CÁC LỖI BLOCKER & CRITICAL (P0 & P1)
- **Mục tiêu:** Xử lý triệt để các lỗi gây crash runtime và sai lệch dữ liệu hiển thị.
- **Phạm vi can thiệp:**
  1. Thêm toán tử `$set` vào `reorderModules` và `reorderLessons` trong `module.service.js` và `lesson.service.js`.
  2. Bổ sung import `AppError` trong `lesson.controller.js`.
  3. Cập nhật `CertificateVerify.tsx` dùng `useLocalizedValue` để loại bỏ nguy cơ crash Object as React child.
  4. Chuẩn hóa trích xuất chuỗi tiêu đề khóa học đa ngữ trong `pdfGenerator.js`, `certificate.service.js`, `enrollment.service.js`, `discussion.service.js`.
- **Kiểm thử nghiệm thu:** Chạy lại toàn bộ test suite backend & frontend; kiểm tra build production.

### PHASE 2: AUDIT & GIA CỐ LUỒNG NGHIỆP VỤ CỐT LÕI (CORE BUSINESS FLOWS)
- **Mục tiêu:** Đảm bảo luồng End-to-End từ Giáo viên tạo khóa học -> Học viên mua khóa học -> Học bài -> Làm Quiz -> Nhận chứng chỉ hoạt động mượt mà 100%.
- **Phạm vi kiểm tra & sửa chữa:**
  1. Kiểm tra tính toàn vẹn khi tính phần trăm tiến độ trong `progress.service.js` (chặn max 100%).
  2. Kiểm tra thao tác thêm/xóa wishlist trong `user.controller.js` đảm bảo đối soát chính xác giữa String ID và ObjectId.
  3. Kiểm tra luồng cấp phát chứng chỉ tự động khi tiến độ đạt 100%.
  4. Kiểm tra luồng thanh toán VietQR (môi trường test) và Stripe webhook.

### PHASE 3: AUDIT PHÂN QUYỀN (RBAC), BẢO MẬT & DỮ LIỆU ĐA NGỮ / THEME
- **Mục tiêu:** Đảm bảo không lộ dữ liệu chéo giữa các vai trò; UI hiển thị hoàn hảo ở cả Light/Dark Mode và tiếng Anh / tiếng Việt.
- **Phạm vi kiểm tra & sửa chữa:**
  1. Kiểm tra quyền truy cập của Student vào các route của Teacher/Admin (phải bị chặn 403 / Redirect Unauthorized).
  2. Kiểm tra tài khoản bị suspend (`isActive: false`) có bị chặn đăng nhập và thao tác API hay không.
  3. Kiểm tra tính nhất quán giao diện Dark Mode / Light Mode trên các trang phức tạp (`Learning.tsx`, `AdminDashboard.tsx`, `CurriculumEditor.tsx`).
  4. Đảm bảo toàn bộ thông báo Toast và Validation messages hiển thị song ngữ chuẩn xác.

### PHASE 4: REGRESSION TEST & CHUẨN BỊ MÔI TRƯỜNG RELEASE / DEMO
- **Mục tiêu:** Nghiệm thu toàn diện toàn bộ hệ thống trước khi hội đồng bảo vệ đánh giá.
- **Phạm vi công việc:**
  1. Bổ sung các unit/integration regression tests cho các dịch vụ cốt lõi vừa sửa.
  2. Kiểm tra toàn bộ production build `npm run build` ở frontend.
  3. Kiểm tra kịch bản Demo: tạo sẵn tài khoản mẫu cho 3 vai trò (`admin@demo.com`, `teacher@demo.com`, `student@demo.com`).
  4. Xuất báo cáo nghiệm thu chính thức `FINAL_AUDIT_ACCEPTANCE_REPORT.md`.

---

## 8. ĐIỀU KIỆN NGHIỆM THU CHO TỪNG PHASE (ACCEPTANCE CRITERIA)

| Phase | Tiêu chí nghiệm thu (Gate Criteria) |
|---|---|
| **Phase 0** | ✅ **HOÀN TẤT:** Baseline audit hoàn tất; `PRE_DEMO_AUDIT_PLAN.md` được tạo; git status sạch; 0 dòng code nghiệp vụ bị sửa; báo cáo trung thực toàn bộ findings. |
| **Phase 1** | ✅ **HOÀN TẤT & ĐÃ VERIFY:** Đã sửa dứt điểm F-01 (`$set` bulkWrite), F-02 (`AppError` import), F-03 (Object rendering crash trong `CertificateVerify.tsx`), F-04 (`[object Object]` trong PDF và Notification); 10/10 test suites backend passed; 4/4 test files frontend passed; `npm run build` frontend 100% sạch. |
| **Phase 2** | ✅ **HOÀN TẤT & ĐÃ VERIFY:** F-05 (Tiến độ học tập được kẹp trong [0, 100] và lọc bài học mồ côi); Wishlist sửa lỗi so khớp ObjectId vs String và deep populate category/instructor; Đăng ký khóa học khởi tạo Progress idempotent không bị lỗi duplicate key; Checkout.tsx dùng `useLocalizedValue` cho tiêu đề khóa học; Backend 11/11 test suites (78 tests) passed; Frontend build 100% sạch. |
| **Phase 3** | ✅ **HOÀN TẤT & ĐÃ VERIFY:** Đã audit và chứng minh không có lỗ hổng vượt quyền (Student bị chặn 403 tại Admin/Teacher endpoints; Teacher không thể sửa khóa học của giáo viên khác; Teacher không thể tự xuất bản khóa học); Tài khoản bị suspend (`isActive: false`) bị chặn 403 lập tức tại API và tự động logout/redirect hiển thị thông báo song ngữ; Ẩn video bài giảng khóa học với học viên chưa đăng ký; Theme tokens Dark/Light mode nhất quán; 12/12 test suites backend (85 tests) passed; Frontend build 100% sạch (14.10s). |
| **Phase 4** | ✅ **HOÀN TẤT & ĐÃ VERIFY:** 100% test suites passed (Backend: 13/13 suites, 87/87 tests; Frontend: 4/4 files, 12/12 tests); Production build frontend `npm run build` hoàn thành trong 13.43s với 0 errors; Tạo sẵn kịch bản và script seed 3 tài khoản demo (`seedDemoAccounts.js`, `npm run seed:demo`) cho Admin, Teacher, Student; Lập tài liệu báo cáo nghiệm thu chính thức `FINAL_AUDIT_ACCEPTANCE_REPORT.md`. Sẵn sàng 100% cho buổi bảo vệ đồ án. |

---

*Tài liệu được lập bởi Senior Full-Stack Engineer / QA Lead phục vụ đồ án tốt nghiệp E-Learning Management System.*
