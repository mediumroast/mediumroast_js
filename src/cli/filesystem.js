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
     * @function saveTextOrBlobFile
     * @description Save textual or BLOB data to a file
     * @param {String} fileName - full path to the file and the file name to save to
     * @param {*} data - the content to save to a file which could be JSON, XML, TXT, etc.
     * @returns {Array} containing the status of the save operation, status message and null/error
     * 
     * @example
     * const myFile = new FilesystemOperators()
     * const myFileData = await myFile.saveTextOrBlobFile('myFile.txt', 'This is my file data')
     * if(myFileData[0]) {
     *  console.log(myFileData[1])
     * } else {
     * console.log(myFileData[1])
     * }
     * 
     */
    saveTextOrBlobFile(fileName, data) {
        fs.writeFileSync(fileName, data, err => {
            if (err) {
                return [false, `Did not save file [${fileName}] because: ${err}`, null]
            }
        })
        return [true, `Saved file [${fileName}]`, null]
    }

    /**
     * @async
     * @function readBlobFile
     * @description Safely read a binary file of any kind into a base64 encoded string
     * @param {String} fileName - the full path to the file name to read
     * @returns {Array} containing the status of the read operation, status message and data read
     * 
     * @example
     * const myFile = new FilesystemOperators()
     * const myFileData = await myFile.readBlobFile('myFile.txt')
     * if(myFileData[0]) {
     *   console.log(myFileData[2])
     * } else {
     *  console.log(myFileData[1])
     * }
     * 
     */
    readBlobFile(fileName) {
        try {
            const fileData = fs.readFileSync(fileName, 'base64')
            return [true, 'Read file [' + fileName + ']', fileData]
        } catch (err) {
            return [false, 'Unable to read file [' + fileName + '] because: ' + err, null]
        }
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
     * @function readJSONFile
     * @description Safely read a JSON file
     * @param {String} fileName - name of the file to read
     * @returns {Array} containing the status of the read operation, status message and data read
     */
    readJSONFile(fileName) {
        try {
            const fileData = fs.readFileSync(fileName, 'utf8')
            const jsonData = JSON.parse(fileData)
            return [true, 'Read file [' + fileName + ']', jsonData]
        } catch (err) {
            return [false, 'Unable to read file [' + fileName + '] because: ' + err, null]
        }
    }

    importJSONFile(fileName) {
        try {
            const fileData = fs.readFileSync(
                new URL(fileName, import.meta.url), 
                'utf8'
            )
            const jsonData = JSON.parse(fileData)
            return [true, 'Read file [' + fileName + ']', jsonData]
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
            return [false, 'Did not create directory [' + dirName + '] because: ' + err.message, err]
        }
    }

    /**
     * @function rmDir
     * @description Recursively remove a directory
     * @param {String} dirName - full path to the parent directory to remove
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

    /**
     * @function rmObj
     * @description Remove a file
     * @param {String} fileName - full path to the file name to remove
     * @returns {Array} containing the status of the rmdir operation, status message and null
     */
    rmObj(fileName) {
        try {
            fs.rmSync(fileName)
            return [true, 'Removed file named [' + fileName + '].', null]
        } catch (err) {
            return [false, 'Did not remove file named [' + fileName + '] because: ' + err, null]
        }
    }

    /**
     * @function listAllFiles
     * @description List all contents of the directory
     * @param {String} dirName - full path of the directory to list the contents of
     * @returns {Array} containing the status of the rmdir operation, status message and either the file contents or null
     */
    listAllFiles(dirName) {
        try {
            const myFiles = fs.readdirSync(dirName)
            return [true, 'Able to access [' + dirName + '] and list all content', myFiles]
        } catch (err) {
            return [false, 'Unable to list contents of [' + dirName + '] because: ' + err, null]
        }
    }

    // Create a function that will recursively list all files in a directory
    /**
     * @function globAllFilesRecursive
     * @description List all contents of the directory recursively
     * @param {String} dirName - full path of the directory to list the contents of
     * @returns {Array} containing the status of the rmdir operation, status message and either the file contents or null
     */
     

    /**
     * @function checkFilesystemObjectType
     * @description Check the type of file system object 
     * @param {String} fileName - name of the file system object to check
     * @returns {Array} containing the status of the function, status message and either the file system object type or null
     */
    checkFilesystemObjectType(fileName) {
        try {
            const myType = fs.statSync(fileName)
            return [true, 'Able to check [' + fileName + '] and its type', myType]
        } catch (err) {
            return [false, 'Unable to check [' + fileName + '] because: ' + err, null]
        }
    }

    /**
     * @async
     * @function setFilePermissions
     * @description Set the permissions of a file system object to what is specified in Octal
     * @param {String} fileName - the full path to the file name to change the permissions to
     * @param {Octal} permission - the permission in an octal integer to set the file name to, defaults to 0o755
     * @returns {Promise} A timeout to ensure that the file permissions are actually set.
     */
    async setFilePermissions(fileName, permission=0o755, timeout=50) {
        fs.chmodSync(fileName, permission)
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('Time\'s up')
            }, timeout)
        })
    }
}

export default FilesystemOperators