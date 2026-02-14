# Super Admin Dashboard

A modern, black and white themed super admin dashboard built with React, TypeScript, Vite, Tailwind CSS, and TanStack Query.

## Features

- 🔐 **Authentication**: Secure login system for super admins
- 📊 **Dashboard**: Overview statistics for users, clerks, clients, print jobs, and support tickets
- 👥 **User Management**: View, edit, and manage admin users
- 🧑‍💼 **Clerk Management**: View all clerks across all admins
- 👤 **Client Management**: View and manage all clients
- 🎫 **Support Tickets**: View, respond to, and manage support tickets
- 🎨 **Modern UI**: Clean black and white design with no shadows
- ⚡ **Optimized**: Built with TanStack Query for efficient data fetching
- 🔔 **Notifications**: Toast notifications for user feedback
- 📱 **Responsive**: Works on all screen sizes

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **React Router** - Routing
- **React Hot Toast** - Toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
yarn build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout.tsx
│   ├── LoadingSpinner.tsx
│   └── ProtectedRoute.tsx
├── config/          # Configuration files
│   └── api.ts      # Axios instance configuration
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── pages/           # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Users.tsx
│   ├── Clerks.tsx
│   ├── Clients.tsx
│   └── Support.tsx
├── services/        # API service functions
│   └── superAdminService.ts
└── types/          # TypeScript type definitions
    └── index.ts
```

## API Endpoints

The application uses the following API endpoints:

### Authentication
- `POST /api/superadmin/login` - Login
- `POST /api/superadmin/register` - Register (if needed)

### Dashboard
- `GET /api/superadmin/stats` - Get dashboard statistics

### Users
- `GET /api/superadmin/users` - Get all users
- `GET /api/superadmin/users/:id` - Get user by ID
- `PUT /api/superadmin/users/:id` - Update user
- `DELETE /api/superadmin/users/:id` - Deactivate user

### Clerks
- `GET /api/superadmin/clerks` - Get all clerks

### Clients
- `GET /api/superadmin/clients` - Get all clients

### Support Tickets
- `GET /api/superadmin/support` - Get all support tickets
- `GET /api/superadmin/support/:id` - Get ticket by ID
- `PUT /api/superadmin/support/:id` - Update ticket
- `DELETE /api/superadmin/support/:id` - Delete ticket

## Design Principles

- **Black and White Theme**: Clean, minimalist design using only black and white colors
- **No Shadows**: No box-shadow or text-shadow used throughout the application
- **Modular Components**: Reusable, well-organized components
- **Type Safety**: Full TypeScript coverage
- **Optimized Performance**: Efficient data fetching with TanStack Query

## License

Private project
"# printdecore-admin" 
