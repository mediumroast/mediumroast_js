// NOTICE: This module is reserved for future use


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

    async findById(id, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: "id", xEquals: id}
        return this.rest.postObj(fullEndpoint, my_obj)
    }

  
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


    async deleteObj(id, endpoint='delete') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.deleteObj(fullEndpoint, {"id": id}) 
    }
}


class Users extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the user objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'users')
    }
}

class Studies extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the study objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'studies')
    }
}

class Companies extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the company objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'companies')
    }
}


class Interactions extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the interaction objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'interactions')
    }
}

// Export classes for consumers
export { Auth, Users, Studies, Companies, Interactions }