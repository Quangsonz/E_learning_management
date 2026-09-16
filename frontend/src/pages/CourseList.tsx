import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Button,
  CanvasHero,
  EmptyState,
  FilterBar,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonGrid
} from '../components/ui';
import { Input } from '../components/ui/Input';
import { courseApi } from '../services/course.api';
import { categoryApi } from '../services/category.api';
import { enrollmentApi } from '../services/enrollment.api';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { floatY } from '../animations/motionVariants';
import { useLocalizedValue } from '../utils/localized';

type Course = {
  id: string;
  title: string;
  teacher: string;
  teacherAvatar?: string;
  role: string;
  category: string;
  categorySlug?: string;
  rating: number;
  ratingCount: string;
  duration: string;
  lessons: string;
  lessonsCount: number;
  studentsCount: number;
  price: number;
  estimatedPrice?: number;
  discountPercentage?: number;
  accent: string;
  image: string;
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  'web-development': '💻',
  'data-science-and-ai': '🤖',
  'mobile-app-development': '📱',
  'cloud-and-devops': '☁️',
  'cyber-security': '🛡️',
  'uiux-design': '🎨',
  'digital-marketing': '🌐',
  'business-and-management': '🚀',
  'database-administration': '🗄️',
  'game-development': '🎮',
};

function getCategoryEmoji(slug?: string, name?: string): string {
  if (slug && CATEGORY_EMOJI_MAP[slug]) return CATEGORY_EMOJI_MAP[slug];
  const lower = (slug || name || '').toLowerCase();
  if (lower.includes('web')) return '💻';
  if (lower.includes('data') || lower.includes('ai') || lower.includes('dữ liệu')) return '🤖';
  if (lower.includes('mobile') || lower.includes('app') || lower.includes('di động')) return '📱';
  if (lower.includes('cloud') || lower.includes('devops') || lower.includes('đám mây')) return '☁️';
  if (lower.includes('security') || lower.includes('cyber') || lower.includes('bảo mật') || lower.includes('an ninh')) return '🛡️';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('thiết kế')) return '🎨';
  if (lower.includes('market') || lower.includes('seo') || lower.includes('tiếp thị')) return '🌐';
  if (lower.includes('business') || lower.includes('manage') || lower.includes('kinh doanh') || lower.includes('quản lý')) return '🚀';
  if (lower.includes('database') || lower.includes('sql') || lower.includes('cơ sở dữ liệu')) return '🗄️';
  if (lower.includes('game') || lower.includes('trò chơi')) return '🎮';
  return '📚';
}

const getCategoryAccent = (catName: string): string => {
  const lower = catName.toLowerCase();
  if (lower.includes('web') || lower.includes('dev')) return 'from-sky-500 to-cyan-400';
  if (lower.includes('data') || lower.includes('ai')) return 'from-indigo-500 to-violet-500';
  if (lower.includes('mobile') || lower.includes('app')) return 'from-blue-500 to-indigo-400';
  if (lower.includes('cloud') || lower.includes('devops')) return 'from-cyan-500 to-teal-400';
  if (lower.includes('security') || lower.includes('cyber')) return 'from-emerald-500 to-teal-400';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return 'from-pink-500 to-rose-400';
  if (lower.includes('market') || lower.includes('seo')) return 'from-rose-500 to-amber-500';
  if (lower.includes('business') || lower.includes('manage')) return 'from-amber-500 to-orange-400';
  if (lower.includes('database') || lower.includes('sql')) return 'from-purple-500 to-indigo-500';
  if (lower.includes('game')) return 'from-violet-500 to-fuchsia-500';
  return 'from-indigo-500 to-violet-400';
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const svgThumbCache = new Map<string, string>();

function makeThumbnail(label: string) {
  if (svgThumbCache.has(label)) return svgThumbCache.get(label)!;
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

  const result = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  svgThumbCache.set(label, result);
  return result;
}

const CourseCard: React.FC<{ course: Course; isEnrolled?: boolean }> = ({ course, isEnrolled }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const originalPrice = course.discountPercentage && course.discountPercentage > 0 && course.estimatedPrice ? course.estimatedPrice : null;

  return (
    <MotionDiv
      className="group relative flex flex-col justify-between bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden p-3 hover:border-indigo-500/40 hover:shadow-2xl transition-all duration-300 min-h-[440px] cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(isEnrolled ? `/courses/${course.id}/learn` : `/courses/${course.id}`)}
    >
      <div>
        {/* Glow background behind image on hover */}
        <div className={`absolute -inset-4 z-0 rounded-[3rem] bg-gradient-to-br ${course.accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-[0.14] pointer-events-none`} />

        {/* Thumbnail Image Container */}
        <div className="relative z-10 overflow-hidden rounded-2xl aspect-[16/10] bg-slate-800 shadow-sm">
          {!thumbLoaded && <div className="absolute inset-0 skeleton skeleton-card" />}
          <img
            src={course.image}
            alt={course.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setThumbLoaded(true)}
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute left-3.5 top-3.5 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5 shadow-sm">
              <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${course.accent}`} />
              {course.category}
            </span>
          </div>

          <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
            {isEnrolled ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                ✓ {t('courses.card.enrolled', 'Đang học')}
              </span>
            ) : course.price === 0 ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-white bg-emerald-600 px-3 py-1 rounded-full shadow-sm">
                {t('courses.card.free', 'Free')}
              </span>
            ) : course.discountPercentage && course.discountPercentage > 0 ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-white bg-rose-500 px-3 py-1 rounded-full shadow-sm">
                -{course.discountPercentage}%
              </span>
            ) : null}
          </div>

          {/* Bottom Thumbnail Overlay Metadata (Clean single-line row, NO stacked overlapping text!) */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-semibold pointer-events-none">
            <div className="flex items-center gap-2 text-white/90">
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px]">
                <span>📚</span> {course.lessons}
              </span>
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px]">
                <span>⏱️</span> {course.duration}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-amber-300 font-bold text-[11px]">
              <span>★</span> {course.rating.toFixed(1)} <span className="text-white/60 font-normal text-[10px]">({course.ratingCount})</span>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-3 pt-4 space-y-3">
          <h3 className="line-clamp-2 text-base font-bold tracking-tight text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-black text-white">
                {course.teacherAvatar ? (
                  <img src={course.teacherAvatar} alt={course.teacher} className="h-full w-full object-cover" />
                ) : (
                  course.teacher[0] || 'U'
                )}
              </div>
              <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{course.teacher}</p>
            </div>
            {course.studentsCount > 0 && (
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                👥 {course.studentsCount.toLocaleString()} {t('courses.card.students', 'học viên')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Real Price & Action Button (Replaces fake progress bars) */}
      <div className="p-3 pt-0 mt-auto">
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 gap-2">
          <div className="flex flex-col min-w-0">
            {originalPrice && (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 line-through leading-none mb-1">
                {Number(originalPrice).toLocaleString('vi-VN')}đ
              </span>
            )}
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {course.price === 0 ? t('courses.card.free', 'Miễn phí') : `${Number(course.price || 0).toLocaleString('vi-VN')}đ`}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(isEnrolled ? `/courses/${course.id}/learn` : `/courses/${course.id}`);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all shadow-sm active:scale-95 ${
              isEnrolled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
            }`}
          >
            {isEnrolled ? t('courses.card.continue', 'Vào học ngay') : t('courses.card.viewCourse', 'Xem khóa học')}
          </button>
        </div>
      </div>
    </MotionDiv>
  );
};

const CourseList: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('-createdAt');
  const [page, setPage] = useState(1);

  // Fetch real categories from database
  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAllCategories(),
    staleTime: 1000 * 60 * 30
  });
  const categories = categoryData?.data?.categories || [];

  // Fetch enrollments if user is authenticated to identify enrolled courses
  const { data: enrollmentsData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
  const enrolledCourseIds = useMemo(() => {
    const list = (enrollmentsData as any)?.enrollments || (enrollmentsData as any)?.data?.enrollments || [];
    return new Set(list.map((e: any) => e.course?._id || e.course));
  }, [enrollmentsData]);

  const isFiltered = Boolean(debouncedQuery || activeCategoryId || priceType !== 'all' || minRating > 0 || sortBy !== '-createdAt');

  const filterParams = {
    search: debouncedQuery || undefined,
    category: activeCategoryId || undefined,
    priceType: priceType !== 'all' ? priceType : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    sort: sortBy,
    status: 'published'
  };

  // Top 3 popular standout courses for catalog hero highlight
  const { data: popData, isLoading: popLoading } = useQuery({
    queryKey: ['courses-popular-top3'],
    queryFn: () => courseApi.getAllCourses({ status: 'published', page: 1, limit: 3, sort: '-averageRating' }),
    staleTime: 1000 * 60 * 10,
    enabled: !isFiltered
  });

  // Main paginated catalog query
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['courses', debouncedQuery, activeCategoryId, priceType, minRating, sortBy, page],
    queryFn: () => courseApi.getAllCourses({ ...filterParams, page, limit: 12 }),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true
  });

  const totalCourses = responseData?.data?.total || 0;
  const totalPages = responseData?.data?.totalPages || 1;

  const transformCourse = (course: any): Course => {
    const catName = lv(course.category?.name) || 'General';
    const rawLessons = course.lessonsCount || (Array.isArray(course.lessons) ? course.lessons.length : 0) || 12;
    const durationHours = course.duration ? Math.round((course.duration / 60) * 10) / 10 : Math.round(rawLessons * 0.75);

    return {
      id: course._id,
      title: lv(course.title),
      teacher: course.instructor?.name || 'Giảng viên',
      teacherAvatar: course.instructor?.avatar,
      role: course.instructor?.role || 'Instructor',
      category: catName,
      categorySlug: course.category?.slug,
      rating: Number(course.averageRating || 5.0),
      ratingCount: course.reviewCount ? String(course.reviewCount) : '12',
      duration: `${durationHours} ${t('common.hours', 'giờ')}`,
      lessons: `${rawLessons} ${t('courses.metrics.lessons', 'bài học')}`,
      lessonsCount: rawLessons,
      studentsCount: course.studentsCount || 0,
      price: course.price ?? 0,
      estimatedPrice: course.estimatedPrice,
      discountPercentage: course.discountPercentage,
      accent: getCategoryAccent(catName),
      image: course.thumbnailUrl || makeThumbnail(catName)
    };
  };

  const allCourses: Course[] = useMemo(() => {
    if (!responseData?.data?.courses) return [];
    return responseData.data.courses.map(transformCourse);
  }, [responseData]);

  const popularStandouts: Course[] = useMemo(() => {
    if (!popData?.data?.courses) return [];
    return popData.data.courses.map(transformCourse);
  }, [popData]);

  const activeCategoryObj = categories.find((c) => c._id === activeCategoryId);
  const activeCategoryName = activeCategoryObj ? lv(activeCategoryObj.name) : null;

  const catalogMetrics = useMemo(() => [
    { label: t('courses.metrics.activeLearners'), value: '24.8k' },
    { label: t('courses.metrics.availableCourses'), value: String(totalCourses || 54) },
    { label: t('courses.metrics.weeklyCompletion'), value: '86%' },
    { label: t('courses.metrics.avgRating'), value: '4.9' }
  ], [t, totalCourses]);

  const handleNextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setPage(p => Math.max(p - 1, 1));

  return (
    <PageShell wide>
      {/* Hero Section */}
      <CanvasHero
        badge={<div className="badge">{t('courses.hero.badge')}</div>}
        eyebrow={t('courses.hero.eyebrow')}
        title={t('courses.hero.title')}
        description={t('courses.hero.desc')}
        glow="cool"
        aside={
          <MotionDiv className="mx-auto max-w-[260px] lg:-ml-12" animate={floatY(6, 5.8)}>
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-2xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">{t('courses.hero.discover')}</p>
              <h2 className="mt-2 text-lg font-black tracking-tight">{t('courses.hero.title2')}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {t('courses.hero.desc2')}
              </p>
              <div className="mt-4 flex flex-col gap-2.5 text-xs font-semibold text-slate-200">
                {[
                  { icon: '🎓', textKey: 'courses.hero.features.f1' },
                  { icon: '♾️', textKey: 'courses.hero.features.f2' },
                  { icon: '👨‍🏫', textKey: 'courses.hero.features.f3' },
                  { icon: '💼', textKey: 'courses.hero.features.f4' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5">
                    <span className="text-sm">{item.icon}</span>
                    <span>{t(item.textKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionDiv>
        }
      />

      {/* Dynamic Metrics */}
      <MetricsSurface metrics={catalogMetrics} />

      {/* Structured Ergonomic Filter Bar */}
      <FilterBar>
        <div className="flex flex-col gap-4">
          {/* Top: Search bar with full width & clean icon */}
          <div className="relative">
            <Input
              type="text"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={t('courses.filter.search')}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              onClear={() => { setQuery(''); setPage(1); }}
              className="w-full text-sm"
            />
          </div>

          {/* Middle: Horizontal Category Scroll with Dynamic Emojis (No squished 3-line clump!) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 hide-scrollbar -mx-1 px-1">
            <button
              type="button"
              onClick={() => { setActiveCategoryId(''); setPage(1); }}
              className={`px-4 py-2 rounded-full font-bold text-xs shrink-0 transition-all active:scale-95 ${
                !activeCategoryId
                  ? 'bg-indigo-600 border border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                  : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-white shadow-sm'
              }`}
            >
              {t('home.categories.all', 'Tất cả')}
            </button>
            {categories.map((cat) => {
              const isActive = activeCategoryId === cat._id;
              const catName = lv(cat.name);
              const emoji = getCategoryEmoji(cat.slug, catName);
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => { setActiveCategoryId(isActive ? '' : cat._id); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shrink-0 transition-all active:scale-95 ${
                    isActive
                      ? 'bg-indigo-600 border border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                      : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-white shadow-sm'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom: Price, Rating, Sort & Reset Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60 dark:border-white/5 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Price Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">{t('courses.filter.price', 'Giá')}:</span>
                {(['all', 'free', 'paid'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPriceType(p); setPage(1); }}
                    className={`px-3 py-1 rounded-full font-semibold transition-all text-xs active:scale-95 ${
                      priceType === p
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p === 'all' ? t('courses.filter.allPrices', 'Tất cả') : p === 'free' ? t('courses.filter.free', 'Miễn phí') : t('courses.filter.paid', 'Có phí')}
                  </button>
                ))}
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">{t('courses.filter.rating', 'Đánh giá')}:</span>
                {[
                  { label: t('courses.filter.allRatings', 'Tất cả'), value: 0 },
                  { label: '★ 4.0+', value: 4 },
                  { label: '★ 3.0+', value: 3 }
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { setMinRating(r.value); setPage(1); }}
                    className={`px-3 py-1 rounded-full font-semibold transition-all text-xs active:scale-95 ${
                      minRating === r.value
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Sort order & Reset button */}
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                aria-label={t('courses.filter.sortBy', 'Sắp xếp theo')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="-createdAt">{t('courses.filter.sortNewest', 'Mới nhất')}</option>
                <option value="-averageRating">{t('courses.filter.sortRating', 'Đánh giá cao nhất')}</option>
                <option value="price">{t('courses.filter.sortPriceAsc', 'Giá thấp đến cao')}</option>
                <option value="-price">{t('courses.filter.sortPriceDesc', 'Giá cao đến thấp')}</option>
              </select>

              {isFiltered && (
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveCategoryId('');
                    setPriceType('all');
                    setMinRating(0);
                    setSortBy('-createdAt');
                    setPage(1);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 transition-colors"
                >
                  ✕ {t('courses.filter.reset', 'Đặt lại')}
                </button>
              )}
            </div>
          </div>
        </div>
      </FilterBar>

      {/* Catalog Display: Filtered Results OR Structured Featured + All Catalog */}
      {isFiltered ? (
        /* Filtered Search & Category Results */
        <section className="mt-12 space-y-6">
          <SectionLead
            label={t('courses.list.filtered')}
            title={activeCategoryName ? activeCategoryName : debouncedQuery ? `"${debouncedQuery}"` : t('courses.list.allCourses')}
            size="md"
            meta={
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {totalCourses} {t('courses.list.coursesFound', 'khóa học tìm thấy')}
              </span>
            }
          />

          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : allCourses.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allCourses.map((course) => (
                  <CourseCard key={course.id} course={course} isEnrolled={enrolledCourseIds.has(course.id)} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <Button variant="outline" onClick={handlePrevPage} disabled={page === 1}>
                    {t('courses.list.prev')}
                  </Button>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t('courses.list.page')} {page} {t('courses.list.of')} {totalPages}
                  </span>
                  <Button variant="outline" onClick={handleNextPage} disabled={page === totalPages}>
                    {t('courses.list.next')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={t('courses.list.noCourses')}
              message={t('courses.list.adjustFilter')}
            />
          )}
        </section>
      ) : (
        /* Standard Catalog: Featured Standout Top 3 + Comprehensive All Courses Grid */
        <>
          {popularStandouts.length > 0 && (
            <section className="mt-12 space-y-6">
              <SectionLead
                label={t('courses.list.popular')}
                title={t('courses.list.popularDesc')}
                size="md"
              />

              {popLoading ? (
                <SkeletonGrid count={3} />
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {popularStandouts.map((course) => (
                    <CourseCard key={course.id} course={course} isEnrolled={enrolledCourseIds.has(course.id)} />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="mt-16 space-y-6">
            <SectionLead
              label={t('courses.list.allCoursesDesc')}
              title={t('courses.list.allCourses')}
              size="md"
              meta={
                <span className="text-sm text-slate-400">
                  {t('courses.list.page')} {page} {t('courses.list.of')} {totalPages}
                </span>
              }
            />

            {isLoading ? (
              <SkeletonGrid count={8} />
            ) : allCourses.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allCourses.map((course) => (
                    <CourseCard key={course.id} course={course} isEnrolled={enrolledCourseIds.has(course.id)} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <Button variant="outline" onClick={handlePrevPage} disabled={page === 1}>
                      {t('courses.list.prev')}
                    </Button>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {t('courses.list.page')} {page} {t('courses.list.of')} {totalPages}
                    </span>
                    <Button variant="outline" onClick={handleNextPage} disabled={page === totalPages}>
                      {t('courses.list.next')}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={t('courses.list.noCourses')}
                message={t('courses.list.adjustFilter')}
              />
            )}
          </section>
        </>
      )}
    </PageShell>
  );
};

export default CourseList;
