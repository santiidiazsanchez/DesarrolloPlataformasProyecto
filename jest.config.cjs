// Tres grupos de pruebas con Jest:
// - backend: reglas del negocio sin base de datos (npm test).
// - frontend: servicios del cliente React; Babel convierte sus módulos ES (npm test).
// - api: integración con MySQL de pruebas en Docker (npm run test:api).
// Los scripts usan --experimental-vm-modules porque sanitize-html depende de htmlparser2, que solo se publica como ESM.
const babel = ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }];

module.exports = {
  verbose: true,
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/tests/unit/**/*.test.js'],
      setupFiles: ['<rootDir>/backend/tests/unit/entorno.js'],
    },
    {
      displayName: 'frontend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/frontend/src/**/*.test.js'],
      transform: { '\\.js$': babel },
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/tests/api.test.js'],
    },
  ],
  // Cobertura de las pruebas unitarias: reglas del negocio y servicio del cliente.
  // Rutas, controladores y app.js se recorren en las pruebas de integración (npm run test:api).
  collectCoverageFrom: [
    'backend/services/**/*.js', 'backend/validaciones/**/*.js', 'backend/utils/**/*.js', 'backend/config/permisos.js',
    'backend/middleware/{errores,validar,autenticacion}.js', 'frontend/src/services/api.js',
  ],
  coverageReporters: ['text', 'text-summary', 'html'],
};
