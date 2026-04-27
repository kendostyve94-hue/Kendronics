const path = require('path');

module.exports = {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, 'apps/web/tailwind.config.ts'),
    },
    autoprefixer: {},
  },
};
