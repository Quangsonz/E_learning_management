import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageShell,
  SectionLead,
  SkeletonGrid,
  EmptyState,
} from '../components/ui';
import { userApi } from '../services/user.api';

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
          <stop offset="0ea5e9" stop-color="#0ea5e9"/>
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

const CourseCard: React.FC<{ course: Course; onRemove: (id: string) => void }> = ({ course, onRemove }) => {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const navigate = useNavigate();

  return (
    <MotionDiv
      className="group relative flex flex-col justify-between bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-[380px]"
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
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
        
        {/* Category tag */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-slate-950/50 backdrop-blur-md px-2.5 py-1.5 rounded-full pointer-events-none">
          <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${course.accent}`} />
          {course.category}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(course.id)}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-950/50 backdrop-blur-md text-white/80 hover:text-rose-500 flex items-center justify-center transition-colors shadow-lg z-20"
          title="Remove from wishlist"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>

        {/* Discount badge */}
        {course.discountPercentage > 0 ? (
          <div className="absolute left-4 bottom-4 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
            -{course.discountPercentage}%
          </div>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-grow p-5 gap-3 justify-between">
        <div>
          <Link to={`/courses/${course.id}`} className="group-hover:text-primary-600 dark:group-hover:text-indigo-400 transition-colors">
            <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-slate-950 dark:text-white leading-snug">{course.title}</h3>
          </Link>
          
          {/* Instructor */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] font-black text-white shrink-0">
              {course.teacher[0] || 'T'}
            </div>
            <span className="text-xs text-slate-500 truncate">{course.teacher}</span>
          </div>
        </div>

        {/* Price & Action button */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-1 shrink-0">
          <div className="flex flex-col">
            <span className="text-base font-black text-slate-900 dark:text-white">
              {course.price === 0 ? 'Free' : `${Number(course.price || 0).toLocaleString('vi-VN')}đ`}
            </span>
            {course.discountPercentage > 0 ? (
              <span className="text-xs text-slate-400 line-through">
                {Number(course.estimatedPrice || 0).toLocaleString('vi-VN')}đ
              </span>
            ) : null}
          </div>

          <button
            onClick={() => navigate(`/checkout/${course.id}`)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
          >
            Đăng ký học
          </button>
        </div>
      </div>
    </MotionDiv>
  );
};

const Wishlist: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => userApi.getWishlist()
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
    teacher: course.instructor?.name || 'Unknown Instructor',
    role: course.instructor?.role || 'Instructor',
    category: course.category?.name || 'General',
    rating: course.averageRating || 5.0,
    ratingCount: '0',
    duration: '5h 30m',
    progress: 0,
    lessons: '10 lessons',
    accent: categoryAccent[course.category?.name || 'General'] || DEFAULT_ACCENT,
    image: course.thumbnailUrl || makeThumbnail(course.category?.name || 'Course'),
    price: Number(course.price) || 0,
    estimatedPrice: Number(course.estimatedPrice || course.price) || 0,
    discountPercentage: Number(course.discountPercentage) || 0
  });

  const courses: Course[] = useMemo(() => {
    if (!wishlistData?.data?.wishlist) return [];
    return wishlistData.data.wishlist.map(transformCourse);
  }, [wishlistData]);

  return (
    <PageShell wide>
      <div className="mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">My Wishlist</h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
          Quản lý danh sách các khóa học yêu thích của bạn. Đăng ký ngay hôm nay để bắt đầu hành trình học tập.
        </p>
      </div>

      <section className="mt-8 space-y-6">
        <SectionLead label="Saved Courses" title={`${courses.length} courses`} size="md" />
        
        {isLoading ? (
          <SkeletonGrid count={3} />
        ) : courses.length > 0 ? (
          <div className="grid gap-8 md:gap-x-6 md:gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onRemove={handleRemove} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your wishlist is empty"
            message="Bạn chưa lưu khóa học nào vào danh sách yêu thích. Khám phá các khóa học nổi bật của chúng tôi để bắt đầu."
            action={<Link to="/" className="btn btn-primary">Browse Courses</Link>}
          />
        )}
      </section>
    </PageShell>
  );
};

export default Wishlist;
