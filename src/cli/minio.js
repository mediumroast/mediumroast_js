import * as os from  'os'
import * as crypto from 'crypto'
import ora from "ora"
import FilesystemOperators from './filesystem.js'
import { exec } from 'child_process'
import { Utilities } from './common.js'

class MinioUtilities {
    /**
     * Enable various administrative operations for minio using the minio
     * CLI called mc.  This is necessary because minio doesn't implement the 
     * equivalent AWS API operations allowing users with the proper IAM rights
     * to perform administrative functions like creating a user, attaching a user
     * to a policy and so on.  
     * @constructor
     * @classdesc Control minio operations through the minio CLI mc
     * @param {Object} env - A complete URI including a port if required
     * @param {Boolean} silent - Determines if the module will log to the console or not defaults to true
     * @param {String} aliasName - The alias for this minio server instance defaults to mrs3
     * @param {String} path - The full path needed to eventually call the minio mc CLI defaults to ./
     * @param {String} binary - A name for the binary defaults to mc
     */
    constructor(env, silent=true, aliasName='mrs3', path='./', binary='mc') {
        this.server = env.s3_settings.server
        this.alias = aliasName
        this.user = env.s3_settings.user
        this.key = env.s3_settings.api_key
        this.path = path
        this.binary = binary
        this.minioBaseUrl = 'https://dl.min.io/client/mc/release/'
        this.fsUtils = new FilesystemOperators()
        this.commonUtils = new Utilities()
        this.silent = silent
    }


    _resolveMinioClientName () {
        const type = os.type()
        const arch = os.arch()
        const cpuInfo = os.cpus()[0].model
        const osInfo = {os: type.toLowerCase(), arch: arch.toLowerCase(), cpu: cpuInfo.toLowerCase()}
        const binaryNames = {
            darwin: {arm: 'darwin-arm64/mc', intel:'darwin-amd64/mc'},
            linux: 'linux-amd64/mc',
            windows_nt: 'windows-amd64/mc.exe'
        }
        let binaryType
        if (osInfo.os === 'darwin') {
            osInfo.cpu.includes('apple') ? binaryType = binaryNames[osInfo.os].arm : binaryNames[osInfo.os].intel
        } else {
            binaryType = binaryNames[osInfo.os]
        }
        return `${this.minioBaseUrl}${binaryType}`
    }

    async _getMinioClient () {
        if (!this.silent) {console.log(`Attempting to download ${this.path}${this.binary} ...`)}
        const minioClientUrl = this._resolveMinioClientName()
        if (!this.silent) {console.log(`Resolved client URL to ${minioClientUrl} ...`)}
        const result = await this.commonUtils.getBinary(minioClientUrl, this.binary, this.path)
        if (!this.silent && result[0]) {console.log(`Downloaded client ${minioClientUrl} to ${result[2]} ...`)}
        else if (!this.silent && !result[0]) {console.log(`Failed to download client ${minioClientUrl} ...`)}
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('Done!')
            }, 50)
        })
    }

    async _execWrapper(command, timeout=400) {
        let { stdout, stderr } = exec(command)
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('Time\'s up')
            }, timeout)
        })
    }

    async _prepMinioClient () {
        const getClientRes = await this._getMinioClient()

        if (!this.silent) {console.log(`Setting permissions for ${this.path}${this.binary} ...`)}
        const setPermsRes = await this.fsUtils.setFilePermissions(`${this.path}${this.binary}`)

        if (!this.silent) {console.log(`Setting client alias information for ${this.path}${this.binary} ...`)}
        const command = `${this.path}${this.binary} alias set ${this.alias} ${this.server} ${this.user} ${this.key}`
        await this._execWrapper(command)
    }

    async _createUser(userName, password) {
        if (!this.silent) {console.log(`Creating user ${userName} ...`)}
        const command = `${this.path}${this.binary} admin user add ${this.alias} ${userName} ${password}`
        await this._execWrapper(command)
    }

    async _setPolicy(userName, policyName='MrUser') {
        if (!this.silent) {console.log(`Assigning policy ${policyName} to user ${userName} ...`)}
        const command = `${this.path}${this.binary} admin policy attach ${this.alias} ${policyName} --user ${userName}`
        await this._execWrapper(command)
    }

    /**
     * @async
     * @function addMinioUser
     * @description Create a minio user and attach the appropriate policy to the user
     * @param {*} userName - the user name for the operations
     * @param {*} companyName - the company name associated to the user
     * @returns {String} A string containing the key is returned to the caller
     */
    async addMinioUser(userName, companyName) {
        // Establish the spinner
        const mySpinner = new ora('Defining and saving the minio credential ...')
        mySpinner.start()

        // Create the key
        const pass = crypto.createHash('sha256').update(`${companyName}+${userName}`).digest('hex')
        
        // Prepare the minio client for operations
        await this._prepMinioClient()

        // Create the user
        await this._createUser(userName, pass)

        // Assign the policy
        await this._setPolicy(userName)

        // Delete the CLI binary
        this.fsUtils.rmObj(`${this.path}${this.binary}`)

        // Stop the spinner
        mySpinner.stop()
        
        // Return the password
        return pass
    }
}

export default MinioUtilities