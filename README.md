# Calmia
Calmia is a stress management and self-reflection mobile application developed as a final project.
The app helps users track daily stress, mood, sleep, exercise habits, calming methods, breathing sessions, relaxing audio usage, mini games results, and nearby therapists. It also includes a Data View screen with visual summaries and AI-based insights.

## Main Features
- User registration and login
- Daily Reflection questionnaire
- Data View with charts and statistics with AI Analysis based on user reflections and habits
- Breathing timer
- Relaxing sounds and audio player
- Mini games
- Therapist finder by location

## Technologies
- React Native
- Expo
- TypeScript
- Node.js
- Express
- PostgreSQL / Neon Database
- Gemini API

## Installation
Install the project dependencies from the main project folder:
npm install
Install the backend dependencies:
cd backend
npm install

## Environment Variables
The backend uses environment variables stored in a .env file inside the backend folder.
This file is required in order to connect the backend to the database and to the Gemini AI service used in the AI Analysis feature.
Example .env structure:

PORT=6001
DATABASE_URL=your_database_url_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

Important:
- Do not upload real API keys or database credentials to GitHub.
- Each developer should create their own local .env file with their own private values.
- The Gemini API key is used only in the backend and should not be placed in the Expo / frontend code.

## Running the Backend
From the backend folder, run:
cd backend
npm start
The backend server runs on:
http://localhost:6001

## Running the App
From the main project folder, run:
npx expo start
Then open the app using Expo Go or press w.

## AI Analysis
The AI Analysis feature uses the Gemini API.
The app sends the user's reflection data and habits to the backend. The backend sends the data to Gemini and receives a structured analysis response.
The AI Analysis is used only for self-reflection and does not provide medical or mental health diagnosis.

## Notes
- node_modules is not included in the submitted ZIP file.
- Dependencies should be installed using npm install.
- The project requires an active database connection in order to save and load user data.
- AI Analysis requires a valid Gemini API key.
- Build files, generated files, and local cache folders should not be included in the submitted ZIP.
