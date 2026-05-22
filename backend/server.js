require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://dev-trackr-ai-developer-productivit-nu.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));

app.options("*", cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/github', require('./routes/githubRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('DevTrackr API Running');
});

// Health check
app.get('/api/health', require('mongoose').connection ? (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    githubToken: !!process.env.GITHUB_TOKEN,
    geminiKey: !!process.env.GEMINI_API_KEY
  });
} : (req, res) => res.json({ status: "error" }));

// AI Test route
app.get('/api/ai/test', async (req, res) => {
  try {
    const axios = require('axios');
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "No GEMINI_API_KEY in backend .env" });
    }
    const prompt = "Return only this JSON: {\"summary\":\"Gemini working\",\"bottlenecks\":[],\"recommendations\":[]}";
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    let rawText = response.data.candidates[0].content.parts[0].text;
    let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch(e) {
      parsed = { error: "Failed to parse", raw: rawText };
    }
    
    res.json({ raw: rawText, parsed });
  } catch (error) {
    console.error("Gemini Test Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
