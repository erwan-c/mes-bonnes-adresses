import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Modal,
  StyleSheet,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, storage, db } from "../firebase/firebaseConfig";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import AddressList from "../components/adressList";
import { doc, getDoc } from "firebase/firestore";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        try {
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setUsername(userData.username);
          }

          const profilePicRef = ref(storage, `profile_pics/${currentUser.uid}`);

          try {
            const profileImageUrl = await getDownloadURL(profilePicRef);
            setProfileImage(profileImageUrl);
          } catch (error) {
            console.error("Erreur lors de la récupération de l'image :", error);
            setProfileImage(null);
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des données utilisateur :",
            error
          );
          setProfileImage(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Nous avons besoin d'accéder à votre galerie pour choisir une image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (user) {
      const reference = ref(storage, `profile_pics/${user.uid}`);
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(reference, blob);
      const url = await getDownloadURL(reference);
      setProfileImage(url);
      Alert.alert("Succès", "Votre photo de profil a été mise à jour !");
    }
  };

  const showActionSheet = () => {
    const options = [
      "Afficher l'image en plein écran",
      "Changer la photo de profil",
      "Se déconnecter",
      "Annuler",
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          setModalVisible(true);
        } else if (buttonIndex === 1) {
          handleImagePick();
        } else if (buttonIndex === 2) {
          handleLogout();
        }
      }
    );
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Se déconnecter",
        onPress: () => {
          auth.signOut().then(() => {
            navigation.navigate("Auth");
          });
        },
      },
    ]);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Bienvenue, {username}</Text>
        <TouchableOpacity onPress={showActionSheet} style={{ marginLeft: 10 }}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../assets/defaultProfil.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../assets/defaultProfil.png")
            }
            style={styles.fullImage}
          />
          <Button title="Fermer" onPress={closeModal} />
        </View>
      </Modal>

      <AddressList />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  fullImage: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
    borderRadius: 10,
  },
});

export default HomeScreen;
