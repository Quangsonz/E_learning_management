import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageShell,
  SectionLead,
  SkeletonGrid,
  EmptyState,
  Button
} from '../components/ui';
import { userApi } from '../services/user.api';
import { courseApi } from '../services/course.api';
import { Star, Clock, BookOpen, Sparkles, Heart } from 'lucide-react';

type Course = {
  id: string;
  title: string;
  teacher: string;
  role: string;
  category: string;
  rating: number;
  ratingCount: string;
  duration: string;
  progress: number;
  lessons: string;
  accent: string;
  image: string;
  price: number;
  estimatedPrice: number;
  discountPercentage: number;
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

function makeThumbnail(label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="45%" stop-color="#0ea5e9"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="44" fill="url(#g)"/>
      <circle cx="640" cy="120" r="120" fill="rgba(255,255,255,0.12)"/>
      <circle cx="130" cy="390" r="150" fill="rgba(255,255,255,0.10)"/>
      <rect x="76" y="78" width="180" height="52" rx="26" fill="rgba(255,255,255,0.20)"/>
      <text x="106" y="112" font-family="Arial, sans-serif" font-size="28" fill="white">${label}</text>
      <text x="76" y="314" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="white">Modern Learning</text>
      <text x="76" y="372" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.82)">Curated course experience</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const categoryAccent: Record<string, string> = {
  Design:      'from-violet-500 to-fuchsia-500',
  Frontend:    'from-sky-500 to-cyan-400',
  Development: 'from-sky-500 to-cyan-400',
  Data:        'from-emerald-500 to-teal-400',
  Business:    'from-amber-500 to-orange-400',
  Marketing:   'from-rose-500 to-pink-500',
};
const DEFAULT_ACCENT = 'from-indigo-500 to-violet-400';

const WishlistCourseCard: React.FC<{ course: Course; onRemove: (id: string) => void }> = ({ course, onRemove }) => {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const navigate = useNavigate();

  return (
    <MotionDiv
      className="group relative flex flex-col justify-between bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 min-h-[420px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden bg-slate-800 shrink-0">
        {!thumbLoaded ? <div className="absolute inset-0 skeleton skeleton-card animate-pulse" /> : null}
        <Link to={`/courses/${course.id}`} className="block h-full w-full">
          <img
            src={course.image}
            alt={course.title}
            loading="lazy"
            onLoad={() => setThumbLoaded(true)}
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
        
        {/* Category tag */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none">
          <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${course.accent}`} />
          {course.category}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(course.id)}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-md text-white/80 hover:text-rose-500 flex items-center justify-center transition-colors shadow-lg z-20"
          title="Gỡ khỏi danh sách yêu thích"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>

        {/* Discount badge */}
        {course.discountPercentage > 0 ? (
          <div className="absolute left-4 bottom-4 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
            -{course.discountPercentage}% OFF
          </div>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-grow p-5 gap-4 justify-between">
        <div className="space-y-2">
          <Link to={`/courses/${course.id}`} className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <h3 className="line-clamp-2 text-base font-bold tracking-tight text-slate-950 dark:text-white leading-snug">{course.title}</h3>
          </Link>
          
          {/* Instructor & Rating Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                {course.teacher[0] || 'T'}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{course.teacher}</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
              <Star size={12} fill="currentColor" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Duration & Lessons meta */}
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={12} /> {course.lessons}
            </span>
          </div>
        </div>

        {/* Price & Enroll action */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-1 shrink-0">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {course.price === 0 ? 'Miễn phí' : `${Number(course.price || 0).toLocaleString('vi-VN')}đ`}
            </span>
            {course.discountPercentage > 0 ? (
              <span className="text-xs text-slate-400 line-through">
                {Number(course.estimatedPrice || 0).toLocaleString('vi-VN')}đ
              </span>
            ) : null}
          </div>

          <button
            onClick={() => navigate(`/checkout/${course.id}`)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95 shrink-0"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </MotionDiv>
  );
};

const Wishlist: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Fetch student's wishlist
  const { data: wishlistData, isLoading: isWishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => userApi.getWishlist()
  });

  // Fetch recommended top courses to fill empty space & boost conversions
  const { data: recommendedData, isLoading: isRecLoading } = useQuery({
    queryKey: ['recommended-courses'],
    queryFn: () => courseApi.getAllCourses({ limit: 4, sort: '-averageRating', status: 'published' })
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userApi.toggleWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const handleRemove = (id: string) => {
    removeMutation.mutate(id);
  };

  const transformCourse = (course: any): Course => ({
    id: course._id,
    title: course.title,
    teacher: course.instructor?.name || 'Giảng viên LMS',
    role: course.instructor?.role || 'Instructor',
    category: course.category?.name || 'General',
    rating: course.averageRating || 5.0,
    ratingCount: '0',
    duration: '12.5 giờ',
    progress: 0,
    lessons: '24 bài học',
    accent: categoryAccent[course.category?.name || 'General'] || DEFAULT_ACCENT,
    image: course.thumbnailUrl || makeThumbnail(course.category?.name || 'Course'),
    price: Number(course.price) || 0,
    estimatedPrice: Number(course.estimatedPrice || course.price) || 0,
    discountPercentage: Number(course.discountPercentage) || 0
  });

  const wishlistCourses: Course[] = useMemo(() => {
    if (!wishlistData?.data?.wishlist) return [];
    return wishlistData.data.wishlist.map(transformCourse);
  }, [wishlistData]);

  const recommendedCourses: Course[] = useMemo(() => {
    if (!recommendedData?.data?.courses) return [];
    return recommendedData.data.courses.map(transformCourse);
  }, [recommendedData]);

  return (
    <PageShell wide>
      <div className="flex flex-col gap-12 pb-16">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-wider mb-3">
            <Heart size={14} fill="currentColor" /> Personal Collection
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Danh sách Yêu thích
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
            Quản lý các khóa học bạn đã lưu. Đăng ký ngay hôm nay để bắt đầu nâng cao kỹ năng nghề nghiệp.
          </p>
        </div>

        {/* 1. Wishlist Section */}
        <section className="space-y-6">
          <SectionLead 
            label="Khóa học đã lưu" 
            title={`${wishlistCourses.length} khóa học trong danh sách`} 
            size="md" 
          />
          
          {isWishlistLoading ? (
            <SkeletonGrid count={3} />
          ) : wishlistCourses.length > 0 ? (
            <div className="grid gap-8 md:gap-x-6 md:gap-y-10 md:grid-cols-2 xl:grid-cols-3">
              {wishlistCourses.map((course) => (
                <WishlistCourseCard key={course.id} course={course} onRemove={handleRemove} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Danh sách yêu thích đang trống"
              message="Bạn chưa lưu khóa học nào vào danh sách yêu thích. Khám phá các khóa học nổi bật ngay bên dưới để bắt đầu học tập."
              action={
                <Link to="/courses">
                  <Button variant="pill" className="flex items-center gap-2">
                    <Sparkles size={16} /> Khám phá danh mục khóa học
                  </Button>
                </Link>
              }
            />
          )}
        </section>

        {/* 2. Recommended Courses Section ("Gợi ý dành riêng cho bạn") */}
        <section className="mt-8 pt-12 border-t border-slate-200 dark:border-white/10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={16} /> Course Recommendations
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Gợi ý dành riêng cho bạn
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Các khóa học được học viên đánh giá cao nhất trong hệ thống tuần này.
              </p>
            </div>

            <Link to="/courses">
              <Button variant="outline" size="sm">Xem tất cả khóa học →</Button>
            </Link>
          </div>

          {isRecLoading ? (
            <SkeletonGrid count={4} />
          ) : recommendedCourses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recommendedCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="group relative flex flex-col justify-between bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-800">
                    <Link to={`/courses/${course.id}`}>
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                    </Link>
                    <div className="absolute left-3 top-3 text-[10px] font-black uppercase text-white bg-black/60 px-2 py-1 rounded-full">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                    <div className="space-y-1.5">
                      <Link to={`/courses/${course.id}`}>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 transition-colors">
                          {course.title}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate">{course.teacher}</span>
                        <span className="font-bold text-amber-500 flex items-center gap-1">
                          <Star size={11} fill="currentColor" /> {course.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/5">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`}
                      </span>
                      <button
                        onClick={() => navigate(`/checkout/${course.id}`)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Đăng ký
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </PageShell>
  );
};

export default Wishlist;
