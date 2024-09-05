/**
 * @module TextWidgets
 * @description This class contains Text widgets for building reports in docx
 * @extends Widgets
 * @requires Widgets
 * @requires docx
 * @version 1.2.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file Text.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * 
 * @example
 * import TextWidgets from './Text.js'
 * const text = new TextWidgets()
 * const myParagraph = text.makeParagraph('This is a paragraph')
 * 
 */

// Import required modules
import Widgets from './Widgets.js'
import docx from 'docx'

class TextWidgets extends Widgets {
    constructor(env) {
        super(env)
        // Initialization code for TextWidget
    }

    /**
     * @function makeBullet
     * @description Create a bullet for a bit of prose
     * @param {String} text - text/prose for the bullet
     * @param {Integer} level - the level of nesting for the bullet
     * @returns {Object} new docx paragraph object as a bullet
     */
    makeBullet(text, level=0) {
        return new docx.Paragraph({
            text: text,
            numbering: {
                reference: 'bullet-styles',
                level: level
            }
        })
    }

    /**
     * @function makeHeader
     * @description Generate a header with an item's name and the document type fields
     * @param {String} itemName 
     * @param {String} documentType 
     * @param {Object} options 
     */
    makeHeader(itemName, documentType, options={}) {
        const {
            landscape = false,
            fontColor = this.themeSettings.textFontColor,
        } = options
        let separator = "\t".repeat(3)
        if (landscape) { separator = "\t".repeat(4)}
        return new docx.Header({
            children: [
                new docx.Paragraph({
                    alignment: docx.AlignmentType.CENTER,
                    children: [
                        new docx.TextRun({
                            children: [documentType],
                            font: this.generalSettings.font,
                            size: this.generalSettings.headerFontSize,
                            color: fontColor ? fontColor : this.themeSettings.textFontColor
                        }),
                        new docx.TextRun({
                            children: [itemName],
                            font: this.generalSettings.font,
                            size: this.generalSettings.headerFontSize,
                            color: fontColor ? fontColor : this.themeSettings.textFontColor
                        })
                    ],
                }),
            ],
        })
    }

    makeFooter(documentAuthor, datePrepared, options={}) {
        console.log(documentAuthor, datePrepared)
        const {
            landscape = false,
            fontColor = this.themeSettings.textFontColor,
        } = options
        let separator = "\t"
        if (landscape) { separator = "\t".repeat(2)}
        return new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.TextRun({
                    children: ['Page ', docx.PageNumber.CURRENT, ' of ', docx.PageNumber.TOTAL_PAGES, separator],
                    font: this.generalSettings.font,
                    size: this.generalSettings.footerFontSize,
                    color: fontColor ? fontColor : this.themeSettings.textFontColor
                }),
                new docx.TextRun({
                    children: ['|', separator, documentAuthor, separator],
                    font: this.generalSettings.font,
                    size: this.generalSettings.footerFontSize,
                    color: fontColor ? fontColor : this.textFontColor
                }),
                new docx.TextRun({
                    children: ['|', separator, datePrepared],
                    font: this.generalSettings.font,
                    size: this.generalSettings.footerFontSize,
                    color: fontColor ? fontColor : this.themeSettings.textFontColor
                })
            ]
        })
    }

    /**
     * @function makeParagraph
     * @description For a section of prose create a paragraph
     * @param {String} paragraph - text/prose for the paragraph
     * @param {Object} objects - an object that contains the font size, color, and other styling options
     * @returns {Object} a docx paragraph object 
     */
    makeParagraph (paragraph,options={}) {
        const {
            fontSize,
            bold=false, 
            fontColor,
            font='Avenir Next',
            center=false, 
            italics=false, 
            underline=false,
            spaceAfter=0,
        } = options
        // const fontSize = 2 * this.fullFontSize // Font size is measured in half points, multiply by to is needed
        return new docx.Paragraph({
            alignment: center ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: font ? font : this.generalSettings.font,
                    size: fontSize ? fontSize : this.fullFontSize, // Default font size size 10pt or 2 * 10 = 20
                    bold: bold ? bold : false, // Bold is off by default
                    italics: italics ? italics : false, // Italics off by default
                    underline: underline ? underline : false, // Underline off by default
                    break: spaceAfter ? spaceAfter : 0, // Defaults to no trailing space
                    color: fontColor ? fontColor : this.themeSettings.textFontColor
                })
            ]
        })
    }


    /**
     * @function pageBreak
     * @description Create a page break
     * @returns {Object} a docx paragraph object with a PageBreak
     */
    pageBreak() {
        return new docx.Paragraph({
            children: [
                new docx.PageBreak()
            ]
        })
    }

    /**
     * @function makeHeading1
     * @description Create a text of heading style 1
     * @param {String} text - text/prose for the function
     * @returns {Object} a new paragraph as a heading
     */
    makeHeading1(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_1
        })
    }

    /**
     * @function makeHeading2
     * @description Create a text of heading style 2
     * @param {String} text - text/prose for the function
     * @returns {Object} a new paragraph as a heading
     */
    makeHeading2(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_2
        })
    }

    /**
     * @function makeHeading3
     * @description Create a text of heading style 3
     * @param {String} text - text/prose for the function
     * @returns {Object} a new paragraph as a heading
     */
    makeHeading3(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_3
        })
    }

     /**
     * @function makeHeadingBookmark1
     * @description Create a target within a document to link to with an internal hyperlink of heading 1
     * @param {String} text - text/prose for the function
     * @param {String} ident - the unique name of the bookmark
     * @returns {Object} a new docx paragraph object with a bookmark at the heading level 1
     * @todo could we generalize this function and make the heading level a parameter in the future?
     */
     makeHeadingBookmark1(text, ident) {
        return new docx.Paragraph({
            heading: docx.HeadingLevel.HEADING_1,
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

    /**
     * @function makeHeadingBookmark2
     * @description Create a target within a document to link to with an internal hyperlink of heading 2
     * @param {String} text - text/prose for the function
     * @param {String} ident - the unique name of the bookmark
     * @returns {Object} a new docx paragraph object with a bookmark at the heading level 2
     */
    makeHeadingBookmark2(text, ident) {
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

    /**
     * @function makeInternalHyperLink
     * @description Create an external hyperlink
     * @param {String} text - text/prose for the function
     * @param {String} link - the URL for the hyperlink within the document
     * @returns {Object} a new docx InternalHyperlink object
     */
    makeInternalHyperLink(text, link) {
        const myLink = new docx.InternalHyperlink({
            children: [
                new docx.TextRun({
                    text: String(text),
                    style: 'Hyperlink',
                    font: this.generalSettings.font,
                    size: this.generalSettings.fullFontSize,
                }),
            ],
            anchor: link,
        })
        return myLink
    }

    /**
     * @function makeExternalHyperLink
     * @description Create an external hyperlink
     * @param {String} text - text/prose for the function
     * @param {String} link - the URL for the hyperlink
     * @returns {Object} a new docx ExternalHyperlink object
     */ 
    makeExternalHyperLink(text, link) {
        return new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: String(text),
                    style: 'Hyperlink',
                    font: this.generalSettings.font,
                    size: this.generalSettings.fullFontSize,
                }),
            ],
            link: link
        })
    }

    /**
     * @function makeBookmark
     * @description Create a target within a document to link to with an internal hyperlink
     * @param {String} text - text/prose for the function
     * @param {String} ident - the unique name of the bookmark
     * @returns {Object} a new docx paragraph object with a bookmark
     * @todo test and revise this function as it may need to be a textrun which can be embedded in something else
     */
    makeBookmark(text, ident) {
        return new docx.Paragraph({
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

    /**
     * @function makeIntro
     * @description Creates an introduction paragraph with a heading of level 1
     * @param {String} introText - text/prose for the introduction
     * @returns {Object} a complete introduction with heading level 1 and a paragraph
     */
    makeIntro (introText) {
        return [
            this.makeHeading1('Introduction'),
            this.makeParagraph(introText)
        ]
    }
}

export default TextWidgets