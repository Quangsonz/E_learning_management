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
    default: ['bg-indigo-400/15', 'bg-cyan-400/12'],
    warm: ['bg-amber-400/12', 'bg-rose-400/10'],
    cool: ['bg-sky-400/14', 'bg-violet-400/12']
  }[variant];

  return (
    <>
      <div className={`pointer-events-none absolute -right-8 top-0 h-56 w-56 rounded-full blur-3xl ${tones[0]}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -left-4 bottom-0 h-40 w-40 rounded-full blur-3xl ${tones[1]}`} aria-hidden="true" />
    </>
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
    <AmbientGlow variant={glow} />
    <div className={`relative grid items-center gap-2 ${aside ? 'lg:grid-cols-[1.15fr_auto] lg:gap-0' : ''}`}>
      <MotionDiv
        className="relative z-10 max-w-xl space-y-3.5 py-2 sm:space-y-4 sm:py-3"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {badge}
        <div>
          {eyebrow ? <p className="text-sm font-medium text-slate-500">{eyebrow}</p> : null}
          <h1 className="mt-1.5 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-slate-950">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="max-w-lg text-[0.9375rem] leading-relaxed text-slate-600 sm:text-base">{description}</p>
        ) : null}
        {actions ? <div className="flex flex-wrap gap-2.5 pt-0.5">{actions}</div> : null}
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
            index < metrics.length - 1 ? 'lg:border-r lg:border-slate-200/60 lg:pr-6' : ''
          }`}
        >
          <span className="text-sm font-medium text-slate-500">{item.label}</span>
          <div className="text-right">
            <span className="text-xl font-semibold tabular-nums tracking-tight text-slate-950 sm:text-2xl">
              {item.value}
            </span>
            {item.delta ? <p className="mt-0.5 text-xs font-medium text-emerald-600">{item.delta}</p> : null}
          </div>
        </div>
      ))}
    </div>
  </MotionDiv>
);

type SectionLeadProps = {
  label: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
};

export const SectionLead: React.FC<SectionLeadProps> = ({ label, title, meta, className = '' }) => (
  <div className={`flex items-end justify-between gap-4 ${className}`}>
    <div>
      <p className="section-label">{label}</p>
      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
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
      className="absolute bottom-1 left-[7px] top-1 w-px bg-gradient-to-b from-indigo-300/80 via-slate-200/80 to-transparent"
      aria-hidden="true"
    />
    {items.map((activity, index) => (
      <MotionDiv
        key={activity.title}
        variants={staggerItem}
        className={`relative ${index < items.length - 1 ? 'pb-8' : ''}`}
      >
        <div
          className="absolute -left-7 top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white ring-[3px] ring-white"
          aria-hidden="true"
        >
          <div className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold leading-snug text-slate-950">{activity.title}</h3>
          <p className="text-sm leading-relaxed text-slate-500">{activity.detail}</p>
          <p className="text-xs font-medium text-slate-400">{activity.time}</p>
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
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h3>
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
    className={`rounded-2xl bg-gradient-to-br from-emerald-50/80 to-cyan-50/60 px-5 py-4 ${className}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.45 }}
  >
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
  </MotionDiv>
);

export const LiveIndicator: React.FC = () => (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
  </span>
);
