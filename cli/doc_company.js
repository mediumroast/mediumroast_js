#!/usr/bin/env node

// Import required modules
import { Companies, Interactions, Studies } from '../src/api/highLevel.js'
import Firmographics from '../src/report/company.js'
import Utilities from '../src/report/common.js'
import program from 'commander'
import ConfigParser from 'configparser'
import * as fs from "fs"
import docx from 'docx'
import AWS from 'aws-sdk'
import zip from 'adm-zip'
import boxPlot from 'box-plot'


//  ______   __  __     __   __     ______     ______   __     ______     __   __     ______    
// /\  ___\ /\ \/\ \   /\ "-.\ \   /\  ___\   /\__  _\ /\ \   /\  __ \   /\ "-.\ \   /\  ___\   
// \ \  __\ \ \ \_\ \  \ \ \-.  \  \ \ \____  \/_/\ \/ \ \ \  \ \ \/\ \  \ \ \-.  \  \ \___  \  
//  \ \_\    \ \_____\  \ \_\\"\_\  \ \_____\    \ \_\  \ \_\  \ \_____\  \ \_\\"\_\  \/\_____\ 
//   \/_/     \/_____/   \/_/ \/_/   \/_____/     \/_/   \/_/   \/_____/   \/_/ \/_/   \/_____/ 
                                                                                             
// Parse the cli options
function parseCLIArgs() {
    // Define commandline options
    program
        .version('0.7.5')
        .description('A CLI to generate a document report for mediumroast.io Company objects.')
    program
        .requiredOption('-n --name <name>', 'The name of the company to construct a report for.')
        .option('-s --substudy <study_name:substudy_id>', 'The GUID for the substudy to include in the report.')
        .option('-r --report_dir <directory>', 'Directory to write the report to', 'Documents')
        .option('-w --work_dir <directory>', 'Directory to use for creating a ZIP package', '~/Documents')
        .option('-p --package', 'Create a package with interactions')
        .option('-z --zip', 'Create a ZIP archive with report and interactions')
        .option('-s --server <server>', 'Specify the server URL', 'http://mr-01:3000')
        .option('-t --server_type <type>', 'Specify the server type as [json || mr_server]', 'json')
        .option('-a --author_company <type>', 'Specify the company the report is for')
        .option('-c --config_file <file>', 'Path to the configuration file', '.mr_config')
    program.parse(process.argv)
    const options = program.opts()
    return options
}

// Filter interactions by the GUID of the Company
function filterObjects(objects, guid) {
    let myObjects = []
    for (const object in objects) {
        const allCompanies = Object.values(objects[object].linkedCompanies)
        if (allCompanies.includes(guid)) {
            myObjects.push(objects[object])
        }
    }
    return myObjects
}

function rankTags (tags, ranges) {
    let finalTags = {}
    for (const tag in tags) {
        // Rank the tag score using the ranges derived from box plots
        // if > Q3 then the ranking is high
        // if in between Q2 and Q3 then the ranking is medium
        // if < Q3 then the ranking is low
        let rank = null
        if (tags[tag] > ranges.upperQuartile) {
            rank = 'High'
        } else if (tags[tag] < ranges.lowerQuartile) {
            rank = 'Low'
        } else if (ranges.lowerQuartile <= tags[tag] <= ranges.upperQuartile) {
            rank = 'Medium'
        }

        finalTags[tag] = {
            score: tags[tag], // Math.round(tags[tag]),
            rank: rank
        }
        
    }
    return finalTags
}

//  ______     ______     __   __     ______   __     ______    
// /\  ___\   /\  __ \   /\ "-.\ \   /\  ___\ /\ \   /\  ___\   
// \ \ \____  \ \ \/\ \  \ \ \-.  \  \ \  __\ \ \ \  \ \ \__ \  
//  \ \_____\  \ \_____\  \ \_\\"\_\  \ \_\    \ \_\  \ \_____\ 
//   \/_____/   \/_____/   \/_/ \/_/   \/_/     \/_/   \/_____/ 
                                                                    
// Get the configuration objects
const opts = parseCLIArgs() // CLI arguments and options
const config = new ConfigParser() // Config file
config.read(process.env.HOME + '/' + opts.config_file)

// Set the server type
let serverType = null
config.hasKey('DEFAULT', 'server_type') ? serverType = config.get('DEFAULT', 'server_type') : serverType = opts.server_type

// Set the server url
let mrServer = null
config.hasKey('DEFAULT', 'server') ? mrServer = config.get('DEFAULT', 'server') : mrServer = opts.server

// Set the working directory
let workDir = null
config.hasKey('DEFAULT', 'working_dir') ? workDir = config.get('DEFAULT', 'working_dir') : workDir = opts.work_dir

// Set the output directory
let outputDir = null
config.hasKey('DEFAULT', 'output_dir') ? outputDir = process.env.HOME + '/' + config.get('DEFAULT', 'output_dir') : outputDir = process.env.HOME + '/' + opts.output_dir

// Set the author company
let authorCompany = null
config.hasKey('DEFAULT', 'company') ? authorCompany = config.get('DEFAULT', 'company') : outputDir = opts.author_company

// Set up the S3 credentials and download protocol
const s3Server = config.get('s3_credentials', 'server')
const s3User = config.get('s3_credentials', 'user')
const s3APIkey = config.get('s3_credentials', 'api_key')
const s3Source = config.get('s3_credentials', 'source')
const s3Region = config.get('s3_credentials', 'region')
const s3Protocol = 's3'
const localProtocol = 'file'
const httpProtocol = 'http'

// Determine if we need to create a zip package or not
let createPackage = null
opts.package ? createPackage = true : createPackage = false

// Determine if we need to create a zip package or not
let createArchive = null
opts.zip ? createArchive = true : createArchive = false

// Obtain the GUID for the needed substudy
let addedSubstudy = null
opts.substudy ? addedSubstudy = opts.substudy : addedSubstudy = false

// Set up the control objects
const companyCtl = new Companies(mrServer, serverType)
const interactionCtl = new Interactions(mrServer, serverType)
const studyCtl = new Studies(mrServer, serverType)
const docCtl = new Utilities(
    config.get('document_settings', 'font_type'),
    parseInt(config.get('document_settings', 'font_size')),
    parseInt(config.get('document_settings', 'title_font_size')),
    config.get('document_settings', 'title_font_color')
)
const s3Ctl = new AWS.S3({
    accessKeyId: s3User ,
    secretAccessKey: s3APIkey ,
    endpoint: s3Server ,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4',
    region: s3Region // S3 won't work without the region setting
}) 

// Get the company in question and all interactions
const company = await companyCtl.getByName(opts.name)
const interactions = filterObjects(await interactionCtl.getAll(), company[0].GUID)

// Get the relevant study and substudy 
const [studyName, substudyId] = opts.substudy.split(':')
const studies = await studyCtl.getByName(studyName)
const substudy = studies[0].substudies[substudyId]
const ranges = boxPlot(Object.values(substudy.keyThemes.summary_theme.tags))
const quotes = (substudy.keyThemeQuotes.summary)
const tags = rankTags(substudy.keyThemes.summary_theme.tags, ranges)

// simple function for safe directory creation
function safeMakedir(name) {
    try {
        if (!fs.existsSync(name)) {
          fs.mkdirSync(name)
        }
    } catch (err) {
        console.error(err)
    }
}

// create a ZIP package
async function createZIPArchive
(outputFile, sourceDirectory) {
    try {
      const zipPackage = new zip();
      zipPackage.addLocalFolder(sourceDirectory);
      zipPackage.writeZip(outputFile);
      console.log(`Created ${outputFile} successfully`);
    } catch (e) {
      console.log(`Something went wrong. ${e}`);
    }
}

function writeReport (docObj, fileName) {
    docx.Packer.toBuffer(docObj).then((buffer) => {
        fs.writeFileSync(fileName, buffer)
    })
}

// Download the objects
async function downloadInteractions (interactions, directory) {
    for (const interaction in interactions) {
        const objWithPath = interactions[interaction].url.split('://').pop()
        const myObj = objWithPath.split('/').pop()
        const myParams = {Bucket: s3Source, Key: myObj}
        const myFile = fs.createWriteStream(directory + myObj)
        s3Ctl.getObject(myParams).
            on('httpData', function(chunk) { myFile.write(chunk) }).
            on('httpDone', function() { myFile.end() }).
            send()
    }
}

//  __    __     ______     __     __   __        ______     __         __    
// /\ "-./  \   /\  __ \   /\ \   /\ "-.\ \      /\  ___\   /\ \       /\ \   
// \ \ \-./\ \  \ \  __ \  \ \ \  \ \ \-.  \     \ \ \____  \ \ \____  \ \ \  
//  \ \_\ \ \_\  \ \_\ \_\  \ \_\  \ \_\\"\_\     \ \_____\  \ \_____\  \ \_\ 
//   \/_/  \/_/   \/_/\/_/   \/_/   \/_/ \/_/      \/_____/   \/_____/   \/_/ 

const outputFile = outputDir + '/' + company[0].companyName 
const outputDocFileName = outputFile + '.docx'


// Set key properties for the document
const creator = 'mediumroast.io barista robot'
const title = company[0].companyName + ' Company Report'
const description = 'A report snapshot including firmographics and interactions for: ' 
    + company[0].companyName

// Get the first page for the company that includes firmographics
const companyData = new Firmographics(company, interactions, 'Interactions/', tags, quotes)

let doc = new docx.Document ({
    creator: creator,
    company: authorCompany,
    title: title,
    description: description,
    styles: {default: docCtl.styling.default},
    numbering: docCtl.styling.numbering,
    sections: [{
        properties: {},
        children: companyData.companyDoc,
    }],
})

// If needed create the zip package
if (createPackage) {
    
    const fileName = 'Company Report.docx'
    const interactionsDir = 'Interactions/'

    // As needed create the working directory
    const workingDirectory = workDir + '/' + company[0].companyName + '/'
    safeMakedir(workingDirectory)
    safeMakedir(workingDirectory + interactionsDir)

    // Write the report to the working directory
    writeReport(doc, workingDirectory + fileName)

    // Download the objects
    await downloadInteractions(interactions, workingDirectory + interactionsDir)
    
} else if (createArchive) {
    const outputPackage = outputFile + '.zip'
    // Create the zip package
    await createZIPArchive(outputPackage, workDir + '/' + company[0].companyName)
} else {
    writeReport(doc, outputDocFileName)
}