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
import ora from 'ora'


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
        this.objectFiles = {
            Studies: 'Studies.json',
            Companies: 'Companies.json',
            Interactions: 'Interactions.json',
            Users: null
        }
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
    async findByX(attribute, value, allObjects=null) {
        if(attribute === 'name') {
            value = value.toLowerCase()
        }
        // console.log(`Searching for ${this.objType} where ${attribute} = ${value}`)
        let myObjects = []
        if(allObjects === null) {
            const allObjectsResp = await this.serverCtl.readObjects(this.objType)
            allObjects = allObjectsResp[2].mrJson
        }
        for(const obj in allObjects) {
            let currentObject
            attribute == 'name' ? currentObject = allObjects[obj][attribute].toLowerCase() : null
            if(currentObject === value) {
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

    async createObj2(objs) {
        // Create the repoMetadata object
        let repoMetadata = {
            containers: {
                [this.objType]: {}
            },
            branch: {}
        }
        // Catch the container
        const caught = await this.serverCtl.catchContainer(repoMetadata)
        // If the container is locked then return the caught object
        if(!caught[0]) {
            return caught
        }
        // Get the sha for the current branch/object
        const sha = await this.serverCtl.getSha(
            this.objType, 
            this.objectFiles[this.objType], 
            repoMetadata.branch.name
        )
        // If the sha is not found then return the sha object
        if(!sha[0]) {
            return sha
        }
        // Append the new object to the existing objects
        const mergedObjects = [...caught[2].containers[this.objType].objects, ...objs]
        // Write the new objects to the container
        const writeResp = await this.serverCtl.writeObject(
            this.objType, 
            mergedObjects, 
            repoMetadata.branch.name,
            sha[2]
        )
        // If the write fails then return the writeResp
        if(!writeResp[0]) {
            return writeResp
        }
        // Release the container
        const released = await this.serverCtl.releaseContainer(caught[2])
        // If the release fails then return the released object
        if(!released[0]) {
            return released
        }
        // Return a success message
        return [true, {status_code: 200, status_msg: `created [${objs.length}] ${this.objType}`}, null]
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
    async deleteObj(objName, source, repoMetadata=null, catchIt=true) {
        return await this.serverCtl.deleteObject(objName, source, repoMetadata, catchIt)
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

    // Create a function that checks for a locked container using the serverCtl.checkForLock() function
    async checkForLock() {
        return await this.serverCtl.checkForLock(this.objType)
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
            'description', 'company_type', 'url', 'role', 'wikipedia_url', 'status', 'logo_url',

            'region', 'country', 'city', 'state_province', 'zip_postal', 'street_address', 'latitude', 'longitude','phone',
            'google_maps_url', 'google_news_url', 'google_finance_url','google_patents_url',

            'cik', 'stock_symbol', 'stock_exchange', 'recent_10k_url', 'recent_10q_url', 'firmographic_url', 'filings_url', 'owner_tranasactions',
            
            'industry', 'industry_code', 'industry_group_code', 'industry_group_description', 'major_group_code','major_group_description'
        ]
        return await super.updateObj(name, key, value, dontWrite, system, whiteList)
    }

    async deleteObj(objName, allowOrphans=false) {
        let source = {
            from: 'Companies',
            to: ['Interactions']
        }

        // If allowOrphans is true then use the baseObjects deleteObj
        if(allowOrphans){
            return await super.deleteObj(objName, source)
        }

        // Catch the Companies and Interaction containers
        // Assign repoMetadata to capture Companies nad Studies
        let repoMetadata = {
            containers: {
                Companies: {},
                Interactions: {}
            }, 
            branch: {}
        }
        const caught = await this.serverCtl.catchContainer(repoMetadata)

        // Use findByX to get all linkedInteractions
        // NOTE: This has to be done here because the company has been deleted in the next step
        const getCompanyObject = await this.findByX('name', objName, caught[2].containers.Companies.objects)
        if(!getCompanyObject[0]) {
            return getCompanyObject
        }
        const linkedInteractions = getCompanyObject[2][0].linked_interactions

        // Delete the company
        // Use deleteObj to delete the company
        const deleteCompanyObjResp = await this.serverCtl.deleteObject(
            objName, 
            source, 
            caught[2], 
            false
        )
        if(!deleteCompanyObjResp[0]) {
            return deleteCompanyObjResp
        }
        
        // Delete all linkedInteractions
        // Update source to be from the perspective of the Interactions
        source = {
            from: 'Interactions',
            to: ['Companies']
        }
        // Use deleteObect to delete all linkedInteractions
        for(const interaction in linkedInteractions) {
            const deleteInteractionObjResp = await this.serverCtl.deleteObject(
                interaction,
                source,
                caught[2],
                false
            )
            if(!deleteInteractionObjResp[0]) {
                return deleteInteractionObjResp
            }
        }

        // Release the container
        const relased = await this.serverCtl.releaseContainer(caught[2])
        if(!relased[0]) {
            return relased
        }

        // Return the response
        return [true, {status_code: 200, status_msg: `deleted company [${objName}] and all linked interactions`}, null]
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

    async deleteObj(objName) {
        const source = {
            from: 'Interactions',
            to: ['Companies']
        }
        return await super.deleteObj(objName, source)
    }
}

// Export classes for consumers
export { Studies, Companies, Interactions, Users }