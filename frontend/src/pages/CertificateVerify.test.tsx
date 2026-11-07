import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CertificateVerify from './CertificateVerify';
import axiosInstance from '../services/axios';

vi.mock('../services/axios', () => ({
  default: {
    get: vi.fn(),
  },
  API_BASE: '/api',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: { language: 'vi' }
  }),
}));

describe('CertificateVerify Component - Phase 1 Bug F-03 Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders certificate details safely when course.title is a localized object {vi, en}', async () => {
    const mockCertificate = {
      certificateId: 'CERT-12345',
      issueDate: '2026-10-14T00:00:00.000Z',
      pdfUrl: 'https://example.com/cert.pdf',
      student: {
        _id: 'std-1',
        name: 'Nguyễn Văn A',
        email: 'vana@example.com'
      },
      course: {
        _id: 'course-1',
        title: {
          vi: 'Khóa học Lập trình Web Full-Stack',
          en: 'Full-Stack Web Development Course'
        },
        category: { name: { vi: 'Lập trình', en: 'Programming' } },
        instructor: { name: 'Giảng viên Trần B' }
      }
    };

    (axiosInstance.get as any).mockResolvedValueOnce({
      data: {
        data: {
          certificate: mockCertificate
        }
      }
    });

    render(
      <MemoryRouter initialEntries={['/certificates/verify/CERT-12345']}>
        <Routes>
          <Route path="/certificates/verify/:certificateId" element={<CertificateVerify />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify loading state is shown initially
    expect(screen.getByText(/xác thực chữ ký/i)).toBeInTheDocument();

    // Wait for the certificate content to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    // Verify localized title is properly rendered without React child crash
    expect(screen.getByText('Khóa học Lập trình Web Full-Stack')).toBeInTheDocument();
    expect(screen.getByText('CERT-12345')).toBeInTheDocument();
  });

  it('renders error state safely when certificate is not found', async () => {
    (axiosInstance.get as any).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Chứng chỉ không tồn tại hoặc không hợp lệ.'
        }
      }
    });

    render(
      <MemoryRouter initialEntries={['/certificates/verify/INVALID-ID']}>
        <Routes>
          <Route path="/certificates/verify/:certificateId" element={<CertificateVerify />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Xác thực thất bại')).toBeInTheDocument();
      expect(screen.getByText('Chứng chỉ không tồn tại hoặc không hợp lệ.')).toBeInTheDocument();
    });
  });
});
