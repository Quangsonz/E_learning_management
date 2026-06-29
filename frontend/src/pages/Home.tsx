import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { enrollmentApi } from '../services/enrollment.api';
import { courseApi, CourseData } from '../services/course.api';
import { selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

// =====================================================================
// CONSTANTS
// =====================================================================

const CATEGORIES = [
  { emoji: '💻', label: 'Programming', color: 'from-blue-600/20 to-blue-500/10 border-blue-500/30 text-blue-400' },
  { emoji: '🎨', label: 'Design', color: 'from-pink-600/20 to-pink-500/10 border-pink-500/30 text-pink-400' },
  { emoji: '📊', label: 'Data Science', color: 'from-violet-600/20 to-violet-500/10 border-violet-500/30 text-violet-400' },
  { emoji: '🚀', label: 'Business', color: 'from-amber-600/20 to-amber-500/10 border-amber-500/30 text-amber-400' },
  { emoji: '🌐', label: 'Marketing', color: 'from-emerald-600/20 to-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { emoji: '🤖', label: 'AI & ML', color: 'from-cyan-600/20 to-cyan-500/10 border-cyan-500/30 text-cyan-400' },
  { emoji: '📷', label: 'Photography', color: 'from-rose-600/20 to-rose-500/10 border-rose-500/30 text-rose-400' },
  { emoji: '🎵', label: 'Music', color: 'from-orange-600/20 to-orange-500/10 border-orange-500/30 text-orange-400' },
];

const TESTIMONIALS = [
  {
    quote: 'Nền tảng này đã hoàn toàn thay đổi sự nghiệp của tôi. Từ chỗ không biết gì về lập trình, chỉ sau 3 tháng tôi đã có việc làm đầu tiên.',
    name: 'Nguyễn Minh Tú',
    role: 'Junior Developer @ TechStart',
    avatar: 'NMT',
    rating: 5,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    quote: 'Giảng viên rất tận tâm, nội dung được cập nhật liên tục. Tôi đã hoàn thành khóa UI/UX và nhận được offer lương tốt hơn 40%.',
    name: 'Lê Thị Phương',
    role: 'UX Designer @ Creative Hub',
    avatar: 'LTP',
    color: 'from-pink-500 to-rose-500',
    rating: 5,
  },
  {
    quote: 'Đầu tư tốt nhất tôi từng làm. Khóa Data Science ở đây thực tiễn hơn bất kỳ nơi nào khác tôi từng thử.',
    name: 'Trần Văn Đức',
    role: 'Data Analyst @ FinTech Corp',
    avatar: 'TVD',
    color: 'from-violet-500 to-purple-500',
    rating: 5,
  },
];

// =====================================================================
// COUNTDOWN HOOK
// =====================================================================

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

// =====================================================================
// SUBCOMPONENTS
// =====================================================================

const StarRating = ({ rating = 5 }: { rating?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[56px] text-center">
      <span className="text-3xl font-black text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs text-white/70 font-bold uppercase tracking-widest mt-1">{label}</span>
  </div>
);

const AnimatedStat = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center px-8">
      <span className="text-5xl lg:text-6xl font-black text-white tabular-nums">
        {display.toLocaleString()}{suffix}
      </span>
      <span className="mt-2 text-base text-slate-400 font-medium">{label}</span>
    </div>
  );
};

const CourseCard = ({ course }: { course: CourseData }) => {
  const navigate = useNavigate();
  const originalPrice = course.price ? (course.price * 2).toFixed(0) : null;
  return (
    <motion.div
      className="group relative bg-[#161b22] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:border-indigo-500/40 transition-all duration-300"
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(99,102,241,0.15)' }}
      onClick={() => navigate(`/courses/${course._id}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-800">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-slate-900">
            <svg className="w-12 h-12 text-indigo-400/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
        )}
        {course.price === 0 && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide">Free</div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {course.category && (
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full w-fit">
            {course.category.name}
          </span>
        )}
        <h3 className="font-bold text-white leading-snug line-clamp-2 text-[15px] group-hover:text-indigo-300 transition-colors">
          {course.title}
        </h3>
        <div className="flex items-center gap-2 mt-auto">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black text-white">
            {course.instructor?.name?.[0] || 'T'}
          </div>
          <span className="text-xs text-slate-400 truncate">{course.instructor?.name || 'Instructor'}</span>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(course.averageRating || 4)} />
          <span className="text-sm font-bold text-amber-400">{(course.averageRating || 4.8).toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            {course.price === 0 ? (
              <span className="text-xl font-black text-emerald-400">Free</span>
            ) : (
              <>
                {originalPrice && <span className="text-sm text-slate-500 line-through">${originalPrice}</span>}
                <span className="text-xl font-black text-white">${course.price}</span>
              </>
            )}
          </div>
          <button
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors"
            onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course._id}`); }}
          >
            Enroll
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================================
// MAIN HOME COMPONENT
// =====================================================================

const Home: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  // Sale countdown — 23:59:59 from page load
  const [saleEnd] = useState(() => new Date(Date.now() + 23 * 3600000 + 59 * 60000 + 59000));
  const countdown = useCountdown(saleEnd);

  // Active category filter
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch public courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['home-courses', activeCategory],
    queryFn: () => courseApi.getAllCourses({ status: 'published', limit: 8, ...(activeCategory ? { category: activeCategory } : {}) }),
    staleTime: 60000,
  });

  // Fetch enrolled courses if logged in
  const { data: enrollmentsData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments(),
    enabled: isAuthenticated,
  });

  const courses: CourseData[] = coursesData?.data?.courses || [];
  const enrollments = (enrollmentsData as any)?.enrollments || (enrollmentsData as any)?.data?.enrollments || [];

  return (
    <div className="min-h-screen bg-[#080d18] text-white overflow-x-hidden">

      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-900/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-900/25 blur-[100px]" />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-900/20 blur-[80px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 w-full pt-24 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left — Text Content */}
            <div className="flex-1 max-w-2xl">
              {/* Flash Sale Badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-8"
              >
                <span className="text-lg">🔥</span>
                <span className="text-sm font-bold text-orange-300">Flash Sale</span>
                <span className="text-sm text-orange-400/80">—</span>
                <span className="text-sm font-black text-orange-300">Giảm đến 60% hôm nay!</span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              >
                Nắm vững kỹ năng mới,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
                  thay đổi sự nghiệp.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-slate-300 leading-relaxed mb-10 max-w-[42ch]"
              >
                Hơn 50.000 học viên đã tin tưởng. Khóa học được thiết kế bởi chuyên gia — thực tiễn, cập nhật, và hiệu quả ngay từ bài đầu tiên.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-4 items-center"
              >
                <button
                  onClick={() => navigate('/courses')}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl font-bold text-lg text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] transition-all duration-300 active:scale-95"
                >
                  <span>Khám phá khóa học</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>

                {isAuthenticated && enrollments.length > 0 ? (
                  <button
                    onClick={() => navigate(`/courses/${enrollments[0]?.course?._id || enrollments[0]?.course}/learn`)}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white border border-white/20 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    <span>Tiếp tục học</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/register')}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white border border-white/20 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                  >
                    <span>Đăng ký miễn phí</span>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </button>
                )}
              </motion.div>

              {/* Trust Pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3 mt-8"
              >
                {['✓ Truy cập trọn đời', '✓ Chứng chỉ hoàn thành', '✓ Hỗ trợ 24/7'].map(text => (
                  <span key={text} className="text-sm text-slate-400 font-medium">{text}</span>
                ))}
              </motion.div>
            </div>

            {/* Right — Floating Course Cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 relative w-full max-w-[420px] hidden lg:block"
            >
              {/* Card Stack */}
              <div className="relative h-[520px]">
                {/* Card 1 — top right */}
                <div className="absolute top-0 right-0 w-[280px] bg-[#161b2e] border border-indigo-500/30 rounded-2xl p-5 shadow-[0_20px_60px_rgba(99,102,241,0.2)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl">💻</div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Programming</p>
                      <p className="text-sm font-bold text-white">Python Mastery</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full" style={{width:'72%'}} />
                  </div>
                  <p className="text-xs text-slate-400">72% hoàn thành</p>
                </div>

                {/* Card 2 — middle left */}
                <div className="absolute top-[160px] left-0 w-[260px] bg-[#1a1625] border border-pink-500/30 rounded-2xl p-5 shadow-[0_20px_60px_rgba(236,72,153,0.15)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xl">🎨</div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Design</p>
                      <p className="text-sm font-bold text-white">UI/UX Masterclass</p>
                    </div>
                  </div>
                  <StarRating rating={5} />
                  <p className="text-xs text-slate-400 mt-1">4.9 · 2.4k đánh giá</p>
                </div>

                {/* Card 3 — bottom right */}
                <div className="absolute bottom-0 right-0 w-[270px] bg-[#131a2e] border border-violet-500/30 rounded-2xl p-5 shadow-[0_20px_60px_rgba(139,92,246,0.15)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl">📊</div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Data Science</p>
                      <p className="text-sm font-bold text-white">ML & Deep Learning</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-400 text-sm line-through">$99</span>
                    <span className="text-xl font-black text-white">$39</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">-61%</span>
                  </div>
                </div>

                {/* Glow orbs behind cards */}
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PROMO BANNER
      ================================================================ */}
      <section className="relative py-8 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-8 md:p-10"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
            />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <span className="text-sm font-black text-white/80 uppercase tracking-widest">Ưu đãi giới hạn</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  Mua 1 tặng 1 — Học cùng bạn bè!
                </h2>
                <p className="text-white/80 mt-1 font-medium">Mua bất kỳ khóa học nào, nhận thêm 1 code tặng bạn. Hết hạn sau:</p>
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-3">
                <CountdownBlock value={countdown.hours} label="Giờ" />
                <span className="text-2xl font-black text-white/60 mb-4">:</span>
                <CountdownBlock value={countdown.minutes} label="Phút" />
                <span className="text-2xl font-black text-white/60 mb-4">:</span>
                <CountdownBlock value={countdown.seconds} label="Giây" />
              </div>

              <button
                onClick={() => navigate('/courses')}
                className="flex-shrink-0 px-8 py-4 bg-white rounded-2xl font-black text-red-600 hover:bg-orange-50 transition-colors shadow-lg text-lg active:scale-95"
              >
                Nhận ưu đãi ngay →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          CATEGORIES
      ================================================================ */}
      <section className="py-16 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-2">Danh mục</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Khám phá theo chủ đề</h2>
          </div>
        </motion.div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full font-bold text-sm border transition-all ${!activeCategory ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
          >
            Tất cả
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border transition-all bg-gradient-to-r ${cat.color} ${activeCategory === cat.label ? 'ring-2 ring-white/30 scale-105' : 'hover:scale-105'}`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURED COURSES
      ================================================================ */}
      <section className="pb-16 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-2">
              {activeCategory ? activeCategory : 'Nổi bật'}
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {activeCategory ? `Khóa học ${activeCategory}` : 'Khóa học phổ biến nhất'}
            </h2>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2 text-sm group"
          >
            Xem tất cả
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </motion.div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#161b22] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-700/50" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-700/50 rounded-full w-1/3" />
                  <div className="h-4 bg-slate-700/50 rounded-full" />
                  <div className="h-4 bg-slate-700/50 rounded-full w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-xl font-bold">Chưa có khóa học nào được xuất bản.</p>
            <p className="text-sm mt-2">Giảng viên đang chuẩn bị nội dung — quay lại sớm nhé!</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {courses.map((course, i) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ================================================================
          RESUME LEARNING (nếu đã đăng nhập)
      ================================================================ */}
      {isAuthenticated && enrollments.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-2">Của bạn</p>
              <h2 className="text-3xl md:text-4xl font-black text-white">
                Chào lại, {user?.name?.split(' ').slice(-1)[0] || 'bạn'}! 👋
              </h2>
              <p className="text-slate-400 mt-2">Tiếp tục hành trình học tập của bạn.</p>
            </motion.div>

            <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
              {enrollments.slice(0, 4).map((enr: any, i: number) => {
                const courseId = enr.course?._id || enr.course;
                const title = enr.course?.title || 'Khóa học';
                return (
                  <motion.div
                    key={enr._id || i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-shrink-0 w-[320px] bg-[#161b22] border border-white/[0.06] rounded-2xl p-6 hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl">
                        📚
                      </div>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">Đang học</span>
                    </div>
                    <h3 className="font-bold text-white text-base leading-snug mb-4 line-clamp-2">{title}</h3>
                    <button
                      onClick={() => navigate(`/courses/${courseId}/learn`)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-sm font-bold text-indigo-300 transition-all group-hover:border-indigo-400/50"
                    >
                      <span>Tiếp tục học</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================
          STATS
      ================================================================ */}
      <section className="py-20 border-t border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-center divide-y md:divide-y-0 md:divide-x divide-white/10 gap-0">
            <AnimatedStat value={50000} suffix="+" label="Học viên đã tin tưởng" />
            <AnimatedStat value={200} suffix="+" label="Khóa học chuyên gia" />
            <AnimatedStat value={98} suffix="%" label="Học viên hài lòng" />
            <AnimatedStat value={4.9} suffix="★" label="Điểm đánh giá trung bình" />
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS
      ================================================================ */}
      <section className="py-20 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-3">Học viên nói gì</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">Thay đổi thật sự từ học viên thật</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-[#161b22] border border-white/[0.06] rounded-2xl p-7 hover:border-white/15 transition-colors"
            >
              {/* Quote mark */}
              <div className="text-5xl text-white/10 font-black leading-none mb-3">"</div>
              <p className="text-slate-300 leading-relaxed text-[15px] mb-6">
                {t.quote}
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-black text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
                <div className="ml-auto">
                  <StarRating rating={t.rating} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================================================================
          CTA BOTTOM SECTION
      ================================================================ */}
      <section className="py-24 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden text-center py-20 px-8"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900" />
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/20 blur-[80px] rounded-full" />

          <div className="relative z-10">
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Bắt đầu ngay hôm nay</p>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Đầu tư vào bản thân —<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">bắt đầu ngay hôm nay.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Hàng trăm khóa học đang chờ bạn. Không cần kinh nghiệm, không cần thẻ tín dụng để thử.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/courses')}
                className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl font-black text-xl text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-all active:scale-95"
              >
                Bắt đầu học miễn phí
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/login')}
                  className="px-10 py-5 rounded-2xl font-bold text-xl text-white border border-white/20 hover:bg-white/10 transition-all"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Home;
