import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://newsystems.ca',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
