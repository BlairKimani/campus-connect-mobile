// screens/QuestionDetailScreen.jsx
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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RenderHTML from 'react-native-render-html';
import { FetchQuestionDetails, retryFetchQuestionDetails, getErrorMessage, formatDate } from '../services/QuestionDetailService';

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
    <Skeleton width="90%" height={28} style={{ marginBottom: 12 }} />
    <Skeleton width="100%" height={60} style={{ marginBottom: 16 }} />
    <View style={styles.tagContainer}>
      <Skeleton width={100} height={32} radius={16} />
      <Skeleton width={120} height={32} radius={16} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton width={60} height={20} />
      <Skeleton width={60} height={20} />
      <Skeleton width={60} height={20} />
    </View>
    <View style={styles.actionButtons}>
      <Skeleton width="48%" height={44} radius={22} />
      <Skeleton width="48%" height={44} radius={22} />
    </View>
  </View>
);

const AnswerSkeleton = () => (
  <View style={styles.answerCard}>
    <View style={styles.answerHeader}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
    <Skeleton width="100%" height={80} style={{ marginBottom: 12 }} />
    <Skeleton width="30%" height={14} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Course Tag Component
// ─────────────────────────────────────────────────────────────────────────────

const CourseTag = ({ course }) => (
  <View style={styles.courseTag}>
    <Text style={styles.courseTagText}>{course.name || course}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// User Avatar Component
// ─────────────────────────────────────────────────────────────────────────────

const UserAvatar = ({ imageUrl, name, size = 40 }) => {
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (imageUrl) {
    return (
      <Image 
        source={{ uri: imageUrl }} 
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.avatarInitials, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitialsText, { fontSize: size / 2.5 }]}>
        {getInitials()}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Badge Component
// ─────────────────────────────────────────────────────────────────────────────

const AIBadge = () => (
  <View style={styles.aiBadge}>
    <Text style={styles.aiBadgeText}>🤖 AI Answer</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Question Stats Component 
// ─────────────────────────────────────────────────────────────────────────────

const QuestionStats = ({ rating, views, likes }) => (
  <View style={styles.statsRow}>
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>⭐</Text>
      <Text style={styles.statText}>{rating?.toFixed(1) || '0.0'}</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>👁</Text>
      <Text style={styles.statText}>{views || 0}</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>👍</Text>
      <Text style={styles.statText}>{likes || 0}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Error Card Component
// ─────────────────────────────────────────────────────────────────────────────

const ErrorCard = ({ onRetry, errorMessage }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Failed to Load Question</Text>
    <Text style={styles.errorMessage}>
      {errorMessage || 'Unable to connect to the server. Please check your internet connection.'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty Answers State Component
// ─────────────────────────────────────────────────────────────────────────────

const EmptyAnswersState = ({ onAnswerPress }) => (
  <View style={styles.emptyAnswersContainer}>
    <Text style={styles.emptyAnswersIcon}>💬</Text>
    <Text style={styles.emptyAnswersTitle}>No answers yet.</Text>
    <Text style={styles.emptyAnswersSubtitle}>
      Be the first student to answer this question.
    </Text>
    <TouchableOpacity style={styles.emptyAnswerButton} onPress={onAnswerPress}>
      <Text style={styles.emptyAnswerButtonText}>Answer Question →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Answer Card Component
// ─────────────────────────────────────────────────────────────────────────────

const AnswerCard = ({ answer, onLike, onReport }) => {
  const [pressed, setPressed] = useState(false);

  const authorName = answer.user_first_name && answer.user_last_name
    ? `${answer.user_first_name} ${answer.user_last_name}`
    : answer.user_first_name || 'Anonymous';

  return (
    <TouchableOpacity
      style={[styles.answerCard, pressed && styles.cardPressed]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      <View style={styles.answerHeader}>
        <UserAvatar 
          imageUrl={answer.user_image} 
          name={authorName}
          size={40}
        />
        <View style={styles.answerHeaderInfo}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{authorName}</Text>
            {answer.ai === true && <AIBadge />}
          </View>
          <Text style={styles.answerDate}>{formatDate(answer.created_at)}</Text>
        </View>
      </View>

      <View style={styles.answerContent}>
        <RenderHTML
          contentWidth={width - 48}
          source={{ html: answer.answer || '<p>No content available</p>' }}
          baseStyle={styles.htmlContent}
          tagsStyles={htmlStyles}
        />
      </View>

      <View style={styles.answerFooter}>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => onLike?.(answer.id)}
        >
          <Text style={styles.likeIcon}>👍</Text>
          <Text style={styles.likeText}>{answer.likes_data || 0} Likes</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Question Card Component - MODIFIED with AI button logic
// ─────────────────────────────────────────────────────────────────────────────

const QuestionCard = ({ questionData, onAnswerPress, onAIPress }) => {
  // Extract data from the API response structure
  const questionTitle = questionData?.question?.title || '??';
  const questionDescription = questionData?.question?.description || '';
  const courses = questionData?.courses || [];
  const rating = questionData?.rating || 0;
  const likes = questionData?.likes || 0;
  const views = questionData?.question?.views || 0;
  const hasAIAnswer = questionData?.ai === true; // Check if AI has already answered
  
  // Check if description exists and is different from title
  const hasDescription = questionDescription && questionDescription !== questionTitle;

  return (
    <View style={styles.questionCard}>
      {/* Question Title - BOLD (use '??' if null) */}
      <Text style={styles.questionTitle}>{questionTitle}</Text>
      
      {/* Question Description - Regular text (only if different from title and not empty) */}
      {hasDescription && (
        <RenderHTML
          contentWidth={width - 76}
          source={{ html: questionDescription }}
          baseStyle={styles.questionDescription}
          tagsStyles={questionDescriptionStyles}
        />
      )}
      
      {/* Course Tags */}
      {courses && courses.length > 0 && (
        <View style={styles.tagContainer}>
          {courses.map((course, index) => (
            <CourseTag key={index} course={course} />
          ))}
        </View>
      )}
      
      {/* Stats */}
      <QuestionStats rating={rating} views={views} likes={likes} />
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.answerButton} onPress={onAnswerPress}>
          <Text style={styles.answerButtonText}>Answer Question</Text>
        </TouchableOpacity>
        
        {/* AI Button - Conditional styling and behavior */}
        <TouchableOpacity 
          style={[
            styles.aiButton, 
            hasAIAnswer && styles.aiButtonDisabled
          ]}
          onPress={hasAIAnswer ? null : onAIPress}
          activeOpacity={hasAIAnswer ? 1 : 0.7}
          disabled={hasAIAnswer}
        >
          <Text style={[
            styles.aiButtonText,
            hasAIAnswer && styles.aiButtonTextDisabled
          ]}>
            {hasAIAnswer ? '✓ AI Answered' : 'Ask AI'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Show indicator if AI has answered */}
      {hasAIAnswer && (
        <View style={styles.aiAnsweredIndicator}>
          <Text style={styles.aiAnsweredText}>🤖 This question already has an AI-generated answer</Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Question Detail Screen Component
// ─────────────────────────────────────────────────────────────────────────────

const QuestionDetailScreen = () => {
  // Use Expo Router hooks to get params
  const searchParams = useLocalSearchParams();
  const router = useRouter();
  
  // Extract id and title from searchParams
  const questionId = searchParams?.id || searchParams?.questionId;
  const questionTitle = searchParams?.title;
  
  // Debug logging
  console.log('========================================');
  console.log('QuestionDetailScreen - questionId:', questionId);
  console.log('QuestionDetailScreen - questionTitle:', questionTitle);
  console.log('========================================');
  
  const [questionData, setQuestionData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load question details using FetchQuestionDetails
  const loadQuestionDetails = async (showLoading = true) => {
    if (!questionId || questionId === 'unknown' || questionId === 'undefined') {
      console.error('Invalid question ID:', questionId);
      setHasError(true);
      setErrorMessage('Invalid question ID. Please go back and try again.');
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      console.log('Fetching question details for ID:', questionId);
      
      // Use retry mechanism for better reliability
      const response = await retryFetchQuestionDetails(questionId, 3, 1000);
      
      console.log('Fetch response success:', response.success);
      console.log('Has AI answer:', response.data?.ai);
      
      if (response.success && response.data) {
        setQuestionData(response.data);
        setAnswers(response.data.answers || []);
      } else {
        setHasError(true);
        setErrorMessage(getErrorMessage(response));
        setAnswers([]);
      }
    } catch (error) {
      console.error('Error in loadQuestionDetails:', error);
      setHasError(true);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setAnswers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (questionId) {
      loadQuestionDetails(true);
    } else {
      console.warn('No questionId provided to QuestionDetailScreen');
      setLoading(false);
      setHasError(true);
      setErrorMessage('No question ID provided. Please go back and try again.');
    }
  }, [questionId]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestionDetails(false);
  };

  // Handle answer question
  const handleAnswerQuestion = () => {
    if (!questionData?.id) {
      Alert.alert('Error', 'Unable to answer question at this time');
      return;
    }
    router.push({
      pathname: '/answer-question',
      params: {
        questionId: questionData.id,
        questionTitle: questionData.question?.title || questionData.question?.description,
      }
    });
  };

  // Handle ask AI
  const handleAskAI = () => {
    // Check if AI has already answered
    if (questionData?.ai === true) {
      Alert.alert(
        'AI Answer Exists',
        'This question already has an AI-generated answer. You can view it in the answers section below.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!questionData?.id) {
      Alert.alert('Error', 'Unable to get AI response at this time');
      return;
    }
    
    router.push({
      pathname: '/ai-answer',
      params: {
        questionId: questionData.id,
        questionTitle: questionData.question?.title || questionData.question?.description,
      }
    });
  };

  // Handle like answer (future implementation)
  const handleLikeAnswer = (answerId) => {
    console.log('Like answer:', answerId);
    Alert.alert('Coming Soon', 'Like functionality will be implemented soon');
  };

  // Handle retry
  const handleRetry = () => {
    loadQuestionDetails(true);
  };

  // Render header (question section)
  const renderHeader = () => {
    if (!questionData) return null;
    
    return (
      <QuestionCard
        questionData={questionData}
        onAnswerPress={handleAnswerQuestion}
        onAIPress={handleAskAI}
      />
    );
  };

  // Render answers section header
  const renderAnswersHeader = () => {
    if (loading || hasError) return null;
    
    return (
      <View style={styles.answersHeader}>
        <Text style={styles.answersTitle}>
          Answers ({answers.length})
        </Text>
      </View>
    );
  };

  // Render answer item
  const renderAnswerItem = ({ item }) => (
    <AnswerCard 
      answer={item} 
      onLike={handleLikeAnswer}
    />
  );

  // Render empty answers
  const renderEmptyAnswers = () => {
    if (loading || hasError) return null;
    if (answers.length === 0) {
      return <EmptyAnswersState onAnswerPress={handleAnswerQuestion} />;
    }
    return null;
  };

  // Loading state with skeletons
  if (loading && !refreshing) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuestionSkeleton />
        <View style={styles.answersHeader}>
          <Skeleton width={120} height={24} />
        </View>
        <AnswerSkeleton />
        <AnswerSkeleton />
        <AnswerSkeleton />
      </ScrollView>
    );
  }

  // Error state
  if (hasError && !loading) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E90FF']} />
        }
      >
        <ErrorCard onRetry={handleRetry} errorMessage={errorMessage} />
      </ScrollView>
    );
  }

  // Success state with data
  return (
    <View style={styles.container}>
      <FlatList
        data={answers}
        renderItem={renderAnswerItem}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderAnswersHeader()}
          </>
        }
        ListEmptyComponent={renderEmptyAnswers}
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
// HTML Styles for RenderHTML
// ─────────────────────────────────────────────────────────────────────────────

// Styles for question description (regular text, no bold by default)
const questionDescriptionStyles = {
  p: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B263B',
    marginBottom: 12,
    fontWeight: 'normal',
  },
  strong: {
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  em: {
    fontStyle: 'italic',
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  li: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B263B',
    marginBottom: 4,
  },
  a: {
    color: '#1E90FF',
    textDecorationLine: 'underline',
  },
};

const htmlStyles = {
  p: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1B263B',
    marginBottom: 12,
  },
  strong: {
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  em: {
    fontStyle: 'italic',
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 12,
    marginTop: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 10,
    marginTop: 6,
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 8,
    marginTop: 4,
  },
  h4: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 6,
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  li: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1B263B',
    marginBottom: 4,
  },
  a: {
    color: '#1E90FF',
    textDecorationLine: 'underline',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F5F7FA',
    padding: 4,
    borderRadius: 4,
    fontSize: 13,
  },
  pre: {
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E90FF',
    paddingLeft: 12,
    marginBottom: 12,
    color: '#6C7A89',
  },
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
  // Question Card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 18,
    marginBottom: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 12,
    lineHeight: 30,
  },
  questionDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B263B',
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  courseTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E90FF',
    backgroundColor: '#1E90FF10',
  },
  courseTagText: {
    fontSize: 12,
    color: '#1E90FF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3EA',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: 14,
    color: '#6C7A89',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
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
  answerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiButton: {
    flex: 1,
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  aiButtonDisabled: {
    backgroundColor: '#DCE3EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiButtonTextDisabled: {
    color: '#6C7A89',
  },
  aiAnsweredIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DCE3EA',
  },
  aiAnsweredText: {
    fontSize: 12,
    color: '#1E90FF',
    textAlign: 'center',
  },
  // Answers Header
  answersHeader: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  answersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  // Answer Card
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 16,
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
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  avatarInitials: {
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  answerHeaderInfo: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
  },
  answerDate: {
    fontSize: 11,
    color: '#9AA6B5',
  },
  aiBadge: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  answerContent: {
    marginBottom: 12,
  },
  htmlContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1B263B',
  },
  answerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCE3EA',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
  },
  likeIcon: {
    fontSize: 14,
  },
  likeText: {
    fontSize: 12,
    color: '#6C7A89',
    fontWeight: '500',
  },
  // Error State
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  // Empty Answers
  emptyAnswersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyAnswersIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyAnswersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  emptyAnswersSubtitle: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAnswerButton: {
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyAnswerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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

export default QuestionDetailScreen;