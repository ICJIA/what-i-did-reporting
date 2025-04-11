/**
 * Report generation module for the what-i-did application
 */
import { format } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';
import config from './config.js';
import { formatDateRange, formatDay, determinePeriodType } from './date-utils.js';

/**
 * Generate a formatted report from the activity data
 * @param {Object} activity - GitHub activity data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} username - GitHub username
 * @param {string} orgName - Organization name
 * @returns {Object} Object containing markdown and text reports
 */
export function generateReport(activity, startDate, endDate, username, orgName) {
  const reportDate = format(new Date(), config.report.dateFormat);
  const dateRange = formatDateRange(startDate, endDate);

  // Create markdown report
  let markdownReport = `# GitHub Activity Report\n\n`;
  markdownReport += `**User:** ${username}\n`;
  markdownReport += `**Organization:** ${orgName}\n`;
  markdownReport += `**Period:** ${dateRange}\n`;
  markdownReport += `**Generated on:** ${reportDate}\n\n`;

  // Add repository creation section if there are any
  if (activity.repositories.created.length > 0) {
    markdownReport += `## Repositories Created\n\n`;

    // Sort by date (newest first)
    const sortedRepos = [...activity.repositories.created].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by day
    const reposByDay = {};

    sortedRepos.forEach(repo => {
      const repoDate = new Date(repo.date);
      const dayKey = format(repoDate, 'yyyy-MM-dd');
      const dayDisplay = formatDay(repoDate);

      if (!reposByDay[dayKey]) {
        reposByDay[dayKey] = {
          display: dayDisplay,
          repos: []
        };
      }

      reposByDay[dayKey].repos.push({
        name: repo.repo,
        url: repo.url
      });
    });

    // Generate report by day
    Object.keys(reposByDay)
      .sort()
      .reverse()
      .forEach(dayKey => {
        const day = reposByDay[dayKey];

        markdownReport += `### ${day.display}\n\n`;

        day.repos.forEach(repo => {
          markdownReport += `- **${repo.name}**: [View Repository](${repo.url})\n\n`;
        });

        markdownReport += '\n';
      });
  }

  // Add commits section
  markdownReport += `## Commits\n\n`;
  if (activity.commits.length > 0) {
    // Sort commits by date (newest first)
    const sortedCommits = [...activity.commits].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group commits by day
    const commitsByDay = {};

    sortedCommits.forEach(commit => {
      const commitDate = new Date(commit.date);
      const dayKey = format(commitDate, 'yyyy-MM-dd');
      const dayDisplay = formatDay(commitDate);

      if (!commitsByDay[dayKey]) {
        commitsByDay[dayKey] = {
          display: dayDisplay,
          commits: []
        };
      }

      // Extract the first line of the commit message (the subject)
      const commitSubject = commit.message.split('\n')[0];

      commitsByDay[dayKey].commits.push({
        repo: commit.repo,
        subject: commitSubject,
        url: commit.url
      });
    });

    // Generate report by day
    Object.keys(commitsByDay)
      .sort() // Sort days chronologically
      .reverse() // Newest first
      .forEach(dayKey => {
        const day = commitsByDay[dayKey];

        markdownReport += `### ${day.display}\n\n`;

        day.commits.forEach(commit => {
          markdownReport += `- **${commit.repo}**: [${commit.subject}](${commit.url})\n\n`;
        });

        markdownReport += '\n';
      });
  } else {
    markdownReport += `No commits during this period.\n`;
  }
  markdownReport += '\n';

  // Create plain text version (simplified from markdown)
  let textReport = `GitHub Activity Report\n\n`;
  textReport += `User: ${username}\n`;
  textReport += `Organization: ${orgName}\n`;
  textReport += `Period: ${dateRange}\n`;
  textReport += `Generated on: ${reportDate}\n\n`;

  // Add repository creation section if there are any
  if (activity.repositories.created.length > 0) {
    textReport += `REPOSITORIES CREATED\n\n`;

    // Sort by date (newest first)
    const sortedRepos = [...activity.repositories.created].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by day
    const reposByDay = {};

    sortedRepos.forEach(repo => {
      const repoDate = new Date(repo.date);
      const dayKey = format(repoDate, 'yyyy-MM-dd');
      const dayDisplay = formatDay(repoDate);

      if (!reposByDay[dayKey]) {
        reposByDay[dayKey] = {
          display: dayDisplay,
          repos: []
        };
      }

      reposByDay[dayKey].repos.push({
        name: repo.repo,
        url: repo.url
      });
    });

    // Generate report by day
    Object.keys(reposByDay)
      .sort()
      .reverse()
      .forEach(dayKey => {
        const day = reposByDay[dayKey];

        textReport += `=== ${day.display} ===\n`;
        textReport += `${'='.repeat(day.display.length + 8)}\n\n`;

        day.repos.forEach(repo => {
          textReport += `- ${repo.name}\n`;
          textReport += `  URL: ${repo.url}\n\n`;
        });

        textReport += '\n';
      });
  }

  textReport += `COMMITS\n\n`;
  if (activity.commits.length > 0) {
    // Sort commits by date (newest first)
    const sortedCommits = [...activity.commits].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group commits by day
    const commitsByDay = {};

    sortedCommits.forEach(commit => {
      const commitDate = new Date(commit.date);
      const dayKey = format(commitDate, 'yyyy-MM-dd');
      const dayDisplay = formatDay(commitDate);

      if (!commitsByDay[dayKey]) {
        commitsByDay[dayKey] = {
          display: dayDisplay,
          commits: []
        };
      }

      // Extract the first line of the commit message (the subject)
      const commitSubject = commit.message.split('\n')[0];

      commitsByDay[dayKey].commits.push({
        repo: commit.repo,
        subject: commitSubject,
        url: commit.url
      });
    });

    // Generate report by day
    Object.keys(commitsByDay)
      .sort() // Sort days chronologically
      .reverse() // Newest first
      .forEach(dayKey => {
        const day = commitsByDay[dayKey];

        textReport += `=== ${day.display} ===\n`;
        textReport += `${'='.repeat(day.display.length + 8)}\n\n`;

        day.commits.forEach(commit => {
          textReport += `- ${commit.repo}: ${commit.subject}\n`;
          textReport += `  URL: ${commit.url}\n\n`;
        });

        textReport += '\n';
      });
  } else {
    textReport += `No commits during this period.\n`;
  }
  textReport += '\n';

  // Add explanatory note for non-technical managers
  const explanatoryNote = `
---

## Note About This Report

This report reflects the code that was pushed to GitHub as the final part of the development process. There may have been additional code written, debugging performed, or refactoring done that is not reflected in the GitHub commits.

The commits shown here represent the end result of a development process that may have included:
- Multiple iterations of code writing and testing
- Debugging and troubleshooting
- Code refactoring for improved quality
- Research and experimentation

These intermediate steps are typically not committed to the repository but are essential parts of the development process.
`;

  markdownReport += explanatoryNote;
  textReport += '\n' + explanatoryNote.replace('##', '');

  return {
    markdown: markdownReport,
    text: textReport
  };
}

/**
 * Save reports to files
 * @param {Object} report - Object containing markdown and text reports
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Command line options
 * @returns {Promise<Object>} Object containing file paths
 */
export async function saveReports(report, startDate, endDate, options) {
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const reportsDir = path.join(process.cwd(), config.report.outputDir);

  // Determine period type for filename
  const periodType = determinePeriodType(options);
  let periodPrefix = '';

  if (periodType !== 'custom') {
    periodPrefix = `${periodType}-`;
  }

  // Create human-readable date range for filename
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  const dateRangeStr = `${startDateStr}-to-${endDateStr}`;

  // Ensure reports directory exists
  await fs.mkdir(reportsDir, { recursive: true });

  // Save markdown report
  const mdFilename = `${config.report.filenamePrefix}-${periodPrefix}${dateRangeStr}.md`;
  const mdPath = path.join(reportsDir, mdFilename);
  await fs.writeFile(mdPath, report.markdown);
  console.log(`Markdown report saved to: ${mdPath}`);

  // Save text report
  const txtFilename = `${config.report.filenamePrefix}-${periodPrefix}${dateRangeStr}.txt`;
  const txtPath = path.join(reportsDir, txtFilename);
  await fs.writeFile(txtPath, report.text);
  console.log(`Text report saved to: ${txtPath}`);

  return {
    markdownPath: mdPath,
    textPath: txtPath
  };
}
