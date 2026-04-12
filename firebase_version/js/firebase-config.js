// ⌘ GymFlow Firebase Configuration
// REPLACE these placeholders with your real keys from the Firebase Console:
// 1. Go to console.firebase.google.com
// 2. Create a project and add a "Web App"
// 3. Paste the config object here

const firebaseConfig = {
    apiKey: "AIzaSyDn6nyTgVyM9IL2apEsGd2VRfMSWZCliSg",
    authDomain: "gymflow-83d53.firebaseapp.com",
    projectId: "gymflow-83d53",
    storageBucket: "gymflow-83d53.firebasestorage.app",
    messagingSenderId: "606905628730",
    appId: "1:606905628730:android:1fb1e527fc1263160f5d03" 
};

// Initialize Firebase SDKs (using UMD for simple shared hosting/TWA usage)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

console.log("GymFlow Firebase Engine: INITIALIZED 🚀");
