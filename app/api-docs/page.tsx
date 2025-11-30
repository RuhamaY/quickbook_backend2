"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { swaggerSpec } from "@/lib/swagger";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(
  () => import("swagger-ui-react").then((mod) => {
    // Import CSS
    require("swagger-ui-react/swagger-ui.css");
    return mod.default;
  }),
  { ssr: false }
);

export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
        <p>Loading Swagger UI...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-2">QuickBooks Online API Documentation</h1>
        <p className="text-gray-600 mb-4">
          Interactive API documentation with Swagger UI. Try out the endpoints directly from this page.
        </p>
      </div>
      <SwaggerUI spec={swaggerSpec} />
    </div>
  );
}

