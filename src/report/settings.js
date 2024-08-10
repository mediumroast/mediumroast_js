import docx from 'docx'

const docxSettings = {
    general: {
        halfFontSize: 11,
        fullFontSize: 22,
        headerFontSize: 18,
        footerFontSize: 18,
        fontFactor: 1,
        dashFontSize: 22,
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
        tagMargin: docx.convertInchesToTwip(0.08),
        font: "Avenir Next",
        heavyFont: "Avenir Next Heavy",
        lightFont: "Avenir Next Light"

    },
    coffee: {
        tableBorderColor: "4A7E92", // Light Blue
        tagColor: "4A7E92", // Light Blue
        tagFontColor: "0F0D0E", // Coffee black
        documentColor: "0F0D0E", // Coffee black
        titleFontColor: "41A6CE", // Saturated Light Blue
        textFontColor: "41A6CE", // Ultra light Blue
        chartAxisLineColor: "#374246",
        chartAxisFontColor: "rgba(71,121,140, 0.7)",
        chartAxisTickFontColor: "rgba(149,181,192, 0.6)",
        chartItemFontColor: "rgba(149,181,192, 0.9)",
        chartSeriesColor: "rgb(71,113,128)",
        chartSeriesBorderColor: "rgba(149,181,192, 0.9)", 
        highlightFontColor: ""
    },
    espresso: {
        tableBorderColor: "C7701E", // Orange
        tagColor: "C7701E", // Light Blue
        tagFontColor: "0F0D0E", // Coffee black
        documentColor: "0F0D0E", // Coffee black
        titleFontColor: "C7701E", // Saturated Light Blue
        textFontColor: "C7701E", // Ultra light Blue
        chartAxisLineColor: "#374246",
        chartAxisFontColor: "rgba(71,121,140, 0.7)",
        chartAxisTickFontColor: "rgba(149,181,192, 0.6)",
        chartItemFontColor: "rgba(149,181,192, 0.9)",
        chartSeriesColor: "rgb(71,113,128)",
        chartSeriesBorderColor: "rgba(149,181,192, 0.9)", 
        highlightFontColor: ""
    },
    latte: {
        tableBorderColor: "25110f", // Orange
        tagColor: "25110f", // Light Blue
        tagFontColor: "F1F0EE", // Coffee black
        documentColor: "F1F0EE", // Coffee black
        titleFontColor: "25110f", // Saturated Light Blue
        textFontColor: "25110f", // Ultra light Blue
        chartAxisLineColor: "#25110f",
        chartAxisFontColor: "rgba(37,17,15, 0.7)",
        chartAxisTickFontColor: "rgba(37,17,15, 0.6)",
        chartItemFontColor: "rgba(37,17,15, 0.9)",
        chartSeriesColor: "rgb(27,12,10, 0.7)",
        chartSeriesBorderColor: "rgba(27,12,10, 0.9)", 
        highlightFontColor: ""
    } 
} 

export default docxSettings