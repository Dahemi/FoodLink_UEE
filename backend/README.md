# FoodLink Backend (Node + Express + MongoDB)

## Setup

1. Create `.env` in `backend/` with:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/foodlink
```

2. Install deps and run (from `backend/`):

```
npm install
npm run dev
```

API will run at `http://localhost:4000`.

## Endpoints
- GET `/health`
- GET `/api/tasks` — list tasks
- POST `/api/tasks` — create task
- GET `/api/tasks/:id` — get one
- PATCH `/api/tasks/:id/status` — update status
- PATCH `/api/tasks/:id/reschedule` — update pickup/delivery time
- GET `/api/stats` — computed volunteer stats

## Notes
- Uses Mongoose models and Zod validation.
- Add auth later (JWT) and role-based access.


