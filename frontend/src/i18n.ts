import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      settings: {
        title: "Settings",
        subtitle: "Manage your account preferences and security.",
        tabs: {
          general: "General",
          security: "Security & Access"
        },
        profile: {
          title: "Account Overview",
          fullName: "Full Name",
          avatarUrl: "Avatar Image URL",
          saveBtn: "Save Changes",
          saving: "Saving...",
          success: "Profile updated successfully!",
          language: "Language",
          languageEn: "English",
          languageVi: "Vietnamese",
          languageDesc: "Choose your preferred language for the interface."
        },
        appearance: {
          title: "Appearance",
          light: "Light",
          dark: "Midnight",
          active: "(Active)"
        },
        security: {
          title: "Security Center",
          changePassword: "Change Password",
          currentPass: "Current Password",
          newPass: "New Password",
          confirmPass: "Confirm New Password",
          updateBtn: "Update Password",
          updating: "Updating...",
          success: "Password changed successfully!",
          errorMismatch: "New passwords do not match!"
        }
      },
      layout: {
        nav: {
          home: "Home",
          courses: "Courses",
          learning: "Learning",
          leaderboard: "Leaderboard",
          admin: "Admin",
          dashboard: "Teacher Dashboard"
        },
        searchPlaceholder: "Search for courses...",
        theme: {
          light: "Light Mode",
          dark: "Dark Mode"
        },
        profileMenu: {
          myLearning: "My Learning",
          wishlist: "Wishlist",
          settings: "Settings",
          logout: "Logout",
          login: "Login",
          register: "Register"
        }
      },
      home: {
        hero: {
          badge: "🚀 Future of Learning",
          title1: "Master the skills",
          title2: "that shape tomorrow",
          subtitle: "Learn programming, design, and business from industry experts. Start your journey today and accelerate your career.",
          startBtn: "Start Learning",
          viewBtn: "View Courses"
        },
        categories: {
          title: "Popular Categories",
          subtitle: "Explore our most sought-after learning paths",
          all: "All",
          programming: "Programming",
          design: "Design",
          dataScience: "Data Science",
          business: "Business",
          marketing: "Marketing",
          ai: "AI & ML",
          photography: "Photography",
          music: "Music"
        },
        stats: {
          students: "Active Students",
          instructors: "Expert Instructors",
          rating: "Average Rating"
        },
        flashSale: {
          badge: "⚡ FLASH SALE",
          title: "Black Friday Mega Sale",
          subtitle: "Unlock your potential. Get premium courses at up to 80% off. Offer ends soon.",
          hours: "Hours",
          minutes: "Minutes",
          seconds: "Seconds"
        },
        features: {
          title: "Why choose us?",
          f1Title: "Personalized Learning",
          f1Desc: "AI-driven paths tailored to your speed and goals.",
          f2Title: "Verifiable Certificates",
          f2Desc: "Earn certificates recognized by top companies.",
          f3Title: "1-on-1 Mentorship",
          f3Desc: "Direct support from industry veterans."
        },
        sections: {
          recommended: "Recommended for you",
          youMightLike: "You might like 💡",
          exploreAll: "Explore all",
          allNewCourses: "All New Courses",
          courseWord: "Course",
          viewAll: "View All",
          noCourses: "No courses published yet.",
          instructorPrep: "Instructors are preparing content — check back soon!",
          resumeTitle: "Yours",
          welcomeBack: "Welcome back",
          resumeDesc: "Continue your learning journey.",
          continueLearning: "Continue Learning",
          learningTag: "Learning"
        }
      },
      courses: {
          metrics: {
            activeLearners: "Active Learners",
            availableCourses: "Available Courses",
            weeklyCompletion: "Weekly Completion",
            avgRating: "Avg. Rating"
          },
          hero: {
            badge: "Course catalog",
            eyebrow: "Find your next learning path",
            title: "Modern courses with a calm, premium, and motivating browsing experience.",
            desc: "Inspired by Coursera structure, Duolingo energy, and Notion clarity. Search by topic, filter by category, and jump into popular or trending learning tracks.",
            discover: "Discover",
            title2: "Learn in a space that feels alive.",
            desc2: "Browse a course library built to feel polished, engaging, and easy to scan.",
            features: {
              f1: "Smooth transition",
              f2: "Hover lift",
              f3: "Lazy loading",
              f4: "Progress tracking"
            }
          },
          filter: {
            search: "Search courses, teachers, or skills"
          },
          list: {
            popular: "Popular Courses",
            popularDesc: "Most loved by learners",
            trending: "Trending Tracks",
            trendingDesc: "What people are learning right now",
            allCourses: "Explore All Courses",
            allCoursesDesc: "A comprehensive library of premium content",
            page: "Page",
            of: "of",
            prev: "Prev",
            next: "Next",
            noCourses: "No courses found",
            adjustFilter: "Adjust your filters or try another category."
          }
        },
        leaderboard: {
          title: "Leaderboard",
          desc: "Top performers of the week",
          loading: "Loading Leaderboard",
          fetching: "Fetching top learners...",
          error: "Error",
          errorMsg: "Could not load leaderboard data.",
          globalTitle: "Global Leaderboard",
          globalDesc: "Compete with learners worldwide. Earn XP by completing lessons and scoring high on quizzes!",
          noActivity: "No activity yet",
          beFirst: "Be the first to earn XP on the platform!",
          days: "days",
          streak: "streak"
        },
        learning: {
          title: "My Learning",
          eyebrow: "Pick up where you left off",
          heroTitle: "Your personal learning workspace",
          heroDesc: "Track your progress, continue your courses, and take smart quizzes based on your recent activity.",
          metrics: {
            total: "Total Enrolled",
            ongoing: "Ongoing",
            completed: "Completed"
          },
          enrolled: "Enrolled Courses",
          continue: "Continue Learning",
          progress: "Progress",
          noCourses: "No courses yet",
          noCoursesMsg: "You haven't enrolled in any courses yet. Explore our catalog to get started."
        },
        testimonials: {
          badge: "STUDENT SUCCESS",
          title: "Don't just take our word for it",
          t1quote: "This platform completely transformed my career. From zero coding knowledge to my first developer job in just 3 months.",
          t1role: "Junior Developer @ TechStart",
          t2quote: "Instructors are dedicated, content is always up-to-date. I finished the UI/UX course and got a 40% salary bump.",
          t2role: "UX Designer @ Creative Hub",
          t3quote: "Best investment I've ever made. The Data Science course here is more practical than anywhere else.",
          t3role: "Data Analyst @ FinTech Corp"
        },
      app: {
        unauthorized: {
          title: "Access Denied",
          desc: "You don't have permission to view this page.",
          back: "Back to Home"
        }
      }
    }
  },
  vi: {
    translation: {
      settings: {
        title: "Cài đặt",
        subtitle: "Quản lý tùy chọn tài khoản và bảo mật của bạn.",
        tabs: {
          general: "Cài đặt chung",
          security: "Bảo mật & Truy cập"
        },
        profile: {
          title: "Tổng quan tài khoản",
          fullName: "Họ và tên",
          avatarUrl: "Đường dẫn ảnh đại diện",
          saveBtn: "Lưu thay đổi",
          saving: "Đang lưu...",
          success: "Cập nhật hồ sơ thành công!",
          language: "Ngôn ngữ",
          languageEn: "Tiếng Anh",
          languageVi: "Tiếng Việt",
          languageDesc: "Chọn ngôn ngữ hiển thị giao diện."
        },
        appearance: {
          title: "Giao diện",
          light: "Sáng",
          dark: "Tối",
          active: "(Đang chọn)"
        },
        security: {
          title: "Trung tâm bảo mật",
          changePassword: "Đổi mật khẩu",
          currentPass: "Mật khẩu hiện tại",
          newPass: "Mật khẩu mới",
          confirmPass: "Xác nhận mật khẩu mới",
          updateBtn: "Cập nhật mật khẩu",
          updating: "Đang cập nhật...",
          success: "Đổi mật khẩu thành công!",
          errorMismatch: "Mật khẩu mới không khớp!"
        }
      },
      layout: {
        nav: {
          home: "Trang chủ",
          courses: "Khóa học",
          learning: "Vào học",
          leaderboard: "Xếp hạng",
          admin: "Quản trị",
          dashboard: "Giảng viên"
        },
        searchPlaceholder: "Tìm kiếm khóa học...",
        theme: {
          light: "Giao diện Sáng",
          dark: "Giao diện Tối"
        },
        profileMenu: {
          myLearning: "Khóa học của tôi",
          wishlist: "Yêu thích",
          settings: "Cài đặt",
          logout: "Đăng xuất",
          login: "Đăng nhập",
          register: "Đăng ký"
        }
      },
      home: {
        hero: {
          badge: "🚀 Tương lai của việc học",
          title1: "Làm chủ kỹ năng",
          title2: "định hình tương lai",
          subtitle: "Học lập trình, thiết kế và kinh doanh từ các chuyên gia hàng đầu. Bắt đầu hành trình của bạn ngay hôm nay để thăng tiến sự nghiệp.",
          startBtn: "Bắt đầu học",
          viewBtn: "Xem khóa học"
        },
        categories: {
          title: "Danh mục phổ biến",
          subtitle: "Khám phá các lộ trình học được tìm kiếm nhiều nhất",
          all: "Tất cả",
          programming: "Lập trình",
          design: "Thiết kế",
          dataScience: "Khoa học Dữ liệu",
          business: "Kinh doanh",
          marketing: "Marketing",
          ai: "AI & Học máy",
          photography: "Nhiếp ảnh",
          music: "Âm nhạc"
        },
        stats: {
          students: "Học viên",
          instructors: "Giảng viên",
          rating: "Đánh giá trung bình"
        },
        flashSale: {
          badge: "⚡ ƯU ĐÃI CHỚP NHOÁNG",
          title: "Siêu Khuyến Mãi Black Friday",
          subtitle: "Đánh thức tiềm năng của bạn. Sở hữu các khóa học chất lượng với ưu đãi lên đến 80%. Sắp kết thúc.",
          hours: "Giờ",
          minutes: "Phút",
          seconds: "Giây"
        },
        features: {
          title: "Vì sao chọn chúng tôi?",
          f1Title: "Học tập Cá nhân hóa",
          f1Desc: "Lộ trình AI thiết kế riêng theo tốc độ và mục tiêu của bạn.",
          f2Title: "Chứng chỉ Uy tín",
          f2Desc: "Nhận chứng chỉ được công nhận bởi các tập đoàn hàng đầu.",
          f3Title: "Hỗ trợ Trực tiếp",
          f3Desc: "Được giải đáp trực tiếp từ các chuyên gia trong ngành."
        },
        sections: {
          recommended: "Gợi ý riêng cho bạn",
          youMightLike: "Có thể bạn sẽ thích 💡",
          exploreAll: "Khám phá tất cả",
          allNewCourses: "Tất cả Khóa học Mới nhất",
          courseWord: "Khóa học",
          viewAll: "Xem tất cả",
          noCourses: "Chưa có khóa học nào được xuất bản.",
          instructorPrep: "Giảng viên đang chuẩn bị nội dung — quay lại sớm nhé!",
          resumeTitle: "Của bạn",
          welcomeBack: "Chào lại",
          resumeDesc: "Tiếp tục hành trình học tập của bạn.",
          continueLearning: "Tiếp tục học",
          learningTag: "Đang học"
        }
      },
      courses: {
          metrics: {
            activeLearners: "Học viên",
            availableCourses: "Khóa học",
            weeklyCompletion: "Hoàn thành",
            avgRating: "Điểm đánh giá"
          },
          hero: {
            badge: "Danh mục",
            eyebrow: "Tìm lộ trình học tiếp theo",
            title: "Khóa học hiện đại với trải nghiệm tìm kiếm cao cấp, tạo động lực.",
            desc: "Lấy cảm hứng từ Coursera, năng lượng của Duolingo và sự rõ ràng của Notion. Tìm kiếm theo chủ đề, lọc theo danh mục và tham gia ngay.",
            discover: "Khám phá",
            title2: "Học tập trong không gian sống động.",
            desc2: "Khám phá thư viện khóa học được thiết kế chỉn chu, cuốn hút và dễ dàng nắm bắt.",
            features: {
              f1: "Chuyển động mượt mà",
              f2: "Hiệu ứng nổi",
              f3: "Tải trang tối ưu",
              f4: "Theo dõi tiến độ"
            }
          },
          filter: {
            search: "Tìm kiếm khóa học, giảng viên..."
          },
          list: {
            popular: "Phổ biến nhất",
            popularDesc: "Được yêu thích nhất bởi học viên",
            trending: "Thịnh hành",
            trendingDesc: "Mọi người đang học gì",
            allCourses: "Tất cả khóa học",
            allCoursesDesc: "Thư viện nội dung chất lượng cao",
            page: "Trang",
            of: "trên",
            prev: "Trước",
            next: "Sau",
            noCourses: "Không tìm thấy khóa học",
            adjustFilter: "Hãy thử thay đổi bộ lọc hoặc chọn danh mục khác."
          }
        },
        leaderboard: {
          title: "Bảng xếp hạng",
          desc: "Học viên xuất sắc nhất tuần",
          loading: "Đang tải Bảng xếp hạng",
          fetching: "Đang lấy thông tin học viên xuất sắc...",
          error: "Lỗi",
          errorMsg: "Không thể tải dữ liệu bảng xếp hạng.",
          globalTitle: "Bảng Xếp Hạng Toàn Cầu",
          globalDesc: "Cạnh tranh với học viên trên toàn thế giới. Tích lũy XP bằng cách hoàn thành bài học và đạt điểm cao trong bài kiểm tra!",
          noActivity: "Chưa có hoạt động",
          beFirst: "Hãy là người đầu tiên kiếm XP trên nền tảng!",
          days: "ngày",
          streak: "chuỗi"
        },
        learning: {
          title: "Khóa học của tôi",
          eyebrow: "Tiếp tục nơi bạn dừng lại",
          heroTitle: "Không gian học tập cá nhân của bạn",
          heroDesc: "Theo dõi tiến độ, tiếp tục khóa học và làm các bài kiểm tra dựa trên hoạt động gần đây của bạn.",
          metrics: {
            total: "Đã đăng ký",
            ongoing: "Đang học",
            completed: "Đã hoàn thành"
          },
          enrolled: "Khóa học đã đăng ký",
          continue: "Tiếp tục học",
          progress: "Tiến độ",
          noCourses: "Chưa có khóa học nào",
          noCoursesMsg: "Bạn chưa đăng ký khóa học nào. Khám phá danh mục để bắt đầu."
        },
        testimonials: {
          badge: "HỌC VIÊN THÀNH CÔNG",
          title: "Đừng chỉ nghe chúng tôi nói",
          t1quote: "Nền tảng này đã hoàn toàn thay đổi sự nghiệp của tôi. Từ chỗ không biết gì về lập trình, chỉ sau 3 tháng tôi đã có việc làm đầu tiên.",
          t1role: "Lập trình viên @ TechStart",
          t2quote: "Giảng viên rất tận tâm, nội dung được cập nhật liên tục. Tôi đã hoàn thành khóa UI/UX và nhận được offer lương tốt hơn 40%.",
          t2role: "UX Designer @ Creative Hub",
          t3quote: "Khoản đầu tư tốt nhất tôi từng thực hiện. Khóa Khoa học Dữ liệu ở đây thực tế hơn bất cứ đâu.",
          t3role: "Chuyên viên phân tích dữ liệu @ FinTech Corp"
        },
      app: {
        unauthorized: {
          title: "Không có quyền truy cập",
          desc: "Bạn không đủ quyền hạn để xem trang này.",
          back: "Về trang chủ"
        }
      }
    }
  }
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
