/**
 * A class for authenticating and talking to the mediumroast.io backend 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file gitHubServer.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import GitHubFunctions from './github.js'
import { createHash } from 'crypto'


class baseObjects {
    /**
     * This class contains all of the core operations which make it easier to interact with the GitHub backend.
     * Access to objects is wrapped in a series of functions which are meant to be used by the consumer of the class.
     * @constructor
     * @classdesc An implementation for interacting with the GitHub backend.
     * @param {String} token - the token for the GitHub application
     * @param {String} org - the organization for the GitHub application
     * @param {String} processName - the process name for the GitHub application
     * @param {String} objType - the object type for the GitHub application
    */
    constructor(token, org, processName, objType) {
        this.serverCtl = new GitHubFunctions(token, org, processName)
        this.objType = objType
    }

    /**
     * @async
     * @function getAll
     * @description Get all objects from the mediumroast.io application
     * @returns {Array} the results from the called function mrRest class
     */
    async getAll() {
        return await this.serverCtl.readObjects(this.objType)
    }

    /**
     * @async
     * @function findByName
     * @description Find all objects by name from the mediumroast.io application
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
     * @description Find all objects by id from the mediumroast.io application
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
     * @description Find all objects by attribute and value pair from the mediumroast.io application
     * @param {String} attribute - the attribute used to find objects
     * @param {String} value - the value for the defined attribute
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     * @todo Reimplement for GitHub
     */
    async findByX(attribute, value, endpoint='findbyx') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        const my_obj = {findByX: attribute, xEquals: value} 
        return this.rest.postObj(fullEndpoint, my_obj)
    }

    /**
     * @async
     * @function createObj
     * @description Create objects in the mediumroast.io application
     * @param {Array} objs - the objects to create in the backend
     * @returns {Array} the results from the called function mrRest class
     */
    async createObj(objs) {
        return await this.serverCtl.createObjects(this.objType, objs)
    }
    
    /**
     * @async
     * @function updateObj
     * @description Update an object in the mediumroast.io application
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
     * @description Delete an object in the mediumroast.io application
     * @param {String} id - the object to be deleted in the mediumroast.io application
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     * @todo implment when available in the backend
     */
    async deleteObj(id, endpoint='delete') {
        const fullEndpoint = '/' + this.apiVersion + '/' + this.objType + '/' + endpoint
        return this.rest.deleteObj(fullEndpoint, {"id": id}) 
    }

    /**
     * @async
     * @function linkObj
     * @description Link objects in the mediumroast.io application
     * @param {Array} objs - the objects to link in the backend
     * @returns {Array} the results from the called function mrRest class
    */
    linkObj(objs) {
        let linkedObjs = {}
        for(const obj in objs) {
            const objName = objs[obj].name
            const sha256Hash = createHash('sha256').update(objName).digest('hex')
            linkedObjs[objName] = sha256Hash
        }
        return linkedObjs
    }
}

class Studies extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the study objects
     * @param {String} token - the token for the GitHub application
     * @param {String} org - the organization for the GitHub application
     * @param {String} processName - the process name for the GitHub application
     */
    constructor (token, org, processName) {
        super(token, org, processName, 'Studies')
    }
}

class Companies extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the company objects
     * @param {String} token - the token for the GitHub application
     * @param {String} org - the organization for the GitHub application
     * @param {String} processName - the process name for the GitHub application
     */
    constructor (token, org, processName) {
        super(token, org, processName, 'Companies')
    }
}


class Interactions extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the interaction objects
     * @param {String} token - the token for the GitHub application
     * @param {String} org - the organization for the GitHub application
     * @param {String} processName - the process name for the GitHub application
     */
    constructor (token, org, processName) {
        super(token, org, processName, 'Interactions')
    }

    async createObj(objs) {
        // NOTE: This is an interesting way to do this, but it may not be correct.
        const linkedCompanies = this.linkObj(objs)
        const linkedStudies = this.linkObj(objs)
        const linkedInteractions = this.linkObj(objs)
        const linkedObjs = {
            linked_companies: linkedCompanies,
            linked_studies: linkedStudies,
            linked_interactions: linkedInteractions
        }
        return await this.serverCtl.createObjects(this.objType, objs, linkedObjs)
    }
}

// Export classes for consumers
export { Studies, Companies, Interactions }