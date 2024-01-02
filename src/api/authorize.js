import axios from "axios"
import crypto from "node:crypto"
import open from "open"
import * as octoDevAuth from '@octokit/auth-oauth-device'
import chalk from "chalk"


class Auth0Auth {
    /**
     * The present development is very simple and largely a placeholder.  After the object is constructed
     * the user would issue a login to generate the credential for usage in the API to talk to the 
     * mediumroast.io application and gather create, read, deleted and update various objects.
     * @constructor
     * @classdesc An implementation for authenticating into the mediumroast.io application. 
     * @param {String} restServer - the full URL and TCP/IP port for the mediumroast.io application
     * @param {String} apiKey - the API key for the mediumroast.io application
     * @param {String} user - your username for the mediumroast.io application
     * @param {String} secret - your secret for the mediumroast.io application
     * @todo Evolve as the backend improves authentication and authorization
     */
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


    /**
     * @function login
     * @description Perform "login" steps to create a credential object for usage in all RESTful interactions
     * @param {Object} env - the environment passed into the login function that includes relevant data for credential creation
     * @returns {Object} the credential object needed to perform API calls to mediumroast.io
     */
    login(env) {
        const token = `${env.DEFAULT.token_type} ${env.DEFAULT.access_token}`
        return {
            apiKey: token,
            restServer: env.DEFAULT.mr_erver,
            tokenType: env.DEFAULT.token_type,
            user: `${env.DEFAULT.first_name}<${env.DEFAULT.email_address}>`
        }
    }

    /**
     * @function logout
     * @description While not yet implemented meant to enable a logout of a session for the mediumroast.io
     * @returns {Boolean} true for logout at this time
     */
    logout() {
        return true
    }

    /**
     * @function decodeJWT
     * @description Given an input as a Java Web Token, decode and send back an object with the contents
     * @param {String} token - the JWT to decode
     * @returns {Object} the decoded token
     */
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
    async getAccessToken(env, clientType='github-app') {

        // Construct the oAuth device flow object which starts the browser
        let deviceCode // Provide a place for the device code to be captured
        const deviceauth = octoDevAuth.createOAuthDeviceAuth({
            clientType: clientType,
            clientId: env.clientId,
            onVerification(verifier) {
                deviceCode = verifier.device_code
                console.log(
                    chalk.blue.bold(
                        `
                        If your platform supports this, opening your browser. Otherwise, navigate to the URL below in your browser.
                        \n\tAuthorization URL: ${verifier.verification_uri}
                        Type or paste the code below into your browser and follow the prompts to authorize this client.
                        \n\tDevice authorization code: ${verifier.user_code}
                        `
                        
                    )
                )
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
    
    
    /**
     * @function refreshAccessToken
     * @description Assuming device flow authorization, generate a new access token from a valid refresh token
     * @param {String} clientId - The clientId for the device
     * @param {String} refreshToken - A valid unexpired refresh token
     * @param {String} accessTokenUrl - Url needed to obtain the access token using a refresh token
     * @param {String} contentType - Accepted content type defaults to 'application/json'
     * @param {String} grantType - Targeted grant type defaults to 'refresh_token'
     * @returns {Array} An array with position 0 being boolean to signify sucess/failure and position 1 being token data/err string
     */
    async refreshAccessToken(clientId, refreshToken, accessTokenUrl, contentType='application/json', grantType='refresh_token'){
        
        try {
            const resp = await axios.post(accessTokenUrl, null, {
              params: {grant_type: grantType, refresh_token: refreshToken,client_id: clientId},
              headers: {Accept: contentType},
            })
            return [true, resp.data]
        } catch (err) {
            return [false, err.message]
        }
    }
}

export {Auth0Auth, GitHubAuth}