import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppContext } from '../App';
import { UsersIcon, ShoppingCartIcon, PackageIcon, DollarSignIcon, FileTextIcon } from '../components/icons';
import { Invoice } from '../types';

// Small UI helpers
const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
  </div>
);

const Section = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

// Helpers for returns and profit calculations
const getInvoiceReturnAmount = (inv: Invoice): number => {
  if (typeof inv.refundedAmount === 'number') return inv.refundedAmount || 0;
  if (inv.returns) {
    // Fallback compute from returns map
    return inv.items.reduce((sum, it) => sum + (inv.returns![it.product.id] || 0) * it.price, 0);
  }
  return 0;
};

const DashboardPage = () => {
  const { products, customers, invoices, expenses, users } = useAppContext();

  // Date filter state (YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const isWithinRange = (dateStr: string) => {
    if (!fromDate && !toDate) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  // Filter data by date
  const filteredInvoices = useMemo(() => invoices.filter(inv => isWithinRange(inv.date)), [invoices, fromDate, toDate]);
  const filteredExpenses = useMemo(() => expenses.filter(ex => isWithinRange(ex.date)), [expenses, fromDate, toDate]);

  // Totals and KPIs
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalReturns = filteredInvoices.reduce((sum, inv) => sum + getInvoiceReturnAmount(inv), 0);
  const totalExpenses = filteredExpenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);

  // Profit: (price - purchasePrice) * (soldQty - returnedQty)
  const totalProfit = filteredInvoices.reduce((acc, inv) => {
    const returnsMap = inv.returns || {};
    const invoiceProfit = inv.items.reduce((p, item) => {
      const product = products.find(pr => pr.id === item.product.id);
      if (!product) return p;
      const returnedQty = returnsMap[item.product.id] || 0;
      const effectiveQty = Math.max(0, (item.quantity || 0) - returnedQty);
      return p + (item.price - product.purchasePrice) * effectiveQty;
    }, 0);
    return acc + invoiceProfit;
  }, 0);

  const netSales = Math.max(0, totalSales - totalReturns);
  const netProfit = totalProfit - totalExpenses;

  const totalInvoices = filteredInvoices.length;
  const totalCustomers = customers.length;
  const totalProducts = products.length;

  // Sales/Returns/Expenses by day chart data
  const byDayMap: Record<string, { sales: number; returns: number; expenses: number; }> = {};
  filteredInvoices.forEach(inv => {
    const key = inv.date; // already YYYY-MM-DD
    byDayMap[key] = byDayMap[key] || { sales: 0, returns: 0, expenses: 0 };
    byDayMap[key].sales += inv.total || 0;
    byDayMap[key].returns += getInvoiceReturnAmount(inv);
  });
  filteredExpenses.forEach(ex => {
    const key = ex.date;
    byDayMap[key] = byDayMap[key] || { sales: 0, returns: 0, expenses: 0 };
    byDayMap[key].expenses += ex.amount || 0;
  });
  const trendData = Object.keys(byDayMap).sort().map(d => ({ date: d, ...byDayMap[d] }));

  // Per-user performance
  const userStats = useMemo(() => {
    // Group invoices by creator
    const map: Record<string, { name: string; totalSales: number; invoiceCount: number; itemsSold: number; }>
      = {};
    filteredInvoices.forEach(inv => {
      const uid = inv.createdById || 'unknown';
      const uname = inv.createdByName || (users.find(u => u.id === inv.createdById)?.name) || 'غير معروف';
      if (!map[uid]) map[uid] = { name: uname, totalSales: 0, invoiceCount: 0, itemsSold: 0 };
      map[uid].totalSales += inv.total || 0;
      map[uid].invoiceCount += 1;
      // Items sold (exclude returns)
      const returnsMap = inv.returns || {};
      inv.items.forEach(it => {
        const returned = returnsMap[it.product.id] || 0;
        const eff = Math.max(0, (it.quantity || 0) - returned);
        map[uid].itemsSold += eff;
      });
    });
    // Convert to array
    return Object.entries(map).map(([id, v]) => ({ id, ...v, avgInvoice: v.invoiceCount ? v.totalSales / v.invoiceCount : 0 }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredInvoices, users]);

  // Product Sales (net) for Top products
  const productSales = filteredInvoices.reduce((acc, inv) => {
    const returnsMap = inv.returns || {};
    inv.items.forEach(item => {
      const netQty = Math.max(0, (item.quantity || 0) - (returnsMap[item.product.id] || 0));
      acc[item.product.name] = (acc[item.product.name] || 0) + netQty;
    });
    return acc;
  }, {} as { [key: string]: number });
  const topProductsData = Object.keys(productSales).map(name => ({
    name: name.length > 18 ? name.substring(0, 18) + '...' : name,
    quantitySold: productSales[name],
  })).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 7);

  // Recent invoices (show returns badge if exists)
  const RecentInvoicesTable = ({ invoices }: { invoices: Invoice[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="border-b">
            <th className="p-2">رقم</th>
            <th className="p-2">العميل</th>
            <th className="p-2">التاريخ</th>
            <th className="p-2">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoices.slice(0, 7).map(invoice => (
            <tr key={invoice.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <span className="font-mono">{invoice.id}</span>
                {invoice.returns && Object.values(invoice.returns).some(v => v > 0) && (
                  <span className="ms-2 px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">مرتجع</span>
                )}
              </td>
              <td className="p-2">{invoice.customer?.name || 'عميل نقدي'}</td>
              <td className="p-2">{invoice.date}</td>
              <td className="p-2">{(invoice.total || 0).toFixed(2)} ج.م</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">لوحة التحكم الشاملة</h1>
          <p className="text-gray-600">نظرة عامة على المبيعات، الأرباح، المصاريف، المرتجعات، وأداء المستخدمين</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="p-2 border rounded-lg text-sm" />
          <span className="text-gray-500 text-sm">إلى</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="p-2 border rounded-lg text-sm" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="إجمالي المبيعات" value={`${totalSales.toFixed(2)} ج.م`} icon={<DollarSignIcon className="h-6 w-6 text-white" />} color="bg-green-500/90" />
        <StatCard title="إجمالي المرتجعات" value={`${totalReturns.toFixed(2)} ج.م`} icon={<FileTextIcon className="h-6 w-6 text-white" />} color="bg-red-500/90" />
        <StatCard title="صافي المبيعات" value={`${netSales.toFixed(2)} ج.م`} icon={<ShoppingCartIcon className="h-6 w-6 text-white" />} color="bg-blue-500/90" />
        <StatCard title="إجمالي المصاريف" value={`${totalExpenses.toFixed(2)} ج.م`} icon={<PackageIcon className="h-6 w-6 text-white" />} color="bg-orange-500/90" />
        <StatCard title="إجمالي الأرباح" value={`${totalProfit.toFixed(2)} ج.م`} icon={<DollarSignIcon className="h-6 w-6 text-white" />} color="bg-teal-500/90" />
        <StatCard title="صافي الربح" value={`${netProfit.toFixed(2)} ج.م`} icon={<DollarSignIcon className="h-6 w-6 text-white" />} color="bg-indigo-500/90" />
      </div>

      {/* Trend: Sales vs Returns vs Expenses */}
      <Section title="اتجاهات المبيعات والمرتجعات والمصاريف" right={null}>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${(value || 0).toFixed(2)} ج.م`} />
              <Legend />
              <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="returns" name="المرتجعات" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" name="المصاريف" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Users performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Section title="مبيعات المستخدمين (إجمالي)" right={null}>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={userStats.map(u => ({ name: u.name, total: +u.totalSales.toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-10} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value || 0).toFixed(2)} ج.م`} />
                <Legend />
                <Bar dataKey="total" name="إجمالي المبيعات" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="أداء المستخدمين" right={null}>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2">المستخدم</th>
                  <th className="p-2">إجمالي المبيعات</th>
                  <th className="p-2">عدد الفواتير</th>
                  <th className="p-2">متوسط الفاتورة</th>
                  <th className="p-2">القطع المباعة</th>
                </tr>
              </thead>
              <tbody>
                {userStats.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2 font-medium">{u.name}</td>
                    <td className="p-2">{u.totalSales.toFixed(2)} ج.م</td>
                    <td className="p-2">{u.invoiceCount}</td>
                    <td className="p-2">{u.avgInvoice.toFixed(2)} ج.م</td>
                    <td className="p-2">{u.itemsSold}</td>
                  </tr>
                ))}
                {userStats.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-6 text-gray-500">لا توجد بيانات ضمن الفترة المحددة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="المنتجات الأكثر مبيعاً (صافي)" right={null}>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={(value: number) => `${value} قطعة`} />
                <Legend />
                <Bar dataKey="quantitySold" name="الكمية المباعة" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="أحدث الفواتير" right={null}>
          <RecentInvoicesTable invoices={filteredInvoices} />
        </Section>
        <Section title="ملخص سريع" right={null}>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between"><span>عدد الفواتير</span><span className="font-semibold">{totalInvoices}</span></div>
            <div className="flex justify-between"><span>عدد العملاء</span><span className="font-semibold">{totalCustomers}</span></div>
            <div className="flex justify-between"><span>عدد المنتجات</span><span className="font-semibold">{totalProducts}</span></div>
            <div className="flex justify-between"><span>صافي المبيعات (المبيعات - المرتجعات)</span><span className="font-semibold">{netSales.toFixed(2)} ج.م</span></div>
            <div className="flex justify-between"><span>صافي الربح (الربح - المصاريف)</span><span className="font-semibold">{netProfit.toFixed(2)} ج.م</span></div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default DashboardPage;
