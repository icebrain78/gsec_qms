
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 사용자가 제공한 Firebase 설정 정보 적용
const firebaseConfig = {
  apiKey: "AIzaSyBn3lJ_lEWjlYYne5lhINAVVj1epeHolSc",
  authDomain: "gsecqc2025.firebaseapp.com",
  projectId: "gsecqc2025",
  storageBucket: "gsecqc2025.firebasestorage.app",
  messagingSenderId: "483250355494",
  appId: "1:483250355494:web:27106a4ea4cbe247c295e7",
  measurementId: "G-V6MHNZ1YNR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);
