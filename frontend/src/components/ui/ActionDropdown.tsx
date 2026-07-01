import React, { useState } from 'react';

interface ActionDropdownProps {
  children: React.ReactNode;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-lg bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {React.Children.map(children, child => 
              React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { 
                onClick: (e: any) => { 
                  if (child.props.onClick) child.props.onClick(e); 
                  setIsOpen(false); 
                }
              }) : child
            )}
          </div>
        </>
      )}
    </div>
  );
};
