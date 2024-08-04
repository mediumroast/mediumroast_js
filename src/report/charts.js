#!/usr/bin/env node

import axios from 'axios'
import docxSettings from './settings.js'
import { Utilities as CLIUtilities } from '../cli/common.js' 

// Pickup the general settings
const generalStyle = docxSettings.general

function _transformForBubble(objData) {
    let chartData = []
    for(const obj in objData){
        const objName = objData[obj].name
        const mostSimilar = (objData[obj].most_similar.score * 100).toFixed(2)
        const leastSimilar = (objData[obj].least_similar.score * 100).toFixed(2)
        chartData.push([mostSimilar, leastSimilar, objName])
    }
    return chartData
}

// TODO this isn't really correct or used yet
function _transformForPie(objData) {
    let chartData = []
    for(const obj in objData){
        const objName = objData[obj].name
        const objScore = (objData[obj].score * 100).toFixed(2)
        chartData.push([objName, objScore])
    }
    return chartData
}

async function _postToChartServer(jsonObj, server) {
    const myURL = server
    const myHeaders = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    try {
        const resp = await axios.post(myURL, jsonObj, myHeaders)
        return [true, {status_code: resp.status, status_msg: resp.statusText}, resp.data]
    } catch (err) {
        return [false, err, err.response]
    }

}

function _transformForRadar(company, competitors) {
    // Build a lookup table
    const lookup = {
        'General Notes': 'General', 
        'Frequently Asked Questions': 'General',
        'White Paper': 'Article',
        'Case Study': 'Article',
        'Public Company Filing': 'General',
        'Patent': 'General',
        'Press Release': 'Article',
        'Blog Post': 'Social',
        'Social Media Post(s)': 'Social',
        'Product Document': 'Product/Service',
        'Service Document': 'Product/Service',
        'Transcript': 'General',
        'Article': 'Article',
        'About the company': 'About',
        'Research Paper': 'General',
    }
    // Define the model for recording the scores for the radar chart
    let counts = {
        'General': 0,
        'Article': 0,
        'Social': 0,
        'Product/Service': 0,
        'About': 0
    }

    let competitorQualities = competitors.map( 
        (competitor) => {
            return competitor.company.quality
        }
    )
    competitorQualities.push(company.quality)

    for (const quality in competitorQualities) {
        const qualities = Object.keys(competitorQualities[quality])
        for(const qualityType in qualities) {
            counts[lookup[qualities[qualityType]]] += competitorQualities[quality][qualities[qualityType]]
        }
    }
    return counts
}

// --------------------------------------------------------
// External methods: bubbleChart(), radardChart()
// --------------------------------------------------------

/**
 * @async
 * @function bubbleChart
 * @description Generates a bubble chart from the supplied data following the configured theme
 * @param {Object} objData - data sent to the chart that will be plotted
 * @param {Object} env - an object containing key environmental variables for the CLI
 * @param {String} baseDir - directory used to store the working files, in this case the chart images
 * @param {String} chartTitle - title for the chart, default Similarity Landscape
 * @param {String} xAxisTitle - x-axis title for the chart, default Most similar score
 * @param {Sting} yAxisTitle - y-axis title for the chart, default Least similar score
 * @param {String} chartFile - file name for the chart, default similarity_bubble_chart.png
 */
export async function bubbleChart (
    objData, 
    env,
    baseDir,
    chartTitle='Similarity Landscape',
    xAxisTitle='Most similar score',
    yAxisTitle='Least similar score', 
    chartFile='similarity_bubble_chart.png'
) {
    // Construct the CLIUtilities object
    const cliUtil = new CLIUtilities()

    // Pick up the settings including those from the theme
    const themeStyle = docxSettings[env.theme]

    // Change the originating data into data aligned to the bubble chart
    const myData = _transformForBubble(objData)

    // Construct the chart object
    let myChart = {
        title: {
            text: chartTitle, // For some reason the chart title isn't displaying
            textStyle: {
                color: "#" + themeStyle.titleFontColor,
                fontFamily: generalStyle.font,
                fontSize: generalStyle.chartTitleFontSize
            },
            left: '5%',
            top: '2%'
        },
        textStyle: {
            fontFamily: generalStyle.font,
            color: "#" + themeStyle.titleFontColor,
            fontSize: themeStyle.chartFontSize
        },
        imageWidth: 600,
        imageHeight: 500,
        backgroundColor: "#" + themeStyle.documentColor,
        // color: "#47798c", // TODO check to see what this does, if not needed deprecate
        animation: false,
        xAxis: {
            axisLine: {
                lineStyle: {
                    color: themeStyle.chartAxisLineColor,
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
                color: themeStyle.chartAxisFontColor,
                fontFamily: generalStyle.font,
                fontSize: generalStyle.chartAxesFontSize
            },
            axisLabel: {
                color: themeStyle.chartAxisTickFontColor,
                fontFamily: generalStyle.font,
                fontSize: generalStyle.chartTickFontSize
            },
            show: true,
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: "#" + themeStyle.chartAxisLineColor,
                    width: 0.5
                }
            },
        },
        yAxis: {
            axisLine: {
                lineStyle: {
                    color: themeStyle.chartAxisLineColor,
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
                color: themeStyle.chartAxisFontColor,
                fontFamily: generalStyle.font,
                fontSize: generalStyle.chartAxesFontSize
            },
            axisLabel: {
                color: themeStyle.chartAxisTickFontColor,
                fontFamily: generalStyle.font,
                fontSize: generalStyle.chartTickFontSize
            },
            show: true,
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: themeStyle.chartAxisLineColor,
                    width: 0.75
                },
                scale: true
            },
        },
        "series": [
            {
                name: "bubble",
                data: myData,
                type: "scatter",
                symbolSize: [generalStyle.chartSymbolSize,generalStyle.chartSymbolSize],
                itemStyle: {
                    borderColor: themeStyle.chartSeriesBorderColor,
                    borderWidth: 1,
                    color: themeStyle.chartSeriesColor
                },
                label: {
                    show: true,
                    formatter: "{@[2]}",
                    position: "left",
                    color: themeStyle.chartItemFontColor,
                }
            }
        ]
    }
    // Send to the chart server
    const putResult = await _postToChartServer(myChart, env.echartsServer)
    // Destructure the response into the URL for the created chart
    const imageURL = env.echartsServer + '/' + putResult[2].filename
    // Download the chart to the proper location
    return await cliUtil.downloadImage(imageURL, baseDir + '/images', chartFile)
}

export async function radarChart (
    objData, 
    env,
    baseDir,
    chartFile='interaction_radar_chart.png',
    seriesName="Quality by average",
    chartTitle="Overall interaction quality by category",
    dataName="Comparison population",
    standards={total: 15}
) {
    // Construct the CLIUtilities object
    const cliUtil = new CLIUtilities()

    // Transform data for the chart
    let myQualityCounts = _transformForRadar(objData.company, objData.competitors)
    // Compute and normalize the total number of interactions
    // Total
    const standardTotal = Math.round(objData.stats.averageStats / standards.total) * 100
    // Normalize by total
    const myTotal = objData.stats.totalStats
    const myCategories = Object.keys(myQualityCounts)
    for (const category in myCategories) {
        myQualityCounts[myCategories[category]] = Math.round(myQualityCounts[myCategories[category]] / myTotal * 100)
    }

    // Pick up the settings including those from the theme
    const generalStyle = docxSettings.general
    const themeStyle = docxSettings[env.theme]

    

    const myData = {
        radar: {
            shape: 'circle',
            indicator: [
              { name: 'Total', max: 100, min: 0 }, // 15 * N would be the total max or 100%
              { name: 'Product/Service', max: 20, min: 0 }, // 20% for each category
              { name: 'Article', max: 20, min: 0 }, // 20% for each category
              { name: 'Social', max: 20, min: 0 }, // 20% for each category
              { name: 'About', max: 20, min: 0 }, // 20% for each category
              { name: 'General', max: 20, min: 0 } // 20% for each category
            ],
            axisLine: {
                lineStyle: {
                    color: themeStyle.chartAxisLineColor,
                    width: 1,
                    opacity: 0.95,
                    type: "solid"
                }
            },
            splitArea: {
                show: true,
                areaStyle: {
                    color: ['rgba(156,184,200, 0.1)','rgba(156,184,200, 0.09)']
                }
            },
            radius: "75%",
            center: ["50%","54%"],
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: [themeStyle.chartAxisLineColor],
                    width: 0.75
                }
            },
          },
        series: [
            {
                name: seriesName,
                type: 'radar',
                data:[{
                    value: [
                        standardTotal, 
                        myQualityCounts['Product/Service'], 
                        myQualityCounts['Article'], 
                        myQualityCounts['Social'], 
                        myQualityCounts['About'], 
                        myQualityCounts['General']
                    ], // these should be averages
                    name: dataName
                }],
                itemStyle: {
                    color: themeStyle.chartSeriesColor,
                    borderColor: themeStyle.chartSeriesBorderColor,
                },
                  areaStyle: {
                    opacity: 0.45
                },
                symbol: 'none'
            }
        ],
    }
    let myChart = {
        title: {
            text: chartTitle,
            textStyle: {
                color: "#" + themeStyle.titleFontColor,
                fontFamily: generalStyle.heavyFont,
                fontSize: generalStyle.chartTitleFontSize
            },
            left: '5%',
            top: '2%',
        },
        textStyle: {
            fontFamily: generalStyle.font,
            color: "#" + themeStyle.titleFontColor,
            fontSize: themeStyle.chartFontSize
        },
        imageWidth: 800,
        imageHeight: 500,
        backgroundColor: "#" + themeStyle.documentColor,
        // color: "#47798c",
        animation: false,
        radar: myData.radar,
        series: myData.series
    }
    const putResult = await _postToChartServer(myChart, env.echartsServer)
    let imageURL = env.echartsServer  + '/' + putResult[2].filename
    return await cliUtil.downloadImage(imageURL, baseDir + '/images', chartFile)
}

export async function pieChart () {
    // TODO
}