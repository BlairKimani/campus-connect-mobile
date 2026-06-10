// services/NoteService.js
import axios from 'axios';
import { data } from '../../config';

const BASE_URL = data.BASE_URL;

/**
 * Load courses from the backend
 * @returns {Promise<Object>} - Returns formatted courses data
 */
export const loadCourses = async () => {
  try {
    const url = `${BASE_URL}/notes/api/courses/`;
    console.log('Fetching courses from:', url);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 200 || response.status === 201) {
      if (response.data) {
        const formattedData = formatCoursesData(response.data);
        
        return {
          success: true,
          data: formattedData,
          rawData: response.data,
          error: null,
        };
      } else {
        return {
          success: false,
          error: 'No data received from server',
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
    console.error('Error loading courses:', error);
    
    let errorMessage = 'Failed to load courses';
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
          errorMessage = 'Authentication required. Please log in.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'You do not have permission to view courses.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Courses endpoint not found.';
          errorCode = 'NOT_FOUND';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
          break;
        default:
          errorMessage = error.response.data?.message || `Server error: ${status}`;
          errorCode = `HTTP_${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message) {
      errorMessage = error.message || 'An unexpected error occurred';
      errorCode = 'UNKNOWN_ERROR';
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
 * Format courses data from API response
 * @param {Object} rawData - Raw API response
 * @returns {Object} - Formatted data
 */
const formatCoursesData = (rawData) => {
  if (!rawData) return null;
  
  let formattedCourses = [];
  if (rawData.courses && Array.isArray(rawData.courses)) {
    formattedCourses = rawData.courses.map(course => ({
      id: course.course_id,
      name: course.course_name,
    }));
  }
  
  return {
    status: rawData.status === true,
    count: rawData.count || 0,
    courses: formattedCourses,
  };
};

/**
 * Load notes from the home data endpoint
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (0-indexed, default: 0)
 * @param {string} params.request - Request type ('downloads' for most downloaded, null for default)
 * @param {string} params.course - Course name filter (optional)
 * @returns {Promise<Object>} - Returns formatted response data
 */
export const loadHomeData = async ({ page = 0, request = null, course = null } = {}) => {
  // Validate page number
  if (page === undefined || page === null || page < 0) {
    page = 0;
  }

  try {
    // Build the URL with parameters
    let url = `${BASE_URL}/notes/api/load-notes/?page=${page}`;
    
    // Add request type if provided
    if (request && request === 'downloads') {
      url += `&request=downloads`;
    }
    
    // Add course filter if provided (using course_name for filtering)
    if (course && course.trim() !== '') {
      url += `&course=${encodeURIComponent(course.trim())}`;
    }
    
    console.log('Fetching notes from:', url);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Check response status
    if (response.status === 200 || response.status === 201) {
      if (response.data) {
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
          error: 'No data received from server',
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
    console.error('Error loading notes:', error);
    
    // Handle different error types
    let errorMessage = 'Failed to load notes';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
      errorCode = 'TIMEOUT';
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid request parameters. Please try again.';
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'You do not have permission to view these notes.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Notes endpoint not found.';
          errorCode = 'NOT_FOUND';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
          break;
        case 503:
          errorMessage = 'Service unavailable. Please try again later.';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = error.response.data?.message || `Server error: ${status}`;
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
 * @returns {Object} - Formatted data
 */
const formatNoteData = (rawData) => {
  if (!rawData) return null;
  
  // Format notes array
  let formattedNotes = [];
  if (rawData.notes && Array.isArray(rawData.notes)) {
    formattedNotes = rawData.notes.map(note => ({
      id: note.code,
      code: note.code,
      title: note.title || 'Untitled Note',
      description: note.description || 'No description available',
      views: note.views || 0,
      downloads: note.downloads || 0,
      uploaded_at: note.uploaded_at,
      user: {
        first_name: note.user__first_name || 'Anonymous',
        last_name: note.user__last_name || '',
      },
      courses: note.courses || [],
    }));
  }
  
  return {
    status: rawData.status === true,
    page: rawData.page || 0,
    notes: formattedNotes,
    hasMore: rawData.status === true,
    totalNotes: formattedNotes.length,
  };
};

/**
 * Load next page of notes
 * @param {Object} currentData - Current page data
 * @param {Object} currentParams - Current parameters used
 * @returns {Promise<Object>}
 */
export const loadNextPage = async (currentData, currentParams) => {
  if (!currentData || !currentParams) {
    return {
      success: false,
      error: 'Invalid parameters for loading next page',
      errorCode: 'INVALID_NEXT_PAGE_PARAMS',
      data: null,
    };
  }
  
  const nextPage = (currentData.page || currentParams.page || 0) + 1;
  
  try {
    return await loadHomeData({
      ...currentParams,
      page: nextPage,
    });
  } catch (error) {
    console.error('Error in loadNextPage:', error);
    return {
      success: false,
      error: 'Failed to load next page',
      errorCode: 'NEXT_PAGE_ERROR',
      data: null,
    };
  }
};

/**
 * Check if there are more notes to load
 * @param {Object} response - API response
 * @returns {boolean}
 */
export const hasMoreNotes = (response) => {
  if (!response) return false;
  return response.data?.hasMore === true;
};

/**
 * Get error message for display
 * @param {Object} response - API response
 * @returns {string}
 */
export const getErrorMessage = (response) => {
  if (!response) return 'An unknown error occurred';
  if (response.error) return response.error;
  if (response.data?.error) return response.data.error;
  return 'Failed to load notes. Please try again.';
};

/**
 * Retry failed request with exponential backoff
 * @param {Function} requestFn - The request function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise<Object>}
 */
export const retryLoadHomeData = async (params, maxRetries = 3, initialDelay = 1000) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await loadHomeData(params);
      if (result.success) {
        return result;
      }
      lastError = result;
    } catch (error) {
      lastError = {
        success: false,
        error: error.message || 'Request failed',
        errorCode: 'RETRY_ERROR',
      };
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    ...lastError,
    error: `Failed after ${maxRetries} attempts: ${lastError?.error || 'Unknown error'}`,
    errorCode: 'MAX_RETRIES_EXCEEDED',
  };
};

// Export all functions
export default {
  loadCourses,
  loadHomeData,
  loadNextPage,
  hasMoreNotes,
  getErrorMessage,
  retryLoadHomeData,
};