import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, collection } from 'firebase/firestore';
import type { SystemSettings, Product, Customer, Invoice, Expense, User } from '../types';

export type SyncSettingsInput = Pick<SystemSettings,
  'syncEnabled' | 'syncApiKey' | 'syncAuthDomain' | 'syncProjectId' | 'syncCollectionPrefix' | 'syncWhat'>;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function getPrefix(settings: SystemSettings) {
  return (settings.syncCollectionPrefix || 'pos').trim();
}

export function initializeSync(settings: SyncSettingsInput): Firestore | null {
  if (!settings.syncEnabled) return null;
  if (!settings.syncApiKey || !settings.syncProjectId) return null;

  try {
    if (!app) {
      const config = {
        apiKey: settings.syncApiKey,
        authDomain: settings.syncAuthDomain,
        projectId: settings.syncProjectId,
      } as any;
      const existing = getApps().find(a => a.name === 'sync');
      app = existing ? getApp('sync') : initializeApp(config, 'sync');
      db = getFirestore(app);
    }
    return db;
  } catch (e) {
    console.error('Failed to initialize sync Firebase:', e);
    return null;
  }
}

export async function testConnection(settings: SyncSettingsInput): Promise<boolean> {
  try {
    const fdb = initializeSync(settings);
    if (!fdb) return false;
    const prefix = getPrefix(settings as SystemSettings);
    const ref = doc(fdb, `${prefix}_connection`, 'test');
    await setDoc(ref, { ts: new Date().toISOString() }, { merge: true });
    return true;
  } catch (e) {
    console.error('Sync connection test failed:', e);
    return false;
  }
}

// Helpers
async function pushArray<T extends { id?: string }>(fdb: Firestore, coll: string, items: T[], idSelector?: (item: T, index: number) => string) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = (item as any).id || (idSelector ? idSelector(item, i) : undefined) || `${Date.now()}_${i}`;
    const ref = doc(collection(fdb, coll), String(id));
    await setDoc(ref, item as any, { merge: true });
  }
}

export interface SyncDataPayload {
  products?: Product[];
  customers?: Customer[];
  invoices?: Invoice[];
  expenses?: Expense[];
  users?: User[];
  settings?: SystemSettings;
}

export interface SyncResultSummary {
  ok: boolean;
  pushed: { [key: string]: number };
  error?: string;
}

export async function syncPush(settings: SystemSettings, data: SyncDataPayload): Promise<SyncResultSummary> {
  const res: SyncResultSummary = { ok: false, pushed: {} };
  try {
    const fdb = initializeSync(settings);
    if (!fdb) {
      return { ok: false, pushed: {}, error: 'Sync not enabled or config missing' };
    }
    const prefix = getPrefix(settings);
    const what = settings.syncWhat || {};

    if (what.products && data.products) {
      await pushArray(fdb, `${prefix}_products`, data.products);
      res.pushed.products = data.products.length;
    }
    if (what.customers && data.customers) {
      await pushArray(fdb, `${prefix}_customers`, data.customers);
      res.pushed.customers = data.customers.length;
    }
    if (what.invoices && data.invoices) {
      await pushArray(fdb, `${prefix}_invoices`, data.invoices);
      res.pushed.invoices = data.invoices.length;
    }
    if (what.expenses && data.expenses) {
      await pushArray(fdb, `${prefix}_expenses`, data.expenses);
      res.pushed.expenses = data.expenses.length;
    }
    if (what.users && data.users) {
      await pushArray(fdb, `${prefix}_users`, data.users);
      res.pushed.users = data.users.length;
    }
    if (what.settings && data.settings) {
      const ref = doc(fdb, `${prefix}_settings`, 'app');
      await setDoc(ref, data.settings as any, { merge: true });
      res.pushed.settings = 1;
    }

    res.ok = true;
    return res;
  } catch (e: any) {
    console.error('syncPush failed:', e);
    res.ok = false;
    res.error = e?.message || String(e);
    return res;
  }
}
