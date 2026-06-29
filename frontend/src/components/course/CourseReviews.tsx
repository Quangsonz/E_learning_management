import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, Review } from '../../services/review.api';
import { Button, SectionLead } from '../ui';

interface CourseReviewsProps {
  courseId: string;
  isEnrolled: boolean;
  isInstructor?: boolean;
  reviewsData: any; // Ideally a strict type, but we use what was in CourseDetail
}

export const CourseReviews: React.FC<CourseReviewsProps> = ({ courseId, isEnrolled, isInstructor, reviewsData }) => {
  const queryClient = useQueryClient();
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submitReviewMutation = useMutation({
    mutationFn: (data: any) => reviewApi.createReview(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setReviewFormOpen(false);
      setComment('');
      setRating(5);
    }
  });

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const submitReplyMutation = useMutation({
    mutationFn: (data: { reviewId: string; text: string }) => reviewApi.replyToReview(courseId, data.reviewId, data.text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      setReplyingTo(null);
      setReplyText('');
    }
  });

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <SectionLead label="Testimonials" title="Student Reviews" className="mb-0" />
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{reviewsData?.data?.averageRating?.toFixed(1) || '0.0'}</div>
          <div className="flex items-center text-amber-500 mt-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="16" height="16" fill={i < Math.round(reviewsData?.data?.averageRating || 0) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
        </div>
      </div>

      {isEnrolled && (
        <div className="mb-8">
          {!reviewFormOpen ? (
            <Button variant="outline" onClick={() => setReviewFormOpen(true)}>
              Write a Review
            </Button>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Your Rating</h4>
              <div className="flex gap-2 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                    <svg width="24" height="24" fill={star <= rating ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience with this course..."
                className="w-full min-h-[100px] resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setReviewFormOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => submitReviewMutation.mutate({ rating, comment })}
                  disabled={!comment.trim() || submitReviewMutation.isPending}
                >
                  {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
              {submitReviewMutation.isError && (
                <p className="text-red-500 text-sm mt-2">{(submitReviewMutation.error as any)?.response?.data?.message || 'Error submitting review'}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {reviewsData?.data?.data?.reviews?.map((review: Review, i: number) => (
          <div key={i} className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/30 p-6 flex flex-col h-full">
            <div className="flex items-center gap-1 text-amber-500 mb-3">
              {[...Array(review.rating)].map((_, idx) => (
                <svg key={idx} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex-1">"{review.comment}"</p>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {review.student?.avatar ? (
                    <img src={review.student.avatar} alt={review.student.name} className="w-full h-full object-cover" />
                  ) : review.student?.name?.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{review.student?.name}</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</div>
            </div>

            {review.instructorReply && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Instructor Reply</div>
                <p className="text-sm text-slate-700 dark:text-slate-300">"{review.instructorReply}"</p>
              </div>
            )}

            {isInstructor && !review.instructorReply && replyingTo !== review._id && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setReplyingTo(review._id)}>Reply</Button>
              </div>
            )}

            {isInstructor && replyingTo === review._id && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full min-h-[80px] resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                  <Button 
                    size="sm"
                    onClick={() => submitReplyMutation.mutate({ reviewId: review._id, text: replyText })}
                    disabled={!replyText.trim() || submitReplyMutation.isPending}
                  >
                    {submitReplyMutation.isPending ? 'Saving...' : 'Submit Reply'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
