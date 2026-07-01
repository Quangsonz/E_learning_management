import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/analytics.api';
import { useCountUp } from '../../hooks/useCountUp';

type OrderStatus = 'all' | 'pending' | 'paid' | 'failed';

const STATUS_STYLE: Record<string, string> = {
  paid:    'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  failed:  'bg-rose-500/10 text-rose-400',
};

export const FinancialTab = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => analyticsApi.getOrderStats({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page,
      limit: 15
    }),
  });

  const orders: any[] = data?.data?.orders || [];
  const totalPages: number = data?.data?.totalPages || 1;
  const total: number = data?.data?.total || 0;
  const summary = data?.data?.summary || { totalRevenue: 0, totalPaidOrders: 0, avgOrderValue: 0 };

  const revenueAnimated = useCountUp(summary.totalRevenue);
  const paidAnimated = useCountUp(summary.totalPaidOrders);
  const avgAnimated = useCountUp(summary.avgOrderValue);

  const tabs: { label: string; value: OrderStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Revenue</span>
        <h1 className="text-4xl font-light tracking-tight text-white">Financial Center</h1>
        <p className="text-white/40 text-sm max-w-xl">Quản lý đơn hàng, thanh toán và doanh thu toàn nền tảng.</p>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: `${revenueAnimated.toLocaleString('vi-VN')}đ`, sub: 'From paid orders', color: 'emerald' },
          { label: 'Paid Orders', value: paidAnimated.toLocaleString('vi-VN'), sub: 'Completed transactions', color: 'indigo' },
          { label: 'Avg. Order Value', value: `${avgAnimated.toLocaleString('vi-VN')}đ`, sub: 'Per transaction', color: 'cyan' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col gap-2 border-l-2 border-white/10 pl-5 hover:border-white/30 transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{card.label}</span>
            <div className={`text-3xl font-light tracking-tight text-${card.color}-400`}>
              {isLoading ? <span className="opacity-30">---</span> : card.value}
            </div>
            <span className="text-xs text-white/30">{card.sub}</span>
          </motion.div>
        ))}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      {/* Filter Tabs */}
      <div className="flex gap-6 border-b border-white/10 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${
              statusFilter === tab.value ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
            {statusFilter === tab.value && (
              <motion.div layoutId="finance-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/30 self-end pb-2">{total} order{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Orders Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">User</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Course</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Amount</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Status</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
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
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 border-b border-white/5">
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
                  <td className="py-3 border-b border-white/5">
                    <span className="text-xs text-white/70 truncate max-w-[180px] block">{order.course?.title || 'N/A'}</span>
                  </td>
                  <td className="py-3 border-b border-white/5">
                    <span className="text-sm font-bold text-white">{Number(order.amount || 0).toLocaleString('vi-VN')}đ</span>
                    <span className="text-xs text-white/30 ml-1">VND</span>
                  </td>
                  <td className="py-3 border-b border-white/5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${STATUS_STYLE[order.status] || 'bg-white/5 text-white/50'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 border-b border-white/5">
                    <span className="text-xs text-white/40">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  );
};
