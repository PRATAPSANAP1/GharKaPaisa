# GharKaPaisa

GharKaPaisa is a financial services management platform providing tools for lead processing, partner onboarding, and service management.

## Developer Documentation

For complete architectural details, module mapping, file locations, database schema, roles, and workflows, refer to the [Developer Guide](DEVELOPER_GUIDE.md).

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Zustand, CSS
- **Backend**: Node.js, Express.js, PostgreSQL
- **Integrations**: AWS S3, MSG91 SMS, Razorpay

## Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd yohesa
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run migrate
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## License

Private & Confidential. All rights reserved.
