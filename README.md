# LifeConnect – Medical Emergency Help Platform

LifeConnect is a portfolio-grade full-stack emergency coordination platform connecting patients, hospitals and ambulances around a one-tap SOS flow. The implementation follows the supplied specification: React/Vite/Tailwind on the client, Node/Express/MongoDB/Mongoose/JWT/Socket.IO on the server, geospatial hospital search, configurable hospital ranking, Dijkstra routing, RBAC, seed data, security middleware, testing and deployment configuration. fileciteturn0file0L5-L9

## Architecture

- `client/`: React + Vite + Tailwind, role-aware dashboards, Leaflet map, Socket.IO client.
- `server/`: Express REST API, MongoDB/Mongoose models, auth/RBAC, SOS orchestration, ranking, geospatial search, Dijkstra, Socket.IO events.
- `server/src/services/emergencyService.js`: end-to-end SOS workflow.
- `server/src/algorithms/dijkstra.js`: binary-heap shortest path implementation.

## Core flow

Patient registers → completes medical profile → enables location → presses SOS → emergency record is persisted → nearby hospitals are found and ranked → hospitals receive Socket.IO notification → hospital accepts → ambulance is assigned → ambulance location/status updates are broadcast → patient sees the active case → delivery/completion closes the incident and history is retained. This mirrors the requested acceptance flow. fileciteturn0file0L1360-L1403

## Tech stack

React, Vite, Tailwind CSS, React Router, Axios, TanStack Query, Socket.IO client, Leaflet/OpenStreetMap, Recharts, Lucide React; Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Socket.IO, REST, RBAC; ESLint, Prettier, dotenv and environment configuration. fileciteturn0file0L13-L52

## Requirements

- Node.js 20+
- MongoDB 6+ or MongoDB Atlas

## Install

```bash
npm install
cp .env.example server/.env
npm --workspace client install
npm --workspace server install
npm run seed
npm run dev
```

Open `http://localhost:5173`.

## Environment

Copy the values from `.env.example` into `server/.env`. Never commit secrets. The client uses `VITE_API_URL` and `VITE_SOCKET_URL` when supplied, otherwise it falls back to `http://localhost:5000/api` and `http://localhost:5000`.

## Demo accounts

All demo passwords are `Demo@12345` and are for development only.

The seed script creates **360 synthetic hospitals** distributed across Gorakhpur and nearby Uttar Pradesh areas, with randomized coordinates, beds, ICU/oxygen status, blood-bank inventory, departments, services, ratings and emergency availability. These hospital records are clearly synthetic demo data and are not verified real-world hospital information. It also creates 30 demo ambulances across the first 30 seeded hospitals.

- Patient: `patient1@lifeconnect.demo`
- Hospital: `hospital1@lifeconnect.demo`
- Ambulance: `ambulance1@lifeconnect.demo`
- Admin: `admin@lifeconnect.demo`

## API documentation

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Patient
- `GET /api/patients/profile`
- `PUT /api/patients/profile`
- `POST /api/patients/emergency-contact`
- `GET /api/patients/emergency-history`

### Emergencies
- `POST /api/emergencies/sos`
- `GET /api/emergencies/:id`
- `POST /api/emergencies/:id/accept`
- `POST /api/emergencies/:id/cancel`
- `PATCH /api/emergencies/:id/status`

### Hospitals
- `GET /api/hospitals`
- `GET /api/hospitals/nearby?lat=...&lng=...&radius=...`
- `GET /api/hospitals/:id`
- `POST /api/hospitals`
- `PUT /api/hospitals/:id/resources`

### Ambulances
- `GET /api/ambulances`
- `POST /api/ambulances`
- `PUT /api/ambulances/:id`
- `PATCH /api/ambulances/:id/location`
- `PATCH /api/ambulances/:id/status`
- `POST /api/ambulances/:id/simulate`

## Geospatial search

Hospitals store a GeoJSON `Point` and a `2dsphere` index. Nearby searches use `$near`, while emergency orchestration ranks candidates using Haversine distance plus availability/resource/capability factors. These are distinct from road travel distance, as required by the supplied specification. fileciteturn0file0L357-L381 fileciteturn0file0L941-L969

## Dijkstra

`server/src/algorithms/dijkstra.js` uses a binary min-heap and returns distances and previous nodes. `reconstructPath` rebuilds the route. With a binary heap the implementation is `O((V + E) log V)`. fileciteturn0file0L1104-L1143

The demo routing layer uses a configurable synthetic graph built from emergency/hospital points; it is explicitly treated as a routing-demo abstraction, not live road-network data. Replace it with OpenStreetMap/OSRM/GraphHopper routing for production road ETAs.

## Socket.IO events

- `emergency:created`
- `emergency:hospital-notified`
- `emergency:accepted`
- `ambulance:assigned`
- `ambulance:location-update`
- `emergency:status-update`
- `emergency:completed`

The client joins role/user/emergency rooms and updates dashboards without page refresh. fileciteturn0file0L504-L525

## Security

Helmet, CORS allow-listing, rate limiting, bcrypt hashing, JWT verification, role middleware, request validation, sanitized error responses and authorization checks are included. Hospital access to patient details is limited to active emergency participation; patient endpoints only access the authenticated patient's records. fileciteturn0file0L828-L849

## Testing

```bash
npm test
```

Tests cover Dijkstra, authentication/registration, RBAC and key emergency service behavior with a test-friendly architecture.

## Deployment

### Frontend

Deploy `client/` to Vercel or Netlify. Set `VITE_API_URL` and `VITE_SOCKET_URL`.

### Backend

Deploy `server/` to Render, Railway or AWS. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` and `CORS_ORIGINS`.

### MongoDB

Use MongoDB Atlas in production and configure network access appropriately.

## Future improvements

Real road routing/traffic via OSRM or GraphHopper, push/SMS integrations, WebRTC handoff, hospital verification workflow, audit-log retention policies and an explicit consent/clinical-governance layer.
