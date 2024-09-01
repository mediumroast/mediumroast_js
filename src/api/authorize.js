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
 * @requires cli-table
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
import Table from 'cli-table'
import FilesystemOperators from '../cli/filesystem.js'


class GitHubAuth {
    /**
     * @constructor
     * @param {Object} env - The environment object
     * @param {Object} environ - The environmentals object
     * @param {String} configFile - The configuration file
     */
    constructor (env, environ, configFile) {
        this.env = env
        this.clientType = 'github-app'
        this.configFile = configFile
        this.environ = environ
        this.config = environ.readConfig(configFile)
        this.filesystem = new FilesystemOperators()
    }

    verifyGitHubSection () {
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
        // Construct the oAuth device flow object which starts the browser
        let deviceCode // Provide a place for the device code to be captured
        const deviceauth = octoDevAuth.createOAuthDeviceAuth({
            clientType: this.clientType,
            clientId: this.env.clientId,
            onVerification(verifier) {
                deviceCode = verifier.device_code
                // Print the verification artifact to the console
                console.log(
                    chalk.blue.bold(`If your OS supports it, opening your browser, otherwise, navigate to the Authorization website. Then, please copy and paste the Authorization code into your browser.\n`)
                )
                const table = new Table({
                    rows: [
                        [chalk.blue.bold(`Authorization website:`), chalk.bold.red(verifier.verification_uri)],
                        [chalk.blue.bold(`Authorization code:`), chalk.bold.red(verifier.user_code)]
                    ]
                })
                console.log(table.toString())
                open(verifier.verification_uri)
            }
        })

        // Call GitHub to obtain the token
        let accessToken = await deviceauth({type: 'oauth'})

        // NOTE: The token is not returned with the expires_in and expires_at fields, this is a workaround
        // let now = new Date()
        // now.setHours(now.getHours() + 8)
        // accessToken.expiresAt = now.toUTCString()
        // Add the device code to the accessToken object
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
        // Get key variables from the config file
        const hasGitHubSection = this.verifyGitHubSection()
        // If the GitHub section is not available, then the token is not available, return false.
        // This is only to be used when called from a function that intendes to setup the configuration file, but
        // just in case this condition occurs we want to return clearly to the caller.
        if (!hasGitHubSection) {
            return [false, {status_code: 500, status_msg: 'The GitHub section is not available in the configuration file'}, null]
        }

        // Get the access token and authType from the config file since the section is available
        let accessToken = this.getAccessTokenFromConfig()
        const authType = this.getAuthTypeFromConfig()
        
        // Check to see if the token is valid
        const validToken = await this.checkTokenExpiration(accessToken)
        if (validToken[0]) {
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
                // Update the config
                let tmpConfig = this.environ.updateConfigSetting(this.config, 'GitHub', 'token', accessToken.token)
                tmpConfig = this.environ.updateConfigSetting(tmpConfig[1], 'GitHub', 'authType', authType)
                tmpConfig = this.environ.updateConfigSetting(tmpConfig[1], 'GitHub', 'deviceCode', accessToken.deviceCode)
                
                // Save the config file if needed
                this.config = tmpConfig[1]
                if (saveToConfig) {
                    await this.config.write(this.configFile)
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