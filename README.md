# N-Device Session Manager

A professional Next.js application with Auth0 authentication and Supabase backend that implements N-device concurrent session management (N=3).

## Features

- ✅ **Multi-Device Authentication**: Users can be logged in on up to 3 devices simultaneously
- ✅ **Device Management**: When the limit is reached, users can choose to force logout one of their active devices
- ✅ **Graceful Force Logout**: Devices that are force logged out receive a clear notification
- ✅ **Profile Management**: Collect and display user's full name and phone number
- ✅ **Professional UI**: Modern, polished interface with smooth animations and gradients
- ✅ **Session Monitoring**: Automatic polling to detect force logout events

## Tech Stack

- **Next.js 15** - React framework
- **Auth0** - Authentication provider
- **Supabase** - Database and backend services
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Prerequisites

- Node.js 18+ installed
- Auth0 account (free tier available)
- Supabase account (free tier available)

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `supabase-schema.sql`
3. Get your Supabase URL and Service Key from Settings > API

### 3. Set Up Auth0

1. Create a new Auth0 application (Regular Web Application)
2. Configure callback URLs: `http://localhost:3000/api/auth/callback`
3. Configure logout URLs: `http://localhost:3000`
4. Create an Auth0 Action to add `user_id` to the token:
   - Go to Actions > Flows > Login
   - Create a new Action with this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://your-app.com';
  api.idToken.setCustomClaim(`${namespace}/user_id`, event.user.user_id);
  api.accessToken.setCustomClaim(`${namespace}/user_id`, event.user.user_id);
};
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Auth0 Configuration
AUTH0_SECRET='use [openssl rand -hex 32] to generate'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_NAMESPACE='https://your-app.com'

# Supabase Configuration
SUPABASE_URL='https://your-project.supabase.co'
SUPABASE_SERVICE_KEY='your-service-role-key'

# Device Limit Configuration
MAX_CONCURRENT_DEVICES=3
NEXT_PUBLIC_MAX_CONCURRENT_DEVICES=3
```

### 5. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── api/
│   ├── auth/[...auth0]/     # Auth0 authentication handlers
│   ├── devices/              # Device management APIs
│   │   ├── check-status/     # Check if device is still active
│   │   ├── list/             # List active devices
│   │   └── swap/             # Swap devices (force logout one, add new)
│   ├── logout/               # Custom logout with device cleanup
│   └── user/                 # User profile APIs
│       ├── profile/          # Get user profile
│       └── update-profile/   # Update user profile
├── components/               # React components
│   ├── ClientWrapper.tsx     # Wrapper with session checking
│   ├── ForceLogoutModal.tsx # Modal for force logout notification
│   ├── Header.tsx           # Navigation header
│   ├── Providers.tsx        # Auth0 provider wrapper
│   └── UseSessionCheck.tsx  # Hook for session monitoring
├── complete-profile/         # Profile completion page
├── manage-devices/           # Device management page
├── private/                  # Private dashboard page
└── public/                  # Public page
```

## How It Works

### Device Limit Enforcement

1. When a user logs in, the system checks how many active devices they have
2. If less than 3 devices are active, the new device is added
3. If 3 devices are already active, the user is redirected to the device management page
4. The user can choose to force logout one of their active devices to make room

### Force Logout Detection

- Active devices poll the server every 10 seconds to check if they're still active
- If a device is force logged out, it's removed from the `active_devices` table
- The polling detects this and shows a graceful logout modal
- After 5 seconds, the user is automatically redirected to the login page

### Session Management

- Each device gets a unique `device_id` stored in the session
- The `active_devices` table tracks all active sessions
- On logout, the device is removed from the table

## Database Schema

### `profiles` Table
- `user_id` (TEXT, UNIQUE) - Auth0 user ID
- `full_name` (TEXT) - User's full name
- `phone_number` (TEXT) - User's phone number
- `created_at`, `updated_at` - Timestamps

### `active_devices` Table
- `user_id` (TEXT) - Auth0 user ID
- `device_id` (TEXT, UNIQUE) - Unique device identifier
- `user_agent` (TEXT) - Browser/user agent string
- `ip` (TEXT) - IP address
- `logged_in_at` (TIMESTAMPTZ) - Login timestamp

## API Endpoints

- `GET /api/auth/login` - Initiate Auth0 login
- `GET /api/logout` - Custom logout (cleans up device)
- `GET /api/devices/check-status` - Check if current device is active
- `GET /api/devices/list` - List all active devices for user
- `POST /api/devices/swap` - Swap devices (logout one, add new)
- `GET /api/user/profile` - Get user profile
- `POST /api/user/update-profile` - Update user profile

## Notes

- All services used (Auth0, Supabase) offer free tiers with no charges
- The device limit is configured to N=3 as specified
- The UI is designed to be professional and polished with modern design patterns

## License

MIT
