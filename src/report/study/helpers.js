import boxPlot from 'box-plot'


export function getLargestKey(data) {
    return Object.keys(data).reduce((a, b) => data[a].length > data[b].length ? a : b);
}

export function getPriorityMap(data) {
    const ranges = boxPlot(data)
    // priorityMap: Object, key = score & value = high, medium, or low
    // ranges.upperQuartile -> high
    // ranges.lowerQuartile -> low
    // else -> medium
    let priorityMap = {}
    for (const score in data) {
        if (data[score] >= ranges.upperQuartile) {
            priorityMap[data[score]] = 'high'
        } else if (data[score] <= ranges.lowerQuartile) {
            priorityMap[data[score]] = 'low'
        } else {
            priorityMap[data[score]] = 'medium'
        }
    }
    return priorityMap
}

export function getContenderTypes(data) {
    const ranges = boxPlot(data)
    // contenderMap: Object, key = score & value = Friend, Foe, or Neutral
    // ranges.upperQuartile -> Foe
    // ranges.lowerQuartile -> Friend
    // else -> Neutral
    let contenderMap = {}
    for (const score in data) {
        if (data[score] >= ranges.upperQuartile) {
            contenderMap[data[score]] = 'Foe'
        } else if (data[score] <= ranges.lowerQuartile) {
            contenderMap[data[score]] = 'Friend'
        } else {
            contenderMap[data[score]] = 'Neutral'
        }
    }

    return contenderMap
}

export function getContenderDirection(data) {
    const ranges = boxPlot(data)
    // directionMap: Object, key = score & value = Friend, Foe, Trend to Friend, Trend to Foe, or Neutral
    // ranges.upperQuartile -> Foe
    // ranges.lowerQuartile -> Friend
    // between Median and upperQuartile -> Trend to Foe
    // between Median and lowerQuartile -> Trend to Friend
    // else -> Neutral
    let directionMap = {}
    for (const score in data) {
        if (data[score] >= ranges.upperQuartile) {
            directionMap[data[score]] = 'Foe'
        } else if (data[score] <= ranges.lowerQuartile) {
            directionMap[data[score]] = 'Friend'
        } else if (data[score] >= ranges.median && data[score] < ranges.upperQuartile) {
            directionMap[data[score]] = 'Trend to Foe'
        } else if (data[score] <= ranges.median && data[score] > ranges.lowerQuartile) {
            directionMap[data[score]] = 'Trend to Friend'
        } else {
            directionMap[data[score]] = 'Neutral'
        }
    }

    return directionMap
}