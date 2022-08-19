// Import required modules
import mrRest from './scaffold.js'

class Auth {
    constructor(restServer, user, secret, apiKey) {
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

    async getByName(name, endpoint='getbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {'getByX': 'name', 'xEquals': name}
        return this.rest.getObj(fullEndpoint, my_obj)
    }

    async getById(id, endpoint='getbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {'getByX': 'id', 'xEquals': id}
        return this.rest.getObj(fullEndpoint, my_obj)
    }

    async getByX(attribute, value, endpoint='getbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {'getByX': attribute, 'xEquals': value} 
        return this.rest.getObj(fullEndpoint, my_obj)
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

export class Users extends baseObjects {
    constructor (credential) {
        super(credential, 'users')
    }
}

export class Studies extends baseObjects {
    constructor (credential) {
        super(credential, 'studies')
    }
}

export class Companies extends baseObjects {
    constructor (credential) {
        super(credential, 'companies')
    }
}

export class Interactions extends baseObjects {
    constructor (credential) {
        super(credential, 'interactions')
    }
}

// Export classes for consumers
export { Users, Studies, Companies, Interactions }