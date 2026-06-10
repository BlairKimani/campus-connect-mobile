// screens/NotesScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loadCourses, loadHomeData, getErrorMessage } from '../services/NoteService';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ width = "100%", height = 16, radius = 8, style = {} }) => (
  <View style={[styles.skeletonContainer, { width, height, borderRadius: radius }, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

const NoteCardSkeleton = () => (
  <View style={styles.noteCard}>
    <Skeleton width="100%" height={100} radius={12} style={{ marginBottom: 12 }} />
    <Skeleton width="90%" height={18} style={{ marginBottom: 8 }} />
    <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={14} style={{ marginBottom: 12 }} />
    <View style={styles.tagContainer}>
      <Skeleton width={80} height={24} radius={12} />
      <Skeleton width={100} height={24} radius={12} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton width={60} height={14} />
      <Skeleton width={50} height={14} />
    </View>
    <View style={styles.footerRow}>
      <Skeleton width={80} height={12} />
      <Skeleton width={60} height={12} />
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Course Dropdown Component
// ─────────────────────────────────────────────────────────────────────────────

const CourseDropdown = ({ selectedCourseId, selectedCourseName, onSelectCourse, courses, loadingCourses }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [localCourses, setLocalCourses] = useState([]);

  useEffect(() => {
    if (courses && courses.length > 0) {
      setLocalCourses([{ id: null, name: 'All Courses' }, ...courses]);
    }
  }, [courses]);

  const displayName = selectedCourseName || 'All Courses';

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>Filter by Course</Text>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>{displayName}</Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Course</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingCourses ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.modalLoadingText}>Loading courses...</Text>
              </View>
            ) : (
              <FlatList
                data={localCourses}
                keyExtractor={(item) => item.id?.toString() || 'all'}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      selectedCourseId === item.id && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      onSelectCourse(item.id, item.name);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedCourseId === item.id && styles.modalItemTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    {selectedCourseId === item.id && (
                      <Text style={styles.modalItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sort Button Component
// ─────────────────────────────────────────────────────────────────────────────

const SortButton = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.sortButton, isActive && styles.sortButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.sortButtonText, isActive && styles.sortButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// Note Card Component
// ─────────────────────────────────────────────────────────────────────────────

const NoteCard = React.memo(({ note, onPress }) => {
  const [pressed, setPressed] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Unknown date';
    }
  };

  const authorName = note.user?.first_name && note.user?.last_name
    ? `${note.user.first_name} ${note.user.last_name}`
    : note.user?.first_name || 'Anonymous';

  const courses = note.courses || [];

  return (
    <TouchableOpacity
      style={[styles.noteCard, pressed && styles.cardPressed]}
      onPress={() => onPress(note.id)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      {/* Thumbnail/Image Placeholder */}
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.cardImageEmoji}>📄</Text>
      </View>
      
      {/* Title */}
      <Text style={styles.noteTitle} numberOfLines={2}>
        {note.title}
      </Text>
      
      {/* Description */}
      <Text style={styles.noteDescription} numberOfLines={3}>
        {note.description}
      </Text>
      
      {/* Course Tags */}
      {courses.length > 0 && (
        <View style={styles.tagContainer}>
          {courses.slice(0, 2).map((course, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{course}</Text>
            </View>
          ))}
          {courses.length > 2 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{courses.length - 2}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⬇</Text>
          <Text style={styles.statText}>{note.downloads}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👁</Text>
          <Text style={styles.statText}>{note.views}</Text>
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.authorText} numberOfLines={1}>
          {authorName}
        </Text>
        <Text style={styles.dateText}>
          {formatDate(note.uploaded_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Error Card Component
// ─────────────────────────────────────────────────────────────────────────────

const ErrorCard = ({ onRetry, errorMessage }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Failed to Load Notes</Text>
    <Text style={styles.errorMessage}>
      {errorMessage || 'Unable to connect to the server. Please check your internet connection.'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Tap to Retry →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📚</Text>
    <Text style={styles.emptyTitle}>No Notes Available</Text>
    <Text style={styles.emptySubtitle}>
      There are currently no uploaded notes for this selection.
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Load More Button Component
// ─────────────────────────────────────────────────────────────────────────────

const LoadMoreButton = ({ onPress, isLoading, hasMore }) => {
  if (!hasMore && !isLoading) {
    return (
      <View style={styles.endOfListContainer}>
        <Text style={styles.endOfListText}>No more notes available</Text>
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
        {isLoading ? 'Loading More...' : 'Load More Notes'}
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Notes Screen Component
// ─────────────────────────────────────────────────────────────────────────────

const NotesScreen = () => {
  const router = useRouter();
  const flatListRef = useRef(null);
  
  // State for notes
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State for courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseName, setSelectedCourseName] = useState(null);
  const [requestType, setRequestType] = useState(null); // 'downloads' or null
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotes, setTotalNotes] = useState(0);
  
  // Track filter changes for key reset
  const [filterKey, setFilterKey] = useState(0);
  
  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await loadCourses();
      
      if (response.success && response.data) {
        setCourses(response.data.courses);
      } else {
        console.error('Failed to load courses:', response.error);
        // Set empty courses array to avoid breaking the UI
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };
  
  // Load notes from backend using NoteService
  const loadNotes = async (page = 0, append = false, course = selectedCourseName, sortRequest = requestType) => {
    try {
      const response = await loadHomeData({
        page: page,
        request: sortRequest,
        course: course,
      });
      
      if (response.success && response.data) {
        const newNotes = response.data.notes || [];
        
        if (append) {
          setNotes(prev => [...prev, ...newNotes]);
        } else {
          setNotes(newNotes);
        }
        
        setCurrentPage(response.data.page);
        setHasMore(response.data.hasMore);
        setTotalNotes(append ? totalNotes + newNotes.length : newNotes.length);
        
        return true;
      } else {
        setHasError(true);
        setErrorMessage(getErrorMessage(response));
        return false;
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setHasError(true);
      setErrorMessage('An unexpected error occurred. Please try again.');
      return false;
    }
  };
  
  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    setHasError(false);
    setCurrentPage(0);
    setHasMore(true);
    
    const success = await loadNotes(0, false, selectedCourseName, requestType);
    setLoading(false);
    return success;
  };
  
  // Load more notes
  const loadMoreNotes = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    await loadNotes(nextPage, true, selectedCourseName, requestType);
    setLoadingMore(false);
  };
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setHasError(false);
    await loadInitialData();
    setRefreshing(false);
  };
  
  // Handle course selection
  const handleCourseSelect = (courseId, courseName) => {
    setSelectedCourseId(courseId);
    setSelectedCourseName(courseName);
    setCurrentPage(0);
    setHasMore(true);
    // Update key to force FlatList re-render
    setFilterKey(prev => prev + 1);
    loadInitialData();
  };
  
  // Handle sort change
  const handleSortChange = (sortType) => {
    const newRequestType = sortType === 'downloads' ? 'downloads' : null;
    setRequestType(newRequestType);
    setCurrentPage(0);
    setHasMore(true);
    // Update key to force FlatList re-render
    setFilterKey(prev => prev + 1);
    loadInitialData();
  };
  
  // Handle retry
  const handleRetry = () => {
    loadInitialData();
  };
  
  // Handle note press
  const handleNotePress = (noteId) => {
    router.push({
      pathname: '/screens/NotesDetail',
      params: { id: noteId }
    });
  };
  
  // Initial load
  useEffect(() => {
    fetchCourses();
    loadInitialData();
  }, []);
  
  // Render header
  const renderHeader = () => (
    <>
      {/* Page Title Section */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Notes & Handouts</Text>
        <Text style={styles.pageSubtitle}>
          Access lecture notes, revision materials, handouts, and study resources shared by students.
        </Text>
      </View>
      
      {/* Course Dropdown */}
      <CourseDropdown
        selectedCourseId={selectedCourseId}
        selectedCourseName={selectedCourseName}
        onSelectCourse={handleCourseSelect}
        courses={courses}
        loadingCourses={loadingCourses}
      />
      
      {/* Sort Buttons */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort By</Text>
        <View style={styles.sortButtons}>
          <SortButton
            label="Latest"
            isActive={requestType === null}
            onPress={() => handleSortChange('latest')}
          />
          <SortButton
            label="Most Downloaded"
            isActive={requestType === 'downloads'}
            onPress={() => handleSortChange('downloads')}
          />
        </View>
      </View>
      
      {/* Results Count */}
      {!loading && !hasError && notes.length > 0 && (
        <Text style={styles.resultsCount}>
          {totalNotes} note{totalNotes !== 1 ? 's' : ''} available
        </Text>
      )}
    </>
  );
  
  // Render footer (Load More button)
  const renderFooter = () => {
    if (loading || hasError) return null;
    if (notes.length === 0) return null;
    
    return (
      <LoadMoreButton
        onPress={loadMoreNotes}
        isLoading={loadingMore}
        hasMore={hasMore}
      />
    );
  };
  
  // Render empty state
  const renderEmptyComponent = () => {
    if (loading || hasError) return null;
    if (notes.length === 0) {
      return <EmptyState />;
    }
    return null;
  };
  
  // Loading skeleton state
  if (loading && !refreshing) {
    return (
      <FlatList
        key={`skeleton-${filterKey}`}
        data={[1, 2, 3, 4, 5, 6]}
        renderItem={() => <NoteCardSkeleton />}
        keyExtractor={(item) => `skeleton-${item}`}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />
    );
  }
  
  // Error state
  if (hasError && !loading && notes.length === 0) {
    return (
      <FlatList
        key={`error-${filterKey}`}
        data={[]}
        renderItem={() => null}
        keyExtractor={() => 'error'}
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
      ref={flatListRef}
      key={`notes-list-${filterKey}`}
      data={notes}
      renderItem={({ item }) => <NoteCard note={item} onPress={handleNotePress} />}
      keyExtractor={(item, index) => `${item.id}-${index}`}
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
      onEndReached={loadMoreNotes}
      onEndReachedThreshold={0.3}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={10}
      removeClippedSubviews={true}
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
  // Dropdown
  dropdownContainer: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#1B263B',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6C7A89',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
  },
  modalClose: {
    fontSize: 20,
    color: '#6C7A89',
    fontWeight: '600',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    color: '#6C7A89',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  modalItemSelected: {
    backgroundColor: '#1E90FF10',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1B263B',
  },
  modalItemTextSelected: {
    color: '#1E90FF',
    fontWeight: '600',
  },
  modalItemCheck: {
    fontSize: 16,
    color: '#1E90FF',
    fontWeight: '600',
  },
  // Sort Section
  sortContainer: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sortButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EA',
  },
  sortButtonActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#6C7A89',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  // Results Count
  resultsCount: {
    paddingHorizontal: 18,
    marginBottom: 12,
    fontSize: 13,
    color: '#6C7A89',
  },
  // Note Card
  noteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
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
  cardImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardImageEmoji: {
    fontSize: 40,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 6,
    lineHeight: 20,
  },
  noteDescription: {
    fontSize: 12,
    color: '#6C7A89',
    lineHeight: 16,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E90FF',
    backgroundColor: '#1E90FF10',
  },
  tagText: {
    fontSize: 10,
    color: '#1E90FF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#DCE3EA',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 11,
  },
  statText: {
    fontSize: 11,
    color: '#6C7A89',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 10,
    color: '#1E90FF',
    fontWeight: '500',
    flex: 1,
  },
  dateText: {
    fontSize: 10,
    color: '#9AA6B5',
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
  endOfListContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  endOfListText: {
    fontSize: 13,
    color: '#9AA6B5',
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

export default NotesScreen;