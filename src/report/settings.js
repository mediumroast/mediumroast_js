import docx from 'docx'

const docxSettings = {
    general: {
        halfFontSize: 11,
        fullFontSize: 22,
        headerFontSize: 20,
        fontFactor: 1,
        dashFontSize: 9,
        tableFontSize: 8,
        titleFontSize: 18,
        companyNameFontSize: 11.5,
        metricFontTitleSize: 11,
        metricFontSize: 48,
        chartTitleFontSize: 18,
        chartFontSize: 10,
        chartAxesFontSize: 12,
        chartTickFontSize: 10,
        chartSymbolSize: 30,
        tableBorderSize: 8,
        tableBorderStyle: docx.BorderStyle.SINGLE,
        noBorderStyle: docx.BorderStyle.NIL,
        tableMargin: docx.convertInchesToTwip(0.1),
        font: "Avenir Next",
        heavyFont: "Avenir Next Heavy",
        lightFont: "Avenir Next Light"

    },
    coffee: {
        tableBorderColor: "4A7E92", // Light Blue
        documentColor: "0F0D0E", // Coffee black
        titleFontColor: "41A6CE", // Saturated Light Blue
        textFontColor: "DCE9F6", // Ultra light Blue
        chartAxisLineColor: "#374246",
        chartAxisFontColor: "rgba(71,121,140, 0.7)",
        chartAxisTickFontColor: "rgba(149,181,192, 0.6)",
        chartItemFontColor: "rgba(149,181,192, 0.9)",
        chartSeriesColor: "rgb(71,113,128)",
        chartSeriesBorderColor: "rgba(149,181,192, 0.9)", 
        highlightFontColor: ""
    },
    latte: {
        tableBorderColor: "4A7E92", // TODO find the right color
        documentColor: "0F0D0E", // TODO find the right color
        titleFontColor: "41A6CE", // TODO find the right color
        fontColor: "DCE9F6", // TODO find the right color
        highlightFontColor: ""
    } 
} 

export default docxSettings