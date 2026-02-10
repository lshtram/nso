import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
        environment: 'node',
        reporters: ['json'],
        outputFile: '.agent/scratchpad/test-results.json',
        watch: false,
    },
});
