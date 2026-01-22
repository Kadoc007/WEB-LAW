// Firebase Configuration for Web (Client-side)
// Project: webproject-80d99

const firebaseConfig = {
    apiKey: "AIzaSyCSz8qlE4KNd9AQAn-WyCLPCFLUfcoNw2M",
    authDomain: "webproject-80d99.firebaseapp.com",
    projectId: "webproject-80d99",
    storageBucket: "webproject-80d99.appspot.com",
    messagingSenderId: "101822831272",
    appId: "webproject-80d99"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Export for use in other scripts (global variables)
window.db = db;
window.auth = auth;
