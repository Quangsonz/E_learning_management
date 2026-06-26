import React from 'react';
import { MotionProps, motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../animations/motionVariants';

export type MetricItem = {
  label: string;
  value: string;
  delta?: string;
};

export type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

export const AmbientGlow: React.FC<{ variant?: 'default' | 'warm' | 'cool' }> = ({ variant = 'default' }) => {
  const tones = {
    default: ['from-indigo-400/25 to-purple-400/25', 'from-cyan-400/25 to-blue-400/25'],
    warm: ['from-amber-400/25 to-orange-400/25', 'from-rose-400/25 to-pink-400/25'],
    cool: ['from-sky-400/25 to-cyan-400/25', 'from-violet-400/25 to-purple-400/25']
  }[variant];

  return (
    <>
      <MotionDiv
        className={`pointer-events-none absolute -right-12 -top-12 h-72 w-72 rounded-full bg-gradient-to-br blur-3xl ${tones[0]}`}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <MotionDiv
        className={`pointer-events-none absolute -left-8 -bottom-8 h-56 w-56 rounded-full bg-gradient-to-tr blur-3xl ${tones[1]}`}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        aria-hidden="true"
      />
    </>
  );
};

const heroBackgroundImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80"
];

const HeroBackgroundSlideshow = () => {
  const [index, setIndex] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroBackgroundImages.length);
    }, 2500); // 2.5 seconds per slide (2s display + 0.5s transition feels best)
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute -inset-x-10 -inset-y-16 z-0 overflow-hidden pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
      {heroBackgroundImages.map((src, i) => (
        <motion.img
          key={src}
          src={src}
          className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity"
          style={{ filter: 'grayscale(50%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: i === index ? 0.35 : 0 }}
          transition={{ duration: 0.8 }}
          alt=""
        />
      ))}
    </div>
  );
};

type CanvasHeroProps = {
  badge?: React.ReactNode;
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  glow?: 'default' | 'warm' | 'cool';
};

export const CanvasHero: React.FC<CanvasHeroProps> = ({
  badge,
  eyebrow,
  title,
  description,
  actions,
  aside,
  glow = 'default'
}) => (
  <section className="relative overflow-visible">
    <HeroBackgroundSlideshow />
    <AmbientGlow variant={glow} />
    <div className={`relative z-20 grid items-center gap-2 ${aside ? 'lg:grid-cols-[1.15fr_auto] lg:gap-0' : ''}`}>
      <MotionDiv
        className="relative z-10 max-w-xl space-y-3.5 py-2 sm:space-y-4 sm:py-3"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {badge}
        <div>
          {eyebrow ? <p className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">{eyebrow}</p> : null}
          <h1 className="mt-2.5 text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="max-w-2xl text-[1.0625rem] leading-[1.65] text-slate-600 dark:text-slate-300 sm:text-[1.125rem]">{description}</p>
        ) : null}
        {actions ? <div className="flex flex-wrap gap-3 pt-3">{actions}</div> : null}
      </MotionDiv>
      {aside ? <div className="relative z-20 shrink-0">{aside}</div> : null}
    </div>
  </section>
);

type MetricsSurfaceProps = {
  metrics: MetricItem[];
  className?: string;
  delay?: number;
};

export const MetricsSurface: React.FC<MetricsSurfaceProps> = ({ metrics, className = '', delay = 0.15 }) => (
  <MotionDiv
    className={`canvas-surface mt-5 px-5 py-4 sm:px-7 sm:py-5 ${className}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45 }}
  >
    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-6">
      {metrics.map((item, index) => (
        <div
          key={item.label}
          className={`flex items-baseline justify-between gap-4 ${
            index < metrics.length - 1 ? 'lg:border-r lg:border-slate-200/60 dark:lg:border-white/10 lg:pr-6' : ''
          }`}
        >
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
          <div className="text-right">
            <span className="text-xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {item.value}
            </span>
            {item.delta ? <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">{item.delta}</p> : null}
          </div>
        </div>
      ))}
    </div>
  </MotionDiv>
);

type SectionLeadProps = {
  label: string;
  title: string;
  meta?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | string;
};

export const SectionLead: React.FC<SectionLeadProps> = ({ label, title, meta, className = '' }) => (
  <div className={`flex items-end justify-between gap-4 ${className}`}>
    <div>
      <p className="section-label dark:text-slate-400">{label}</p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
    </div>
    {meta}
  </div>
);

type ActivityStreamProps = {
  items: ActivityItem[];
  className?: string;
};

export const ActivityStream: React.FC<ActivityStreamProps> = ({ items, className = '' }) => (
  <MotionDiv className={`relative pl-7 ${className}`} variants={staggerContainer} initial="initial" animate="animate">
    <div
      className="absolute bottom-1 left-[7px] top-1 w-px bg-gradient-to-b from-indigo-300/80 via-slate-200/80 dark:from-indigo-500/50 dark:via-white/10 to-transparent"
      aria-hidden="true"
    />
    {items.map((activity, index) => (
      <MotionDiv
        key={activity.title}
        variants={staggerItem}
        className={`relative ${index < items.length - 1 ? 'pb-8' : ''}`}
      >
        <div
          className="absolute -left-7 top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white dark:bg-slate-950 ring-[3px] ring-white dark:ring-slate-950"
          aria-hidden="true"
        >
          <div className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold leading-snug text-slate-950 dark:text-white">{activity.title}</h3>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{activity.detail}</p>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{activity.time}</p>
        </div>
      </MotionDiv>
    ))}
  </MotionDiv>
);

type ChartBlockProps = {
  label: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const ChartBlock: React.FC<ChartBlockProps> = ({ label, title, badge, children, className = '' }) => (
  <MotionDiv
    className={className}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="section-label">{label}</p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h3>
      </div>
      {badge}
    </div>
    <div className="mt-5">{children}</div>
  </MotionDiv>
);

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
};

export const FilterBar: React.FC<FilterBarProps> = ({ children, className = '' }) => (
  <MotionDiv
    className={`canvas-surface mt-6 px-4 py-3.5 sm:px-5 ${className}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.4 }}
  >
    {children}
  </MotionDiv>
);

type InsightCalloutProps = {
  title: string;
  description: string;
  className?: string;
};

export const InsightCallout: React.FC<InsightCalloutProps> = ({ title, description, className = '' }) => (
  <MotionDiv
    className={`rounded-2xl bg-gradient-to-br from-emerald-50/80 to-cyan-50/60 dark:from-emerald-900/30 dark:to-cyan-900/20 px-5 py-4 border border-transparent dark:border-white/5 ${className}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.45 }}
  >
    <p className="text-sm font-semibold text-slate-800 dark:text-emerald-100">{title}</p>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-emerald-200/70">{description}</p>
  </MotionDiv>
);

export const LiveIndicator: React.FC = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
  </span>
);
