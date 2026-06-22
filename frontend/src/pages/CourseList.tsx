import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, EmptyState, PageShell, SkeletonGrid, GlassPanel, Input } from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { floatY } from '../animations/motionVariants';

type Course = {
  id: number;
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

const categories = ['All', 'Design', 'Development', 'Data', 'Business', 'Marketing'];

const popularCourses: Course[] = [
  {
    id: 1,
    title: 'Product Design Masterclass',
    teacher: 'Mia Chen',
    role: 'Senior Product Designer',
    category: 'Design',
    rating: 4.9,
    ratingCount: '2.3k',
    duration: '8h 20m',
    progress: 68,
    lessons: '12 lessons',
    accent: 'from-fuchsia-500 via-pink-500 to-orange-400',
    image: makeThumbnail('Design')
  },
  {
    id: 2,
    title: 'React System Architecture',
    teacher: 'Noah Park',
    role: 'Frontend Engineer',
    category: 'Development',
    rating: 4.8,
    ratingCount: '1.9k',
    duration: '10h 45m',
    progress: 52,
    lessons: '16 lessons',
    accent: 'from-cyan-500 via-sky-500 to-indigo-500',
    image: makeThumbnail('React')
  },
  {
    id: 3,
    title: 'Learning Analytics Strategy',
    teacher: 'Ava Morales',
    role: 'Data Lead',
    category: 'Data',
    rating: 4.7,
    ratingCount: '980',
    duration: '6h 15m',
    progress: 84,
    lessons: '9 lessons',
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    image: makeThumbnail('Data')
  }
];

const trendingCourses: Course[] = [
  {
    id: 4,
    title: 'AI for Modern Teams',
    teacher: 'Sophia Lee',
    role: 'AI Product Manager',
    category: 'Business',
    rating: 5,
    ratingCount: '4.1k',
    duration: '4h 50m',
    progress: 34,
    lessons: '8 lessons',
    accent: 'from-violet-500 via-indigo-500 to-sky-500',
    image: makeThumbnail('AI')
  },
  {
    id: 5,
    title: 'Growth Marketing Sprint',
    teacher: 'Ethan Wright',
    role: 'Growth Lead',
    category: 'Marketing',
    rating: 4.9,
    ratingCount: '1.4k',
    duration: '7h 30m',
    progress: 76,
    lessons: '11 lessons',
    accent: 'from-amber-500 via-orange-500 to-rose-500',
    image: makeThumbnail('Growth')
  },
  {
    id: 6,
    title: 'Advanced UI Motion Design',
    teacher: 'Olivia Hart',
    role: 'Motion Designer',
    category: 'Design',
    rating: 4.8,
    ratingCount: '1.1k',
    duration: '5h 10m',
    progress: 58,
    lessons: '10 lessons',
    accent: 'from-sky-500 via-cyan-500 to-emerald-400',
    image: makeThumbnail('Motion')
  }
];

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
      className="card interactive group overflow-hidden !p-0"
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="relative">
        {!thumbLoaded ? <div className="absolute inset-0 skeleton skeleton-card !rounded-b-none" /> : null}
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          onLoad={() => setThumbLoaded(true)}
          className={`h-52 w-full object-cover transition duration-500 group-hover:scale-105 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent transition duration-300 group-hover:opacity-90" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${course.accent}`} />
          {course.category}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur-md">
              {course.lessons}
            </div>
            <div className="rounded-2xl bg-slate-950/40 px-3 py-2 text-xs font-medium backdrop-blur-md">
              {course.duration}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/75">Rating</p>
            <p className="mt-1 text-lg font-semibold">{course.rating.toFixed(1)} <span className="text-xs text-white/70">({course.ratingCount})</span></p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {!avatarLoaded ? <div className="absolute inset-0 skeleton skeleton-text" /> : null}
            <img
              src={makeAvatar(course.teacher[0])}
              alt={course.teacher}
              loading="lazy"
              onLoad={() => setAvatarLoaded(true)}
              className={`h-full w-full object-cover ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{course.teacher}</p>
            <p className="truncate text-sm text-slate-500">{course.role}</p>
          </div>
        </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-semibold tracking-tight text-slate-950">
          {course.title}
        </h3>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Progress</span>
            <span className="font-semibold text-slate-900">{course.progress}%</span>
          </div>
          <div className="progress-track mt-3">
            <MotionDiv
              className={`progress-fill bg-gradient-to-r ${course.accent}`}
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 1.05, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">More details available</span>
            <Link to={`/courses/${course.id}`}>
              <Button variant="pill" size="sm">
                View detail
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};

const CourseList: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const isLoading = useSimulatedLoading(1000);

  const filteredPopular = useMemo(() => {
    return popularCourses.filter((course) => {
      const matchesQuery = course.title.toLowerCase().includes(query.toLowerCase()) || course.teacher.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query]);

  const filteredTrending = useMemo(() => {
    return trendingCourses.filter((course) => {
      const matchesQuery = course.title.toLowerCase().includes(query.toLowerCase()) || course.teacher.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query]);

  return (
    <PageShell>
        <GlassPanel padding="lg" motionProps={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: 'easeOut' } }}>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="badge">Course catalog</div>
              <div>
                <p className="text-sm font-medium text-slate-500">Find your next learning path</p>
                <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Modern courses with a calm, premium, and motivating browsing experience.
                </h1>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Inspired by Coursera structure, Duolingo energy, and Notion clarity. Search by topic, filter by category, and jump into popular or trending learning tracks.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Active learners', value: '24.8k' },
                  { label: 'Available courses', value: '128' },
                  { label: 'Weekly completion', value: '86%' }
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/60 bg-white/80 px-4 py-4 shadow-sm">
                    <p className="section-label">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <GlassPanel variant="dark" padding="lg" motionProps={{ animate: floatY(6, 5.8) }}>
              <p className="section-label !text-white/70">Discover</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Learn in a space that feels alive.</h2>
              <p className="mt-4 text-base leading-7 text-white/80">
                Browse a course library built to feel polished, engaging, and easy to scan on any screen size.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {['Smooth transition', 'Hover lift', 'Lazy loading', 'Progress tracking'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 text-sm font-medium backdrop-blur-md">
                    {item}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </GlassPanel>

        <GlassPanel padding="sm" className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses, teachers, or skills"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              onClear={() => setQuery('')}
              className="flex-1"
            />

            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end">
              {categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <Button
                    key={category}
                    type="button"
                    variant={isActive ? 'pill' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap ${!isActive ? '!rounded-full' : ''}`}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          </div>
        </GlassPanel>

        <section className="mt-8 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-label">Popular Courses</p>
              <h2 className="mt-2 section-title">Most loved by learners</h2>
            </div>
            <p className="text-sm text-slate-500">{filteredPopular.length} results</p>
          </div>

          {isLoading ? (
            <SkeletonGrid count={3} />
          ) : filteredPopular.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPopular.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No popular courses found"
              message="Try a different keyword or category. Popular courses will appear here when your filters match available content."
            />
          )}
        </section>

        <section className="mt-10 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-label">Trending Courses</p>
              <h2 className="mt-2 section-title">What is hot right now</h2>
            </div>
            <p className="text-sm text-slate-500">Updated today</p>
          </div>

          {isLoading ? (
            <SkeletonGrid count={3} />
          ) : filteredTrending.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrending.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No trending courses found"
              message="Trending content is hidden by the current filters. Adjust the search or category to reveal matching courses."
            />
          )}
        </section>
    </PageShell>
  );
};

export default CourseList;