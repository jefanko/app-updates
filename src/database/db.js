// Local Database using File System (Electron) or localStorage (Browser fallback)
import { v4 as uuidv4 } from 'uuid';

// Database key for localStorage
const DB_KEY = 'ina-ai-chart-db';

// Database structure
const defaultData = {
    users: [
        {
            id: 'user-1',
            email: 'admin@local.app',
            password: 'admin123', // In production, this should be hashed!
            name: 'Administrator'
        }
    ],
    clients: [],
    projects: [],
    currentUser: null
};

// In-memory cache
let dbCache = null;

// Helper to check if running in Electron
const isElectron = () => window.electron && window.electron.db;

// Database helper functions
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        if (isElectron()) {
            // Electron: Read from file system
            const data = await window.electron.db.read();
            if (data) {
                dbCache = data;
                return data;
            }
        } else {
            // Browser: Read from localStorage
            const data = localStorage.getItem(DB_KEY);
            if (data) {
                dbCache = JSON.parse(data);
                return dbCache;
            }
        }
    } catch (error) {
        console.error('Error reading database:', error);
    }

    // Initialize with default data if empty
    dbCache = JSON.parse(JSON.stringify(defaultData));
    await writeDB(dbCache);
    return dbCache;
};

const writeDB = async (data) => {
    dbCache = data;
    try {
        if (isElectron()) {
            // Electron: Write to file system
            await window.electron.db.write(data);
        } else {
            // Browser: Write to localStorage
            localStorage.setItem(DB_KEY, JSON.stringify(data));
        }
    } catch (error) {
        console.error('Error writing database:', error);
    }
};

// Initialize database
readDB();

// Force refresh database (clear cache and reload)
export const refreshDatabase = async () => {
    console.log("Refreshing database from source...");
    dbCache = null;
    return await readDB();
};

// =====================================================================
// Database Operations (CRUD)
// =====================================================================

// Helper for Atomic Updates (Read-Modify-Write)
const atomicUpdate = async (updateFn) => {
    // 1. Force refresh to get latest data from file system
    // This ensures we have any changes made by other devices
    dbCache = null;
    const db = await readDB();

    // 2. Apply the update function
    const result = await updateFn(db);

    // 3. Write back to file system immediately
    await writeDB(db);

    return result;
};

// =====================================================================
// Database Operations (CRUD)
// =====================================================================

export const database = {
    // Get all items from a collection
    getAll: async (collection) => {
        // For reading, we can still use cache or refresh if needed
        // But to be safe with OneDrive, let's prefer fresh data if possible
        // or rely on the manual refresh button for pure reads.
        // For now, standard readDB is fine for listing.
        const db = await readDB();
        return db[collection] || [];
    },

    // Get item by ID
    getById: async (collection, id) => {
        const db = await readDB();
        const items = db[collection] || [];
        return items.find(item => item.id === id);
    },

    // Add new item
    add: async (collection, data) => {
        return await atomicUpdate((db) => {
            const newItem = {
                ...data,
                id: uuidv4(),
                createdAt: new Date().toISOString()
            };
            if (!db[collection]) db[collection] = [];
            db[collection].push(newItem);
            return newItem;
        });
    },

    // Update item
    update: async (collection, id, updates) => {
        return await atomicUpdate((db) => {
            const items = db[collection];
            const index = items.findIndex(item => item.id === id);
            if (index !== -1) {
                items[index] = { ...items[index], ...updates };
                return items[index];
            }
            return null;
        });
    },

    // Delete item
    delete: async (collection, id) => {
        return await atomicUpdate((db) => {
            const items = db[collection];
            const filteredItems = items.filter(item => item.id !== id);
            db[collection] = filteredItems;
            return true;
        });
    },

    // Direct access to db for complex operations
    getRaw: async () => await readDB()
};

// =====================================================================
// Authentication (Firebase Auth)
// =====================================================================

// Import Firebase authentication
import { auth, signOut, onAuthStateChanged } from '../firebase/auth';

// Re-export auth functions for compatibility
export { auth, signOut, onAuthStateChanged };

// =====================================================================
// Firestore-like API for easier migration
// =====================================================================

// These functions mimic Firestore's API to minimize changes in App.jsx

export const addDoc = async (collectionRef, data) => {
    const collectionName = collectionRef.name;
    return await database.add(collectionName, data);
};

export const updateDoc = async (docRef, updates) => {
    const { collection, id } = docRef;
    return await database.update(collection, id, updates);
};

export const deleteDoc = async (docRef) => {
    const { collection, id } = docRef;
    return await database.delete(collection, id);
};

export const doc = (collectionName, id) => {
    return { collection: collectionName, id };
};

export const collection = (name) => {
    return { name };
};

// Subscribe to collection changes (polling-based since we don't have real-time)
export const onSnapshot = (collectionRef, callback, errorCallback) => {
    const collectionName = collectionRef.name;

    // Initial data load
    database.getAll(collectionName).then(data => {
        callback({
            forEach: (fn) => data.forEach(item => fn({ data: () => item, id: item.id }))
        });
    }).catch(errorCallback);

    // Poll for changes every 500ms
    const intervalId = setInterval(async () => {
        try {
            const data = await database.getAll(collectionName);
            callback({
                forEach: (fn) => data.forEach(item => fn({ data: () => item, id: item.id }))
            });
        } catch (error) {
            if (errorCallback) errorCallback(error);
        }
    }, 500);

    // Return unsubscribe function
    return () => clearInterval(intervalId);
};

export const query = (collectionRef) => collectionRef;

// Mock serverTimestamp
export const serverTimestamp = () => new Date().toISOString();

// =====================================================================
// Year-Based Database Functions
// =====================================================================

// Get list of available years
export const getAvailableYears = async () => {
    if (isElectron()) {
        return await window.electron.db.getYears();
    }
    // Browser fallback - check localStorage keys
    const keys = Object.keys(localStorage).filter(k => k.startsWith('ina-ai-chart-'));
    const years = keys.map(k => parseInt(k.replace('ina-ai-chart-', '').replace('-db', '')));
    return years.length > 0 ? years : [new Date().getFullYear()];
};

// Read data for a specific year
export const readYearData = async (year) => {
    if (isElectron()) {
        return await window.electron.db.readYear(year);
    }
    // Browser fallback
    const key = `ina-ai-chart-${year}-db`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

// Write data for a specific year
export const writeYearData = async (year, data) => {
    if (isElectron()) {
        return await window.electron.db.writeYear(year, data);
    }
    // Browser fallback
    const key = `ina-ai-chart-${year}-db`;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
};

// Add a new year with imported JSON data
export const addNewYear = async (year, data) => {
    if (isElectron()) {
        return await window.electron.db.addYear(year, data);
    }
    // Browser fallback
    const key = `ina-ai-chart-${year}-db`;
    localStorage.setItem(key, JSON.stringify(data));
    // Update years list in localStorage
    const yearsKey = 'ina-ai-chart-years';
    let years = JSON.parse(localStorage.getItem(yearsKey) || '[]');
    if (!years.includes(year)) {
        years.push(year);
        years.sort((a, b) => b - a);
        localStorage.setItem(yearsKey, JSON.stringify(years));
    }
    return years;
};
