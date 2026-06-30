import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../services/axios';
import { Button } from '../components/ui';

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

  useEffect(() => {
    const verifyCert = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/certificates/verify/${certificateId}`);
        setData(res.data.data.certificate);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Certificate not found or invalid.');
      } finally {
        setLoading(false);
      }
    };
    if (certificateId) {
      verifyCert();
    }
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 md:p-12 text-center">
          {error ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Verification Failed</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">{error}</p>
              <Link to="/">
                <Button className="mt-8">Return to Home</Button>
              </Link>
            </div>
          ) : data ? (
            <div className="space-y-8">
              <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Verified Certificate</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">This certificate is valid and authentic.</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-left space-y-4">
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-1">Student Name</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{data.student?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-1">Course Completed</p>
                  <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{data.course?.title}</p>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-1">Issue Date</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{new Date(data.issueDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-1">Certificate ID</p>
                    <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{data.certificateId}</p>
                  </div>
                </div>
              </div>

              {data.pdfUrl && (
                <a href={data.pdfUrl} target="_blank" rel="noreferrer" className="inline-block w-full">
                  <Button className="w-full text-lg py-4">View Original Certificate PDF</Button>
                </a>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default CertificateVerify;
