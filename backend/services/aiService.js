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
        
        Return ONLY valid JSON with this exact structure:
        {
          "summary": "short sprint summary",
          "bottlenecks": ["point 1", "point 2"],
          "recommendations": ["point 1", "point 2"]
        }
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      let rawText = response.data.candidates[0].content.parts[0].text;
      
      // Clean the response before JSON.parse
      let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        const parsedData = JSON.parse(cleanedText);
        return {
          summary: parsedData.summary || "No summary provided.",
          bottlenecks: parsedData.bottlenecks || [],
          recommendations: parsedData.recommendations || []
        };
      } catch (parseError) {
        console.error("JSON Parse Error on Gemini response:", parseError);
        return {
          summary: rawText,
          bottlenecks: [],
          recommendations: []
        };
      }

    } catch (error) {
      console.error("Gemini API Error:", error.response?.data || error.message);
      return {
        summary: "AI insights unavailable. Check GEMINI_API_KEY or Gemini API configuration.",
        bottlenecks: [],
        recommendations: []
      };
    }
  }
}

module.exports = AiService;
