import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/vendor/', '/login'], // Private pages block kar diye
    },
    sitemap: 'https://indiatouroperators.com/sitemap.xml',
  }
}