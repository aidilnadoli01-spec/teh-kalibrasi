'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SalesData {
  date: string;
  total_sales: number;
  order_count: number;
}

interface Metrics {
  total_revenue: number;
  total_orders: number;
  unique_customers: number;
  avg_order_value: number;
}

interface PaymentStatus {
  status: string;
  count: number;
  total: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface SalesChartData {
  salesData: SalesData[];
  metrics: Metrics;
  paymentBreakdown: PaymentStatus[];
  topProducts: TopProduct[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesChart() {
  const [data, setData] = useState<SalesChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/sales');
      const salesData = await response.json();
      setData(salesData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-20">Loading sales data...</div>;
  }

  if (!data) {
    return <div className="text-white text-center py-20">No data available</div>;
  }

  const tooltipFormatter = (value: any) => formatCurrency(Number(value));
  const tooltipLabelFormatter = (label: any) => `Date: ${label}`;

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Total Revenue (30d)</p>
          <p className="text-3xl font-bold text-emerald-500">
            {formatCurrency(data.metrics.total_revenue)}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Total Orders (30d)</p>
          <p className="text-3xl font-bold text-blue-500">{data.metrics.total_orders}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Unique Customers (30d)</p>
          <p className="text-3xl font-bold text-purple-500">{data.metrics.unique_customers}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Avg Order Value (30d)</p>
          <p className="text-3xl font-bold text-yellow-500">
            {formatCurrency(data.metrics.avg_order_value)}
          </p>
        </div>
      </div>

      {/* Sales Line Chart */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-6">Daily Sales (Last 30 Days)</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff20' }}
                labelStyle={{ color: '#fff' }}
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line
                type="monotone"
                dataKey="total_sales"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Sales"
              />
              <Line
                type="monotone"
                dataKey="order_count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Order Count"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" stroke="#ffffff60" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6">Payment Status</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.paymentBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${Number(value)} orders`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6">Top 5 Products (Last 30 Days)</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" stroke="#ffffff60" />
                <YAxis dataKey="name" type="category" width={120} stroke="#ffffff60" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff20' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[0, 8, 8, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Status Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-6">Payment Status Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-right">Count</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentBreakdown.map((payment) => (
                <tr key={payment.status} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 font-bold capitalize">{payment.status}</td>
                  <td className="py-3 px-4 text-right">{payment.count}</td>
                  <td className="py-3 px-4 text-right text-emerald-500">
                    {formatCurrency(payment.total)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(
                      (payment.count / data.metrics.total_orders) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
