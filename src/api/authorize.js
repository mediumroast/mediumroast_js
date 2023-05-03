import axios from "axios"
import crypto from "node:crypto"
import open from "open"

class Authenticate {
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
        // this.domain = domain ? domain : 'dev-tfmnyye458bzcq0u.us.auth0.com'
        this.codePath = '/oauth/device/code'
        this.tokenPath = '/oauth/token'
        this.callbackUrl = callbackUrl ? callbackUrl : 'http://localhost:3000/login'
        this.state = state ? state : 'mrCLIstate'
        this.scope = scope ? scope : 'companies:read'
        this.contentType = contentType ? contentType : 'application/x-www-form-urlencoded'
        // this.clientId = clientId ? clientId : '0ZhDegyCotxYL8Ov9Cj4K7Z0MugtgaY0'
        this.clientId = clientId ? clientId : 'xifSWB6CzfG5g21RZzl4lpjsg9yCTXLJ'
    }

    _base64URLEncode(str) {
        return str.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
    }

    _createChallengeCode() {
        const randString = crypto.randomBytes(32)
        const base64String = this._base64URLEncode(randString)
        return this._base64URLEncode(crypto.createHash('sha256').update(base64String).digest())
    }

    async openPKCEUrl() {
        const challengeCode = this._createChallengeCode()
        // Construct the URL to build the client challenge
        const pkceUrl =  `https://${this.domain}/authorize?response_type=code&code_challenge=${challengeCode}&code_challenge_method=S256&client_id=${this.clientId}&redirect_uri=${this.callbackUrl}&scope=${this.scope}&state=${this.state}`
        // Call the browser
        const myCmd = await open(pkceUrl)
        return [challengeCode, this.clientId]
    }

    async authorizeClient(deviceCode, challengeCode) {
        const options = {
            method: 'POST',
            url: `https://${this.domain}${this.codePath}`,
            headers: {
              'content-type': this.contentType
            },
            data: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.clientId,
                code_verifier: challengeCode,
                code: deviceCode,
                redirect_uri: this.callbackUrl
          })
        }
        let authorizationCode
        try {
            authorizationCode = await axios.request(options)
            return [true, authorizationCode.data]
        } catch (err) {
            console.log('AUTH CODE')
            return [false, err]
        }
    }

    async verifyClientAuth (verificationUri) {
        const myCmd = await open(verificationUri)
        return [true, null]
    }

    async getTokens(userCode) {
        const options = {
            method: 'POST',
            url: `https://${this.domain}${this.tokenPath}`,
            headers: {
              'content-type': this.contentType
            },
            data: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                client_id: this.clientId,
                device_code: userCode,
                scope: this.scope
            })
        }
        let tokens
        try {
            tokens = await axios.request(options)
            return [true, tokens.data]
        } catch (err) {
            console.log('TOKENS')
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
}

export default Authenticate