import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { floatY } from '../animations/motionVariants';

type Course = {
  id: string | number;
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
};



const useCatalogMetrics = () => {
  const { t } = useTranslation();
  return [
    { label: t('courses.metrics.activeLearners'), value: '24.8k' },
    { label: t('courses.metrics.availableCourses'), value: '128' },
    { label: t('courses.metrics.weeklyCompletion'), value: '86%' },
    { label: t('courses.metrics.avgRating'), value: '4.8' }
  ];
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

function makeAvatar(seed: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="64" fill="url(#a)"/>
      <circle cx="64" cy="52" r="24" fill="rgba(255,255,255,0.92)"/>
      <path d="M28 110c8-20 24-30 36-30s28 10 36 30" fill="rgba(255,255,255,0.92)"/>
      <text x="64" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${seed}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  return (
    <MotionDiv
      className="group relative flex flex-col gap-5 transition duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {/* Glow background behind image */}
      <div className={`absolute -inset-4 z-0 rounded-[3rem] bg-gradient-to-br ${course.accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-[0.18] pointer-events-none`} />

      {/* Image Container */}
      <div className="relative z-10 overflow-hidden rounded-[2rem] aspect-[4/3] bg-slate-100 dark:bg-slate-900 shadow-sm transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)] dark:group-hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
        {!thumbLoaded ? <div className="absolute inset-0 skeleton skeleton-card" /> : null}
        <Link to={`/courses/${course.id}`} className="block h-full w-full">
          <img
            src={course.image}
            alt={course.title}
            loading="lazy"
            onLoad={() => setThumbLoaded(true)}
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/0 to-transparent opacity-80 pointer-events-none" />
        <div className="absolute left-5 top-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white pointer-events-none">
          <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${course.accent} shadow-[0_0_12px_rgba(255,255,255,0.8)]`} />
          {course.category}
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white pointer-events-none">
          <div className="space-y-1 text-xs font-semibold text-white/90">
            <p>{course.lessons}</p>
            <p>{course.duration}</p>
          </div>
          <p className="text-xl font-bold tabular-nums tracking-tight">
            {course.rating.toFixed(1)} <span className="text-xs font-medium text-white/70">({course.ratingCount})</span>
          </p>
        </div>
      </div>

      {/* Text Content completely borderless and margin-aligned */}
      <div className="relative z-10 flex flex-col gap-3 px-1">
        <Link to={`/courses/${course.id}`} className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.3]">{course.title}</h3>
        </Link>
        
        <div className="flex items-center gap-3 mt-1">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {!avatarLoaded ? <div className="absolute inset-0 skeleton skeleton-circle" /> : null}
            <img
              src={makeAvatar(course.teacher[0] || 'U')}
              alt={course.teacher}
              loading="lazy"
              onLoad={() => setAvatarLoaded(true)}
              className={`h-full w-full object-cover ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{course.teacher}</p>
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{course.role}</p>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span className="uppercase tracking-wider">Progress</span>
            <span className="tabular-nums text-slate-900 dark:text-white">{course.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <MotionDiv
              className={`h-full bg-gradient-to-r ${course.accent}`}
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 1.05, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};

const CourseList: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [popPage, setPopPage] = useState(1);
  const [trendPage, setTrendPage] = useState(1);
  const [page, setPage] = useState(1);
  const catalogMetrics = useCatalogMetrics();

  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAllCategories()
  });
  const categories = [{ _id: '', name: t('home.categories.all') }, ...(categoryData?.data?.categories || [])];

  const { data: popData, isLoading: popLoading } = useQuery({
    queryKey: ['courses-popular', query, activeCategoryId, popPage],
    queryFn: () => courseApi.getAllCourses({ search: query || undefined, category: activeCategoryId || undefined, page: popPage, limit: 3, sort: '-averageRating', status: 'published' })
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['courses-trending', query, activeCategoryId, trendPage],
    queryFn: () => courseApi.getAllCourses({ search: query || undefined, category: activeCategoryId || undefined, page: trendPage, limit: 3, sort: '-createdAt', status: 'published' })
  });

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['courses-all', query, activeCategoryId, page],
    queryFn: () => courseApi.getAllCourses({ search: query || undefined, category: activeCategoryId || undefined, page, limit: 6, status: 'published' })
  });
  
  const totalPages = responseData?.data?.totalPages || 1;
  const popTotalPages = popData?.data?.totalPages || 1;
  const trendTotalPages = trendData?.data?.totalPages || 1;

  const categoryAccent: Record<string, string> = {
    Design:      'from-violet-500 to-fuchsia-500',
    Frontend:    'from-sky-500 to-cyan-400',
    Development: 'from-sky-500 to-cyan-400',
    Data:        'from-emerald-500 to-teal-400',
    Business:    'from-amber-500 to-orange-400',
    Marketing:   'from-rose-500 to-pink-500',
  };
  const DEFAULT_ACCENT = 'from-indigo-500 to-violet-400';

  const transformCourse = (course: any): Course => ({
    id: course._id,
    title: course.title,
    teacher: course.instructor?.name || 'Unknown Instructor',
    role: course.instructor?.role || 'Instructor',
    category: course.category?.name || 'General',
    rating: course.averageRating || 5.0,
    ratingCount: '0',
    duration: '5h 30m',
    progress: Math.floor(Math.random() * 100),
    lessons: '10 lessons',
    accent: categoryAccent[course.category?.name || 'General'] || DEFAULT_ACCENT,
    image: course.thumbnailUrl || makeThumbnail(course.category?.name || 'Course')
  });

  const allCourses: Course[] = useMemo(() => {
    if (!responseData?.data?.courses) return [];
    return responseData.data.courses.map(transformCourse);
  }, [responseData]);

  const popularCourses: Course[] = useMemo(() => {
    if (!popData?.data?.courses) return [];
    return popData.data.courses.map(transformCourse);
  }, [popData]);

  const trendingCourses: Course[] = useMemo(() => {
    if (!trendData?.data?.courses) return [];
    return trendData.data.courses.map(transformCourse);
  }, [trendData]);
  
  const handleNextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setPage(p => Math.max(p - 1, 1));

  const handleNextPop = () => setPopPage(p => Math.min(p + 1, popTotalPages));
  const handlePrevPop = () => setPopPage(p => Math.max(p - 1, 1));

  const handleNextTrend = () => setTrendPage(p => Math.min(p + 1, trendTotalPages));
  const handlePrevTrend = () => setTrendPage(p => Math.max(p - 1, 1));

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">{t('courses.hero.badge')}</div>}
        eyebrow={t('courses.hero.eyebrow')}
        title={t('courses.hero.title')}
        description={t('courses.hero.desc')}
        glow="cool"
        aside={
          <MotionDiv className="mx-auto max-w-[240px] lg:-ml-16" animate={floatY(6, 5.8)}>
            <div className="relative rounded-[var(--radius-section)] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
              <p className="section-label !text-white/55">{t('courses.hero.discover')}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{t('courses.hero.title2')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {t('courses.hero.desc2')}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-white/75">
                {[t('courses.hero.features.f1'), t('courses.hero.features.f2'), t('courses.hero.features.f3'), t('courses.hero.features.f4')].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </MotionDiv>
        }
      />

      <MetricsSurface metrics={catalogMetrics} />

      <FilterBar>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
            onClear={() => { setQuery(''); setPage(1); setPopPage(1); setTrendPage(1); }}
            className="flex-1"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end hide-scrollbar">
            {categories.map((category) => {
              const isActive = activeCategoryId === category._id;
              return (
                <Button
                  key={category._id || 'all'}
                  type="button"
                  variant={isActive ? 'pill' : 'outline'}
                  size="sm"
                  onClick={() => { setActiveCategoryId(category._id); setPage(1); setPopPage(1); setTrendPage(1); }}
                  className="whitespace-nowrap"
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </FilterBar>

      <section className="mt-10 space-y-6">
        <SectionLead
          label={t('courses.list.popular')}
          title={t('courses.list.popularDesc')}
          size="md"
          meta={
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums text-slate-400">{t('courses.list.page')} {popPage} {t('courses.list.of')} {popTotalPages}</span>
              <div className="flex gap-1 ml-3">
                <Button variant="outline" size="sm" className="!px-3 !py-1 !h-8" onClick={handlePrevPop} disabled={popPage === 1}>{t('courses.list.prev')}</Button>
                <Button variant="outline" size="sm" className="!px-3 !py-1 !h-8" onClick={handleNextPop} disabled={popPage === popTotalPages}>{t('courses.list.next')}</Button>
              </div>
            </div>
          }
        />

        {popLoading ? (
          <SkeletonGrid count={3} />
        ) : popularCourses.length > 0 ? (
          <div className="grid gap-12 md:gap-x-10 md:gap-y-16 md:grid-cols-2 xl:grid-cols-3">
            {popularCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('courses.list.noCourses')}
            message={t('courses.list.adjustFilter')}
          />
        )}
      </section>

      <section className="mt-12 space-y-6">
        <SectionLead 
          label={t('courses.list.trending')} 
          title={t('courses.list.trendingDesc')} 
          size="md" 
          meta={
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums text-slate-400">{t('courses.list.page')} {trendPage} {t('courses.list.of')} {trendTotalPages}</span>
              <div className="flex gap-1 ml-3">
                <Button variant="outline" size="sm" className="!px-3 !py-1 !h-8" onClick={handlePrevTrend} disabled={trendPage === 1}>{t('courses.list.prev')}</Button>
                <Button variant="outline" size="sm" className="!px-3 !py-1 !h-8" onClick={handleNextTrend} disabled={trendPage === trendTotalPages}>{t('courses.list.next')}</Button>
              </div>
            </div>
          } 
        />

        {trendLoading ? (
          <SkeletonGrid count={3} />
        ) : trendingCourses.length > 0 ? (
          <div className="grid gap-12 md:gap-x-10 md:gap-y-16 md:grid-cols-2 xl:grid-cols-3">
            {trendingCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('courses.list.noCourses')}
            message={t('courses.list.adjustFilter')}
          />
        )}
      </section>

      <section className="mt-16 space-y-6">
        <SectionLead label={t('courses.list.allCoursesDesc')} title={t('courses.list.allCourses')} size="md" meta={<p className="text-sm text-slate-400">{t('courses.list.page')} {page} {t('courses.list.of')} {totalPages}</p>} />
        
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : allCourses.length > 0 ? (
          <>
            <div className="grid gap-12 md:gap-x-10 md:gap-y-16 md:grid-cols-2 xl:grid-cols-3">
              {allCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            
            {/* Pagination Controls */}
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
    </PageShell>
  );
};

export default CourseList;
