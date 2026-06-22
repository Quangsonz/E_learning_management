import React from 'react';

type SectionHeaderProps = {
  label: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  inverted?: boolean;
  className?: string;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  title,
  description,
  action,
  inverted = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="space-y-2">
        <p className={`section-label ${inverted ? 'text-white/60' : ''}`}>{label}</p>
        <h2 className={`section-title ${inverted ? 'text-white' : ''}`}>{title}</h2>
        {description ? (
          <p className={`max-w-2xl text-sm leading-7 ${inverted ? 'text-white/75' : 'text-slate-600'}`}>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
};

export default SectionHeader;
