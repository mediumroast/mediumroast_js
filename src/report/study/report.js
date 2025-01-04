import Sections from './sections.js'
import CLIUtilities from '../../cli/common.js'
import { getLargestKey } from './helpers.js'
import ExcelJS from 'exceljs'

class StudyReport {
  constructor(study, companies, env, sourceCompany) {
    this.study = study
    this.companies = companies
    this.cliUtils = new CLIUtilities()
    this.sourceCompany = sourceCompany || this.cliUtils.getOwningCompany(this.companies)[0]
    this.env = env
    this.workDir = this.env.workDir

    // Set the file name
    const baseDir = this.env.outputDir
    const baseFileName = this.study.name.replace(/ /g,"_")
    this.fileName = `${baseDir}/${baseFileName}_study_report.xlsx`
  }

  async generate() {
    // Capture the most recent processed and source data
    const largestKeyProcessed = getLargestKey(this.study.processTopics)
    const processData = this.study.processTopics[largestKeyProcessed]
    
    const largestKeySource = getLargestKey(this.study.sourceTopics)
    let sourceData = this.study.sourceTopics[largestKeySource]

    // Create a new Excel workbook
    let workbook = new ExcelJS.Workbook()

    // Retrieve source company details from ths source data object
    const sourceCompanyDetails = sourceData[this.sourceCompany.name]
    // Remove the source company from the source data object
    delete sourceData[this.sourceCompany.name]

    // Create the initial section for the source company
    workbook = Sections.topInsights(sourceCompanyDetails, workbook, this.sourceCompany.name)

    // Create the prioritized companies section
    // console.log(processData)
    workbook = Sections.prioritizeCompanies(processData, workbook)

    // Iterate through the source data and create a section for each company
    for (const company in sourceData) {
      workbook = Sections.topInsights(sourceData[company], workbook, company)
    }

    // Write the workbook to a file
    const writeResult = await workbook.xlsx.writeFile(this.fileName)
    return [true, {status_code: 200, status_msg: `Successfully wrote file to ${this.fileName}`}, writeResult];
  }
}

export default StudyReport