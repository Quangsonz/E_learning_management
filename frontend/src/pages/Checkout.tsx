import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/course.api';
import { paymentApi } from '../services/payment.api';
import { Button, PageShell } from '../components/ui';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51MockTestKeyForStripe1234567890abcdefghijklmnop');

const StripeCheckoutForm = ({ courseId }: { courseId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Có lỗi xảy ra khi xác nhận thanh toán.');
      setIsLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/courses/${courseId}/learn`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || 'Thanh toán Stripe thất bại.');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl">
      <PaymentElement id="payment-element" />
      {error && <div className="text-sm font-medium text-rose-500">{error}</div>}
      <Button 
        type="submit" 
        disabled={isLoading || !stripe || !elements}
        className="w-full h-14 text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
      >
        {isLoading ? 'Đang xử lý...' : 'Thanh toán thẻ ngay'}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'stripe'>('vietqr');
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút đếm ngược
  
  const [useTestAmount, setUseTestAmount] = useState(false);
  
  const [qrDetails, setQrDetails] = useState<{
    qrUrl: string;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      amount: number;
      transferContent: string;
    };
  } | null>(null);

  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const { success: successToast, error: errorToast } = useToast();

  const paymentSteps = [
    { label: 'Tạo mã VietQR chuẩn Ngân hàng', desc: 'Khởi tạo mã chuyển khoản MBBank...' },
    { label: 'Đang kết nối cổng ngân hàng', desc: 'Đồng bộ hệ thống tài khoản...' },
    { label: 'Xác nhận số dư & giao dịch thành công', desc: 'Đã nhận thông tin chuyển khoản...' },
    { label: 'Đăng ký khóa học vào tài khoản', desc: 'Cấp quyền truy cập video bài giảng...' },
    { label: 'Giao dịch hoàn tất thành công', desc: 'Chào mừng bạn đến với khóa học!' }
  ];

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Đếm ngược 15 phút cho mã QR
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Khởi tạo mã VietQR
  useEffect(() => {
    if (courseId && paymentMethod === 'vietqr') {
      const targetAmount = useTestAmount ? 1000 : undefined;
      paymentApi.createQROrder(courseId, targetAmount)
        .then((res) => {
          if (res.data) {
            setQrDetails({
              qrUrl: res.data.qrUrl,
              bankInfo: res.data.bankInfo
            });
          }
        })
        .catch((err) => {
          console.error('Lỗi khởi tạo VietQR:', err);
        });
    }
  }, [courseId, paymentMethod, useTestAmount]);

  // Khởi tạo Stripe Intent nếu chuyển sang Stripe
  useEffect(() => {
    if (courseId && paymentMethod === 'stripe' && !clientSecret) {
      paymentApi.createPaymentIntent(courseId)
        .then((res) => setClientSecret(res.clientSecret))
        .catch((err) => console.error('Lỗi khởi tạo Stripe intent:', err));
    }
  }, [courseId, paymentMethod, clientSecret]);

  if (isCourseLoading || !courseData) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 text-sm">Đang tải thông tin thanh toán...</p>
        </div>
      </PageShell>
    );
  }

  const course = courseData.data?.course;
  const price = course?.price || 0;
  const estimatedPrice = course?.estimatedPrice || price;
  const discountAmount = estimatedPrice - price;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    successToast(`Đã chép ${fieldName} vào bộ nhớ tạm!`, 'Đã sao chép');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmQRPayment = async () => {
    setIsProcessing(true);
    setPaymentStep(1);

    setTimeout(() => {
      setPaymentStep(2);

      setTimeout(() => {
        setPaymentStep(3);

        setTimeout(async () => {
          setPaymentStep(4);

          try {
            await paymentApi.confirmQRPayment(courseId!);
            
            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['enrollments'] });
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            queryClient.invalidateQueries({ queryKey: ['student-dashboard-summary'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });

            refreshProfile(); // Refresh auth profile

            setPaymentStep(5);
            successToast('Thanh toán VietQR thành công! Chào mừng bạn đến với khóa học.', 'Giao dịch thành công');

            setTimeout(() => {
              setPaymentStep(null);
              setIsProcessing(false);
              navigate(`/courses/${courseId}/learn`);
            }, 1200);

          } catch (err: any) {
            const msg = err.response?.data?.message || 'Xác nhận thanh toán thất bại';
            console.error('Lỗi xác nhận VietQR:', msg);
            errorToast(msg, 'Thanh toán thất bại');
            setPaymentStep(null);
            setIsProcessing(false);
          }
        }, 900);
      }, 900);
    }, 900);
  };

  const transferContent = qrDetails?.bankInfo.transferContent || `EL${courseId?.slice(-6).toUpperCase()}${user?._id?.slice(-4).toUpperCase() || 'USER'}`;
  const qrCodeImageUrl = qrDetails?.qrUrl || `https://img.vietqr.io/image/MB-0383888999-compact2.png?amount=${price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('HE THONG E LEARNING')}`;

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#4f46e5',
      colorBackground: '#ffffff',
      colorText: '#0f172a',
    },
  };

  const options = {
    clientSecret: clientSecret || 'mock_secret',
    appearance,
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Payment Details & QR Code */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Thanh toán an toàn 256-bit
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-3 mb-2">Thanh toán khóa học</h1>
              <p className="text-slate-500 dark:text-slate-400">Chọn phương thức phù hợp để hoàn tất đăng ký học tập ngay lập tức.</p>
            </div>

            {/* Payment Method Switcher Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setPaymentMethod('vietqr')}
                className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'vietqr'
                    ? 'bg-white dark:bg-[#1A1A1A] text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-white/10'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Quét mã VietQR (Ngân hàng)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'bg-white dark:bg-[#1A1A1A] text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-white/10'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Thẻ Quốc tế (Stripe)
              </button>
            </div>

            {/* VietQR Payment Method View */}
            {paymentMethod === 'vietqr' ? (
              <div className="space-y-6 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl">
                
                {/* Timer & Test Amount Mode Bar */}
                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span>Mã VietQR tự động cập nhật số tiền & nội dung</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thời hạn mã</span>
                    <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                {/* Amount Mode Selector for Testing with Real Banking App */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Chế độ tạo mã QR</span>
                    <span className="text-[11px] text-slate-500">Dùng App thật quét thoải mái mà không lo tốn tiền</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setUseTestAmount(false)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        !useTestAmount 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Giá gốc ({price.toLocaleString('vi-VN')}đ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseTestAmount(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        useTestAmount 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Test (1.000đ)
                    </button>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 relative group">
                  <img 
                    src={qrCodeImageUrl} 
                    alt="VietQR Code" 
                    className="w-60 h-60 object-contain rounded-xl shadow-xl border-4 border-white dark:border-slate-800 bg-white" 
                  />
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Mở ứng dụng Ngân hàng (MB, VCB, Momo, ZaloPay...) để quét mã</span>
                  </div>
                </div>

                {/* Bank Account Details Form Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin chuyển khoản</h4>
                  
                  {/* Ngân hàng */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Ngân hàng thụ hưởng</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{qrDetails?.bankInfo.bankName || 'MBBank (Ngân hàng Quân Đội)'}</span>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 rounded-md uppercase">BANK</span>
                  </div>

                  {/* Số tài khoản */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Số tài khoản</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{qrDetails?.bankInfo.accountNumber || '0383888999'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(qrDetails?.bankInfo.accountNumber || '0383888999', 'Số tài khoản')}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                    >
                      {copiedField === 'Số tài khoản' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Tên chủ tài khoản */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Chủ tài khoản</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{qrDetails?.bankInfo.accountName || 'HE THONG E LEARNING'}</span>
                    </div>
                  </div>

                  {/* Số tiền */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Số tiền cần chuyển</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{(qrDetails?.bankInfo.amount || price).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy((qrDetails?.bankInfo.amount || price).toString(), 'Số tiền')}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                    >
                      {copiedField === 'Số tiền' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="flex items-center justify-between p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <div>
                      <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider block">Nội dung chuyển khoản (Bắt buộc)</span>
                      <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400">{transferContent}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, 'Nội dung chuyển khoản')}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      {copiedField === 'Nội dung chuyển khoản' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-2">
                  <Button 
                    onClick={handleConfirmQRPayment}
                    disabled={isProcessing}
                    className="w-full h-14 text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                  >
                    {isProcessing ? 'Đang xác nhận giao dịch...' : 'Xác nhận đã quét & thanh toán thành công'}
                  </Button>
                  <p className="text-[11px] text-center text-slate-400 mt-2 italic">
                    * Trong môi trường thử nghiệm Đồ án: Nhấn nút trên để giả lập nhận tiền tự động và kích hoạt khóa học ngay lập tức.
                  </p>
                </div>

              </div>
            ) : clientSecret ? (
              <Elements options={options} stripe={stripePromise}>
                <StripeCheckoutForm courseId={courseId!} />
              </Elements>
            ) : (
              <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[300px] rounded-3xl flex items-center justify-center text-slate-400 text-sm">
                Đang kết nối cổng Stripe...
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bảo mật tuyệt đối</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mã hóa chuẩn VietQR SSL</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Truy cập trọn đời</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Học bất cứ lúc nào</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Course Features */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Order Summary Card */}
            <div className="bg-slate-50 dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 sticky top-24 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tóm tắt đơn hàng</h3>
              
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200 dark:border-white/10">
                {course?.thumbnailUrl || course?.thumbnail ? (
                  <img src={course?.thumbnailUrl || course?.thumbnail} alt="" className="w-28 h-20 object-cover rounded-xl shadow-sm shrink-0" />
                ) : (
                  <div className="w-28 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0 flex items-center justify-center">
                    <span className="text-xs text-slate-500">Course Image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1">{course?.title}</h4>
                  <p className="text-sm text-slate-500 truncate">{course?.instructor?.name || 'Giảng viên'}</p>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Giá gốc</span>
                  <span className={`font-medium ${discountAmount > 0 ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{estimatedPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Giảm giá ({course?.discountPercentage}%)</span>
                    <span className="font-medium text-rose-500">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phương thức thanh toán</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{paymentMethod === 'vietqr' ? 'VietQR (MBBank)' : 'Stripe Card'}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-white/10">
                  <span className="font-bold text-slate-900 dark:text-white">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{price.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Guarantee */}
              <div className="mt-8 flex items-start gap-3 bg-white dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">Cam kết hoàn tiền 30 ngày</h5>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Nếu bạn không hài lòng với khóa học, chúng tôi sẽ hoàn 100% học phí không cần lý do.</p>
                </div>
              </div>
            </div>

            {/* Course Includes */}
            <div className="bg-transparent p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Khóa học bao gồm</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Truy cập trọn đời toàn bộ bài giảng
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  Học trên mọi thiết bị (PC, Mobile, Tablet)
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Tài liệu tải xuống và bài tập thực hành
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Cấp chứng nhận sau khi hoàn thành
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Payment Processing Overlay */}
      {paymentStep !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151515] p-8 rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md mx-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 animate-pulse" />
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Đang xử lý thanh toán VietQR</h3>
                <p className="text-xs text-slate-400 mt-1">Vui lòng giữ nguyên màn hình trong giây lát</p>
              </div>

              {/* Progress steps */}
              <div className="space-y-4 py-2">
                {paymentSteps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isDone = paymentStep > stepNum;
                  const isCurrent = paymentStep === stepNum;

                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="relative shrink-0">
                        {isDone ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center text-xs font-black">
                            {stepNum}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-semibold transition-colors ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isDone ? 'text-slate-900 dark:text-white opacity-80' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 animate-pulse leading-snug">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loader ring for step 1-4, success check for step 5 */}
              <div className="flex justify-center pt-2">
                {paymentStep < 5 ? (
                  <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-bounce">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">Xác nhận thanh toán thành công!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Checkout;
