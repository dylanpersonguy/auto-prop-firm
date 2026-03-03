/**
 * Global test setup — runs before all test files.
 */

// Ensure consistent JWT secret for tests
process.env.PROPSIM_SHELL_JWT_SECRET = 'test_jwt_secret_for_vitest';
process.env.PROPSIM_BASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_PROPSIM_BASE_URL = 'http://localhost:3000';
process.env.PROPSIM_API_KEY = 'test_api_key';
process.env.ADMIN_JWT_SECRET = 'test_admin_secret';
process.env.ADMIN_PASSWORD = 'test_admin_pass';
process.env.NODE_ENV = 'test';
