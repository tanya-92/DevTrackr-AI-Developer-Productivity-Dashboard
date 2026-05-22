const axios = require('axios');

class AiService {
  async generateRepositoryInsights(repoDetails, commits, pulls, issues) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return {
          summary: "AI insights unavailable. Add GEMINI_API_KEY in backend .env.",
          productivityAnalysis: "",
          bottlenecks: [],
          recommendations: [],
          riskLevel: "Unknown",
          healthComment: ""
        };
      }

      // Extract recent commit messages safely
      const recentCommitMessages = commits.slice(0, 10).map(c => c.commit?.message).filter(Boolean).join(" | ");

      const prompt = `
        Analyze the following GitHub repository data and provide detailed insights for a developer productivity dashboard.
        
        Repository: ${repoDetails.name}
        Description: ${repoDetails.description || 'N/A'}
        Recent Commits (last 100): ${commits.length}
        Recent Commit Messages: ${recentCommitMessages.substring(0, 500)}...
        Open Pull Requests: ${pulls.filter(p => p.state === 'open').length}
        Closed Pull Requests: ${pulls.filter(p => p.state === 'closed').length}
        Open Issues: ${issues.filter(i => i.state === 'open').length}
        Closed Issues: ${issues.filter(i => i.state === 'closed').length}
        
        You must analyze:
        - commit count and recent commit messages
        - pull requests and issue resolution
        - repo activity, sprint progress, bottlenecks, and productivity patterns
        
        Rules:
        - Do not return one-word or generic answers.
        - Each bottleneck should be 1-2 sentences with reason and impact.
        - Each recommendation should be actionable and practical.
        - If data is limited, mention that analysis is based on limited GitHub activity.
        - Return ONLY valid JSON, no markdown.

        Return ONLY valid JSON with this exact structure:
        {
          "summary": "A detailed 5-7 line sprint summary explaining what development work happened, what modules were active, and overall project movement.",
          "productivityAnalysis": "Detailed explanation of developer activity, commit consistency, contributor participation, and progress quality.",
          "bottlenecks": [
            "Detailed bottleneck with reason and impact",
            "Detailed bottleneck with reason and impact"
          ],
          "recommendations": [
            "Actionable recommendation with explanation",
            "Actionable recommendation with explanation",
            "Actionable recommendation with explanation"
          ],
          "riskLevel": "Low / Medium / High",
          "healthComment": "Detailed comment on repository health and sprint stability."
        }
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json"
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      let rawText = response.data.candidates[0].content.parts[0].text;
      
      // Clean the response before JSON.parse
      let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        const parsedData = JSON.parse(cleanedText);
        return {
          summary: parsedData.summary || "No summary provided.",
          productivityAnalysis: parsedData.productivityAnalysis || "",
          bottlenecks: parsedData.bottlenecks || [],
          recommendations: parsedData.recommendations || [],
          riskLevel: parsedData.riskLevel || "Unknown",
          healthComment: parsedData.healthComment || ""
        };
      } catch (parseError) {
        console.error("JSON Parse Error on Gemini response:", parseError);
        return {
          summary: rawText,
          productivityAnalysis: "",
          bottlenecks: [],
          recommendations: [],
          riskLevel: "Unknown",
          healthComment: ""
        };
      }

    } catch (error) {
      console.error("Gemini API Error:", error.response?.data || error.message);
      return {
        summary: "AI insights unavailable. Check GEMINI_API_KEY or Gemini API configuration.",
        productivityAnalysis: "",
        bottlenecks: [],
        recommendations: [],
        riskLevel: "Unknown",
        healthComment: ""
      };
    }
  }
}

module.exports = AiService;
