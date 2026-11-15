# StockPro Frontend (React + Vite)

Inventory & Sales Management System frontend built with React 19 and Vite.

## Available Scripts

In the `frontend` directory, you can run:

### `npm run dev` (or `npm start`)

Runs the app in development mode with Vite.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`

Builds the production bundle to the `build/` directory.

### `npm run preview`

Locally previews the production build from `build/`.

### `npm test`

Runs the Vitest test runner in watch mode (or use `npm run test:run` for a single run).

### `npm run lint`

Runs ESLint across the project.

## Environment Variables

Copy `.env.example` to `.env` and configure `VITE_API_URL` (existing `REACT_APP_API_URL` entries are also supported):

```env
VITE_API_URL=http://localhost:8000/api
```
