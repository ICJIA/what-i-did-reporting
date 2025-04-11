/**
 * Main entry point for the what-i-did application
 */
import { setupCLI } from './cli.js';
import { calculateDateRange, formatDateRange, determinePeriodType } from './date-utils.js';
import { fetchGitHubActivity } from './activity-fetcher.js';
import { generateReport, saveReports } from './report-generator.js';
import { handleError } from './errors.js';

/**
 * Main function
 */
async function main() {
  try {
    // Set up command-line interface
    const options = setupCLI();
    
    // Calculate date range based on options
    const { startDate, endDate } = calculateDateRange(options);
    
    // Determine which option was used for the report title
    const periodType = determinePeriodType(options);
    
    console.log(`Generating ${periodType} report for ${options.username} in organization ${options.org}`);
    console.log(`Date range: ${formatDateRange(startDate, endDate)}`);
    
    // Fetch GitHub activity
    const activity = await fetchGitHubActivity(
      options.username,
      options.org,
      startDate,
      endDate,
      process.env.GITHUB_TOKEN
    );
    
    // Generate report
    const report = generateReport(activity, startDate, endDate, options.username, options.org);
    
    // Save reports
    await saveReports(report, startDate, endDate, options);
    
    console.log('Report generated successfully!');
  } catch (error) {
    handleError(error, true);
  }
}

// Run the main function
main();
