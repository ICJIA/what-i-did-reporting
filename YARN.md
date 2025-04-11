# Yarn Usage Guide

This project uses Yarn 1.x as the preferred package manager. This document provides guidance on common Yarn commands and best practices for this project.

## Installation

If you don't have Yarn installed, you can install it following the instructions at [yarnpkg.com](https://classic.yarnpkg.com/en/docs/install).

```bash
# Install Yarn globally via npm
npm install -g yarn

# Verify installation
yarn --version
```

## Common Commands

### Installing Dependencies
```bash
# Install all dependencies
yarn install

# Add a new dependency
yarn add package-name

# Add a development dependency
yarn add --dev package-name
```

### Running Scripts
```bash
# Run the start script
yarn start

# Run with arguments
yarn start --start-date 2023-01-01 --end-date 2023-01-31
```

### Upgrading Dependencies
```bash
# Upgrade a specific package
yarn upgrade package-name

# Upgrade all packages
yarn upgrade
```

### Cleaning
```bash
# Clean the cache
yarn cache clean
```

## Best Practices

1. **Always use Yarn for this project**
   - Do not mix npm and Yarn commands in the same project
   - Avoid generating package-lock.json files

2. **Commit the yarn.lock file**
   - This ensures consistent installations across environments

3. **Use exact versions for critical dependencies**
   - For dependencies where exact versions are important, use `yarn add package-name --exact`

4. **Use the --frozen-lockfile flag in CI environments**
   - This ensures that CI builds use exactly what's in the lockfile
   - Example: `yarn install --frozen-lockfile`

## Troubleshooting

If you encounter issues with Yarn:

1. Try clearing the cache: `yarn cache clean`
2. Ensure you're using the correct Yarn version (1.x)
3. Delete the node_modules directory and reinstall: `rm -rf node_modules && yarn install`
