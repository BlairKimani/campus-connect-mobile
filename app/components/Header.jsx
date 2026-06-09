// Header.jsx - With Search Feature
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
// Removed incorrect Link import - Link from expo-router should not be used inside Text

/**
 * AppHeader Component - Campus Connect
 * 
 * A reusable header that works on both mobile (iOS/Android) and web.
 * Automatically switches between Login button and User Avatar based on auth state.
 * Includes a search bar that expands on focus.
 * 
 * @param {Object} user - Current authenticated user (null if not logged in)
 * @param {string} user.name - User's full name (for initials)
 * @param {string} user.avatarUrl - Optional profile image URL
 * @param {Function} onLoginPress - Callback when login button is pressed
 * @param {Function} onAvatarPress - Callback when avatar is pressed
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
  user = null,
  onLoginPress,
  onAvatarPress,
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
  const isAuthenticated = !!user;

  // Get user initials from name
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const nameParts = user.name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  /**
   * handleLogoPress - Handles logo/title press
   * SHOULD DO: Navigate to Home Screen or reset to main feed
   * SHOULD NOT DO: Perform any side effects like API calls, state mutations, or navigation directly
   * PARENT SHOULD: Provide onLogoPress prop with navigation logic
   */
  const handleLogoPress = () => {
    // ✅ This only calls the callback provided by parent
    // ✅ Parent component should handle navigation (e.g., navigation.navigate('Home'))
    // ❌ Does NOT navigate directly
    // ❌ Does NOT make API calls
    // ❌ Does NOT modify state
    if (onLogoPress) {
      onLogoPress();
    }
  };

  /**
   * handleLoginPress - Handles login button press
   * SHOULD DO: Navigate to Login Screen or open login modal
   * SHOULD NOT DO: Perform authentication directly or store tokens
   * PARENT SHOULD: Provide onLoginPress prop with auth navigation logic
   */
  const handleLoginPress = () => {
    // ✅ This only calls the callback provided by parent
    // ✅ Parent component should handle navigation to login screen
    // ❌ Does NOT authenticate user directly
    // ❌ Does NOT store tokens or credentials
    // ❌ Does NOT validate user input
    if (onLoginPress) {
      onLoginPress();
    }
  };

  /**
   * handleAvatarPress - Handles user avatar/profile press
   * SHOULD DO: Navigate to User Profile Screen
   * SHOULD NOT DO: Fetch user data directly or modify user state
   * PARENT SHOULD: Provide onAvatarPress prop with profile navigation logic
   */
  const handleAvatarPress = () => {
    // ✅ This only calls the callback provided by parent
    // ✅ Parent component should handle navigation to profile screen
    // ❌ Does NOT fetch user data
    // ❌ Does NOT open settings directly
    if (onAvatarPress) {
      onAvatarPress();
    }
  };

  /**
   * handleSearchSubmit - Handles search form submission
   * SHOULD DO: Execute search with the query string
   * SHOULD NOT DO: Filter results directly or manipulate search data
   * PARENT SHOULD: Provide onSearch prop with search execution logic
   */
  const handleSearchSubmit = () => {
    // ✅ Triggers search callback with current query
    // ✅ Only executes if there's actual search text
    // ❌ Does NOT filter or process results
    // ❌ Does NOT navigate directly
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      }
    }
  };

  /**
   * handleSearchFocus - Handles search bar focus event
   * SHOULD DO: Trigger UI changes like expanding search bar, showing suggestions
   * SHOULD NOT DO: Fetch search suggestions directly or modify app state
   * PARENT SHOULD: Provide onSearchFocus prop to handle focus behavior
   */
  const handleSearchFocus = () => {
    // ✅ Updates local focused state for UI styling
    // ✅ Calls parent callback if provided for additional behavior
    // ❌ Does NOT fetch search suggestions
    // ❌ Does NOT clear or modify search results
    setSearchFocused(true);
    if (onSearchFocus) {
      onSearchFocus();
    }
  };

  /**
   * handleSearchBlur - Handles search bar blur/unfocus event
   * SHOULD DO: Update UI styling when search loses focus
   * SHOULD NOT DO: Clear search results automatically or submit search
   * NO PARENT CALLBACK NEEDED: Internal UI state management only
   */
  const handleSearchBlur = () => {
    // ✅ Only updates local focused state for UI styling
    // ❌ Does NOT clear search results
    // ❌ Does NOT reset search query
    // ❌ Does NOT trigger any navigation
    setSearchFocused(false);
  };

  /**
   * handleClearSearch - Clears the search input field
   * SHOULD DO: Reset search query state locally
   * SHOULD NOT DO: Clear global search results or trigger new search
   * NO PARENT CALLBACK NEEDED: Internal state management only
   */
  const handleClearSearch = () => {
    // ✅ Only clears the local search input state
    // ❌ Does NOT clear search results in parent component
    // ❌ Does NOT refetch or reset data
    // ❌ Does NOT trigger search submission
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
        {/* ✅ Removed Link wrapper - Text should not contain Link */}
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

  // Render user avatar
  const renderAvatar = () => {
    if (!showAvatar) return null;

    return (
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={handleAvatarPress}
        activeOpacity={0.7}
        accessibilityLabel="Profile"
        accessibilityRole="button"
      >
        {user?.avatarUrl ? (
          <Image 
            source={{ uri: user.avatarUrl }} 
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarInitials}>
            <Text style={styles.avatarInitialsText}>
              {getUserInitials()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
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
    alignItems: 'center', // Changed from 'flex-end' to 'center' for proper alignment
    justifyContent: 'space-between', // Changed from 'flex-end' for proper layout
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Added proper status bar spacing
    paddingBottom: 12,
    gap: 12,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
        width: '100%',
        paddingTop: 12, // Less padding on web
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
});

export default AppHeader;