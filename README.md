# FocusFlow — Smart Productivity Dashboard

FocusFlow is a lightweight productivity dashboard built with HTML, CSS, and vanilla JavaScript. It helps users manage tasks, track progress, and stay organized using a simple local dashboard that works directly in the browser.

## Overview

This project was created for a frontend web development internship application. The goal is to show clean structure, practical JavaScript logic, and good UI/UX habits without depending on frameworks or build tools.

## Features

- Responsive dashboard with sidebar navigation and mobile-friendly layout
- Add, edit, delete, and complete tasks
- Task fields for title, priority, deadline, and completion status
- Search and filter by status and priority
- Auto-updating dashboard statistics
- Progress bar and overdue highlighting
- Persistent data using browser localStorage
- Form validation and accessible labels
- Empty states for no tasks or no matching results
- Seed sample tasks on first launch without overwriting existing user data
- Confirmation before destructive actions

## Project structure

```text
FocusFlow/
├── index.html
├── README.md
├── .gitignore
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── storage.js
└── .vscode/ (optional local editor settings, not required)
```

## How to run locally

1. Open the project folder in VS Code.
2. Start a simple local web server from the project root:

```bash
cd path/to/FocusFlow
python -m http.server 8000
```

3. Open http://localhost:8000 in your browser.

## Architecture notes

The application follows a simple separation of concerns:

- HTML defines the page structure and form elements.
- CSS handles layout, color scheme, responsiveness, and states such as overdue tasks.
- JavaScript manages the task state, user interactions, filtering, rendering, and browser storage.

This is beginner-friendly because the logic is organized into reusable functions such as render, filter, and validation instead of putting everything into one large script.

## Testing steps

Use the browser manually to test the following:

1. Add a new task with valid input.
2. Try submitting an empty title or missing deadline to confirm validation.
3. Edit an existing task and save the changes.
4. Mark a task complete and confirm the completion count updates.
5. Search for a task title and use the status and priority filters.
6. Refresh the page and confirm tasks still exist.
7. Confirm the overdue badge appears for past-due tasks.
8. Delete a task and confirm the confirmation popup appears.
9. Load the app on a narrow screen to test the mobile sidebar.

## Known limitations

- This is a frontend-only project and does not include a backend or multi-user sync.
- Data is stored in the browser localStorage, so it is local to that device and browser.
- The app is designed for a static hosting environment and does not require a build step.

## Git and GitHub setup

Initialize Git in the project folder:

```bash
git init
git add .
git commit -m "Initial commit: FocusFlow dashboard"
```

Then create a GitHub repository and push the project:

```bash
git remote add origin <your-repository-url>
git branch -M main
git push -u origin main
```

## Optional static hosting

This project is ready for static hosting platforms such as GitHub Pages or Netlify. For GitHub Pages, push the project to a repository and enable Pages from the main branch.

## Notes for an interview

The most important things to explain are:

- how localStorage keeps task data across refreshes,
- how the app separates HTML, CSS, and JavaScript,
- how rendering and filtering work together without a framework,
- and why the code is structured into small functions for readability and easier debugging.
