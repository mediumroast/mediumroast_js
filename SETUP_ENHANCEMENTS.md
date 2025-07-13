# Mediumroast Setup Utility - Enhanced Version 3.2.0

## Overview

The mediumroast setup utility has been significantly enhanced to take advantage of the new mediumroast_api package features. This document outlines the major improvements and new capabilities.

## Key Enhancements

### 1. Comprehensive Logging Integration

**Added structured logging using logger.js from mediumroast_api**

- **Operation Tracking**: All major operations now use `logger.trackOperation()` for timing and context
- **Detailed Context**: Logs include organization details, operation results, and error tracking
- **Performance Monitoring**: Track duration of setup operations for optimization
- **Error Correlation**: Enhanced error logging with stack traces and contextual data

```javascript
// Example: Enhanced operation logging
const tracker = logger.trackOperation('confirmGitHubOrg', 'mrcli-setup')
logger.info('GitHub organization lookup initiated', {
    organization: gitHubOrgName,
    operation: 'confirmGitHubOrg'
})
// ... operation logic ...
tracker.end()
```

### 2. Enhanced Preflight Checks

**Automated GitHub App Installation Verification**

- **Automated Detection**: Replaces manual verification with comprehensive automated checks
- **Smart Browser Opening**: Automatically opens GitHub App installation page using platform-appropriate commands
- **Cross-Platform Support**: Works on macOS (`open`), Linux (`xdg-open`), and Windows (`start`)
- **Fallback Display**: Shows clickable URL if browser opening fails
- **Interactive Prompts**: Asks user permission before opening browser
- **Comprehensive Logging**: Track all installation verification steps

**Repository and Container Verification**

- **Repository Accessibility**: Check repository exists and is accessible via `getRepoSize()`
- **Container Verification**: Verify individual containers (Companies, Interactions, Studies) exist
- **Detailed Logging**: Track repository size and container accessibility status
- **Non-blocking Checks**: Log results but don't fail setup if containers don't exist yet (they may be created during setup)
- **Comprehensive Reporting**: Provide detailed status for each resource

```javascript
// Example: Enhanced preflight checks
const prerequisiteResults = await checkPrerequisites(gitHubCtl, myEnv.GitHub.org)
if (prerequisiteResults.success) {
    console.log('✅ All prerequisites verified - repository and containers are accessible')
} else {
    // Provide specific guidance for missing resources
}
```

### 3. Enhanced GitHub Actions Management

**Comprehensive Actions Installation with Verification**

- **Repository Verification**: Checks repository exists before attempting actions installation
- **Actions Availability Check**: Verifies GitHub Actions are enabled and accessible
- **Workflow Detection**: Counts existing workflows and reports status
- **Multiple Installation Modes**: 
  - **Install**: Fresh installation of actions and workflows
  - **Update**: Update existing actions to latest version
  - **Reinstall**: Complete removal and reinstallation with user confirmation
- **Fallback Support**: Automatic fallback to legacy installation method if new API fails
- **Comprehensive Logging**: Track all actions operations with timing and results

**Safe Destructive Operations**

- **User Confirmation**: Interactive prompts for destructive operations (reinstall, delete)
- **Detailed Information**: Clear explanation of what will be affected
- **Cancellation Support**: Users can abort destructive operations
- **Operation Tracking**: All destructive operations logged with user consent status

```javascript
// Example: Enhanced actions installation with verification
const repoActionsStatus = await checkRepositoryAndActions(gitHubCtl, 'mr_backend')
if (!repoActionsStatus.repository.exists) {
    console.log('⚠️  Repository does not exist yet - actions will be installed after repository creation')
    return { skipped: true, reason: 'Repository not found' }
}

// For destructive operations, require user confirmation
const confirmed = await confirmDestructiveOperation(
    'reinstall GitHub Actions from scratch',
    'This will delete all existing workflows and actions, then reinstall them'
)
```

### 4. Enhanced Company Creation Workflow

**Transaction Safety with Comprehensive Logging**

- **Catch/Write/Release Pattern**: Uses mediumroast_api's transaction safety features
- **Data Validation**: Validate company data before creation
- **User Confirmation**: Interactive confirmation with detailed company summaries
- **Creation Verification**: Verify company creation success with follow-up checks

```javascript
// Example: Enhanced company creation
async function createCompaniesWithSafety(companiesCtl, companiesToCreate, operationDescription) {
    const tracker = logger.trackOperation('createCompaniesWithSafety', 'mrcli-setup')
    // ... comprehensive creation logic with logging ...
    const createResult = await companiesCtl.createObj(companiesToCreate)
    // ... verification and logging ...
}
```

### 5. Improved Error Handling

**Enhanced safeOperation wrapper**

- **Contextual Error Messages**: Provide specific guidance based on error types
- **Retry Logic Support**: Foundation for implementing retry mechanisms
- **Performance Tracking**: Log operation duration even for failed operations
- **User Guidance**: Specific solutions for common error scenarios

### 6. Enhanced User Experience

**Interactive Confirmations**

- **Detailed Summaries**: Show comprehensive information before operations
- **Smart Defaults**: Provide sensible defaults for company roles and regions
- **Progress Tracking**: Visual feedback for long-running operations
- **Clear Status Updates**: Enhanced console output with emojis and colors

### 7. Comprehensive Setup Summary

**Enhanced Completion Reporting**

- **Duration Tracking**: Show total setup time
- **Detailed Logging**: Complete operation summary in logs
- **Verification Steps**: Confirm all operations completed successfully
- **Next Steps Guidance**: Clear instructions for continuing with Mediumroast

## New Functions Added

### `checkRepositoryAndActions()`
Comprehensive repository and GitHub Actions availability verification with workflow detection.

### `openGitHubAppInstallation()`
Automatically opens GitHub App installation page in browser with cross-platform support and fallback URL display.

### `checkPrerequisites()`
Comprehensive repository and container verification with detailed accessibility checking.

### `createCompaniesWithSafety()`
Enhanced company creation with transaction safety and comprehensive logging.

### Enhanced `checkGitHubAppInstallation()`
Comprehensive GitHub App installation verification with automated browser opening for installation.

### Enhanced `checkExistingInstallations()`
Smart detection of existing resources with comprehensive logging.

### Enhanced `safeOperation()`
Improved error handling wrapper with contextual guidance and performance tracking.

## Refactored Components

### `SetupWizard` Class (new module: `src/cli/setupWizard.js`)
Dedicated wizard utilities for setup-specific prompting:
- `confirmCompanyCreation()` - Enhanced company creation confirmation with detailed information
- `validateCompanyData()` - Company data validation with default value assignment
- `confirmOperation()` - General operation confirmation prompts
- `selectOption()` - Multiple choice selections with validation
- `getTextInput()` - Text input with validation
- `selectActionsOperation()` - GitHub Actions operation selection
- Display utilities for progress, errors, success, and warnings

### Removed Functions
- `confirmDestructiveOperation()` - Removed as inappropriate for setup utility
- `safeDeleteWorkflow()` - Removed as inappropriate for setup utility

### Enhanced Common Function Usage
- Replaced custom `inquirer.prompt` calls with `wizardUtils.operationOrNot()` and `wizardUtils.doList()`
- Improved code reuse and consistency across CLI utilities

## Benefits of the Enhancements

1. **Production-Ready Logging**: Comprehensive operational visibility for troubleshooting
2. **Enhanced Reliability**: Transaction safety patterns and error recovery
3. **Automated Setup**: Eliminates manual verification steps with intelligent automation
4. **Cross-Platform Browser Integration**: Smart browser opening with fallback support
5. **Comprehensive Validation**: Repository and container verification with detailed status reporting
6. **Better User Experience**: Clear feedback, smart defaults, and interactive confirmations
7. **Improved Debugging**: Detailed logging with timing and context information
8. **Professional Operation**: Following enterprise patterns for setup utilities
9. **Future-Proof Architecture**: Foundation for advanced features and monitoring

## Usage

The enhanced setup utility maintains the same command-line interface:

```bash
mrcli-setup --splash yes
```

**Environment Variables for Logging Control:**

```bash
# Set log level (debug, info, warn, error) - default: info
export LOG_LEVEL=debug

# Run with debug logging
LOG_LEVEL=debug mrcli-setup --splash yes
```

## Logging Output

The enhanced setup utility now provides structured JSON logs that include:

- Operation timestamps and durations
- GitHub organization and repository details
- Company creation and validation results
- Error details with context for troubleshooting
- Performance metrics for optimization

This makes the setup utility suitable for enterprise environments where operational visibility and auditability are important requirements.
