# 🎨 ThinkCanvas — Real-Time Collaborative Whiteboard

ThinkCanvas is a real-time collaborative whiteboard platform that enables multiple users to draw, discuss, and collaborate simultaneously on a shared canvas.
It integrates live drawing synchronization, chat, and secure Google authentication for seamless online collaboration.

---

## 🌐 Live Application

**Frontend:** https://think-canvas-app.onrender.com
**Backend API:** https://think-canvas-core.onrender.com

---

# ✨ Features

* 🧑‍🤝‍🧑 Real-time multi-user whiteboard collaboration
* ✏️ Live drawing synchronization using WebSockets
* 💬 Real-time chat between participants
* 🔐 Google OAuth authentication
* 🖼️ Shared canvas sessions
* ⚡ Instant updates without page refresh
* 📱 Cross-device browser support

---

# 🏗️ Tech Stack

## Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* React.js
* Tailwind CSS
* Socket.io Client

## Backend

* Node.js
* Express.js
* REST API
* Socket.io
* Passport.js (Google OAuth)

## Database

* MongoDB Atlas

## Deployment

* Frontend: Render Static Site
* Backend: Render Web Service

---

# 📂 Project Structure

```
THINK-CANVAS-MAIN
│
├── client/                # React frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                # Node + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── socket/
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

# 🔐 Environment Variables

## Backend (`server/.env`)

```
MONGO_URI=your_mongodb_connection
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
SESSION_SECRET=your_session_secret
CLIENT_URL=http://localhost:3000
```

## Frontend (Render Environment)

```
REACT_APP_API_URL=https://think-canvas-core.onrender.com/api
REACT_APP_SOCKET_URL=https://think-canvas-core.onrender.com
```

---

# 🧪 Run Locally

## 1️⃣ Clone Repository

```
git clone https://github.com/your-username/THINK-CANVAS-MAIN.git
cd THINK-CANVAS-MAIN
```

## 2️⃣ Install Dependencies

```
cd server
npm install

cd ../client
npm install
```

## 3️⃣ Start Backend

```
cd server
npm run dev
```

## 4️⃣ Start Frontend

```
cd client
npm start
```

App runs at:

```
http://localhost:3000
```

---

# 🔑 Google OAuth Configuration

Add in Google Cloud Console:

## Authorized JavaScript Origins

```
http://localhost:3000
https://think-canvas-app.onrender.com
```

## Authorized Redirect URIs

```
http://localhost:5000/api/auth/google/callback
https://think-canvas-core.onrender.com/api/auth/google/callback
```

---

# 🎯 Use Cases

* Online classrooms
* Group study sessions
* Brainstorming boards
* Remote collaboration
* Teaching & tutoring

---

# 🚀 Future Enhancements

* Sticky notes / task board
* Mind-map mode
* Export canvas as PDF
* Presenter mode
* AI diagram cleanup

---

# 📜 License
This project is created for educational and portfolio purposes.

This project is created for educational and portfolio purposes.
