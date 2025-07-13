# Signal Handler Implementation

## Overview
This implementation adds graceful shutdown handling for Ctrl-C (SIGINT) and SIGTERM signals across mediumroast CLI utilities.

## Files Added/Modified

### New Files
- `/src/cli/signalHandler.js` - Reusable signal handling utility class
- `/test/test-signal-handler.js` - Test script for signal handler functionality

### Modified Files
- `/cli/mrcli-setup.js` - Integrated signal handler with main setup operations
- `/src/cli/setupWizard.js` - Added documentation note about signal handling

## Features

### SignalHandler Class
- **Graceful Shutdown**: Catches SIGINT (Ctrl-C) and SIGTERM signals
- **Cleanup Tasks**: Allows registration of cleanup functions that run during shutdown
- **Cancellable Operations**: Wraps async operations to respect shutdown signals
- **Cancellable Prompts**: Wraps user input prompts for graceful cancellation
- **Double Ctrl-C**: First Ctrl-C initiates graceful shutdown, second forces immediate exit
- **Error Handling**: Catches uncaught exceptions and unhandled promise rejections

### Integration in mrcli-setup.js
- Signal handler initialized at startup
- Cleanup tasks registered for logging finalization
- Critical user prompts wrapped with `cancellablePrompt()`
- Long-running operations wrapped with `cancellableOperation()`
- Enhanced `safeOperation()` function to respect shutdown signals

## Usage

### Basic Setup
```javascript
import SignalHandler from '../src/cli/signalHandler.js'

const signalHandler = new SignalHandler('my-cli-app')
```

### Register Cleanup Tasks
```javascript
signalHandler.registerCleanupTask(async () => {
    console.log('Cleaning up resources...')
    // Your cleanup logic here
}, 'Cleanup description')
```

### Wrap User Prompts
```javascript
const userInput = await signalHandler.cancellablePrompt(
    () => wizardUtils.operationOrNot('Continue?'),
    'User confirmation'
)
```

### Wrap Long Operations
```javascript
const result = await signalHandler.cancellableOperation(
    () => performLongRunningTask(),
    'Long operation'
)
```

## Benefits
1. **No More Hanging Processes**: Prevents CLIs from hanging when interrupted
2. **Clean State**: Ensures proper cleanup of resources and logging
3. **User-Friendly**: Provides clear feedback about shutdown process
4. **Reusable**: Can be easily integrated into other CLI tools
5. **Error Recovery**: Handles uncaught exceptions gracefully

## Future Enhancements
- Can be integrated into other mediumroast CLI utilities (mrcli-company.js, mrcli-interaction.js, etc.)
- Add progress saving/restoration for interrupted operations
- Add configurable timeout for cleanup operations
- Add notification before forceful shutdown
