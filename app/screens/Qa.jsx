// screens/QAScreen.jsx - With Expo Router Navigation
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loadQuestions, loadQuestionsByTag, loadTrendingQuestions } from '../services/QuestionService';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ width = "100%", height = 16, radius = 8, style = {} }) => (
  <View style={[styles.skeletonContainer, { width, height, borderRadius: radius }, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

const QuestionSkeleton = () => (
  <View style={styles.questionCard}>
    <Skeleton width="90%" height={20} style={{ marginBottom: 12 }} />
    <View style={styles.tagContainer}>
      <Skeleton width={80} height={28} radius={14} />
      <Skeleton width={100} height={28} radius={14} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton width={60} height={14} />
      <Skeleton width={60} height={14} />
    </View>
    <Skeleton width={80} height={12} />
  </View>
);

const TrendingSkeleton = () => (
  <View style={styles.trendingCard}>
    <Skeleton width="100%" height={40} style={{ marginBottom: 8 }} />
    <Skeleton width="60%" height={12} style={{ marginBottom: 6 }} />
    <Skeleton width="40%" height={12} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Error State Component
// ─────────────────────────────────────────────────────────────────────────────

const ErrorState = ({ onRetry, errorMessage }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Failed to Load Data</Text>
    <Text style={styles.errorMessage}>
      {errorMessage || 'Unable to connect to the server. Please check your internet connection.'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Try Again →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Question Card Component
// ─────────────────────────────────────────────────────────────────────────────

const QuestionCard = ({ item, onPress }) => {
  const [pressed, setPressed] = useState(false);

  // Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Safe access to item properties
  const questionText = item?.question || 'Untitled Question';
  const description = item?.description || 'No description provided';
  const courses = item?.courses || [];
  const answerCount = item?.answer_len ?? 0;
  const viewCount = item?.views ?? 0;
  const authorName = item?.user__first_name || 'Anonymous';
  const questionCode = item?.code || 'unknown';
  const createdAt = item?.created_at || null;

  return (
    <TouchableOpacity
      style={[styles.questionCard, pressed && styles.cardPressed]}
      onPress={() => onPress(questionCode, questionText)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      <Text style={styles.questionTitle} numberOfLines={2}>
        {questionText}
      </Text>
      
      <Text style={styles.questionDescription} numberOfLines={2}>
        {description}
      </Text>
      
      <View style={styles.tagContainer}>
        {courses.length > 0 ? (
          courses.slice(0, 3).map((course, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{course}</Text>
            </View>
          ))
        ) : (
          <View style={styles.tag}>
            <Text style={styles.tagText}>General</Text>
          </View>
        )}
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statText}>{answerCount} {answerCount === 1 ? 'Answer' : 'Answers'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👁</Text>
          <Text style={styles.statText}>{viewCount} {viewCount === 1 ? 'View' : 'Views'}</Text>
        </View>
      </View>
      
      <View style={styles.footerRow}>
        <Text style={styles.authorText}>By: {authorName}</Text>
        <Text style={styles.timeText}>{formatDate(createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Trending Question Card Component
// ─────────────────────────────────────────────────────────────────────────────

const TrendingQuestionCard = ({ item, onPress }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.trendingCard, pressed && styles.cardPressed]}
      onPress={() => onPress(item.code, item.question)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      <Text style={styles.trendingTitle} numberOfLines={2}>
        {item.question || 'Untitled Question'}
      </Text>
      <View style={styles.trendingStats}>
        <Text style={styles.trendingStat}>👁 {item.views || 0} views</Text>
        <Text style={styles.trendingStat}>💬 {item.answer_len || 0} answers</Text>
      </View>
      {item.courses && item.courses.length > 0 && (
        <View style={styles.trendingTag}>
          <Text style={styles.trendingTagText}>{item.courses[0]}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter Tabs Component
// ─────────────────────────────────────────────────────────────────────────────

const FilterTabs = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'latest', label: 'Latest' },
    { key: 'trending', label: 'Trending' },
    { key: 'unanswered', label: 'Unanswered' },
  ];

  return (
    <View style={styles.filterTabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
            onPress={() => onFilterChange(filter.key)}
          >
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Component - FIXED
// ─────────────────────────────────────────────────────────────────────────────

const Pagination = ({ currentPage, hasNextPage, onPageChange, isLoading }) => {
  // Don't show pagination if only one page and no next page
  if (!hasNextPage && currentPage === 1) return null;

  return (
    <View style={styles.paginationContainer}>
      {/* Previous Button */}
      <TouchableOpacity 
        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
        onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
      >
        <Text style={styles.pageButtonText}>←</Text>
      </TouchableOpacity>

      {/* Current Page Button */}
      <TouchableOpacity 
        style={[styles.pageNumber, styles.pageNumberActive]}
        disabled={true}
      >
        <Text style={[styles.pageNumberText, styles.pageNumberTextActive]}>
          {currentPage}
        </Text>
      </TouchableOpacity>

      {/* Next Page Button (if exists) */}
      {hasNextPage && (
        <TouchableOpacity 
          style={styles.pageNumber}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={isLoading}
        >
          <Text style={styles.pageNumberText}>
            {currentPage + 1}
          </Text>
        </TouchableOpacity>
      )}

      {/* Next Button */}
      <TouchableOpacity 
        style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
        onPress={() => hasNextPage && onPageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
      >
        <Text style={styles.pageButtonText}>→</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.paginationLoader}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = ({ onAskQuestion, activeFilter, selectedTag }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>No questions found.</Text>
    <Text style={styles.emptySubtitle}>
      {selectedTag 
        ? `No questions tagged with "${selectedTag}" yet.`
        : `No ${activeFilter !== 'latest' ? activeFilter : ''} questions available.`}
    </Text>
    <Text style={styles.emptyHint}>Be the first to ask a question!</Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onAskQuestion}>
      <Text style={styles.emptyButtonText}>Ask Question →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Q&A Screen Component
// ─────────────────────────────────────────────────────────────────────────────

const QAScreen = () => {
  const router = useRouter();
  
  const [questions, setQuestions] = useState([]);
  const [trendingQuestions, setTrendingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('latest');
  const [selectedTag, setSelectedTag] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Load trending questions from backend
  const loadTrendingQuestionsData = async () => {
    try {
      setLoadingTrending(true);
      const response = await loadTrendingQuestions(1);
      console.log(response)
      
      if (response && response.success && response.data) {
        const trending = response.data.questions || [];
        setTrendingQuestions(trending.slice(0, 5)); // Show top 5 trending
      } else {
        console.error('Failed to load trending questions:', response?.error);
      }
    } catch (error) {
      console.error('Error loading trending questions:', error);
    } finally {
      setLoadingTrending(false);
    }
  };

  // Load questions from backend
  const loadQuestionsData = async (page = 1, refresh = false, filter = activeFilter, tag = selectedTag) => {
    try {
      setHasError(false);
      setErrorMessage('');
      
      let response;
      
      if (tag) {
        response = await loadQuestionsByTag(tag, page);
      } else {
        let requestType = 'latest';
        if (filter === 'trending') requestType = 'trending';
        else if (filter === 'unanswered') requestType = 'unanswered';
        else requestType = 'latest';
        
        response = await loadQuestions({ page, request_type: requestType });
      }
      
      // Check if response is successful
      if (response && response.success && response.data) {
        const newQuestions = response.data.questions || [];
        
        if (refresh) {
          setQuestions(newQuestions);
        } else {
          setQuestions(prev => [...prev, ...newQuestions]);
        }
        
        // Fix: status true means more pages available, false means no more pages
        const morePages = response.data.status === true;
        setHasNextPage(morePages);
        setCurrentPage(page);
        setTotalQuestions(newQuestions.length);
        
        return true;
      } else {
        // Handle failed response
        const errorMsg = response?.error || 'Failed to load questions';
        setHasError(true);
        setErrorMessage(errorMsg);
        if (refresh) {
          setQuestions([]);
        }
        return false;
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Network error. Please check your connection.');
      if (refresh) {
        setQuestions([]);
      }
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setHasError(false);
      await Promise.all([
        loadQuestionsData(1, true, activeFilter, selectedTag),
        loadTrendingQuestionsData()
      ]);
      setLoading(false);
    };
    initialize();
  }, [activeFilter, selectedTag]);

  // Handle filter change
  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    setSelectedTag(null);
    setCurrentPage(1);
    setHasNextPage(false);
    setHasError(false);
    loadQuestionsData(1, true, filterKey, null);
  };

  // Handle tag filter
  const handleTagFilter = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      loadQuestionsData(1, true, activeFilter, null);
    } else {
      setSelectedTag(tag);
      setCurrentPage(1);
      setHasNextPage(false);
      setHasError(false);
      loadQuestionsData(1, true, activeFilter, tag);
    }
  };

  // Handle page change - FIXED
  const handlePageChange = async (page) => {
    if (page === currentPage) return;
    
    setIsLoadingMore(true);
    setHasError(false);
    
    // Load the requested page
    await loadQuestionsData(page, true, activeFilter, selectedTag);
    
    setIsLoadingMore(false);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setHasError(false);
    await Promise.all([
      loadQuestionsData(1, true, activeFilter, selectedTag),
      loadTrendingQuestionsData()
    ]);
    setRefreshing(false);
  };

  // Handle retry
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    loadQuestionsData(1, true, activeFilter, selectedTag);
  };

  // Handle ask question
  const handleAskQuestion = () => {
    Alert.alert('Coming Soon', 'Question form will be implemented soon');
  };

  // Handle question press - Navigate to Question Detail using Expo Router
  const handleQuestionPress = (questionCode, questionTitle) => {
    console.log('Navigating to question:', questionCode, questionTitle);
    
    // Navigate to the question detail screen with parameters
    router.push({
      pathname: '/screens/QaDetail',
      params: { 
        id: questionCode,
        title: questionTitle || 'Question Details'
      }
    });
  };

  // Render Functions
  const renderQuestionItem = ({ item }) => {
    if (!item) return null;
    return <QuestionCard item={item} onPress={handleQuestionPress} />;
  };

  const renderHeader = () => (
    <>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Ask & Answer Questions</Text>
          <Text style={styles.pageSubtitle}>
            Browse academic discussions and help fellow students.
          </Text>
        </View>
        
      </View>

      {/* Trending Questions Section - Always visible */}
      <View style={styles.trendingSection}>
        <View style={styles.trendingHeader}>
          <Text style={styles.trendingSectionTitle}>🔥 Trending Now</Text>
          <Text style={styles.trendingSubtitle}>Most viewed this week</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.trendingScroll}
          contentContainerStyle={styles.trendingContent}
        >
          {loadingTrending ? (
            [...Array(3)].map((_, i) => <TrendingSkeleton key={i} />)
          ) : (
            trendingQuestions.map((item) => (
              <TrendingQuestionCard key={item.code} item={item} onPress={handleQuestionPress} />
            ))
          )}
        </ScrollView>
      </View>

      <FilterTabs activeFilter={activeFilter} onFilterChange={handleFilterChange} />

      {!hasError && !loading && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedTag ? `Questions tagged: ${selectedTag}` : 'All Questions'}
          </Text>
          <Text style={styles.questionCount}>
            {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </>
  );

  const renderFooter = () => {
    if (loading || hasError) return null;
    
    return (
      <>
        {questions.length > 0 && (
          <View style={styles.paginationSection}>
            <Pagination
              currentPage={currentPage}
              hasNextPage={hasNextPage}
              onPageChange={handlePageChange}
              isLoading={isLoadingMore}
            />
          </View>
        )}
      </>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        <QuestionSkeleton />
        <QuestionSkeleton />
        <QuestionSkeleton />
        <QuestionSkeleton />
        <QuestionSkeleton />
      </ScrollView>
    );
  }

  // Error state
  if (hasError && !loading && questions.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ErrorState onRetry={handleRetry} errorMessage={errorMessage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={questions}
        renderItem={renderQuestionItem}
        keyExtractor={(item, index) => item?.code || index.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !hasError && (
            <EmptyState 
              onAskQuestion={handleAskQuestion} 
              activeFilter={activeFilter}
              selectedTag={selectedTag}
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E90FF']} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6C7A89',
  },
  askButton: {
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  // Trending Section Styles
  trendingSection: {
    marginBottom: 20,
    paddingHorizontal: 18,
  },
  trendingHeader: {
    marginBottom: 12,
  },
  trendingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  trendingSubtitle: {
    fontSize: 12,
    color: '#6C7A89',
  },
  trendingScroll: {
    flexGrow: 0,
  },
  trendingContent: {
    paddingRight: 18,
    gap: 12,
  },
  trendingCard: {
    width: width * 0.65,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE3EA',
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
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B263B',
    marginBottom: 8,
    lineHeight: 20,
  },
  trendingStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  trendingStat: {
    fontSize: 12,
    color: '#6C7A89',
  },
  trendingTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#1E90FF10',
  },
  trendingTagText: {
    fontSize: 10,
    color: '#1E90FF',
    fontWeight: '500',
  },
  filterTabsContainer: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EA',
  },
  filterTabActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  filterText: {
    fontSize: 14,
    color: '#6C7A89',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  questionCount: {
    fontSize: 12,
    color: '#6C7A89',
  },
  paginationSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontSize: 20,
    color: '#0D1B2A',
    fontWeight: '600',
  },
  pageNumber: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pageNumberActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  pageNumberText: {
    fontSize: 16,
    color: '#0D1B2A',
    fontWeight: '600',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
  },
  paginationLoader: {
    marginLeft: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#1E90FF',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE3EA',
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
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B263B',
    marginBottom: 8,
    lineHeight: 22,
  },
  questionDescription: {
    fontSize: 13,
    color: '#6C7A89',
    marginBottom: 12,
    lineHeight: 18,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E90FF',
    backgroundColor: '#1E90FF10',
  },
  tagText: {
    fontSize: 11,
    color: '#1E90FF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    color: '#6C7A89',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 11,
    color: '#1E90FF',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: '#9AA6B5',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: '#F5F7FA',
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#1E90FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
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

export default QAScreen;