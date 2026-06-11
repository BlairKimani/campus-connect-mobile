// services/GroupService.jsx
import axios from 'axios';
import {data} from '../../config';

const BASE_URL = data.BASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Main Functions to Fetch Groups
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch groups from the backend with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Number of items per page (default: 6)
 * @param {string} params.search - Search query (optional)
 * @returns {Promise<Object>} - Returns formatted group data
 */
export const fetchGroups = async ({ 
  page = 1, 
  pageSize = 6, 
  search = null 
} = {}) => {
  try {
    let url = `${BASE_URL}/Groups/api/?page=${page}&page_size=${pageSize}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    console.log('Fetching groups from:', url);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 200 || response.status === 201) {
      if (response.data) {
        const formattedData = formatGroupsData(response.data);
        
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
    console.error('Error fetching groups:', error);
    
    let errorMessage = 'Failed to load groups';
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
          errorMessage = 'You do not have permission to view groups.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Groups endpoint not found.';
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
 * Fetch single group details by ID
 * @param {number|string} groupId - Group ID
 * @returns {Promise<Object>} - Returns formatted group detail data
 */
export const fetchGroupDetails = async (groupId) => {
  if (!groupId) {
    return {
      success: false,
      error: 'Invalid group ID provided',
      errorCode: 'INVALID_ID',
      data: null,
    };
  }

  try {
    const url = `${BASE_URL}/api/groups/${groupId}/`;
    console.log('Fetching group details from:', url);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 200 || response.status === 201) {
      if (response.data) {
        const formattedData = formatGroupDetailData(response.data);
        
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
    console.error('Error fetching group details:', error);
    
    let errorMessage = 'Failed to load group details';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
      errorCode = 'TIMEOUT';
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 404:
          errorMessage = 'Group not found.';
          errorCode = 'NOT_FOUND';
          break;
        case 403:
          errorMessage = 'You do not have permission to view this group.';
          errorCode = 'FORBIDDEN';
          break;
        default:
          errorMessage = error.response.data?.message || `Server error: ${status}`;
          errorCode = `HTTP_${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
    } else {
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
 * Join a group
 * @param {number|string} groupId - Group ID
 * @returns {Promise<Object>} - Returns success status
 */
export const joinGroup = async (groupId) => {
  if (!groupId) {
    return {
      success: false,
      error: 'Invalid group ID provided',
      errorCode: 'INVALID_ID',
    };
  }

  try {
    const url = `${BASE_URL}/api/groups/${groupId}/join/`;
    console.log('Joining group:', url);
    
    const response = await axios.post(url, {}, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } else {
      return {
        success: false,
        error: `Server returned status code ${response.status}`,
        errorCode: `HTTP_${response.status}`,
      };
    }
    
  } catch (error) {
    console.error('Error joining group:', error);
    
    let errorMessage = 'Failed to join group';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.response?.status === 401) {
      errorMessage = 'Please log in to join groups.';
      errorCode = 'UNAUTHORIZED';
    } else if (error.response?.status === 403) {
      errorMessage = 'You are not authorized to join this group.';
      errorCode = 'FORBIDDEN';
    } else if (error.response?.status === 404) {
      errorMessage = 'Group not found.';
      errorCode = 'NOT_FOUND';
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
      errorCode = 'UNKNOWN_ERROR';
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
    };
  }
};

/**
 * Leave a group
 * @param {number|string} groupId - Group ID
 * @returns {Promise<Object>} - Returns success status
 */
export const leaveGroup = async (groupId) => {
  if (!groupId) {
    return {
      success: false,
      error: 'Invalid group ID provided',
      errorCode: 'INVALID_ID',
    };
  }

  try {
    const url = `${BASE_URL}/api/groups/${groupId}/leave/`;
    console.log('Leaving group:', url);
    
    const response = await axios.post(url, {}, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } else {
      return {
        success: false,
        error: `Server returned status code ${response.status}`,
        errorCode: `HTTP_${response.status}`,
      };
    }
    
  } catch (error) {
    console.error('Error leaving group:', error);
    
    let errorMessage = 'Failed to leave group';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.response?.status === 401) {
      errorMessage = 'Please log in to leave groups.';
      errorCode = 'UNAUTHORIZED';
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
      errorCode = 'UNKNOWN_ERROR';
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
    };
  }
};

/**
 * Search groups by name or description
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @returns {Promise<Object>} - Returns search results
 */
export const searchGroups = async (query, page = 1) => {
  if (!query || query.trim() === '') {
    return {
      success: false,
      error: 'Search query is required',
      errorCode: 'INVALID_QUERY',
      data: null,
    };
  }

  return await fetchGroups({ page, search: query.trim() });
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions to Format Data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format groups data from API response
 * @param {Object} rawData - Raw API response
 * @returns {Object} - Formatted groups data
 */
const formatGroupsData = (rawData) => {
  if (!rawData) return null;
  
  const results = rawData.results || [];
  
  const formattedResults = results.map(group => ({
    id: group.id,
    group_id: group.id,
    name: group.name || 'Untitled Group',
    description: group.description || '',
    group_image: group.group_image || null,
    members_count: group.members_count || 0,
  }));
  
  return {
    count: rawData.count || 0,
    next: rawData.next || null,
    previous: rawData.previous || null,
    results: formattedResults,
  };
};

/**
 * Format single group detail data
 * @param {Object} rawData - Raw API response
 * @returns {Object} - Formatted group detail data
 */
const formatGroupDetailData = (rawData) => {
  if (!rawData) return null;
  
  return {
    id: rawData.id,
    group_id: rawData.id,
    name: rawData.name || 'Untitled Group',
    description: rawData.description || '',
    group_image: rawData.group_image || null,
    members_count: rawData.members_count || 0,
    created_at: rawData.created_at,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get error message for display
 * @param {Object} response - API response
 * @returns {string}
 */
export const getErrorMessage = (response) => {
  if (!response) return 'An unknown error occurred';
  if (response.error) return response.error;
  return 'Failed to load groups. Please try again.';
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

/**
 * Get full image URL
 * @param {string} imagePath - Image path from API
 * @returns {string|null} - Full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

/**
 * Format member count for display
 * @param {number} count - Member count
 * @returns {string} - Formatted member count
 */
export const formatMemberCount = (count) => {
  if (!count) return '0 Members';
  if (count === 1) return '1 Member';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k Members`;
  }
  return `${count} Members`;
};

// Export all functions
export default {
  fetchGroups,
  fetchGroupDetails,
  joinGroup,
  leaveGroup,
  searchGroups,
  getErrorMessage,
  retryRequest,
  getFullImageUrl,
  formatMemberCount,
};