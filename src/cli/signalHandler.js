/**
 * A utility class for handling process signals (SIGINT, SIGTERM) gracefully
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file signalHandler.js
 * @copyright 2025 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

import chalk from 'chalk'

class SignalHandler {
    constructor(processName = 'mediumroast-cli') {
        this.processName = processName
        this.cleanupTasks = []
        this.isShuttingDown = false
        this.setupHandlers()
    }

    /**
     * Set up signal handlers for graceful shutdown
     */
    setupHandlers() {
        // Handle SIGINT (Ctrl-C)
        process.on('SIGINT', async () => {
            if (this.isShuttingDown) {
                console.log(chalk.red('\nForced shutdown requested, exiting immediately...'))
                process.exit(1)
            }
            
            this.isShuttingDown = true
            console.log(chalk.yellow('\n\nGraceful shutdown initiated (Ctrl-C detected)...'))
            console.log(chalk.blue('Press Ctrl-C again to force immediate exit'))
            
            await this.performCleanup()
            process.exit(0)
        })

        // Handle SIGTERM (termination signal)
        process.on('SIGTERM', async () => {
            if (this.isShuttingDown) {
                process.exit(1)
            }
            
            this.isShuttingDown = true
            console.log(chalk.yellow('\nTermination signal received, shutting down gracefully...'))
            
            await this.performCleanup()
            process.exit(0)
        })

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error(chalk.red('\nUncaught Exception:'), error.message)
            if (process.env.NODE_ENV === 'development') {
                console.error(error.stack)
            }
            this.performCleanup().then(() => process.exit(1))
        })

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error(chalk.red('\nUnhandled Promise Rejection:'), reason)
            if (process.env.NODE_ENV === 'development') {
                console.error('Promise:', promise)
            }
            this.performCleanup().then(() => process.exit(1))
        })
    }

    /**
     * Register a cleanup task to be executed during shutdown
     * @param {Function} task - Async function to execute during cleanup
     * @param {string} description - Description of the cleanup task
     */
    registerCleanupTask(task, description = 'Cleanup task') {
        this.cleanupTasks.push({ task, description })
    }

    /**
     * Perform all registered cleanup tasks
     */
    async performCleanup() {
        if (this.cleanupTasks.length === 0) {
            console.log(chalk.blue('No cleanup tasks to perform'))
            return
        }

        console.log(chalk.blue(`Performing ${this.cleanupTasks.length} cleanup task(s)...`))
        
        for (const { task, description } of this.cleanupTasks) {
            try {
                console.log(chalk.blue(`  • ${description}`))
                await Promise.race([
                    task(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
                    )
                ])
            } catch (error) {
                console.warn(chalk.yellow(`    Warning: ${description} failed - ${error.message}`))
            }
        }
        
        console.log(chalk.green('Cleanup completed'))
    }

    /**
     * Check if the process is currently shutting down
     * @returns {boolean}
     */
    isShuttingDownProcess() {
        return this.isShuttingDown
    }

    /**
     * Create a cancellable operation that respects shutdown signals
     * @param {Function} operation - The async operation to execute
     * @param {string} operationName - Name of the operation for logging
     * @returns {Promise} - Promise that resolves with operation result or rejects on shutdown
     */
    async cancellableOperation(operation, operationName = 'Operation') {
        if (this.isShuttingDown) {
            throw new Error(`${operationName} cancelled due to shutdown`)
        }

        return new Promise(async (resolve, reject) => {
            // Set up shutdown check
            const shutdownCheck = setInterval(() => {
                if (this.isShuttingDown) {
                    clearInterval(shutdownCheck)
                    reject(new Error(`${operationName} cancelled due to shutdown`))
                }
            }, 100)

            try {
                const result = await operation()
                clearInterval(shutdownCheck)
                resolve(result)
            } catch (error) {
                clearInterval(shutdownCheck)
                reject(error)
            }
        })
    }

    /**
     * Wrap a user input prompt to handle graceful cancellation
     * @param {Function} promptFunction - The prompt function to wrap
     * @param {string} promptName - Name of the prompt for logging
     * @returns {Promise} - Promise that resolves with user input or throws on cancellation
     */
    async cancellablePrompt(promptFunction, promptName = 'User input') {
        return this.cancellableOperation(promptFunction, promptName)
    }
}

export default SignalHandler
