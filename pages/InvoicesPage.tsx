
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { Invoice, PaymentType } from '../types';
import { SearchIcon, PrintIcon } from '../components/icons';
import { printInvoice } from '../utils/print-utils';

const InvoicesPage = () => {
    const { invoices, settings, products, saveProducts, customers, saveCustomers, saveInvoices, addNotification } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [returnState, setReturnState] = useState<{ open: boolean; invoice: Invoice | null; quantities: Record<string, number>; refundType: 'cash' | 'debt'; alreadyReturned: Record<string, number>; }>({ open: false, invoice: null, quantities: {}, refundType: 'cash', alreadyReturned: {} });

    const openReturnModal = (inv: Invoice) => {
        // قراءة المرتجعات السابقة من نفس الفاتورة
        const already: Record<string, number> = { ...(inv.returns || {}) };
        // جهّز كميات الافتراضية 0 لكل صنف
        const q: Record<string, number> = {};
        inv.items.forEach(it => { q[it.product.id] = 0; });
        setReturnState({ open: true, invoice: inv, quantities: q, refundType: inv.customer ? 'debt' : 'cash', alreadyReturned: already });
    };

    const closeReturnModal = () => setReturnState({ open: false, invoice: null, quantities: {}, refundType: 'cash', alreadyReturned: {} });

    const handleConfirmReturn = async () => {
        const inv = returnState.invoice;
        if (!inv) return;
        // تجهيز الكميات المطلوبة مع احترام الحد الأقصى المتاح
        const selections = inv.items.map(it => ({ it, qty: Math.min(Math.max(0, returnState.quantities[it.product.id] || 0), Math.max(0, it.quantity - (returnState.alreadyReturned[it.product.id] || 0))) }))
                                   .filter(x => x.qty > 0);
        if (selections.length === 0) {
            addNotification('لم يتم اختيار أي كمية للمرتجع', 'error');
            return;
        }
        const refundAmount = selections.reduce((s, x) => s + x.it.price * x.qty, 0);

        // تحديث مخزون المنتجات
        const updatedProducts = [...products];
        selections.forEach(x => {
            const idx = updatedProducts.findIndex(p => p.id === x.it.product.id);
            if (idx > -1) {
                updatedProducts[idx].quantity += x.qty;
            }
        });
        await saveProducts(updatedProducts);

        // تحديث دين العميل لو تم اختيار تخفيض الدين
        if (inv.customer && returnState.refundType === 'debt') {
            const updatedCustomers = customers.map(c => {
                if (c.id !== inv.customer!.id) return c;
                const newDebt = Math.max(0, c.debt - refundAmount);
                return { ...c, debt: newDebt, lastTransaction: new Date().toLocaleDateString('en-CA') };
            });
            await saveCustomers(updatedCustomers);
        }

        // تحديث الفاتورة الأصلية: returns + الإجماليات
        const newReturns: Record<string, number> = { ...(inv.returns || {}) } as any;
        selections.forEach(x => {
            newReturns[x.it.product.id] = (newReturns[x.it.product.id] || 0) + x.qty;
        });
        const newSubtotal = Math.max(0, inv.subtotal - refundAmount);
        // إعادة حساب الإجمالي بناءً على الخصم/الضريبة الحالية
        const discountAmount = inv.discount.type === 'percentage' ? newSubtotal * (inv.discount.value / 100) : inv.discount.value;
        const taxable = Math.max(0, newSubtotal - discountAmount);
        const taxAmount = inv.tax.type === 'percentage' ? taxable * (inv.tax.value / 100) : inv.tax.value;
        const newTotal = Math.max(0, taxable + taxAmount);

        const updatedInvoice: Invoice = {
            ...inv,
            returns: newReturns as any,
            refundedAmount: (inv.refundedAmount || 0) + refundAmount,
            subtotal: newSubtotal,
            total: newTotal,
        };

        await saveInvoices(invoices.map(v => v.id === inv.id ? updatedInvoice : v));
        addNotification('تم تنفيذ المرتجع على نفس الفاتورة بنجاح');
        closeReturnModal();
    };

    const handlePrint = (invoice: Invoice) => {
        printInvoice(invoice, settings);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const customerName = inv.customer ? inv.customer.name.toLowerCase() : 'عميل نقدي';
            const lowerCaseSearch = searchTerm.toLowerCase();
            return inv.id.toLowerCase().includes(lowerCaseSearch) || 
                   customerName.includes(lowerCaseSearch) ||
                   inv.date.includes(lowerCaseSearch);
        });
    }, [invoices, searchTerm]);
    
    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">سجل الفواتير</h1>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="ابحث برقم الفاتورة، اسم العميل، أو التاريخ..."
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
                            <th className="p-4 font-semibold">رقم الفاتورة</th>
                            <th className="p-4 font-semibold">التاريخ</th>
                            <th className="p-4 font-semibold">العميل</th>
                            <th className="p-4 font-semibold">الإجمالي</th>
                            <th className="p-4 font-semibold">حالة الدفع</th>
                            <th className="p-4 font-semibold">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono">
                                    {inv.id}
                                    {inv.returns && Object.values(inv.returns).some(v => v > 0) && (
                                        <span className="ms-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">مرتجع</span>
                                    )}
                                </td>
                                <td className="p-4">{inv.date}</td>
                                <td className="p-4">{inv.customer ? inv.customer.name : 'عميل نقدي'}</td>
                                <td className="p-4 font-bold">{inv.total.toFixed(2)} ج.م</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${inv.paymentType === 'نقدي' ? 'bg-green-100 text-green-800' : inv.paymentType === 'آجل' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {inv.paymentType}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handlePrint(inv)} className="text-blue-600 hover:text-blue-800 flex items-center">
                                           <PrintIcon className="h-5 w-5 me-2" /> طباعة
                                        </button>
                                        <button onClick={() => openReturnModal(inv)} className="text-red-600 hover:text-red-800">
                                            مرتجع
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {filteredInvoices.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-8 text-gray-500">لا توجد فواتير مطابقة للبحث</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        {/* Return Modal */}
        {returnState.open && returnState.invoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
                    <div className="p-4 border-b">
                        <h3 className="text-xl font-bold">مرتجع على الفاتورة {returnState.invoice.id}</h3>
                    </div>
                    <div className="p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2">المنتج</th>
                                        <th className="p-2">المباع</th>
                                        <th className="p-2">المتاح للمرتجع</th>
                                        <th className="p-2">كمية المرتجع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnState.invoice.items.map(it => {
                                        const sold = it.quantity;
                                        const returnedSoFar = returnState.alreadyReturned[it.product.id] || 0;
                                        const available = Math.max(0, sold - returnedSoFar);
                                        const val = returnState.quantities[it.product.id] || 0;
                                        return (
                                            <tr key={it.product.id} className="border-b">
                                                <td className="p-2">{it.product.name}</td>
                                                <td className="p-2">{sold}</td>
                                                <td className="p-2">{available}</td>
                                                <td className="p-2">
                                                    <input type="number" className="w-24 text-center border rounded" min={0} max={available} value={val}
                                                        onChange={e => {
                                                            const v = Math.max(0, Math.min(available, parseInt(e.target.value || '0')));
                                                            setReturnState(rs => ({ ...rs, quantities: { ...rs.quantities, [it.product.id]: v } }));
                                                        }}
                                                        disabled={available === 0}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <input type="radio" id="ret-cash" name="refundType" checked={returnState.refundType === 'cash'} onChange={() => setReturnState(rs => ({ ...rs, refundType: 'cash' }))} />
                                <label htmlFor="ret-cash">استرجاع نقدي</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" id="ret-debt" name="refundType" checked={returnState.refundType === 'debt'} onChange={() => setReturnState(rs => ({ ...rs, refundType: 'debt' }))} disabled={!returnState.invoice.customer} />
                                <label htmlFor="ret-debt" className={!returnState.invoice.customer ? 'text-gray-400' : ''}>تخفيض دين العميل</label>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
                            <div>قيمة المرتجع: <span className="font-bold text-red-600">{
                                returnState.invoice.items.reduce((s, it) => s + ((returnState.quantities[it.product.id] || 0) * it.price), 0).toFixed(2)
                            } ج.م</span></div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={closeReturnModal} className="px-4 py-2 bg-gray-200 rounded">إلغاء</button>
                            <button onClick={handleConfirmReturn} className="px-4 py-2 bg-red-600 text-white rounded">تأكيد المرتجع</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

export default InvoicesPage;
