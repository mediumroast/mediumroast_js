import docx from 'docx'

const docxSettings = {
    general: {
        fontSize: 10,
        dashFontSize: 9,
        tableFontSize: 8,
        titleFontSize: 18,
        metricFontSize: 48,
        tableBorderSize: 8,
        tableBorderStyle: docx.BorderStyle.SINGLE,
        noBorderStyle: docx.BorderStyle.NIL,
        tableMargin: docx.convertInchesToTwip(0.1),
        font: "Avenir Next"
    },
    coffee: {
        tableBorderColor: "4A7E92", // Light Blue
        documentColor: "0F0D0E", // Coffee black
        titleFontColor: "41A6CE", // Saturated Light Blue
        fontColor: "DCE9F6", // Ultra light Blue
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