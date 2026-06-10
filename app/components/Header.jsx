// Header.jsx - With Authentication Integration
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useAuth } from '../services/Context';
import {data} from '../../config';

const BASE_URL = data.BASE_URL;

/**
 * AppHeader Component - Campus Connect
 * 
 * A reusable header that works on both mobile (iOS/Android) and web.
 * Automatically switches between Login button and User Avatar based on auth state.
 * Includes a search bar that expands on focus.
 * 
 * @param {Function} onLoginPress - Callback when login button is pressed
 * @param {Function} onLogoPress - Callback when logo is pressed
 * @param {Function} onSearch - Callback when search is submitted
 * @param {Function} onSearchFocus - Callback when search bar is focused
 * @param {string} title - Optional custom title (defaults to "Campus Connect")
 * @param {boolean} showLogin - Show login button when not authenticated (default: true)
 * @param {boolean} showAvatar - Show avatar when authenticated (default: true)
 * @param {boolean} showSearch - Show search bar (default: true)
 * @param {string} searchPlaceholder - Search placeholder text
 */

const AppHeader = ({
  onLoginPress,
  onLogoPress,
  onSearch,
  onSearchFocus,
  title = "Campus Connect",
  showLogin = true,
  showAvatar = true,
  showSearch = true,
  searchPlaceholder = "Search questions, notes, groups...",
}) => {
  const [pressed, setPressed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  
  // Get authentication state from Auth Context
  const { isUserAuthenticated, getUser, getUserAvatar, getUserInitials, getDisplayName, logout } = useAuth();
  
  const isAuthenticated = isUserAuthenticated();
  const user = getUser();
  const avatarUrl = getUserAvatar();
  const userInitials = getUserInitials();
  const displayName = getDisplayName();

  /**
   * handleLogoPress - Handles logo/title press
   * SHOULD DO: Navigate to Home Screen or reset to main feed
   */
  const handleLogoPress = () => {
    if (onLogoPress) {
      onLogoPress();
    }
  };

  /**
   * handleLoginPress - Handles login button press
   * SHOULD DO: Navigate to Login Screen or open login modal
   */
  const handleLoginPress = () => {
    if (onLoginPress) {
      onLoginPress();
    }
  };

  /**
   * handleAvatarPress - Handles user avatar/profile press
   * SHOULD DO: Show dropdown menu with profile and logout options
   */
  const handleAvatarPress = () => {
    setDropdownVisible(true);
  };

  /**
   * handleCloseDropdown - Closes the dropdown menu
   */
  const handleCloseDropdown = () => {
    setDropdownVisible(false);
  };

  /**
   * handleProfilePress - Handles profile menu item press
   */
  const handleProfilePress = () => {
    setDropdownVisible(false);
    // TODO: Navigate to profile screen when implemented
    console.log('Navigate to Profile Screen');
  };

  /**
   * handleLogoutPress - Handles logout menu item press
   */
  const handleLogoutPress = async () => {
    setDropdownVisible(false);
    const result = await logout();
    if (result.success) {
      console.log('Logged out successfully');
      // Optionally navigate to login screen or refresh
    }
  };

  /**
   * handleSearchSubmit - Handles search form submission
   */
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      }
    }
  };

  /**
   * handleSearchFocus - Handles search bar focus event
   */
  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (onSearchFocus) {
      onSearchFocus();
    }
  };

  /**
   * handleSearchBlur - Handles search bar blur/unfocus event
   */
  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  /**
   * handleClearSearch - Clears the search input field
   */
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Render logo section
  const renderLogo = () => (
    <TouchableOpacity
      style={styles.logoContainer}
      onPress={handleLogoPress}
      activeOpacity={0.7}
      accessibilityLabel="Campus Connect Home"
      accessibilityRole="button"
    >
      <View style={styles.logoIcon}>
        <Text style={styles.logoIconText}>CC</Text>
      </View>
      {!searchFocused && (
        <View>
          <Text style={styles.logoText}>{title}</Text>
          <Text style={styles.logoSubtext}>Academic Platform</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render search bar
  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <View style={[
        styles.searchWrapper,
        searchFocused && styles.searchWrapperFocused
      ]}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="#9AA6B5"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render login button
  const renderLoginButton = () => {
    if (!showLogin) return null;
    
    return (
      <TouchableOpacity
        style={[styles.loginButton, pressed && styles.loginButtonPressed]}
        onPress={handleLoginPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        activeOpacity={1}
        accessibilityLabel="Login"
        accessibilityRole="button"
      >
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
    );
  };

  // Render user avatar with dropdown menu
  const renderAvatar = () => {
    if (!showAvatar) return null;

    return (
      <>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
          activeOpacity={0.7}
          accessibilityLabel="Profile"
          accessibilityRole="button"
        >
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarInitials}>
              <Text style={styles.avatarInitialsText}>
                {userInitials}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Dropdown Menu Modal */}
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseDropdown}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseDropdown}>
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownArrow} />
              <View style={styles.dropdownMenu}>
                {/* User Info Section */}
                <View style={styles.dropdownUserInfo}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.dropdownAvatar} />
                  ) : (
                    <View style={styles.dropdownAvatarInitials}>
                      <Text style={styles.dropdownAvatarText}>{userInitials}</Text>
                    </View>
                  )}
                  <View style={styles.dropdownUserText}>
                    <Text style={styles.dropdownUserName}>{displayName}</Text>
                    <Text style={styles.dropdownUserEmail}>{user?.email || ''}</Text>
                  </View>
                </View>
                
                <View style={styles.dropdownDivider} />
                
                {/* Profile Option */}
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={handleProfilePress}
                >
                  <Text style={styles.dropdownItemIcon}>👤</Text>
                  <Text style={styles.dropdownItemText}>Profile</Text>
                </TouchableOpacity>
                
                {/* Logout Option */}
                <TouchableOpacity 
                  style={[styles.dropdownItem, styles.dropdownItemLogout]}
                  onPress={handleLogoutPress}
                >
                  <Text style={styles.dropdownItemIcon}>🚪</Text>
                  <Text style={[styles.dropdownItemText, styles.dropdownItemTextLogout]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        {renderLogo()}
        {renderSearchBar()}
        {isAuthenticated ? renderAvatar() : renderLoginButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3EA',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 12px rgba(13,27,42,0.08)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    gap: 12,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
        width: '100%',
        paddingTop: 12,
      },
    }),
  },
  // Logo styles
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 4px rgba(13,27,42,0.1)',
      },
    }),
  },
  logoIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logoText: {
    fontFamily: Platform.OS === 'web' ? "'Poppins', sans-serif" : 'System',
    fontWeight: '700',
    fontSize: 15,
    color: '#0D1B2A',
    lineHeight: 18,
  },
  logoSubtext: {
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'System',
    fontSize: 10,
    color: '#6C7A89',
    lineHeight: 12,
  },
  // Search bar styles
  searchWrapper: {
    flex: 1,
    maxWidth: 500,
  },
  searchWrapperFocused: {
    flex: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1.5,
    borderColor: '#DCE3EA',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
    color: '#6C7A89',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B263B',
    padding: 0,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: '#9AA6B5',
    fontWeight: '600',
  },
  // Login button styles
  loginButton: {
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(13,27,42,0.25)',
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  loginButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Avatar styles
  avatarContainer: {
    marginLeft: 8,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  avatarInitials: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Dropdown Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 16,
    alignItems: 'flex-end',
  },
  dropdownArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    marginRight: 12,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 260,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 20px rgba(13,27,42,0.15)',
      },
    }),
  },
  dropdownUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dropdownAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  dropdownAvatarInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  dropdownAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownUserText: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 2,
  },
  dropdownUserEmail: {
    fontSize: 12,
    color: '#6C7A89',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#DCE3EA',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  dropdownItemLogout: {
    borderTopWidth: 1,
    borderTopColor: '#DCE3EA',
  },
  dropdownItemIcon: {
    fontSize: 18,
    width: 24,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1B263B',
  },
  dropdownItemTextLogout: {
    color: '#E74C3C',
  },
});

export default AppHeader;