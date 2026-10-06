# SigmaGPT - Full-Stack AI Chat Application

A modern, full-featured AI chat application built with React, Node.js, Express, MongoDB Atlas, and Google Gemini AI API. Designed with ChatGPT dark-mode aesthetics, real-time token streaming, multi-turn conversational history, thread pinning, renaming, chat deletion, and user authentication with guest trial limits.

---

## ✨ Features

- ⚡ **Real-Time Token Streaming**: Real-time response streaming via Server-Sent Events (SSE).
- 🧠 **Multi-Turn Chat History**: Full conversational context preserved across messages.
- 🎨 **ChatGPT UI / UX**:
  - Dark-mode layout (`#171717` & `#212121`).
  - Markdown rendering with code syntax highlighting & copy-to-clipboard buttons.
  - Pinned threads section & Recents thread sorting by latest activity.
  - 3-Dots dropdown menu for instant Rename, Pin/Unpin, and Delete.
  - Smooth search history filter.
- 🔐 **Authentication & Guest Trial System**:
  - 5-Minute free trial for guest users.
  - JWT Authentication (Signup & Login) with `bcryptjs` password hashing.
  - Dynamic user profile card with user initials avatar and profile popover menu.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Vanilla CSS, FontAwesome, React Markdown, Rehype Highlight.
- **Backend**: Node.js, Express.js, MongoDB Atlas (Mongoose), JWT, BcryptJS.
- **AI Model**: Google Gemini API (`gemini-2.5-flash`).

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/avinashsingh88161-sudo/ai-chat-application.git
cd ai-chat-application
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
```

Start the backend server:
```bash
npm run dev
```
Backend runs on `http://localhost:8080`.

---

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
