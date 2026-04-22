import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnz1IsDNZIhHn3PMqq4GpiqAkVBtcIyzg",
  authDomain: "gymflow-83d53.firebaseapp.com",
  projectId: "gymflow-83d53",
  storageBucket: "gymflow-83d53.firebasestorage.app",
  messagingSenderId: "606905628730",
  appId: "1:606905628730:web:cfa4e2a806ca7f910f5d03",
  measurementId: "G-4GFKB65L3P"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const db = getFirestore(app);

export { db, analytics };
