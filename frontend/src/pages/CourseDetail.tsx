import React, { useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  CanvasHero,
  EmptyState,
  GlassPanel,
  LoadingScreen,
  MetricsSurface,
  PageShell,
  SectionLead
} from '../components/ui';
import { floatY } from '../animations/motionVariants';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

type CurriculumItem = {
  title: string;
  duration: string;
  lectures: number;
  locked?: boolean;
};

type FAQItem = {
  question: string;
  answer: string;
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const navAnchors = [
  { label: 'Preview video', anchor: 'preview-video' },
  { label: 'Curriculum', anchor: 'curriculum' },
  { label: 'Instructor', anchor: 'instructor' },
  { label: 'Reviews', anchor: 'reviews' },
  { label: 'FAQ', anchor: 'faq' }
];

const curriculum: CurriculumItem[] = [
  { title: 'Course overview and success roadmap', duration: '22 min', lectures: 4 },
  { title: 'Core concepts and practical setup', duration: '1h 15m', lectures: 8 },
  { title: 'Building high-converting learning experiences', duration: '1h 40m', lectures: 10 },
  { title: 'Design systems, motion, and polish', duration: '1h 05m', lectures: 6 },
  { title: 'Final project and review checklist', duration: '45 min', lectures: 5, locked: true }
];

const faqs: FAQItem[] = [
  {
    question: 'What level is this course designed for?',
    answer: 'This course is designed for beginners to intermediate learners who want a premium, structured path through practical product learning.'
  },
  {
    question: 'Do I get lifetime access?',
    answer: 'Yes, once enrolled you can revisit the curriculum, preview lessons, and continue learning at your own pace whenever you need.'
  },
  {
    question: 'Is there a certificate after completion?',
    answer: 'A completion certificate can be issued after finishing all core modules and the final project review.'
  }
];

const reviews = [
  { name: 'Anika', role: 'Product Designer', rating: 5, text: 'Feels like a premium Coursera/Udemy hybrid. The pacing and visuals are excellent.' },
  { name: 'Minh', role: 'Frontend Developer', rating: 4.8, text: 'The curriculum is clear, the interface is calm, and the progress tracking is motivating.' },
  { name: 'Sarah', role: 'Learning Manager', rating: 5, text: 'Our team adopted the course quickly because the structure is so easy to scan.' }
];

const instructor = {
  name: 'Dr. Evelyn Hart',
  title: 'Lead Learning Experience Designer',
  bio: 'Evelyn has designed learning products for SaaS teams, enterprise academies, and modern creator platforms with a focus on engagement and clarity.',
  learners: '42k learners',
  courses: '16 courses',
  rating: '4.9 average rating'
};

const stats = [
  { label: 'Enrolled', value: '18.2k' },
  { label: 'Rating', value: '4.9/5' },
  { label: 'Duration', value: '12h 40m' }
];

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const [openIndex, setOpenIndex] = useState(0);
  const isLoading = useSimulatedLoading(800);
  const hasError = !courseId;

  if (isLoading) {
    return (
      <PageShell wide>
        <LoadingScreen title="Loading course" message="Fetching curriculum, instructor details, and enrollment options..." />
      </PageShell>
    );
  }

  if (hasError) {
    return (
      <PageShell wide>
        <EmptyState
          title="Course not found"
          message="The course you are looking for does not exist or may have been removed."
          action={
            <Link to="/courses">
              <Button variant="pill">Browse courses</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <CanvasHero
        badge={
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link to="/courses" className="font-semibold text-primary-600 hover:text-primary-700">
              Courses
            </Link>
            <span>/</span>
            <span>Course Detail</span>
            <span className="badge">ID: {courseId ?? 'premium-001'}</span>
          </div>
        }
        title="Product Design Masterclass for teams who want premium learning outcomes."
        description="A polished learning page inspired by Udemy Premium and Coursera Premium, with strong hierarchy, clear section anchors, and a motivating learning flow."
        actions={
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
            {navAnchors.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 ? <span className="hidden text-slate-300 sm:inline" aria-hidden="true">·</span> : null}
                <a
                  href={`#${item.anchor}`}
                  className="text-primary-600 transition-colors hover:text-primary-700"
                >
                  {item.label}
                </a>
              </React.Fragment>
            ))}
          </nav>
        }
        glow="cool"
      />

      <MetricsSurface metrics={stats} className="!mt-4" />

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.45fr)] xl:gap-12">
        <main className="space-y-10">
          <section id="preview-video" className="scroll-mt-24">
            <SectionLead
              label="Course Preview Video"
              title="See the learning style before you enroll"
              meta={<span className="status-badge status-badge-success">Hover effects enabled</span>}
            />

            <MotionDiv
              className="group relative mt-5 overflow-hidden rounded-[var(--radius-panel)] border border-slate-200 bg-slate-950 shadow-elev-2 cursor-pointer"
              layoutId="course-hero-video"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),transparent_25%),linear-gradient(135deg,rgba(15,23,42,0.55),rgba(59,130,246,0.35),rgba(168,85,247,0.35))]" />
              <div className="relative aspect-video overflow-hidden">
                <video
                  className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                  controls
                  preload="metadata"
                  poster="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80"
                >
                  <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
                </video>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">Video Hover Effects</p>
                    <p className="mt-2 text-lg font-semibold">Animated preview with premium visual treatment</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Preview</p>
                    <p className="mt-1 text-sm font-semibold">3 min intro</p>
                  </div>
                </div>
              </div>
            </MotionDiv>
          </section>

          <section id="curriculum" className="scroll-mt-24">
            <SectionLead
              label="Curriculum"
              title="Structured modules with clear progression"
              meta={<span className="badge !border-sky-200 !bg-sky-50 !text-sky-700">5 modules</span>}
            />

            <div className="mt-5 divide-y divide-slate-200/70">
              {curriculum.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20"
                    >
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Module {index + 1}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h3>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{item.duration}</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {item.lectures} lectures {item.locked ? '• Locked' : ''}
                        </p>
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          className="overflow-hidden border-t border-slate-200/70 pb-4 text-sm leading-7 text-slate-600"
                        >
                          <p className="pt-4">
                            This module focuses on hands-on learning, visual clarity, and premium pacing that helps students stay engaged from start to finish.
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="instructor" className="scroll-mt-24">
            <SectionLead label="Instructor Info" title="Learn from a proven learning experience designer" />

            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-xl font-semibold text-white shadow-lg shadow-sky-500/20">
                EH
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-semibold text-slate-950">{instructor.name}</h3>
                <p className="mt-1 text-slate-500">{instructor.title}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{instructor.bio}</p>
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  <span className="font-semibold text-slate-950">{instructor.learners}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-950">{instructor.courses}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-950">{instructor.rating}</span>
                </p>
              </div>
            </div>
          </section>

          <section id="reviews" className="scroll-mt-24">
            <SectionLead label="Reviews" title="Learners trust the structure and polish" />

            <div className="mt-5 divide-y divide-slate-200/70">
              {reviews.map((review) => (
                <div key={review.name} className="py-5 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{review.name}</p>
                      <p className="text-sm text-slate-500">{review.role}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-amber-700">{review.rating.toFixed(1)} ★</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{review.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="faq" className="scroll-mt-24">
            <SectionLead label="FAQ" title="Common questions before enrollment" />

            <div className="mt-5 divide-y divide-slate-200/70">
              {faqs.map((item, index) => {
                const isOpen = openIndex === index + 100;

                return (
                  <div key={item.question}>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? -1 : index + 100)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20"
                    >
                      <span className="text-base font-semibold text-slate-950">{item.question}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="text-2xl font-light text-slate-400"
                      >
                        +
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          className="overflow-hidden border-t border-slate-200/70 pb-4 text-sm leading-7 text-slate-600"
                        >
                          <p className="pt-4">{item.answer}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <GlassPanel
            variant="dark"
            padding="lg"
            className="!shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
            motionProps={{ animate: floatY(6, 5.5) }}
          >
            <p className="section-label !text-white/70">Sticky Sidebar</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Enrolled now: get instant access</h3>
            <div className="mt-5 space-y-3 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Price</span>
                <span className="text-2xl font-semibold text-white">$49</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Level</span>
                <span className="font-semibold text-white">Intermediate</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Certificate</span>
                <span className="font-semibold text-white">Included</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Link to="/learning">
                <Button variant="pill" className="w-full !bg-white !text-slate-950 hover:!bg-slate-100">
                  Enroll now
                </Button>
              </Link>
              <Button variant="outline" className="w-full !border-white/15 !bg-white/10 !text-white hover:!bg-white/15">
                Add to wishlist
              </Button>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-4 text-sm leading-7 text-white/80">
              Smooth scroll anchors, premium section spacing, and accordion motion keep the page calm and easy to explore.
            </div>
          </GlassPanel>
        </aside>
      </div>
    </PageShell>
  );
};

export default CourseDetail;
