/*
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import React, { useEffect } from 'react';

import { useFonts } from "expo-font";
import Header from "./components/Header";
import BottomNavBar from "./components/BottomNavBar";
import Home from "./screens/Home"; 

import Test from "./unauth_home";

export default function App() {
  return(<>
     <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        <Header />
        <Home />
        <BottomNavBar />
      </SafeAreaView>
    </>
  
    ); 
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});

*/

import { StyleSheet, View, Text } from "react-native";
import {Link} from "expo-router";
import Home from "./screens/Home"
import About from "./screens/About"

const Index = () => {
  return (
    <>
      <Home/>
      
    </>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }
})