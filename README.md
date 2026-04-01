# Symax Governance Dashboard

Symax Corporate Governance and Control Dashboard. This project provides a comprehensive dashboard for streamlining and tracking corporate governance processes.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router format)
- **Database / Auth:** [Supabase](https://supabase.com/) (using `@supabase/ssr` for Server-Side Rendering)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)

## Getting Started

### Prerequisites

Ensure you have Node.js and NPM installed. 

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Symax-Governance
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and add your specific Supabase URL and Anon Key.
   
   ⚠️ **CRITICAL:** Do NOT commit your `.env.local` file. It is already safely ignored via `.gitignore` to prevent secret leaks.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## License

Private Repository. Copyright © Symax.
