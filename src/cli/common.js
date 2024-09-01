/**
 * A class for common functions for all CLIs.
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file common.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.1.0
 */

class CLIUtilities {

    /**
     * @async
     * @function getAllObjects
     * @description Retrieve all objects from all controllers
     * @param {Object} apiControllers - an object containing all controllers
     * @returns {Array} an array containing if the operation succeeded, the message, and the objects
     * 
     * @example
     * const allObjects = await utilities.getAllObjects({companies: companyCtl, interactions: interactionCtl, studies: studyCtl})
     */
    async getAllObjects(apiControllers) {
        let allObjects = {
            companies: [],
            interactions: [],
            studies: []
        }
        const controllerNames = Object.keys(apiControllers)
        for (const controllerName of controllerNames) {
            try {
                const objs = await apiControllers[controllerName].getAll()
                allObjects[controllerName] = objs[2].mrJson
            } catch (err) {
                console.error(`ERROR: Unable to retrieve all objects from ${controllerName} due to [${err}]`)
                return [false, {status_code: 500, status_msg: `ERROR: Unable to retrieve all objects from ${controllerName} due to [${err}]`}, null]
            }
        }
        return [true, {status_code: 200, status_msg: `SUCCESS: Retrieved all objects from all controllers.`}, allObjects]
    }

    /**
     * @function getObject
     * @description Retrieve a single object from an array of objects 
     * @param {String} objName - the name of the object to retrieve
     * @param {Array} objects - the array of objects to search
     * @returns {Array} an array containing if the operation succeeded, the message, and the object
     */
    getObject(objName, objects) {
        return objects.filter(obj => obj.name === objName)
    }
}

export default CLIUtilities

