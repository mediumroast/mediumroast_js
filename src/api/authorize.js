/**
 * @fileoverview This file contains the code to authorize the user to the GitHub API
 * @license Apache-2.0
 * @version 1.0.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file authorize.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 * @class GitHubAuth
 * @classdesc This class is used to authorize the user to the GitHub API
 * 
 * @requires axios
 * @requires crypto
 * @requires open
 * @requires octoDevAuth
 * @requires chalk
 * @requires cli-table
 * 
 * @exports GitHubAuth
 * 
 * @example
 * import {GitHubAuth} from './api/authorize.js'
 * const github = new GitHubAuth()
 * const githubToken = github.getAccessToken(env)
 * 
 */ 

import axios from "axios"
import crypto from "node:crypto"
import open from "open"
import * as octoDevAuth from '@octokit/auth-oauth-device'
import chalk from "chalk"
import Table from 'cli-table'

class Auth0Auth {

    constructor(domain, contentType, clientId, callbackUrl, state, scope) {
        this.domain = domain ? domain : 'dev-tfmnyye458bzcq0u.us.auth0.com'
        this.codePath = '/oauth/device/code'
        this.tokenPath = '/oauth/token'
        this.callbackUrl = callbackUrl ? callbackUrl : 'https://app.mediumroast.io'
        // this.audience = 'https://app.mediumroast.io/app'
        this.audience = 'mediumroast-endpoint'
        this.state = state ? state : 'mrCLIstate'
        this.scope = scope ? scope : 'companies:read'
        this.algorithm = 'S256'
        this.contentType = contentType ? contentType : 'application/x-www-form-urlencoded'
        // this.clientId = clientId ? clientId : 'sDflkHs3V3sg0QaZnrLEkuinXnTftkKk'
        this.clientId = clientId ? clientId : '0ZhDegyCotxYL8Ov9Cj4K7Z0MugtgaY0'
        // NOTE: Only a native app can do PKCE, question: can the native app authenticate to the API?
        // https://dev-tfmnyye458bzcq0u.us.auth0.com/oauth/device/code
    }

    _base64URLEncode(str) {
        return str.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
    }

    createCodeVerifier (bytesLength=32) {
        const randString = crypto.randomBytes(bytesLength)
        return this._base64URLEncode(randString)
    }

    createChallengeCode(codeVerifier) {
        const codeVerifierHash = crypto.createHash('sha256').update(codeVerifier).digest()
        return this._base64URLEncode(codeVerifierHash)
    }

    async getDeviceCode() {
        const options = {
            method: 'POST',
            url: `https://${this.domain}${this.codePath}`,
            headers: {
              'content-type': this.contentType
            },
            data: new URLSearchParams({
                client_id: this.clientId,
                scope: this.scope,
                audience: this.audience
          })
        }
        let authorized
        try {
            authorized = await axios.request(options)
            return [true, authorized.data]
        } catch (err) {
            return [false, err]
        }
    }

    async openPKCEUrl(config) {
        // Construct the URL to build the client challenge
        const pkceUrl =  `https://${this.domain}/authorize?` + 
                `response_type=code&` + 
                `code_challenge=${config.challenge_code}&` + 
                `code_challenge_method=${this.algorithm}&` + 
                `client_id=${this.clientId}&` + 
                `redirect_uri=${this.callbackUrl}&` + 
                `scope='openid%20profile'&` + 
                `state=${this.state}`

        console.log(`URL>>> [${pkceUrl}]`)
        // Call the browser
        const myCmd = await open(pkceUrl)
    }

    async authorizeClient(authorizationCode, codeVerifier) {
        const options = {
            method: 'POST',
            url: `https://${this.domain}${this.codePath}`,
            headers: {
              'content-type': this.contentType
            },
            data: new URLSearchParams({
                // grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                grant_type: 'authorization_code',
                client_id: this.clientId,
                code_verifier: codeVerifier,
                code: authorizationCode,
                redirect_uri: this.callbackUrl,
          })
        }
        let authorized
        try {
            authorized = await axios.request(options)
            return [true, authorized.data]
        } catch (err) {
            return [false, err]
        }
    }

    async verifyClientAuth (verificationUri) {
        const myCmd = await open(verificationUri)
        return [true, null]
    }

    async getTokens(authorizationCode, codeVerifier) {
        const options = {
            method: 'POST',
            url: `https://${this.domain}${this.tokenPath}`,
            headers: {
              'content-type': this.contentType
            },
            data: new URLSearchParams({
                // grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                grant_type: 'authorization_code',
                client_id: this.clientId,
                code_verifier: codeVerifier,
                code: authorizationCode,
                redirect_uri: this.callbackUrl
            })
        }
        let tokens
        try {
            tokens = await axios.request(options)
            return [true, tokens.data]
        } catch (err) {
            return [false, err]
        }
    }

    async getTokensDeviceCode(deviceCode) {
        const options = {
            method: 'POST',
            url: `https://${this.domain}${this.tokenPath}`,
            headers: {
              'content-type': this.contentType
            },
            data: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                client_id: this.clientId,
                device_code: deviceCode
            })
        }
        let tokens
        try {
            tokens = await axios.request(options)
            return [true, tokens.data]
        } catch (err) {
            return [false, err]
        }
    }



    login(env) {
        const token = `${env.DEFAULT.token_type} ${env.DEFAULT.access_token}`
        return {
            apiKey: token,
            restServer: env.DEFAULT.mr_erver,
            tokenType: env.DEFAULT.token_type,
            user: `${env.DEFAULT.first_name}<${env.DEFAULT.email_address}>`
        }
    }


    logout() {
        return true
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

class GitHubAuth {
    constructor (env) {
        this.env = env
    }

    async _checkTokenExpiration(token) {
        const response = await fetch('https://api.github.com/applications/:client_id/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`client_id:client_secret`).toString('base64')}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                access_token: token
            })
        })
    
        if (!response.ok) {
            return [false, {status_cde: 500, status_msg: response.statusText}, null]
        }
    
        const data = await response.json()
        return [true, {status_cde: 200, status_msg: response.statusText}, data]
    }

    getAccessTokenPat(defaultExpiryDays = 30) {
        // Read the PAT from the file
        const pat = fs.readFileSync(this.secretFile, 'utf8').trim()

        // Check to see if the token remains valid
        const isTokenValid = this._checkTokenExpiration(pat)
        
        if (!isTokenValid[0]) {
            return isTokenValid
        }
    
        return {
          token: pat,
          auth_type: 'pat'
        }
      }
    

    /**
     * 
     * @param {Object} env - The environment object constructed from the configuration file
     * @param {String} clientType - The type of client, either 'github-app' or 'github'
     * @returns {Object} The access token object
     */
    async getAccessToken(env, clientType='github-app') {

        // Construct the oAuth device flow object which starts the browser
        let deviceCode // Provide a place for the device code to be captured
        const deviceauth = octoDevAuth.createOAuthDeviceAuth({
            clientType: clientType,
            clientId: env.clientId,
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
        let now = new Date()
        now.setHours(now.getHours() + 8)
        accessToken.expiresAt = now.toUTCString()
        // Add the device code to the accessToken object
        accessToken.deviceCode = deviceCode
        return accessToken
    }
    
}

export {Auth0Auth, GitHubAuth}