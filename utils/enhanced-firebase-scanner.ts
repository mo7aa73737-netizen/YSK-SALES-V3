import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, Firestore, Unsubscribe } from 'firebase/firestore';
import { SystemSettings } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let unsubscribe: Unsubscribe | null = null;

export const initializeScanner = (settings: SystemSettings) => {
    if (app) {
        // If app is already initialized, no need to re-initialize
        return;
    }
    if (settings.scannerApiKey && settings.scannerProjectId) {
        const firebaseConfig = {
            apiKey: settings.scannerApiKey,
            authDomain: settings.scannerAuthDomain,
            projectId: settings.scannerProjectId,
        };
        try {
            app = initializeApp(firebaseConfig, 'scanner');
            db = getFirestore(app);
        } catch (error) {
            console.error("Firebase initialization failed:", error);
        }
    }
};

// Enhanced scan request with context
export const requestScan = async (context?: string): Promise<void> => {
    if (!db) {
        console.warn("Firebase scanner not configured");
        return;
    }
    
    const scannerSessionDocRef = doc(db, 'scannerSessions', 'fixed');
    
    // Determine context based on current page or caller
    let scanContext = context;
    if (!scanContext) {
        // Try to determine context from current URL or page state
        const currentPath = window.location.pathname;
        if (currentPath.includes('products')) {
            scanContext = 'صفحة المنتجات';
        } else if (currentPath.includes('pos')) {
            scanContext = 'نقطة البيع';
        } else {
            scanContext = 'النظام الرئيسي';
        }
    }
    
    try {
        await setDoc(scannerSessionDocRef, { 
            status: 'scanRequested', 
            requestedAt: new Date(),
            context: scanContext,
            requestId: `req_${Date.now()}` // Unique request ID
        }, { merge: true });
        
        console.log(`Scan requested with context: ${scanContext}`);
    } catch (error) {
        console.error("Failed to request Firebase scan:", error);
    }
};

// Enhanced scan request for specific contexts
export const requestScanForProducts = async (): Promise<void> => {
    await requestScan('إضافة/تعديل منتج');
};

export const requestScanForPOS = async (): Promise<void> => {
    await requestScan('إضافة منتج للفاتورة');
};

export const requestScanForSearch = async (): Promise<void> => {
    await requestScan('البحث في المنتجات');
};

export const listenForScanResult = (callback: (barcode: string, product?: any) => void): (() => void) => {
    if (!db) {
        console.warn("Firebase scanner not configured");
        return () => {};
    }
    
    const scannerSessionDocRef = doc(db, 'scannerSessions', 'fixed');
    
    // Clean up any previous listener
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    try {
        unsubscribe = onSnapshot(scannerSessionDocRef, (snapshot) => {
            const data = snapshot.data();
            if (data && data.status === 'scanned' && data.scannedValue) {
                console.log('Scan result received:', data.scannedValue, data.product);
                
                // Call the callback with barcode and product info
                callback(data.scannedValue, data.product);
                
                // Reset status to avoid re-triggering
                setDoc(scannerSessionDocRef, { 
                    status: 'completed',
                    completedAt: new Date()
                }, { merge: true })
                    .catch(error => console.error("Failed to reset scan status:", error));
            }
        }, (error) => {
            console.error("Firebase scanner listener error:", error);
        });

        return unsubscribe;
    } catch (error) {
        console.error("Failed to setup Firebase scanner listener:", error);
        return () => {};
    }
};

export const isFirebaseScannerAvailable = (): boolean => {
    return db !== null;
};

export const checkScannerConnection = async (): Promise<boolean> => {
    if (!db) {
        return false;
    }
    try {
        const testDocRef = doc(db, 'scannerSessions', 'connection-test');
        await setDoc(testDocRef, { 
            status: 'testing', 
            timestamp: new Date(),
            testId: `test_${Date.now()}`
        });
        console.log("Firebase scanner connection test successful.");
        return true;
    } catch (error) {
        console.error("Firebase scanner connection test failed:", error);
        return false;
    }
};

// Get scanner status
export const getScannerStatus = async (): Promise<any> => {
    if (!db) return null;
    
    try {
        const scannerSessionDocRef = doc(db, 'scannerSessions', 'fixed');
        const snapshot = await scannerSessionDocRef.get();
        return snapshot.data();
    } catch (error) {
        console.error("Failed to get scanner status:", error);
        return null;
    }
};

// Enhanced notification system for scan requests
export const showScanRequestNotification = (context: string) => {
    // Create a visual indicator that scan was requested
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 5v14"></path><path d="M8 5v14"></path><path d="M12 5v14"></path><path d="M17 5v14"></path><path d="M21 5v14"></path>
        </svg>
        <span>تم إرسال طلب مسح للهاتف - ${context}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
};

// Wrapper functions that include notifications
export const requestScanWithNotification = async (context?: string): Promise<void> => {
    await requestScan(context);
    showScanRequestNotification(context || 'النظام الرئيسي');
};

export const requestScanForProductsWithNotification = async (): Promise<void> => {
    await requestScanForProducts();
    showScanRequestNotification('إضافة/تعديل منتج');
};

export const requestScanForPOSWithNotification = async (): Promise<void> => {
    await requestScanForPOS();
    showScanRequestNotification('إضافة منتج للفاتورة');
};

export const requestScanForSearchWithNotification = async (): Promise<void> => {
    await requestScanForSearch();
    showScanRequestNotification('البحث في المنتجات');
};