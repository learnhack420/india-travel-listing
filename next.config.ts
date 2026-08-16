import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  async redirects() {
    return [
      {
        // Purana URL pattern jo Google me index hai
        source: '/Tourism/:slug',
        
        // Naya URL pattern jahan user ko bhejna hai
        destination: '/tour/:slug',
        
        // permanent: true ka matlab 301 Redirect (SEO ke liye best)
        permanent: true,
      }
    ];
  },
};

export default nextConfig;