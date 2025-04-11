# What I Did Reporting

A Node.js script that generates reports of GitHub activity for a given date range. The reports are clear, easy to read, and available in both Markdown and plain text formats.

## Features

- Generate activity reports for a specific date range
- Quick time period options: `--day`, `--week`, `--month`, `--year-to-date`, and `--days <number>`
- Focus on your contributions within a specific GitHub organization
- View commits and repository creation events
- Export reports in both Markdown and plain text formats
- Reports are saved in the `reports` directory with human-readable date-based filenames
- Commits are grouped by day for better readability
- Robust error handling and rate limit management
- Exponential backoff for API requests to avoid rate limiting

## Installation

### Prerequisites

- Node.js (version 20.19.0 recommended, see `.nvmrc` file)
- NVM (Node Version Manager) is recommended for managing Node.js versions
- Yarn 1.x (see [YARN.md](YARN.md) for installation instructions)
- GitHub Personal Access Token (see [GitHub Authentication](#github-authentication) section)

```bash
# Clone the repository
git clone https://github.com/ICJIA/what-i-did-reporting.git
cd what-i-did-reporting

# Install dependencies
yarn install

# Create .env file from example
cp .env.example .env
```

## GitHub Authentication

This project requires a GitHub Personal Access Token (PAT) to access the GitHub API. Follow these steps to create and configure your token:

1. **Create a Personal Access Token**:
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token" (classic)
   - Give your token a descriptive name (e.g., "What I Did Report Generator")
   - Set an expiration date (or choose "No expiration" if preferred)
   - Select the following scopes:
     - `repo` (for private repositories)
     - `read:user`
     - `user:email`
   - Click "Generate token"
   - **IMPORTANT**: Copy the token immediately as you won't be able to see it again

2. **Configure the Token in Your Project**:
   - Create a `.env` file in the project root (copy from `.env.example`)
   - Add your GitHub token and username:
     ```
     GITHUB_TOKEN=your_personal_access_token_here
     GITHUB_USERNAME=your_github_username
     ```

The application will use this token to authenticate with the GitHub API and fetch your activity data.

## Usage

```bash
# Generate a report for the last 7 days (default)
yarn start

# Generate a report for today only
yarn start --day

# Generate a report for the current work week (Monday 8am to Friday 5pm)
yarn start --week

# Generate a report for the current month (all days since the 1st)
yarn start --month

# Generate a report for the entire year to date (Jan 1 to today)
yarn start --year-to-date

# Generate a report for the last N days (e.g., 47 days)
yarn start --days 47

# Generate a report for a specific date range
yarn start --start-date 2023-01-01 --end-date 2023-01-31

# Specify a different GitHub username and organization
yarn start --username octocat --org github
```

### Command Line Options

#### Date Range Options
- `-s, --start-date <date>`: Start date in YYYY-MM-DD format
- `-e, --end-date <date>`: End date in YYYY-MM-DD format

#### Quick Time Period Options
- `-d, --day`: Generate report for the current date (from 12am to 11:59pm)
- `-w, --week`: Generate report for the current work week (Monday 8am to Friday 5pm)
- `-m, --month`: Generate report for the current month (all weekdays since the 1st)
- `-y, --year-to-date`: Generate report for the entire year to date (January 1 to today)
- `--days <number>`: Generate report for the specified number of days in the past, including today

#### Other Options
- `-u, --username <username>`: Your GitHub username (default: from .env file)
- `-o, --org <organization>`: GitHub organization name (default: from .env file)
- `-h, --help`: Display help information
- `-V, --version`: Display version information

If no date range or quick option is specified, the default is to generate a report for the last 7 days.

## Output

Reports are saved in the `reports` directory with filenames based on the time period and date:

### Quick Option Filenames
- `reports/github-activity-day-YYYY-MM-DD-to-YYYY-MM-DD.md`: Daily report (Markdown)
- `reports/github-activity-week-YYYY-MM-DD-to-YYYY-MM-DD.md`: Weekly report (Markdown)
- `reports/github-activity-month-YYYY-MM-DD-to-YYYY-MM-DD.md`: Monthly report (Markdown)
- `reports/github-activity-year-to-date-YYYY-MM-DD-to-YYYY-MM-DD.md`: Year-to-date report (Markdown)
- `reports/github-activity-last-N-days-YYYY-MM-DD-to-YYYY-MM-DD.md`: Last N days report (Markdown)

### Custom Date Range Filenames
- `reports/github-activity-YYYY-MM-DD-to-YYYY-MM-DD.md`: Custom date range (Markdown)

Text versions (`.txt`) are also generated with the same naming pattern.

Example reports are included in the `sample-reports` directory to show the expected output format. You can view them to get an idea of what your generated reports will look like.

## Project Structure

```
├── index.js                # Main entry point
├── src/                    # Source code directory
│   ├── index.js            # Main application logic
│   ├── activity-fetcher.js # GitHub activity fetching
│   ├── cli.js              # Command-line interface
│   ├── config.js           # Application configuration
│   ├── date-utils.js       # Date handling utilities
│   ├── errors.js           # Error handling
│   ├── github-api.js       # GitHub API interaction
│   └── report-generator.js # Report generation
├── reports/                # Generated reports (gitignored)
├── sample-reports/         # Example report templates
├── .env.example           # Environment variables template
├── .nvmrc                  # Node.js version specification
└── README.md              # Project documentation
```

## Understanding GitHub Activity Reports

The reports generated by this tool reflect the code that was pushed to GitHub as the final part of the development process. There may have been additional code written, debugging performed, or refactoring done that is not reflected in the GitHub commits.

The commits shown in the reports represent the end result of a development process that may have included:
- Multiple iterations of code writing and testing
- Debugging and troubleshooting
- Code refactoring for improved quality
- Research and experimentation

These intermediate steps are typically not committed to the repository but are essential parts of the development process. This context is important for non-technical stakeholders to understand when reviewing activity reports.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.