import { getPriorityMap, getContenderTypes, getContenderDirection } from './helpers.js';

class Transforms {
    
    /**
     * 
     * @param {*} companiesData 
     * @returns 
     * 
     */
    static extractForPriorityCompanyReport(companiesData) {
        const combinedCompanies = {};

        for (const key in companiesData) {
            if (companiesData.hasOwnProperty(key)) {
                const item = companiesData[key];
                const byCompany = item.by_company;
                const similarityThreshold = byCompany.similarity_threshold;
                const companies = byCompany.companies;

                for (const companyName in companies) {
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

    static extractForTopInsightsReport(companyData, topCount=5) {
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

        return reportData;
    }
}

export default Transforms;