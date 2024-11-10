import { db, storage, auth } from "../firebase/firebaseConfig";
import {
  getDocs,
  collection,
  query,
  where,
  addDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const createAddress = async (name, description, isPublic, imageUri) => {
  if (!name || !description) {
    throw new Error("Le nom et la description sont obligatoires.");
  }
  const addressData = {
    name,
    description,
    isPublic,
    userId: auth.currentUser?.uid,
    createdAt: new Date(),
  };

  if (imageUri) {
    const imageRef = ref(
      storage,
      `addresses/${auth.currentUser?.uid}/${Date.now()}`
    );
    const response = await fetch(imageUri);
    const blob = await response.blob();
    await uploadBytes(imageRef, blob);
    addressData.imageUrl = await getDownloadURL(imageRef);
  }

  try {
    const docRef = await addDoc(collection(db, "adresses"), addressData);
    return docRef.id;
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout de l'adresse: ${error.message}`);
  }
};

export const getUserAddresses = async () => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("Utilisateur non authentifié");
    }
    const q = query(
      collection(db, "adresses"),
      where("userId", "==", auth.currentUser?.uid)
    );

    const querySnapshot = await getDocs(q);

    const userAddresses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return userAddresses;
  } catch (error) {
    throw new Error(
      `Erreur lors de la récupération des adresses de l'utilisateur: ${error.message}`
    );
  }
};

export const getPublicAddresses = async () => {
  try {
    const q = query(collection(db, "adresses"), where("isPublic", "==", true));
    const querySnapshot = await getDocs(q);

    const publicAddresses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return publicAddresses;
  } catch (error) {
    throw new Error(
      `Erreur lors de la récupération des adresses publiques: ${error.message}`
    );
  }
};
export const deleteAddress = async (addressId) => {
  try {
    const addressDoc = doc(db, "adresses", addressId);
    await deleteDoc(addressDoc);
    return true;
  } catch (error) {
    throw new Error(
      `Erreur lors de la suppression de l'adresse: ${error.message}`
    );
  }
};
export const getAddressComments = async (addressId) => {
  const commentsRef = collection(db, "adresses", addressId, "comments");
  const commentsSnapshot = await getDocs(commentsRef);
  return commentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addAddressComment = async (addressId, comment) => {
  try {
    const commentsRef = collection(db, "adresses", addressId, "comments");
    const docRef = await addDoc(commentsRef, {
      ...comment,
      createdAt: new Date(),
    });

    console.log("Commentaire ajouté avec ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire: ", error);
    throw new Error("Erreur lors de l'ajout du commentaire");
  }
};
