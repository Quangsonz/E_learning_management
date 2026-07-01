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
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          title="Thanh toán khóa học" 
          description="Hoàn tất thủ tục để bắt đầu học tập."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tóm tắt đơn hàng</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200 dark:border-slate-700">
                {course?.thumbnail && (
                  <img src={course.thumbnail} alt="" className="w-24 h-16 object-cover rounded-lg shadow-sm" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{course?.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{course?.instructor?.name || 'Giảng viên'}</p>
                </div>
              </div>
              <div className="pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Giá gốc</span>
                  <span className="font-medium text-slate-900 dark:text-white">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Thuế</span>
                  <span className="font-medium text-slate-900 dark:text-white">$0.00</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">Tổng cộng</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">${price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Thông tin thanh toán</h3>
            {isMockMode ? (
              <div className="space-y-6 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-sm mb-4 border border-amber-200 dark:border-amber-800/50">
                  <p className="font-bold mb-1">CHẾ ĐỘ THANH TOÁN ẢO (MOCK)</p>
                  <p>Chức năng thanh toán đang được phát triển. Bấm 'Thanh toán ngay' để giả lập đăng ký thành công mà không bị trừ tiền.</p>
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
                  className="w-full h-12"
                >
                  {isMockLoading ? 'Đang xử lý...' : 'Thanh toán ngay (Ảo)'}
                </Button>
              </div>
            ) : clientSecret ? (
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm courseId={courseId!} />
              </Elements>
            ) : (
              <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-[300px] rounded-2xl"></div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Checkout;
