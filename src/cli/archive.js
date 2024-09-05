/**
 * @fileoverview A class used to create or restore from a ZIP based arhive package
 * @license Apache-2.0
 * @version 2.0.1
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file archive.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 * @class ArchivePackage
 * @classdesc A class designed to enable consistent ZIP packaging for mediumroat.io archives/backups
 * 
 * @requires adm-zip
 * 
 * @exports ArchivePackage
 * 
 * @example
 * import ArchivePackage from './archive.js'
 * const archive = new ArchivePackage('myArchive.zip')
 * const createStatus = await archive.createZIPArchive('myDirectory')
 * const extractStatus = await archive.extractZIPArchive('myDirectory')
 * 
 */

// Import required modules
import zip from 'adm-zip'

class ArchivePackage {    
    /** 
     * @constructor
     * @classdesc Apply consistent operations to ZIP packages to enable users to backup and restore
     * @param {String} packageName - the name of the package to either create or extract depending upoon the operation called
     * @todo Look at the logic in mr_backup to determine what can be pulled into this class 
     */
    constructor(packageName) {
        this.packageName = packageName
    }

    /**
     * @async
     * @function createZIPArchive
     * @description Create a ZIP package from a source directory
     * @param {String} sourceDirectory - the full path to directory where the ZIP package will be stored
     * @returns {Array} containing the status of the create operation, status message and null 
     */
    async createZIPArchive(sourceDirectory) {
        try {
            const zipPackage = new zip()
            await zipPackage.addLocalFolder(sourceDirectory)
            await zipPackage.writeZip(this.packageName)
            return [true, `SUCCESS: Created [${this.packageName}] successfully`, null]
        } catch (err) {
            return [false, `ERROR: Something went wrong. [${err}]`, null]
        }
    }

    /**
     * @async
     * @function extractZIPArchive
     * @description Extract objects from a ZIP package into a target directory
     * @param {String} targetDirectory - the location for the ZIP package to be extracted to
     * @returns {Array} containing the status of the create operation, status message and null 
     */
    async extractZIPArchive(targetDirectory) {
        try {
            const zipPackage = new zip(this.packageName)
            await zipPackage.extractAllTo(targetDirectory, true, false)
            return [true, `SUCCESS: Extracted [${outputFile}] successfully`, null]
        } catch (err) {
            return [false, `ERROR: Something went wrong. [${err}]`, null]
        }
    }   
}

export default ArchivePackage