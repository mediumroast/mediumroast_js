// Import modules
import docx from 'docx'
import Utilities from './common.js'

class KeyThemes {
    constructor (themeType, themes, quotes, interactions) {
        this.type = themeType
        this.themes = themes ? themes : false
        this.quotes = quotes ? quotes : false
        this.interactions = interactions ? interactions : false
        this.font = 'Avenir Next' // We need to pass this in from the config file
        this.fontSize = 10 // We need to pass this in from the config file
        this.fontFactor = 1.5
        this.util = new Utilities()
        this.introduction = 'The mediumroast.io system has automatically generated this section. ' +
            'If this section is for a summary theme, then two sections are included: ' + 
            '1. Information for the summary theme including key words, score and rank. ' +
            '2. Excerpts from the interactions within the sub-study and links to each interaction reference.'
    }

    basicThemeRow (theme, score, rank, bold) {
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 60,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.util.makeParagraph(theme, this.fontFactor * this.fontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.util.makeParagraph(score, this.fontFactor * this.fontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.util.makeParagraph(rank, this.fontFactor * this.fontSize, bold ? true : false)]
                }),
            ]
        })
    }

    // Create the table for the doc
    summaryThemeTable(themes) {
        let myRows = [this.basicThemeRow('Topic Keywords', 'Score', 'Rank', true)]
        for (const theme in themes) {
            myRows.push(this.basicThemeRow(theme, themes[theme].score.toFixed(2), themes[theme].rank))
        }
        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [60, 20, 20],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return myTable
    }

    getInteractionName (guid, interactions) {
        for (const interaction in interactions) {
            if (String(guid) === String(interactions[interaction].GUID)) {
                return interactions[interaction].interactionName
            } else {
                continue
            }
        }
        return 'Unknown Interaction Name'
    }

    // Create the theme quotes/excerpts for the doc
    summaryQuotes(quotes, interactions) {
        let myQuotes = []
        for (const quote in quotes) {
            const myInteraction = this.getInteractionName(quote, interactions)
            myQuotes.push(
                this.util.makeParagraph('"' + quotes[quote].quotes[0] + '"', this.fontFactor * this.fontSize, false, 0),
                new docx.Paragraph({
                    children: [
                        this.util.makeTextrun('Source: '),
                        // TODO open a GitHub issue for this behavior:
                        //      A bookmark can only handle a substring from 0:40, and it will automatically
                        //      truncate to that length.  However when there is an internal hyperlink there is
                        //      no similar truncation.  This leads to the internal hyperlink having an incorrect
                        //      reference.  
                        // NOTE move the substring into the method to create an internal hyperlink
                        this.util.makeInternalHyperLink(myInteraction, String(quote).substring(0,40)),
                        this.util.makeTextrun('', 2),
                    ],
                })
            )
        }
        return myQuotes
    }

    makeDocx () {
        if (this.type === 'summary') {
            const excerpts = this.summaryQuotes(this.quotes, this.interactions)
            return [
                this.util.pageBreak(),
                this.util.makeHeading1('Summary Theme: Table and Excerpts'),
                this.util.makeParagraph(this.introduction, 0),
                this.util.makeHeading2('Summary Theme Table'),
                this.summaryThemeTable(this.themes),
                this.util.makeBookmark2('Summary Theme Excerpts', 'summary_excerpts'),
                ...excerpts
            ]
        } else {
            return []
        }

    }
}

export default KeyThemes