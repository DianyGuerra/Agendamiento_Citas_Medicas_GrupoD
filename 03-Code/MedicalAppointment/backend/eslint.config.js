const js = require('@eslint/js');

const globals = require('globals');

module.exports = [
  {
    // Archivos o carpetas que ESLint NO debe revisar.
    ignores: [
      'node_modules/**', // Ignora paquetes instalados por npm.
      'coverage/**',    // Ignora reportes de cobertura de Jest.
      'dist/**',        // Ignora carpetas de distribución si existen.
      'build/**'        // Ignora builds generados si existen.
    ]
  },

  js.configs.recommended,

  {
    // Indica qué archivos JS del backend serán evaluados y los tests
    files: [
      '**/*.js',
      '../tests/**/*.js'
    ],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node, // Permite globals de Node.js: require, module, process, __dirname.
        ...globals.jest  // Permite globals de Jest: describe, test, expect, jest, beforeEach.
      }
    },

    // reglas específicas para el backend
    rules: {
      // 1. Detecta variables declaradas pero no usadas.
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],

      // 2. Detecta variables usadas sin haber sido declaradas.
      'no-undef': 'error',

      // 3. Evita declarar dos veces la misma variable en el mismo alcance.
      'no-redeclare': 'error',

      // 4. Evita código que nunca se ejecutará.
      'no-unreachable': 'error',

      // 5. Recomienda usar === 
      'eqeqeq': ['warn', 'always'],

      // 6. Evita bloques catch vacíos.
      'no-empty': 'warn',

      // 7. Evita múltiples espacios innecesarios.
      'no-multi-spaces': ['warn', {ignoreEOLComments: true}],

      // 8. Exige punto y coma al final de las sentencias.
      'semi': ['warn', 'always'],
    }
  }
];