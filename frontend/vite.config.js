import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

// Allow JSX syntax inside existing .js source files (CRA convention) under Vite 8 / Rolldown.
function jsAsJsxPlugin() {
  let resolvedConfig;
  return {
    name: 'treat-js-files-as-jsx',
    enforce: 'pre',
    configResolved(config) {
      resolvedConfig = config;
    },
    async transform(code, id) {
      const cleanId = id.split('?')[0].replace(/\\/g, '/');
      if (!/\/src\/.*\.js$/.test(cleanId)) {
        return null;
      }
      const isServe = resolvedConfig.command === 'serve' && resolvedConfig.mode !== 'test';
      const isClient = this.environment?.config?.consumer === 'client';
      const result = await transformWithOxc(code, id, {
        lang: 'jsx',
        jsx: {
          runtime: 'automatic',
          development: isServe,
          refresh: isServe && isClient,
        },
      });
      return {
        code: result.code,
        map: result.map,
        moduleType: 'js',
      };
    },
  };
}

export default defineConfig({
  plugins: [
    jsAsJsxPlugin(),
    react({
      include: /\.(js|jsx|ts|tsx)$/,
    }),
  ],
  envPrefix: ['VITE_', 'REACT_APP_'],
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
