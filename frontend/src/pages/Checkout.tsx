import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQuery } from '@tanstack/react-query';
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

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (courseId) {
      // Create PaymentIntent as soon as the page loads
      paymentApi.createPaymentIntent(courseId)
        .then((res) => setClientSecret(res.clientSecret))
        .catch((err) => console.error('Failed to create payment intent', err));
    }
  }, [courseId]);

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

  const isMockMode = !import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  const options = {
    clientSecret: clientSecret || 'mock_secret',
    appearance,
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          title="Checkout" 
          description="Complete your enrollment to start learning."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Order Summary</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200 dark:border-slate-700">
                {course?.thumbnail && (
                  <img src={course.thumbnail} alt="" className="w-24 h-16 object-cover rounded-lg shadow-sm" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{course?.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{course?.instructor?.name || 'Instructor'}</p>
                </div>
              </div>
              <div className="pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Original Price</span>
                  <span className="font-medium text-slate-900 dark:text-white">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium text-slate-900 dark:text-white">$0.00</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">${price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Payment Details</h3>
            {isMockMode ? (
              <div className="space-y-6 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-sm mb-4 border border-amber-200 dark:border-amber-800/50">
                  <p className="font-bold mb-1">MOCK MODE ACTIVE</p>
                  <p>No Stripe keys configured. Clicking 'Pay Now' will simulate a successful payment.</p>
                </div>
                <Button 
                  onClick={async () => {
                    setIsMockLoading(true);
                    try {
                      await enrollmentApi.enrollCourse(courseId!);
                      setTimeout(() => {
                        navigate(`/courses/${courseId}/learn`);
                      }, 1000);
                    } catch (err) {
                      console.error('Mock enrollment failed', err);
                      setIsMockLoading(false);
                    }
                  }}
                  disabled={isMockLoading}
                  className="w-full h-12"
                >
                  {isMockLoading ? 'Processing...' : 'Pay Now'}
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
