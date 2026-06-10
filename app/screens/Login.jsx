// screens/LoginScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../services/Context';

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ width = "100%", height = 16, radius = 8, style = {} }) => (
  <View style={[styles.skeletonContainer, { width, height, borderRadius: radius }, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

const LoginSkeleton = () => (
  <View style={styles.skeletonWrapper}>
    <Skeleton width={100} height={100} radius={50} style={styles.skeletonLogo} />
    <Skeleton width={200} height={32} radius={8} style={{ marginTop: 16 }} />
    <Skeleton width={250} height={16} radius={8} style={{ marginTop: 8 }} />
    <Skeleton width="100%" height={50} radius={12} style={{ marginTop: 32 }} />
    <Skeleton width="100%" height={50} radius={12} style={{ marginTop: 16 }} />
    <Skeleton width="100%" height={50} radius={12} style={{ marginTop: 24 }} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Input Field Component
// ─────────────────────────────────────────────────────────────────────────────

const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry = false,
  keyboardType = "default",
  error = null,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA6B5"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {secureTextEntry && value.length > 0 && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading Button Component
// ─────────────────────────────────────────────────────────────────────────────

const LoadingButton = ({ title, onPress, loading, disabled }) => (
  <TouchableOpacity
    style={[styles.loginButton, (disabled || loading) && styles.loginButtonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    {loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FFFFFF" size="small" />
        <Text style={styles.loginButtonText}>Signing In...</Text>
      </View>
    ) : (
      <Text style={styles.loginButtonText}>{title}</Text>
    )}
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// Error Card Component
// ─────────────────────────────────────────────────────────────────────────────

const ErrorCard = ({ message, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.errorCard}>
      <Text style={styles.errorCardIcon}>⚠️</Text>
      <View style={styles.errorCardContent}>
        <Text style={styles.errorCardTitle}>Login Failed</Text>
        <Text style={styles.errorCardMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={styles.errorCardClose}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Success Message Component
// ─────────────────────────────────────────────────────────────────────────────

const SuccessMessage = ({ message, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.successCard}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Social Login Placeholder Component
// ─────────────────────────────────────────────────────────────────────────────

const SocialLoginPlaceholder = () => (
  <View style={styles.socialContainer}>
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>Or Continue With</Text>
      <View style={styles.dividerLine} />
    </View>
    
    <View style={styles.socialButtons}>
      <TouchableOpacity style={styles.socialButton} disabled={true}>
        <Text style={styles.socialIcon}>G</Text>
        <Text style={styles.socialButtonText}>Google</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.socialButton} disabled={true}>
        <Text style={styles.socialIcon}>M</Text>
        <Text style={styles.socialButtonText}>Microsoft</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Login Screen Component
// ─────────────────────────────────────────────────────────────────────────────

const LoginScreen = () => {
  const router = useRouter();
  const { login, isUserAuthenticated, isLoading: authLoading } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Check if already logged in
  React.useEffect(() => {
    const checkAuth = async () => {
      if (isUserAuthenticated()) {
        router.replace('/');
      }
    };
    checkAuth();
  }, []);
  
  // Validation functions
  const validateEmail = (emailValue) => {
    if (!emailValue) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) return 'Please enter a valid email address';
    return null;
  };
  
  const validatePassword = (passwordValue) => {
    if (!passwordValue) return 'Password is required';
    if (passwordValue.length < 6) return 'Password must be at least 6 characters';
    return null;
  };
  
  // Handle email change
  const handleEmailChange = (value) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
    if (serverError) setServerError(null);
  };
  
  // Handle password change
  const handlePasswordChange = (value) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: null }));
    }
    if (serverError) setServerError(null);
  };
  
  // Login function using Auth Context
  const handleLogin = async () => {
    // Validate form
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    const newErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setServerError(null);
    
    const result = await login(email, password);
    
    if (result.success) {
      setSuccessMessage('Login Successful! Redirecting...');
      setEmail('');
      setPassword('');
      
      // Navigate to home after short delay
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } else {
      setServerError(result.error);
      setPassword('');
    }
    
    setLoading(false);
  };
  
  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  // Loading state (initial auth check)
  if (authLoading) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LoginSkeleton />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success Message */}
          {successMessage && (
            <SuccessMessage 
              message={successMessage} 
              onDismiss={() => setSuccessMessage(null)}
            />
          )}
          
          {/* Server Error Message */}
          {serverError && (
            <ErrorCard 
              message={serverError} 
              onDismiss={() => setServerError(null)}
            />
          )}
          
          {/* Branding Section */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={styles.appName}>Campus Connect</Text>
            <Text style={styles.tagline}>Connect, Learn & Collaborate</Text>
          </View>
          
          {/* Welcome Section */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to continue your academic journey.
            </Text>
          </View>
          
          {/* Login Form */}
          <View style={styles.formContainer}>
            <InputField
              label="Email Address"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              error={errors.email}
            />
            
            <InputField
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
              secureTextEntry={true}
              error={errors.password}
            />
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <LoadingButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            />
            
            {/* Register Section */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Social Login Placeholder */}
          <SocialLoginPlaceholder />
          
          {/* Version Info */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  // Branding Section
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
  },
  // Welcome Section
  welcomeContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6C7A89',
    lineHeight: 20,
  },
  // Form Section
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCE3EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
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
    }),
  },
  inputWrapperFocused: {
    borderColor: '#1E90FF',
    ...Platform.select({
      ios: {
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputWrapperError: {
    borderColor: '#E74C3C',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1B263B',
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  eyeIcon: {
    fontSize: 18,
    padding: 8,
    color: '#6C7A89',
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0D1B2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: '#9AA6B5',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#6C7A89',
  },
  registerLink: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '600',
  },
  // Error Card
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorCardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorCardContent: {
    flex: 1,
  },
  errorCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 2,
  },
  errorCardMessage: {
    fontSize: 12,
    color: '#D32F2F',
  },
  errorCardClose: {
    fontSize: 16,
    color: '#9AA6B5',
    padding: 4,
  },
  // Success Message
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A3E4D7',
  },
  successIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
  },
  // Social Login
  socialContainer: {
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCE3EA',
  },
  dividerText: {
    fontSize: 13,
    color: '#6C7A89',
    marginHorizontal: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    opacity: 0.6,
    position: 'relative',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0D1B2A',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1E90FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  comingSoonText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9AA6B5',
    marginTop: 24,
  },
  // Skeleton
  skeletonContainer: {
    backgroundColor: '#E8EDF2',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F7FA',
    opacity: 0.5,
  },
  skeletonWrapper: {
    alignItems: 'center',
  },
  skeletonLogo: {
    marginBottom: 16,
  },
});

export default LoginScreen;