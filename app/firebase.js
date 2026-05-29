import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0cXS6TG0JrM_qQXuaWT13pFFLedW4m9w",
  authDomain: "food-tracker-71bd3.firebaseapp.com",
  projectId: "food-tracker-71bd3",
  storageBucket: "food-tracker-71bd3.firebasestorage.app",
  messagingSenderId: "749438675950",
  appId: "1:749438675950:web:7339e116266c338b07bcff"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
