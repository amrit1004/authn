import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    AUTH0_SECRET: process.env.AUTH0_SECRET ? "✓ Set" : "✗ Missing",
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL || "✗ Missing",
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || "✗ Missing",
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? "✓ Set" : "✗ Missing",
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
    AUTH0_NAMESPACE: process.env.AUTH0_NAMESPACE || "✗ Missing",
  };

  return NextResponse.json(envVars, { status: 200 });
}

