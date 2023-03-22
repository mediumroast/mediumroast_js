/**
 * A set of common utilities to format company objects given results from company_dns
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file company.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

import node_geocoder from "node-geocoder"

class CompanyFormatters {
    constructor (companyObj) {
        this.company = companyObj
        this.geoProvider = 'openstreetmap'
        this.defaultValue = 'Unknown' 
    }

    /**
     * 
     * @param {*} forms 
     * @returns 
     */
    getRecentPublicFormUrls(forms){
        let tenQ = this.defaultValue
        let tenK = this.defaultValue
        const sortedForms = Object.keys(forms).sort().reverse()
        for (const form in sortedForms) {
            const formType = forms[sortedForms[form]].formType
            if (formType.search(/10-Q/g)) {
                tenQ = forms[sortedForms[form]].filingIndex
                if(tenK !== this.defaultValue) {break}
            } else if (formType.search(/10-K/g)) {
                tenK = forms[sortedForms[form]].filingIndex
                if(tenQ !== this.defaultValue) {break}
            } else {
                continue
            }
        }
        return(tenK, tenQ)
    }

    /**
     * 
     * @param {*} location 
     * @returns 
     */
    async getGeospatialData(location) {
        const options = {
            provider: this.geoProvider,
            httpAdapter: 'https'
        }
        const myGeoCoder = node_geocoder(options)
        const coordinates = await myGeoCoder.geocode(location)
        return coordinates
    }

    /**
     * 
     * 
     * @returns 
     * @todo review how we plan to implement the return
     */
    async getLocationData() {
        let locationString = "" // Set to an empty string
        // Add the address if present
        this.company.street_address !== this.defaultValue ? 
            locationString = this.company.street_address + ', ' : 
            locationString = locationString
        // Add the state/province if present
        this.company.city !== this.defaultValue ? 
            locationString += this.company.city + ', ' :
            locationString = locationString
        // Add state/province if present
        this.company.state_province !== this.defaultValue ?
            locationString += this.company.state_province + ', ' :
            locationString = locationString
        // Add zip/postal code if present
        this.company.zip_postal !== this.defaultValue ?
            locationString += this.company.zip_postal + ', ' :
            locationString = locationString
        // Add country if present
        this.company.country !== this.defaultValue ?
            locationString += this.company.country :
            locationString = locationString
        
        let coordinates = null
        locationString ? coordinates = await this.getGeospatialData(locationString) : coordinates = coordinates

        return coordinates
    }

    /**
     * 
     * @returns
     */
    getURL() {
        return(this.company.website[0])
    }

    /**
     * @returns
     */
    getCleanDescription() {
        return this.company.description.replace(/["']/g, '')
    }

    /**
     * 
     * @returns 
     */
    getCleanTickers() {
        return this.company.tickers[0] + ':' + this.company.tickers[1] 
    }

    /**
     * 
     * @returns 
     */
    getExchange() {
        return this.company.exchanges[0]
    }


}

export default CompanyFormatters