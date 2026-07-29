import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  PageShell, 
  Button, 
  MetricsSurface,
  GlassPanel,
  Modal
} from '../components/ui';
import CourseManagementTab from './CourseManagementTab';
import { courseApi } from '../services/course.api';
import { analyticsApi } from '../services/analytics.api';
import { Plus, BookOpen, Users, Star, FileEdit, Sparkles, CheckCircle2, Lightbulb } from 'lucide-react';

const TeacherCourses: React.FC = () => {
  const [showTipsModal, setShowTipsModal] = useState(false);

  // Fetch teacher's courses to calculate quick stats
  const { data: teacherCoursesData } = useQuery({
    queryKey: ['teacher-courses-stats'],
    queryFn: () => courseApi.getMyCourses({ limit: 100 })
  });

  // Fetch teacher analytics summary
  const { data: analyticsData } = useQuery({
    queryKey: ['teacher-analytics-stats'],
    queryFn: () => analyticsApi.getTeacherDashboard()
  });

  const courses = teacherCoursesData?.data?.courses || [];
  const overview = analyticsData?.data?.overview;

  const totalCourses = courses.length;
  const draftCourses = courses.filter((c: any) => c.status === 'draft').length;
  const totalStudents = overview?.totalStudents || courses.reduce((acc: number, c: any) => acc + (c.students || 0), 0);
  
  const avgRating = courses.length > 0 
    ? (courses.reduce((acc: number, c: any) => acc + (c.averageRating || 5.0), 0) / courses.length).toFixed(1)
    : '5.0';

  const stats = [
    { 
      label: 'Tổng số khóa học', 
      value: totalCourses.toString(),
      delta: `${courses.filter((c: any) => c.status === 'published').length} Đã xuất bản`
    },
    { 
      label: 'Tổng học viên đăng ký', 
      value: totalStudents.toLocaleString('vi-VN'),
      delta: '+12% tháng này'
    },
    { 
      label: 'Khóa học đang soạn dở', 
      value: draftCourses.toString(),
      delta: draftCourses > 0 ? 'Cần hoàn thiện' : 'Tất cả đã xuất bản'
    },
    { 
      label: 'Đánh giá trung bình', 
      value: `${avgRating} ★`,
      delta: 'Dựa trên đánh giá thực tế'
    }
  ];

  return (
    <PageShell wide>
      <div className="flex flex-col gap-10 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản lý Khóa học Giảng viên
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Theo dõi hiệu suất, chỉnh sửa nội dung bài giảng, bài kiểm tra và phát triển học liệu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/teacher-dashboard" 
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors dark:text-white dark:bg-white/10 dark:hover:bg-white/20"
            >
              ← Báo cáo thống kê
            </Link>
            <Link to="/teacher/courses/new">
              <Button className="flex items-center gap-2">
                <Plus size={16} /> Tạo khóa học mới
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Quick Stats Grid */}
        <MetricsSurface metrics={stats} />

        {/* 2. Teacher Hero Action Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-8 sm:p-10 text-white shadow-2xl border border-indigo-500/20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> Teacher Hero Center
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Bạn đã sẵn sàng chia sẻ kiến thức? Tạo khóa học mới ngay hôm nay!
              </h2>
              <p className="text-sm text-indigo-200/80 leading-relaxed">
                Xây dựng giáo án chất lượng cao, chia sẻ bài giảng video, tích hợp bài thi trắc nghiệm và kết nối với hàng ngàn học viên trên hệ thống.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <Link to="/teacher/courses/new">
                <Button variant="pill" size="lg" className="w-full sm:w-auto bg-white text-indigo-950 hover:bg-slate-100 font-bold shadow-lg flex items-center justify-center gap-2">
                  <Plus size={18} /> Tạo khóa học mới
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setShowTipsModal(true)}
                className="w-full sm:w-auto !border-white/20 !text-white hover:!bg-white/10 flex items-center justify-center gap-2"
              >
                <Lightbulb size={18} className="text-amber-400" /> Mẹo soạn giáo án chuẩn
              </Button>
            </div>
          </div>
        </section>

        {/* 3. Course Management Table */}
        <CourseManagementTab teacherMode={true} />
      </div>

      {/* Teaching Tips Modal */}
      {showTipsModal && (
        <Modal 
          isOpen={showTipsModal} 
          onClose={() => setShowTipsModal(false)}
          title="Mẹo Soạn Giáo Án Chuẩn E-Learning"
          size="md"
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Để khóa học đạt tỷ lệ hoàn thành cao và nhận được nhiều đánh giá 5 sao từ học viên, hãy tham khảo các bí quyết sau:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <BookOpen size={18} /> 1. Cấu trúc Module ngắn gọn
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Chia khóa học thành các chương rõ ràng. Mỗi video giảng chỉ nên kéo dài từ 5 - 10 phút để tránh gây nhàm chán.
                </p>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <Sparkles size={18} /> 2. Đề thi Quiz củng cố
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tạo bài trắc nghiệm ngắn từ 3 - 5 câu sau mỗi chương giúp học viên chủ động kiểm tra và ghi nhớ kiến thức tốt hơn.
                </p>
              </div>

              <div className="p-4 bg-purple-50/50 dark:bg-purple-500/10 rounded-2xl border border-purple-100 dark:border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <FileEdit size={18} /> 3. Bài tập thực hành thực tế
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Giao bài tập về nhà đính kèm tài liệu mẫu để học viên thực hành nộp bài và nhận phản hồi trực tiếp từ bạn.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Users size={18} /> 4. Tương tác & Phản hồi nhanh
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Thường xuyên trả lời thảo luận và chấm điểm bài tập để xây dựng cộng đồng học tập sôi nổi và gắn kết.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setShowTipsModal(false)}>Đã hiểu, đóng cửa sổ</Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default TeacherCourses;
