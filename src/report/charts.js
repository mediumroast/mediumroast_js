/**    
 * @description This file contains the Charting class which is used to generate charts for the report
 * 
 * @license Apache-2.0
 * @version 2.0.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file charts.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 * @module Charting
 * @requires axios
 * @requires path
 * @requires fs
 * @requires settings
 * @example
 * import Charting from './charts.js'
 * const myChart = new Charting(env)
 * const myData = {
 *   company: {
 *      name: "Mediumroast",
 *      similarities: {
 *          'company_1': {
 *              'most_similar: 0.5,
 *              'least_similar: 0.1
 *          },
 *          'company_2': {
 *              'most_similar: 0.7,
 *              'least_similar: 0.2
 *          }
 *      },
 * }
 * const myChartPath = await myChart.bubbleChart(myData)
 * console.log(myChartPath)
 * 
*/


// Import required modules
import axios from 'axios'
import docxSettings from './settings.js'
import path from 'path'
import * as fs from 'fs'


class Charting {
    constructor(env) {
        this.env = env
        this.generalStyle = docxSettings.general
        this.themeStyle = docxSettings[env.theme]
        this.baseDir = env.workDir
        this.workingImageDir = path.resolve(this.baseDir + '/images')
        this.chartDefaults = {
            title: {
                text: 'Mediumroast for GitHub Chart',
                textStyle: {
                    color: `#${this.themeStyle.titleFontColor}`,
                    fontFamily: this.generalStyle.heavyFont,
                    fontSize: this.generalStyle.chartTitleFontSize
                },
                left: '5%',
                top: '2%',
            },
            textStyle: {
                fontFamily: this.generalStyle.font,
                color: `#${this.themeStyle.titleFontColor}`,
                fontSize: this.themeStyle.chartFontSize
            },
            imageWidth: 800,
            imageHeight: 600,
            backgroundColor: `#${this.themeStyle.documentColor}`,
            animation: false
        }
    }

    // --------------------------------------------------------
    // Internal methods _postToChartServer()
    // --------------------------------------------------------


    async _postToChartServer(jsonObj, server) {
        const myURL = `${server}` 
        const myHeaders = {
            headers: {
                'Content-Type': 'application/json',
            }
        }
        try {
            const resp = await axios.post(myURL, jsonObj, {...myHeaders, responseType: 'arraybuffer'})
            return [true, {status_code: resp.status, status_msg: resp.headers}, resp.data]
        } catch (err) {
            return [false, err, err.response]
        }

    }


    // --------------------------------------------------------
    // External method: bubbleChart()
    // --------------------------------------------------------

    _transformForBubble(objData) {
        let chartData = []
        const similarityData = objData.similarities
        for(const obj in similarityData){
            const objName = similarityData[obj].name
            const mostSimilar = (similarityData[obj].most_similar.score * 100).toFixed(2)
            const leastSimilar = (similarityData[obj].least_similar.score * 100).toFixed(2)
            chartData.push([mostSimilar, leastSimilar, objName])
        }
        // Add the company to the end of the list
        chartData.push([100, 100, objData.company.name])
        return chartData
    }

    /**
     * @async
     * @function bubbleChart
     * @description Generates a bubble chart from the supplied data following the configured theme
     * @param {Object} objData - data sent to the chart that will be plotted
     * @param {Object} options - optional parameters for the chart
     * @returns {String} - the full path to the generated chart image
     * @example
     * const myChart = new Charting(env)
     * const myData = {
     *   company: {
     *    name: "Mediumroast",
     *    similarities: {
     *      'company_1': {
     *       'most_similar: 0.5,
     *      'least_similar: 0.1
     *      },
     *     'company_2': {
     *      'most_similar: 0.7,
     *     'least_similar: 0.2
     *     }
     *    },
     *  }
     * const myChartPath = await myChart.bubbleChart(myData)
     * console.log(myChartPath)
     */
    async bubbleChart (objData, options={}) {
        // Destructure the options
        const {
            chartTitle='Similarity Landscape',
            xAxisTitle='Most Similar Score',
            yAxisTitle='Least Similar Score',
            chartFile='similarity_bubble_chart.png'
        } = options

        // Change the originating data into data aligned to the bubble chart
        const bubbleSeries = this._transformForBubble(objData)

        const myData = [
            {
                name: "bubble",
                data: bubbleSeries,
                type: "scatter",
                symbolSize: [this.generalStyle.chartSymbolSize,this.generalStyle.chartSymbolSize],
                itemStyle: {
                    borderColor: this.themeStyle.chartSeriesBorderColor,
                    borderWidth: 1,
                    color: this.themeStyle.chartSeriesColor
                },
                label: {
                    show: true,
                    formatter: "{@[2]}",
                    position: "left",
                    color: this.themeStyle.chartItemFontColor,
                    backgroundColor: `#${this.themeStyle.documentColor}`,
                    padding: [5,4],
                }
            }
        ]

        const xAxis = {
            axisLine: {
                lineStyle: {
                    color: this.themeStyle.chartAxisLineColor,
                    width: 1,
                    opacity: 0.95,
                    type: "solid"
                }
            },
            splitNumber: 2,
            name: xAxisTitle,
            nameLocation: "center",
            nameGap: 35,
            nameTextStyle: {
                color: this.themeStyle.chartAxisFontColor,
                fontFamily: this.generalStyle.font,
                fontSize: this.generalStyle.chartAxesFontSize,
            },
            axisLabel: {
                color: this.themeStyle.chartAxisTickFontColor,
                fontFamily: this.generalStyle.font,
                fontSize: this.generalStyle.chartTickFontSize
            },
            show: true,
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: "#" + this.themeStyle.chartAxisLineColor,
                    width: 0.5
                }
            },
        }

        const yAxis = {
            axisLine: {
                lineStyle: {
                    color: this.themeStyle.chartAxisLineColor,
                    width: 1,
                    opacity: 0.95,
                    type: "solid"
                }
            },
            nameGap: 35,
            splitNumber: 2,
            name: yAxisTitle,
            nameLocation: "center",
            nameTextStyle: {
                color: this.themeStyle.chartAxisFontColor,
                fontFamily: this.generalStyle.font,
                fontSize: this.generalStyle.chartAxesFontSize
            },
            axisLabel: {
                color: this.themeStyle.chartAxisTickFontColor,
                fontFamily: this.generalStyle.font,
                fontSize: this.generalStyle.chartTickFontSize
            },
            show: true,
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: this.themeStyle.chartAxisLineColor,
                    width: 0.75
                },
                scale: true
            },
        }

        let myChart = this.chartDefaults
        myChart.series = myData
        myChart.title.text = chartTitle
        myChart.xAxis = xAxis
        myChart.yAxis = yAxis

        // Send to the chart server
        const putResult = await this._postToChartServer(myChart, this.env.echartsServer)
        const myFullPath = path.resolve(this.workingImageDir, chartFile)
        fs.writeFileSync(myFullPath, putResult[2])
        return myFullPath
    }


    // --------------------------------------------------------
    // External method: pieChart()
    // Internal method: _transformForPie()
    // --------------------------------------------------------
    _transformForPie(objData) {
        let chartData = []
        for(const obj in objData){
            chartData.push({name: obj, value: objData[obj]})
        }
        return chartData
    }

    /**
     * @async
     * @function pieChart
     * @description Generates a pie chart from the supplied data following the configured theme
     * @param {Object} objData - data sent to the chart that will be plotted
     * @returns {String} - the full path to the generated chart image
     * @example
     * const myChart = new Charting(env)
     * const myData = {
     *    company: {
     *       quality: {
     *          'good': 10,
     *         'bad': 5,
     *        'ugly': 2
     *    }
     * }
     * const myChartPath = await myChart.pieChart(myData)
     * console.log(myChartPath)
     */

    async pieChart (objData, options={}) {
        // Desctructure the options
        const {
            chartTitle='Interaction Characterization',
            seriesName='Interaction Types',
            chartFile='interaction_pie_chart.png'
        } = options

        // Transform data for the chart
        const qualitySeries = this._transformForPie(objData.company.quality)

        const myData = [
                {
                    name: seriesName,
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '50%'],
                    data: qualitySeries.sort(function (a, b) { return a.value - b.value; }),
                    roseType: 'radius',
                    itemStyle: {
                        color: this.themeStyle.chartSeriesColor,
                        borderColor: this.themeStyle.chartSeriesBorderColor,
                    },
                    areaStyle: {
                        opacity: 0.45
                    },
                    label: {
                        show: true,
                        formatter: '{b}: {c} ({d}%)',
                        color: this.themeStyle.chartItemFontColor,
                        backgroundColor: `#${this.themeStyle.documentColor}`,
                        padding: [5,4],
                    },
                }
            ]

        let myChart = this.chartDefaults
        myChart.series = myData
        myChart.title.text = chartTitle

        const putResult = await this._postToChartServer(myChart, this.env.echartsServer)
        const myFullPath = path.resolve(this.workingImageDir, chartFile)
        fs.writeFileSync(myFullPath, putResult[2])
        return myFullPath
    }

}

export default Charting