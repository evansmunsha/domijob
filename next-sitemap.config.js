/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://domijob.vercel.app',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  generateIndexSitemap: true,
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    }
  },verbose: true,
}

