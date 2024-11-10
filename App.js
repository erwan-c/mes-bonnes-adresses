import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

import AuthScreen from "./pages/auth";
import HomeScreen from "./pages/home";
import AddAddressScreen from "./pages/addAdress";
import { auth } from "./firebase/firebaseConfig";
import UserLocationMap from "./pages/map";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CustomAddButton = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#1E90FF",
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      zIndex: 1,
    }}
  >
    <Ionicons name="add" size={30} color="#fff" />
  </TouchableOpacity>
);

function HomeTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          borderTopWidth: 0,
          backgroundColor: "#ffffff",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="AddAddressTab"
        component={AddAddressStack}
        options={{
          tabBarButton: (props) => <CustomAddButton {...props} />,
        }}
      />

      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Map"
        component={UserLocationMap}
        options={() => ({
          title: "Carte",
        })}
      />
    </Stack.Navigator>
  );
}

function AddAddressStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={({ navigation }) => ({
          title: "Ajouter une Adresse",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.navigate('HomeTab')}>
              <Ionicons name="arrow-back" size={24} color="black" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Home"
            component={HomeTabNavigator}
            options={{
              title: "Mes Bonnes Adresses",
              headerTitleStyle: styles.headerTitle,
              headerStyle: styles.headerStyle,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 24,            
    fontWeight: "bold",      
    color: "#1E90FF",        
    textAlign: "center",     
  },
  headerStyle: {
    backgroundColor: "#fff", 
    elevation: 4,            
    shadowColor: "#000",     
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
