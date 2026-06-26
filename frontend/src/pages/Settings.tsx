import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PageShell,
  SectionLead,
  Button,
  AmbientGlow,
  Input
} from '../components/ui';

// ============================================================================
// TYPES & MOCK DATA
// ============================================================================

type TabId = 'general' | 'security' | 'notifications' | 'integrations' | 'privacy';

const SETTINGS_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id: 'security', label: 'Security & Access', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'integrations', label: 'Connected Accounts', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { id: 'privacy', label: 'Privacy & Data', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
];

const MOCK_USER = {
  name: 'Lan Nguyen',
  username: '@lannguyen',
  email: 'lan@gmail.com',
  role: 'Student',
  joinDate: '2026',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256',
  status: 'Verified Account',
  securityScore: 92
};

// ============================================================================
// COMPONENTS: GENERAL TAB
// ============================================================================

const AccountOverview: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Profile" title="Account Overview" />
      <div className="flex items-center gap-6 p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
        <img src={MOCK_USER.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white/20" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {MOCK_USER.name}
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
              {MOCK_USER.status}
            </span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {MOCK_USER.username} &bull; {MOCK_USER.email}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {MOCK_USER.role} &bull; Member since {MOCK_USER.joinDate}
          </p>
        </div>
      </div>
    </section>
  );
};

const LearningPreferences: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Study" title="Learning Preferences" />
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Daily Learning Goal</label>
            <select defaultValue="Regular (30 mins/day)" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50">
              <option value="Casual (15 mins/day)">Casual (15 mins/day)</option>
              <option value="Regular (30 mins/day)">Regular (30 mins/day)</option>
              <option value="Intense (1 hour/day)">Intense (1 hour/day)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Preferred Language</label>
            <select defaultValue="English" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50">
              <option value="English">English</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/5 pt-6">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4">Course Recommendations</label>
          <div className="flex flex-wrap gap-3">
            {['Frontend', 'UI/UX', 'Backend', 'Data Science', 'Mobile', 'AI'].map((topic, i) => (
              <button key={topic} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${i < 2 ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-indigo-500/50'}`}>
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AppearanceSettings: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Visual" title="Appearance" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Light */}
        <button className="group relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 p-4 text-left transition-all hover:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
          <div className="h-24 w-full rounded-xl bg-white shadow-sm border border-slate-200 mb-4 p-2 space-y-2">
            <div className="w-1/2 h-2 bg-slate-200 rounded-full" />
            <div className="w-3/4 h-2 bg-slate-100 rounded-full" />
            <div className="w-1/4 h-4 bg-indigo-500 rounded-full mt-auto" />
          </div>
          <span className="font-semibold text-slate-900">Light</span>
        </button>

        {/* Dark */}
        <button className="group relative rounded-2xl border-2 border-indigo-500 bg-slate-900 p-4 text-left transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/10">
          <div className="absolute top-3 right-3 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <div className="h-24 w-full rounded-xl bg-slate-800 shadow-sm border border-slate-700 mb-4 p-2 space-y-2">
            <div className="w-1/2 h-2 bg-slate-700 rounded-full" />
            <div className="w-3/4 h-2 bg-slate-700/50 rounded-full" />
            <div className="w-1/4 h-4 bg-indigo-500 rounded-full mt-auto" />
          </div>
          <span className="font-semibold text-white">Midnight (Active)</span>
        </button>

        {/* System */}
        <button className="group relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-4 text-left transition-all hover:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
          <div className="h-24 w-full rounded-xl bg-gradient-to-r from-white to-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 mb-4 p-2" />
          <span className="font-semibold text-slate-900 dark:text-white">System</span>
        </button>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTS: SECURITY TAB
// ============================================================================

const SecurityCenter: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Protection" title="Security Center" />
      
      {/* Security Score */}
      <div className="flex flex-col sm:flex-row items-center gap-8 p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-emerald-500/20" />
            <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="351.858" strokeDashoffset="28.14" className="text-emerald-500" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">92</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">Score</span>
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Excellent Protection</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Your account security is well above average. We recommend completing the final step below to reach 100.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Action needed: Add a recovery phone number
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Password', status: 'Updated 3 months ago', verified: true, action: 'Change' },
          { label: 'Two-Factor Auth', status: 'Authenticator App', verified: true, action: 'Manage' },
          { label: 'Verified Email', status: 'lan@gmail.com', verified: true, action: 'Update' },
          { label: 'Trusted Devices', status: '2 devices authorized', verified: true, action: 'Review' }
        ].map((item, i) => (
          <div key={i} className="flex flex-col justify-between p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {item.label}
                  {item.verified && (
                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                </p>
                <p className="text-sm text-slate-500 mt-1">{item.status}</p>
              </div>
            </div>
            <button className="mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 text-left hover:text-indigo-700 transition-colors w-fit">
              {item.action} &rarr;
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

const LoginSessions: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Access" title="Login Sessions" />
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden">
        
        {/* Current Session */}
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                MacBook Pro 16"
                <span className="text-[10px] uppercase tracking-widest font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">Current</span>
              </p>
              <p className="text-sm text-slate-500">Ho Chi Minh City, VN &bull; Chrome &bull; 115.79.x.x</p>
            </div>
          </div>
        </div>

        {/* Other Session */}
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">iPhone 14 Pro</p>
              <p className="text-sm text-slate-500">Hanoi, VN &bull; Safari &bull; Last active: 2 hours ago</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-400 shrink-0">Terminate</Button>
        </div>

      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTS: NOTIFICATIONS TAB
// ============================================================================

const NotificationPreferences: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Communication" title="Notification Preferences" />
      
      <div className="space-y-8">
        {/* Learning Alerts */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Learning Alerts</h4>
          <div className="space-y-6">
            {[
              { label: 'Course Updates', desc: 'New modules, syllabus changes, and instructor announcements', active: true },
              { label: 'Lesson Reminders', desc: 'Daily or weekly nudges to keep your streak alive', active: true },
              { label: 'Assignment Deadlines', desc: 'Urgent alerts 24 hours before a submission is due', active: true },
              { label: 'Quiz Results', desc: 'Instant notifications when your quiz score is ready', active: false }
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
                <div className={`w-11 h-6 rounded-full relative cursor-pointer shrink-0 transition-colors ${item.active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.active ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Communications */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Email Communications</h4>
          <div className="space-y-6">
            {[
              { label: 'System Announcements', desc: 'Important platform updates and security alerts (Required)', active: true, locked: true },
              { label: 'Certificate Delivery', desc: 'Receive your PDF certificates immediately via email', active: true },
              { label: 'Marketing & Offers', desc: 'Discounts, partner courses, and promotional content', active: false }
            ].map((item, i) => (
              <div key={i} className={`flex items-start justify-between gap-4 ${item.locked ? 'opacity-70' : ''}`}>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
                <div className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${item.active ? (item.locked ? 'bg-slate-400 dark:bg-slate-600' : 'bg-indigo-500') : 'bg-slate-300 dark:bg-slate-700'} ${item.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.active ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTS: INTEGRATIONS TAB
// ============================================================================

const ConnectedAccounts: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Services" title="Connected Accounts" />
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden divide-y divide-slate-200 dark:divide-white/5">
        
        {[
          { name: 'Google', desc: 'Used for single sign-on and calendar sync', status: 'Connected', icon: 'M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z' },
          { name: 'GitHub', desc: 'Import repositories for project submissions', status: 'Connected', icon: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' },
          { name: 'Discord', desc: 'Sync roles and join the student community', status: 'Requires Attention', icon: 'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.05.05 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' },
          { name: 'Zoom', desc: 'Host and join live classroom sessions', status: 'Disconnected', icon: 'M17.05 12.231v4.881l5.449 4.31V2.577l-5.449 4.31v5.344zm-2.148-5.344H1.492C.667 6.887 0 7.554 0 8.38v7.239c0 .826.667 1.492 1.492 1.492h13.41V6.887z' },
          { name: 'Facebook', desc: 'Find friends taking similar courses', status: 'Disconnected', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' }
        ].map((service, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white shadow-sm shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d={service.icon} /></svg>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{service.name}</p>
                <p className="text-sm text-slate-500 mt-1">{service.desc}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:ml-auto">
              {service.status === 'Connected' && (
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">Connected</span>
              )}
              {service.status === 'Requires Attention' && (
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Re-auth needed
                </span>
              )}
              {service.status === 'Disconnected' && (
                <Button variant="outline" size="sm" className="rounded-full">Connect</Button>
              )}
              
              {service.status !== 'Disconnected' && (
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Disconnect">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}

      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTS: PRIVACY TAB
// ============================================================================

const PrivacySettings: React.FC = () => {
  return (
    <section className="space-y-6">
      <SectionLead label="Data" title="Privacy & Sharing" />
      
      <div className="space-y-8">
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Visibility</h4>
          <div className="space-y-6">
            {[
              { label: 'Profile Visibility', desc: 'Allow other students to view your profile and level', active: true },
              { label: 'Activity Visibility', desc: 'Show your current learning progress and active courses', active: false },
              { label: 'Certificate Visibility', desc: 'Make your earned certificates public via link', active: true }
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
                <div className={`w-11 h-6 rounded-full relative cursor-pointer shrink-0 transition-colors ${item.active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.active ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Data Management</h4>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Download Personal Data</p>
                <p className="text-sm text-slate-500 mt-1">Get a copy of all information associated with your account</p>
              </div>
              <Button variant="outline" size="sm">Request Archive</Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Export Learning History</p>
                <p className="text-sm text-slate-500 mt-1">Download your quiz scores, progress, and certificates in CSV</p>
              </div>
              <Button variant="outline" size="sm">Export CSV</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DangerZone: React.FC = () => {
  return (
    <section className="space-y-6 pt-12">
      <SectionLead label="Danger" title="Account Actions" />
      <div className="rounded-3xl border border-red-500/20 bg-red-50/50 dark:bg-red-500/5 backdrop-blur-xl p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-red-500/10">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Deactivate Account</p>
            <p className="text-sm text-slate-500 mt-1">Temporarily disable your account. You can reactivate at any time.</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 border border-red-500/20 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            Deactivate
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Delete Account</p>
            <p className="text-sm text-slate-500 mt-1">Permanently remove your account, progress, and data. This cannot be undone.</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-500/20">
            Delete Account
          </button>
        </div>

      </div>
    </section>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <PageShell wide>
      <div className="relative pt-12 pb-8 min-h-screen">
        {/* Ambient background tailored for a control center */}
        <AmbientGlow variant="cool" />
        
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account, security, and learning preferences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            
            {/* LEFT: Navigation Rail */}
            <aside className="space-y-1 md:sticky md:top-32 md:self-start">
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                      isActive 
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-tab" 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                      />
                    )}
                    <svg className="w-5 h-5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      {tab.id === 'general' && <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                      {tab.id === 'security' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                      {tab.id === 'notifications' && <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />}
                      {tab.id === 'integrations' && <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
                      {tab.id === 'privacy' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                    </svg>
                    {tab.label}
                  </button>
                );
              })}
            </aside>

            {/* RIGHT: Workspace */}
            <main className="relative min-h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-16"
                >
                  {activeTab === 'general' && (
                    <>
                      <AccountOverview />
                      <LearningPreferences />
                      <AppearanceSettings />
                    </>
                  )}
                  {activeTab === 'security' && (
                    <>
                      <SecurityCenter />
                      <LoginSessions />
                    </>
                  )}
                  {activeTab === 'notifications' && (
                    <NotificationPreferences />
                  )}
                  {activeTab === 'integrations' && (
                    <ConnectedAccounts />
                  )}
                  {activeTab === 'privacy' && (
                    <>
                      <PrivacySettings />
                      <DangerZone />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
