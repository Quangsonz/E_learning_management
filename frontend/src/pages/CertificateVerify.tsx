import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../services/axios';
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
  GraduationCap
} from 'lucide-react';

interface CertificateData {
  certificateId: string;
  issueDate: string;
  pdfUrl: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
    category?: { name: string };
    instructor: {
      name: string;
    };
  };
}

const CertificateVerify: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CertificateData | null>(null);
  const [copied, setCopied] = useState(false);

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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />
      
      {/* Top Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between pb-6">
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
            
            {/* 1. HOLOGRAM VERIFIED DIPLOMA FRAME */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative p-[2px] rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-600 shadow-[0_0_60px_rgba(245,158,11,0.15)]"
            >
              <div className="relative bg-[#0b1120] rounded-[22px] p-6 sm:p-12 overflow-hidden border border-amber-500/20">
                {/* Decorative Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* Top Hologram Seal Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-amber-500/20 pb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg text-slate-950 font-black">
                      <GraduationCap size={26} />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 block">
                        E-Learning Academy System
                      </span>
                      <h4 className="text-sm font-bold text-white">Chứng chỉ Kỹ thuật số Chính thức</h4>
                    </div>
                  </div>

                  {/* Animated Gold Seal */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide shadow-inner">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </div>
                    <span>VERIFIED DIGITAL CERTIFICATE</span>
                  </div>
                </div>

                {/* Certificate Diploma Body */}
                <div className="py-10 text-center space-y-6 relative z-10">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">
                    CHỨNG NHẬN HOÀN THÀNH KHOÁ HỌC / CERTIFICATE OF COMPLETION
                  </p>

                  <p className="text-xs text-slate-400 italic">Chứng nhận rằng học viên</p>

                  {/* Student Name */}
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 py-1">
                    {data.student?.name}
                  </h1>

                  <p className="text-xs text-slate-400 italic max-w-md mx-auto">
                    Đã hoàn thành xuất sắc toàn bộ chương trình đào tạo chuyên sâu và vượt qua bài thi kiểm tra cuối khóa:
                  </p>

                  {/* Course Title */}
                  <div className="p-4 sm:p-6 bg-slate-900/80 rounded-2xl border border-white/10 max-w-2xl mx-auto shadow-inner space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {data.course?.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Giảng viên hướng dẫn: <span className="text-amber-300 font-semibold">{data.course?.instructor?.name || 'Hệ thống E-Learning'}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Metadata Row */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8 border-t border-amber-500/20 text-xs relative z-10">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Calendar className="text-amber-400 shrink-0" size={18} />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Ngày cấp chứng chỉ</span>
                      <span className="font-semibold text-white">{new Date(data.issueDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Hash className="text-amber-400 shrink-0" size={18} />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Mã định danh (ID)</span>
                      <span className="font-mono font-semibold text-amber-200 truncate block">{data.certificateId}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <div>
                      <span className="text-[10px] text-emerald-300 block uppercase font-bold">Trạng thái mã hóa</span>
                      <span className="font-semibold">Chữ ký số hợp lệ 100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. SKILLS ACQUIRED SECTION */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles size={16} /> Năng lực & Kỹ năng đã tích lũy (Skills Acquired)
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Full-Stack Web Development',
                  'State Management & Architecture',
                  'RESTful API Integration',
                  'Modern UI/UX Best Practices',
                  'Security & Authentication',
                  'Database & Cloud Storage'
                ].map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={12} className="text-amber-400" /> {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. SOCIAL SHARE & PDF DOWNLOAD ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-white/10 rounded-2xl p-6">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-sm text-white">Chia sẻ thành quả của bạn</h4>
                <p className="text-xs text-slate-400">Khai báo chứng chỉ chuyên nghiệp lên mạng xã hội hoặc lưu trữ bản ghi PDF.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleShareLinkedIn}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0a66c2] hover:bg-[#08529c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg> LinkedIn
                </button>

                <button
                  onClick={handleShareFacebook}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1877f2] hover:bg-[#1565cb] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.78 5.6c1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z"/></svg> Facebook
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title="Sao chép đường dẫn"
                >
                  <Copy size={16} /> {copied ? 'Đã chép!' : 'Copy'}
                </button>

                {data.pdfUrl && (
                  <a 
                    href={data.pdfUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 sm:flex-initial"
                  >
                    <Button variant="pill" className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400">
                      <Download size={16} /> Tải PDF gốc
                    </Button>
                  </a>
                )}
              </div>
            </div>

          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-6 border-t border-white/5">
        E-Learning Management System • Global Public Certificate Verification Node
      </footer>
    </div>
  );
};

export default CertificateVerify;
