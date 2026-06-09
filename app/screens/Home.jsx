// components/Home.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Home = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setActivities([
        { id: 1, type: "New Question", title: "How does Big-O notation work?", description: "Can someone explain time complexity with examples?", time: "2m ago", category: "Computer Science", icon: "❓", accent: "#1E90FF" },
        { id: 2, type: "New Note", title: "Organic Chemistry: Alkenes", description: "Comprehensive lecture notes with diagrams", time: "15m ago", category: "Chemistry", icon: "📄", accent: "#0D9B6E" },
        { id: 3, type: "New Listing", title: "Calculus Textbook – 3rd Ed.", description: "Good condition, used for one semester", time: "32m ago", category: "Marketplace", icon: "🛒", accent: "#E8760A" },
        { id: 4, type: "New Group", title: "Machine Learning Study Circle", description: "Preparing for finals together!", time: "1h ago", category: "CS & AI", icon: "👥", accent: "#8B5CF6" },
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: "❓", title: "Q&A", description: "Ask and answer academic questions", color: "#1E90FF", bg: "#1E90FF18" },
    { icon: "📄", title: "Notes", description: "Upload and access lecture materials", color: "#0D9B6E", bg: "#0D9B6E18" },
    { icon: "🛒", title: "Marketplace", description: "Buy and sell academic resources", color: "#E8760A", bg: "#E8760A18" },
    { icon: "👥", title: "Study Groups", description: "Collaborate with fellow students", color: "#8B5CF6", bg: "#8B5CF618" },
  ];

  const FeatureCard = ({ icon, title, description, color, bg }) => (
    <TouchableOpacity style={[styles.featureCard, { backgroundColor: bg }]}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureTitle, { color }]}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const ActivityCard = ({ icon, title, description, time, category, accent }) => (
    <View style={styles.activityCard}>
      <View style={[styles.activityIcon, { backgroundColor: `${accent}18` }]}>
        <Text style={styles.activityIconText}>{icon}</Text>
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
        <Text style={styles.activityDescription} numberOfLines={1}>{description}</Text>
        <View style={[styles.activityBadge, { backgroundColor: `${accent}18` }]}>
          <Text style={[styles.activityBadgeText, { color: accent }]}>{category}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions, notes, books..."
            placeholderTextColor="#9AA6B5"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={['#0D1B2A', '#1B2C3F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>WELCOME TO CAMPUS CONNECT</Text>
          </View>
          <Text style={styles.heroTitle}>
            Connect, Learn &{'\n'}Collaborate
          </Text>
          <Text style={styles.heroSubtitle}>
            Your all-in-one academic platform for questions, notes, and study groups
          </Text>
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Get Started →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresWrapper}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </View>

      {/* Latest Activities */}
      <View style={styles.activitiesWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Activities</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E90FF" />
          </View>
        ) : (
          activities.map((activity) => (
            <ActivityCard key={activity.id} {...activity} />
          ))
        )}
      </View>

      {/* Bottom spacing for nav bar */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    paddingBottom: 10,
  },
  // Search Bar Styles
  searchWrapper: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1.5,
    borderColor: '#DCE3EA',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1E90FF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(30,144,255,0.12)',
      },
    }),
  },
  searchIcon: {
    fontSize: 17,
    color: '#6C7A89',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B263B',
    padding: 0,
  },
  // Hero Banner Styles
  heroWrapper: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroContainer: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,144,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E90FF',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E90FF',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Features Styles
  featuresWrapper: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 12,
    color: '#6C7A89',
    lineHeight: 16,
  },
  // Activities Styles
  activitiesWrapper: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 13,
    color: '#1E90FF',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    marginBottom: 12,
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconText: {
    fontSize: 22,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1B263B',
    flex: 1,
    marginRight: 8,
  },
  activityTime: {
    fontSize: 11,
    color: '#9AA6B5',
  },
  activityDescription: {
    fontSize: 12,
    color: '#6C7A89',
    marginBottom: 8,
  },
  activityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default Home;