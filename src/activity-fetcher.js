/**
 * Activity fetching module for the what-i-did application
 */
import { format } from 'date-fns';
import config from './config.js';
import { GitHubAPI } from './github-api.js';

/**
 * Fetch GitHub activity for the given user in the specified organization and date range
 * @param {string} username - GitHub username
 * @param {string} orgName - Organization name
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} token - GitHub API token
 * @returns {Promise<Object>} Activity data
 */
export async function fetchGitHubActivity(username, orgName, startDate, endDate, token) {
  // Structure to organize different types of GitHub activities
  const activity = {
    commits: [],
    pullRequests: {
      created: [],
      reviewed: [],
      merged: []
    },
    issues: {
      created: [],
      commented: [],
      closed: []
    },
    repositories: {
      created: [],
      forked: [],
      starred: []
    }
  };

  try {
    console.log(`Fetching activity for ${username} in organization ${orgName}...`);
    console.log(`Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    
    // Initialize GitHub API client
    const github = new GitHubAPI(token);
    
    // Step 1: Get active repositories for the organization
    const orgRepos = await github.fetchRepositories(orgName);
    
    // Sort repositories by pushed_at date to prioritize recently active repos
    let activeRepos = orgRepos
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, config.maxRepositories);
    
    // Make sure important repos are included even if they're not in the top N
    const importantRepoObjects = orgRepos.filter(repo => 
      config.importantRepositories.includes(repo.name)
    );
    
    // Add any important repos that weren't already in activeRepos
    importantRepoObjects.forEach(repo => {
      if (!activeRepos.some(activeRepo => activeRepo.name === repo.name)) {
        activeRepos.push(repo);
      }
    });
    
    console.log(`Focusing on ${activeRepos.length} repositories, including specifically requested ones.`);
    
    // Step 2: For each repository, get the user's contributions
    for (const repo of activeRepos) {
      const repoFullName = repo.full_name;
      console.log(`Processing repository: ${repoFullName}...`);
      
      // Get commits for this repository
      const commits = await github.fetchCommits(
        orgName,
        repo.name,
        username,
        startDate,
        endDate
      );
      
      // Add commits to activity
      commits.forEach(commit => {
        activity.commits.push({
          repo: repoFullName,
          sha: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author.date || commit.commit.committer.date,
          url: commit.html_url || `https://github.com/${repoFullName}/commit/${commit.sha}`
        });
      });
    }
    
    // Step 3: Check for repository creation events
    const repoCreationEvents = await github.fetchRepositoryCreationEvents(
      username,
      orgName,
      startDate,
      endDate
    );
    
    // Add repository creation events to activity
    repoCreationEvents.forEach(event => {
      activity.repositories.created.push({
        repo: event.repo.name,
        date: event.created_at,
        url: `https://github.com/${event.repo.name}`
      });
    });
    
    // Step 4: Get additional commits using the search API
    const searchResults = await github.searchCommits(
      username,
      orgName,
      startDate,
      endDate
    );
    
    // Add any commits not already included
    for (const item of searchResults) {
      const commitDate = new Date(item.commit.committer.date);
      if (commitDate >= startDate && commitDate <= endDate) {
        // Check if we already have this commit
        const isDuplicate = activity.commits.some(c => c.sha === item.sha);
        
        if (!isDuplicate) {
          activity.commits.push({
            repo: item.repository.full_name,
            sha: item.sha,
            message: item.commit.message,
            date: item.commit.committer.date,
            url: item.html_url || `https://github.com/${item.repository.full_name}/commit/${item.sha}`
          });
        }
      }
    }
    
    console.log('Finished fetching GitHub activity.');
    console.log(`Found ${activity.repositories.created.length} repositories created`);
    console.log(`Found ${activity.commits.length} commits`);
    
    // These are no longer included in the report but still tracked for debugging
    console.log(`Found ${activity.pullRequests.created.length} created PRs (not included in report)`);
    console.log(`Found ${activity.pullRequests.reviewed.length} reviewed PRs (not included in report)`);
    console.log(`Found ${activity.pullRequests.merged.length} merged PRs (not included in report)`);
    console.log(`Found ${activity.issues.created.length} created issues (not included in report)`);
    console.log(`Found ${activity.issues.commented.length} commented issues (not included in report)`);
    console.log(`Found ${activity.issues.closed.length} closed issues (not included in report)`);
    
  } catch (error) {
    console.error('Error fetching GitHub activity:', error.message);
    throw error;
  }

  return activity;
}
