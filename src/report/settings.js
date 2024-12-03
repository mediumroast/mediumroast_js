import docx from 'docx'

const docxSettings = {
    general: {
        halfFontSize: 11,
        fullFontSize: 11 * 2, // Note these are in half points, so 22 * 2 = 44
        headerFontSize: 18,
        footerFontSize: 14,
        fontFactor: 1,
        dashFontSize: 22,
        tableFontSize: 9 * 2, // Note these are in half points, so 9 * 2 = 18
        titleFontSize: 30,
        companyNameFontSize: 11.5,
        metricFontTitleSize: 11,
        metricFontSize: 48,
        chartTitleFontSize: 18,
        chartFontSize: 10,
        chartAxesFontSize: 12,
        chartTickFontSize: 10,
        chartSymbolSize: 20,
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
        chartAxisFontColor: "rgba(71,121,140, 0.9)",
        chartAxisTickFontColor: "rgba(149,181,192, 0.9)",
        chartItemFontColor: "rgba(149,181,192, 0.9)",
        chartSeriesColor: "rgba(91,216,255, 1)",
        chartSeriesPieColor: "rgba(77,163,187, 1)",
        chartSeriesBorderColor: "rgba(149,181,192, 1)", 
        chartSeriesPieBorderColor: "rgba(53,101,112, 1)", 
        highlightFontColor: ""
    },
    espresso: {
        tableBorderColor: "C7701E", // Orange
        tagColor: "C7701E", // Light Blue
        tagFontColor: "0F0D0E", // Coffee black
        documentColor: "0F0D0E", // Coffee black
        titleFontColor: "C7701E", // Saturated Light Blue
        textFontColor: "C7701E", // Ultra light Blue
        chartAxisLineColor: "rgba(134,84,28, 0.9)",
        chartAxisFontColor: "rgba(199,112,30, 0.9)",
        chartAxisTickFontColor: "rgba(199,112,30, 0.9)",
        chartItemFontColor: "rgba(199,112,30, 0.9)",
        chartSeriesColor: "rgb(199,112,30, 1)",
        chartSeriesBorderColor: "rgba(90,56,19, 1)", 
        highlightFontColor: ""
    },
    latte: {
        tableBorderColor: "25110f", // Orange
        tagColor: "25110f", // Light Blue
        tagFontColor: "F1F0EE", // Coffee black
        documentColor: "F1F0EE", // Coffee black
        titleFontColor: "25110f", // Saturated Light Blue
        textFontColor: "25110f", // Ultra light Blue
        chartAxisLineColor: "rgba(66,24,17, 0.9)",
        chartAxisFontColor: "rgba(37,17,15, 0.7)",
        chartAxisTickFontColor: "rgba(205,183,160, 0.6)",
        chartItemFontColor: "rgb(27,12,10, 0.7)",
        chartSeriesColor: "rgb(27,12,10, 0.7)",
        chartSeriesBorderColor: "rgba(205,183,160, 0.9)", 
        highlightFontColor: ""
    } 
} 

export default docxSettings