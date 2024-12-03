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
import path, { format } from 'path'
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

    _updateSimilarityData(similarityData) {
        const itemCount = Object.keys(similarityData).length;
        const updatedData = {};
    
        for (let i = 0; i < itemCount; i++) {
            const key = Object.keys(similarityData)[i];
            // const xPercent = (i / itemCount) * 100;
            const xPercent = 50
            // const yPercent = (i / itemCount) * 100;
            const yPercent = 50
            updatedData[key] = {
                ...similarityData[key],
                position: [`${xPercent.toFixed(2)}%`, `${yPercent.toFixed(2)}%`]
            };
        }
    
        return updatedData;
    }

    _labelLocationProfiles(profile="top") {
        let lablePrototype = {
            show: true,
            position: "",
            formatter: "",
            distance: 50,
            // width: 100,
            margin: 2,
            padding: 4,
            color: this.themeStyle.chartSeriesColor,
            align: "center",
            verticalAlign: "middle",
            fontSize: 11
        }
        const labelLocations = {
            top: {position: "top"},
            bottom: {position: "bottom"},
            left: {position: "left"},
            right: {position: "right"}
        }

        lablePrototype.position = labelLocations[profile].position
        return lablePrototype
    }

    _transformForBubble(objData, rankObject) {
        let chartData = []
        const similarityData = this._updateSimilarityData(objData.similarities)
        let colorIndex = 0
        const totalRanked = Object.keys(rankObject).length
        for(const obj in similarityData){
            // Lookup and assign the lable profile
            let myLabel
            const rank = rankObject[similarityData[obj].name]
            if (rank === 1) {
                myLabel = this._labelLocationProfiles("top")
            } else if (rank === totalRanked) {
                myLabel = this._labelLocationProfiles("bottom")
            } else if (rank % 2 === 0) {
                myLabel = this._labelLocationProfiles("left")
            } else {
                myLabel = this._labelLocationProfiles("right")
            }
            myLabel.formatter = similarityData[obj].name
            // Normalize the data to 0-100 and only keep three decimal places
            const mostSimilar = (similarityData[obj].most_similar.score * 100).toFixed(3)
            const leastSimilar = (similarityData[obj].least_similar.score * 100).toFixed(3)
            // Get the color for the item
            let item = {
                name: similarityData[obj].name,
                data: [[mostSimilar, leastSimilar]],
                type: "scatter",
                symbolSize: this.generalStyle.chartSymbolSize,
                itemStyle: {
                    color: this.themeStyle.chartSeriesColor,
                    borderColor: this.themeStyle.chartSeriesBorderColor,
                    borderWidth: 1
                },
                label: myLabel,
                labelLine: {
                    show: true,
                    // length: 20,
                    lineStyle: {
                        color: "inherit",
                        width: 2,
                        type: "solid"
                    }
                }
            }
            colorIndex++
            chartData.push(item)
        }
        // Add reference the company to the end of the list
        let referenceItem = {
            name: objData.company.name,
            data: [[100, 100]],
            type: "scatter",
            symbolSize: this.generalStyle.chartSymbolSize,
                itemStyle: {
                    color: this.themeStyle.chartSeriesColor,
                    borderColor: this.themeStyle.chartSeriesBorderColor,
                    borderWidth: 1
                },
                label: {
                    show: true,
                    position: "left",
                    formatter: objData.company.name,
                    width: 150,
                    distance: 10,
                    padding: 1,
                    margin: 2,
                    color: this.themeStyle.chartSeriesColor,
                    borderRadius: 1,
                    borderWidth: 1,
                    align: "right",
                    verticalAlign: "middle",
                    overflow: 'truncate',
                    backgroundColor: `#${this.themeStyle.documentColor}`,
                    fontSize: 14
                },
        }
        chartData.push(referenceItem)
        return chartData
    }

    _createRankObject(companyMap) {
        // Convert the companyMap object to an array of [company, score] pairs
        const companiesWithScores = Object.entries(companyMap);

        // Sort the array by score
        companiesWithScores.sort((a, b) => a[1] - b[1]);

        // Create the rank object
        const rankObject = {};
        companiesWithScores.forEach((item, index) => {
            rankObject[item[0]] = index + 1; // Rank starts from 1
        });
        return rankObject;
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
        // const bubbleSeries = this._transformForBubble(objData)
        const rankObject = this._createRankObject(objData.competitors.companyMap)
        const bubbleSeries2 = this._transformForBubble(objData, rankObject)
        

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

        const legend = {
            show: false,
        }

        let myChart = this.chartDefaults
        myChart.series = bubbleSeries2
        myChart.title.text = chartTitle
        myChart.legend = legend
        myChart.xAxis = xAxis
        myChart.yAxis = yAxis

        // Send to the chart server
        const putResult = await this._postToChartServer(myChart, this.env.echartsServer)
        const myFullPath = path.resolve(this.workingImageDir, chartFile)
        const myFullJSONPath = path.resolve(this.workingImageDir, 'bubble.json')
        fs.writeFileSync(myFullJSONPath, JSON.stringify(myChart))
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
                    itemStyle: {
                        color: this.themeStyle.chartSeriesPieColor,
                        // borderColor: this.themeStyle.chartSeriesPieBorderColor,
                        borderColor: `#${this.themeStyle.documentColor}`,
                        borderWidth: 1
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