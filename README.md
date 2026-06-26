# User Profile Management System

A clean, modern, and responsive User Profile Management System built with the MERN/MEVN stack (without the front-end framework, using static HTML/CSS/JS for ease of deployment).

## Features
- **User Authentication**: Register and login with secure password hashing (bcryptjs) and JWT session tokens.
- **View Profile Details**: Displays profile picture, full name, email, phone number, and professional bio.
- **Edit Profile**: Inline editing of user details with frontend and backend input validation.
- **Profile Image Upload**: Drag-and-drop or file click upload for custom profile photos (saved locally to `uploads/`).
- **Instant UI Updates**: Save profile updates and witness changes instantly without reloading.
- **Sleek Glassmorphic Design**: Curated dark-mode UI with smooth micro-animations.

## Technology Stack
- **Frontend**: HTML5, CSS3 (Vanilla Custom Properties & Transitions), JavaScript (ES6 Fetch APIs)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM)
- **File Upload**: Multer

---

## Setup & Running Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB Server** (Running locally on default port 27017, or a remote MongoDB Atlas connection string)

### 2. Installation
Install the project dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create or configure the `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/user-profile-db
JWT_SECRET=userprofilemanagementsystem_secret_key_2026
```

### 4. Running the Application
To start the backend server (which also hosts the static frontend):
```bash
npm start
```
The server will run on `http://localhost:5000`. Open this URL in your web browser to access the app.

---

## API Documentation

### Authentication Routes
- **`POST /api/auth/register`** - Register a new user.
  - Body: `{ username, email, password }`
- **`POST /api/auth/login`** - Log in and obtain a JWT.
  - Body: `{ email, password }`
- **`GET /api/auth/me`** - Retrieve the current user's profile state (Protected).

### Profile Routes
- **`PUT /api/profile/update`** - Update profile details (Protected).
  - Body: `{ name, email, phone, bio }`
- **`POST /api/profile/upload-image`** - Upload a new profile picture (Protected).
  - Body: Multipart Form-Data (Field name: `image`)
