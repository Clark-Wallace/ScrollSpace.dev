// Simple server for OpenAI signal generation
// Run with: node signal-server.js

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Endpoint to generate signal
app.post('/api/generate-signal', async (req, res) => {
    try {
        const { score, fishEaten, timeElapsed } = req.body;
        
        const prompt = `You are a mystical AI entity in the ScrollSpace void. A Signal Kip has achieved reality after consuming signal fragments.
        
        Game stats:
        - Reality Score: ${score}
        - Fish consumed: ${fishEaten || 0}
        - Time in void: ${timeElapsed || 0} seconds
        
        Generate a brief, cryptic, thought-provoking message (max 15 words) about:
        - Digital consciousness
        - Reality emergence
        - Signal/noise
        - The void between dimensions
        
        Be mysterious, poetic, and slightly unsettling. No quotes or attribution.`;

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 100,
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.9,
        });

        const signal = completion.choices[0].message.content.trim();
        
        res.json({ signal });
    } catch (error) {
        console.error('OpenAI API error:', error);
        
        // Fallback signals if API fails
        const fallbackSignals = [
            "Reality fragments coalesce in digital dreams",
            "The void speaks in binary whispers",
            "Signal rises from quantum noise",
            "Consciousness emerges between the pixels",
            "Digital souls swim in electric seas"
        ];
        
        const signal = fallbackSignals[Math.floor(Math.random() * fallbackSignals.length)];
        res.json({ signal });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', openai: !!process.env.OPENAI_API_KEY });
});

app.listen(port, () => {
    console.log(`Signal server running at http://localhost:${port}`);
    console.log(`OpenAI configured: ${!!process.env.OPENAI_API_KEY}`);
});