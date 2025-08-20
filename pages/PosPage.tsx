
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../App';
import { InvoiceItem, Customer, PaymentType, Invoice, Product, Amount } from '../types';
import { SearchIcon, BarcodeIcon, XIcon, PlusCircleIcon, TrashIcon, DollarSignIcon } from '../components/icons';
import InvoiceModal from '../components/InvoiceModal';
import { requestScan, listenForScanResult } from '../utils/firebase-scanner';

// CustomerModal remains the same
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
        if (!editedCustomer.name) return;
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
                        <label htmlFor="cust-name" className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
                        <input type="text" id="cust-name" name="name" value={editedCustomer.name} onChange={handleChange} placeholder="الاسم" className="p-2 border rounded w-full" required />
                    </div>
                    <div>
                        <label htmlFor="cust-phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الموبايل</label>
                        <input type="text" id="cust-phone" name="phone" value={editedCustomer.phone} onChange={handleChange} placeholder="رقم الموبايل" className="p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label htmlFor="cust-address" className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                        <input type="text" id="cust-address" name="address" value={editedCustomer.address} onChange={handleChange} placeholder="العنوان" className="p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label htmlFor="cust-notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                        <textarea id="cust-notes" name="notes" value={editedCustomer.notes} onChange={handleChange} placeholder="ملاحظات" className="p-2 border rounded w-full h-24"></textarea>
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

const PosPage = () => {
    const { products, saveProducts, customers, saveCustomers, invoices, saveInvoices, addNotification, currentUser } = useAppContext();
    const [currentInvoiceItems, setCurrentInvoiceItems] = useState<InvoiceItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [taxValue, setTaxValue] = useState('');
    const [taxType, setTaxType] = useState<'percentage' | 'fixed'>('percentage');

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
    
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [cashPaid, setCashPaid] = useState('');

    // Define addProductToInvoice first before using it in useEffect
    const addProductToInvoice = useCallback((product: Product) => {
        if (product.quantity <= 0) {
            addNotification(`المنتج ${product.name} غير متوفر في المخزون.`, 'error');
            return;
        }

        const existingItemIndex = currentInvoiceItems.findIndex(item => item.product.id === product.id);
        
        if (existingItemIndex > -1) {
            const updatedItems = [...currentInvoiceItems];
            if(updatedItems[existingItemIndex].quantity < product.quantity) {
                 updatedItems[existingItemIndex].quantity += 1;
                 setCurrentInvoiceItems(updatedItems);
            } else {
                addNotification(`لا توجد كمية كافية من ${product.name}`, 'error');
            }
        } else {
            setCurrentInvoiceItems([...currentInvoiceItems, { product, quantity: 1, price: product.price, unit: product.unit }]);
        }
        setSearchTerm('');
        setSearchResults([]);
    }, [currentInvoiceItems, addNotification]);

    // USB Scanner support - listen for keyboard input
    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyPress = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            
            // If more than 100ms between keystrokes, start new barcode
            if (currentTime - lastKeyTime > 100) {
                barcodeBuffer = '';
            }
            lastKeyTime = currentTime;

            // Handle Enter key (end of barcode scan)
            if (e.key === 'Enter' && barcodeBuffer.length > 0) {
                e.preventDefault();
                
                // Find product by barcode and add to invoice
                const product = products.find(p => p.barcode === barcodeBuffer);
                if (product) {
                    addProductToInvoice(product);
                    addNotification(`تمت إضافة ${product.name} إلى الفاتورة`);
                } else {
                    addNotification(`لم يتم العثور على منتج بالباركود: ${barcodeBuffer}`, 'error');
                }
                
                barcodeBuffer = '';
                return;
            }

            // Build barcode buffer (only if not typing in an input field)
            if (e.target instanceof HTMLElement && 
                e.target.tagName !== 'INPUT' && 
                e.target.tagName !== 'TEXTAREA' && 
                e.target.tagName !== 'SELECT' &&
                e.key.length === 1) {
                barcodeBuffer += e.key;
            }
        };

        document.addEventListener('keypress', handleKeyPress);
        return () => document.removeEventListener('keypress', handleKeyPress);
    }, [products, addProductToInvoice, addNotification]);

    useEffect(() => {
        if (searchTerm) {
            setSearchResults(products.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.barcode.includes(searchTerm)
            ));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, products]);

    useEffect(() => {
        const unsubscribe = listenForScanResult((barcode) => {
            const product = products.find(p => p.barcode === barcode);
            if (product) {
                addProductToInvoice(product);
                addNotification(`تمت إضافة ${product.name} إلى الفاتورة`);
            } else {
                addNotification(`لم يتم العث��ر على منتج بالباركود: ${barcode}`, 'error');
            }
        });
        return () => unsubscribe && unsubscribe();
    }, [products, addProductToInvoice, addNotification]);

    useEffect(() => {
        const newSubtotal = currentInvoiceItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setSubtotal(newSubtotal);

        const discountAmount = discountType === 'percentage'
            ? newSubtotal * ((parseFloat(discountValue) || 0) / 100)
            : parseFloat(discountValue) || 0;

        const taxableAmount = newSubtotal - discountAmount;

        const taxAmount = taxType === 'percentage'
            ? taxableAmount * ((parseFloat(taxValue) || 0) / 100)
            : parseFloat(taxValue) || 0;

        const newTotal = taxableAmount + taxAmount;
        setTotal(newTotal);
    }, [currentInvoiceItems, discountValue, discountType, taxValue, taxType]);

    const handleScanAndAdd = () => {
        if (products.length === 0) return;
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        if(randomProduct) {
            addProductToInvoice(randomProduct);
            addNotification(`تمت إضافة ${randomProduct.name} إلى الفاتورة`);
            setSearchTerm('');
        }
    };
    
    const updateItemQuantity = (productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        if(product && newQuantity > product.quantity){
            addNotification(`الكمية المطلوبة أكبر من المخزون المتاح (${product.quantity})`, 'error');
            setCurrentInvoiceItems(currentInvoiceItems.map(item => item.product.id === productId ? { ...item, quantity: product.quantity } : item));
            return;
        }
        if (newQuantity <= 0) {
            removeItemFromInvoice(productId);
        } else {
            setCurrentInvoiceItems(currentInvoiceItems.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
        }
    };

    const removeItemFromInvoice = (productId: string) => {
        setCurrentInvoiceItems(currentInvoiceItems.filter(item => item.product.id !== productId));
    };
    
    const handleSaveNewCustomer = async (customer: Customer, isNew: boolean) => {
        if (isNew) {
            const updatedCustomers = [customer, ...customers];
            await saveCustomers(updatedCustomers);
            addNotification('تمت إضافة العميل بنجاح');
            setSelectedCustomer(customer);
        }
    };

    const finalizeSale = async (paymentType: PaymentType, amountPaid?: number) => {
        if (currentInvoiceItems.length === 0) {
            addNotification('لا يمكن إنشاء فاتورة فارغة', 'error');
            return;
        }

        // تحقق للدفع النقدي: المبلغ المدفوع يجب أن يغطي الإجمالي
        if (paymentType === PaymentType.Cash) {
            const paid = parseFloat(cashPaid) || 0;
            if (paid < total) {
                addNotification('المبلغ المدفوع أقل من الإجمالي. استخدم دفع جزئي أو أكمل المبلغ.', 'error');
                return;
            }
        }

        const newInvoice: Invoice = {
            id: `INV-${Date.now()}`,
            date: new Date().toLocaleDateString('en-CA'),
            time: new Date().toLocaleTimeString('ar-EG'),
            customer: selectedCustomer,
            items: currentInvoiceItems,
            subtotal,
            discount: { type: discountType, value: parseFloat(discountValue) || 0 },
            tax: { type: taxType, value: parseFloat(taxValue) || 0 },
            total,
            paymentType,
            amountPaid: paymentType === PaymentType.Cash ? total : (amountPaid || 0),
            createdById: currentUser?.id,
            createdByName: currentUser?.name,
        };

        const updatedProducts = [...products];
        newInvoice.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
            if(productIndex > -1) {
                updatedProducts[productIndex].quantity -= item.quantity;
            }
        });
        await saveProducts(updatedProducts);
        
        if (selectedCustomer) {
            const debtAmount = (paymentType === PaymentType.Credit || paymentType === PaymentType.Partial) ? total - (amountPaid || 0) : 0;
            const updatedCustomers = customers.map(c => 
                c.id === selectedCustomer.id ? { ...c, debt: c.debt + debtAmount, invoiceCount: c.invoiceCount + 1, lastTransaction: newInvoice.date } : c
            );
            await saveCustomers(updatedCustomers);
        }

        await saveInvoices([newInvoice, ...invoices]);
        addNotification(`تم إنشاء الفاتورة ${newInvoice.id} بنجاح`);

        setCurrentInvoiceItems([]);
        setSelectedCustomer(null);
        setDiscountValue('');
        setTaxValue('');
        setCashPaid('');
        
        setCompletedInvoice(newInvoice);
    };

    const paid = parseFloat(cashPaid) || 0;
    const due = Math.max(0, total - paid);
    const change = Math.max(0, paid - total);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 flex flex-col">
                {/* Search and Invoice Items sections remain the same */}
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">الفاتورة الحالية</h2>
                    <div className="text-lg font-semibold">
                       رقم الفاتورة: <span className="font-mono">{`INV-${Date.now()}`}</span>
                    </div>
                </div>
                <div className="relative mb-4">
                     <input 
                        type="text" 
                        placeholder="ابحث عن منتج بالإسم أو الباركود..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 ps-10 border rounded-lg"
                     />
                     <SearchIcon className="absolute top-1/2 -translate-y-1/2 right-3 h-5 w-5 text-gray-400" />
                     <button onClick={requestScan} title="مسح باركود" className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-500 hover:text-blue-600">
                        <BarcodeIcon className="h-5 w-5"/>
                     </button>
                     {searchResults.length > 0 && (
                        <div className="absolute w-full bg-white border rounded-lg mt-1 z-10 max-h-60 overflow-y-auto shadow-lg">
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => addProductToInvoice(p)} className="p-3 hover:bg-blue-100 cursor-pointer">
                                    {p.name} - <span className="font-mono">{p.barcode}</span>
                                </div>
                            ))}
                        </div>
                     )}
                </div>

                <div className="flex-grow overflow-y-auto border-y py-2">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 font-semibold">المنتج</th>
                                <th className="p-2 font-semibold">الكمية</th>
                                <th className="p-2 font-semibold">السعر</th>
                                <th className="p-2 font-semibold">الإجمالي</th>
                                <th className="p-2 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                           {currentInvoiceItems.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-gray-500">لا توجد منتجات في الفاتورة</td></tr>
                           ) : (
                                currentInvoiceItems.map(item => (
                                    <tr key={item.product.id} className="border-b">
                                        <td className="p-2">{item.product.name}</td>
                                        <td className="p-2">
                                            <input type="number" value={item.quantity} onChange={e => updateItemQuantity(item.product.id, parseInt(e.target.value) || 1)} className="w-20 text-center border rounded" />
                                        </td>
                                        <td className="p-2">{item.price.toFixed(2)}</td>
                                        <td className="p-2">{(item.price * item.quantity).toFixed(2)}</td>
                                        <td className="p-2">
                                            <button onClick={() => removeItemFromInvoice(item.product.id)} className="text-red-500 hover:text-red-700">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                           )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold mb-4">ملخص الطلب</h3>
                    <div className="mb-4">
                        <label className="font-semibold">العميل:</label>
                        <select 
                            value={selectedCustomer?.id || ''} 
                            onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                            className="w-full p-2 mt-1 border rounded-lg"
                        >
                            <option value="">عميل نقدي (بدون تسجيل)</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                        </select>
                         <button onClick={() => setIsCustomerModalOpen(true)} className="text-blue-600 text-sm mt-1 hover:underline">إضافة عميل جديد</button>
                                             </div>

                    <div className="space-y-3">
                        <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{subtotal.toFixed(2)} ج.م</span></div>
                        
                        <div className="flex items-center justify-between">
                            <span>خصم</span>
                            <div className="flex items-center border rounded">
                                <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="0" className="w-20 text-center p-1 rounded-s-md" />
                                <button onClick={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')} className="bg-gray-200 p-1 px-2 rounded-e-md">
                                    {discountType === 'percentage' ? '%' : 'ج.م'}
                                </button>
                            </div>
                        </div>

                         <div className="flex items-center justify-between">
                            <span>ضريبة</span>
                             <div className="flex items-center border rounded">
                                <input type="number" value={taxValue} onChange={e => setTaxValue(e.target.value)} placeholder="0" className="w-20 text-center p-1 rounded-s-md" />
                                <button onClick={() => setTaxType(taxType === 'percentage' ? 'fixed' : 'percentage')} className="bg-gray-200 p-1 px-2 rounded-e-md">
                                    {taxType === 'percentage' ? '%' : 'ج.م'}
                                </button>
                            </div>
                        </div>
                        <hr/>
                        <div className="flex justify-between text-2xl font-bold text-blue-600"><span>الإجمالي النهائي</span><span>{total.toFixed(2)} ج.م</span></div>

                        {/* دفع نقدي - المبلغ المدفوع وحساب الباقي (نسخة محسنة) */}
                        <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="px-4 py-3 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                        <DollarSignIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-800">الدفع النقدي</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCashPaid(total.toFixed(2))} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">مطابقة الإجمالي</button>
                                    <button onClick={() => setCashPaid('')} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">مسح</button>
                                </div>
                            </div>
                            <div className="p-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700">المبلغ المدفوع</label>
                                <div className="relative">
                                    <input type="number" value={cashPaid} onChange={e => setCashPaid(e.target.value)} placeholder="0.00" className="w-full p-3 pe-16 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">ج.م</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                                        <div className="text-xs text-orange-600">الباقي على العميل</div>
                                        <div className="text-lg font-bold text-orange-700">{due.toFixed(2)} ج.م</div>
                                    </div>
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                        <div className="text-xs text-green-700">الباقي للعميل (صرف)</div>
                                        <div className="text-lg font-bold text-green-700">{change.toFixed(2)} ج.م</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    {/* Payment buttons remain the same */}
                    <button onClick={() => finalizeSale(PaymentType.Cash)} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-600 transition">
                        دفع نقدي
                    </button>
                    <button onClick={() => {
                        if (!selectedCustomer) {
                            addNotification('الرجاء اختيار عميل للبيع الآجل', 'error');
                            return;
                        }
                        finalizeSale(PaymentType.Credit);
                    }} 
                    className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-orange-600 transition disabled:bg-gray-400"
                    disabled={!selectedCustomer}
                    >
                        دفع آجل
                    </button>
                     <button onClick={() => {
                        if (!selectedCustomer) {
                            addNotification('الرجاء اختيار عميل للدفع الجزئي', 'error');
                            return;
                        }
                        const amount = prompt("الرجاء إدخال المبلغ المدفوع:", "0");
                        if(amount !== null){
                            finalizeSale(PaymentType.Partial, parseFloat(amount));
                        }
                    }} 
                    className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-yellow-600 transition disabled:bg-gray-400"
                    disabled={!selectedCustomer}
                    >
                        دفع جزئي
                    </button>
                </div>
            </div>
            {isCustomerModalOpen && (
                <CustomerModal 
                    customer={null}
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSave={handleSaveNewCustomer}
                />
            )}
            {completedInvoice && (
                <InvoiceModal 
                    invoice={completedInvoice}
                    onClose={() => setCompletedInvoice(null)}
                    autoPrint={true}
                />
            )}
        </div>
    );
};

export default PosPage;
