
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../App';
import { Expense } from '../types';
import { PlusCircleIcon, EditIcon, TrashIcon, SearchIcon, XIcon } from '../components/icons';

const ExpenseModal = ({ expense, onClose, onSave }: { expense: Expense | null, onClose: () => void, onSave: (expense: Expense, isNew: boolean) => Promise<void> }) => {
  const [edited, setEdited] = useState<Expense>(
    expense || { id: '', date: new Date().toISOString().slice(0,10), category: '', description: '', amount: 0 }
  );
  const isNew = !expense;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEdited(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleSave = async () => {
    if (!edited.category || !edited.date || !edited.amount) return;
    const finalItem: Expense = { ...edited, id: edited.id || `ex${Date.now()}` };
    await onSave(finalItem, isNew);
    onClose();
  }

  const categories = ['إيجار', 'رواتب', 'كهرباء', 'مياه', 'نقل', 'صيانة', 'مشتريات مكتبية', 'أخرى'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{isNew ? 'إضافة مصروف' : 'تعديل المصروف'}</h2>
          <button onClick={onClose}><XIcon className="h-6 w-6" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">التاريخ</label>
            <input id="date" name="date" type="date" value={edited.date} onChange={handleChange} className="p-2 border rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">التصنيف</label>
            <select id="category" name="category" value={edited.category} onChange={handleChange} className="p-2 border rounded w-full">
              <option value="">اختر تصنيف</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">الوصف</label>
            <textarea id="description" name="description" value={edited.description} onChange={handleChange} className="p-2 border rounded w-full h-20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">المبلغ</label>
            <input id="amount" name="amount" type="number" step="0.01" value={edited.amount} onChange={handleChange} className="p-2 border rounded w-full" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button>
        </div>
      </div>
    </div>
  );
}

const ExpensesPage = () => {
  const { expenses, saveExpenses, addNotification } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const categories = useMemo(() => {
    const set = new Set(expenses.map(e => e.category).filter(Boolean));
    return Array.from(set);
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses
      .filter(e => !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()))
      .filter(e => !categoryFilter || e.category === categoryFilter)
      .filter(e => !fromDate || e.date >= fromDate)
      .filter(e => !toDate || e.date <= toDate)
      .sort((a,b) => b.date.localeCompare(a.date));
  }, [expenses, search, categoryFilter, fromDate, toDate]);

  const total = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered]);

  const handleSave = async (item: Expense, isNew: boolean) => {
    if (isNew) {
      await saveExpenses([item, ...expenses]);
      addNotification('تمت إضافة المصروف');
    } else {
      await saveExpenses(expenses.map(e => e.id === item.id ? item : e));
      addNotification('تم تحديث المصروف');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المصروف؟')) return;
    await saveExpenses(expenses.filter(e => e.id !== id));
    addNotification('تم حذف المصروف', 'success');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">المصاريف</h1>
        <button onClick={() => { setEditing(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">
          <PlusCircleIcon className="h-5 w-5 me-2" />
          إضافة مصروف
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="ابحث بالوصف أو التصنيف..."
              className="w-full p-3 ps-10 border rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute top-1/2 -translate-y-1/2 right-3 h-5 w-5 text-gray-400" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full p-3 border rounded-lg">
            <option value="">كل التصنيفات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="p-3 border rounded-lg" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="p-3 border rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">عدد النتائج: <span className="font-bold text-blue-600">{filtered.length}</span></span>
        <span className="text-sm text-green-700">إجمالي الفترة: <span className="font-bold">{total.toFixed(2)} ج.م</span></span>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-semibold">التاريخ</th>
              <th className="p-4 font-semibold">التصنيف</th>
              <th className="p-4 font-semibold">الوصف</th>
              <th className="p-4 font-semibold">المبلغ</th>
              <th className="p-4 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{e.date}</td>
                <td className="p-4">{e.category}</td>
                <td className="p-4">{e.description || '-'}</td>
                <td className="p-4 font-bold">{(e.amount || 0).toFixed(2)} ج.م</td>
                <td className="p-4">
                  <div className="flex justify-center items-center space-x-2 space-x-reverse">
                    <button onClick={() => { setEditing(e); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1" title="تعديل">
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-800 p-1" title="حذف">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">لا توجد مصاريف مطابقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ExpenseModal
          expense={editing}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
