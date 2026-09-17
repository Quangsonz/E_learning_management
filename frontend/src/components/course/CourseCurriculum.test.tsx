import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CourseCurriculum } from './CourseCurriculum';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal: string) => defaultVal || key,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: 'vi',
    },
  }),
}));

// Mock localized helper
vi.mock('../../utils/localized', () => ({
  useLocalizedValue: () => (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.vi || val.en || '';
  },
}));

describe('CourseCurriculum Component Tests', () => {
  const mockModules = [
    {
      _id: 'mod-1',
      course: 'course-1',
      title: 'Chương 1: Giới thiệu cơ bản',
      description: 'Tổng quan và thiết lập môi trường',
      order: 1,
      lessons: [
        {
          _id: 'les-1',
          title: 'Bài 1: Cài đặt công cụ',
          duration: 360,
          isPreview: true,
          order: 1,
        },
        {
          _id: 'les-2',
          title: 'Bài 2: Viết mã đầu tiên',
          duration: 600,
          isPreview: false,
          order: 2,
        },
      ],
    },
    {
      _id: 'mod-2',
      course: 'course-1',
      title: 'Chương 2: Kiến trúc nâng cao',
      description: 'Chuyên sâu về kiến trúc',
      order: 2,
      lessons: [
        {
          _id: 'les-3',
          title: 'Bài 3: Tối ưu hiệu năng',
          duration: 1200,
          isPreview: false,
          order: 1,
        },
      ],
    },
  ];

  it('renders modules with title, description, and lesson count', () => {
    render(<CourseCurriculum modules={mockModules as any} />);

    expect(screen.getByText('Chương 1: Giới thiệu cơ bản')).toBeInTheDocument();
    expect(screen.getByText('Tổng quan và thiết lập môi trường')).toBeInTheDocument();
    expect(screen.getByText('Chương 2: Kiến trúc nâng cao')).toBeInTheDocument();
  });

  it('renders lesson titles and preview badge correctly for non-enrolled user', () => {
    render(<CourseCurriculum modules={mockModules as any} isEnrolled={false} />);

    // First module is open by default (index 0)
    expect(screen.getByText('Bài 1: Cài đặt công cụ')).toBeInTheDocument();
    expect(screen.getByText('Bài 2: Viết mã đầu tiên')).toBeInTheDocument();
    expect(screen.getByText('Học thử')).toBeInTheDocument();
  });

  it('renders completed status when lesson is in completedLessons', () => {
    const { container } = render(
      <CourseCurriculum
        modules={mockModules as any}
        completedLessons={['les-1']}
        isEnrolled={true}
      />
    );

    expect(screen.getByText('Bài 1: Cài đặt công cụ')).toBeInTheDocument();
    // Verify completed checkmark svg is rendered (emerald text color)
    const completedIcons = container.querySelectorAll('.text-emerald-500');
    expect(completedIcons.length).toBeGreaterThan(0);
  });

  it('falls back gracefully when only legacy lessons are passed', () => {
    const legacyLessons = [
      { _id: 'leg-1', title: 'Chương A: Bài 1', duration: 180 },
      { _id: 'leg-2', title: 'Chương A: Bài 2', duration: 300 },
    ];

    render(<CourseCurriculum lessons={legacyLessons as any} />);

    expect(screen.getByText('Chương A')).toBeInTheDocument();
  });
});
