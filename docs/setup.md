# Setup Guide

## Prerequisites
- Node.js 18.17 or later
- npm 9.0 or later
- A Supabase account
- A Google Cloud Platform account (for OAuth)
- A GitHub account (for OAuth)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a new project in Supabase
2. Enable Authentication providers:
   - Go to Authentication > Providers
   - Enable Email provider
   - Configure password requirements if needed
   - Enable Google provider and configure:
     - Create OAuth credentials in Google Cloud Console
     - Add authorized domains
     - Configure redirect URLs
   - Enable GitHub provider and configure:
     - Create OAuth App in GitHub
     - Add authorized domains
     - Configure redirect URLs

3. Google OAuth Setup:
   a. Go to [Google Cloud Console](https://console.cloud.google.com)
   b. Create a new project or select existing one
   c. Enable Google+ API
   d. Go to Credentials > Create Credentials > OAuth Client ID
   e. Configure OAuth consent screen:
      - Add application name
      - Add authorized domains
      - Add scopes (email, profile)
   f. Create OAuth 2.0 Client ID:
      - Application type: Web application
      - Add authorized JavaScript origins:
        - `http://localhost:3000` (development)
        - Your production domain
      - Add authorized redirect URIs:
        - `http://localhost:3000/auth/callback` (development)
        - `https://your-domain.com/auth/callback` (production)
   g. Copy Client ID and Client Secret
   h. In Supabase Dashboard:
      - Go to Authentication > Providers > Google
      - Enable Google provider
      - Paste Client ID and Client Secret
      - Save changes

4. GitHub OAuth Setup:
   a. Go to [GitHub Developer Settings](https://github.com/settings/developers)
   b. Click "New OAuth App"
   c. Fill in the application details:
      - Application name: Your app name
      - Homepage URL: Your app URL
      - Authorization callback URL:
        - `http://localhost:3000/auth/callback` (development)
        - `https://your-domain.com/auth/callback` (production)
   d. Register the application
   e. Copy Client ID and generate Client Secret
   f. In Supabase Dashboard:
      - Go to Authentication > Providers > GitHub
      - Enable GitHub provider
      - Paste Client ID and Client Secret
      - Save changes

5. Set up database tables:
   - Create a `lenses` table for user data
   - Set up appropriate RLS policies

6. Get your project credentials:
   - Go to Project Settings > API
   - Copy the URL and anon key to your `.env.local` file

## Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Variables
- `NEXT_PUBLIC_SITE_URL`: Your site's URL (for production)
- `NEXT_PUBLIC_APP_NAME`: Your application name

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/            # React components
│   └── lib/                   # Utility functions
├── public/                    # Static assets
├── docs/                      # Documentation
└── .env.local                 # Environment variables
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase project settings
   - Verify environment variables
   - Check browser console for errors

2. **Build Errors**
   - Clear `.next` directory
   - Run `npm install` again
   - Check for TypeScript errors

3. **Runtime Errors**
   - Check browser console
   - Verify Supabase connection
   - Check environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 