/**
 * A class used for higher level access to S3 compatible storage systems and services
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file s3.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.1.0
 */

// Import required modules
import * as fs from 'fs'
import AWS from 'aws-sdk'

class s3Utilities {
    /**
     * A class to enable consistent functionality for basic operations like writing files,
     * downloading from S3, reading files, creating ZIP archives, etc.
     * @constructor
     * @classdesc Construct the S3 controller needed to perform various actions
     * @param {Object} env - An object containing all needed environmental variables for setting up the S3 controller
     */
     constructor(env) {
        env.s3Server ? 
            this.s3Server = env.s3Server :
            this.s3Server = env.server
        env.s3User ?
            this.s3User = env.s3User :
            this.s3User = env.user
        env.s3APIKey ?
            this.s3APIKey = env.s3APIKey :
            this.s3APIKey = env.api_key
        env.s3Region ?
            this.s3Region = env.s3Region :
            this.s3Region = env.region
        this.s3Controller = new AWS.S3({
            accessKeyId: this.s3User ,
            secretAccessKey: this.s3APIKey,
            endpoint: this.s3Server ,
            s3ForcePathStyle: true, // needed with minio?
            signatureVersion: 'v4',
            region: this.s3Region // S3 won't work without the region setting
        })
    }

    /**
    * @function s3DownloadObjs
    * @description From an S3 bucket download the document associated to each interaction
    * @param {Array} interactions - an array of interaction objects
    * @param {String} targetDirectory - the target location for downloading the objects to
    * @todo this.env.s3Source is incorrect meaning it will fail for now, add srcBucket as argument
    */
    async s3DownloadObjs (interactions, targetDirectory, sourceBucket) {
        for (const interaction in interactions) {
            const objWithPath = interactions[interaction].url.split('://').pop()
            const myObj = objWithPath.split('/').pop()
            const myParams = {Bucket: sourceBucket, Key: myObj}
            const myFile = fs.createWriteStream(targetDirectory + '/' + myObj)
            const s3Get = await this.s3Controller.getObject(myParams).promise()
            myFile.write(s3Get.Body)
        }
    }

    /**
     * @function s3UploadObjs
     * @description Upload objects to a target bucket on an S3 compatible object store
     * @param {Array} interactions - an array/list of file names
     * @param {String} targetBucket - the bucket to upload the content to
     */
    async s3UploadObjs (interactions, targetBucket) {
        // Process through each interaction file
        for(const interaction in interactions){
            if(!interactions[interaction]){ continue } // Skip if there is an empty entry in the Array
            const myKey = interactions[interaction].split('/') // split to get to the file name
            const myBody = fs.createReadStream(interactions[interaction]) // open and read the file
            const myParams = {Bucket: targetBucket, Key: myKey[myKey.length - 1], Body: myBody} // setup the key elements to talk to S3
            const s3Put = await this.s3Controller.putObject(myParams).promise() // Put the object
            return [myKey[myKey.length - 1], s3Put] // return the file name and the result of the put
        }
    }

    /**
     * @function s3CreateBucket
     * @description Create a bucket in an S3 object store
     * @param {String} targetBucket - the name of the bucket
     * @returns 
     */
    async s3CreateBucket (targetBucket) {
        // Setup the bucket parameters
        const myParams = {Bucket: targetBucket}
        try {  
            // call S3 to create the bucket
            const myBucket = await this.s3Controller.createBucket(myParams).promise()
            return [true, `SUCCESS: created ${targetBucket}`, myBucket] 
        } catch (err) {
            return [false, `FAILED: unable to create ${targetBucket}`, err] 
        }
    }

    /**
     * @function s3DeleteBucket
     * @description Delete a bucket in an S3 object store
     * @param {String} targetBucket - the name of the bucket 
     * @returns 
     */
    async s3DeleteBucket (targetBucket) {
        // Setup the bucket parameters
        const myParams = {Bucket: targetBucket}
        try {  
            // call S3 to create the bucket
            const myBucket = await this.s3Controller.deleteBucket(myParams).promise()
            return [true, `SUCCESS: deleted ${targetBucket}`, myBucket] 
        } catch (err) {
            return [false, `FAILED: unable to delete ${targetBucket}`, err] 
        }

    }

    /**
     * 
     * @param {String} objectName 
     * @returns 
     */
    generateBucketName(objectName) {
        let bucketName = objectName.replace(/[^a-z0-9]/gi,'')
        return bucketName.toLowerCase()
    }
}

export default s3Utilities