const DB_NAME = 'ironwill_db';
const DB_VERSION = 1;

type AvatarRecord = { id: string; dataURL: string };
type PhotoRecord  = { date: string; dataURL: string };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('avatar'))
        db.createObjectStore('avatar', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('body_photos'))
        db.createObjectStore('body_photos', { keyPath: 'date' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveAvatar(dataURL: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('avatar', 'readwrite');
    tx.objectStore('avatar').put({ id: 'current', dataURL });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function loadAvatar(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx  = db.transaction('avatar', 'readonly');
    const req = tx.objectStore('avatar').get('current');
    req.onsuccess = () => resolve((req.result as AvatarRecord | undefined)?.dataURL ?? null);
    req.onerror   = () => resolve(null);
  });
}

export async function saveBodyPhoto(date: string, dataURL: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('body_photos', 'readwrite');
    tx.objectStore('body_photos').put({ date, dataURL });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function loadAllBodyPhotos(): Promise<Record<string, string>> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx  = db.transaction('body_photos', 'readonly');
    const req = tx.objectStore('body_photos').getAll();
    req.onsuccess = () => {
      const map: Record<string, string> = {};
      for (const item of (req.result as PhotoRecord[])) map[item.date] = item.dataURL;
      resolve(map);
    };
    req.onerror = () => resolve({});
  });
}

export async function deleteBodyPhoto(date: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('body_photos', 'readwrite');
    tx.objectStore('body_photos').delete(date);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve();
  });
}

/** Xóa toàn bộ ảnh (avatar + body photos) — dùng khi xóa tài khoản (feat-account-lifecycle). */
export async function clearAllImages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(['avatar', 'body_photos'], 'readwrite');
    tx.objectStore('avatar').clear();
    tx.objectStore('body_photos').clear();
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve();
  });
}

export function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('File không phải ảnh.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale  = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressAvatar(file: File): Promise<string> {
  return compressImage(file, 400, 0.88);
}
