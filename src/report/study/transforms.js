import { 
    getPriorityMap, 
    getContenderTypes, 
    getContenderDirection,
    getInteractionLookupTable,
    getInsigntUniquenessMap 
} from './helpers.js';

class Transforms {
    
    static extractForPriorityCompanyReport(companiesData, sourceData) {
        const combinedCompanies = {};

        for (const key in companiesData) {
            if (companiesData.hasOwnProperty(key)) {
                const item = companiesData[key];
                const byCompany = item.by_company;
                const similarityThreshold = byCompany.similarity_threshold;
                const companies = byCompany.companies;

                for (const companyName in companies) {
                    // With sourceData get the top and bottom interactions for each company
                    if (companies.hasOwnProperty(companyName)) {
                        const similarityScore = companies[companyName];
                        const countAboveThreshold = similarityScore >= similarityThreshold ? 1 : 0;
                        const countBelowThreshold = similarityScore < similarityThreshold ? 1 : 0;

                        if (!combinedCompanies[companyName]) {
                            combinedCompanies[companyName] = {
                                similarityThreshold: similarityThreshold,
                                totalSimilarityScore: 0,
                                count: 0,
                                countAboveThreshold: 0,
                                countBelowThreshold: 0
                            };
                        }

                        combinedCompanies[companyName].totalSimilarityScore += similarityScore;
                        combinedCompanies[companyName].count++;
                        combinedCompanies[companyName].countAboveThreshold += countAboveThreshold;
                        combinedCompanies[companyName].countBelowThreshold += countBelowThreshold;
                    }
                }
            }
        }

        // Calculate the average similarity score, capture similarty data, and similarity direction data for each company
        let avgSimilarityData = [];
        let similarityDirectionData = [];
        for (const companyName in combinedCompanies) {
            if (combinedCompanies.hasOwnProperty(companyName)) {
                combinedCompanies[companyName].avgSimilarityScore = combinedCompanies[companyName].totalSimilarityScore / combinedCompanies[companyName].count;
                
                // Add the avgSimilarityScore to avgSimilarityData
                avgSimilarityData.push(combinedCompanies[companyName].avgSimilarityScore);

                // Add the difference of the count above and count below to the similarityDirectionData
                const direction = combinedCompanies[companyName].countAboveThreshold - combinedCompanies[companyName].countBelowThreshold;
                similarityDirectionData.push(direction);
                combinedCompanies[companyName].direction = direction;

                // Use sourceData to get the top and bottom interactions for each company
                const sourceCompanyData = sourceData[companyName];
                const [topInteractions, topBottomInteractions] = Transforms.getTopInteractions(sourceCompanyData);
                combinedCompanies[companyName].topInteractions = topInteractions;
                combinedCompanies[companyName].topInteraction = topBottomInteractions.top;
                combinedCompanies[companyName].bottomInteraction = topBottomInteractions.bottom;
            }
        }

        // Get contender types from avgSimilarityData and contender directions from similarityDirectionData
        const contenderTypes = getContenderTypes(avgSimilarityData);
        const contenderDirections = getContenderDirection(similarityDirectionData);

        // Add contender types and contender directions to each company
        for (const companyName in combinedCompanies) {
            if (combinedCompanies.hasOwnProperty(companyName)) {
                combinedCompanies[companyName].contenderType = contenderTypes[combinedCompanies[companyName].avgSimilarityScore];
                combinedCompanies[companyName].contenderDirection = contenderDirections[combinedCompanies[companyName].direction];
            }
        }

        return combinedCompanies;
    }

    static getTopInteractions(companyData, topCount=5) {
        // Count interaction occurrences in targets
        const interactionCountInTargets = {};
        for (const key in companyData) {
            if (companyData.hasOwnProperty(key)) {
                const item = companyData[key];
                const interaction = item.source_interaction;

                for (const target in item.targets) {
                    if (item.targets.hasOwnProperty(target)) {
                        if (!interactionCountInTargets[interaction]) {
                            interactionCountInTargets[interaction] = 0;
                        }
                        interactionCountInTargets[interaction]++;
                    }
                }
            }
        }

        // Get topCount interactions from interactionCountInTargets
        const topInteractions = Object.entries(interactionCountInTargets)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topCount)
            .map(entry => entry[0]);

        // Get the top interaction by count
        const topInteraction = Object.entries(interactionCountInTargets)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1)
            .map(entry => entry[0])[0];

        // Get the bottom interaction by count
        const bottomInteraction = Object.entries(interactionCountInTargets)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 1)
            .map(entry => entry[0])[0];

        // Create an object containing the top and bottom interactions
        const topBottomInteractions = {
            top: topInteraction,
            bottom: bottomInteraction
        };

        return [topInteractions, topBottomInteractions];
    }

    static extractForTopInsightsReport(companyData, topCount=5) {
        // Get top interactions
        const [topInteractions, topBottomInteractions] = Transforms.getTopInteractions(companyData, topCount);

        // Gather insights for topCount interactions
        let reportData = [];
        let numericalPriorities = [];
        for (const key in companyData) {
            if (companyData.hasOwnProperty(key)) {
                const item = companyData[key];
                const interaction = item.source_interaction;

                if (topInteractions.includes(interaction)) {
                    // Calculate rank across all targets for the insight
                    let rank = Object.values(item.targets).reduce((a, b) => a + b, 0) / Object.values(item.targets).length;
                    rank = Math.round(rank * 100);
                    // Add the count to numericalPriorities
                    numericalPriorities.push(item.count);
                    reportData.push({
                        insight: item.insight,
                        source_interaction: interaction,
                        type: item.type,
                        count: item.count,
                        rank: rank,
                        excerpts: item.excerpts
                    });
                }
            }
        }

        // Get priority map for numericalPriorities
        const priorityMap = getPriorityMap(numericalPriorities);

        // Add priority to each reportData item
        for (const item of reportData) {
            item.priority = priorityMap[item.count];
        }

        // Sort report data by Count in descending order
        reportData.sort((a, b) => b.count - a.count);

        // Return both report data and the top interactions, but might need to include the company name
        return reportData;
    }

    static extractForMostLeastSimilarInsightsReport(processData, companies) {
        // Create the base object
        let mostLeastSimilarInsights = [];

        // Get the interaction lookup table
        const interactionLookupTable = getInteractionLookupTable(companies);

        // Setup an array to hold the count differences
        let countDifferences = [];

        // Iterate through the interactions and sort them into most and least similar
        for (const key in processData) {
            if (processData.hasOwnProperty(key)) {
                const item = processData[key];
                const byInteraction = item.by_interaction;
                const byCompany = item.by_company;
                let interactions = byInteraction.interactions;
                const countDifference = byInteraction.high_count - byInteraction.low_count;

                // Add the count difference to countDifferences
                countDifferences.push(countDifference);

                // Compute the average similarity score from the interactions, knowing that the interactions is an obeject with keys as interaction names and values as similarity scores
                let totalSimilarityScore = 0;
                let count = 0;
                for (const interaction in interactions) {
                    if (interactions.hasOwnProperty(interaction)) {
                        totalSimilarityScore += interactions[interaction];
                        count++;
                    }
                }
                const avgSimilarityScore = totalSimilarityScore / count;
                const rank = Math.round(avgSimilarityScore * 100);

                // Get the most and least similar interactions
                const mostSimilar = Object.entries(interactions)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 1)
                    .map(entry => entry[0])[0];

                const leastSimilar = Object.entries(interactions)
                    .sort((a, b) => a[1] - b[1])
                    .slice(0, 1)
                    .map(entry => entry[0])[0];

                // Get the most and least similar companies knowing that companies is an object with keys as company names and values as similarity scores
                const mostSimilarCompany = Object.entries(byCompany.companies)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 1)
                    .map(entry => entry[0])[0];

                const leastSimilarCompany = Object.entries(byCompany.companies)
                    .sort((a, b) => a[1] - b[1])
                    .slice(0, 1)
                    .map(entry => entry[0])[0];

                mostLeastSimilarInsights.push({
                    insight: item.insight,
                    type: item.type,
                    source_interaction: item.source_interaction,
                    excerpts: item.excerpts,
                    countDifference: countDifference,
                    similarityThreshold: byInteraction.similarity_threshold,
                    highCount: byInteraction.high_count,
                    lowCount: byInteraction.low_count,
                    rank: rank,
                    mostSimilarInteraction: mostSimilar,
                    leastSimilarInteraction: leastSimilar,
                    mostSimilarCompany: mostSimilarCompany,
                    leastSimilarCompany: leastSimilarCompany
                });
            }
        }

        // Get the uniqueness map for countDifferences
        const uniquenessMap = getInsigntUniquenessMap(countDifferences);

        // Add uniqueness to each mostLeastSimilarInsights item
        for (const item of mostLeastSimilarInsights) {
            item.uniqueness = uniquenessMap[item.countDifference];
        }


        return mostLeastSimilarInsights;
    }
}

export default Transforms;