import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  Animated,
} from "react-native";
import { auth,db } from "../firebase/firebaseConfig.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { doc, setDoc } from "firebase/firestore"; 

const AuthScreen = () => {
  const navigation = useNavigation();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Keyboard.dismiss();
    }
  }, [message]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      Animated.timing(keyboardHeight, {
        toValue: 200,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);



  const handleSignUp = async () => {
    Keyboard.dismiss(); 
  
    if (!username || !email || !password) {
      setMessage("Tous les champs sont obligatoires !");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await setDoc(doc(db, "users", user.uid), {
        username,  
      });
  
      setMessage("Inscription réussie!");
      navigation.navigate("Home");
    } catch (error) {
      setMessage(error.message);
    }
  };
  
  

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        setMessage("Connexion réussie!");
        navigation.navigate("Home");
      })
      .catch((error) => setMessage(error.message));
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setMessage("");
  };

  return (
    <Animated.View style={[styles.container, { marginBottom: keyboardHeight }]}>
      <Text style={styles.title}>Mes Bonnes Adresses</Text>

      {isSignUpMode && (
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Mot de passe"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
          <Text style={styles.eyeText}>{isPasswordVisible ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      </View>

      {isSignUpMode ? (
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={toggleMode}>
        <Text style={styles.toggleText}>
          {isSignUpMode ? "J'ai déjà un compte" : "Je n'ai pas de compte"}
        </Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  eyeButton: {
    paddingHorizontal: 10,
  },
  eyeText: {
    fontSize: 18,
    color: "#888",
  },
  signUpButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#28a745",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#28a745",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  toggleText: {
    color: "#007bff",
    fontSize: 16,
    marginTop: 10,
    textDecorationLine: 'underline'
  },
  message: {
    marginTop: 15,
    color: "#ff0000",
  },
});

export default AuthScreen;
