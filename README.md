# CourtConnect — Digital Court Case Management System

CourtConnect is a modern digital platform designed to digitize, streamline, and accelerate the judicial process. It connects Citizens, Lawyers, Judges, and Admins into a cohesive real-time ecosystem featuring secure docket filing, live discussion portals, WebRTC virtual courtroom trials, and a Gemini-powered AI Legal Chamber.

---

## 🌟 Core Features

### 🏛️ 1. Multi-Role Portals
- **Citizen Portal**: File new petitions, track lawsuits, upload identity/evidence documentation, and review/confirm scheduled trial dates and courtroom locations.
- **Advocate Panel**: Browse unassigned citizen petitions seeking representation, accept cases, upload evidence folders, E-Sign documents, and file petitions to the Judge.
- **Judge Chamber**: View assigned docket, presiding over new cases, schedule trial hearings, review evidentiary files, and draft/sign final judgments.
- **Admin Dashboard**: Oversee user registrations, analyze court performance metrics, and review system audit logs.

### 🤖 2. Gemini AI Legal Chamber
- Powered by **Gemini 1.5 Flash** using dynamic contextual prompts.
- **Executive Summaries**: Instantly analyzes case facts to generate legal summaries, highlight core disputes, and suggest relevant sections of Indian law.
- **Precedent Locator**: Recommends relevant Supreme/High Court landmark judgments based on the petition details.
- **Role-Tailored Counsel**: Interactive legal assistant chat that customizes answers to citizens (simplified FAQs), lawyers (precise drafts & citations), and judges (evidentiary overviews & bench guides).

### 📹 3. Virtual Courtroom Hearing Rooms
- 1-to-1 WebRTC audio/video hearing system utilizing Google STUN servers.
- Dynamic track handling prevents stream freezing on page re-renders.
- Built-in real-time bench chat and trial recording indicators.

### 💬 4. Live Case Discussion Rooms
- Dedicated Socket.IO chat rooms for each case, allowing real-time correspondence and legal coordination.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: React.js (Vite)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS & Vanilla CSS
- **Icons**: Lucide React
- **Router**: React Router DOM v6
- **Real-Time**: Socket.IO Client & WebRTC (RTCPeerConnection)

### Backend (Server)
- **Framework**: Node.js & Express
- **Database**: MongoDB (Mongoose ODM)
- **Real-Time**: Socket.IO
- **AI**: Gemini API Integration
- **Auth**: JWT (JSON Web Tokens) with Refresh Token cycle & BcryptJS encryption

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB instance

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/vamsivalluri-19/digital-court-management.git
   cd digital-court-management
   ```

2. **Configure Server Environment**:
   Create a `.env` file inside the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=development
   ```

3. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

4. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

---

## 🔒 Security & Compliance
- **Digital Signatures**: Base64 drawn signatures verified and timestamped on each evidentiary brief.
- **Access Control**: Role-based access control (RBAC) middleware verifying JWT tokens for API routes.
- **Audit Trails**: Mongoose-logged system actions tracking user modifications, logins, and court docket progressions.
