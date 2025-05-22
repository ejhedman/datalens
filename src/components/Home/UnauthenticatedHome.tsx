'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthenticatedHome() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to DataLens
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Your intelligent platform for data exploration, documentation, and insights
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/auth/signin">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Data Exploration</h3>
          <p className="text-gray-600">
            Explore your data sources with powerful visualization tools and intuitive interfaces
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Documentation</h3>
          <p className="text-gray-600">
            Create and maintain comprehensive documentation for your data assets
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Collaboration</h3>
          <p className="text-gray-600">
            Work together with your team to understand and leverage your data effectively
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Connect Your Data</h3>
            <p className="text-gray-600">
              Connect your data sources and start exploring your data
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Create Lenses</h3>
            <p className="text-gray-600">
              Create data lenses to focus on specific aspects of your data
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Share Insights</h3>
            <p className="text-gray-600">
              Share your insights and collaborate with your team
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 