
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

    // Prefer dedicated scanner config; fallback to sync config if scanner config is missing
    let firebaseConfig: any | null = null;

    if ((settings as any).scannerApiKey && (settings as any).scannerProjectId) {
        firebaseConfig = {
            apiKey: (settings as any).scannerApiKey,
            authDomain: (settings as any).scannerAuthDomain,
            projectId: (settings as any).scannerProjectId,
        };
    } else if (settings.syncApiKey && settings.syncProjectId) {
        firebaseConfig = {
            apiKey: settings.syncApiKey,
            authDomain: settings.syncAuthDomain,
            projectId: settings.syncProjectId,
        };
    }

    if (!firebaseConfig) {
        // No config available
        return;
    }

    try {
        app = initializeApp(firebaseConfig, 'scanner'); // Use a unique name for the app instance
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
};

export const requestScan = async (): Promise<void> => {
    if (!db) {
        // Firebase scanner not configured - silently return without error
        return;
    }
    
    const scannerSessionDocRef = doc(db, 'scannerSessions', 'fixed');
    try {
        await setDoc(scannerSessionDocRef, { status: 'scanRequested', requestedAt: new Date() }, { merge: true });
    } catch (error) {
        console.error("Failed to request Firebase scan:", error);
    }
};

export const listenForScanResult = (callback: (barcode: string) => void): (() => void) => {
    if (!db) {
        // Firebase scanner not configured - return no-op unsubscribe function
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
                callback(data.scannedValue);
                // Reset status to avoid re-triggering
                setDoc(scannerSessionDocRef, { status: 'completed' }, { merge: true })
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
        // Attempt a simple write to a test document
        const testDocRef = doc(db, 'scannerSessions', 'connection-test');
        await setDoc(testDocRef, { status: 'testing', timestamp: new Date() });
        console.log("Firebase scanner connection test successful.");
        return true;
    } catch (error) {
        console.error("Firebase scanner connection test failed:", error);
        return false;
    }
};
