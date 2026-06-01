import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Use environment variables (from Netlify, etc.) if available, otherwise fall back to user's config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCaTgSYRk3si8dozZe2kZNpoUqKEBpmHXo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "enjoycar-17ade.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "enjoycar-17ade",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "enjoycar-17ade.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "361779467613",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:361779467613:web:357bda95875b532ce2c4b4",
  measurementId: "G-1NMKV0H228",
};

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)' 
  ? getFirestore(app, firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);

const handleFirestoreError = (error, operationType, path) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const createFirebaseEntity = (entityName, collectionName) => {
  return {
    list: async (sortStr) => {
      try {
        if (!auth.currentUser) return [];
        let q = collection(db, collectionName);
        q = query(q, where('userId', '==', auth.currentUser.uid));
        
        if (sortStr) {
          const isDesc = sortStr.startsWith('-');
          let field = isDesc ? sortStr.substring(1) : sortStr;
          if (field === 'created_date') field = 'createdAt';
          q = query(q, orderBy(field, isDesc ? 'desc' : 'asc'));
        }
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        handleFirestoreError(error, 'list', collectionName);
      }
    },
    filter: async (queryObj, sortStr) => {
      try {
        if (!auth.currentUser) return [];
        let q = collection(db, collectionName);
        const constraints = [where('userId', '==', auth.currentUser.uid)];
        
        for (const key in queryObj) {
           constraints.push(where(key, "==", queryObj[key]));
        }
        if (sortStr) {
          const isDesc = sortStr.startsWith('-');
          let field = isDesc ? sortStr.substring(1) : sortStr;
          if (field === 'created_date') field = 'createdAt';
          constraints.push(orderBy(field, isDesc ? 'desc' : 'asc'));
        }
        
        if (constraints.length > 0) q = query(q, ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        handleFirestoreError(error, 'list', collectionName);
      }
    },
    create: async (data) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const payload = { 
          ...data, 
          userId: auth.currentUser.uid, 
          createdAt: serverTimestamp() 
        };
        const docRef = await addDoc(collection(db, collectionName), payload);
        return { id: docRef.id, ...payload };
      } catch (error) {
        handleFirestoreError(error, 'create', collectionName);
      }
    },
    bulkCreate: async (dataArray) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const results = [];
        for (const data of dataArray) {
          const payload = { 
            ...data, 
            userId: auth.currentUser.uid, 
            createdAt: serverTimestamp() 
          };
          const docRef = await addDoc(collection(db, collectionName), payload);
          results.push({ id: docRef.id, ...payload });
        }
        return results;
      } catch (error) {
        handleFirestoreError(error, 'create', collectionName);
      }
    },
    update: async (id, data) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const docRef = doc(db, collectionName, id);
        const updatePayload = { ...data, updatedAt: serverTimestamp() };
        await updateDoc(docRef, updatePayload);
        const updated = await getDoc(docRef);
        return { id: updated.id, ...updated.data() };
      } catch (error) {
        handleFirestoreError(error, 'update', `${collectionName}/${id}`);
      }
    },
    delete: async (id) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        return { success: true };
      } catch (error) {
        handleFirestoreError(error, 'delete', `${collectionName}/${id}`);
      }
    }
  };
};

export const base44 = {
  entities: {
    Vehicle: createFirebaseEntity('Vehicle', 'vehicles'),
    Maintenance: createFirebaseEntity('Maintenance', 'maintenances'),
    MaintenancePlan: createFirebaseEntity('MaintenancePlan', 'maintenancePlans'),
    Workshop: createFirebaseEntity('Workshop', 'workshops'),
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
         await sleep(500);
         return { response: "Mock LLM Response. This app is running with a local mocked Base44 SDK." };
      },
      UploadFile: async ({ file }) => {
         await sleep(500);
         return { file_url: "https://placehold.co/150", file_id: generateId() };
      },
      ExtractDataFromUploadedFile: async ({ file_id, schema }) => {
         await sleep(500);
         return "Mock extracted data from file";
      },
      SendEmail: async () => {
         await sleep(200);
         return { success: true };
      }
    }
  },
  auth: {
    me: async () => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      try {
        const id = auth.currentUser.uid;
        const result = await getDoc(doc(db, 'users', id));
        const customData = result.exists() ? result.data() : { tour_completed: false };
        return {
          id,
          name: auth.currentUser.displayName,
          email: auth.currentUser.email,
          ...customData
        };
      } catch (e) {
        console.warn("Could not fetch user profile from Firestore, using default:", e);
        return {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName,
          email: auth.currentUser.email,
          tour_completed: false
        };
      }
    },
    updateMe: async (data) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      try {
        const id = auth.currentUser.uid;
        const ref = doc(db, 'users', id);
        const current = await getDoc(ref);
        if (current.exists()) {
          await updateDoc(ref, data);
        } else {
          await setDoc(ref, data);
        }
        return data;
      } catch (e) {
        handleFirestoreError(e, 'update', 'users');
      }
    },
    logout: async (url) => { 
      await signOut(auth);
      window.location.href = url || '/'; 
    },
    redirectToLogin: async (url) => { 
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        try {
          const ref = doc(db, 'users', user.uid);
          const existing = await getDoc(ref);
          if (!existing.exists()) {
            await setDoc(ref, { 
              tour_completed: false, 
              notifications_enabled: true 
            });
          }
        } catch (dbErr) {
          console.warn("Could not setup user profile in Firestore:", dbErr);
        }
        // Do not force reload, just change the URL path if necessary or let the SPA router handle it.
        if (url) {
          // If url is a full origin URL, strip it to path for History API, else use as is
          const path = url.startsWith(window.location.origin) ? url.replace(window.location.origin, '') : url;
          window.history.pushState({}, '', path);
          // Dispatch a popstate event to let React Router know the URL changed
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch (err) {
        console.error("Login failed", err);
        alert("Erro no login: " + err.message);
      }
    }
  },
  appLogs: {
    logUserInApp: async () => {}
  }
};
