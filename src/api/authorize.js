/**
 * @fileoverview This file contains the code to authorize the user to the GitHub API
 * @license Apache-2.0
 * @version 2.0.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file authorize.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 * @class GitHubAuth
 * @classdesc This class is used to authorize the user to the GitHub API
 * 
 * @requires axios
 * @requires open
 * @requires octoDevAuth
 * @requires chalk
 * @requires cli-table3
 * @requires configparser
 * @requires FilesystemOperators
 * 
 * @exports GitHubAuth
 * 
 * @example
 * import {GitHubAuth} from './api/authorize.js'
 * const github = new GitHubAuth(env, environ, configFile)
 * const githubToken = github.verifyAccessToken()
 * 
 */ 

import open from "open"
import * as octoDevAuth from '@octokit/auth-oauth-device'
import chalk from "chalk"
import Table from 'cli-table3'
import FilesystemOperators from '../cli/filesystem.js'


class GitHubAuth {
    /**
     * @constructor
     * @param {Object} env - The environment object
     * @param {Object} environ - The environmentals object
     * @param {String} configFile - The configuration file
     */
    constructor (env, environ, configFile, configExists) {
        this.env = env
        this.clientType = 'github-app'
        this.configFile = configFile
        this.configExists = configExists
        this.filesystem = new FilesystemOperators()
        this.environ = environ
        // Use ternary operator to determine if the config file exists and if it does read it else set it to null
        this.config = configExists ? environ.readConfig(configFile) : null
    }

    verifyGitHubSection () {
        if (!this.config) {
            return false
        }
        return this.config.hasSection('GitHub')
    }

    _getFromConfig (section, option) {
        const hasOption = this.config.hasKey(section, option)
        if (hasOption) {
            return this.config.get(section, option)
        } else {
            return null
        }
    }

    getAccessTokenFromConfig () {
        return this._getFromConfig('GitHub', 'token')
    }

    getAuthTypeFromConfig () {
        return this._getFromConfig('GitHub', 'authType')
    }


    async checkTokenExpiration(token) {
        const response = await fetch('https://api.github.com/user', {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        })
    
        if (!response.ok) {
            return [false, {status_code: 500, status_msg: response.statusText}, null]
        }
    
        const data = await response.json()
        return [true, {status_code: 200, status_msg: response.statusText}, data]
    } 

    /**
     * @async
     * @function getAccessTokenDeviceFlow
     * @description Get the access token using the device flow
     * @returns {Object} The access token object
     */
    async getAccessTokenDeviceFlow() {
        // Set the clientId depending on if the config file exists
        const clientId = this.configExists ? this.env.clientId : this.env.GitHub.clientId
        // Construct the oAuth device flow object which starts the browser
        let deviceCode // Provide a place for the device code to be captured
        const deviceauth = octoDevAuth.createOAuthDeviceAuth({
            clientType: this.clientType,
            clientId: clientId,
            onVerification(verifier) {
                deviceCode = verifier.device_code
                // Print the verification artifact to the console
                console.log(
                    chalk.blue.bold(`If supported opening your browser to the Authorization website.\nIf your browser doesn't open, please copy and paste the Authorization website URL into your browser's address bar.\n`)
                )
                const authWebsitePrefix = `Authorization website:`
                const authCodePrefix = `Authorization code:`
                const authWebsite = chalk.bold.red(verifier.verification_uri)
                const authCode = chalk.bold.red(verifier.user_code)
                const table = new Table({
                    rows: [
                        [authWebsitePrefix, authWebsite],
                        [authCodePrefix, authCode]
                    ]
                })
                // Get the table as a string
                const tableString = table.toString()
                // Check to see if the table string is empty
                if (tableString !== '') {
                    // Print the table to the console, since not empty
                    console.log(tableString)
                } else {
                    // Print strings to the console, since empty
                    console.log(`\t${authWebsitePrefix} ${authWebsite}`)
                    console.log(`\t${authCodePrefix} ${authCode}`)
                }
                console.log(`\nCopy and paste the Authorization code into correct field on the Authorization website. Once authorized setup will continue.\n`)
                open(verifier.verification_uri)
            }
        })

        // Call GitHub to obtain the token
        let accessToken = await deviceauth({type: 'oauth'})
        accessToken.deviceCode = deviceCode
        return accessToken
    }

    /**
     * @async
     * @function verifyAccessToken
     * @description Verify if the access token is valid and if not get a new one depending on this.env.authType
     * @param {Boolean} saveToConfig - Save to the configuration file, default is true
     */
    async verifyAccessToken (saveToConfig=true) {

        if (this.configExists) {
            // Get key variables from the config file
            const hasGitHubSection = this.verifyGitHubSection()
            // If the GitHub section is not available, then the token is not available, return false.
            // This is only to be used when called from a function that intendes to setup the configuration file, but
            // just in case this condition occurs we want to return clearly to the caller.
            if (!hasGitHubSection) {
                return [false, {status_code: 500, status_msg: 'The GitHub section is not available in the configuration file'}, null]
            }
        }

        // Get the access token and authType from the config file since the section is available
        let accessToken
        // If the configuration exists then we can obtain the token and authType from the config file, but if
        // the configuration is not present and the intention is to use PAT this code won't be executed. Therefore,
        // prompting the user for the PAT, verifyin the PAT, and saving the PAT to the config file will be done in the
        // caller. However, if the intention is to use deviceFlow then we can support that here and return the token to the
        // caller which will then save the token and the authType to the config file.
        let authType = 'deviceFlow' 
        if (this.configExists) {
            accessToken = this.getAccessTokenFromConfig()
            authType = this.getAuthTypeFromConfig()
        }
        
        // Check to see if the token is valid but if the config isn't present then we can't check the token
        const validToken = this.configExists ? 
            await this.checkTokenExpiration(accessToken) : 
            [false, {status_code: 500, status_msg: 'The configuration file isn\'t present'}, null]
        if (validToken[0] && this.configExists) {
            return [
                true, 
                {status_code: 200, status_msg: validToken[1].status_msg},
                {token: accessToken, authType: authType}
            ]
        // If the token is not valid, then we need to return to the caller (PAT) or get a new token (deviceFlow)
        } else {
            // Case for a Personal Access Token
            if (authType === 'pat') {
                // Return the error message to the caller
                return [
                    false, 
                    {status_code: 500, status_msg: `The Personal Access Token appears to be invalid and was rejected with an error message [${validToken[1].status_msg}].\n\tPlease obtain a new PAT and update the GitHub token setting in the configuration file [${this.configFile}].`}, 
                    null
                ]
            // Case for the device flow
            } else if (authType === 'deviceFlow') {
                // Get the new access token
                accessToken = await this.getAccessTokenDeviceFlow()
                
                // Update the config if the config file exists and if saveToConfig is true
                if (this.configExists && this.config && this.saveToConfig) {
                    let tmpConfig = this.environ.updateConfigSetting(this.config, 'GitHub', 'token', accessToken.token)
                    tmpConfig = this.environ.updateConfigSetting(tmpConfig[1], 'GitHub', 'authType', authType)
                    tmpConfig = this.environ.updateConfigSetting(tmpConfig[1], 'GitHub', 'deviceCode', accessToken.deviceCode)
                    
                    // Save the config file if needed
                    this.config = tmpConfig[1]
                    if (saveToConfig) {
                        await this.config.write(this.configFile)
                    }
                }

                return [
                    true, 
                    {status_code: 200, status_msg: `The access token has been successfully updated and saved to the configuration file [${this.configFile}]`},
                    {token: accessToken.token, authType: authType, deviceCode: accessToken.deviceCode}
                ]
            }
        }
    }

    decodeJWT (token) {
        if(token !== null || token !== undefined){
         const base64String = token.split('.')[1]
         const decodedValue = JSON.parse(
                                Buffer.from(
                                    base64String,    
                                    'base64')
                                .toString('ascii')
                            )
         return decodedValue
        }
        return null
    }
}

export {GitHubAuth}