/**
 * GitHub API interaction module with rate limit handling and exponential backoff
 */
import { Octokit } from '@octokit/rest';
import { format } from 'date-fns';
import config from './config.js';
import { GitHubError, RateLimitError, AuthenticationError, NetworkError } from './errors.js';

export class GitHubAPI {
  /**
   * Create a new GitHubAPI instance
   * @param {string} token - GitHub API token
   */
  constructor(token) {
    if (!token || typeof token !== 'string' || token.length < 30) {
      throw new AuthenticationError('Invalid GitHub token format');
    }
    // Sanitize token to prevent injection
    this.token = token.replace(/[^a-zA-Z0-9_]/g, '');
    this.octokit = new Octokit({ 
      auth: this.token,
      baseUrl: 'https://api.github.com',  // Explicitly set API endpoint
      userAgent: 'what-i-did-app/1.0.0'  // Add user agent
    });
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} retryCount - Current retry count
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(retryCount) {
    // Exponential backoff: baseDelay * 2^retryCount + random jitter
    const delay = config.api.baseRequestDelay * Math.pow(2, retryCount) + Math.random() * 1000;
    // Cap at maximum delay
    return Math.min(delay, config.api.maxBackoffDelay);
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after the delay
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle rate limit information from response headers
   * @param {Object} headers - Response headers
   * @returns {Object} Rate limit information
   */
  handleRateLimit(headers) {
    const remaining = parseInt(headers?.['x-ratelimit-remaining'] || '0');
    const limit = parseInt(headers?.['x-ratelimit-limit'] || '5000');
    const resetTime = parseInt(headers?.['x-ratelimit-reset'] || '0');
    const percentRemaining = (remaining / limit) * 100;

    // Log rate limit status periodically
    if (Math.random() < 0.1) { // Log approximately 10% of the time
      console.log(`GitHub API rate limit: ${remaining}/${limit} (${percentRemaining.toFixed(1)}% remaining)`);
    }

    return { remaining, limit, resetTime, percentRemaining };
  }

  /**
   * Execute a GitHub API request with retry logic and rate limit handling
   * @param {Function} method - API method to call
   * @param {Object} params - Parameters for the API method
   * @returns {Promise<Object>} API response
   */
  async executeRequest(method, params) {
    let retryCount = 0;
    
    while (retryCount <= config.api.maxRetries) {
      try {
        // Add delay based on retry count (exponential backoff)
        if (retryCount > 0) {
          const backoffDelay = this.calculateBackoff(retryCount);
          console.log(`Retry ${retryCount}/${config.api.maxRetries} - Waiting ${Math.round(backoffDelay / 1000)} seconds...`);
          await this.sleep(backoffDelay);
        }
        
        // Execute the request
        const response = await method(params);
        
        // Check rate limit
        const { percentRemaining, resetTime } = this.handleRateLimit(response.headers);
        
        // If rate limit is getting low, add delay for subsequent requests
        if (percentRemaining < config.api.rateLimitThresholdPercent) {
          const delay = this.calculateBackoff(1); // Use level 1 backoff
          console.log(`Rate limit getting low (${percentRemaining.toFixed(1)}%). Adding delay of ${Math.round(delay / 1000)} seconds.`);
          await this.sleep(delay);
        }
        
        return response;
      } catch (error) {
        // Handle different error types
        if (error.status === 401) {
          throw new AuthenticationError('Authentication failed. Check your GitHub token.');
        } else if (error.status === 403 && error.headers?.['x-ratelimit-remaining'] === '0') {
          // Rate limit exceeded
          const resetTime = parseInt(error.headers?.['x-ratelimit-reset'] || '0');
          throw new RateLimitError('GitHub API rate limit exceeded', error.headers, resetTime);
        } else if (error.status === 404) {
          // Resource not found - don't retry
          throw new GitHubError(`Resource not found: ${params.url || 'unknown resource'}`, 404);
        } else if (error.status) {
          // Other GitHub API error
          if (retryCount < config.api.maxRetries) {
            console.error(`GitHub API error (${error.status}): ${error.message}. Retrying...`);
            retryCount++;
            continue;
          }
          throw new GitHubError(error.message, error.status, error.headers);
        } else {
          // Network or other error
          if (retryCount < config.api.maxRetries) {
            console.error(`Network error: ${error.message}. Retrying...`);
            retryCount++;
            continue;
          }
          throw new NetworkError(`Failed to connect to GitHub API: ${error.message}`, error);
        }
      }
    }
    
    // This should not be reached due to the throw in the catch block
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Fetch all pages of results from a paginated API endpoint
   * @param {Function} method - API method to call
   * @param {Object} params - Parameters for the API method
   * @returns {Promise<Array>} Combined results from all pages
   */
  async fetchAllPages(method, params) {
    let results = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages && page <= config.api.maxPagesPerRequest) {
      try {
        // Add a small delay between pages to be gentle with the API
        if (page > 1) {
          await this.sleep(config.api.baseRequestDelay);
        }
        
        const response = await this.executeRequest(method, {
          ...params,
          page: page,
          per_page: 30 // Reduced from 100 to be more gentle with the API
        });
        
        if (response.data.length === 0) {
          hasMorePages = false;
        } else {
          results = results.concat(response.data);
          page++;
        }
      } catch (error) {
        if (error instanceof RateLimitError) {
          // Handle rate limit by waiting until reset
          const resetDate = new Date(error.resetTime * 1000);
          const waitTime = Math.ceil((resetDate - new Date()) / 1000);
          
          if (waitTime > 60) {
            console.error(`Rate limit exceeded. Limit will reset in ${waitTime} seconds at ${resetDate.toLocaleTimeString()}.`);
            console.error('Stopping further requests to avoid GitHub API lockout.');
            break;
          } else {
            console.log(`Rate limit exceeded. Waiting ${waitTime} seconds for reset...`);
            await this.sleep(waitTime * 1000);
            continue; // Try again after waiting
          }
        } else {
          // For other errors, stop pagination and return what we have
          console.error(`Error fetching page ${page}:`, error.message);
          break;
        }
      }
    }
    
    if (page > config.api.maxPagesPerRequest) {
      console.log(`Reached maximum page limit (${config.api.maxPagesPerRequest}). Some older data might be missing.`);
    }
    
    return results;
  }

  /**
   * Fetch repositories for an organization
   * @param {string} orgName - Organization name
   * @returns {Promise<Array>} List of repositories
   */
  async fetchRepositories(orgName) {
    console.log(`Fetching repositories for organization: ${orgName}...`);
    
    try {
      const repos = await this.fetchAllPages(
        this.octokit.repos.listForOrg,
        { org: orgName }
      );
      
      console.log(`Found ${repos.length} repositories in the organization.`);
      return repos;
    } catch (error) {
      console.error(`Error fetching repositories for ${orgName}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch commits for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} username - GitHub username
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} List of commits
   */
  async fetchCommits(owner, repo, username, startDate, endDate) {
    console.log(`Fetching commits for ${owner}/${repo}...`);
    
    try {
      // Try multiple approaches to get all commits
      let allCommits = [];
      
      // Approach 1: Use the listCommits API with author parameter
      try {
        const authorCommits = await this.fetchAllPages(
          this.octokit.repos.listCommits,
          {
            owner: owner,
            repo: repo,
            author: username,
            since: startDate.toISOString(),
            until: endDate.toISOString(),
            per_page: 100 // Override the default to get more commits at once
          }
        );
        
        console.log(`Found ${authorCommits.length} commits via author parameter in ${owner}/${repo}`);
        allCommits = allCommits.concat(authorCommits);
      } catch (error) {
        console.error(`Error fetching commits by author for ${owner}/${repo}:`, error.message);
      }
      
      // Approach 2: Use the Git API to get all commits and filter by author
      try {
        // Get all branches first
        const branches = await this.fetchAllPages(
          this.octokit.repos.listBranches,
          {
            owner: owner,
            repo: repo
          }
        );
        
        // For each branch, get commits
        for (const branch of branches.slice(0, config.maxBranchesPerRepo)) {
          try {
            const branchCommits = await this.fetchAllPages(
              this.octokit.repos.listCommits,
              {
                owner: owner,
                repo: repo,
                sha: branch.name,
                since: startDate.toISOString(),
                until: endDate.toISOString(),
                per_page: 100
              }
            );
            
            // Filter commits by author
            const userBranchCommits = branchCommits.filter(commit => {
              return commit.author?.login === username ||
                     commit.committer?.login === username ||
                     commit.commit.author.name === username ||
                     commit.commit.author.email === `${username}@users.noreply.github.com` ||
                     commit.commit.committer.name === username ||
                     commit.commit.committer.email === `${username}@users.noreply.github.com`;
            });
            
            if (userBranchCommits.length > 0) {
              console.log(`Found ${userBranchCommits.length} commits in branch ${branch.name} of ${owner}/${repo}`);
              allCommits = allCommits.concat(userBranchCommits);
            }
          } catch (error) {
            console.error(`Error fetching commits for branch ${branch.name} in ${owner}/${repo}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`Error fetching branches for ${owner}/${repo}:`, error.message);
      }
      
      // Deduplicate commits by SHA
      const uniqueCommits = [];
      const seenShas = new Set();
      
      allCommits.forEach(commit => {
        if (!seenShas.has(commit.sha)) {
          seenShas.add(commit.sha);
          uniqueCommits.push(commit);
        }
      });
      
      if (uniqueCommits.length > 0) {
        console.log(`Found ${uniqueCommits.length} unique commits by ${username} in ${owner}/${repo}`);
      }
      
      return uniqueCommits;
    } catch (error) {
      console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch repository creation events
   * @param {string} username - GitHub username
   * @param {string} orgName - Organization name
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} List of repository creation events
   */
  async fetchRepositoryCreationEvents(username, orgName, startDate, endDate) {
    console.log('Checking for repository creation events...');
    
    try {
      // Get user events
      const userEvents = await this.fetchAllPages(
        this.octokit.activity.listEventsForUser,
        { username: username }
      );
      
      // Filter for repository creation events in the organization
      const repoCreationEvents = userEvents.filter(event => {
        if (event.type !== 'CreateEvent' || event.payload.ref_type !== 'repository') {
          return false;
        }
        
        const eventDate = new Date(event.created_at);
        const isInDateRange = eventDate >= startDate && eventDate <= endDate;
        const isInOrg = event.repo.name.startsWith(`${orgName}/`);
        
        return isInDateRange && isInOrg;
      });
      
      console.log(`Found ${repoCreationEvents.length} repository creation events`);
      return repoCreationEvents;
    } catch (error) {
      console.error('Error fetching repository creation events:', error.message);
      return [];
    }
  }

  /**
   * Search for commits
   * @param {string} username - GitHub username
   * @param {string} orgName - Organization name
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} List of commits
   */
  async searchCommits(username, orgName, startDate, endDate) {
    console.log('Searching for additional commits...');
    
    try {
      let allSearchResults = [];
      
      // First search with author parameter
      try {
        const response = await this.executeRequest(
          this.octokit.search.commits,
          {
            q: `author:${username} org:${orgName} committer-date:${format(startDate, 'yyyy-MM-dd')}..${format(endDate, 'yyyy-MM-dd')}`,
            per_page: 100
          }
        );
        
        allSearchResults = allSearchResults.concat(response.data.items);
        console.log(`Found ${response.data.items.length} commits via author search`);
      } catch (error) {
        console.error('Error searching for commits by author:', error.message);
      }
      
      // Second search with committer parameter
      try {
        const response = await this.executeRequest(
          this.octokit.search.commits,
          {
            q: `committer:${username} org:${orgName} committer-date:${format(startDate, 'yyyy-MM-dd')}..${format(endDate, 'yyyy-MM-dd')}`,
            per_page: 100
          }
        );
        
        allSearchResults = allSearchResults.concat(response.data.items);
        console.log(`Found ${response.data.items.length} commits via committer search`);
      } catch (error) {
        console.error('Error searching for commits by committer:', error.message);
      }
      
      // Third search with email
      try {
        const response = await this.executeRequest(
          this.octokit.search.commits,
          {
            q: `author-email:${username}@users.noreply.github.com org:${orgName} committer-date:${format(startDate, 'yyyy-MM-dd')}..${format(endDate, 'yyyy-MM-dd')}`,
            per_page: 100
          }
        );
        
        allSearchResults = allSearchResults.concat(response.data.items);
        console.log(`Found ${response.data.items.length} commits via email search`);
      } catch (error) {
        console.error('Error searching for commits by email:', error.message);
      }
      
      return allSearchResults;
    } catch (error) {
      console.error('Error searching for commits:', error.message);
      return [];
    }
  }

  async queueRequest(method, params) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ method, params, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { method, params, resolve, reject } = this.requestQueue.shift();
      try {
        const result = await this.executeRequest(method, params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      // Add delay between requests
      await this.sleep(config.api.baseRequestDelay);
    }

    this.isProcessingQueue = false;
  }

  // Add rate limit caching
  getCachedRateLimit(resource = 'core') {
    return this.rateLimitCache.get(resource);
  }

  updateRateLimitCache(headers) {
    const rateLimit = this.handleRateLimit(headers);
    this.rateLimitCache.set('core', rateLimit);
    return rateLimit;
  }
}
