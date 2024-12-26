// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, getDoc, updateDoc, DocumentReference, collection, CollectionReference } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOMeZb5fdX4sWZFfa-qPhNFyTzxMZHc9U",
  authDomain: "kanshasai-32b7b.firebaseapp.com",
  projectId: "kanshasai-32b7b",
  storageBucket: "kanshasai-32b7b.firebasestorage.app",
  messagingSenderId: "289175026532",
  appId: "1:289175026532:web:c964064370bcfa1d895871"
};

// Initialize Firebase
const fb = initializeApp(firebaseConfig);

const myApp = (fb: FirebaseApp) => {
    const db = getFirestore(fb);

    return {
        docRefOf: (path: string, ...pathSegments: string[]): DocumentReference => {
            return doc(db, path, ...pathSegments);
        },
        collectionRefOf: (path: string, ...pathSegments: string[]): CollectionReference => {
            return collection(db, path, ...pathSegments);
        },
        getCurrentValue: async (docRef: DocumentReference) => {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.log("No such document!");
                return null;
            }
        },
        listenToUpdate: (docRef: DocumentReference, callback: (data: any) => void) => {
            onSnapshot(docRef, (doc) => {
                console.log("Current data: ", doc.data());
                callback(doc.data());
            });
        },
        updateValue: (docRef: DocumentReference, newValue: string) => {
            updateDoc(docRef, { message: newValue, time: new Date().toISOString() });
        }
    }

}

export default myApp(fb);