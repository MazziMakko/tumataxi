# Tuma Taxi - Production Ready Platform

**Enterprise-grade ride-hailing platform for Mozambique with deterministic financial logic, multi-language support (EN/PT), and mobile-optimized design.**

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Architecture](#architecture)
- [Driver App Features](#driver-app-features)
- [Rulial Logic (Commission System)](#rulial-logic-commission-system)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Ride-Hailing
- ✅ Real-time driver location tracking
- ✅ Dynamic ride pricing with fair commission model
- ✅ Deterministic state machine (8 ride states)
- ✅ Driver tier system (BRONZE/SILVER/GOLD) with benefits
- ✅ Offline queue for network resilience

### Driver App (PART 3 - Missing Links)
- ✅ **Waiting Timer**: 5-minute countdown at pickup with automatic fee application (50 MZN)
- ✅ **SOS Shield**: Emergency button with location sharing, police call (119), audio recording
- ✅ **Sidebar Navigation**: Hamburger menu with Profile/Earnings/Settings tabs
- ✅ **Main Workflow**: Framer-motion state transitions with smooth animations
- ✅ **Language Support**: English/Portuguese toggle (stored in settings)
- ✅ **Animated Branding**: TumaTaxi logo with rotating animation

### Mozambique Localization
- **Currency**: All calculations in MZN (Mozambican Metical)
- **Timezone**: Africa/Maputo (CAT, UTC+2)
- **Languages**: Portuguese (pt) and English (en)
- **Network Optimization**: Optimized for 3G bandwidth (<5MB bundle)

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | 14.x |
| **UI Framework** | React | 18.2.0 |
| **State Management** | Zustand | 4.4.0 |
| **Animations** | Framer Motion | 10.16.0 |
| **Styling** | Tailwind CSS | 3.4.1 |
| **Database** | PostgreSQL | 14+ |
| **ORM** | Prisma | 5.x |
| **Language** | TypeScript | 5.x |
| **API** | Next.js API Routes | 14.x |

---

## 📂 Project Structure

```
tuma-taxi/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   └── api/
│   │       └── rides/
│   │           └── calculate-commission/route.ts
│   │
│   ├── components/             # React components
│   │   ├── DriverWorkflow.tsx  # Main orchestrator (8 states)
│   │   ├── DriverApp.tsx       # Top-level driver app
│   │   ├── DriverDashboard.tsx
│   │   ├── GoOnlineButton.tsx
│   │   ├── MapView.tsx
│   │   ├── RideRequestSheet.tsx
│   │   ├── HUD.tsx
│   │   ├── WaitingTimer.tsx    # Pickup countdown (PART 3)
│   │   ├── SOSShield.tsx       # Emergency button (PART 3)
│   │   ├── SidebarNavigation.tsx # Menu sidebar (PART 3)
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx  # Offline/Online view
│   │   │   ├── OfferScreen.tsx # Ride acceptance
│   │   │   ├── PickupScreen.tsx
│   │   │   ├── TripScreen.tsx
│   │   │   └── SummaryScreen.tsx
│   │   └── ui/
│   │       └── SlideToConfirm.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useNetworkStatus.ts
│   │   └── useServiceWorker.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── i18n.ts             # i18n system (EN/PT)
│   │   ├── audio.ts            # Web Audio API synthesis
│   │   ├── localization/
│   │   │   └── mozambique.ts   # MZN currency & locale
│   │   └── rulial/
│   │       ├── commission.ts   # Tier-based commission calculator
│   │       ├── ledger.ts       # Financial ledger
│   │       ├── examples.ts     # Example calculations
│   │       ├── utils.ts        # Helper utilities
│   │       └── index.ts
│   │
│   ├── store/
│   │   └── driverStore.ts      # Zustand store (state machine)
│   │
│   ├── services/
│   │   ├── h3HeatmapService.ts
│   │   └── notificationService.ts
│   │
│   ├── routes/
│   │   └── mapRoutes.ts
│   │
│   └── types/
│       └── index.ts            # TypeScript type definitions
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Service worker
│   └── tumataxi-logo.svg       # Animated logo
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System design
│   ├── DEPLOYMENT.md           # Production deployment
│   └── RULIAL_LOGIC.md         # Commission system details
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm 9+ or yarn
- PostgreSQL 14+
- Supabase account (or local PostgreSQL)

### Step 1: Clone & Install

```bash
git clone <repo-url>
cd tuma-taxi
npm install
```

### Step 2: Environment Setup

```bash
cp .env.example .env.local
```

**Edit `.env.local` with your values:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tuma_taxi"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
```

### Step 3: Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate -- --name init

# Seed database (optional)
npm run prisma:seed
```

### Step 4: Start Development

```bash
npm run dev
```

Access at: `http://localhost:3001` (port 3000 may be in use)

---

## 🏗️ Architecture

### State Machine (8 States)
```
OFFLINE → ONLINE → OFFER_RECEIVED → NAVIGATING_TO_PICKUP
              ↓                                  ↓
         [Waiting]                     ARRIVED_AT_PICKUP
                                              ↓
                                       RIDE_IN_PROGRESS
                                              ↓
                                    ARRIVED_AT_DESTINATION
                                              ↓
                                       TRIP_SUMMARY
                                              ↓
                                    [Returns to ONLINE]
```

### Component Hierarchy
```
DriverApp
└── DriverWorkflow (Orchestrator)
    ├── HomeScreen (OFFLINE/ONLINE)
    ├── OfferScreen (OFFER_RECEIVED)
    ├── PickupScreen (NAVIGATING_TO_PICKUP)
    ├── TripScreen (RIDE_IN_PROGRESS)
    ├── SummaryScreen (TRIP_SUMMARY)
    └── Overlays
        ├── SidebarNavigation (always visible)
        ├── WaitingTimer (ARRIVED_AT_PICKUP)
        └── SOSShield (RIDE_IN_PROGRESS/NAVIGATING_TO_PICKUP)
```

---

## 🎯 Driver App Features (PART 3)

### 1. Waiting Timer
- **Trigger**: Driver arrives at pickup location
- **Duration**: 5 minutes countdown
- **Fee**: 50 MZN automatically applied after 5 minutes
- **UI**: Progress bar (green→yellow→red), cancel button after timeout
- **Code**: `src/components/WaitingTimer.tsx` (163 lines)

### 2. SOS Shield
- **Trigger**: Driver taps SOS button during active ride
- **Features**:
  - Share real-time location with emergency contact
  - Call police (119) with one tap
  - Record audio for safety documentation
  - Pulsing red button animation
- **Code**: `src/components/SOSShield.tsx` (194 lines)

### 3. Sidebar Navigation
- **Access**: Hamburger menu (always accessible)
- **Tabs**:
  - **Profile**: Vehicle details, license, driver rating
  - **Earnings**: Weekly breakdown, total earnings, cash out
  - **Settings**: Notifications, night mode, emergency contacts, language
- **Code**: `src/components/SidebarNavigation.tsx` (392 lines)

### 4. Language Support
- **Languages**: Portuguese (pt) & English (en)
- **Toggle**: Flag button (🇵🇹/🇬🇧) in top-right
- **Persistence**: Saved in Zustand store with localStorage
- **Code**: `src/lib/i18n.ts` (comprehensive translations)

---

## 💰 Rulial Logic (Commission System)

### Tier Eligibility

| Tier | Criteria | Commission | Benefits |
|------|----------|-----------|----------|
| **BRONZE** | Default | 17% | Baseline platform access |
| **SILVER** | 50+ rides/week OR 4.8+ rating | 15% | 2% commission reduction |
| **GOLD** | 100+ rides/week OR 4.9+ rating | 12% | 5% reduction + instant payout access |

### Example Calculation

**Scenario: GOLD tier driver, 500 MZN ride**

```
Base Fare:            500 MZN
Driver Commission:    12% (GOLD tier)
Commission Amount:    60 MZN
Driver Payout:        440 MZN
```

**Code**: `src/lib/rulial/commission.ts`
```typescript
// Example usage
const commission = calculateCommission({
  driverId: 'driver-123',
  finalFareMZN: 500,
  metrics: {
    weeklyRidesCompleted: 120,
    rating: 4.92
  }
});
// Output: { commissionMZN: 60, appliedTier: 'GOLD', driverPayoutMZN: 440 }
```

---

## 📊 Database Models

### Core Tables

**User** (Drivers & Riders)
- `id`, `email`, `phone`, `role`, `createdAt`
- Authentication via Supabase or custom

**DriverProfile**
- `driverId`, `vehicleType`, `currentTier`, `weeklyRides`, `rating`
- `walletBalanceMZN`, `accountStatus`
- `locationLat`, `locationLon`, `lastSeen`

**Ride**
- `id`, `driverId`, `riderId`, `pickupLat`, `pickupLon`, `dropoffLat`, `dropoffLon`
- `baseFareMZN`, `finalFareMZN`, `status`
- `startedAt`, `completedAt`, `durationMin`, `distanceKm`

**RulialLedger** (Immutable Financial Ledger)
- `id`, `driverId`, `transactionType`, `amountMZN`
- `tierAtTime`, `commissionRate`, `hash` (SHA256)
- `createdAt` (immutable timestamp)

**Rating** (Driver Feedback)
- `id`, `driverId`, `riderId`, `score` (1-5), `feedback`
- `createdAt`

---

## 🔌 API Endpoints

### Commission Calculation
**POST** `/api/rides/calculate-commission`

**Request:**
```json
{
  "driverId": "driver-123",
  "finalFareMZN": 500,
  "metrics": {
    "weeklyRidesCompleted": 120,
    "rating": 4.92
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "finalFareMZN": "500",
    "commissionMZN": "60",
    "driverPayoutMZN": "440",
    "commissionRate": 12,
    "appliedTier": "GOLD",
    "reason": "Rating 4.92 >= 4.9",
    "instantPayoutEligible": true
  },
  "timestamp": "2026-01-31T10:00:00Z"
}
```

---

## 🌐 Deployment

See `DEPLOYMENT.md` for complete production deployment guide including:
- Docker containerization
- Nginx configuration
- SSL/TLS setup
- Database migration
- Health checks
- Monitoring & logging

**Quick Deploy to Ionos:**
```bash
./deploy-setup.sh
./deploy-ssl.sh
```

---

## 💻 Development

### Running Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Linting & Type Checking
```bash
npm run lint
npm run type-check
```

### Database Migrations
```bash
npm run prisma:migrate -- --name <migration-name>
npm run prisma:studio  # Visual database editor
```

### Development Tools
- **Next.js DevTools**: Integrated in dev mode
- **Zustand DevTools**: Browser extension for state debugging
- **Prisma Studio**: `npm run prisma:studio`
- **TypeScript**: Full type safety with strict mode

---

## 🐛 Troubleshooting

### Compilation Errors

**"Module '@prisma/client' not found"**
```bash
npm run prisma:generate
```

**TypeScript errors on startup**
```bash
npx tsc --noEmit
```

### Runtime Issues

**Port 3000 in use**
The app automatically falls back to port 3001. Check `next.config.js` for custom port configuration.

**Database connection failed**
- Verify `DATABASE_URL` in `.env.local`
- Check PostgreSQL is running
- Run migrations: `npm run prisma:migrate`

**Zustand state not persisting**
- Browser localStorage must be enabled
- Clear browser cache if issues persist
- Check browser DevTools → Application → Local Storage

---

## 📝 License

Proprietary - Tuma Taxi 2026

---

## ✅ Production Readiness Checklist

- ✅ TypeScript strict mode enabled
- ✅ State machine with 8 deterministic states
- ✅ Immutable financial ledger (SHA256 hashing)
- ✅ Offline queue support
- ✅ Multi-language (EN/PT) with full translations
- ✅ PWA manifest for installable app
- ✅ Service Worker for offline fallback
- ✅ Responsive design (mobile-first)
- ✅ Accessibility (WCAG 2.1)
- ✅ Performance optimized (<5MB bundle, 3G-friendly)
- ✅ Comprehensive error handling
- ✅ Security: Role-based access, input validation, SQL injection prevention

---

**Last Updated**: January 31, 2026
**Status**: 🟢 Production Ready
