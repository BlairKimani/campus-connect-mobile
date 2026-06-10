// screens/Groups.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  fetchGroups, 
  getErrorMessage, 
  retryRequest, 
  getFullImageUrl,
  formatMemberCount 
} from '../services/GroupService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px gap on each side

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ width = "100%", height = 16, radius = 8, style = {} }) => (
  <View style={[styles.skeletonContainer, { width, height, borderRadius: radius }, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

const GroupCardSkeleton = () => (
  <View style={styles.groupCard}>
    <Skeleton width="100%" height={120} radius={12} style={{ marginBottom: 12 }} />
    <Skeleton width="90%" height={18} style={{ marginBottom: 8 }} />
    <Skeleton width="70%" height={14} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Group Card Component
// ─────────────────────────────────────────────────────────────────────────────

const GroupCard = ({ group, onPress }) => {
  const [pressed, setPressed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = getFullImageUrl(group.group_image);

  return (
    <TouchableOpacity
      style={[styles.groupCard, pressed && styles.cardPressed]}
      onPress={() => onPress(group.group_id)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      {/* Group Image */}
      <View style={styles.cardImageContainer}>
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardImageEmoji}>👥</Text>
          </View>
        )}
      </View>
      
      {/* Group Name */}
      <Text style={styles.groupName} numberOfLines={2}>
        {group.name || 'Untitled Group'}
      </Text>
      
      {/* Member Count */}
      <Text style={styles.membersText}>
        {formatMemberCount(group.members_count)}
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Card Component
// ─────────────────────────────────────────────────────────────────────────────

const ErrorCard = ({ onRetry, errorMessage }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Failed to Load Groups</Text>
    <Text style={styles.errorMessage}>
      {errorMessage || 'Unable to connect to the server. Please check your internet connection.'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📚</Text>
    <Text style={styles.emptyTitle}>No Groups Found</Text>
    <Text style={styles.emptySubtitle}>
      There are currently no study groups available.
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Load More Button Component
// ─────────────────────────────────────────────────────────────────────────────

const LoadMoreButton = ({ onPress, isLoading, hasMore }) => {
  if (!hasMore && !isLoading) {
    return (
      <View style={styles.noMoreContainer}>
        <Text style={styles.noMoreText}>No More Groups Available</Text>
      </View>
    );
  }
  
  return (
    <TouchableOpacity 
      style={[styles.loadMoreButton, isLoading && styles.loadMoreButtonDisabled]}
      onPress={onPress}
      disabled={isLoading}
    >
      <Text style={styles.loadMoreButtonText}>
        {isLoading ? 'Loading More Groups...' : 'Load More Groups'}
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Search Bar Component
// ─────────────────────────────────────────────────────────────────────────────

const SearchBar = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View style={styles.searchWrapper}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups by name..."
          placeholderTextColor="#9AA6B5"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
        {query.length > 0 && (
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Go</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Groups Screen Component
// ─────────────────────────────────────────────────────────────────────────────

const Groups = () => {
  const router = useRouter();
  
  // State for groups
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pagination state
  const [nextPage, setNextPage] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load groups from backend
  const loadGroups = async (page = 1, append = false, search = searchQuery) => {
    try {
      const response = await retryRequest(
        () => fetchGroups({ page, pageSize: 6, search: search || null }),
        2,
        1000
      );
      
      if (response.success && response.data) {
        const newGroups = response.data.results || [];
        setTotalCount(response.data.count || 0);
        setNextPage(response.data.next);
        setCurrentPage(page);
        
        if (append) {
          setGroups(prev => [...prev, ...newGroups]);
        } else {
          setGroups(newGroups);
        }
        return true;
      } else {
        setHasError(true);
        setErrorMessage(getErrorMessage(response));
        return false;
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setHasError(true);
      setErrorMessage('An unexpected error occurred. Please try again.');
      return false;
    }
  };
  
  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    setHasError(false);
    setNextPage(null);
    setCurrentPage(1);
    
    await loadGroups(1, false, searchQuery);
    setLoading(false);
  };
  
  // Load more groups
  const loadMoreGroups = async () => {
    if (!nextPage || loadingMore) return;
    
    setLoadingMore(true);
    await loadGroups(currentPage + 1, true, searchQuery);
    setLoadingMore(false);
  };
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setHasError(false);
    await loadGroups(1, false, searchQuery);
    setRefreshing(false);
  };
  
  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setLoading(true);
    setNextPage(null);
    setCurrentPage(1);
    await loadGroups(1, false, query);
    setLoading(false);
  };
  
  // Handle retry
  const handleRetry = () => {
    loadInitialData();
  };
  
  // Handle group press
  const handleGroupPress = (groupId) => {
    router.push({
      pathname: '/group-detail',
      params: { id: groupId }
    });
  };
  
  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Render header
  const renderHeader = () => (
    <>
      {/* Page Title Section */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Study Groups</Text>
        <Text style={styles.pageSubtitle}>
          Join academic communities, collaborate with classmates, share resources, and learn together.
        </Text>
      </View>
      
      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} isLoading={loading} />
      
      {/* Results Count */}
      {!loading && !hasError && groups.length > 0 && (
        <Text style={styles.resultsCount}>
          {totalCount} group{totalCount !== 1 ? 's' : ''} available
        </Text>
      )}
    </>
  );
  
  // Render footer (Load More button)
  const renderFooter = () => {
    if (loading || hasError) return null;
    if (groups.length === 0) return null;
    
    return (
      <LoadMoreButton
        onPress={loadMoreGroups}
        isLoading={loadingMore}
        hasMore={nextPage !== null}
      />
    );
  };
  
  // Render empty state
  const renderEmptyComponent = () => {
    if (loading || hasError) return null;
    if (groups.length === 0) {
      return <EmptyState />;
    }
    return null;
  };
  
  // Loading state
  if (loading && !refreshing) {
    return (
      <FlatList
        data={[1, 2, 3, 4, 5, 6]}
        renderItem={() => <GroupCardSkeleton />}
        keyExtractor={(item) => item.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />
    );
  }
  
  // Error state
  if (hasError && !loading && groups.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<ErrorCard onRetry={handleRetry} errorMessage={errorMessage} />}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E90FF']} />
        }
      />
    );
  }
  
  // Success state
  return (
    <FlatList
      data={groups}
      renderItem={({ item }) => <GroupCard group={item} onPress={handleGroupPress} />}
      keyExtractor={(item) => item.group_id?.toString() || Math.random().toString()}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.flatListContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E90FF']} />
      }
      onEndReached={loadMoreGroups}
      onEndReachedThreshold={0.3}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 20,
    backgroundColor: '#F5F7FA',
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  // Page Header
  pageHeader: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6C7A89',
    lineHeight: 20,
  },
  // Search Bar
  searchWrapper: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE3EA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchContainerFocused: {
    borderColor: '#1E90FF',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 16,
    color: '#6C7A89',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1B263B',
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: '#9AA6B5',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Results Count
  resultsCount: {
    paddingHorizontal: 18,
    marginBottom: 12,
    fontSize: 13,
    color: '#6C7A89',
  },
  // Group Card
  groupCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageEmoji: {
    fontSize: 48,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  membersText: {
    fontSize: 12,
    color: '#6C7A89',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  // Load More Button
  loadMoreButton: {
    backgroundColor: '#0D1B2A',
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#DCE3EA',
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  noMoreContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  noMoreText: {
    fontSize: 14,
    color: '#6C7A89',
  },
  // Error State
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
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
});

export default Groups;