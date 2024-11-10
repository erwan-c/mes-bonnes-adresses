import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; 
import { getFirestore } from 'firebase/firestore'; 

const firebaseConfig = {
  apiKey: "AIzaSyAAHQB3ILGKwsAdTw3irhGvWyIcIZPSiUg",
  authDomain: "mes-bonnes-adresses-9a65d.firebaseapp.com",
  projectId: "mes-bonnes-adresses-9a65d",
  storageBucket: "mes-bonnes-adresses-9a65d.appspot.com",
  messagingSenderId: "165142970621",
  appId: "1:165142970621:web:6bdc70fb9ad97ad63bbe94"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app); 
const db = getFirestore(app); 

const auth = getAuth(app);

export { auth,storage,db  };