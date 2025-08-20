
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { Customer } from '../types';
import { PlusCircleIcon, SearchIcon, EditIcon, TrashIcon, XIcon, DollarSignIcon } from '../components/icons';

const SettleDebtModal = ({ customer, onClose, onSettle }: { customer: Customer, onClose: () => void, onSettle: (amount: number) => void }) => {
    const [amount, setAmount] = useState(customer.debt.toString());

    const handleSettle = () => {
        const settleAmount = parseFloat(amount);
        if (!isNaN(settleAmount) && settleAmount > 0 && settleAmount <= customer.debt) {
            onSettle(settleAmount);
            onClose();
        } else {
            alert('الرجاء إدخال مبلغ صحيح.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">تسديد ديون {customer.name}</h2>
                    <button onClick={onClose}><XIcon className="h-6 w-6" /></button>
                </div>
                <div>
                    <p className="mb-4">الدين الحالي: <span className="font-bold text-red-600">{customer.debt.toFixed(2)} ج.م</span></p>
                    <label htmlFor="settle-amount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ المسدد</label>
                    <input
                        type="number"
                        id="settle-amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="p-2 border rounded w-full"
                        max={customer.debt}
                        min="0.01"
                        step="0.01"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
                    <button onClick={handleSettle} className="px-4 py-2 bg-green-600 text-white rounded">تسديد</button>
                </div>
            </div>
        </div>
    );
};

const CustomerModal = ({ customer, onClose, onSave }: { customer: Customer | null, onClose: () => void, onSave: (customer: Customer, isNew: boolean) => Promise<void> }) => {
    const [editedCustomer, setEditedCustomer] = useState<Customer>(
        customer || {
            id: '', name: '', phone: '', address: '', notes: '', debt: 0, invoiceCount: 0, lastTransaction: ''
        }
    );
    const isNew = !customer;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditedCustomer({ ...editedCustomer, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        let finalCustomer = { ...editedCustomer };
        if (isNew) {
            finalCustomer.id = `c${Date.now()}`;
        }
        await onSave(finalCustomer, isNew);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{isNew ? 'إضافة عميل جديد' : 'تعديل بيانات العميل'}</h2>
                    <button onClick={onClose}><XIcon className="h-6 w-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                        <input type="text" id="name" name="name" value={editedCustomer.name} onChange={handleChange} placeholder="الاسم" className="p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الموبايل</label>
                        <input type="text" id="phone" name="phone" value={editedCustomer.phone} onChange={handleChange} placeholder="رقم الموبايل" className="p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                        <input type="text" id="address" name="address" value={editedCustomer.address} onChange={handleChange} placeholder="العنوان" className="p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                        <textarea id="notes" name="notes" value={editedCustomer.notes} onChange={handleChange} placeholder="ملاحظات" className="p-2 border rounded w-full h-24"></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button>
                </div>
            </div>
        </div>
    );
};

const CustomersPage = () => {
    const { customers, saveCustomers, addNotification } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [settlingCustomer, setSettlingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveCustomer = async (customer: Customer, isNew: boolean) => {
        if (isNew) {
            await saveCustomers([customer, ...customers]);
            addNotification('تمت إضافة العميل بنجاح');
        } else {
            await saveCustomers(customers.map(c => c.id === customer.id ? customer : c));
            addNotification('تم تحديث بيانات العميل');
        }
    };
    
    const handleDeleteCustomer = async (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer && customer.debt > 0) {
            addNotification('لا يمكن حذف عميل عليه ديون.', 'error');
            return;
        }
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            await saveCustomers(customers.filter(c => c.id !== customerId));
            addNotification('تم حذف العميل', 'error');
        }
    };

    const handleSettleDebt = async (amount: number) => {
        if (settlingCustomer) {
            const updatedDebt = settlingCustomer.debt - amount;
            await saveCustomers(customers.map(c => c.id === settlingCustomer.id ? { ...c, debt: updatedDebt } : c));
            addNotification(`تم تسديد مبلغ ${amount.toFixed(2)} ج.م بنجاح.`);
            setSettlingCustomer(null);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">إدارة العملاء</h1>
                <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">
                    <PlusCircleIcon className="h-5 w-5 me-2" />
                    إضافة عميل جديد
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        className="w-full p-3 ps-10 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SearchIcon className="absolute top-1/2 -translate-y-1/2 right-3 h-5 w-5 text-gray-400" />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 font-semibold">الاسم</th>
                            <th className="p-4 font-semibold">رقم الهاتف</th>
                            <th className="p-4 font-semibold">العنوان</th>
                            <th className="p-4 font-semibold">الرصيد (الديون)</th>
                            <th className="p-4 font-semibold">آخر معاملة</th>
                            <th className="p-4 font-semibold">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{c.name}</td>
                                <td className="p-4" style={{direction: 'ltr', textAlign: 'right'}}>{c.phone}</td>
                                <td className="p-4">{c.address}</td>
                                <td className={`p-4 font-bold ${c.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.debt.toFixed(2)} ج.م</td>
                                <td className="p-4">{c.lastTransaction || 'لا يوجد'}</td>
                                <td className="p-4 flex space-x-2 space-x-reverse">
                                    <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><EditIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5" /></button>
                                    {c.debt > 0 && <button onClick={() => setSettlingCustomer(c)} className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center"><DollarSignIcon className="h-4 w-4 me-1" />تسديد</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsModalOpen(false)} onSave={handleSaveCustomer} />}
            {settlingCustomer && <SettleDebtModal customer={settlingCustomer} onClose={() => setSettlingCustomer(null)} onSettle={handleSettleDebt} />}
        </div>
    );
};

export default CustomersPage;
