import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { resizeImage } from '@/lib/imageUtils';
import { extractTextFromPDF } from '@/lib/pdfUtils';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Use environment variables (from Netlify, etc.) if available, otherwise fall back to user's config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId || "",
};

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId;
export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)' 
  ? getFirestore(app, firestoreDatabaseId) 
  : getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export const auth = getAuth(app);
export const storage = getStorage(app);

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

const sanitizePayload = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  return Object.entries(obj).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      acc[key] = typeof val === 'object' ? sanitizePayload(val) : val;
    }
    return acc;
  }, {});
};

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
    get: async (id) => {
      try {
        if (!auth.currentUser) return null;
        
        const snapshot = await getDoc(doc(db, collectionName, id));
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.userId === auth.currentUser.uid) {
            return { id: snapshot.id, ...data };
          }
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, 'get', `${collectionName}/${id}`);
      }
    },
    create: async (data) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const batch = writeBatch(db);
        const newDocRef = doc(collection(db, collectionName));
        const payload = sanitizePayload({ 
          ...data, 
          userId: auth.currentUser.uid, 
          // Use client timestamp to avoid waiting for server sync on offline or slow connections
          createdAt: new Date().toISOString()
        });
        batch.set(newDocRef, payload);
        await batch.commit();
        const result = { id: newDocRef.id, ...payload };
        return result;
      } catch (error) {
        handleFirestoreError(error, 'create', collectionName);
      }
    },
    bulkCreate: async (dataArray) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const batch = writeBatch(db);
        const results = [];
        const collRef = collection(db, collectionName);
        for (const data of dataArray) {
          const payload = sanitizePayload({ 
            ...data, 
            userId: auth.currentUser.uid, 
            createdAt: new Date().toISOString()
          });
          const docRef = doc(collRef);
          batch.set(docRef, payload);
          results.push({ id: docRef.id, ...payload });
        }
        await batch.commit();
        return results;
      } catch (error) {
        handleFirestoreError(error, 'bulkCreate', collectionName);
      }
    },
    update: async (id, data) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const batch = writeBatch(db);
        const docRef = doc(db, collectionName, id);
        const updatePayload = sanitizePayload({ ...data, updatedAt: new Date().toISOString() });
        batch.update(docRef, updatePayload);
        await batch.commit();
        const result = { id, ...data, updatedAt: updatePayload.updatedAt };
        return result;
      } catch (error) {
        handleFirestoreError(error, 'update', `${collectionName}/${id}`);
      }
    },
    delete: async (id) => {
      try {
        if (!auth.currentUser) throw new Error("Unauthorized");
        const batch = writeBatch(db);
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
        await batch.commit();
        return { success: true };
      } catch (error) {
        handleFirestoreError(error, 'delete', `${collectionName}/${id}`);
      }
    }
  };
};

const vehicleEntity = createFirebaseEntity('Vehicle', 'vehicles');
vehicleEntity.delete = async (id) => {
  try {
    console.log(`Starting cascading delete for vehicle ${id}`);
    if (!auth.currentUser) throw new Error("Unauthorized");
    
    const batch = writeBatch(db);
    
    // 1. Delete vehicle
    const vehicleRef = doc(db, 'vehicles', id);
    batch.delete(vehicleRef);
    console.log(`Queued vehicle deletion`);

    // 2. Delete maintenances
    const maintQ = query(
      collection(db, 'maintenances'), 
      where('userId', '==', auth.currentUser.uid)
    );
    const maintSnap = await getDocs(maintQ);
    const maintsToDelete = maintSnap.docs.filter(d => d.data().vehicle_id === id);
    maintsToDelete.forEach(d => batch.delete(d.ref));
    console.log(`Queued ${maintsToDelete.length} maintenances for deletion`);

    // 3. Delete maintenancePlans
    const planQ = query(
      collection(db, 'maintenancePlans'), 
      where('userId', '==', auth.currentUser.uid)
    );
    const planSnap = await getDocs(planQ);
    const plansToDelete = planSnap.docs.filter(d => d.data().vehicle_id === id);
    plansToDelete.forEach(d => batch.delete(d.ref));
    console.log(`Queued ${plansToDelete.length} plans for deletion`);

    await batch.commit();
    console.log(`Successfully committed cascading delete`);

    return { success: true };
  } catch (error) {
    console.error(`Cascading delete failed:`, error);
    handleFirestoreError(error, 'delete', `vehicles/${id} (cascading)`);
  }
};

export const base44 = {
  entities: {
    Vehicle: vehicleEntity,
    Maintenance: createFirebaseEntity('Maintenance', 'maintenances'),
    MaintenancePlan: createFirebaseEntity('MaintenancePlan', 'maintenancePlans'),
    Workshop: createFirebaseEntity('Workshop', 'workshops'),
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, add_context_from_internet, response_json_schema }) => {
         try {
           const response = await fetch('/api/invoke-llm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, add_context_from_internet, response_json_schema })
           });
           if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             console.error("InvokeLLM Error:", response.status, errorData);
             return { error: errorData.error || `HTTP Error ${response.status}` };
           }
           return response.json();
         } catch (error) {
           console.error("InvokeLLM fetch failed:", error);
           return { error: error.message || "Failed to connect to the server" };
         }
      },
      UploadFile: async ({ file }) => {
        if (!auth.currentUser) throw new Error("Unauthorized");
        
        let optimizedFile = file;
        
        if (file.type && file.type.match(/image.*/)) {
          // Optimize the image heavily to keep base64 string size small (~15-30KB)
          optimizedFile = await resizeImage(file, 500, 500, 0.4);
        } else {
          // If it's a PDF or something else, prevent massive files from crashing Firestore
          if (file.size > 500 * 1024) { // 500 KB limit for non-images
            throw new Error("Arquivo PDF ou documento muito grande. Para o plano gratuito, envie arquivos menores que 500KB.");
          }
        }
        
        // Convert to Base64
        const file_url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(optimizedFile);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
        
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2,9)}`;
        return { file_url, file_id: fileName };
      },
      ExtractDataFromUploadedFile: async ({ file_url, file, json_schema }) => {
         const payload = { json_schema };
         if (file) {
            if (file.type === 'application/pdf') {
               try {
                  console.log("Extracting text from PDF locally...");
                  const text = await extractTextFromPDF(file);
                  if (text && text.trim().length > 0) {
                     payload.text_content = text;
                     console.log(`Extracted ${text.length} characters from PDF.`);
                  } else {
                     throw new Error("No text extracted, falling back to backend PDF processing.");
                  }
               } catch (err) {
                  console.warn("Local PDF extraction failed:", err);
                  // Fall back to sending the file
                  payload.file_base64 = await toBase64Fallback(file);
                  payload.mime_type = file.type;
               }
            } else {
               payload.file_base64 = await toBase64Fallback(file);
               payload.mime_type = file.type.startsWith('image/') ? 'image/jpeg' : file.type;
            }
         } else {
            payload.file_url = file_url;
         }
         
         // Helper for base64 fallback
         async function toBase64Fallback(f) {
            return new Promise((resolve, reject) => {
               if (!f.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.readAsDataURL(f);
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = error => reject(error);
                  return;
               }
               
               const img = new Image();
               img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 1200;
                  const MAX_HEIGHT = 1200;
                  let width = img.width;
                  let height = img.height;
                  
                  if (width > height) {
                     if (width > MAX_WIDTH) {
                        height = Math.round(height * MAX_WIDTH / width);
                        width = MAX_WIDTH;
                     }
                  } else {
                     if (height > MAX_HEIGHT) {
                        width = Math.round(width * MAX_HEIGHT / height);
                        height = MAX_HEIGHT;
                     }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.7));
               };
               img.onerror = () => reject(new Error('Failed to load image for resizing'));
               img.src = URL.createObjectURL(f);
            });
         }
         
         const response = await fetch('/api/extract-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });
         return response.json();
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
        await setDoc(ref, data, { merge: true });
        return data;
      } catch (e) {
        console.warn("Could not sync user profile to Firestore (might be offline)", e);
        return data; // Optimistically return
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
