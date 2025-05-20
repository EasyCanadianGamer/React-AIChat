import express from 'express';
import { getJson } from 'serpapi';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parse JSON request bodies
app.use(express.json());
app.get('/api/search', async (req, res) => {
    const { q , city} = req.query;
  
    // Validate the query parameter
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
  
    const apiKey = process.env.VITE_SERPAPI_API_KEY; // Use process.env in Node.js
    const locationQuery = city ;

    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}${locationQuery}&api_key=${apiKey}`;  
    try {
      const response = await fetch(url);
  
      // Log the raw response for debugging
      const text = await response.text();
      console.log("Raw response from SerpAPI:", text);
  
      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
      }
  
      // Try parsing the response as JSON
      const data = JSON.parse(text);
  
      // Log the parsed JSON for debugging
      console.log("Parsed JSON from SerpAPI:", data);
  
      // Send the JSON response to the frontend
      res.json(data);
    } catch (error) {
      console.error('Error fetching data from SerpAPI:', error);
      res.status(500).json({ error: 'Failed to fetch data from SerpAPI' });
    }
  });
// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});