import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance, { API_BASE } from '../services/axios';
import { Button } from '../components/ui';
import { 
  Award, 
  CheckCircle2, 
  Share2, 
  Download, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  ArrowLeft,
  GraduationCap,
  Printer,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { useLocalizedValue } from '../utils/localized';

interface CertificateData {
  certificateId: string;
  issueDate: string;
  pdfUrl: string;
  qrCode?: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: any;
    instructor?: {
      name: string;
    };
  };
}

// Ornate Corner SVG Filigree
const CornerFlourish = ({ className = '' }: { className?: string }) => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
    <path d="M3 41V14C3 7.92487 7.92487 3 14 3H41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M9 41V18C9 13.0294 13.0294 9 18 9H41" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
    <circle cx="14" cy="14" r="3.5" fill="currentColor" />
    <path d="M3 3L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// High-End 3D Embossed Gold Wax Seal
const RoyalWaxSeal = () => (
  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0 group">
    {/* Ribbon tails with swallowtail cutouts */}
    <div 
      className="absolute -bottom-4 -left-1 w-7 h-12 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rotate-12 -z-10 shadow-lg" 
      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%)' }} 
    />
    <div 
      className="absolute -bottom-4 -right-1 w-7 h-12 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 -rotate-12 -z-10 shadow-lg" 
      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%)' }} 
    />
    
    {/* Outer gold scalloped ring with radial glow */}
    <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-1 shadow-[0_0_35px_rgba(245,158,11,0.45)] flex items-center justify-center ring-2 ring-amber-300/40">
      <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-800 p-1.5 flex items-center justify-center border border-amber-200/60">
        <div className="w-full h-full rounded-full bg-[#0a0e1a] flex flex-col items-center justify-center text-center p-1.5 border border-dashed border-amber-300/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
          <Award size={22} className="text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mb-0.5" />
          <span className="text-[8px] font-black uppercase tracking-widest text-amber-300 leading-tight">ACADEMIC</span>
          <span className="text-[7px] font-bold text-amber-200/90 tracking-wider">HONORS</span>
        </div>
      </div>
    </div>
  </div>
);

// Academic Director Handwritten Signature Vector
const AcademicSignature = () => (
  <svg width="150" height="42" viewBox="0 0 150 42" fill="none" className="text-amber-300/80 mx-auto sm:mx-0">
    <path 
      d="M10 30C28 10 38 38 55 16C68 4 78 32 98 22C114 14 130 28 145 20" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M32 24C48 20 85 17 118 26" 
      stroke="currentColor" 
      strokeWidth="1.4" 
      strokeLinecap="round" 
      strokeDasharray="3 3"
    />
  </svg>
);

export const CertificateVerify: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const lv = useLocalizedValue();

  useEffect(() => {
    const verifyCert = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/certificates/verify/${certificateId}`);
        setData(res.data.data.certificate);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Chứng chỉ không tồn tại hoặc không hợp lệ trên hệ thống.');
      } finally {
        setLoading(false);
      }
    };
    if (certificateId) {
      verifyCert();
    }
  }, [certificateId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handlePrint = () => {
    window.print();
  };

  const pdfDownloadUrl = data?.certificateId
    ? `${API_BASE}/certificates/${data.certificateId}/pdf`
    : (data?.pdfUrl?.startsWith('http') ? data.pdfUrl : `${API_BASE}${data?.pdfUrl || ''}`);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b14] text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
          <Award className="absolute text-amber-400" size={24} />
        </div>
        <p className="mt-4 text-sm font-semibold text-amber-200/80 animate-pulse">Đang xác thực chữ ký kỹ thuật số...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white relative overflow-hidden flex flex-col justify-between py-10 px-4 sm:px-6">
      {/* Background Star & Glow Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-indigo-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />
      
      {/* Top Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between pb-6 print:hidden">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 px-3.5 py-2 rounded-xl border border-white/10"
        >
          <ArrowLeft size={14} /> Trang chủ E-Learning
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={14} /> Global Digital Verification
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-4">
        {error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto shadow-2xl backdrop-blur-xl"
          >
            <div className="w-20 h-20 mx-auto bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Xác thực thất bại</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
            <Link to="/">
              <Button className="mt-4">Quay về trang chủ</Button>
            </Link>
          </motion.div>
        ) : data ? (
          <div className="space-y-8">
            
            {/* 1. ROYAL MASTERPIECE DIPLOMA FRAME */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative p-[3px] rounded-[2rem] bg-gradient-to-r from-amber-600 via-yellow-200 to-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.22)] print:shadow-none print:p-0"
            >
              <div className="relative bg-[#080d1a] rounded-[calc(2rem-3px)] p-6 sm:p-12 lg:p-14 overflow-hidden border border-amber-500/30 shadow-2xl">
                
                {/* 4 Ornate Gold Corner Flourishes */}
                <CornerFlourish className="absolute top-5 left-5 text-amber-400/80" />
                <CornerFlourish className="absolute top-5 right-5 text-amber-400/80 -scale-x-100" />
                <CornerFlourish className="absolute bottom-5 left-5 text-amber-400/80 -scale-y-100" />
                <CornerFlourish className="absolute bottom-5 right-5 text-amber-400/80 -scale-100" />

                {/* Subtle Guilloche Geometric Watermark */}
                <div className="absolute inset-0 bg-[radial-gradient(#d4af3715_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />
                <div className="absolute inset-6 rounded-2xl border border-dashed border-amber-400/20 pointer-events-none" />

                {/* Top Hologram Seal Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-amber-500/20 pb-8 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20">
                      <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center text-amber-400">
                        <GraduationCap size={28} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400 block">
                        E-Learning Academy System
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-wide">International Accredited Credential</h4>
                    </div>
                  </div>

                  {/* Animated Gold Seal */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wider shadow-inner">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </div>
                    <span>VERIFIED DIGITAL DIPLOMA</span>
                  </div>
                </div>

                {/* Certificate Diploma Body */}
                <div className="py-10 text-center space-y-6 relative z-10">
                  <div className="inline-block">
                    <span className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-400/90 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      CHỨNG CHỈ TỐT NGHIỆP • CERTIFICATE OF ACHIEVEMENT
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Chứng nhận này được trân trọng trao tặng cho</p>

                  {/* Student Name */}
                  <div className="relative inline-block py-2">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_4px_16px_rgba(245,158,11,0.25)]">
                      {data.student?.name}
                    </h1>
                    <div className="w-48 sm:w-64 h-[2px] mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
                    Đã hoàn thành xuất sắc toàn bộ chương trình đào tạo chuyên sâu và bảo vệ thành công đồ án thực chiến cuối khóa:
                  </p>

                  {/* Course Title Card */}
                  <div className="p-5 sm:p-7 bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-2xl border border-amber-500/25 max-w-2xl mx-auto shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent pointer-events-none" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                      {lv(data.course?.title)}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5">
                      Giảng viên hướng dẫn: <span className="text-amber-300 font-bold">{data.course?.instructor?.name || 'Hội đồng Khoa học E-Learning'}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Metadata Row (Signature + Seal + QR Code) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-amber-500/20 text-xs relative z-10 items-end">
                  
                  {/* Left: Signature Block */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1">
                    <AcademicSignature />
                    <div className="w-36 h-[1px] bg-slate-700 mx-auto sm:mx-0 my-1" />
                    <span className="font-bold text-white text-xs tracking-wider">TS. NGUYỄN VĂN AN</span>
                    <span className="text-[10px] text-slate-400 font-medium">Giám đốc Học thuật & Đào tạo</span>
                  </div>

                  {/* Center: Royal Wax Seal */}
                  <div className="flex justify-center order-first sm:order-none pb-2 sm:pb-0">
                    <RoyalWaxSeal />
                  </div>

                  {/* Right: Verification Details & QR */}
                  <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1.5">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                      <Hash size={14} className="text-amber-400" />
                      <span className="font-mono text-xs font-black text-amber-200 tracking-wider">{data.certificateId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Calendar size={13} className="text-amber-400" />
                      <span>Ngày cấp: {new Date(data.issueDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle2 size={13} />
                      <span>Xác thực mật mã học thuật</span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* 2. SKILLS ACQUIRED SECTION */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles size={16} /> Năng lực & Kỹ năng chuyên môn đã công nhận
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Full-Stack Architecture & State Management',
                  'RESTful & GraphQL API Integration',
                  'Enterprise Scalability & Security Best Practices',
                  'Modern UI/UX & Responsive Engineering',
                  'Continuous Integration & Performance Tuning',
                  'Cloud Media & Database Optimization'
                ].map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 hover:border-amber-400/40 transition-colors"
                  >
                    <CheckCircle2 size={12} className="text-amber-400" /> {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. SOCIAL SHARE & PDF DOWNLOAD ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-white/10 rounded-2xl p-6 print:hidden">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-sm text-white">Lưu trữ & Chia sẻ thành tích</h4>
                <p className="text-xs text-slate-400">Xuất bản chứng chỉ lên hồ sơ cá nhân hoặc tải file PDF vector chất lượng cao.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={handleShareLinkedIn}
                  className="px-3.5 py-2.5 bg-[#0a66c2] hover:bg-[#08529c] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg> LinkedIn
                </button>

                <button
                  onClick={handleShareFacebook}
                  className="px-3.5 py-2.5 bg-[#1877f2] hover:bg-[#1565cb] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.78 5.6c1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z"/></svg> Facebook
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  title="Sao chép đường dẫn"
                >
                  <Copy size={15} /> {copied ? 'Đã chép!' : 'Copy Link'}
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-white/10"
                  title="In chứng chỉ"
                >
                  <Printer size={15} /> In
                </button>

                <a 
                  href={pdfDownloadUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 sm:flex-initial"
                >
                  <Button variant="pill" className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/25">
                    <Download size={15} /> Tải PDF gốc (Vector)
                  </Button>
                </a>
              </div>
            </div>

          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-6 border-t border-white/5 print:hidden">
        E-Learning Management System • Global Public Certificate Verification Node
      </footer>
    </div>
  );
};

export default CertificateVerify;
