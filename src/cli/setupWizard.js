/**
 * Setup-specific wizard utilities for the mediumroast setup process
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file setupWizard.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 * 
 * @note For any new user prompts added to this class, consider wrapping them with
 *       signalHandler.cancellablePrompt() in the calling code to ensure graceful
 *       handling of Ctrl-C interruptions.
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import Table from 'cli-table3'
import { logger } from 'mediumroast_api'

class SetupWizard {
    constructor() {
        this.defaultValue = "Unknown"
    }

    /**
     * Enhanced user confirmation for company creation with detailed information
     * @param {Array} companies - Companies to be created
     * @param {string} operationType - Type of operation (e.g., "owning", "first", "batch")
     * @returns {Promise<boolean>} - True if user confirms, false otherwise
     */
    async confirmCompanyCreation(companies, operationType) {
        console.log(`\n${operationType} Company Creation Summary:`)
        
        // Create a formatted table for the company creation summary
        const companyTable = new Table({
            head: ['#', 'Company Name', 'Role', 'Region', 'Description'],
            colWidths: [4, 25, 15, 10, 40]
        })

        companies.forEach((company, index) => {
            const description = company.description 
                ? (company.description.length > 35 
                    ? company.description.substring(0, 35) + '...' 
                    : company.description)
                : 'No description'
                
            companyTable.push([
                index + 1,
                company.name || 'Unnamed',
                company.role || 'No role',
                company.region || 'Unknown',
                description
            ])
        })

        console.log(companyTable.toString())
        
        const confirmed = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: `Do you want to proceed with creating these ${companies.length} companies?`,
            default: true
        }])
        
        return confirmed.proceed
    }

    /**
     * Validate company data before creation to ensure required fields are present
     * @param {Array} companies - Companies to validate
     * @returns {Array} - [isValid, validationErrors, validCompanies]
     */
    validateCompanyData(companies) {
        const errors = []
        const validCompanies = []
        
        companies.forEach((company, index) => {
            const companyErrors = []
            
            if (!company.name || company.name.trim() === '') {
                companyErrors.push(`Company ${index + 1}: Name is required`)
            }
            
            if (!company.role) {
                company.role = 'Competitor' // Default role
            }
            
            if (!company.region) {
                company.region = 'AMER' // Default region
            }
            
            if (companyErrors.length === 0) {
                validCompanies.push(company)
            } else {
                errors.push(...companyErrors)
            }
        })
        
        const isValid = errors.length === 0
        
        if (!isValid) {
            logger.warn('Company data validation failed', {
                errorCount: errors.length,
                errors: errors,
                validCompanyCount: validCompanies.length
            })
        } else {
            logger.info('Company data validation successful', {
                companyCount: validCompanies.length,
                companies: validCompanies.map(c => ({ name: c.name, role: c.role, region: c.region }))
            })
        }
        
        return [isValid, errors, validCompanies]
    }

    /**
     * Confirmation prompt for setup operations
     * @param {string} operation - The operation to confirm
     * @param {string} message - Custom message for the prompt
     * @param {boolean} defaultValue - Default value for the confirmation
     * @returns {Promise<boolean>} - True if user confirms, false otherwise
     */
    async confirmOperation(operation, message = null, defaultValue = true) {
        const promptMessage = message || `Do you want to ${operation}?`
        
        const confirmed = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: promptMessage,
            default: defaultValue
        }])
        
        logger.debug('Setup operation confirmation', {
            operation: operation,
            confirmed: confirmed.proceed,
            message: promptMessage
        })
        
        return confirmed.proceed
    }

    /**
     * Multiple choice selection for setup options
     * @param {string} message - The prompt message
     * @param {Array} choices - Array of choices
     * @param {boolean} allowMultiple - Whether to allow multiple selections
     * @returns {Promise<Array|string>} - Selected choice(s)
     */
    async selectOption(message, choices, allowMultiple = false) {
        const promptType = allowMultiple ? 'checkbox' : 'list'
        
        const answer = await inquirer.prompt([{
            type: promptType,
            name: 'selection',
            message: message,
            choices: choices,
            validate: allowMultiple ? (answer) => {
                if (answer.length < 1) {
                    return 'Please select at least one option.'
                }
                return true
            } : undefined
        }])
        
        return answer.selection
    }

    /**
     * Text input prompt with validation
     * @param {string} message - The prompt message
     * @param {string} defaultValue - Default value
     * @param {Function} validator - Validation function (optional)
     * @returns {Promise<string>} - User input
     */
    async getTextInput(message, defaultValue = '', validator = null) {
        const answer = await inquirer.prompt([{
            type: 'input',
            name: 'input',
            message: message,
            default: defaultValue,
            validate: validator || ((input) => {
                if (!input.trim()) {
                    return 'Input cannot be empty'
                }
                return true
            })
        }])
        
        return answer.input
    }

    /**
     * GitHub Actions operation selection
     * @returns {Promise<string>} - Selected operation ('install', 'update', 'reinstall')
     */
    async selectActionsOperation() {
        const choices = [
            { name: 'Install Actions (fresh installation)', value: 'install' },
            { name: 'Update Actions (update existing)', value: 'update' },
            { name: 'Reinstall Actions (remove and reinstall)', value: 'reinstall' }
        ]
        
        return await this.selectOption(
            'What GitHub Actions operation would you like to perform?',
            choices
        )
    }

    /**
     * Display setup progress
     * @param {string} step - Current step description
     * @param {number} current - Current step number
     * @param {number} total - Total number of steps
     */
    displayProgress(step, current, total) {
        const percentage = Math.round((current / total) * 100)
        const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5))
        
        console.log(`\n${chalk.blue('Progress:')} [${progressBar}] ${percentage}% (${current}/${total})`)
        console.log(`${chalk.cyan('Current Step:')} ${step}`)
    }

    /**
     * Display error with formatting
     * @param {string} message - Error message
     * @param {Error} error - Error object (optional)
     */
    displayError(message, error = null) {
        console.log(`\n${chalk.red('❌ Error:')} ${message}`)
        if (error && error.message) {
            console.log(`${chalk.gray('Details:')} ${error.message}`)
        }
    }

    /**
     * Display success message with formatting
     * @param {string} message - Success message
     */
    displaySuccess(message) {
        console.log(`\n${chalk.green('✅ Success:')} ${message}`)
    }

    /**
     * Display warning message with formatting
     * @param {string} message - Warning message
     */
    displayWarning(message) {
        console.log(`\n${chalk.yellow('⚠️  Warning:')} ${message}`)
    }
}

export default SetupWizard
