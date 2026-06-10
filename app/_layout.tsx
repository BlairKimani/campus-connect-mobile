import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Slot, useRouter } from 'expo-router'
import Header from "./components/Header"
import BottomNavBar from "./components/BottomNavBar"
import { AuthProvider } from './services/Context';


const RootLayout = () => {
  const router = useRouter()



  // Parent provides the actual navigation logic
  const handleLogoPress = () => {
    // ✅ This is where navigation should happen
    router.push('/')
    
  };

  const handleLoginPress = () => {
    // ✅ This is where login navigation should happen

    router.push('/screens/Login')
  };

  const handleSearch = (query) => {
    // ✅ This is where search logic should happen
    console.log('Searching for:', query);
    // fetch search results, update state, etc.
  };
  return (
    <AuthProvider>
      <View style={styles.container}>
        <Header
        onLogoPress={handleLogoPress}
        onLoginPress={handleLoginPress}
        onSearch={handleSearch}
        />

        <Slot />

        <BottomNavBar/>
        

      </View>
    </AuthProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({
  container:{
    flex: 1,
    justifyContent:"flex-end",
  }
})