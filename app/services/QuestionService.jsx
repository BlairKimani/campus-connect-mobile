// services/QuestionService.jsx
import axios from 'axios';
import { data } from '../../config';

const BASE_URL = data.BASE_URL;

/**
 * Load questions from the API with various filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {string} params.request_type - Type of request (trending, unanswered, answered, tag, latest)
 * @param {string} params.tag - Tag/course name (required if request_type is 'tag')
 * @param {string} params.course - Course name (optional filter)
 * @returns {Promise<Object>} - Returns the API response data
 */
export const loadQuestions = async ({ 
  page = 1, 
  request_type = 'latest', 
  tag = null, 
  course = null 
} = {}) => {
  // Validate inputs
  if (!page || page < 1) {
    return {
      success: false,
      error: 'Invalid page number. Page must be greater than 0.',
      data: null,
      status: false,
      page: 1,
      questions: [],
    };
  }

  if (request_type === 'tag' && !tag) {
    return {
      success: false,
      error: 'Tag parameter is required when request_type is "tag"',
      data: null,
      status: false,
      page: page,
      questions: [],
    };
  }

  try {
    // Build the URL with required parameters
    let url = `${BASE_URL}/question-answer/api/load/questions?`;
    
    // Add page (always required)
    url += `page=${page}`;
    
    // Add request_type if provided
    if (request_type) {
      url += `&request=${request_type}`;
    }
    
    // If request_type is 'tag', add the tag parameter
    if (request_type === 'tag' && tag) {
      url += `&tag=${encodeURIComponent(tag)}`;
    }
    
    // Add course filter if provided
    if (course) {
      url += `&course=${encodeURIComponent(course)}`;
    }
    
    console.log('Fetching questions from:', url);
    
    const response = await axios.get(url, {
      timeout: 15000, // Increased to 15 seconds for slow connections
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Check response status
    if (response.status === 200 || response.status === 201) {
      // Ensure we always return a consistent object structure
      if (response && response.data) {
        // Validate response data structure
        const questions = Array.isArray(response.data.questions) ? response.data.questions : [];
        
        return {
          success: true,
          data: response.data,
          status: response.data.status === true,
          page: response.data.page || page,
          questions: questions,
          totalCount: questions.length,
          hasMore: response.data.status === true,
          error: null,
        };
      } else {
        return {
          success: false,
          error: 'No data received from server',
          data: null,
          status: false,
          page: page,
          questions: [],
          totalCount: 0,
          hasMore: false,
          errorCode: 'NO_DATA',
        };
      }
    } else {
      return {
        success: false,
        error: `Server returned status code ${response.status}`,
        data: null,
        status: false,
        page: page,
        questions: [],
        totalCount: 0,
        hasMore: false,
        errorCode: `HTTP_${response.status}`,
      };
    }
    
  } catch (error) {
    console.error('Error loading questions:', error);
    
    // Handle different error types with specific messages
    let errorMessage = 'Failed to load questions';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
      errorCode = 'TIMEOUT';
    } else if (error.response) {
      // Server responded with error status
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
          errorMessage = 'You do not have permission to access these questions.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Questions endpoint not found. Please check your configuration.';
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
      // Request was made but no response
      errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message) {
      // Something else happened
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
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Load questions by specific tag
 * @param {string} tag - Tag/course name
 * @param {number} page - Page number
 * @returns {Promise<Object>}
 */
export const loadQuestionsByTag = async (tag, page = 1) => {
  if (!tag || tag.trim() === '') {
    return {
      success: false,
      error: 'Tag parameter is required and cannot be empty',
      errorCode: 'INVALID_TAG',
      data: null,
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
  
  // Sanitize tag input
  const sanitizedTag = tag.trim();
  
  try {
    return await loadQuestions({ page, request_type: 'tag', tag: sanitizedTag });
  } catch (error) {
    console.error('Error in loadQuestionsByTag:', error);
    return {
      success: false,
      error: 'Failed to load questions by tag',
      errorCode: 'TAG_LOAD_ERROR',
      data: null,
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

/**
 * Load trending questions
 * @param {number} page - Page number
 * @returns {Promise<Object>}
 */
export const loadTrendingQuestions = async (page = 1) => {
  try {
    return await loadQuestions({ page, request_type: 'trending' });
  } catch (error) {
    console.error('Error in loadTrendingQuestions:', error);
    return {
      success: false,
      error: 'Failed to load trending questions',
      errorCode: 'TRENDING_LOAD_ERROR',
      data: null,
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

/**
 * Load unanswered questions
 * @param {number} page - Page number
 * @returns {Promise<Object>}
 */
export const loadUnansweredQuestions = async (page = 1) => {
  try {
    return await loadQuestions({ page, request_type: 'unanswered' });
  } catch (error) {
    console.error('Error in loadUnansweredQuestions:', error);
    return {
      success: false,
      error: 'Failed to load unanswered questions',
      errorCode: 'UNANSWERED_LOAD_ERROR',
      data: null,
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

/**
 * Load answered questions
 * @param {number} page - Page number
 * @returns {Promise<Object>}
 */
export const loadAnsweredQuestions = async (page = 1) => {
  try {
    return await loadQuestions({ page, request_type: 'answered' });
  } catch (error) {
    console.error('Error in loadAnsweredQuestions:', error);
    return {
      success: false,
      error: 'Failed to load answered questions',
      errorCode: 'ANSWERED_LOAD_ERROR',
      data: null,
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

/**
 * Load latest questions
 * @param {number} page - Page number
 * @returns {Promise<Object>}
 */
export const loadLatestQuestions = async (page = 1) => {
  try {
    return await loadQuestions({ page, request_type: 'latest' });
  } catch (error) {
    console.error('Error in loadLatestQuestions:', error);
    return {
      success: false,
      error: 'Failed to load latest questions',
      errorCode: 'LATEST_LOAD_ERROR',
      data: null,
      status: false,
      page: page,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

/**
 * Load questions with multiple filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export const loadFilteredQuestions = async (filters) => {
  try {
    return await loadQuestions(filters);
  } catch (error) {
    console.error('Error in loadFilteredQuestions:', error);
    return {
      success: false,
      error: 'Failed to load filtered questions',
      errorCode: 'FILTERED_LOAD_ERROR',
      data: null,
      status: false,
      page: filters.page || 1,
      questions: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

/**
 * Get next page of questions
 * @param {Object} currentResponse - Current API response
 * @param {Object} currentParams - Current parameters used
 * @returns {Promise<Object>}
 */
export const loadNextPage = async (currentResponse, currentParams) => {
  if (!currentResponse || !currentParams) {
    return {
      success: false,
      error: 'Invalid parameters for loading next page',
      errorCode: 'INVALID_NEXT_PAGE_PARAMS',
      data: null,
      status: false,
      questions: [],
    };
  }
  
  const nextPage = (currentResponse.page || currentParams.page || 1) + 1;
  
  try {
    return await loadQuestions({
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
      status: false,
      questions: [],
    };
  }
};

/**
 * Check if there are more questions to load
 * @param {Object} response - API response
 * @returns {boolean}
 */
export const hasMoreQuestions = (response) => {
  if (!response) return false;
  return response.hasMore === true || (response.questions && response.questions.length > 0 && response.status === true);
};

/**
 * Get error message for display
 * @param {Object} response - API response
 * @returns {string}
 */
export const getErrorMessage = (response) => {
  if (!response) return 'An unknown error occurred';
  if (response.error) return response.error;
  if (response.data?.message) return response.data.message;
  return 'Failed to load questions. Please try again.';
};

/**
 * Retry failed request with exponential backoff
 * @param {Function} requestFn - The request function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise<Object>}
 */
export const retryRequest = async (requestFn, maxRetries = 3, initialDelay = 1000) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
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