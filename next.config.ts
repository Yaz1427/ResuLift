import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from MIME-sniffing the content type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking — pages can only be framed by same origin
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stop sending Referer header to external origins
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable XSS auditor (deprecated but harmless)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Force HTTPS for 1 year, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Only allow camera/mic/geo when explicitly requested
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  // Content-Security-Policy — tight policy for a SaaS app
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Vercel analytics
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com",
      // Styles: self + inline (required by Tailwind / shadcn)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + Supabase storage (avatars, resumes) + data URIs
      "img-src 'self' data: blob: https://*.supabase.co",
      // Fonts: self
      "font-src 'self'",
      // Connect: self + Supabase + Anthropic + Stripe + Resend
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.anthropic.com",
      // Frames: Stripe checkout only
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Block all objects (Flash, etc.)
      "object-src 'none'",
      // Worker: self + blob (PDF generation)
      "worker-src 'self' blob:",
      // Base URI restricted to self
      "base-uri 'self'",
      // Form submissions: self only
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'docx', 'pdf-lib'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
