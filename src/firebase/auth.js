// Firebase Configuration and Authentication
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_oyYQ6ROmfWwV00hx4hHeAx_LdUdbPU8",
    authDomain: "ai-gantt-chart-app.firebaseapp.com",
    projectId: "ai-gantt-chart-app",
    storageBucket: "ai-gantt-chart-app.firebasestorage.app",
    messagingSenderId: "289096435322",
    appId: "1:289096435322:web:b4a01b3a51108348721dc3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

// =====================================================================
// Firebase Authentication Wrapper
// =====================================================================

export const auth = {
    // Sign in with email and password
    signIn: async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return {
            email: userCredential.user.email,
            id: userCredential.user.uid,
            name: userCredential.user.displayName || userCredential.user.email.split('@')[0]
        };
    },

    // Sign out
    signOut: async () => {
        await firebaseSignOut(firebaseAuth);
    },

    // Get current user
    getCurrentUser: () => {
        const user = firebaseAuth.currentUser;
        if (!user) return null;
        return {
            email: user.email,
            id: user.uid,
            name: user.displayName || user.email.split('@')[0]
        };
    },

    // Subscribe to auth state changes
    onAuthStateChanged: (callback) => {
        return firebaseOnAuthStateChanged(firebaseAuth, (user) => {
            if (user) {
                callback({
                    email: user.email,
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0]
                });
            } else {
                callback(null);
            }
        });
    },

    // Force logout (called when app closes)
    forceLogout: async () => {
        try {
            await firebaseSignOut(firebaseAuth);
        } catch (error) {
            console.error('Force logout error:', error);
        }
    }
};

// Export for convenience
export const signOut = () => auth.signOut();
export const onAuthStateChanged = (callback) => auth.onAuthStateChanged(callback);

// Export Firebase auth instance for direct access if needed
export { firebaseAuth };
