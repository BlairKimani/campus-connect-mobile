// services/NoteDetailService.jsx
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { data } from '../../config';

const BASE_URL = data.BASE_URL;

/**
 * Fetch note details from the backend
 * @param {string} noteCode - Unique identifier code of the note
 * @param {string|null} authToken - Optional authentication token for personalized data
 * @returns {Promise<Object>} - Returns formatted note data
 */
export const fetchNoteDetails = async (noteCode, authToken = null) => {
  // Validate input
  if (!noteCode || noteCode === 'undefined' || noteCode === 'unknown') {
    return {
      success: false,
      error: 'Invalid note ID provided',
      errorCode: 'INVALID_ID',
      data: null,
    };
  }

  try {
    const url = `${BASE_URL}/notes/api/notesDetail/${noteCode}/`;
    console.log('Fetching note details from:', url);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add authorization token if provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: headers,
    });
    
    // Check response status
    if (response.status === 200 || response.status === 201) {
      if (response.data && response.data.status === true) {
        // Format the response data
        const formattedData = formatNoteData(response.data);
        
        return {
          success: true,
          data: formattedData,
          rawData: response.data,
          error: null,
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'No data received from server',
          errorCode: 'NO_DATA',
          data: null,
        };
      }
    } else {
      return {
        success: false,
        error: `Server returned status code ${response.status}`,
        errorCode: `HTTP_${response.status}`,
        data: null,
      };
    }
    
  } catch (error) {
    console.error('Error fetching note details:', error);
    
    // Handle different error types
    let errorMessage = 'Failed to load note details';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
      errorCode = 'TIMEOUT';
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid request. Please try again.';
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in to like or rate.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'You do not have permission to view this note.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Note not found. It may have been removed.';
          errorCode = 'NOT_FOUND';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
          break;
        default:
          errorMessage = error.response.data?.error || `Server error: ${status}`;
          errorCode = `HTTP_${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message) {
      if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
        errorCode = 'NETWORK_ERROR';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
        errorCode = 'TIMEOUT';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
        errorCode = 'UNKNOWN_ERROR';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Format note data from API response
 * @param {Object} rawData - Raw API response
 * @returns {Object} - Formatted data for frontend use
 */
const formatNoteData = (rawData) => {
  if (!rawData || !rawData.note) return null;
  
  const note = rawData.note;
  
  // Format courses
  const formattedCourses = (rawData.courses || []).map(course => ({
    id: course.course__course_id,
    name: course.course__course_name,
  }));
  
  // Format images
  const formattedImages = (rawData.images || []).map(image => ({
    id: image.id,
    url: `${BASE_URL}${image.url}`,
    filename: image.filename,
  }));
  
  // Format related notes
  const formattedRelatedNotes = (rawData.related_notes || []).map(relatedNote => ({
    id: relatedNote.note_id,
    code: relatedNote.code,
    title: relatedNote.title,
    description: relatedNote.description,
    views: relatedNote.views,
    downloads: relatedNote.downloads,
    uploaded_at: relatedNote.uploaded_at,
    user: {
      first_name: relatedNote.user__first_name,
      last_name: relatedNote.user__last_name,
    },
  }));
  
  // Format file URL (add base URL if relative)
  let fileUrl = note.file_url;
  if (fileUrl && !fileUrl.startsWith('http')) {
    fileUrl = `${BASE_URL}${fileUrl}`;
  }
  
  // Format likes array
  const likesArray = rawData.likes || [0, false];
  const totalLikes = likesArray[0] || 0;
  const userHasLiked = likesArray[1] === true;
  
  return {
    status: rawData.status === true,
    note: {
      code: note.code,
      title: note.title || 'Untitled Note',
      description: note.description || 'No description available',
      views: note.views || 0,
      downloads: note.downloads || 0,
      file_size: note.file_size || 0,
      file_url: fileUrl,
      filename: note.filename || 'document.pdf',
      created_at: note.created_at,
      user: {
        id: note.user?.id,
        first_name: note.user?.first_name || 'Anonymous',
        last_name: note.user?.last_name || '',
        username: note.user?.username,
        email: note.user?.email,
      },
    },
    related_notes: formattedRelatedNotes,
    rating: rawData.rating || 0,
    rating_count: rawData.rating_count || 0,
    size: rawData.size || 0,
    likes: {
      total: totalLikes,
      user_has_liked: userHasLiked,
    },
    courses: formattedCourses,
    images: formattedImages,
  };
};

/**
 * Download note file using fetch API (Option 1)
 * @param {string} fileUrl - URL of the file to download
 * @param {string} filename - Name to save the file as
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>}
 */
export const downloadNoteFile = async (fileUrl, filename, onProgress) => {
  try {
    console.log('Downloading from:', fileUrl);
    
    // Create the download destination URI
    const downloadDest = `${FileSystem.documentDirectory}${filename}`;
    
    // Download using fetch
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }
    
    // Get the total content length for progress calculation
    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    
    // Read the response as blob
    const blob = await response.blob();
    
    // Convert blob to base64
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          
          // Write the base64 data to file
          await FileSystem.writeAsStringAsync(downloadDest, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Simulate progress completion if we had total bytes
          if (onProgress) {
            onProgress(100);
          }
          
          // Check if sharing is available
          const isSharingAvailable = await Sharing.isAvailableAsync();
          
          if (isSharingAvailable) {
            await Sharing.shareAsync(downloadDest, {
              dialogTitle: `Save ${filename}`,
              mimeType: getMimeType(filename),
            });
          }
          
          resolve({
            success: true,
            uri: downloadDest,
            error: null,
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file data'));
      };
      
      reader.readAsDataURL(blob);
      
      // Simulate progress if we have total bytes (just for visual feedback)
      if (onProgress && totalBytes > 0) {
        // Simulate progress - in reality, fetch doesn't provide granular progress
        // This just gives visual feedback that something is happening
        let simulatedProgress = 0;
        const interval = setInterval(() => {
          if (simulatedProgress < 90) {
            simulatedProgress += 10;
            onProgress(simulatedProgress);
          } else {
            clearInterval(interval);
          }
        }, 200);
        
        // Clear interval when done
        setTimeout(() => clearInterval(interval), 2000);
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message || 'Failed to download file',
      errorCode: 'DOWNLOAD_ERROR',
    };
  }
};

/**
 * Get MIME type based on file extension
 * @param {string} filename - File name
 * @returns {string}
 */
const getMimeType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    txt: 'text/plain',
    md: 'text/markdown',
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Like a note
 * @param {string} noteCode - Note code
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>}
 */
export const likeNote = async (noteCode, authToken) => {
  if (!authToken) {
    return {
      success: false,
      error: 'Authentication required to like notes',
      errorCode: 'UNAUTHORIZED',
    };
  }
  
  try {
    const url = `${BASE_URL}/api/notes/${noteCode}/like/`;
    
    const response = await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } else {
      return {
        success: false,
        error: response.data?.error || 'Failed to like note',
        errorCode: 'LIKE_FAILED',
      };
    }
  } catch (error) {
    console.error('Like error:', error);
    return {
      success: false,
      error: error.message || 'Failed to like note',
      errorCode: 'LIKE_ERROR',
    };
  }
};

/**
 * Rate a note
 * @param {string} noteCode - Note code
 * @param {number} rating - Rating value (1-5)
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>}
 */
export const rateNote = async (noteCode, rating, authToken) => {
  if (!authToken) {
    return {
      success: false,
      error: 'Authentication required to rate notes',
      errorCode: 'UNAUTHORIZED',
    };
  }
  
  try {
    const url = `${BASE_URL}/api/notes/${noteCode}/rate/`;
    
    const response = await axios.post(url, { rating }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } else {
      return {
        success: false,
        error: response.data?.error || 'Failed to rate note',
        errorCode: 'RATE_FAILED',
      };
    }
  } catch (error) {
    console.error('Rate error:', error);
    return {
      success: false,
      error: error.message || 'Failed to rate note',
      errorCode: 'RATE_ERROR',
    };
  }
};

/**
 * Get error message for display
 * @param {Object} response - API response
 * @returns {string}
 */
export const getErrorMessage = (response) => {
  if (!response) return 'An unknown error occurred';
  if (response.error) return response.error;
  return 'Failed to load note details. Please try again.';
};

/**
 * Format file size for display
 * @param {number} sizeInKB - File size in kilobytes
 * @returns {string}
 */
export const formatFileSize = (sizeInKB) => {
  if (!sizeInKB || sizeInKB === 0) return 'Unknown size';
  if (sizeInKB >= 1024) {
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }
  return `${sizeInKB.toFixed(1)} KB`;
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch {
    return 'Unknown date';
  }
};

/**
 * Convert rating to star representation
 * @param {number} rating - Rating value (0-5)
 * @returns {Object} - Full stars, half star, empty stars
 */
export const getStarRating = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return {
    fullStars,
    hasHalfStar,
    emptyStars,
  };
};

// Export all functions
export default {
  fetchNoteDetails,
  downloadNoteFile,
  likeNote,
  rateNote,
  getErrorMessage,
  formatFileSize,
  formatDate,
  getStarRating,
};