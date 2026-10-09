# VoxQuest
VoxQuest is an AI-powered voice adventure that transforms text into lifelike speech. Explore different voices, experiment with speaking styles, and bring your words to life through intelligent voice technology. 

**VoxQuest** (An adventurous journey where your words meet the magic of AI voices)



VoxQuest is a Text-to-Speech, Voice Cloning, and Emotion-based voice application.

It has a React + Tailwind frontend and a Node.js + Express backend.

## How to Run

First install the dependencies:

```bash
npm install
```

For development mode:

```bash
npm run dev
```

The API will run on port `3001` and the frontend on port `5173`.

For production mode:

```bash
npm run build
npm start
```

The application will run on `http://localhost:3001`.

## The 4 Tabs

### 1. Text to Speech

Users can enter text, select a voice and speed, generate the audio, play it, and download it.

### 2. Voice Cloning

Users can upload or record a voice sample and give it a name to create a new voice.

### 3. Emotion Studio

Users can add emotion tags inside the text, such as:

```text
[happy]
[sad]
[angry]
[calm]
[excited]
[whisper]
```

The application uses these tags to generate audio with different emotions.

### 4. Library

This section contains the generated audio files and created voices. Users can delete anything they no longer need.

## Folder Structure

```text
server/app.js
```

Contains the main API routes.

```text
server/emotion.js
```

Handles and splits the text based on emotion tags.

```text
server/providers/
```

Contains the audio providers.

```text
mock.js
```

Used for generating demo audio without a real TTS API.

```text
http.js
```

Used to connect the application with a third-party TTS API.

```text
src/App.jsx
```

Contains the main frontend layout and tabs.

```text
src/tabs/
```

Contains the separate files for each tab.

```text
tests/
```

Contains the automated tests.

## Connecting a Third-Party TTS API

Copy `.env.example` to `.env` and add your API details:

```env
TTS_PROVIDER=http
TTS_API_URL=your_api_url
TTS_API_KEY=your_api_key
```

If the third-party API uses a different request format, the `buildTtsBody` function in `server/providers/http.js` needs to be updated.

If the API returns the audio as base64 inside a JSON response, configure `TTS_RESPONSE_AUDIO_FIELD`.

For voice cloning, configure `CLONE_API_URL` and `CLONE_RESPONSE_VOICE_FIELD`.

## Demo Mode

If no API key is provided, the application runs in Demo Mode.

In Demo Mode, it does not generate real speech. Instead, it generates synthetic tones with different pitch and speed based on the selected voice and emotion.

This mode is mainly used to test the complete application without connecting a real TTS API.

**Note:** History and cloned voices are stored in memory, so they will be reset whenever the server is restarted.
