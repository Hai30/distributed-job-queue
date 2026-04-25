# Distributed Job Queue System

## Requirements
- Node.js
- Docker

## Run

docker-compose up -d
npm install
npx prisma migrate dev
npm run dev
npm run worker

## API

POST /jobs
GET /jobs
GET /jobs/:id
POST /jobs/:id/retry
POST /jobs/:id/cancel
GET /health