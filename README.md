# AI Video Director (Next.js)

A simple web app that turns a written video idea into a structured, cinematic shot list with ready‑to‑use prompts for image and video generation tools.

## Features

- **Idea input**: Paste or type any video concept or scene description.
- **Style selector**: Choose from cinematic, fantasy, dark, or realistic looks.
- **Shot plan generation**: Creates a short sequence of shots with:
  - Shot type
  - Camera movement
  - Lighting description
  - Image prompt
  - Video prompt

All prompts are plain text – no external APIs are required.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the development server**

   ```bash
   npm run dev
   ```

3. **Open the app**

   Visit `http://localhost:3000` in your browser.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: React with custom CSS for a clean, modern interface

You can freely adapt the prompt templates or add real AI backends later (e.g., OpenAI, Stability, etc.) – the UI and shot structure are already in place.

