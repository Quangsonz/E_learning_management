import React, { useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),transparent_28%),linear-gradient(180deg,#f7fbff_0%,#eef4fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <MotionDiv
          className="overflow-hidden rounded-[34px] border border-white/70 bg-white/75 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <Link to="/courses" className="font-semibold text-sky-600 hover:text-sky-700">Courses</Link>
                <span>/</span>
                <span>Course Detail</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">ID: {courseId ?? 'premium-001'}</span>
              </div>

              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Hero Banner
                </div>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Product Design Masterclass for teams who want premium learning outcomes.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  A polished learning page inspired by Udemy Premium and Coursera Premium, with strong hierarchy, clear section anchors, and a motivating learning flow.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <MotionDiv
              className="rounded-[30px] border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-700 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.22)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Sticky Sidebar</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Learn with structure, momentum, and confidence.</h2>
              <p className="mt-4 text-base leading-7 text-white/80">
                High signal sections, clear prerequisites, and a preview that helps users decide fast.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Preview video', anchor: 'preview-video' },
                  { label: 'Curriculum', anchor: 'curriculum' },
                  { label: 'Instructor', anchor: 'instructor' },
                  { label: 'Reviews', anchor: 'reviews' },
                  { label: 'FAQ', anchor: 'faq' }
                ].map((item) => (
                  <a key={item.label} href={`#${item.anchor}`} className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur-md transition hover:bg-white/15">
                    {item.label}
                  </a>
                ))}
              </div>
            </MotionDiv>
          </div>
        </MotionDiv>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.45fr]">
          <main className="space-y-6">
            <section id="preview-video" className="scroll-mt-24 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Course Preview Video</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">See the learning style before you enroll</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Hover effects enabled</span>
              </div>

              <MotionDiv
                className="group relative mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.18)]"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
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

            <section id="curriculum" className="scroll-mt-24 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Curriculum</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Structured modules with clear progression</h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">5 modules</span>
              </div>

              <div className="mt-5 space-y-3">
                {curriculum.map((item, index) => (
                  <MotionDiv
                    key={item.title}
                    className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50"
                    initial={false}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus:ring-4 focus:ring-sky-100"
                    >
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Module {index + 1}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h3>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{item.duration}</p>
                        <p className="mt-1 font-semibold text-slate-900">{item.lectures} lectures {item.locked ? '• Locked' : ''}</p>
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openIndex === index ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: 'easeOut' }}
                          className="overflow-hidden border-t border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-600"
                        >
                          This module focuses on hands-on learning, visual clarity, and premium pacing that helps students stay engaged from start to finish.
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </MotionDiv>
                ))}
              </div>
            </section>

            <section id="instructor" className="scroll-mt-24 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Instructor Info</p>
              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-xl font-semibold text-white shadow-lg shadow-sky-500/20">
                    EH
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">{instructor.name}</h2>
                    <p className="mt-1 text-slate-500">{instructor.title}</p>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{instructor.bio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[instructor.learners, instructor.courses, instructor.rating].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold text-slate-800">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="reviews" className="scroll-mt-24 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Reviews</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Learners trust the structure and polish</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {reviews.map((review) => (
                  <div key={review.name} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{review.name}</p>
                        <p className="text-sm text-slate-500">{review.role}</p>
                      </div>
                      <p className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{review.rating.toFixed(1)} ★</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{review.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="faq" className="scroll-mt-24 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">FAQ</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Common questions before enrollment</h2>
              <div className="mt-5 space-y-3">
                {faqs.map((item, index) => {
                  const isOpen = openIndex === index + 100;

                  return (
                    <MotionDiv key={item.question} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50" whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? -1 : index + 100)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus:ring-4 focus:ring-sky-100"
                      >
                        <span className="text-base font-semibold text-slate-950">{item.question}</span>
                        <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.18 }} className="text-2xl font-light text-slate-400">
                          +
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                            className="overflow-hidden border-t border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-600"
                          >
                            {item.answer}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </MotionDiv>
                  );
                })}
              </div>
            </section>
          </main>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <MotionDiv
              className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-700 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Sticky Sidebar</p>
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
                <button className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-white/25">
                  Enroll now
                </button>
                <button className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20">
                  Add to wishlist
                </button>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-4 text-sm leading-7 text-white/80">
                Smooth scroll anchors, premium section spacing, and accordion motion keep the page calm and easy to explore.
              </div>
            </MotionDiv>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;