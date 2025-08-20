import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { User, Page, Settings } from '../types';
import { PlusCircleIcon, EditIcon, TrashIcon, XIcon, FolderIcon, SettingsIcon, FileTextIcon, ShieldCheckIcon, CameraIcon, BriefcaseIcon } from '../components/icons';
import ConfirmDialog from '../components/ConfirmDialog';
import { testConnection, syncPush } from '../utils/sync';

// Reusable Modal Component
const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">{title}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);

// Company Info Modal
const CompanyInfoModal = ({ settings, onSave, onClose }: { settings: Settings, onSave: (settings: Settings) => Promise<void>, onClose: () => void }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSettings({ ...localSettings, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <Modal title="تعديل معلومات الشركة" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="systemName" className="block text-sm font-medium text-gray-700">اسم النظام</label>
                    <input type="text" id="systemName" name="systemName" value={localSettings.systemName || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">اسم الشركة</label>
                    <input type="text" id="companyName" name="companyName" value={localSettings.companyName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">عنوان الشركة</label>
                    <input type="text" id="companyAddress" name="companyAddress" value={localSettings.companyAddress} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">رقم هاتف الشركة</label>
                    <input type="text" id="companyPhone" name="companyPhone" value={localSettings.companyPhone} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    حفظ التغييرات
                </button>
            </div>
        </Modal>
    );
};

// Invoice Settings Modal
const InvoiceSettingsModal = ({ settings, onSave, onClose }: { settings: Settings, onSave: (settings: Settings) => Promise<void>, onClose: () => void }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setLocalSettings({ ...localSettings, [e.target.name]: e.target.value });
    };
    
    const handleBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({ ...prev, customInvoiceBarcode: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <Modal title="تخصيص الفاتورة" onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="paperSize" className="block text-sm font-medium text-gray-700">حجم ورق الطباعة</label>
                    <select id="paperSize" name="paperSize" value={localSettings.paperSize || '58mm'} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        <option value="58mm">58mm</option>
                        <option value="80mm">80mm</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="thankYouMessage" className="block text-sm font-medium text-gray-700">رسالة شكر في الفاتورة</label>
                    <input type="text" id="thankYouMessage" name="thankYouMessage" value={localSettings.thankYouMessage || ''} onChange={handleChange} placeholder="شكراً لتعاملكم معنا!" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="barcodeText" className="block text-sm font-medium text-gray-700">النص فوق الباركود</label>
                    <input type="text" id="barcodeText" name="barcodeText" value={localSettings.barcodeText || ''} onChange={handleChange} placeholder="امسح الكود للمتابعة" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="customInvoiceBarcode" className="block text-sm font-medium text-gray-700">صورة باركود مخصصة للفاتورة</label>
                    <div className="mt-1 flex items-center">
                        <input type="file" accept="image/*" id="customInvoiceBarcode" onChange={handleBarcodeUpload} className="hidden"/>
                        <label htmlFor="customInvoiceBarcode" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                            <CameraIcon className="h-5 w-5 me-2"/>
                            اختر صورة
                        </label>
                        {localSettings.customInvoiceBarcode && <img src={localSettings.customInvoiceBarcode} alt="preview" className="ms-4 h-16 w-auto border p-1 rounded"/>}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    حفظ التغييرات
                </button>
            </div>
        </Modal>
    );
};

// Sync Settings Modal
const SyncSettingsModal = ({ settings, onSave, onClose }: { settings: Settings, onSave: (settings: Settings) => Promise<void>, onClose: () => void }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [testing, setTesting] = useState<'idle'|'loading'|'ok'|'fail'>('idle');
    const [syncing, setSyncing] = useState<'idle'|'loading'|'ok'|'fail'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('syncWhat.')) {
            const key = name.split('.')[1] as keyof NonNullable<Settings['syncWhat']>;
            setLocalSettings(prev => ({ ...prev, syncWhat: { ...(prev.syncWhat || {}), [key]: checked } }));
        } else if (name === 'syncEnabled') {
            setLocalSettings(prev => ({ ...prev, syncEnabled: checked }));
        } else {
            setLocalSettings(prev => ({ ...prev, [name]: value } as any));
        }
    };

    const handleSave = async () => {
        await onSave(localSettings);
        onClose();
    };

    const handleTest = async () => {
        setTesting('loading');
        const ok = await testConnection(localSettings);
        if (!ok) {
            setTesting('fail');
            return;
        }
        try {
            const result = await syncPush(localSettings as any, { settings: localSettings as any });
            if (result.ok) {
                setTesting('ok');
                await onSave({ ...localSettings, lastSyncAt: new Date().toISOString() } as any);
            } else {
                setTesting('fail');
            }
        } catch (e) {
            setTesting('fail');
        }
    };

    
    return (
        <Modal title="إعدادات المزامنة" onClose={onClose}>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input id="syncEnabled" name="syncEnabled" type="checkbox" checked={!!localSettings.syncEnabled} onChange={handleChange} />
                    <label htmlFor="syncEnabled" className="text-sm font-medium">تفعيل المزامنة</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">API Key</label>
                        <input name="syncApiKey" value={localSettings.syncApiKey || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Auth Domain</label>
                        <input name="syncAuthDomain" value={localSettings.syncAuthDomain || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Project ID</label>
                        <input name="syncProjectId" value={localSettings.syncProjectId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">بادئة المجموعات (Collection Prefix)</label>
                        <input name="syncCollectionPrefix" value={localSettings.syncCollectionPrefix || 'pos'} onChange={handleChange} className="mt-1 block w-full p-2 border rounded" />
                    </div>
                </div>

                <div className="mt-2">
                    <h4 className="font-semibold mb-2">اختر ما يتم مزامنته</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['products','customers','invoices','expenses','users','settings'].map(key => (
                            <label key={key} className="flex items-center gap-2 p-2 rounded border bg-gray-50">
                                <input type="checkbox" name={`syncWhat.${key}`} checked={!!(localSettings.syncWhat && (localSettings.syncWhat as any)[key])} onChange={handleChange} />
                                <span className="text-sm">{({products:'المنتجات',customers:'العملاء',invoices:'الفواتير',expenses:'المصاريف',users:'المستخدمون',settings:'الإعدادات'} as any)[key]}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="text-xs text-gray-500">آخر مزامنة: {localSettings.lastSyncAt ? new Date(localSettings.lastSyncAt).toLocaleString('ar-EG') : 'لم تتم بعد'}</div>
            </div>
            <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={handleTest} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">اختبار الاتصال</button>
                    {testing === 'loading' && <span className="text-gray-600 text-sm">جارٍ الاختبار...</span>}
                    {testing === 'ok' && <span className="text-green-600 text-sm">الاتصال ناجح</span>}
                    {testing === 'fail' && <span className="text-red-600 text-sm">فشل الاتصال</span>}
                </div>
                                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
            </div>
        </Modal>
    );
};

const UserModal = ({ user, onClose, onSave }: { user: User | null, onSave: (user: User) => Promise<void>, onClose: () => void }) => {
    const [editedUser, setEditedUser] = useState<User>(
        user || {
            id: '', name: '', password: '', status: 'نشط',
            permissions: { [Page.Dashboard]: true, [Page.Products]: true, [Page.Pos]: true, [Page.Customers]: true, [Page.Invoices]: true, [Page.Expenses]: true, [Page.Settings]: false }
        }
    );
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const isNew = !user;
    const isMainAdmin = editedUser.id === 'u1'; // المدير الرئيسي

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
    };

    const handlePermissionChange = (page: Page, checked: boolean) => {
        setEditedUser(prev => ({ ...prev, permissions: { ...prev.permissions, [page]: checked } }));
    };

    const handleSave = async () => {
        if (!editedUser.name.trim()) { setPasswordError('اسم المستخدم مطلوب.'); return; }
        if (isNew && !newPassword.trim()) { setPasswordError('كلمة المرور مطلوبة.'); return; }
        if (newPassword && newPassword !== confirmPassword) { setPasswordError('كلمات المرور غير متطابقة.'); return; }
        if (newPassword && newPassword.length < 4) { setPasswordError('كلمة المرور قصيرة جداً.'); return; }
        
        setPasswordError('');
        let finalUser = { ...editedUser };
        if (newPassword) finalUser.password = newPassword;
        
        // إذا كان المدير الرئيسي، تفعيل كل الصلاحيات تلقائياً وضمان أنه نشط
        if (finalUser.id === 'u1') {
            finalUser.permissions = {
                [Page.Dashboard]: true,
                [Page.Products]: true,
                [Page.Pos]: true,
                [Page.Customers]: true,
                [Page.Invoices]: true,
                [Page.Expenses]: true,
                [Page.Settings]: true,
            };
            finalUser.status = 'نشط'; // المدير الرئيسي دائماً نشط
        }

        await onSave({ ...finalUser, id: isNew ? `u${Date.now()}` : editedUser.id });
        onClose();
    };

    const pageTranslations: { [key: string]: string } = {
        'Dashboard': 'لوحة التحكم', 'Products': 'المنتجات', 'Pos': 'نقطة البيع',
        'Customers': 'العملاء', 'Invoices': 'الفواتير', 'Expenses': 'المصاريف', 'Settings': 'الإعدادات',
    };

    return (
        <Modal title={isNew ? 'إضافة مستخدم جديد' : 'تعديل المستخدم'} onClose={onClose}>
            <div className="space-y-4">
                <input type="text" name="name" value={editedUser.name} onChange={handleChange} placeholder="اسم المستخدم" className="p-2 border rounded w-full" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="p-2 border rounded w-full" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور" className="p-2 border rounded w-full" />
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                {/* إخفاء تحديد الحالة للمدير الرئيسي */}
                {!isMainAdmin ? (
                    <select name="status" value={editedUser.status} onChange={handleChange} className="p-2 border rounded w-full">
                        <option value="نشط">نشط</option>
                        <option value="غير نشط">غير نشط</option>
                    </select>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full me-2"></div>
                            <span className="text-sm font-medium text-green-800">
                                المدير الرئيسي نشط دائماً ولا يمكن تعطيله
                            </span>
                        </div>
                    </div>
                )}
                
                {/* إخفاء صلاحيات الوصول للمدير الرئيسي */}
                {!isMainAdmin && (
                    <>
                        <h3 className="text-lg font-bold pt-4">صلاحيات الوصول</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.values(Page).filter(v => typeof v === 'number').map(pEnum => (
                                <label key={pEnum} className="flex items-center p-3 rounded-lg bg-gray-100 hover:bg-blue-100 border">
                                    <input 
                                        type="checkbox" 
                                        checked={editedUser.permissions?.[pEnum as Page] || false} 
                                        onChange={(e) => handlePermissionChange(pEnum as Page, e.target.checked)} 
                                        className="h-5 w-5 text-blue-600 rounded" 
                                    />
                                    <span className="ms-3 text-sm font-medium">{pageTranslations[Page[pEnum as Page]]}</span>
                                </label>
                            ))}
                        </div>
                    </>
                )}
                
                {/* رسالة للمدير الرئيسي */}
                {isMainAdmin && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <ShieldCheckIcon className="h-5 w-5 text-blue-600 me-2" />
                            <span className="text-sm font-medium text-blue-800">
                                المدير الرئيسي يملك جميع الصلاحيات تلقائياً ولا يمكن تعديلها
                            </span>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
            </div>
        </Modal>
    );
};

// Main Settings Page Component
const SettingsPage = () => {
    const { settings, saveSettings, users, saveUsers, currentUser, setCurrentUser, addNotification, storageMode, directoryName, requestDirectoryPermission, resetAllData, products, customers, invoices, expenses } = useAppContext();
    const [activeModal, setActiveModal] = useState<'company' | 'invoice' | 'user' | 'sync' | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [syncTesting, setSyncTesting] = useState<'idle'|'loading'|'ok'|'fail'>('idle');
    const [syncRunning, setSyncRunning] = useState<'idle'|'loading'|'ok'|'fail'>('idle');
    
    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning'
    });

    const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm,
            type
        });
    };

    const hideConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    const handleSaveSettings = async (newSettings: Settings) => {
        await saveSettings(newSettings);
        addNotification('تم حفظ الإعدادات بنجاح');
    };

    const handleSaveUser = async (user: User) => {
        const isNew = !users.some(u => u.id === user.id);
        const updatedUsers = isNew ? [...users, user] : users.map(u => u.id === user.id ? user : u);
        await saveUsers(updatedUsers);
        addNotification(isNew ? 'تمت إضافة المستخدم' : 'تم تحديث المستخدم');
        if (currentUser && currentUser.id === user.id) setCurrentUser(user);
    };

    const handleDeleteUser = async (userId: string) => {
        if (users.length <= 1 || currentUser?.id === userId) {
            addNotification('لا يمكن حذف المستخدم الوحيد أو حسابك الحالي.', 'error');
            return;
        }
        
        const user = users.find(u => u.id === userId);
        if (!user) return;

        showConfirmDialog(
            'حذف المستخدم',
            `هل أنت متأكد من حذف المستخدم "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
            async () => {
                await saveUsers(users.filter(u => u.id !== userId));
                addNotification('تم حذف المستخدم', 'success');
                hideConfirmDialog();
            },
            'danger'
        );
    };

    const handleResetAllData = () => {
        showConfirmDialog(
            'إعادة تعيين جميع البيانات',
            'هل أنت متأكد من أنك تريد إعادة تعيين كل شيء؟ سيتم حذف جميع البيانات بشكل دائم ولا يمكن التراجع عن هذا الإجراء.',
            async () => {
                await resetAllData();
                hideConfirmDialog();
            },
            'danger'
        );
    };

    // Sync actions in card
    const handleTestConnectionCard = async () => {
        setSyncTesting('loading');
        const ok = await testConnection(settings);
        setSyncTesting(ok ? 'ok' : 'fail');
        addNotification(ok ? 'الاتصال بـ Firebase ناجح' : 'فشل الاتصال بـ Firebase', ok ? 'success' : 'error');
    };

    const handleFullSyncNow = async () => {
        if (!settings.syncEnabled) {
            addNotification('المزامنة غير مفعلة في الإعدادات', 'error');
            return;
        }
        setSyncRunning('loading');
        try {
            const what = settings.syncWhat || {};
            const payload: any = {};
            if (what.products) payload.products = products;
            if (what.customers) payload.customers = customers;
            if (what.invoices) payload.invoices = invoices;
            if (what.expenses) payload.expenses = expenses;
            if (what.users) payload.users = users;
            if (what.settings) payload.settings = settings;
            const res = await syncPush(settings as any, payload);
            setSyncRunning(res.ok ? 'ok' : 'fail');
            if (res.ok) {
                await saveSettings({ ...settings, lastSyncAt: new Date().toISOString() });
                addNotification('تمت المزامنة بنجاح');
            } else {
                addNotification('فشلت المزامنة: ' + (res.error || ''), 'error');
            }
        } catch (e) {
            setSyncRunning('fail');
            addNotification('فشلت المزامنة', 'error');
        }
    };

    const openUserModal = (user: User | null) => {
        setEditingUser(user);
        setActiveModal('user');
    };

    const renderModal = () => {
        switch (activeModal) {
            case 'company':
                return <CompanyInfoModal settings={settings} onSave={handleSaveSettings} onClose={() => setActiveModal(null)} />;
            case 'invoice':
                return <InvoiceSettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setActiveModal(null)} />;
            case 'sync':
                return <SyncSettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setActiveModal(null)} />;
            case 'user':
                return <UserModal user={editingUser} onSave={handleSaveUser} onClose={() => setActiveModal(null)} />;
            default:
                return null;
        }
    };

    return (
        <div>
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">الإعدادات</h1>
                <p className="text-gray-600">إدارة وتخصيص إعدادات النظام والمستخدمين</p>
            </div>

            {/* System Status Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full me-2"></div>
                            <span className="text-sm font-medium text-gray-700">النظام يعمل بشكل طبيعي</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            وضع التخزين: <span className="font-medium">{storageMode === 'fs' ? 'ملفات محلية' : 'متصفح'}</span>
                        </div>
                        {directoryName && (
                            <div className="text-sm text-gray-600">
                                المجلد: <span className="font-medium">{directoryName}</span>
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        المستخدم الحالي: <span className="font-medium text-blue-600">{currentUser?.name}</span>
                    </div>
                </div>
            </div>

            {/* Settings Categories */}
            <div className="space-y-8">
                {/* Business Settings Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <BriefcaseIcon className="h-7 w-7 me-3 text-blue-600" />
                        إعدادات النشاط التجاري
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Info Card */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center me-3">
                                                <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">معلومات الشركة</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4">إدارة تفاصيل النشاط التجاري والعلامة التجارية</p>
                                        <div className="space-y-1 text-sm text-gray-500">
                                            <div>الشركة: <span className="font-medium">{settings.companyName || 'غير محدد'}</span></div>
                                            <div>الهاتف: <span className="font-medium">{settings.companyPhone || 'غير محدد'}</span></div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveModal('company')} 
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Settings Card */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center me-3">
                                                <FileTextIcon className="h-5 w-5 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">تخصيص الفاتورة</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4">تعديل شكل الفاتورة وحجم الورق</p>
                                        <div className="space-y-1 text-sm text-gray-500">
                                            <div>حجم الورق: <span className="font-medium">{settings.paperSize || '58mm'}</span></div>
                                            <div>رسالة الشكر: <span className="font-medium">{settings.thankYouMessage ? 'محددة' : 'افتراضية'}</span></div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveModal('invoice')} 
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    >
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Settings Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <SettingsIcon className="h-7 w-7 me-3 text-purple-600" />
                        إعدادات النظام
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Data Management Card */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center me-3">
                                        <FolderIcon className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">إدارة البيانات</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">إدارة مجلد الحفظ وإعادة تعيين البيانات</p>
                                <div className="space-y-3">
                                    <button 
                                        onClick={requestDirectoryPermission} 
                                        className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <FolderIcon className="h-4 w-4 me-2" />
                                        تغيير مجلد الحفظ
                                    </button>
                                    <button 
                                        onClick={handleResetAllData} 
                                        className="w-full flex items-center justify-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <TrashIcon className="h-4 w-4 me-2" />
                                        إعادة تعيين كل البيانات
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sync Settings Card */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center me-3">
                                                <SettingsIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">إعدادات المزامنة</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4">مزامنة البيانات مع Firebase (العرض والمسح من تطبيق منفصل)</p>
                                        <div className="space-y-1 text-sm text-gray-500">
                                            <div>الحالة: <span className={`font-medium ${settings.syncEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                                {settings.syncEnabled ? 'مفعلة' : 'غير مفعلة'}
                                            </span></div>
                                            <div>المشروع: <span className="font-medium">{settings.syncProjectId || 'غير محدد'}</span></div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveModal('sync')} 
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleTestConnectionCard} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">اختبار الاتصال</button>
                                        {syncTesting === 'loading' && <span className="text-gray-600 text-xs">جارٍ الاختبار...</span>}
                                        {syncTesting === 'ok' && <span className="text-green-600 text-xs">الاتصال ناجح</span>}
                                        {syncTesting === 'fail' && <span className="text-red-600 text-xs">فشل الاتصال</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleFullSyncNow} className="px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm" disabled={!settings.syncEnabled}>مزامنة الآن</button>
                                        {syncRunning === 'loading' && <span className="text-gray-600 text-xs">جارٍ المزامنة...</span>}
                                        {syncRunning === 'ok' && <span className="text-green-600 text-xs">تمت المزامنة</span>}
                                        {syncRunning === 'fail' && <span className="text-red-600 text-xs">فشلت المزامنة</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Management Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <ShieldCheckIcon className="h-7 w-7 me-3 text-purple-600" />
                            إدارة المستخدمين
                        </h2>
                        <button 
                            onClick={() => openUserModal(null)} 
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            <PlusCircleIcon className="h-5 w-5 me-2" />
                            إضافة مستخدم جديد
                        </button>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="p-6">
                            <div className="space-y-4">
                                {users.map((user, index) => (
                                    <div key={user.id} className={`flex items-center justify-between p-4 rounded-lg border ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center me-4 ${user.status === 'نشط' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <ShieldCheckIcon className={`h-5 w-5 ${user.status === 'نشط' ? 'text-green-600' : 'text-gray-400'}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center">
                                                    <h4 className="font-semibold text-gray-900 me-2">{user.name}</h4>
                                                    {user.id === 'u1' && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">مدير النظام</span>
                                                    )}
                                                    {currentUser?.id === user.id && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full me-2">أنت</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    الصلاحيات: {Object.values(user.permissions || {}).filter(Boolean).length} من {Object.values(Page).filter(v => typeof v === 'number').length}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 space-x-reverse">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.status}
                                            </span>
                                            <button 
                                                onClick={() => openUserModal(user)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={users.length <= 1 || currentUser?.id === user.id}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {renderModal()}
            
            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={hideConfirmDialog}
                type={confirmDialog.type}
                confirmText={confirmDialog.type === 'danger' ? 'حذف' : 'تأكيد'}
                cancelText="إلغاء"
            />
        </div>
    );
};

export default SettingsPage;