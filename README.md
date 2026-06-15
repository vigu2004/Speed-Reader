# Speed Reader

A minimalist RSVP (Rapid Serial Visual Presentation) book reader. Displays one word at a time at high speed — no distractions, just reading.

## Features

- **One word at a time** — large, centered text on a dark background
- **Tunable speed** — 50 to 1500 WPM via slider or keyboard
- **File support** — `.txt`, `.epub`, and `.pdf`
- **Smart chapter detection** — auto-skips preface, TOC, and frontmatter; jumps straight to Chapter 1
- **Chapter navigation** — skip between chapters with prev/next controls
- **Keyboard shortcuts** — Space (play/pause), Arrow Up/Down (speed), Arrow Left/Right (word step)
- **Progress bar** — thin top bar showing reading position
- **Dark mode** — easy on the eyes, always

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and drop a book file to start reading.

## Stack

React + Vite
