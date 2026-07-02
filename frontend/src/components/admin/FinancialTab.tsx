import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../../services/analytics.api';
import { adminApi } from '../../services/admin.api';
import { useCountUp } from '../../hooks/useCountUp';
import axiosInstance from '../../services/axios';

type OrderStatus = 'all' | 'pending' | 'paid' | 'failed';

const STATUS_STYLE: Record<string, string> = {
  paid:    'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  failed:  'bg-rose-500/10 text-rose-400',
};

import { Toast } from '../ui';

export const FinancialTab = () => {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<'orders' | 'payouts'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [toast, setToast] = useState('');

  // Orders Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => analyticsApi.getOrderStats({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page,
      limit: 15
    }),
    enabled: mainTab === 'orders'
  });

  // Payouts Query
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin-payouts', payoutPage],
    queryFn: () => adminApi.getPayoutRequests({ status: 'pending', page: payoutPage, limit: 10 }),
    enabled: mainTab === 'payouts'
  });

  // Payout Completion Mutation
  const completePayoutMutation = useMutation({
    mutationFn: ({ id, transactionProofUrl }: { id: string; transactionProofUrl: string }) => 
      adminApi.completePayoutRequest(id, { transactionProofUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      setToast('Đã hoàn tất thanh toán và gửi minh chứng rút tiền.');
      setSelectedPayout(null);
      setProofUrl('');
    }
  });

  const handleExportPDF = async () => {
    try {
      setToast('Đang tạo báo cáo PDF...');
      const response = await axiosInstance.get('/analytics/export-pdf', {
        responseType: 'blob',
        params: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `financial-report-${new Date().getMonth() + 1}-${new Date().getFullYear()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setToast('Đã tải xuống báo cáo tài chính PDF.');
    } catch (error) {
      console.error('Lỗi khi xuất PDF:', error);
      setToast('Lỗi khi tải báo cáo PDF.');
    }
  };

  const orders: any[] = ordersData?.data?.orders || [];
  const totalPages: number = ordersData?.data?.totalPages || 1;
  const total: number = ordersData?.data?.total || 0;
  const summary = ordersData?.data?.summary || { totalRevenue: 0, totalPaidOrders: 0, avgOrderValue: 0 };

  const payouts: any[] = payoutsData?.data?.payouts || [];
  const payoutsTotalPages: number = payoutsData?.data?.totalPages || 1;

  const revenueAnimated = useCountUp(summary.totalRevenue);
  const paidAnimated = useCountUp(summary.totalPaidOrders);
  const avgAnimated = useCountUp(summary.avgOrderValue);

  const orderTabs: { label: string; value: OrderStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Revenue</span>
          <h1 className="text-4xl font-light tracking-tight text-white">Financial Center</h1>
          <p className="text-white/40 text-sm max-w-xl">Quản lý đơn hàng, thanh toán và doanh thu toàn nền tảng.</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Report (PDF)
        </button>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: `${revenueAnimated.toLocaleString('vi-VN')}đ`, sub: 'From paid orders', color: 'emerald' },
          { label: 'Paid Orders', value: paidAnimated.toLocaleString('vi-VN'), sub: 'Completed transactions', color: 'indigo' },
          { label: 'Avg. Order Value', value: `${avgAnimated.toLocaleString('vi-VN')}đ`, sub: 'Per transaction', color: 'cyan' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="flex flex-col gap-2 border-l-2 border-white/10 pl-5 hover:border-white/30 transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{card.label}</span>
            <div className={`text-3xl font-light tracking-tight text-${card.color}-400`}>
              {ordersLoading ? <span className="opacity-30">---</span> : card.value}
            </div>
            <span className="text-xs text-white/30">{card.sub}</span>
          </div>
        ))}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      {/* Main Tab Toggle */}
      <div className="flex gap-6 border-b border-white/10 pb-2">
        <button
          onClick={() => setMainTab('orders')}
          className={`text-sm font-bold uppercase tracking-wider pb-2 relative transition-colors ${
            mainTab === 'orders' ? 'text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          Platform Orders
          {mainTab === 'orders' && (
            <motion.div layoutId="fin-main-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
        <button
          onClick={() => setMainTab('payouts')}
          className={`text-sm font-bold uppercase tracking-wider pb-2 relative transition-colors ${
            mainTab === 'payouts' ? 'text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          Teacher Payouts
          {mainTab === 'payouts' && (
            <motion.div layoutId="fin-main-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
      </div>

      {mainTab === 'orders' ? (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-6 border-b border-white/10 pb-2 -mt-4">
            {orderTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${
                  statusFilter === tab.value ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
                {statusFilter === tab.value && (
                  <motion.div layoutId="finance-status-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            ))}
            <span className="ml-auto text-xs text-white/30 self-end pb-2">{total} order{total !== 1 ? 's' : ''}</span>
          </div>

          {/* Orders Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/30">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="py-3 border-b border-white/5">
                          <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/30 text-sm">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any, idx: number) => (
                    <tr
                      key={order._id}
                      className="hover:bg-white/[0.02] transition-colors border-b border-white/5 text-sm"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              order.user?.avatar?.startsWith('http')
                                ? order.user.avatar
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(order.user?.name || 'U')}&background=6366f1&color=fff&size=32`
                            }
                            alt={order.user?.name}
                            className="w-7 h-7 rounded-full border border-white/10 flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs font-medium text-white/80">{order.user?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-white/40">{order.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-white/70 truncate max-w-[180px] block">{order.course?.title || 'N/A'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-bold text-white">{Number(order.amount || 0).toLocaleString('vi-VN')}đ</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${STATUS_STYLE[order.status] || 'bg-white/5 text-white/50'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-white/40">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Orders Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/30">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Payouts Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/30">
                  <th className="pb-3">Instructor</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Bank Details</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payoutsLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-white/40">Loading payout requests...</td></tr>
                ) : payouts.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-white/40">No pending payout requests.</td></tr>
                ) : (
                  payouts.map((pay: any) => (
                    <tr
                      key={pay._id}
                      className="hover:bg-white/[0.02] transition-colors border-b border-white/5 text-sm"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              pay.instructor?.avatar?.startsWith('http')
                                ? pay.instructor.avatar
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(pay.instructor?.name || 'I')}&background=06b6d4&color=fff&size=32`
                            }
                            alt={pay.instructor?.name}
                            className="w-7 h-7 rounded-full border border-white/10 flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs font-medium text-white/80">{pay.instructor?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-white/40">{pay.instructor?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-bold text-white">{pay.amount.toLocaleString('vi-VN')}đ</span>
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-white/70">
                          <p className="font-semibold">{pay.bankInfo.bankName}</p>
                          <p className="text-white/40">{pay.bankInfo.accountNumber} — {pay.bankInfo.accountName}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedPayout(pay)}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-xs font-bold uppercase transition-colors"
                        >
                          Mark as Paid
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payouts Pagination */}
          {payoutsTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/30">Page {payoutPage} of {payoutsTotalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPayoutPage(p => Math.max(p - 1, 1))}
                  disabled={payoutPage === 1}
                  className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPayoutPage(p => Math.min(p + 1, payoutsTotalPages))}
                  disabled={payoutPage === payoutsTotalPages}
                  className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payout Dialog */}
      <AnimatePresence>
        {selectedPayout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div onClick={() => setSelectedPayout(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-light text-white mb-2">Mark Payout as Completed</h3>
              <p className="text-xs text-white/40 mb-4">
                Confirm settlement for {selectedPayout.instructor?.name} of <strong>{selectedPayout.amount.toLocaleString('vi-VN')}đ</strong>.
              </p>
              <div className="space-y-4">
                <div className="text-xs text-white/60 p-3 bg-white/5 border border-white/5 rounded-lg space-y-1">
                  <p>Bank: <strong>{selectedPayout.bankInfo.bankName}</strong></p>
                  <p>No: <strong>{selectedPayout.bankInfo.accountNumber}</strong></p>
                  <p>Name: <strong>{selectedPayout.bankInfo.accountName}</strong></p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Transaction Bill Image URL</label>
                  <input
                    type="text"
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    placeholder="https://cloudinary.com/... or mock receipt link"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setSelectedPayout(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => completePayoutMutation.mutate({ id: selectedPayout._id, transactionProofUrl: proofUrl || 'mock-receipt' })}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
                >
                  Confirm Paid
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <Toast visible={Boolean(toast)} message={toast} title="Financial Center Update" onClose={() => setToast('')} />
    </div>
  );
};
