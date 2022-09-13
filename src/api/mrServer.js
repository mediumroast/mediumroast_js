/**
 * A class for authenticating and talking to the mediumroast.io backend 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrServer.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import mrRest from './scaffold.js'

/**
 * An implementation for authenticating into the mediumroast.io application. The present
 * development is very simple and largely a placeholder.  After the object is constructed
 * the user would issue a login to generate the credential for usage in the API to talk to the 
 * mediumroast.io application and gather create, read, deleted and update various objects.
 * @class
 */
class Auth {
    /**
     * @constructor
     * Stores key information in memory to login to the mediumroast.io application
     * @param {String} restServer - the full URL and TCP/IP port for the mediumroast.io application
     * @param {String} apiKey - the API key for the mediumroast.io application
     * @param {String} user - your username for the mediumroast.io application
     * @param {String} secret - your secret for the mediumroast.io application
     */
    constructor(restServer, apiKey, user, secret) {
        this.apiKey = apiKey
        this.user = user
        this.secret = secret
        this.restServer = restServer
    }

    /**
     * @function login
     * Initiate a login to the mediumroast.io application
     * @returns {Object} the credential object needed to perform API calls to mediumroast.io
     */
    login() {
        return {
            'apiKey': this.apiKey,
            'restServer': this.restServer,
            'user': this.user,
            'secret': this.secret
        }
    }

    /**
     * @function logout
     * While not yet implemented meant to enable a logout of a session for the mediumroast.io
     * @returns {Boolean} true for logout at this time
     */
    logout() {
        return true
    }
}
/**
 * This class contains all of the core operations which make it easier to interact with
 * the mediumroast.io application.  Access to the RESTful endpoints is wrapped in a series
 * of Javascript functions to enable SDK users to not have to manage the details.
 * 
 * Discrete objects are subclasses of this baseObjects class and are defined below. These
 * subclasses specify additional information like the objType, etc. and as needed can
 * implement their own additional functions as needed.
 * @class
 */
class baseObjects {
    /**
     * @constructor
     * Store and setup key variables needed to operate the SDK
     * @param {Object} credential - the credential object returned from Auth.login()
     * @param {String} objType - the type of object for the API session which could be users, studies, interactions or companies
     * @param {String} apiVersion - the version of the API
     */
    constructor(credential, objType, apiVersion = 'v1') {
        this.cred = credential
        this.rest = new mrRest(credential)
        this.objType = objType
        this.apiVersion = apiVersion
    }

    /**
     * @async
     * @function getAll
     * Get all objects from the mediumroast.io application
     * @param {String} endpoint - defaults to getall and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     */
    async getAll(endpoint='getall') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.getObj(fullEndpoint)
    }

    /**
     * @async
     * @function findByName
     * Find all objects by name from the mediumroast.io application
     * @param {String} name - the name of the object to find
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     */
    async findByName(name, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: 'name', xEquals: name}
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    /**
     * @async
     * @function findById
     * Find all objects by id from the mediumroast.io application
     * @param {String} id - the id of the object to find
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     */
    async findById(id, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: "id", xEquals: id}
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    /**
     * @async
     * @function findByX
     * Find all objects by attribute and value pair from the mediumroast.io application
     * @param {String} attribute - the attribute used to find objects
     * @param {String} value - the value for the defined attribute
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     */
    async findByX(attribute, value, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: attribute, xEquals: value} 
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    /**
     * @async
     * @function createObj
     * Create objects in the mediumroast.io application
     * @param {Object} obj - the object to create in the backend
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     */
    async createObj(obj, endpoint='register') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.postObj(fullEndpoint, obj)
    }
    
    /**
     * @async
     * @function updateObj
     * Update an object in the mediumroast.io application
     * @param {Object} obj - the object to update in the backend which includes the id and, the attribute and value to be updated
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     */
    async updateObj(obj, endpoint='update') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.postObj(fullEndpoint, obj)
    }

    /**
     * @async
     * @function deleteObj
     * Delete an object in the mediumroast.io application
     * @param {String} id - the object to be deleted in the mediumroast.io application
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     * @todo implment when available in the backend
     */
    async deleteObj(id, endpoint) {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return false 
    }
}

// YOU ARE HERE THE CLASS DEFINITIONS NEED TO BE UPDATED
/**
* A subclass of baseObjects to manage mediumroast.io application User objects.
 * @class
 */
class Users extends baseObjects {
    /**
     * @constructor
     * Construct the user objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'users')
    }
}

/**
 * A subclass of baseObjects to manage mediumroast.io application Study objects.
 * @class
 */
class Studies extends baseObjects {
    /**
     * @constructor
     * Construct the study objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'studies')
    }
}

/**
 * A subclass of baseObjects to manage mediumroast.io application Company objects.
 * @class
 */
class Companies extends baseObjects {
    /**
     * @constructor
     * Construct the company objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'companies')
    }
}

/**
 * A subclass of baseObjects to manage mediumroast.io application Interaction objects.
 * @class
 */
class Interactions extends baseObjects {
    /**
     * @constructor
     * Construct the interaction objects
     * @param {Object} credential - the credential object returned from Auth.login()
     */
    constructor (credential) {
        super(credential, 'interactions')
    }
}

// Export classes for consumers
export { Auth, Users, Studies, Companies, Interactions }