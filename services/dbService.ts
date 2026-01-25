
/**
 * Simple IndexedDB wrapper to persist audio files (Blobs) and metadata
 */
const DB_NAME = 'AuraMusicDB';
const SONGS_STORE = 'songs';
const METADATA_STORE = 'metadata';
const DB_VERSION = 2; // Nâng cấp version để thêm store mới

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        db.createObjectStore(SONGS_STORE);
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSongBlob = async (id: string, blob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SONGS_STORE, 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.put(blob, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSongBlob = async (id: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SONGS_STORE, 'readonly');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteSongBlob = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SONGS_STORE, METADATA_STORE], 'readwrite');
    transaction.objectStore(SONGS_STORE).delete(id);
    transaction.objectStore(METADATA_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveLibraryMetadata = async (songs: any[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(METADATA_STORE, 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);
    // Clear old metadata and save new
    store.clear().onsuccess = () => {
      songs.forEach(song => {
        // Don't save transient online songs to permanent storage
        if (!song.id.startsWith('online')) {
          store.put(song, song.id);
        }
      });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getLibraryMetadata = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(METADATA_STORE, 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};
