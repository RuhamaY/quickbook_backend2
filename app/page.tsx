import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">QuickBooks Online API</h1>
      <p className="text-xl text-gray-600 mb-8">
        API for integrating with QuickBooks Online
      </p>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">API Documentation</h2>
          <p className="text-gray-600 mb-4">
            Interactive Swagger documentation for all API endpoints
          </p>
          <Link
            href="/api-docs"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View API Docs
          </Link>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">Quick Links</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <Link href="/api/health" className="text-blue-600 hover:underline">
                Health Check
              </Link>
            </li>
            <li>
              <Link href="/api/auth/start" className="text-blue-600 hover:underline">
                Start OAuth Flow
              </Link>
            </li>
            <li>
              <Link href="/api/auth/tokens" className="text-blue-600 hover:underline">
                View Tokens
              </Link>
            </li>
            <li>
              <Link href="/api/companyinfo" className="text-blue-600 hover:underline">
                Company Info
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

