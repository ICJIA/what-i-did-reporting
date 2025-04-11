/**
 * Error handling utilities for the what-i-did application
 */
import config from './config.js';

/**
 * Custom error class for GitHub API errors
 */
export class GitHubError extends Error {
  constructor(message, status, headers = {}) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.headers = headers;
  }
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends GitHubError {
  constructor(message, headers, resetTime) {
    super(message, 403, headers);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
}

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends GitHubError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error class for network errors
 */
export class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Handle errors and provide appropriate messages
 * @param {Error} error - The error to handle
 * @param {boolean} exitProcess - Whether to exit the process on error
 * @returns {string} - The error message
 */
export function handleError(error, exitProcess = false) {
  let message = '';
  
  if (error instanceof RateLimitError) {
    const resetDate = new Date(error.resetTime * 1000);
    const waitTime = Math.ceil((resetDate - new Date()) / 1000);
    message = `${config.errors.rateLimitExceeded} Reset in ${waitTime} seconds at ${resetDate.toLocaleTimeString()}.`;
  } else if (error instanceof AuthenticationError) {
    message = config.errors.authError;
  } else if (error instanceof NetworkError) {
    message = `${config.errors.networkError}: ${error.message}`;
  } else if (error instanceof GitHubError) {
    message = `${config.errors.apiError}: ${error.message} (Status: ${error.status})`;
  } else if (error instanceof ValidationError) {
    message = error.message;
  } else {
    message = `Error: ${error.message}`;
  }
  
  console.error(message);
  
  if (exitProcess) {
    process.exit(1);
  }
  
  return message;
}

/**
 * Validate required inputs
 * @param {Object} options - Command line options
 */
export function validateInputs(options) {
  if (!options.username) {
    throw new ValidationError(config.errors.missingUsername);
  }
  
  if (!options.org) {
    throw new ValidationError(config.errors.missingOrg);
  }
  
  if (!process.env.GITHUB_TOKEN) {
    throw new ValidationError(config.errors.missingToken);
  }
  
  if (process.env.GITHUB_TOKEN.length < 30) {
    console.warn(config.errors.invalidToken);
    console.warn('Please ensure you\'ve copied the entire token from GitHub.');
  }
  
  if (options.days) {
    const days = parseInt(options.days);
    if (isNaN(days) || days <= 0) {
      throw new ValidationError(config.errors.invalidDaysOption);
    }
  }
}
