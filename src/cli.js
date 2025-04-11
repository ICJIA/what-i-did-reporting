/**
 * Command-line interface module for the what-i-did application
 */
import { program } from 'commander';
import dotenv from 'dotenv';
import { validateInputs } from './errors.js';

/**
 * Set up the command-line interface
 * @returns {Object} Command-line options
 */
export function setupCLI() {
  // Load environment variables from .env file
  dotenv.config();
  
  // Set up command line interface
  program
    .name('what-i-did')
    .description('Generate reports of GitHub activity for a given date range')
    .version('1.0.0')
    .option('-s, --start-date <date>', 'Start date (YYYY-MM-DD format)')
    .option('-e, --end-date <date>', 'End date (YYYY-MM-DD format)')
    .option('-u, --username <username>', 'Your GitHub username', process.env.GITHUB_USERNAME)
    .option('-o, --org <organization>', 'GitHub organization name', process.env.GITHUB_ORG)
    .option('-d, --day', 'Generate report for current day (from 12am to 11:59pm)')
    .option('-w, --week', 'Generate report for current work week (Monday 8am to Friday 5pm)')
    .option('-m, --month', 'Generate report for current month (all weekdays since the 1st)')
    .option('-y, --year-to-date', 'Generate report for the current year to date (Jan 1 to today)')
    .option('--days <number>', 'Generate report for the specified number of days in the past, including today')
    .parse(process.argv);
  
  const options = program.opts();
  
  // Validate inputs
  validateInputs(options);
  
  return options;
}
