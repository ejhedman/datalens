# Database DataLens Management Application

## Overview
This is a modern web application built with Next.js that provides powerful database schema management and organization through the concept of "lenses". The application features secure authentication, database configuration management, and flexible schema organization capabilities.

## Key Features
- Database Configuration Management
- Schema Organization through DataLenses
- Secure Authentication
- JDBC Connection Support
- Multi-Database Support
- Responsive Design

## Table of Contents
- [Requirements](./requirements.md)
- [Architecture](./architecture.md)
- [Components](./components.md)
- [Authentication Flow](./auth-flow.md)
- [Setup Guide](./setup.md)

## Quick Start
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see [Setup Guide](./setup.md))
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack
- **Frontend Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: 
  - Supabase (application data)
  - JDBC support for connecting to external databases
- **Language**: TypeScript

## Core Concepts
- **DataSources**: Manage connection details for your databases
- **DataLenses**: Create custom views and organizations of your database schemas
- **Schema Organization**: Flexible tools for organizing and viewing database structures 