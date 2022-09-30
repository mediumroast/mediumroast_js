/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file helpers.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */

// Import required modules
import * as fs from 'fs'
import zip from 'adm-zip'
import AWS from 'aws-sdk'


class Utilities {
    /**
     * A class to enable consistent functionality for basic operations like writing files,
     * downloading from S3, reading files, creating ZIP archives, etc.
     * @constructor
     * @classdesc Largely reserved for future use a basic constructor to create the object
     * @param {String} objectType - The type of object constructing this object
     */
    constructor(objectType) {
        this.objectType = objectType ? objectType : null
    }

    /**
     * @function saveTextFile
     * @description Save textual data to a file
     * @param {String} fileName - full path to the file and the file name to save to
     * @param {String} content - the string content to save to a file which could be JSON, XML, TXT, etc.
     * @returns {Array} containing the status of the save operation, status message and null/error
     */
    saveTextFile(fileName, content) {
        fs.writeFileSync(fileName, content, err => {
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

    /**
     * @function createZIPArchive
     * @description Create a ZIP package from a source directory
     * @param {String} outputFile - the name, including the full path name, of the target ZIP package
     * @param {Sting} sourceDirectory - the full path to directory where the ZIP package will be stored
     * @returns {Array} containing the status of the create operation, status message and null 
     */
    async createZIPArchive(outputFile, sourceDirectory) {
        try {
            const zipPackage = new zip()
            zipPackage.addLocalFolder(sourceDirectory)
            zipPackage.writeZip(outputFile)
            return [true, `Created ${outputFile} successfully`, null]
        } catch (e) {
            return [false, `Something went wrong. ${e}`, null]
        }
    }

    /**
     * @function extractZIPArchive
     * @description Extract objects from a ZIP package into a target directory
     * @param {String} inputFile - the ZIP file name, including the full path, to be extracted 
     * @param {String} targetDirectory - the location for the ZIP package to be extracted to
     */
    async extractZIPArchive(inputFile, targetDirectory) {
        try {
            const zipPackage = new zip(inputFile)
            zipPackage.extractAllTo(targetDirectory, true)
            console.log(`Extracted ${outputFile} successfully`)
        } catch (e) {
            console.log(`Something went wrong. ${e}`)
        }
    }

    /**
     * @function s3DownloadObjs
     * @description From an S3 bucket download the document associated to each interaction
     * @param {Array} interactions - an array of interaction objects
     * @param {Object} env - the environmental settings to use for accessing the S3 endpoint
     * @param {String} targetDirectory - the target location for downloading the objects to
     * @todo As the implementation grows this function will likely need be put into a separate class
     */
    async s3DownloadObjs (interactions, env, targetDirectory) {
        const s3Ctl = new AWS.S3({
            accessKeyId: env.s3User ,
            secretAccessKey: env.s3APIKey,
            endpoint: env.s3Server ,
            s3ForcePathStyle: true, // needed with minio?
            signatureVersion: 'v4',
            region: env.s3Region // S3 won't work without the region setting
        })
        for (const interaction in interactions) {
            const objWithPath = interactions[interaction].url.split('://').pop()
            const myObj = objWithPath.split('/').pop()
            const myParams = {Bucket: env.s3Source, Key: myObj}
            const myFile = fs.createWriteStream(targetDirectory + '/' + myObj)
            const s3Get = await s3Ctl.getObject(myParams).promise()
            myFile.write(s3Get.Body)
        }
    }
    
}

export { Utilities }