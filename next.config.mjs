/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  allowedDevOrigins: ['127.0.0.1:3000', '127.0.0.1:3001', '127.0.0.1:3002', '127.0.0.1:59305', '127.0.0.1:55409'],

  // שיפור ביצועים ב-dev mode
  reactStrictMode: true,

  // ביטול cache ב-development
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // דקה אחת במקום 15
    pagesBufferLength: 2, // רק 2 דפים ב-buffer במקום 5
  },

  // ניקוי cache אוטומטי ב-build - פתרון אגרסיבי
  generateBuildId: async () => {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // הוספת headers נגד cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // שיפור HMR
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // בדיקה כל שנייה
        aggregateTimeout: 300, // המתן 300ms לפני rebuild
        ignored: /node_modules/,
      }
    }
    return config
  },
};

export default nextConfig;
