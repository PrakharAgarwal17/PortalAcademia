# PortalAcademia

> **Smart India Hackathon 2026 — Problem Statement 26044**
>
> An Academia-Industry Collaboration Portal bridging the gap between what institutions teach and what industry needs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | Vite · React 19 · TypeScript · Tailwind CSS v3 · shadcn/ui · Redux Toolkit |
| Server | Node.js · Express v5 · TypeScript · Mongoose |
| Database | MongoDB 7 (local via Docker or Atlas URI) |
| Auth | Cookie-based JWT (httpOnly) · OTP email verification via Nodemailer |

---

## Project Structure

```
PortalAcademia/
├── client/               # Vite + React SPA
│   ├── src/
│   │   ├── context/      # Redux store + authSlice
│   │   ├── components/ui/# shadcn/ui base components
│   │   ├── lib/          # cn() utility
│   │   └── pages/        # LandingPage, AuthPage, placeholders
│   ├── .env.example      # ← copy to .env and fill values
│   └── tailwind.config.js
│
├── server/               # Express API
│   ├── controllers/      # authController (SignIn, SignUp, VerifyOtp, checkAuth)
│   ├── routes/           # authRoute.ts
│   ├── models/           # userModel, profileModel
│   ├── config/           # connectDB.ts
│   └── .env.example      # ← copy to .env and fill values
│
└── docker-compose.yml    # Local MongoDB (gitignored — your machine only)
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **Docker Desktop** (for local MongoDB — no native install needed)

---

### 1. Clone the repo

```bash
git clone <repo-url>
cd PortalAcademia
```

---

### 2. Start MongoDB with Docker

```bash
# Start MongoDB container in the background
docker compose up -d

# Verify it's running
docker compose ps
```

> MongoDB will be available at `mongodb://root:rootpassword@localhost:27017`
>
> Data is persisted in a Docker volume (`portalacademia_mongo_data`) — it survives restarts.
> Run `docker compose down -v` to wipe it completely.

---

### 3. Configure the Server

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in:

```env
MONGO_URL=mongodb://root:rootpassword@localhost:27017
JWT_PASS_KEY=any_long_random_secret_string
EMAIL=your_gmail@gmail.com
PASSWORD=your_gmail_app_password   # Gmail App Password, NOT your login password
FRONTEND_URL=http://localhost:5173
```

> **Gmail App Password:** Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), create an App Password for "Mail", and paste it as `PASSWORD`.

Start the server:

```bash
npm install
npm run dev
# → Server running on http://localhost:3000
```

---

### 4. Configure the Client

```bash
cd client
cp .env.example .env
```

The default `.env` is already correct for local dev:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the client:

```bash
npm install
npm run dev
# → Client running on http://localhost:5173
```

---

## Auth Flow

```
Sign Up  →  OTP Email  →  /verifyotp  →  isOnboarded?
                                          ├─ false → /onboarding/select-type
                                          └─ true  → /dashboard

Sign In  →  Cookie set  →  isOnboarded?
                            ├─ false → /onboarding/select-type
                            └─ true  → /dashboard
```

All authentication uses **httpOnly cookies** — no token is stored in the browser or Redux state.

---

## API Reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup` | Register → sends OTP email |
| POST | `/api/auth/verifyotp` | Verify OTP → creates user, sets cookie |
| POST | `/api/auth/signin` | Login → sets cookie |
| POST | `/api/auth/SignOut` | Logout → clears cookie |
| POST | `/api/auth/checkAuth` | Validate session → returns user data |

---

## Stakeholders & Planned Features

| Role | Key Features |
|------|-------------|
| **Students** | Skill assessment, gap radar, learning paths, portfolio, resume builder, internship desk |
| **Faculty** | Industry exposure, FDP directory, collaboration board |
| **Recruiters** | Opportunity posting, applicant pipeline, AI compatibility scores |
| **Institution Admins** | Cohort analytics, roster management, credential verification queue |

---

## Roadmap (Future)

- 🔬 **AI Semantic Screener** — pgvector + cosine similarity candidate ranking
- 🔐 **Cryptographic Credentials** — SHA-256 tamper-proof on-chain verification
- 📡 **Curriculum Telemetry** — Automated institutional alerts for skill deficits

---

## License

MIT — Smart India Hackathon 2026
