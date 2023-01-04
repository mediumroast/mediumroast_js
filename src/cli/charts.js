#!/usr/bin/env node

import axios from "axios"
import * as fs from 'fs'

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
        return [false, err, err.response.data]
    }

}

async function bubbleChart (chartFile='/Users/mihay42/tmp/chart.png') {
// async function bubbleChart (elements, env, chartFile='/Users/mihay42/tmp/chart.png') {
    const myData = [
        [87.15, 71.10, 71.93, "Savonix"],
        [80.71, 50.41 , 75.87, "PrecivityAD"],
        [81.11 , 54.99, 68.18, "Neurotrack Technologies, Inc."],
        [100.00, 100.00, 100.00, "uMethod"]
      ]
    let chartData = {
        "type": "png",
        "width": 600,
        "height": 400,
        "base64": false,
        "download": false,
        "option": {
            "backgroundColor": "#fff",
            "animation": false,
            "xAxis": {
              "type": "value",
            },
            "yAxis": {
              "type": "value"
            },
            "series": [
              {
                "data": myData,
                "type": "scatter",
              }
            ]
          }
    }
    const myFile = fs.createWriteStream(chartFile)
    const putResult = await _postToChartServer(chartData, 'http://mediumroast-01:3000')
    console.log(putResult)
    myFile.write(putResult[2])

}

const myServer = 'http://mediumroast-01:3000'
const myData = { 
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
        }, "least_similar": { 
            "name": "Lets Talk Neurotransmitters - Neurotrack", 
            "score": 0.5499856472015381 
        } 
    },
    "1": {
        "name": "uMETHOD",
        "similarity": 1.0,
        "role": "Owner"

    }
}

await bubbleChart()