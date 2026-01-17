import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/content/**/*.{ts,tsx}',
        'src/sidepanel/hooks/**/*.{ts,tsx}',
        'src/shared/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/__tests__/**',
        'dist/',
      ],
      all: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
