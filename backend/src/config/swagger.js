const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Learning Management API',
      version: '1.0.0',
      description: `
## Hệ thống Quản lý E-Learning

API Documentation cho toàn bộ hệ thống E-Learning bao gồm:
- **Authentication**: Đăng ký, đăng nhập, quên mật khẩu, xác minh email.
- **Users**: Quản lý người dùng theo RBAC (Admin / Teacher / Student).
- **Courses & Lessons**: Tạo và quản lý khóa học, bài giảng.
- **Categories**: Quản lý danh mục khóa học.
- **Enrollments**: Đăng ký / hủy đăng ký khóa học.
- **Progress**: Theo dõi tiến độ học tập.
- **Quiz & Results**: Tạo bài kiểm tra, chấm điểm tự động.
- **Certificates**: Cấp chứng chỉ PDF khi hoàn thành khóa học.
- **Notifications**: Thông báo realtime qua Socket.IO.
- **Analytics**: Dashboard thống kê cho Admin và Teacher.
- **Upload**: Tải ảnh thumbnail và video lên Cloudinary.

## Hướng dẫn xác thực (Authentication)
Mọi API yêu cầu bảo mật đều cần truyền **Bearer Token** qua Header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`
`,
      contact: {
        name: 'E-Learning Support',
        email: 'support@elearning.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header. Nhập token của bạn vào ô bên dưới.'
        }
      },
      schemas: {
        // ==================== AUTH ====================
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Nguyễn Văn A' },
            email: { type: 'string', format: 'email', example: 'nguyenvana@gmail.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' },
            role: { type: 'string', enum: ['student', 'teacher'], default: 'student' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'nguyenvana@gmail.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        // ==================== USER ====================
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            name: { type: 'string', example: 'Nguyễn Văn A' },
            email: { type: 'string', example: 'nguyenvana@gmail.com' },
            role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
            avatar: { type: 'string', example: 'https://res.cloudinary.com/...' },
            isVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // ==================== COURSE ====================
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'NodeJS từ cơ bản đến nâng cao' },
            slug: { type: 'string', example: 'nodejs-tu-co-ban-den-nang-cao' },
            description: { type: 'string', example: 'Khóa học lập trình Node.js' },
            price: { type: 'number', example: 299000 },
            thumbnail: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published'] },
            category: { $ref: '#/components/schemas/Category' },
            instructor: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CourseRequest: {
          type: 'object',
          required: ['title', 'category'],
          properties: {
            title: { type: 'string', example: 'NodeJS từ cơ bản đến nâng cao' },
            description: { type: 'string', example: 'Khóa học lập trình Node.js' },
            price: { type: 'number', example: 299000 },
            thumbnail: { type: 'string', example: 'https://res.cloudinary.com/...' },
            status: { type: 'string', enum: ['draft', 'published'] },
            category: { type: 'string', example: '60d0fe4f5311236168a109ca' }
          }
        },
        // ==================== CATEGORY ====================
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Lập trình Web' },
            slug: { type: 'string', example: 'lap-trinh-web' }
          }
        },
        CategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Lập trình Web' }
          }
        },
        // ==================== LESSON ====================
        Lesson: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Giới thiệu về Node.js' },
            videoUrl: { type: 'string' },
            duration: { type: 'number', example: 600 },
            order: { type: 'integer', example: 1 },
            course: { type: 'string' }
          }
        },
        LessonRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Giới thiệu về Node.js' },
            videoUrl: { type: 'string', example: 'https://res.cloudinary.com/...' },
            duration: { type: 'number', example: 600 },
            order: { type: 'integer', example: 1 },
            isFree: { type: 'boolean', example: false }
          }
        },
        // ==================== ENROLLMENT ====================
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { $ref: '#/components/schemas/User' },
            course: { $ref: '#/components/schemas/Course' },
            paymentStatus: { type: 'string', enum: ['pending', 'completed'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // ==================== PROGRESS ====================
        Progress: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            course: { type: 'string' },
            completedLessons: { type: 'array', items: { type: 'string' } },
            progressPercentage: { type: 'number', example: 75 },
            isCompleted: { type: 'boolean', example: false }
          }
        },
        // ==================== QUIZ ====================
        Quiz: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Kiểm tra cuối chương 1' },
            course: { type: 'string' },
            passingScore: { type: 'number', example: 70 },
            timeLimit: { type: 'integer', example: 30 }
          }
        },
        QuizRequest: {
          type: 'object',
          required: ['title', 'passingScore'],
          properties: {
            title: { type: 'string', example: 'Kiểm tra cuối chương 1' },
            passingScore: { type: 'number', example: 70 },
            timeLimit: { type: 'integer', example: 30 }
          }
        },
        QuizSubmitRequest: {
          type: 'object',
          required: ['answers'],
          properties: {
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                  selectedOptionId: { type: 'string', example: '60d0fe4f5311236168a109cb' }
                }
              }
            }
          }
        },
        // ==================== CERTIFICATE ====================
        Certificate: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { $ref: '#/components/schemas/User' },
            course: { $ref: '#/components/schemas/Course' },
            certificateId: { type: 'string', example: '8F2B1A0D' },
            certificateUrl: { type: 'string', example: 'https://res.cloudinary.com/...cert.pdf' },
            issuedAt: { type: 'string', format: 'date-time' }
          }
        },
        // ==================== NOTIFICATION ====================
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Chứng chỉ đã được cấp!' },
            message: { type: 'string', example: 'Bạn đã hoàn thành khóa học NodeJS.' },
            type: { type: 'string', enum: ['system', 'course', 'payment', 'certificate'] },
            isRead: { type: 'boolean' },
            link: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // ==================== COMMON ====================
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'Mô tả lỗi chi tiết' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Xác thực người dùng' },
      { name: 'Users', description: 'Quản lý người dùng' },
      { name: 'Categories', description: 'Quản lý danh mục khóa học' },
      { name: 'Courses', description: 'Quản lý khóa học' },
      { name: 'Lessons', description: 'Quản lý bài giảng' },
      { name: 'Enrollments', description: 'Đăng ký khóa học' },
      { name: 'Progress', description: 'Theo dõi tiến độ học tập' },
      { name: 'Quiz', description: 'Bài kiểm tra & Chấm điểm' },
      { name: 'Certificates', description: 'Chứng chỉ hoàn thành' },
      { name: 'Notifications', description: 'Thông báo realtime' },
      { name: 'Analytics', description: 'Dashboard thống kê' },
      { name: 'Upload', description: 'Tải file lên Cloudinary' }
    ]
  },
  apis: ['./src/routes/*.js'] // Đường dẫn tới các file Route chứa JSDoc
};

module.exports = swaggerJsdoc(options);
