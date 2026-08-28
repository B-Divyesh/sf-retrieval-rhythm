import type { Card, Collection, Review } from './types';

const DB_NAME = 'retrieval-rhythm';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('collections')) database.createObjectStore('collections', { keyPath: 'id' });
      if (!database.objectStoreNames.contains('cards')) {
        const cards = database.createObjectStore('cards', { keyPath: 'id' });
        cards.createIndex('collectionId', 'collectionId');
      }
      if (!database.objectStoreNames.contains('reviews')) {
        const reviews = database.createObjectStore('reviews', { keyPath: 'id' });
        reviews.createIndex('collectionId', 'collectionId');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed.'));
  });
}

async function store(mode: IDBTransactionMode, name: string): Promise<IDBObjectStore> {
  const database = await openDatabase();
  return database.transaction(name, mode).objectStore(name);
}

export async function getAll<T>(name: 'collections' | 'cards' | 'reviews'): Promise<T[]> {
  return requestResult((await store('readonly', name)).getAll()) as Promise<T[]>;
}

export async function put<T>(name: 'collections' | 'cards' | 'reviews', value: T): Promise<void> {
  await requestResult((await store('readwrite', name)).put(value));
}

export async function remove(name: 'collections' | 'cards' | 'reviews', key: string): Promise<void> {
  await requestResult((await store('readwrite', name)).delete(key));
}

export async function ensureCollection(): Promise<Collection> {
  const collections = await getAll<Collection>('collections');
  if (collections[0]) return collections[0];
  const collection = { id: crypto.randomUUID(), name: 'My collection', createdAt: Date.now() };
  await put('collections', collection);
  return collection;
}

export async function replaceAll(payload: { collections: Collection[]; cards: Card[]; reviews?: Review[] }): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(['collections', 'cards', 'reviews'], 'readwrite');
    transaction.onerror = () => reject(transaction.error ?? new Error('Import failed.'));
    transaction.oncomplete = () => resolve();
    for (const name of ['collections', 'cards', 'reviews'] as const) transaction.objectStore(name).clear();
    payload.collections.forEach((value) => transaction.objectStore('collections').put(value));
    payload.cards.forEach((value) => transaction.objectStore('cards').put(value));
    (payload.reviews ?? []).forEach((value) => transaction.objectStore('reviews').put(value));
  });
}

export async function clearDatabase(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(['collections', 'cards', 'reviews'], 'readwrite');
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear local data.'));
    transaction.oncomplete = () => resolve();
    for (const name of ['collections', 'cards', 'reviews'] as const) transaction.objectStore(name).clear();
  });
}
