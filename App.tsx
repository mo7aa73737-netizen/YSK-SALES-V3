
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Page, Product, Customer, Invoice, Unit, User, SystemSettings, Expense } from './types';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ActivationPage from './pages/ActivationPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import PosPage from './pages/PosPage';
import CustomersPage from './pages/CustomersPage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';
import SettingsPage from './pages/SettingsPage';
import { getFromDB, setToDB } from './utils/db';
import * as fileSystem from './utils/fileSystem';
import { initializeScanner } from './utils/firebase-scanner';
import { BuildingStorefrontIcon, FolderIcon } from './components/icons';
import { licenseValidator } from './utils/license-validator';


// --- Main App Component ---

const defaultSettings: SystemSettings = {
    systemName: "نظامي",
    companyName: "شركة ABC للتجارة",
    companyAddress: "123 شارع التجارة، القاهرة",
    companyPhone: "01234567890",
    customInvoiceBarcode: "",
    allowInvoiceEditing: false,
    enableStockAlerts: true,
};
const defaultUnits: Unit[] = [{ id: 1, name: 'قطعة' }, { id: 2, name: 'عبوة' }, { id: 3, name: 'كرتونة' }];
const defaultUsers: User[] = [{
    id: 'u1',
    name: 'admin',
    password: 'admin',
    status: 'نشط',
    permissions: {
        [Page.Dashboard]: true,
        [Page.Products]: true,
        [Page.Pos]: true,
        [Page.Customers]: true,
        [Page.Invoices]: true,
        [Page.Settings]: true,
        [Page.Expenses]: true,
    }
}];

type StorageMode = 'fs' | 'indexeddb' | 'pending';
interface AppContextType {
    page: Page;
    setPage: (page: Page) => void; // This will now be handleSetPage
    products: Product[];
    saveProducts: (data: Product[]) => Promise<void>;
    customers: Customer[];
    saveCustomers: (data: Customer[]) => Promise<void>;
    invoices: Invoice[];
    saveInvoices: (data: Invoice[]) => Promise<void>;
    expenses: Expense[];
    saveExpenses: (data: Expense[]) => Promise<void>;
    units: Unit[];
    saveUnits: (data: Unit[]) => Promise<void>;
    users: User[];
    saveUsers: (data: User[]) => Promise<void>;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    settings: SystemSettings;
    saveSettings: (data: SystemSettings) => Promise<void>;
    addNotification: (message: string, type?: 'success' | 'error') => void;
    storageMode: StorageMode;
    directoryName: string | null;
    requestDirectoryPermission: () => Promise<void>;
        resetAllData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const DirectoryPicker = ({ onPickDirectory }: { onPickDirectory: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
      <BuildingStorefrontIcon className="mx-auto h-16 w-16 text-blue-600" />
      <h1 className="text-3xl font-bold text-gray-800">تحديد مجلد الحفظ</h1>
      <p className="mt-2 text-gray-600">
        لضمان حفظ بياناتك بشكل دائم وآمن على جهازك، يرجى تحديد مجلد لحفظ ملفات النظام.
        <br />
        ستكون بياناتك (المنتجات, الفواتير, إلخ) محفوظة داخل هذا المجلد ولن تُفقد.
      </p>
      <button
        onClick={onPickDirectory}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <FolderIcon className="me-2 h-6 w-6" />
        اختر مجلد الحفظ
      </button>
      <p className="text-xs text-gray-500 mt-4">
        هذه الميزة مدعومة بشكل أفضل في متصفحات Chrome و Edge.
      </p>
    </div>
  </div>
);


const App = () => {
    const [isActivated, setIsActivated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [storageMode, setStorageMode] = useState<StorageMode>('pending');
    const [directoryHandle, setDirectoryHandle] = useState<any>(null);
    const [needsPermission, setNeedsPermission] = useState(false);

    const [page, setPage] = useState<Page>(Page.Dashboard);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(current => current.filter(n => n.id !== id));
        }, 4000);
    };

    useEffect(() => {
        // Hide splash screen after 0.5 seconds
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }

        // Initialize service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }

        // Start the storage initialization process first
        initializeStorage();

    }, []);

    // This effect runs after storage is initialized to check activation status
    useEffect(() => {
        if (storageMode !== 'pending') {
            const res = licenseValidator.checkActivationStatus();
            setIsActivated(res.valid === true);
        }
    }, [storageMode]);

    // New useEffect to handle auto-login after users are loaded
    useEffect(() => {
        // This useEffect is now intentionally left blank to disable auto-login.
        // The logic has been moved to LoginPage.tsx to handle remembering the username only.
    }, []);

    // Re-initialize Firebase scanner when sync settings change
    useEffect(() => {
        initializeScanner(settings);
    }, [settings.syncApiKey, settings.syncProjectId, settings.syncAuthDomain]);

    const initializeStorage = async () => {
        const fsSupported = 'showDirectoryPicker' in window;

        if (fsSupported) {
            const handle = await getFromDB<any>('directoryHandle');
            if (handle) {
                const hasPermission = await fileSystem.verifyPermission(handle);
                if (hasPermission) {
                    setDirectoryHandle(handle);
                    setStorageMode('fs');
                    await loadData(handle, 'fs');
                } else {
                    // If permission was denied previously, we must ask again.
                    setNeedsPermission(true);
                }
            } else {
                // No handle stored, so we need to ask for permission.
                setNeedsPermission(true);
            }
        } else {
            // FS not supported, fall back to IndexedDB immediately.
            const fsSupportNotified = localStorage.getItem('fsSupportNotified');
            if (!fsSupportNotified) {
                addNotification('المتصفح لا يدعم حفظ الملفات, سيتم الحفظ في المتصفح.', 'error');
                localStorage.setItem('fsSupportNotified', 'true');
            }
            setStorageMode('indexeddb');
            await loadData(null, 'indexeddb');
        }
    };
    
    const requestDirectoryPermission = async () => {
        const handle = await fileSystem.selectDirectory();
        if (handle) {
            const hasPermission = await fileSystem.verifyPermission(handle);
            if (hasPermission) {
                await setToDB('directoryHandle', handle);
                setDirectoryHandle(handle);
                setStorageMode('fs');
                setNeedsPermission(false);
                addNotification(`تم اختيار المجلد "${handle.name}" بنجاح. سيتم تحميل البيانات منه.`, 'success');
                await loadData(handle, 'fs');
            } else {
                addNotification('Permission to access folder was denied.', 'error');
                if (!directoryHandle) {
                    setStorageMode('indexeddb');
                    await loadData(null, 'indexeddb');
                }
            }
        } else {
            // Don't show notification for normal operation - user simply didn't select a directory
            if (!directoryHandle) {
                setStorageMode('indexeddb');
                setNeedsPermission(false);
                await loadData(null, 'indexeddb');
            }
        }
    };
    
    const loadData = async (handle: any, mode: 'fs' | 'indexeddb') => {
        setIsLoading(true);
        
        const reader = mode === 'fs' 
            ? async <T,>(key: string) => fileSystem.readFile<T>(handle, `${key}.json`)
            : async <T,>(key: string) => getFromDB<T>(key);

        const writer = mode === 'fs'
            ? async (key: string, data: any) => fileSystem.writeFile(handle, `${key}.json`, data)
            : async (key: string, data: any) => setToDB(key, data);
            
        const [productsData, customersData, invoicesData, expensesData, unitsData, usersData, settingsData] = await Promise.all([
            reader<Product[]>('products'),
            reader<Customer[]>('customers'),
            reader<Invoice[]>('invoices'),
            reader<Expense[]>('expenses'),
            reader<Unit[]>('units'),
            reader<User[]>('users'),
            reader<SystemSettings>('settings')
        ]);
        
        setProducts(productsData ?? []);
        setCustomers(customersData ?? []);
        setInvoices(invoicesData ?? []);
        setExpenses(expensesData ?? []);
        
        if (unitsData) {
             setUnits(unitsData);
        } else {
            setUnits(defaultUnits);
            await writer('units', defaultUnits);
        }
        
        // Handle users data and ensure permissions are set for old data
        if (usersData && usersData.length > 0) {
            const usersWithPermissions = usersData.map(user => ({
                ...user,
                // Assign default permissions if not present, or if role was 'مدير النظام' give full access
                permissions: user.permissions || (user.role === 'مدير النظام' ? defaultUsers[0].permissions : {})
            }));
            setUsers(usersWithPermissions);
        } else {
            setUsers(defaultUsers);
            await writer('users', defaultUsers);
        }

        if (settingsData) {
            setSettings(settingsData);
            initializeScanner(settingsData); // Initialize scanner with loaded settings
        } else {
            setSettings(defaultSettings);
            await writer('settings', defaultSettings);
            initializeScanner(defaultSettings); // Initialize with default settings
        }

        setIsLoading(false);
    };

    const createSaver = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) => async (data: T) => {
        setter(data);
        if (storageMode === 'fs' && directoryHandle) {
            await fileSystem.writeFile(directoryHandle, `${key}.json`, data);
        } else if (storageMode === 'indexeddb') {
            await setToDB(key, data);
        }
    };
    
    const saveProducts = createSaver(setProducts, 'products');
    const saveCustomers = createSaver(setCustomers, 'customers');
    const saveInvoices = createSaver(setInvoices, 'invoices');
    const saveUnits = createSaver(setUnits, 'units');
    const saveUsers = createSaver(setUsers, 'users');
    const saveSettings = createSaver(setSettings, 'settings');
    const saveExpenses = createSaver(setExpenses, 'expenses');

    const resetAllData = async () => {
        if (!window.confirm('هل أنت متأكد من أنك تريد إعادة تعيين كل شيء؟ سيتم حذف جميع البيانات بشكل دائم ولا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        console.log("Starting data reset...");
        setIsLoading(true);

        try {
            // 1. Clear storage by saving default/empty values
            await saveProducts([]);
            await saveCustomers([]);
            await saveInvoices([]);
            await saveUnits(defaultUnits); // Reset to default
            await saveUsers(defaultUsers); // Reset to default admin
            await saveSettings(defaultSettings); // Reset to default

            // If in fs mode, also clear the handle from indexeddb so it asks again
            if (storageMode === 'fs') {
                 await setToDB('directoryHandle', null);
            }

            // 2. Clear localStorage
            localStorage.removeItem('isActivated');
            localStorage.removeItem('rememberedUser');

            // 3. Reload the application to a fresh state
            addNotification('تمت إعادة تعيين جميع البيانات بنجاح. سيتم إعادة تشغيل التطبيق.', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Failed to reset data:", error);
            addNotification('فشل في إعادة تعيين البيانات.', 'error');
            setIsLoading(false);
        }
    };
    
    // Simple function to handle page changes
    const handleSetPage = useCallback((newPage: Page) => {
        setPage(newPage);
    }, []);

    const renderPage = () => {
        // If no user is logged in, always show LoginPage
        if (!currentUser) {
            return <LoginPage />;
        }

        // Check if current user has permission for the requested page
        // Admin (u1) always has access to all pages
        const hasPermission = currentUser.id === 'u1' || currentUser.permissions?.[page] === true;

        if (!hasPermission) {
            // If user doesn't have permission, redirect to Dashboard
            // This also handles cases where a user's permissions are revoked while they are on a page
            handleSetPage(Page.Dashboard); // Use handleSetPage here
            addNotification('ليس لديك صلاحية للوصول إلى هذه الصفحة.', 'error');
            return <DashboardPage />;
        }

        switch (page) {
            case Page.Dashboard: return <DashboardPage />;
            case Page.Products: return <ProductsPage />;
            case Page.Pos: return <PosPage />;
            case Page.Customers: return <CustomersPage />;
            case Page.Invoices: return <InvoicesPage />;
            case Page.Expenses: return <ExpensesPage />;
            case Page.Settings: return <SettingsPage />;
            default: return <DashboardPage />;
        }
    };
    
    const handleActivation = () => {
        const res = licenseValidator.checkActivationStatus();
        setIsActivated(res.valid === true);
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('rememberedUser');
        setPage(Page.Dashboard); // Reset to dashboard on logout
    }

    const contextValue: AppContextType = {
        page, setPage: handleSetPage, products, saveProducts, customers, saveCustomers,
        invoices, saveInvoices, expenses, saveExpenses, units, saveUnits, users, saveUsers,
        currentUser, setCurrentUser,
        settings, saveSettings, addNotification,
        storageMode, directoryName: directoryHandle?.name || null, requestDirectoryPermission,
        resetAllData
    };
    
    // Render logic based on the current state
    if (needsPermission) {
        return <DirectoryPicker onPickDirectory={requestDirectoryPermission} />;
    }

    if (isLoading || storageMode === 'pending') { // Keep loading until storage is ready
        return <div className="flex justify-center items-center min-h-screen bg-gray-100 font-bold text-xl">التحقق من إعدادات التخزين...</div>;
    }

    if (!isActivated) {
        return <ActivationPage onActivate={handleActivation} />;
    }

    return (
        <AppContext.Provider value={contextValue}>
            <div className="bg-gray-100 min-h-screen text-gray-800">
                {!currentUser ? (
                    <LoginPage />
                ) : (
                    <Layout onLogout={handleLogout}>
                        {renderPage()}
                    </Layout>
                )}
            </div>
            <div className="fixed bottom-5 left-5 z-50 space-y-3">
                {notifications.map(n => (
                    <div key={n.id} className={`px-6 py-3 rounded-lg shadow-lg text-white ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {n.message}
                    </div>
                ))}
            </div>
        </AppContext.Provider>
    );
};

export default App;
