/**
 * A class for common functions for all CLIs.
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file common.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.1.0
 */


// Import required modules
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

class Utilities {
    /**
     * @async
     * @function downloadBinary
     * @description When given a full URL to an image download the image to the defined location
     * @param {String} url - the full URL to the targeted image
     * @param {String} dir - the target directory to save the file to
     * @param {String} filename - the name of the file to save the image to
     */
    async downloadBinary(url, directory, filename, showDownloadStatus=false) {
        const myFullPath = path.resolve(directory, filename)
        const myConfig = {
            responseType: "stream",
        }
        try {
            const resp = await axios.get(url, myConfig)
            const imageFile = fs.createWriteStream(myFullPath)
            const myDownload = resp.data.pipe(imageFile)
            const foo = await myDownload.on('finish', () => {
                imageFile.close()
                if(showDownloadStatus) {
                    console.log(`SUCCESS: Downloaded [${myFullPath}]`)
                }
            })
            return myFullPath
        } catch (err) {
            console.log(`ERROR: Unable to download file due to [${err}]`)
        }
    }

    async getBinary(url, fileName, directory) {
        const binaryPath = path.resolve(directory, fileName)
        const response = await axios.get(url, { responseType: 'stream' });
        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(binaryPath) 
            response.data.pipe(fileStream)
            
            let failed = false
            fileStream.on('error', err => {
              reject([false, {status_code: 500, status_msg: `FAILED: could not download ${url} to ${binaryPath}`}, err])
              failed = true 
            })
        
            fileStream.on('close', () => {
                if (!failed) {
                    resolve([true, {status_code: 200, status_msg: `SUCCESS: downloaded ${url} to ${binaryPath}`}, binaryPath]) 
                } else {
                    resolve([false, {status_code: 500, status_msg: `FAILED: could not download ${url} to ${binaryPath}`}, err])
                }
            })
        
          })
    }
}

export {Utilities}

