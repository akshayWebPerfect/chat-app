import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAk94oONX17IK0O_rssp73vTfUX8sMCg1E",
  authDomain: "chatapp-e3006.firebaseapp.com",
  projectId: "chatapp-e3006",
  storageBucket: "chatapp-e3006.firebasestorage.app",
  messagingSenderId: "326649683383",
  appId: "1:326649683383:web:5438bd9210c3fe096c5c32",
  measurementId: "G-257K8PGPR4"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);