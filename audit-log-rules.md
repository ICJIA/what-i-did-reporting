# Audit Log Rules

## Purpose and Overview

This document defines the rules and guidelines for maintaining an audit log in any software project. The audit log serves as a chronological record of all significant changes made to a project, providing transparency and accountability for external reviewers and future developers.

## Distinction from CHANGELOG

An audit log is distinct from a CHANGELOG in several important ways:

- **Purpose**: The audit log is primarily for external review and audit purposes, not for end-users or developers tracking version changes
- **Detail Level**: Audit logs contain more granular details about specific files changed and exact modifications made
- **Structure**: While CHANGELOGs are typically organized by version numbers, audit logs are strictly chronological
- **Audience**: Audit logs are designed for auditors, compliance officers, and external reviewers who need to verify exactly what changed and when
- **Completeness**: Audit logs must document ALL significant changes, not just features or fixes that would appear in a CHANGELOG

## Required Format

Each audit log entry must include:

1. **Date and Title**: Date of change in YYYY-MM-DD format followed by a brief descriptive title in parentheses
2. **Summary**: 1-2 sentence summary of the change that clearly states what was modified and why
3. **Files Modified/Created**: A list of all files modified or created with brief descriptions of the specific changes made to each file
4. **Technical Notes**: A section with general implementation details that would help new developers understand the changes without revealing security-sensitive information

## Sample Entry

Below is a complete sample entry showing exactly how each audit log entry should be structured:

```markdown
### YYYY-MM-DD (Security Enhancement and Bug Fix)
- Implemented enhanced password hashing and fixed user authentication bypass vulnerability.
- Files modified/created:
  - `src/auth/password.js`: Updated password hashing algorithm from MD5 to bcrypt with 12 rounds of salting
  - `src/auth/login.js`: Fixed authentication bypass vulnerability in the login verification process
  - `src/config/security.js`: Added new configuration parameters for bcrypt implementation
  - `tests/auth/password.test.js`: Updated tests to verify new hashing implementation
  - `docs/security.md`: Updated documentation to reflect new password security measures
- Technical Notes:
  - Bcrypt was chosen for its adaptive nature and built-in salt generation
  - Implementation follows OWASP password storage recommendations
  - Tests verify both successful hashing and timing attack resistance
  - Configuration parameters are environment-specific with secure defaults
  - The fix addresses CVE-2025-XXXXX without breaking API compatibility
```

This sample demonstrates the exact format, level of detail, and structure required for each audit log entry.

## Guidelines for Creating Entries

- **Chronological Order**: Entries should be in reverse chronological order (newest at top)
- **Specificity**: Be specific about what was changed and why, avoiding vague descriptions
- **Comprehensiveness**: Include all modified files with concise descriptions of the changes made to each
- **Security Awareness**: Keep Technical Notes general enough to avoid revealing security vulnerabilities or sensitive implementation details
- **Developer Focus**: Focus on information that would help a new developer understand the codebase and the rationale behind changes
- **Completeness**: Document ALL significant changes, including refactoring, security updates, and documentation improvements
- **Accuracy**: Use the actual date when creating entries, not placeholder dates
- **Current Date Generation**: ALWAYS generate dates based on the current date when creating new entries. Each new entry should first get the current date, and then use that date for the log entry. Never use hardcoded dates.
- **Consistency**: Maintain consistent formatting and level of detail across all entries

## Implementation in Projects

To implement an audit log in a project:

1. Create an `audit-log.md` file in the project root directory
2. Add a brief introduction explaining the purpose of the audit log
3. Create a section titled "## Audit Log Entries" where all entries will be added
4. Add new entries at the top of this section as changes are made
5. Include these audit log rules in a separate `audit-log-rules.md` file for reference

## Value and Benefits

The audit log serves multiple important purposes:

- Provides a record for external auditors and compliance reviews
- Serves as a reference for developers who need to understand the application's evolution
- Documents design decisions and their rationale
- Creates accountability and transparency in the development process
- Helps with troubleshooting by providing context for when and why changes were made
