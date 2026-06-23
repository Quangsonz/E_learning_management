# User Roles

1. **Student / Learner**: Can browse the course catalog, enroll in courses, view curriculum, watch lessons, track progress, take quizzes, and earn certificates.
2. **Teacher / Instructor**: Can create and manage courses (draft/publish workflow), manage modules and lessons, create quizzes, and view analytics on revenue, enrollments, and student progress via the Teacher Dashboard.
3. **Admin**: Can oversee the entire platform, monitor realtime system health (API latency, uptime), track total users, course catalog, active students, and overall platform revenue via the Admin Dashboard.

# Features

- **Authentication & Authorization**: Login, Registration, Password Recovery, and Role-Based Access Control (RBAC).
- **Course Catalog & Search**: Browsing courses with filters for categories and search keywords.
- **Course Management**: Instructor tools to create courses, set prices, and move them through a Draft \u2192 Publish workflow.
- **Learning Experience (LMS)**: Structured curriculum consisting of modules, lessons, and supplementary resources (PDFs, DOCs, Links).
- **Progress Tracking**: Tracking student completion at the lesson level, maintaining a focus streak, and generating completion certificates.
- **Video Playback**: Displaying lesson videos and tracking duration.
- **Notes System**: Allowing students to take notes tied to specific lessons or their learning experience.
- **Quiz Engine**: Timed assessments with multiple-choice questions, score calculation, pass/fail grading, and progress warnings.
- **Analytics Dashboards**:
  - *Teacher*: Course health, revenue trends, weekly enrollments, and quiz performance splits.
  - *Admin*: Infrastructure health, platform-wide revenue lines (Enterprise, Creator, Teams), overall user growth, and active student metrics.

# MongoDB Collections

1. **Users**
2. **Categories**
3. **Courses**
4. **Modules**
5. **Lessons**
6. **Resources**
7. **Enrollments**
8. **LessonProgress**
9. **Notes**
10. **Quizzes**
11. **Questions**
12. **QuizAttempts**
13. **Payments / Transactions** (Implied by Revenue)

# Collection Relationships

- **Users** \u2192 **Courses**: `1:N` (Instructor creates Courses)
- **Courses** \u2192 **Categories**: `N:1` (Courses belong to a Category)
- **Courses** \u2192 **Modules**: `1:N` (A Course has multiple Modules)
- **Modules** \u2192 **Lessons**: `1:N` (A Module has multiple Lessons)
- **Lessons** \u2192 **Resources**: `1:N` (A Lesson can have multiple reference files)
- **Users** \u2192 **Enrollments**: `1:N` (A Student can enroll in multiple Courses)
- **Courses** \u2192 **Enrollments**: `1:N` (A Course has multiple enrolled Students)
- **Enrollments** \u2192 **LessonProgress**: `1:N` (An Enrollment tracks progress of multiple Lessons)
- **Users** \u2192 **Notes**: `1:N` (Students can take multiple notes per lesson/course)
- **Courses** (or Lessons) \u2192 **Quizzes**: `1:1` or `1:N` (Courses/Lessons have associated Quizzes)
- **Quizzes** \u2192 **Questions**: `1:N` (A Quiz has multiple Questions)
- **Users** \u2192 **QuizAttempts**: `1:N` (Students can have multiple attempts for quizzes)
- **Users** \u2192 **Payments**: `1:N` (Students make payments to enroll)

# API Endpoints

### Auth & Users
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user & return tokens
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/users/me` - Get current user profile

### Courses (Public / Student)
- `GET /api/courses` - List published courses (supports search, category filters)
- `GET /api/courses/:id` - Get detailed course info, curriculum, and instructor details
- `POST /api/courses/:id/enroll` - Enroll in a course (initiates payment if price > 0)

### Course Management (Teacher)
- `GET /api/teacher/courses` - List courses managed by the teacher
- `POST /api/courses` - Create a new course draft
- `PUT /api/courses/:id` - Update course details
- `PUT /api/courses/:id/status` - Change course status (draft \u2192 published)
- `DELETE /api/courses/:id` - Delete a course

### Curriculum Management (Teacher)
- `POST /api/courses/:id/modules` - Add a module
- `POST /api/modules/:id/lessons` - Add a lesson to a module
- `POST /api/lessons/:id/resources` - Add a resource to a lesson

### Learning Experience (Student)
- `GET /api/enrollments/:id/curriculum` - Get accessible modules and lessons for an enrolled course
- `GET /api/lessons/:id` - Get lesson video URL and resources
- `PUT /api/lessons/:id/progress` - Mark lesson as completed
- `GET /api/enrollments/:id/notes` - Get user notes for a course
- `PUT /api/enrollments/:id/notes` - Save or update user notes

### Quizzes
- `GET /api/quizzes/:id` - Get quiz questions and time limit
- `POST /api/quizzes/:id/submit` - Submit quiz answers, returns score and pass/fail result

### Dashboards & Analytics
- `GET /api/admin/metrics` - Admin realtime platform stats (revenue, active students, health)
- `GET /api/teacher/metrics` - Teacher specific stats (revenue, course students, quiz performance)

# Authentication Flow

1. User registers or logs in via frontend form.
2. Frontend sends credentials to `POST /auth/login`.
3. Backend validates credentials against `users` collection.
4. Backend issues an `accessToken` and `refreshToken` (JWTs).
5. Frontend stores tokens in Redux store (`authSlice`) and uses an Axios interceptor to attach the `accessToken` as a Bearer token in the Authorization header of subsequent requests.
6. Upon token expiration, frontend uses `refreshToken` to obtain a new `accessToken` implicitly.
7. User details are fetched via `GET /users/me` to populate UI with name and roles.

# Authorization Flow

1. **Role Verification**: Middleware inspects the user role encoded in the JWT or fetched from DB.
2. **Admin Routes**: Endpoints like `/api/admin/*` reject requests lacking the `Admin` role.
3. **Teacher Routes**: Endpoints like `/api/teacher/*` and course creation/modification routes require the `Teacher` or `Admin` role. Furthermore, teachers can only modify courses they own (checking `instructorId`).
4. **Student Content Access**: Endpoints like video fetching or quiz taking check if the user has an active record in the `enrollments` collection for the requested `courseId`.
5. **Draft Visibility**: Draft courses are not returned in `GET /api/courses` unless the requester is the owner (Teacher) or an Admin.

# Missing Requirements

- **Payment Gateway Integration**: Frontend displays course prices and revenue, but there's no explicit checkout flow or webhook endpoints defined for Stripe/PayPal processing.
- **File Storage Infrastructure**: Handling and serving video streams securely (e.g., AWS S3, CloudFront, HLS streaming) and storing resource files (PDF, DOC).
- **Realtime Infrastructure**: Admin Dashboard relies on "Realtime Updates" which implies WebSockets (Socket.io) or Server-Sent Events (SSE) for system activity logs.
- **Email/Notification System**: Sending emails for password resets, enrollment confirmations, and certificate issuances.
- **Certificate Generation**: Logic for generating downloadable PDF certificates once a course reaches 100% completion.
