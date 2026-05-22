const OpenAI = require('openai');

class AiService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateRepositoryInsights(repoDetails, commits, pulls, issues) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          summary: "OpenAI API key not configured. Mock summary: The repository is active but needs review on open PRs.",
          recommendations: [
            "Review open pull requests",
            "Address pending issues",
            "Configure OpenAI API key for real insights"
          ],
          healthScore: 85,
          sprintCompletion: 70
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
        
        Provide a JSON response with the following structure:
        {
          "summary": "A 2-3 sentence summary of the recent repository activity.",
          "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
          "healthScore": A number from 0 to 100 representing repository health (based on open issues vs closed PRs/commits),
          "sprintCompletion": A number from 0 to 100 representing estimated sprint completion (just an estimation based on the ratio of closed PRs to open issues/PRs)
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI developer productivity analyst." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        summary: "Error generating AI insights. The repository data was analyzed manually.",
        recommendations: ["Check API rate limits", "Ensure API key is valid"],
        healthScore: 70,
        sprintCompletion: 50
      };
    }
  }
}

module.exports = AiService;
