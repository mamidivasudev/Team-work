# TeamTrack MVP

TeamTrack is a simple, fast, and easy-to-navigate alternative to tools like Redmine. It helps software teams manage projects and tasks efficiently.

## Project Structure

```
D:\AI\work_flow_tracker\
├── backend/
│   ├── database.py   (SQLAlchemy setup)
│   ├── models.py     (Database models)
│   ├── schemas.py    (Pydantic schemas)
│   ├── crud.py       (CRUD operations)
│   ├── main.py       (FastAPI app & routes)
│   ├── seed.py       (Database seed script)
│   └── venv/         (Python virtual environment)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ (Sidebar, Header, Layout)
│   │   ├── pages/      (Dashboard, Projects, Tasks, Team, Activity)
│   │   ├── services/   (API integration)
│   │   ├── types/      (TypeScript interfaces)
│   │   ├── App.tsx     (React Router setup)
│   │   └── index.css   (Tailwind configuration)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
```

## How to Run the Backend

The backend is built with Python, FastAPI, and SQLAlchemy.

1. Open a terminal and navigate to the project directory:
   ```cmd
   cd D:\AI\work_flow_tracker
   ```
2. Activate the virtual environment:
   ```cmd
   backend\venv\Scripts\activate
   ```
3. Run the FastAPI server:
   ```cmd
   uvicorn backend.main:app --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`.

## How to Run the Frontend

The frontend is built with React, Vite, TypeScript, and Tailwind CSS.

1. Open a new terminal and navigate to the frontend directory:
   ```cmd
   cd D:\AI\work_flow_tracker\frontend
   ```
2. Install dependencies (if you haven't already):
   ```cmd
   npm install
   ```
3. Start the Vite development server:
   ```cmd
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Database Setup

By default, the application is configured to use a local **SQLite** database (`teamtrack.db`) since PostgreSQL was not available in your environment.
This allows the application to run smoothly out of the box.

If you wish to switch to **PostgreSQL**:
1. Ensure PostgreSQL is installed locally and running.
2. Set the `DATABASE_URL` environment variable:
   ```cmd
   set DATABASE_URL="postgresql://username:password@localhost:5432/teamtrack"
   ```
   *(Or you can define it directly in `backend/database.py`)*
3. Restart the backend.

The database is already pre-seeded with sample data.

## API List

- `GET /api/dashboard`: Returns aggregate stats and data for the Dashboard.
- `GET /api/projects`: Returns all projects.
- `GET /api/projects/{id}`: Returns project details.
- `POST /api/projects`: Creates a new project.
- `PUT /api/projects/{id}`: Updates a project.
- `GET /api/tasks`: Returns all tasks.
- `GET /api/tasks/{id}`: Returns task details.
- `POST /api/tasks`: Creates a new task.
- `PUT /api/tasks/{id}`: Updates a task status/details.
- `GET /api/team`: Returns the team list with assigned work summaries.
- `GET /api/activity`: Returns the chronological activity feed.

## What Has Been Implemented

- Complete backend using FastAPI with database models for Projects, Tasks, Users, and Activities.
- Modular React + Vite frontend with Tailwind styling.
- Interactive **Dashboard** displaying summaries, progress bars, and recent activity.
- **Projects** page summarizing project progress.
- **Tasks** page allowing inline status updates (TODO, IN_PROGRESS, BLOCKED, COMPLETED).
- **Team** page detailing user roles and current active assignments.
- **Activity Feed** logging the system's history.
- Proper fallback to SQLite for immediate execution without additional DB installations.

## Remaining Limitations

- Project and task creation forms/modals are not fully built out on the frontend yet (API endpoints exist).
- User authentication and login are mocked (there is no real login step yet).
- Filtering/sorting in the frontend tables is rudimentary.
- Error handling in the UI could be improved with Toast notifications.
