# AGI Hackathon Project

This repository contains a full-stack web application with a React frontend and a Python backend.

## Architecture

The project is divided into two main parts:

-   `frontend`: A modern web application built with React, Vite, and Tailwind CSS.
-   `backend`: A powerful API built with Python and FastAPI, featuring AI capabilities through LangChain and Ollama.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [pnpm](https://pnpm.io/)
-   [Python](https://www.python.org/) (3.11 or higher)
-   [uv](https://github.com/astral-sh/uv)

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    pnpm run dev
    ```

    The frontend will be available at `http://localhost:5173`.

### Backend Setup

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Create a virtual environment and install dependencies:**

    ```bash
    uv venv
    uv pip sync
    ```

3.  **Activate the virtual environment:**

    ```bash
    source .venv/bin/activate
    ```

4.  **Run the backend server:**

    ```bash
    uvicorn main:app --reload
    ```

    The backend API will be available at `http://localhost:8000`.

## Technologies Used

### Frontend

-   **Framework:** [React](https://reactjs.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
-   **Package Manager:** [pnpm](https://pnpm.io/)

### Backend

-   **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
-   **Language:** [Python](https://www.python.org/)
-   **AI:** [LangChain](https://www.langchain.com/), [Ollama](https://ollama.ai/)
-   **Package Manager:** [uv](https://github.com/astral-sh/uv)
