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
     * @returns {Array} the results from the called function mrRest class
     */
    async findByName(name) {
        return this.findByX('name', name)
    }

    /**
     * @async
     * @function findById
     * @description Find all objects by id from the mediumroast.io application
     * @param {String} id - the id of the object to find
     * @param {String} endpoint - defaults to findbyx and is combined with credential and version info
     * @returns {Array} the results from the called function mrRest class
     * @deprecated 
     */
    async findById(id) {
        return false
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
     * @returns {Array} the results from the called function mrRest class
     */
    async findByX(attribute, value) {
        let myObjects = []
        const allObjectsResp = await this.serverCtl.readObjects(this.objType)
        const allObjects = allObjectsResp[2].mrJson
        for(const obj in allObjects) {
            if(allObjects[obj][attribute] === value) {
                myObjects.push(allObjects[obj])
            }
        }
        return [true, `SUCCESS: found all objects where ${attribute} = ${value}`, myObjects]
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
    async updateObj(objName, key, value, dontWrite, system, whiteList) {
        return await this.serverCtl.updateObject(this.objType, objName, key, value, dontWrite, system, whiteList)
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

// Create a subclass called Users that inherits from baseObjects
class Users extends baseObjects {
    /**
     * @constructor
     * @classdesc A subclass of baseObjects that construct the user objects
     * @param {String} token - the token for the GitHub application
     * @param {String} org - the organization for the GitHub application
     * @param {String} processName - the process name for the GitHub application
     */
    constructor (token, org, processName) {
        super(token, org, processName, 'Users')
    }

    // Create a new method for getAll that is specific to the Users class using getUser() in github.js
    async getAll() {
        return await this.serverCtl.getAllUsers()
    }

    // Create a new method for findMyself that is specific to the Users class using getUser() in github.js
    async getMyself() {
        return await this.serverCtl.getUser()
    }

    async findByName(name) {
        return this.findByX('login', name)
    }

    async findByX(attribute, value) {
        let myUsers = []
        const allUsersResp = await this.getAll()
        const allUsers = allUsersResp[2]
        for(const user in allUsers) {
            if(allUsers[user][attribute] === value) {
                myUsers.push(allUsers[user])
            }
        }
        return [true, `SUCCESS: found all users where ${attribute} = ${value}`, myUsers]
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

    async updateObj(objToUpdate, dontWrite=false, system=false) {
        // Destructure objToUpdate
        const { name, key, value } = objToUpdate
        // Define the attributes that can be updated by the user
        const whiteList = [
            'description', 'company_type', 'url', 'role', 'wikipedia_url', 'status',

            'region', 'country', 'city', 'state_province', 'zip_postal', 'street_address', 'latitude', 'longitude','phone',
            'google_maps_url', 'google_news_url', 'google_finance_url','google_patents_url',

            'cik', 'stock_symbol', 'stock_exchange', 'recent_10k_url', 'recent_10q_url', 'firmographic_url', 'filings_url', 'owner_tranasactions',
            
            'industry', 'industry_code', 'industry_group_code', 'industry_group_description', 'major_group_code','major_group_description'
        ]
        return await super.updateObj(name, key, value, dontWrite, system, whiteList)
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

    async updateObj(objToUpdate, dontWrite=false, system=false) {
        // Destructure objToUpdate
        const { name, key, value } = objToUpdate
        // Define the attributes that can be updated by the user
        const whiteList = [
            'status', 'content_type', 'file_size', 'reading_time', 'word_count', 'page_count', 'description', 'abstract',

            'region', 'country', 'city', 'state_province', 'zip_postal', 'street_address', 'latitude', 'longitude',
            
            'public', 'groups' 
        ]
        return await super.updateObj(name, key, value, dontWrite, system, whiteList)
    }
}

// Export classes for consumers
export { Studies, Companies, Interactions, Users }