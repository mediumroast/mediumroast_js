/**
 * A class for authenticating and talking to the mediumroast.io backend 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrServer.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import mrRest from './scaffold.js'

class Auth {
    constructor(restServer, apiKey, user, secret) {
        this.apiKey = apiKey
        this.user = user
        this.secret = secret
        this.restServer = restServer
    }

    login() {
        return {
            'apiKey': this.apiKey,
            'restServer': this.restServer,
            'user': this.user,
            'secret': this.secret
        }
    }

    logout() {
        return true
    }
}

class baseObjects {
    constructor(credential, objType, apiVersion = 'v1') {
        this.cred = credential
        this.rest = new mrRest(credential)
        this.objType = objType
        this.apiVersion = apiVersion
    }

    async getAll(endpoint='getall') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.getObj(fullEndpoint)
    }

    async findByName(name, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: 'name', xEquals: name}
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    // TODO change to findById
    // NOTE this needs to change in the backend implementation too
    async findById(id, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: "id", xEquals: id}
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    // TODO change to findByX
    // NOTE this needs to change in the backend implementation too
    async findByX(attribute, value, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: attribute, xEquals: value} 
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    async createObj(obj, endpoint='register') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.postObj(fullEndpoint, obj)
    }
        
    async updateObj(obj, endpoint='update') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.postObj(fullEndpoint, obj)
    }

    async deleteObj(id, endpoint) {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return false 
    }
}

class Users extends baseObjects {
    constructor (credential) {
        super(credential, 'users')
    }
}

class Studies extends baseObjects {
    constructor (credential) {
        super(credential, 'studies')
    }
}

class Companies extends baseObjects {
    constructor (credential) {
        super(credential, 'companies')
    }
}

class Interactions extends baseObjects {
    constructor (credential) {
        super(credential, 'interactions')
    }
}

// Export classes for consumers
export { Auth, Users, Studies, Companies, Interactions }