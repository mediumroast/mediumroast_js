#!/usr/bin/env node

import axios from "axios"
import * as fs from 'fs'
import * as path from 'path'

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

async function _downloadImage(url, dir, filename) {
    const myFullPath = path.resolve(dir, filename)
    const myConfig = {
        responseType: 'stream'
    }
    const resp = await axios.get(url, myConfig)
    resp.data.pipe(fs.createWriteStream(myFullPath))
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

async function bubbleChart (objData, chartServer, dir='/Users/mihay42/tmp', chartFile='bubble_chart.png') {
    // TODO Build variables for chart title, and axis names
    // TODO Adapt to env as opposed to discrete variables
// async function bubbleChart (elements, env, chartFile='/Users/mihay42/tmp/chart.png') {
    const myData = _transformForBubble(objData)
    let myChart = {
        title: {
            text: "Competitive Landscape",
            textStyle: {
                color: '#47798C',
                fontFamily: 'Avenir Next',
                fontWeight: 'bold',
                fontSize: 15
            },
            left: '5%',
            top: '2%'
        },
        textStyle: {
            fontFamily: "Avenir Next",
            fontWeight: 'light',
            color: '#6b6c6b',
            fontSize: 13
        },
        imageWidth: 600,
        imageHeight: 500,
        backgroundColor: "#0f0d0e",
        color: "#47798c",
        animation: false,
        xAxis: {
            axisLine: {
                lineStyle: {
                    color: "#374246",
                    width: 1,
                    opacity: 0.95,
                    type: "solid"
                }
            },
            splitNumber: 2,
            name: "Most similar score",
            nameLocation: "center",
            nameGap: 35,
            nameTextStyle: {
                color: 'rgba(71,121,140, 0.7)',
                fontFamily: 'Avenir Next',
                fontSize: 12
            },
            axisLabel: {
                color: 'rgb(149,181,192, 0.6)',
                fontFamily: 'Avenir Next',
                fontSize: 10
            },
            show: true,
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: "#374246",
                    width: 0.5
                }
            },
        },
        yAxis: {
            axisLine: {
                lineStyle: {
                    color: "#374246",
                    width: 1,
                    opacity: 0.95,
                    type: "solid"
                }
            },
            nameGap: 35,
            splitNumber: 2,
            name: "Least similar score",
            nameLocation: "center",
            nameTextStyle: {
                color: 'rgba(71,121,140, 0.7)',
                fontFamily: 'Avenir Next',
                fontSize: 12
            },
            axisLabel: {
                color: 'rgb(149,181,192, 0.6)',
                fontFamily: 'Avenir Next',
                fontSize: 10
            },
            show: true,
            splitLine: {
                show: true,
                lineStyle: {
                    type: "dashed",
                    color: "#374246",
                    width: 0.5
                },
                scale: true
            },
        },
        "series": [
            {
                name: "bubble",
                data: myData,
                type: "scatter",
                symbolSize: [30,30],
                itemStyle: {
                    borderColor: 'rgb(149,181,192, 0.9)',
                    borderWidth: 1,
                    
                },
                label: {
                    show: true,
                    formatter: "{@[2]}",
                    position: "left",
                    color: 'rgb(149,181,192, 1)',
                }
            }
        ]
    }
    const putResult = await _postToChartServer(myChart, chartServer)
    const imageURL = chartServer + '/' + putResult[2].filename
    await _downloadImage(imageURL, dir, chartFile)
}

async function radarChart (objData, chartServer, dir='/Users/mihay42/tmp', chartFile='radar_chart.png') {
    let myChart = {
        title: {
            text: "Overall Interaction Quality",
            textStyle: {
                color: '#47798C',
                fontFamily: 'Avenir Next',
                fontWeight: 'bold',
                fontSize: 15
            },
            left: '5%',
            top: '2%'
        },
        textStyle: {
            fontFamily: "Avenir Next",
            fontWeight: 'light',
            color: '#6b6c6b',
            fontSize: 13
        },
        imageWidth: 800,
        imageHeight: 500,
        backgroundColor: "#0f0d0e",
        color: "#47798c",
        animation: false,
        radar: objData.radar,
        series: objData.series
    }
    const putResult = await _postToChartServer(myChart, chartServer)
    const imageURL = chartServer + '/' + putResult[2].filename
    await _downloadImage(imageURL, dir, chartFile)
}

const myServer = 'http://mediumroast-01:3000'
const bubbleData = { 
    "2": { 
        "name": "Savonix", 
        "similarity": 0.7193503975868225, 
        "role": "Competitor", 
        "most_similar": { 
            "name": "Science - Savonix", 
            "score": 0.8715741634368896 
        }, 
        "least_similar": { 
            "name": "Bayer Selects Savonix Digital Cognitive Assessment Platform to Validate the Effects of Multivitamin Supplement Berocca in Malaysia | Business Wire", 
            "score": 0.7110357284545898 
        } 
    }, 
    "3": { 
        "name": "PrecivityAD", 
        "similarity": 0.758750319480896, 
        "role": "Competitor", 
        "most_similar": { 
            "name": "C₂N Data Release for New Blood Test Combining p-tau217 Ratio with Amyloid beta 42:40 — PrecivityAD™", 
            "score": 0.8071120381355286 
        }, 
        "least_similar": { 
            "name": "ApoE_Genotyping_Physician_FAQ", 
            "score": 0.5041195154190063 
        } 
    }, 
    "4": { 
        "name": "Neurotrack Technologies, Inc.", 
        "similarity": 0.6818479299545288, 
        "role": "Competitor", 
        "most_similar": { 
            "name": "Life Insurance Industry Invests In Cognitive Health To Tackle The Future Of Aging", 
            "score": 0.8111998438835144 
        }, 
        "least_similar": { 
            "name": "Lets Talk Neurotransmitters - Neurotrack", 
            "score": 0.5499856472015381 
        } 
    },
    "1": {
        "name": "uMETHOD",
        "similarity": 1.0,
        "role": "Owner",
        "most_similar": {  
            "score": 1
        }, 
        "least_similar": {  
            "score": 1
        } 

    }
}

const radarData = {
    radar: {
        indicator: [
          { name: 'Total', max: 30 },
          { name: 'Product Documents', max: 6 },
          { name: 'News & Press Releases', max: 6 },
          { name: 'Social Media', max: 6 },
          { name: 'Case Studies', max: 6 },
          { name: 'White Papers', max: 6 }
        ]
      },
    series: [
        {
            name: 'Quality Status',
            type: 'radar',
            data:[{
                value: [25, 3, 5, 6, 6, 1],
                name: 'All Interactions'
            }],
            itemStyle: {
                color: '#47798c'
            },
              areaStyle: {
                opacity: 0.45
            }
        }
    ],
}

await bubbleChart(bubbleData, myServer)
await radarChart(radarData, myServer)
// TODO transform into a module that can be called via the reporting CLI
// TODO implement the radar chart