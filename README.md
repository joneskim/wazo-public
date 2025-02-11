# Wazo Notes

## Overview
Wazo Notes is an advanced note-taking application with AI-powered features, including:
- Intelligent flashcard generation
- Knowledge graph visualization
- Zettelkasten-inspired note linking
- Cross-platform desktop application

## Project Structure
- `frontend/`: React TypeScript application with Electron
- `backend/`: Express.js TypeScript server
- `ai-backend/`: Python Flask server for AI processing
- `docs/`: Project documentation

## Prerequisites
- Node.js (v16+)
- Python (v3.9+)
- Docker (optional, for deployment)

## Setup Instructions
1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up Python virtual environment:
   ```bash
   cd ai-backend
   python -m venv wazo_env
   source wazo_env/bin/activate
   pip install -r requirements.txt
   ```

## Running the Application
- Frontend: `npm start`
- Backend: `npm run server`
- AI Backend: `python app.py`

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
