# Contributing to Symax Governance

Welcome to the Symax Governance Dashboard! This platform uses Next.js 14 and Supabase.

## Developer Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` using the `.env.local.example` structure.
   You will need a Supabase project URL and Anon Key.

3. **Database Schema**
   All necessary tables, formulas, and triggers are compiled into `schema.sql`.
   To initialize from scratch, copy the contents of `schema.sql` into the Supabase SQL Editor and run it in a single batch.

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

## Key Architectural Notes
- **Authentication**: Registration is fully handled via a manual admin-approval process (`access_requests` table). The self-service `auth.signUp` endpoints are blocked.
- **Audit Logging**: Changes across all standard tables are captured via a PostgreSQL database trigger (`log_audit`) that accurately identifies the acting user email using JWT tokens (via `auth.jwt()`).
- **Route Security**: A `middleware.ts` runs on all edges to ensure only authenticated sessions can access `/sheets` or `/dashboard`.
