/** @typedef {import('prettier').Config} PrettierConfig */
/** @typedef {import('@ianvs/prettier-plugin-sort-imports').PluginConfig} SortImportPluginConfig */

/** @type {PrettierConfig & SortImportPluginConfig} */
const config = {
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  printWidth: 100,
  singleQuote: true,
  importOrderTypeScriptVersion: '5.8.3',
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '',
    '^(next/(.*)$)|^(next$)',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^(~/)',
    '^[.][.]/',
    '^[.]/',
    '',
  ],
  overrides: [
    {
      files: '*.json',
      options: {
        trailingComma: 'none',
      },
    },
  ],
};

export default config;
