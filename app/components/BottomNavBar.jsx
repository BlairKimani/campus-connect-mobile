// BottomNavbar.jsx - With Expo Router
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const BottomNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠', href: '/' },
    { key: 'qa', label: 'Q&A', icon: '❓', href: '/screens/Qa' },
    { key: 'notes', label: 'Notes', icon: '📄', href: '/screens/Notes' },
    { key: 'market', label: 'Market', icon: '🛒', href: '/screens/Market' },
    { key: 'groups', label: 'Groups', icon: '👥', href: '/screens/Groups' },
  ];

  // Get current active tab based on pathname
  const getActiveTab = () => {
    const tab = tabs.find(tab => tab.href === pathname);
    return tab ? tab.key : 'home';
  };

  const activeTab = getActiveTab();

  const handlePress = (href) => {
    router.push(href);
    console.log(`Navigated to: ${href}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => handlePress(tab.href)}
              activeOpacity={0.7}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

// ... styles remain the same


const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DCE3EA',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    ...Platform.select({
      web: {
        maxWidth: 600,
        marginHorizontal: 'auto',
        width: '100%',
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  label: {
    fontSize: 10,
    color: '#6C7A89',
    fontWeight: '500',
  },
  labelActive: {
    color: '#1E90FF',
    fontWeight: '700',
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E90FF',
    marginTop: 2,
  },
});

export default BottomNavbar;