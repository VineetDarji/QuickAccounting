export type StoredDocument = {
  id: string;
  caseId: string;
  ownerEmail: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
  blob: Blob;
};

const DB_NAME = 'quick_accounting_docs';
const STORE = 'documents';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
};

const runTx = async <T,>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openDb();
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const putDocument = (doc: StoredDocument) => runTx('readwrite', (store) => store.put(doc));

export const getDocument = (id: string) => runTx<StoredDocument | undefined>('readonly', (store) => store.get(id));

export const deleteDocument = (id: string) => runTx('readwrite', (store) => store.delete(id));

