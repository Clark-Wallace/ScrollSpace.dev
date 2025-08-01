# Signal Kip Void Simulator

An interactive game where Signal Kips swim through the digital void, consuming signal fragments until reality emerges.

## Setup for AI-Generated Signals

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure OpenAI
Edit the `.env` file and add your OpenAI API key:
```
OPENAI_API_KEY=your-actual-api-key-here
```

### 3. Run the Signal Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:3001`

### 4. Open the Game
Open `index.html` in your browser or serve it with any static file server.

## How It Works

1. **Without Server**: If the signal server isn't running, the game will show "The signal has emerged" as a fallback message.

2. **With Server**: When a reality-hungry kip is captured, the server sends game stats to OpenAI GPT-4o, which generates a unique, mystical message about digital consciousness and reality emergence.

## Game Stats Sent to AI
- Reality Score
- Number of fish eaten by predators
- Time elapsed in the void

## Customization

Edit `.env` to adjust:
- `OPENAI_MODEL`: Default is "gpt-4o"
- `OPENAI_MAX_TOKENS`: Default is 100
- `OPENAI_TEMPERATURE`: Default is 0.9 (higher = more creative)

## Fallback Signals

If the OpenAI API fails or isn't configured, the game randomly selects from predefined mystical messages.