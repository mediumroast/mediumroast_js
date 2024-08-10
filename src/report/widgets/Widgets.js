/**
 * The parent class that contains all the widgets for building reports in docx
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file Widgets.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

import docxSettings from '../settings.js'
import docx from 'docx'

class Widgets {
    constructor(env) {
        this.env = env
        this.generalSettings = docxSettings.general
        this.themeSettings = docxSettings[this.env.theme]
        this.styles = this.initStyles()
    }

    initStyles () {
        const hangingSpace = 0.18
        return {
                default: {
                    heading1: {
                        run: {
                            size: this.generalSettings.fullFontSize,
                            bold: true,
                            font: this.generalSettings.font,
                            color: this.themeSettings.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 160,
                                after: 80,
                            },
                        },
                    },
                    heading2: {
                        run: {
                            size: 0.75 * this.generalSettings.fullFontSize,
                            bold: true,
                            font: this.generalSettings.font,
                            color: this.themeSettings.textFontColor
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
                            size: 0.8 * this.generalSettings.fullFontSize,
                            bold: true,
                            font: this.generalSettings.font,
                            color: this.themeSettings.textFontColor
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
                            font: this.generalSettings.font,
                            size: 1.5 * this.generalSettings.halfFontSize,
                            color: this.themeSettings.textFontColor
                        },
                    },
                    paragraph: {
                        font: this.generalSettings.font,
                        size: this.generalSettings.halfFontSize,
                        color: this.themeSettings.textFontColor
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
                            font: this.generalSettings.font,
                            size: this.generalSettings.halfFontSize,
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
                                    text: "-",
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
}

export default Widgets