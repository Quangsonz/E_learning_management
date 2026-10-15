import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/course.api';
import { paymentApi } from '../services/payment.api';
import { Button, PageShell } from '../components/ui';
import { useLocalizedValue } from '../utils/localized';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const StripeCheckoutForm = ({ courseId }: { courseId: string }) => {
  const { t } = useTranslation();
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
      setError(submitError.message || t('common.error'));
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
      setError(confirmError.message || t('checkout.failedToast'));
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
        {isLoading ? t('checkout.processing') : t('checkout.payCardNow')}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'stripe'>('vietqr');
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isExpired, setIsExpired] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [useFallbackQr, setUseFallbackQr] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  
  const [orderState, setOrderState] = useState<{
    orderId: string;
    orderCode: string;
    status: string;
    amount: number;
    expiresAt: string;
    qrUrl: string;
    fallbackQrDataUrl?: string;
    bankInfo: {
      bankId: string;
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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  const loadQROrder = useCallback(async () => {
    if (!courseId) return;
    try {
      setIsExpired(false);
      setUseFallbackQr(false);
      const res = await paymentApi.createQROrder(courseId);
      if (res.data) {
        setOrderState({
          orderId: res.data.orderId,
          orderCode: res.data.orderCode,
          status: res.data.status,
          amount: res.data.amount,
          expiresAt: res.data.expiresAt,
          qrUrl: res.data.qrUrl,
          fallbackQrDataUrl: res.data.fallbackQrDataUrl,
          bankInfo: res.data.bankInfo
        });

        // Tính toán chính xác thời gian còn lại dựa trên expiresAt từ server
        if (res.data.expiresAt) {
          const remainingSecs = Math.max(0, Math.floor((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000));
          setTimeLeft(remainingSecs);
          if (remainingSecs <= 0) {
            setIsExpired(true);
          }
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khởi tạo đơn hàng thanh toán';
      console.error('Lỗi khởi tạo VietQR:', msg);
      errorToast(msg, 'Thanh toán');
    }
  }, [courseId, errorToast]);

  // Khởi tạo VietQR Order
  useEffect(() => {
    if (courseId && paymentMethod === 'vietqr') {
      loadQROrder();
    }
  }, [courseId, paymentMethod, loadQROrder]);

  // Khởi tạo Stripe Intent nếu chuyển sang Stripe
  useEffect(() => {
    if (courseId && paymentMethod === 'stripe' && !clientSecret) {
      paymentApi.createPaymentIntent(courseId)
        .then((res) => setClientSecret(res.clientSecret))
        .catch((err) => console.error('Lỗi khởi tạo Stripe intent:', err));
    }
  }, [courseId, paymentMethod, clientSecret]);

  // Đếm ngược thời gian hết hạn của đơn hàng (1 giây mỗi lần)
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Real-time Polling: Kiểm tra trạng thái thanh toán từ backend
  useEffect(() => {
    const orderId = orderState?.orderId;
    if (!orderId || isPaidSuccess || isExpired || paymentMethod !== 'vietqr') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await paymentApi.getOrderStatus(orderId);
        const currentOrder = res?.data?.order;
        if (!currentOrder) return;

        // Nếu trạng thái đã chuyển sang 'paid'
        if (currentOrder.status === 'paid') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPaidSuccess(true);

          // Cập nhật cache React Query
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
          queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
          queryClient.invalidateQueries({ queryKey: ['learning-statistics'] });
          queryClient.invalidateQueries({ queryKey: ['course', courseId] });
          queryClient.invalidateQueries({ queryKey: ['student-dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });

          refreshProfile();
          successToast(t('checkout.successToast'), t('checkout.confirmedSuccess'));

          setTimeout(() => {
            navigate(`/courses/${courseId}/learn`);
          }, 1800);
        } else if (currentOrder.status === 'expired') {
          setIsExpired(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (currentOrder.status === 'pending_verification') {
          setOrderState(prev => prev ? { ...prev, status: 'pending_verification' } : null);
        }
      } catch (pollErr) {
        // Polling im lặng trong nền, không làm gián đoạn UI người dùng
      }
    };

    pollingRef.current = setInterval(checkStatus, 3500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderState?.orderId, isPaidSuccess, isExpired, paymentMethod, courseId, navigate, queryClient, refreshProfile, successToast, t]);

  if (isCourseLoading || !courseData) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 text-sm">{t('checkout.processing')}</p>
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
    successToast(`${fieldName}: ${t('checkout.copiedToast')}`, t('checkout.copied'));
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Học viên gửi thông báo đã chuyển khoản
  const handleSubmitTransferProof = async () => {
    if (!orderState?.orderId) return;
    setIsSubmittingProof(true);
    try {
      await paymentApi.confirmTransfer(orderState.orderId, transactionRef);
      setOrderState(prev => prev ? { ...prev, status: 'pending_verification' } : null);
      successToast(t('checkout.waitingBankVerification'), 'Đã ghi nhận');
    } catch (err: any) {
      const msg = err.response?.data?.message || t('checkout.failedToast');
      errorToast(msg, t('checkout.failedToast'));
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Chế độ Sandbox / Trình chiếu Đồ án
  const handleDemoSimulate = async () => {
    if (!orderState?.orderId) return;
    setIsProcessing(true);
    try {
      await paymentApi.demoSimulatePayment(orderState.orderId);
      successToast('[Demo Sandbox] Đã kích hoạt nhận tiền giả lập thành công!', 'Demo Mode');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Chế độ giả lập chỉ khả dụng trong môi trường thử nghiệm.';
      errorToast(msg, 'Sandbox Mode');
    } finally {
      setIsProcessing(false);
    }
  };

  const transferContent = orderState?.bankInfo.transferContent || (orderState?.orderCode ? `EL ${orderState.orderCode}` : 'EL ELEARNING');
  const qrCodeImageUrl = useFallbackQr 
    ? (orderState?.fallbackQrDataUrl || '') 
    : (orderState?.qrUrl || '');

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

  const isDemoAllowed = user?.role === 'admin' || import.meta.env.DEV;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Payment Details & QR Code */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {t('checkout.secure256')}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-3 mb-2">{t('checkout.title')}</h1>
              <p className="text-slate-500 dark:text-slate-400">{t('checkout.pageDesc')}</p>
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
                {t('checkout.vietqr')}
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
                {t('checkout.stripe')}
              </button>
            </div>

            {/* VietQR Payment Method View */}
            {paymentMethod === 'vietqr' ? (
              <div className="space-y-6 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                
                {/* Timer Bar */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                  isExpired 
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30' 
                    : orderState?.status === 'pending_verification'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
                    : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
                }`}>
                  <div className="flex items-center gap-2 font-medium text-xs">
                    {isExpired ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{t('checkout.qrExpiredTitle')}</span>
                    ) : orderState?.status === 'pending_verification' ? (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>{t('checkout.waitingBankVerification')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                        <span>{t('checkout.qrAutoUpdate')}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('checkout.expireIn')}</span>
                    <span className={`text-sm font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* Expired State Notice */}
                {isExpired ? (
                  <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/40 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{t('checkout.qrExpiredTitle')}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{t('checkout.qrExpiredDesc')}</p>
                    </div>
                    <Button onClick={loadQROrder} className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md">
                      {t('checkout.createNewQrBtn')}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 relative group min-h-[280px]">
                      {qrCodeImageUrl ? (
                        <>
                          <img 
                            src={qrCodeImageUrl} 
                            alt="VietQR Code" 
                            onError={() => {
                              if (!useFallbackQr && orderState?.fallbackQrDataUrl) {
                                setUseFallbackQr(true);
                              }
                            }}
                            className="w-64 h-64 object-contain rounded-xl shadow-xl border-4 border-white dark:border-slate-800 bg-white" 
                          />
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>{t('checkout.openBankAppPrompt')}</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-60 h-60 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse flex flex-col items-center justify-center text-slate-400 gap-2">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">{t('common.loading')}</span>
                        </div>
                      )}
                    </div>

                    {/* Bank Account Details Form Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('checkout.transferDetails')}</h4>
                        {orderState?.orderCode && (
                          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            {t('checkout.orderCodeLabel')}: {orderState.orderCode}
                          </span>
                        )}
                      </div>
                      
                      {/* Ngân hàng */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('checkout.bankName')}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{orderState?.bankInfo.bankName || 'MBBank'}</span>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 rounded-md uppercase">BANK</span>
                      </div>

                      {/* Số tài khoản */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('checkout.accountNumber')}</span>
                          <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{orderState?.bankInfo.accountNumber || '---'}</span>
                        </div>
                        {orderState?.bankInfo.accountNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(orderState.bankInfo.accountNumber, t('checkout.accountNumber'))}
                            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                          >
                            {copiedField === t('checkout.accountNumber') ? t('checkout.copied') : t('checkout.copy')}
                          </button>
                        )}
                      </div>

                      {/* Tên chủ tài khoản */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('checkout.accountName')}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{orderState?.bankInfo.accountName || '---'}</span>
                        </div>
                      </div>

                      {/* Số tiền */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('checkout.amount')}</span>
                          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{(orderState?.amount || price).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy((orderState?.amount || price).toString(), t('checkout.amount'))}
                          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                        >
                          {copiedField === t('checkout.amount') ? t('checkout.copied') : t('checkout.copy')}
                        </button>
                      </div>

                      {/* Nội dung chuyển khoản duy nhất */}
                      <div className="flex items-center justify-between p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <div>
                          <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider block">{t('checkout.transferContentRequired')}</span>
                          <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400">{transferContent}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferContent, t('checkout.transferContent'))}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                        >
                          {copiedField === t('checkout.transferContent') ? t('checkout.copied') : t('checkout.copy')}
                        </button>
                      </div>
                    </div>

                    {/* Transaction Reference Input (Tùy chọn) */}
                    <div className="space-y-1.5 pt-1">
                      <label htmlFor="tx-ref" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t('checkout.enterRefCodePrompt')}
                      </label>
                      <input
                        id="tx-ref"
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="VD: FT242888999 hoặc mã giao dịch App ngân hàng"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-3">
                      <Button 
                        onClick={handleSubmitTransferProof}
                        disabled={isSubmittingProof || orderState?.status === 'pending_verification'}
                        className="w-full h-14 text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                      >
                        {isSubmittingProof ? t('checkout.confirming') : orderState?.status === 'pending_verification' ? t('checkout.waitingBankVerification') : t('checkout.confirmTransferBtn')}
                      </Button>

                      {/* Controlled Demo Simulation Button for Thesis Defense (Chỉ hiện cho Admin hoặc Dev) */}
                      {isDemoAllowed ? (
                        <div className="pt-2 space-y-1.5 border-t border-dashed border-amber-300 dark:border-amber-700/50">
                          <button
                            type="button"
                            onClick={handleDemoSimulate}
                            disabled={isProcessing}
                            className="w-full py-2.5 px-4 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            <span>{t('checkout.demoSimulateBtn')}</span>
                          </button>
                          <p className="text-[10px] text-center text-amber-600 dark:text-amber-400/80 italic">
                            {t('checkout.mockNotice')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                          {t('checkout.autoActivePrompt')}
                        </p>
                      )}
                    </div>
                  </>
                )}

              </div>
            ) : clientSecret && stripePromise ? (
              <Elements options={options} stripe={stripePromise}>
                <StripeCheckoutForm courseId={courseId!} />
              </Elements>
            ) : clientSecret && !stripePromise ? (
              <div className="p-8 text-center bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-sm">
                Stripe payment is not currently configured. Please select VietQR payment method.
              </div>
            ) : (
              <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[300px] rounded-3xl flex items-center justify-center text-slate-400 text-sm">
                {t('checkout.connectingStripe')}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('checkout.securityBadge')}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t('checkout.securityBadgeDesc')}</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('checkout.lifetimeAccessBadge')}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t('checkout.lifetimeAccessBadgeDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Course Features */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Order Summary Card */}
            <div className="bg-slate-50 dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 sticky top-24 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('checkout.orderSummary')}</h3>
              
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200 dark:border-white/10">
                {course?.thumbnailUrl || course?.thumbnail ? (
                  <img src={course?.thumbnailUrl || course?.thumbnail} alt="" className="w-28 h-20 object-cover rounded-xl shadow-sm shrink-0" />
                ) : (
                  <div className="w-28 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0 flex items-center justify-center">
                    <span className="text-xs text-slate-500">Course Image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-1">{lv(course?.title)}</h4>
                  <p className="text-sm text-slate-500 truncate">{course?.instructor?.name || t('course.instructor')}</p>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('checkout.estimatedPrice')}</span>
                  <span className={`font-medium ${discountAmount > 0 ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{estimatedPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('checkout.discount')} ({course?.discountPercentage}%)</span>
                    <span className="font-medium text-rose-500">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('checkout.paymentMethod')}</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {paymentMethod === 'vietqr' ? `VietQR (${orderState?.bankInfo.bankName || 'Vietcombank'})` : 'Stripe Card'}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-white/10">
                  <span className="font-bold text-slate-900 dark:text-white">{t('checkout.total')}</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{price.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Guarantee */}
              <div className="mt-8 flex items-start gap-3 bg-white dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">{t('checkout.guarantee')}</h5>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('checkout.guaranteeDesc')}</p>
                </div>
              </div>
            </div>

            {/* Course Includes */}
            <div className="bg-transparent p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('checkout.courseIncludes')}</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {t('checkout.include1')}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  {t('checkout.include2')}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  {t('checkout.include3')}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  {t('checkout.include4')}
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Success Celebration Overlay when Polling detects Paid status */}
      {isPaidSuccess && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#151515] p-8 rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-sm mx-4 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('checkout.confirmedSuccess')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('checkout.successToast')}</p>
            </div>
            <div className="pt-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                {t('checkout.goToCourse')}...
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageShell>
  );
};

export default Checkout;
