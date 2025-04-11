/**
 * Configuration settings for the what-i-did application
 */
export default {
  // API settings
  api: {
    // Maximum number of pages to fetch per request
    maxPagesPerRequest: 5,
    
    // Base delay between requests in milliseconds
    baseRequestDelay: 1000,
    
    // Maximum number of retries for failed requests
    maxRetries: 3,
    
    // Maximum backoff delay in milliseconds
    maxBackoffDelay: 60000, // 1 minute
    
    // Rate limit threshold percentage to start slowing down
    rateLimitThresholdPercent: 20,
  },
  
  // Important repositories to always include in reports
  importantRepositories: [
    '2025-rules-and-prompts',
    'nospaces-filename-fixer',
    'tutorials-2025',
    'spac-client-next',
    'icjia-qr-code',
    '32-bit-binary-formatter',
    'web-scaffold',
    'gitgrab'
  ],
  
  // Maximum number of repositories to check (excluding important ones)
  maxRepositories: 50,
  
  // Maximum number of branches to check per repository
  maxBranchesPerRepo: 3,
  
  // Report settings
  report: {
    dateFormat: 'MMMM d, yyyy',
    timeFormat: 'HH:mm',
    dayFormat: 'MMMM d, yyyy (EEEE)',
    outputDir: 'reports',
    filenamePrefix: 'github-activity'
  },
  
  // Error messages
  errors: {
    missingUsername: 'Error: Your GitHub username is required. Set it with --username or in .env file.',
    missingOrg: 'Error: GitHub organization name is required. Set it with --org or in .env file.',
    missingToken: 'Error: GitHub Personal Access Token is required.',
    invalidToken: 'Warning: Your GitHub token appears to be invalid or incomplete.',
    rateLimitExceeded: 'Rate limit exceeded. Waiting for reset...',
    invalidDaysOption: 'Error: --days option requires a positive number',
    networkError: 'Network error occurred while communicating with GitHub API',
    apiError: 'GitHub API error occurred',
    authError: 'Authentication error. Please check your GitHub token.'
  }
};
