import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  Modal
} from "react-native";
import {
  getPublicAddresses,
  getUserAddresses,
  deleteAddress,
  getAddressComments,
  addAddressComment,
} from "../services/addressService";
import { auth, db, storage } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

const AddressList = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserAddresses, setShowUserAddresses] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentImage, setCommentImage] = useState(null);
  const [comments, setComments] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const defaultImage = require("../assets/defaultAdresse.png");
  const [username, setUsername] = useState("");

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl); 
  };

  const closeImageModal = () => {
    setSelectedImage(null); 
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setUsername(userData.username);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur :", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [showUserAddresses]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = showUserAddresses
        ? await getUserAddresses(auth.currentUser?.uid)
        : await getPublicAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des adresses :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId);
      setAddresses((prev) =>
        prev.filter((address) => address.id !== addressId)
      );
      Alert.alert("Adresse supprimée", "L'adresse a été supprimée avec succès.");
    } catch (error) {
      Alert.alert("Erreur", `Erreur lors de la suppression de l'adresse: ${error.message}`);
    }
  };

  const confirmDelete = (addressId) => {
    Alert.alert(
      "Confirmation de la suppression",
      "Êtes-vous sûr de vouloir supprimer cette adresse ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          onPress: () => handleDeleteAddress(addressId),
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setCommentImage(result.assets[0].uri);
    }
  };

  const handleAddComment = async (addressId) => {
    if (!newComment && !commentImage) return;

    let imageUrl = null;
    if (commentImage) {
      try {
        const imageRef = ref(storage, `comments/${addressId}_${Date.now()}`);
        const response = await fetch(commentImage);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
        setCommentImage(null);
      } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
      }
    }

    try {
      await addAddressComment(addressId, {
        text: newComment,
        username: username,
        imageUrl: imageUrl,
      });
      setNewComment("");
      fetchComments(addressId);
    } catch (error) {
      Alert.alert("Erreur", `Erreur lors de l'ajout du commentaire: ${error.message}`);
    }
  };

  const fetchComments = async (addressId) => {
    const addressComments = await getAddressComments(addressId);
    addressComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setComments((prev) => ({ ...prev, [addressId]: addressComments }));
  };

  const toggleCommentInput = (addressId) => {
    setShowCommentInput((prev) => ({
      ...prev,
      [addressId]: !prev[addressId],
    }));
    if (!showCommentInput[addressId]) fetchComments(addressId);
  };

  const renderCommentItem = (comment) => {
    return (
      <View key={comment.id} style={styles.commentContainer}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUsername}>{comment.username}</Text>:{' '}
          {comment.text}
        </Text>
        {comment.imageUrl && (
          <TouchableOpacity onPress={() => handleImagePress(comment.imageUrl)}>
            <Image source={{ uri: comment.imageUrl }} style={styles.commentImage} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAddressItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.imageUrl ? { uri: item.imageUrl } : defaultImage} style={styles.cardImage} />
      {item.userId === auth.currentUser?.uid && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
          <Ionicons name="remove-circle-outline" size={24} color="red" />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.isPublic}>{item.isPublic ? "Public" : "Privé"}</Text>

      <TouchableOpacity onPress={() => toggleCommentInput(item.id)} style={{ alignItems: "center" }}>
        <Ionicons name="chatbubble-outline" color="#007bff" size={24} />
      </TouchableOpacity>

      {showCommentInput[item.id] && (
        <>
          <FlatList
            data={comments[item.id] || []}
            renderItem={({ item }) => renderCommentItem(item)}
            keyExtractor={(comment) => comment.id}
          />
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
              <Ionicons name="image-outline" size={30} />
            </TouchableOpacity>
          </View>
          {commentImage && (
            <Image source={{ uri: commentImage }} style={styles.commentPreviewImage} />
          )}
          <TouchableOpacity style={styles.commentButton} onPress={() => handleAddComment(item.id)}>
            <Text style={styles.commentButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>
          {showUserAddresses ? "Mes Adresses" : "Adresses Publiques"}
        </Text>
        <Switch
          value={showUserAddresses}
          onValueChange={(value) => setShowUserAddresses(value)}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modal pour afficher l'image en plein écran */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={closeImageModal}
      >
        <TouchableOpacity style={styles.modalContainer} onPress={closeImageModal}>
          <Image source={{ uri: selectedImage }} style={styles.modalImage} />
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  commentPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 5,
    marginLeft: 10,
  },
  commentInputContainer: {
    flexDirection: "row",
    marginTop: 5,
    marginBottom: 5,
  },
  container: {
    backgroundColor: "#f0f0f0",
    paddingTop: 10,
    paddingHorizontal: 20,
    marginBottom: 260,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#e3e3e3",
    borderRadius: 8,
  },
  switchText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 5,
    resizeMode: "contain",
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: "#7f8c8d",
    lineHeight: 22,
    marginBottom: 10,
  },
  isPublic: {
    fontSize: 14,
    color: "#3498db",
    fontStyle: "italic",
    textAlign: "right",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    width: 280,
    marginRight: 5,
  },
  commentButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    marginTop: 5,
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  commentContainer: {
    flexDirection: 'row', 
    marginTop: 5,
    marginBottom: 5,
    alignItems: 'center',
  },
  commentImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 10, 
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
  },
  commentUsername: {
    fontWeight: "bold",
    color: "#007bff",
  },
  commentToggleButton: {
    backgroundColor: "#2980b9",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  commentToggleButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
});

export default AddressList;
