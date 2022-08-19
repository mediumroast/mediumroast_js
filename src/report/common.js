// Import modules
import docx from 'docx'

// TODO Move common functions like paragraphs and texts into this module.
//      These need to be set up either for both HTML and DOCX

class Utilities {
    constructor (font, fontSize, textFontSize, textFontColor) {
        this.font = font ? font : 'Avenir Next'
        this.size = fontSize ? fontSize : 10
        this.textFontSize = textFontSize
        this.textFontColor = textFontColor
        this.styling = this.initStyles()
    }

    // Initialize the common styles for the doc
    initStyles () {
        const hangingSpace = 0.18
        return {
                default: {
                    heading1: {
                        run: {
                            size: this.textFontSize,
                            bold: true,
                            font: this.font,
                            color: this.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 50,
                                after: 100,
                            },
                        },
                    },
                    heading2: {
                        run: {
                            size: 0.75 * this.textFontSize,
                            bold: true,
                            font: this.font,
                            color: this.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 120,
                            },
                        },
                    },
                    heading3: {
                        run: {
                            size: 0.8 * this.textFontSize,
                            bold: true,
                            font: this.font,
                            color: this.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 120,
                            },
                        },
                    },
                    listParagraph: {
                        run: {
                            font: this.font,
                            size: 1.5 * this.size,
                        },
                    },
                    paragraph: {
                        font: this.font,
                        size: this.size,
                    }
                },
                paragraphStyles: [
                    {
                        id: "mrNormal",
                        name: "MediumRoast Normal",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: this.font,
                            size: this.size,
                        },
                    },
                ],
                numbering: {
                    config: [
                        {
                            reference: 'number-styles',
                            levels: [
                                {
                                    level: 0,
                                    format: docx.LevelFormat.DECIMAL,
                                    text: "%1.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { 
                                                left: docx.convertInchesToTwip(0.25), 
                                                hanging: docx.convertInchesToTwip(hangingSpace) 
                                            },
                                            spacing: {
                                                before: 75
                                            }
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: docx.LevelFormat.LOWER_LETTER,
                                    text: "%2.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(0.50), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: docx.LevelFormat.LOWER_ROMAN,
                                    text: "%3.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(0.75), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: docx.LevelFormat.UPPER_LETTER,
                                    text: "%4.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(1.0), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                                {
                                    level: 4,
                                    format: docx.LevelFormat.UPPER_ROMAN,
                                    text: "%5.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(1.25), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                            ]
                        },
                        {
                            reference: "bullet-styles",
                            levels: [
                                {
                                    level: 0,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u1F60",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(0.5), hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u00A5",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(1), hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u273F",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 2160, hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u267A",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 2880, hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 4,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u2603",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 3600, hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                            ]
                        }
                    ]}
            }
    }

    // For a section of prose create a paragraph
    makeParagraph (paragraph, size, bold, spaceAfter) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: this.font,
                    size: size ? size : 20,
                    bold: bold ? bold : false, 
                    break: spaceAfter ? spaceAfter : 0
                })
            ]
        })
    }

    // Create a text run
    makeTextrun(text, spaceAfter) {
        return new docx.TextRun({
            text: text,
            font: this.font,
            size: 1.5 * this.size,
            break: spaceAfter ? spaceAfter : 1
        })
    }

    // Create a page break
    pageBreak() {
        return new docx.Paragraph({
            children: [
                new docx.PageBreak()
            ]
        })
    }

    // Create a text of heading style 1
    makeHeading1(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_1
        })
    }

    // Create a text of heading style 2
    makeHeading2(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_2
        })
    }

    makeBookmark2(text, ident) {
        return new docx.Paragraph({
            heading: docx.HeadingLevel.HEADING_2,
            children: [
                new docx.Bookmark({
                    id: String(ident),
                    children: [
                        new docx.TextRun({text: text})
                    ]
                })
            ]
        })
    }

    // Create a text of heading style 2
    makeHeading3(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_3
        })
    }

    // Create an internal hyperlink
    makeInternalHyperLink(text, link) {
        return new docx.InternalHyperlink({
            children: [
                new docx.TextRun({
                    text: text,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 1.5 * this.size,
                }),
            ],
            anchor: link,
        })
    }

    // Create an external hyperlink
    makeExternalHyperLink(text, link) {
        return new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: text,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 1.5 * this.fontSize
                })
            ],
            link: link
        })
    }
}

export default Utilities