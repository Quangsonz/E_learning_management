import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/course.api';
import { paymentApi } from '../services/payment.api';
import { Button, PageShell, SectionHeader } from '../components/ui';
import { enrollmentApi } from '../services/enrollment.api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51MockTestKeyForStripe1234567890abcdefghijklmnop');

const CheckoutForm = ({ courseId }: { courseId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    if (!stripe || !elements) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An unexpected error occurred.');
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
      setError(confirmError.message || 'Payment failed.');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
      <PaymentElement id="payment-element" />
      {error && <div className="text-sm font-medium text-rose-500">{error}</div>}
      <Button 
        type="submit" 
        disabled={isLoading || !stripe || !elements}
        className="w-full h-12"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};

const Checkout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  const { success: successToast, error: errorToast } = useToast();
  const isMockMode = true; // Tạm thời bật thanh toán ảo. Sau này tích hợp Stripe thì đổi thành: !import.meta.env.VITE_STRIPE_PUBLIC_KEY

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (courseId && !isMockMode) {
      // Create PaymentIntent as soon as the page loads
      paymentApi.createPaymentIntent(courseId)
        .then((res) => setClientSecret(res.clientSecret))
        .catch((err) => console.error('Failed to create payment intent', err));
    }
  }, [courseId, isMockMode]);

  if (isCourseLoading || !courseData) {
    return <PageShell><div className="pt-24 text-center">Loading checkout...</div></PageShell>;
  }

  const course = courseData.data?.course;
  const price = course?.price || 50;

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
          
          {/* Left Column: Payment Details */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Thanh toán an toàn</h1>
              <p className="text-slate-500 dark:text-slate-400">Hoàn tất thủ tục để bắt đầu hành trình học tập của bạn.</p>
            </div>

            {/* Payment Form */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Thông tin thanh toán
              </h3>
              {isMockMode ? (
                <div className="space-y-6 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/5">
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-sm mb-4 border border-amber-200 dark:border-amber-500/20 flex gap-3 items-start">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <div>
                      <p className="font-bold mb-1">CHẾ ĐỘ THANH TOÁN ẢO (MOCK)</p>
                      <p className="leading-relaxed opacity-90">Hệ thống thanh toán đang được tích hợp. Bấm 'Thanh toán ngay' để giả lập đăng ký thành công mà không bị trừ tiền.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={async () => {
                      setIsMockLoading(true);
                      try {
                        await enrollmentApi.enrollCourse(courseId!);
                        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
                        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
                        queryClient.invalidateQueries({ queryKey: ['course', courseId] });
                        
                        refreshProfile(); // Đồng bộ tài khoản

                        successToast('Thanh toán thành công! Chào mừng bạn đến với khóa học.', 'Giao dịch thành công');
                        setTimeout(() => {
                          navigate(`/courses/${courseId}/learn`);
                        }, 1000);
                      } catch (err: any) {
                        const msg = err.response?.data?.message || 'Mock enrollment failed';
                        console.error('Enrollment error:', msg);
                        setError(msg);
                        errorToast(msg, 'Thanh toán thất bại');
                        setIsMockLoading(false);
                      }
                    }}
                    disabled={isMockLoading}
                    className="w-full h-14 text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                  >
                    {isMockLoading ? 'Đang xử lý giao dịch...' : 'Thanh toán ngay (Ảo)'}
                  </Button>
                </div>
              ) : clientSecret ? (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm courseId={courseId!} />
                </Elements>
              ) : (
                <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[300px] rounded-3xl"></div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bảo mật tuyệt đối</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mã hóa chuẩn 256-bit</p>
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

          {/* Right Column: Order Summary & Features */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Order Summary */}
            <div className="bg-slate-50 dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tóm tắt đơn hàng</h3>
              
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200 dark:border-white/10">
                {course?.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-28 h-20 object-cover rounded-xl shadow-sm shrink-0" />
                ) : (
                  <div className="w-28 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0 flex items-center justify-center">
                    <span className="text-xs text-slate-500">No Image</span>
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
                  <span className="font-medium text-slate-900 dark:text-white">{price.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Thuế & Phí</span>
                  <span className="font-medium text-emerald-500">Miễn phí</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-white/10">
                  <span className="font-bold text-slate-900 dark:text-white">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{price.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Money Back Guarantee */}
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
    </PageShell>
  );
};

export default Checkout;
