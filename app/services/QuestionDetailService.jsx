// services/QuestionDetailService.jsx
import axios from 'axios';
import { Platform } from 'react-native';
import { data } from '../../config';

const BASE_URL = data.BASE_URL;
// ─────────────────────────────────────────────────────────────────────────────
// HTML Processing Utility for Images
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process HTML content and replace img tags with actual image URLs
 * @param {string} html - Original HTML string
 * @param {Array} images - Array of image URLs from the API
 * @returns {string} - Processed HTML with proper image URLs
 */
export const processHtmlImages = (html, images = []) => {
  if (!html) return html;
  
  let processedHtml = html;
  
  // Find all img tags in the HTML
  const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
  const imgMatches = [...html.matchAll(imgRegex)];
  
  // If there are img tags and we have images array, replace them
  if (imgMatches.length > 0 && images.length > 0) {
    images.forEach((imageUrl, index) => {
      if (index < imgMatches.length) {
        // Construct full image URL
        const fullImageUrl = `${BASE_URL}${imageUrl}`;
        
        // Replace the img tag with a properly formatted one
        const newImgTag = `<img src="${fullImageUrl}" style="width: 100%; max-width: 100%; height: auto; border-radius: 12px; marginVertical: 8px;" />`;
        processedHtml = processedHtml.replace(imgMatches[index][0], newImgTag);
      }
    });
  }
  
  // If there are img tags but no images array, remove them or replace with placeholder
  if (imgMatches.length > 0 && images.length === 0) {
    processedHtml = processedHtml.replace(imgRegex, '<p>📷 <em>Image not available</em></p>');
  }
  
  return processedHtml;
};

/**
 * Extract image URLs from HTML content
 * @param {string} html - HTML string
 * @returns {Array} - Array of image URLs found in HTML
 */
export const extractImagesFromHtml = (html) => {
  if (!html) return [];
  
  const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];
  return matches.map(match => match[1]);
};

// ─────────────────────────────────────────────────────────────────────────────
// HTML to React Native Conversion Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts HTML content to React Native compatible format
 * @param {string} html - HTML string to convert
 * @returns {Array} - Array of React Native compatible elements
 */
export const convertHtmlToReactNative = (html) => {
  if (!html) return [{ type: 'text', content: 'No content available' }];
  
  const elements = [];
  let currentIndex = 0;
  
  // Regular expressions for different HTML tags
  const tagRegex = /<(\/?) (p|strong|b|em|i|h1|h2|h3|h4|ul|ol|li|br|code|pre|a|img)([^>]*)>/gi;
  
  const processText = (text) => {
    if (text.trim()) {
      elements.push({ type: 'text', content: text });
    }
  };
  
  // Simple parser for common HTML tags
  const parseHtml = (htmlString) => {
    let result = [];
    let currentText = '';
    let inTag = false;
    let currentTag = '';
    let tagStack = [];
    
    for (let i = 0; i < htmlString.length; i++) {
      const char = htmlString[i];
      
      if (char === '<') {
        // Flush current text
        if (currentText.trim()) {
          result.push({ type: 'text', content: currentText });
          currentText = '';
        }
        inTag = true;
        currentTag = '';
      } else if (char === '>' && inTag) {
        inTag = false;
        const isClosingTag = currentTag.startsWith('/');
        const tagName = isClosingTag ? currentTag.slice(1) : currentTag;
        const tagParts = tagName.split(' ');
        const tag = tagParts[0].toLowerCase();
        
        // Extract attributes for img tags
        let attributes = {};
        if (tag === 'img') {
          const srcMatch = currentTag.match(/src=["']([^"']*)["']/);
          const styleMatch = currentTag.match(/style=["']([^"']*)["']/);
          if (srcMatch) attributes.src = srcMatch[1];
          if (styleMatch) attributes.style = styleMatch[1];
        }
        
        if (isClosingTag) {
          // Close the tag
          if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tag) {
            tagStack.pop();
          }
        } else {
          // Opening tag
          result.push({ type: 'tag', name: tag, isClosing: false, attributes: attributes });
          tagStack.push(tag);
        }
      } else if (inTag) {
        currentTag += char;
      } else {
        currentText += char;
      }
    }
    
    // Flush remaining text
    if (currentText.trim()) {
      result.push({ type: 'text', content: currentText });
    }
    
    return result;
  };
  
  const parsed = parseHtml(html);
  const formatted = [];
  let listDepth = 0;
  let inList = false;
  let currentListType = null;
  
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    
    if (item.type === 'text') {
      formatted.push(item);
    } else if (item.type === 'tag') {
      const tag = item.name;
      
      switch (tag) {
        case 'p':
          formatted.push({ type: 'paragraph', content: [] });
          break;
        case 'strong':
        case 'b':
          formatted.push({ type: 'bold', content: [] });
          break;
        case 'em':
        case 'i':
          formatted.push({ type: 'italic', content: [] });
          break;
        case 'h1':
          formatted.push({ type: 'heading', level: 1, content: [] });
          break;
        case 'h2':
          formatted.push({ type: 'heading', level: 2, content: [] });
          break;
        case 'h3':
          formatted.push({ type: 'heading', level: 3, content: [] });
          break;
        case 'h4':
          formatted.push({ type: 'heading', level: 4, content: [] });
          break;
        case 'ul':
          inList = true;
          currentListType = 'unordered';
          formatted.push({ type: 'list', ordered: false, items: [] });
          break;
        case 'ol':
          inList = true;
          currentListType = 'ordered';
          formatted.push({ type: 'list', ordered: true, items: [] });
          break;
        case 'li':
          if (inList && formatted.length > 0) {
            const lastItem = formatted[formatted.length - 1];
            if (lastItem.type === 'list') {
              lastItem.items.push({ content: [] });
            }
          }
          break;
        case 'br':
          formatted.push({ type: 'lineBreak' });
          break;
        case 'code':
          formatted.push({ type: 'code', content: [] });
          break;
        case 'pre':
          formatted.push({ type: 'preformatted', content: [] });
          break;
        case 'a':
          // Extract href from attributes
          const hrefMatch = item.attributes?.match(/href="([^"]*)"/);
          const href = hrefMatch ? hrefMatch[1] : null;
          formatted.push({ type: 'link', url: href, content: [] });
          break;
        case 'img':
          // Handle image tag
          const imageUrl = item.attributes?.src || '';
          formatted.push({ type: 'image', url: imageUrl, content: [] });
          break;
      }
    }
  }
  
  return formatted.length > 0 ? formatted : [{ type: 'text', content: html }];
};

/**
 * Renders the converted HTML elements
 * @param {Array} elements - Converted HTML elements
 * @returns {Array} - Array of React Native components
 */
export const renderHtmlElements = (elements) => {
  if (!elements || elements.length === 0) {
    return null;
  }
  
  // This function would be used in the component to render the parsed elements
  // For now, return the original HTML to be rendered by react-native-render-html
  return elements;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Function to Fetch Question Details
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch question details by ID from the backend
 * @param {string} id - Question ID/code
 * @returns {Promise<Object>} - Returns formatted question data
 */
export const FetchQuestionDetails = async (id) => {
  // Validate input
  if (!id || id === 'unknown' || id === 'undefined') {
    return {
      success: false,
      error: 'Invalid question ID provided',
      errorCode: 'INVALID_ID',
      data: null,
    };
  }

  try {
    const url = `${BASE_URL}/question-answer/api/load/question/details/${id}/`;
    console.log('Fetching question details from:', url);
    
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Check response status
    if (response.status === 200 || response.status === 201) {
      if (response.data) {
        // Format the response data with image processing
        const formattedData = formatQuestionData(response.data);
        
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
    console.error('Error fetching question details:', error);
    
    // Handle different error types
    let errorMessage = 'Failed to load question details';
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
          errorMessage = 'You do not have permission to view this question.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Question not found. It may have been deleted.';
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper Function to Format Question Data
// ─────────────────────────────────────────────────────────────────────────────

const formatQuestionData = (rawData) => {
  if (!rawData) return null;
  
  // Format courses (handle both array of objects and array of strings)
  let formattedCourses = [];
  if (rawData.courses && Array.isArray(rawData.courses)) {
    formattedCourses = rawData.courses.map(course => 
      typeof course === 'object' ? course.name : course
    );
  }
  
  // Get images from the question's images array
  const questionImages = rawData.images || [];
  
  // Process the question description to include images
  let processedDescription = rawData.question?.description || '';
  if (processedDescription && questionImages.length > 0) {
    processedDescription = processHtmlImages(processedDescription, questionImages);
  }
  
  // Format answers with HTML content and process their images
  const formattedAnswers = (rawData.answers || []).map(answer => {
    let processedAnswer = answer.answer || '';
    const answerImages = answer.images || [];
    
    if (processedAnswer && answerImages.length > 0) {
      processedAnswer = processHtmlImages(processedAnswer, answerImages);
    }
    
    return {
      id: answer.code,
      answer: processedAnswer,
      originalAnswer: answer.answer,
      created_at: answer.created_at,
      user_first_name: answer.user_first_name,
      user_last_name: answer.user_last_name,
      user_username: answer.user_username,
      user_is_staff: answer.user_is_staff || false,
      ai: answer.ai || false,
      code: answer.code,
      likes: answer.likes,
      likes_data: answer.likes_data || 0,
      user_image: answer.user_image ? `${BASE_URL}${answer.user_image}` : null,
      images: answer.images || [],
    };
  });
  
  return {
    seeker: {
      id: rawData.seeker?.id,
      first_name: rawData.seeker?.first_name,
      last_name: rawData.seeker?.last_name,
      username: rawData.seeker?.username,
      email: rawData.seeker?.email,
    },
    id: rawData.id,
    ai: rawData.ai || false,
    question: {
      code: rawData.question?.code,
      title: rawData.question?.title,
      description: processedDescription,
      originalDescription: rawData.question?.description,
      views: rawData.question?.views || 0,
      created_at: rawData.question?.created_at,
    },
    courses: formattedCourses,
    images: questionImages.map(img => `${BASE_URL}${img}`),
    rawImages: rawData.images || [],
    answers: formattedAnswers,
    rating: rawData.rating || 0,
    likes: rawData.likes || 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Additional Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get error message for display
 * @param {Object} response - API response
 * @returns {string}
 */
export const getErrorMessage = (response) => {
  if (!response) return 'An unknown error occurred';
  if (response.error) return response.error;
  return 'Failed to load question details. Please try again.';
};

/**
 * Retry failed request with exponential backoff
 * @param {string} id - Question ID
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise<Object>}
 */
export const retryFetchQuestionDetails = async (id, maxRetries = 3, initialDelay = 1000) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await FetchQuestionDetails(id);
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

/**
 * Check if the question has answers
 * @param {Object} questionData - Formatted question data
 * @returns {boolean}
 */
export const hasAnswers = (questionData) => {
  return questionData?.answers && questionData.answers.length > 0;
};

/**
 * Get answer count
 * @param {Object} questionData - Formatted question data
 * @returns {number}
 */
export const getAnswerCount = (questionData) => {
  return questionData?.answers?.length || 0;
};

/**
 * Check if the question is AI-generated
 * @param {Object} questionData - Formatted question data
 * @returns {boolean}
 */
export const isAIGenerated = (questionData) => {
  return questionData?.ai === true;
};

/**
 * Get formatted date for display
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
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return 'Unknown date';
  }
};

/**
 * Get full image URL
 * @param {string} imagePath - Image path from API
 * @returns {string} - Full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

// Export all functions
export default {
  FetchQuestionDetails,
  convertHtmlToReactNative,
  renderHtmlElements,
  getErrorMessage,
  retryFetchQuestionDetails,
  hasAnswers,
  getAnswerCount,
  isAIGenerated,
  formatDate,
  processHtmlImages,
  extractImagesFromHtml,
  getFullImageUrl,
};