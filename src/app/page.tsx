'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Database, FileText, Search } from 'lucide-react'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Data Warehouse Documentation
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Streamline your data warehouse documentation with our powerful tool. 
          Automatically generate, maintain, and share comprehensive documentation 
          for your database objects.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="text-lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 mb-4">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Database Documentation</h3>
          <p className="text-gray-600">
            Automatically generate comprehensive documentation for your database objects, 
            including tables, views, and stored procedures.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 mb-4">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">DDL Generation</h3>
          <p className="text-gray-600">
            Generate and export DDL scripts for your database objects, making it easy 
            to version control and share your database schema.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 mb-4">
            <Search className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
          <p className="text-gray-600">
            Quickly find and explore database objects with our powerful search functionality, 
            making documentation navigation a breeze.
          </p>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          How to Use
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div>
            <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
            <ol className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600">1.</span>
                Create an account or sign in to your existing account
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600">2.</span>
                Connect your database using the database selector
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600">3.</span>
                Browse and explore your database objects
              </li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Key Features</h3>
            <ul className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="font-semibold text-green-600">•</span>
                View detailed documentation for each database object
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-green-600">•</span>
                Generate and export DDL scripts
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-green-600">•</span>
                Search and filter database objects
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
