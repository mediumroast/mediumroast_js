/**
 * A class used to perform various file system operations
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file filesystem.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */

// Import required modules
import * as fs from 'fs'

class FilesystemOperators {
    /**
     * A class meant to make it safe and easy for file system operations 
     * @classdesc Enable users of the class higher level and safe operations to interact with the file system
     */

    /**
     * @function saveTextFile
     * @description Save textual data to a file
     * @param {String} fileName - full path to the file and the file name to save to
     * @param {String} text - the string content to save to a file which could be JSON, XML, TXT, etc.
     * @returns {Array} containing the status of the save operation, status message and null/error
     */
     saveTextFile(fileName, text) {
        fs.writeFileSync(fileName, text, err => {
            if (err) {
                return [false, 'Did not save file [' + fileName + '] because: ' + err, null]
            }
        })
        return [true, 'Saved file [' + fileName + ']', null]
    }

    /**
     * @function readTextFile
     * @description Safely read a text file of any kind
     * @param {String} fileName - name of the file to read
     * @returns {Array} containing the status of the read operation, status message and data read
     */
    readTextFile(fileName) {
        try {
            const fileData = fs.readFileSync(fileName, 'utf8')
            return [true, 'Read file [' + fileName + ']', fileData]
        } catch (err) {
            return [false, 'Unable to read file [' + fileName + '] because: ' + err, null]
        }
    }

    /**
     * @function checkFilesystemObject
     * @description Check to see if a file system object exists or not
     * @param {String} name - full path to the file system object to check
     * @returns {Array} containing the status of the check operation, status message and null
     */
     checkFilesystemObject(name) {
        if (fs.existsSync(name)) {
            return [true, 'The file system object [' + name + '] was detected.', null]
        } else {
            return [false, 'The file system object [' + name + '] was not detected.', null]
        }
     }

    /**
     * @function safeMakedir
     * @description Resursively and safely create a directory
     * @param {String} dirName - full path to the directory to create
     * @returns {Array} containing the status of the mkdir operation, status message and null
     */
    safeMakedir(dirName) {
        try {
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true })
                return [true, 'Created directory [' + dirName + ']', null]
            } else {
                return [true, 'Directory [' + dirName + '] exists did not create.', null]
            }
        } catch (err) {
            return [false, 'Did not create directory [' + dirName + '] because: ' + err, null]
        }
    }

    /**
     * @function rmDir
     * @description Recursively remove a directory
     * @param {String} dirName - full path to the parent directory to revmove
     * @returns {Array} containing the status of the rmdir operation, status message and null
     */
    rmDir(dirName) {
        try {
            fs.rmSync(dirName, {recursive: true})
            return [true, 'Removed directory [' + dirName + '] and all contents', null]
        } catch (err) {
            return [false, 'Did not remove directory [' + dirName + '] because: ' + err, null]
        }
    }
}

export default FilesystemOperators