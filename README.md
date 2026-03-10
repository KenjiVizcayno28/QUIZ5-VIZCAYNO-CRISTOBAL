# Haiku Bot

This project is a full-stack app with:

- a Django backend in `backend/`
- a React frontend in `frontend/`
- SQLite as the local database
- Gemini API integration for generating Haiku responses

## Requirements

- Python 3.11+
- Node.js 18+
- npm

## Project Structure

```text
QUIZ5-VIZCAYNO-CRISTOBAL/
|-- backend/
|-- frontend/
|-- requirements.txt
```

## Backend Setup

Open a terminal in the project root and create a virtual environment:

```powershell
py -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate
```

Install the Python dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder.

Example:

```env
SECRET_KEY=django-insecure-change-this
DEBUG=True
GEMINI_API_KEY=your_gemini_api_key_here
```

Notes:

- `SECRET_KEY` is required by Django.
- `DEBUG=True` is recommended for local development.
- `GEMINI_API_KEY` is required for the chatbot response feature.

Apply migrations:

```powershell
cd backend
py manage.py migrate
```

Start the backend server:

```powershell
py manage.py runserver
```

The backend will run at:

```text
http://127.0.0.1:8000
```

## Frontend Setup

Open a second terminal in the project root and install the frontend dependencies:

```powershell
cd frontend
npm install
```

Start the React development server:

```powershell
npm start
```

The frontend will run at:

```text
http://localhost:3000
```

The frontend is already configured to send API requests to the Django backend during local development.

## How to Use

1. Start the Django backend.
2. Start the React frontend.
3. Open `http://localhost:3000` in your browser.
4. Register a new account or sign in.
5. Create a conversation by clicking new chat on the upper left section and send a topic to generate a Haiku.

## Important Notes

- The chatbot feature will not work without a valid `GEMINI_API_KEY`.
- Running only the frontend is not enough for full functionality.
- The backend uses SQLite, so no separate database server is needed.
- If the backend is not running, the frontend will load but API actions will fail.

## Common Commands

From `backend/`:

```powershell
py manage.py migrate
py manage.py runserver
```

From `frontend/`:

```powershell
npm install
npm start
npm run build
```

## Troubleshooting

If you get an error about missing environment variables:

- make sure the `.env` file is inside `backend/`
- make sure `SECRET_KEY`, `DEBUG`, and `GEMINI_API_KEY` are set

If `npm start` works but chat requests fail:

- confirm the backend is running on `127.0.0.1:8000`
- confirm your Gemini API key is valid
- confirm you are logged in before sending a prompt

If Django does not start:

- activate the virtual environment first
- reinstall dependencies with `pip install -r requirements.txt`
- run `py manage.py migrate` inside `backend/`