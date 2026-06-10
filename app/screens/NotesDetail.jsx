// screens/NoteDetail.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../services/Context';
import { 
  fetchNoteDetails, 
  downloadNoteFile, 
  formatFileSize, 
  formatDate, 
  getErrorMessage,
  getStarRating,
  likeNote,
  rateNote
} from '../services/NoteDetailService';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Components
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ width = "100%", height = 16, radius = 8, style = {} }) => (
  <View style={[styles.skeletonContainer, { width, height, borderRadius: radius }, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

const NoteDetailSkeleton = () => (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    <View style={styles.noteCard}>
      <Skeleton width="80%" height={28} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={80} style={{ marginBottom: 16 }} />
      <Skeleton width="40%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} />
    </View>

    <View style={styles.sectionContainer}>
      <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
      <View style={styles.tagContainer}>
        <Skeleton width={100} height={32} radius={16} />
        <Skeleton width={120} height={32} radius={16} />
        <Skeleton width={90} height={32} radius={16} />
      </View>
    </View>

    <View style={styles.sectionContainer}>
      <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton width={24} height={24} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton width={60} height={14} />
            <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </View>

    <View style={styles.sectionContainer}>
      <Skeleton width="100%" height={60} radius={12} />
    </View>

    <View style={styles.sectionContainer}>
      <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
      <View style={styles.previewContainer}>
        <Skeleton width="100%" height={200} radius={12} />
      </View>
    </View>
  </ScrollView>
);

// ─────────────────────────────────────────────────────────────────────────────
// Course Tag Component
// ─────────────────────────────────────────────────────────────────────────────

const CourseTag = ({ course }) => (
  <View style={styles.courseTag}>
    <Text style={styles.courseTagText}>{course.name}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Statistics Card Component
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Rating Stars Component
// ─────────────────────────────────────────────────────────────────────────────

const RatingStars = ({ rating }) => {
  const { fullStars, hasHalfStar, emptyStars } = getStarRating(rating);
  
  return (
    <View style={styles.ratingContainer}>
      {[...Array(fullStars)].map((_, i) => (
        <Text key={`full-${i}`} style={styles.starFilled}>★</Text>
      ))}
      {hasHalfStar && <Text style={styles.starHalf}>½</Text>}
      {[...Array(emptyStars)].map((_, i) => (
        <Text key={`empty-${i}`} style={styles.starEmpty}>★</Text>
      ))}
      <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Card Component
// ─────────────────────────────────────────────────────────────────────────────

const ErrorCard = ({ onRetry, errorMessage }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Failed to Load Note</Text>
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

const EmptyState = ({ onBackPress }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>Note not found.</Text>
    <Text style={styles.emptySubtitle}>
      The requested note may have been removed or does not exist.
    </Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onBackPress}>
      <Text style={styles.emptyButtonText}>Back to Notes →</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Download Progress Component
// ─────────────────────────────────────────────────────────────────────────────

const DownloadProgress = ({ progress, onCancel }) => (
  <View style={styles.downloadProgressContainer}>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
    <View style={styles.progressInfo}>
      <Text style={styles.progressText}>Downloading... {progress}% Complete</Text>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Related Note Card Component
// ─────────────────────────────────────────────────────────────────────────────

const RelatedNoteCard = ({ note, onPress }) => {
  const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity style={styles.relatedNoteCard} onPress={() => onPress(note.code)}>
      <Text style={styles.relatedNoteTitle} numberOfLines={2}>{note.title}</Text>
      <Text style={styles.relatedNoteDescription} numberOfLines={2}>{note.description}</Text>
      <View style={styles.relatedNoteStats}>
        <Text style={styles.relatedNoteStat}>👁 {note.views}</Text>
        <Text style={styles.relatedNoteStat}>⬇ {note.downloads}</Text>
      </View>
      <Text style={styles.relatedNoteAuthor}>
        By {note.user.first_name} {note.user.last_name}
      </Text>
      <Text style={styles.relatedNoteDate}>{formatRelativeDate(note.uploaded_at)}</Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Note Detail Screen Component
// ─────────────────────────────────────────────────────────────────────────────

const NoteDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getAuthToken } = useAuth();
  
  const [noteData, setNoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Load note data
  const loadNoteData = async () => {
    if (!id) {
      setHasError(true);
      setErrorMessage('Invalid note ID');
      setLoading(false);
      return;
    }
    
    try {
      const authToken = await getAuthToken();
      const response = await fetchNoteDetails(id, authToken);
      
      if (response.success && response.data) {
        setNoteData(response.data);
      } else {
        setHasError(true);
        setErrorMessage(getErrorMessage(response));
      }
    } catch (error) {
      console.error('Error loading note:', error);
      setHasError(true);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNoteData();
  };
  
  // Handle retry
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    loadNoteData();
  };
  
  // Handle back to notes
  const handleBackToNotes = () => {
    router.back();
  };
  
  // Handle download - Option 1
  const handleDownload = async () => {
    if (!noteData?.note?.file_url) {
      Alert.alert('Error', 'No file available for download');
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const filename = noteData.note.filename;
    
    // Show immediate feedback
    Alert.alert(
      'Download Started',
      `Downloading "${filename}"...`,
      [{ text: 'OK' }],
      { cancelable: false }
    );
    
    const result = await downloadNoteFile(
      noteData.note.file_url,
      filename,
      (progress) => {
        setDownloadProgress(progress);
        if (progress % 10 === 0 || progress === 100) {
          console.log(`Download progress: ${progress}%`);
        }
      }
    );
    
    if (result.success) {
      Alert.alert('Success', `"${filename}" downloaded successfully!`);
    } else {
      Alert.alert('Download Failed', result.error);
    }
    
    // Reset download state after a delay
    setTimeout(() => {
      setDownloading(false);
      setDownloadProgress(0);
    }, 1500);
  };
  
  // Handle like
  const handleLike = async () => {
    const authToken = await getAuthToken();
    if (!authToken) {
      Alert.alert('Authentication Required', 'Please log in to like notes');
      router.push('/login');
      return;
    }
    
    setIsLiking(true);
    const result = await likeNote(id, authToken);
    setIsLiking(false);
    
    if (result.success) {
      // Refresh note data to get updated like status
      await loadNoteData();
    } else {
      Alert.alert('Error', result.error);
    }
  };
  
  // Handle related note press
  const handleRelatedNotePress = (noteCode) => {
    router.push({
      pathname: '/note-detail',
      params: { id: noteCode }
    });
  };
  
  // Initial load
  useEffect(() => {
    loadNoteData();
  }, [id]);
  
  // Loading state
  if (loading && !refreshing) {
    return <NoteDetailSkeleton />;
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
  
  // Empty state
  if (!noteData && !loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E90FF']} />
        }
      >
        <EmptyState onBackPress={handleBackToNotes} />
      </ScrollView>
    );
  }
  
  // Success state
  const { note, related_notes, rating, rating_count, likes, courses, images } = noteData;
  
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E90FF']} />
      }
    >
      {/* Note Information Card */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>{note.title}</Text>
        <Text style={styles.noteDescription}>{note.description}</Text>
        
        <View style={styles.uploaderInfo}>
          <Text style={styles.uploaderText}>
            Uploaded by {note.user.first_name} {note.user.last_name}
          </Text>
          <Text style={styles.uploaderDate}>
            Uploaded on {formatDate(note.created_at)}
          </Text>
        </View>
      </View>
      
      {/* Related Courses Section */}
      {courses && courses.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Related Courses</Text>
          <View style={styles.tagContainer}>
            {courses.map((course, index) => (
              <CourseTag key={index} course={course} />
            ))}
          </View>
        </View>
      )}
      
      {/* Statistics Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="📁" label="File Size" value={formatFileSize(note.file_size)} />
          <StatCard icon="⬇" label="Downloads" value={note.downloads} />
          <StatCard icon="👁" label="Views" value={note.views} />
          <StatCard icon="❤️" label="Likes" value={likes.total} />
        </View>
      </View>
      
      {/* Rating Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Rating</Text>
        <View style={styles.ratingCard}>
          <RatingStars rating={rating} />
          <Text style={styles.ratingCount}>({rating_count} ratings)</Text>
        </View>
      </View>
      
      {/* Like Button */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={[styles.likeButton, likes.user_has_liked && styles.likeButtonActive]}
          onPress={handleLike}
          disabled={isLiking}
        >
          <Text style={styles.likeIcon}>❤️</Text>
          <Text style={[styles.likeButtonText, likes.user_has_liked && styles.likeButtonTextActive]}>
            {likes.user_has_liked ? 'Liked' : 'Like this note'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Download Section */}
      <View style={styles.sectionContainer}>
        {downloading ? (
          <DownloadProgress 
            progress={downloadProgress} 
            onCancel={() => {
              setDownloading(false);
              setDownloadProgress(0);
            }}
          />
        ) : (
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.downloadButtonText}>Download Notes</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Preview Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewContainer}>
          {images && images.length > 0 ? (
            <>
              <Text style={styles.previewEmoji}>📸</Text>
              <Text style={styles.previewTitle}>{images.length} Preview Image{images.length !== 1 ? 's' : ''}</Text>
              <Text style={styles.previewSubtitle}>
                Download the file to view full content
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.previewEmoji}>📄</Text>
              <Text style={styles.previewTitle}>Document Preview</Text>
              <Text style={styles.previewSubtitle}>
                Download the file to view full content
              </Text>
            </>
          )}
          {note.filename && (
            <View style={styles.fileTypeBadge}>
              <Text style={styles.fileTypeText}>{note.filename.split('.').pop().toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Related Notes Section */}
      {related_notes && related_notes.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>You Might Also Like</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
            {related_notes.map((relatedNote) => (
              <RelatedNoteCard 
                key={relatedNote.id} 
                note={relatedNote} 
                onPress={handleRelatedNotePress}
              />
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.bottomSpacer} />
    </ScrollView>
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
    flexGrow: 1,
    paddingBottom: 30,
  },
  // Note Card
  noteCard: {
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
  noteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 12,
    lineHeight: 32,
  },
  noteDescription: {
    fontSize: 16,
    color: '#1B263B',
    lineHeight: 24,
    marginBottom: 16,
  },
  uploaderInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DCE3EA',
  },
  uploaderText: {
    fontSize: 13,
    color: '#1E90FF',
    fontWeight: '500',
    marginBottom: 4,
  },
  uploaderDate: {
    fontSize: 12,
    color: '#9AA6B5',
  },
  // Section Container
  sectionContainer: {
    marginHorizontal: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 12,
  },
  // Course Tags
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseTag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E90FF',
    backgroundColor: '#1E90FF10',
  },
  courseTagText: {
    fontSize: 13,
    color: '#1E90FF',
    fontWeight: '500',
  },
  // Statistics Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2 - 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE3EA',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6C7A89',
  },
  // Rating Section
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starFilled: {
    fontSize: 22,
    color: '#FFB800',
  },
  starHalf: {
    fontSize: 20,
    color: '#FFB800',
  },
  starEmpty: {
    fontSize: 22,
    color: '#DCE3EA',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B2A',
    marginLeft: 8,
  },
  ratingCount: {
    fontSize: 13,
    color: '#6C7A89',
  },
  // Like Button
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    borderRadius: 16,
    paddingVertical: 14,
  },
  likeButtonActive: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF6B6B',
  },
  likeIcon: {
    fontSize: 20,
  },
  likeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C7A89',
  },
  likeButtonTextActive: {
    color: '#E74C3C',
  },
  // Download Section
  downloadButton: {
    backgroundColor: '#0D1B2A',
    paddingVertical: 16,
    borderRadius: 16,
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
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadProgressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE3EA',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#DCE3EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1E90FF',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '500',
  },
  // Preview Section
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE3EA',
    minHeight: 200,
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
    marginBottom: 16,
  },
  fileTypeBadge: {
    backgroundColor: '#1E90FF10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E90FF',
  },
  fileTypeText: {
    fontSize: 12,
    color: '#1E90FF',
    fontWeight: '600',
  },
  // Related Notes
  relatedScroll: {
    marginTop: 8,
  },
  relatedNoteCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DCE3EA',
  },
  relatedNoteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 6,
  },
  relatedNoteDescription: {
    fontSize: 12,
    color: '#6C7A89',
    marginBottom: 10,
    lineHeight: 16,
  },
  relatedNoteStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  relatedNoteStat: {
    fontSize: 11,
    color: '#9AA6B5',
  },
  relatedNoteAuthor: {
    fontSize: 11,
    color: '#1E90FF',
    fontWeight: '500',
    marginBottom: 4,
  },
  relatedNoteDate: {
    fontSize: 10,
    color: '#9AA6B5',
  },
  bottomSpacer: {
    height: 30,
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
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
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

export default NoteDetail;