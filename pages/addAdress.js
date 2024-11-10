import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  Switch,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createAddress } from "../services/addressService";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const AddAddressScreen = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const navigation = useNavigation();

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    try {
      await createAddress(name, description, isPublic, imageUri);
      Alert.alert("Succès", "Adresse ajoutée avec succès !");
      setName("");
      setDescription("");
      setIsPublic(false);
      setImageUri(null);
      navigation.navigate("HomeTab");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={130}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Nom de l'adresse</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Entrez le nom ici"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.input}
          placeholder="Entrez la description ici"
        />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Rendre publique</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>
        <View style={styles.photoContainer}>
          <TouchableOpacity
            onPress={handleImagePick}
            style={styles.imagePicker}
          >
            <Text style={styles.imagePickerText}>Sélectionner une photo</Text>
            <Ionicons name="image-outline" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}
        <TouchableOpacity onPress={handleSubmit} style={styles.customButton}>
          <Text style={styles.customButtonText}>Ajouter l'adresse</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  customButton: {
    alignItems: "center",
    margin: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  customButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    padding: 10,
    marginTop: 5,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  switchLabel: {
    marginRight: 10,
    fontSize: 16,
    color: "#333",
  },
  photoContainer: {
    justifyContent: "center",
    alignItems: "center",
    margin:20
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagePickerText: {
    marginRight: 8,
    color: "#007bff",
    fontSize: 16,
    textAlign: "center",
    fontSize: 16,
  },

  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default AddAddressScreen;
