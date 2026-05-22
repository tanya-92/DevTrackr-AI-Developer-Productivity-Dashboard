const axios = require('axios');

class AiService {
  async generateRepositoryInsights(repoDetails, commits, pulls, issues) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return {
          summary: "AI insights unavailable. Add GEMINI_API_KEY in backend .env.",
          bottlenecks: [],
          recommendations: []
        };
      }

      const prompt = `
        Analyze the following GitHub repository data and provide insights for a developer productivity dashboard.
        
        Repository: ${repoDetails.name}
        Description: ${repoDetails.description || 'N/A'}
        Recent Commits (last 100): ${commits.length}
        Open Pull Requests: ${pulls.filter(p => p.state === 'open').length}
        Closed Pull Requests: ${pulls.filter(p => p.state === 'closed').length}
        Open Issues: ${issues.filter(i => i.state === 'open').length}
        
        Return ONLY a JSON object (no markdown, no backticks, just raw JSON) with the following structure:
        {
          "summary": "A 2-3 sentence sprint summary of the recent repository activity.",
          "bottlenecks": ["Bottleneck 1", "Bottleneck 2"],
          "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
        }
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(responseText);

      return {
        summary: parsedData.summary || "No summary provided.",
        bottlenecks: parsedData.bottlenecks || [],
        recommendations: parsedData.recommendations || []
      };

    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      return {
        summary: "Error generating AI insights. The repository data was analyzed manually.",
        bottlenecks: ["Unable to analyze bottlenecks due to AI service error"],
        recommendations: ["Check API rate limits or Gemini configuration"]
      };
    }
  }
}

module.exports = AiService;
