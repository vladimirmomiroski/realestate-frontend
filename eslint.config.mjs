import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const appImportPatterns = ["@/app/**", "**/app/**"];
const featureImportPatterns = ["@/features/**", "**/features/**"];
const componentImportPatterns = ["@/components/**", "**/components/**"];
// Feature names are registered explicitly so the rule can distinguish a
// feature's own internals from another feature's internals.
const featureNames = [
  "account",
  "agencies",
  "agency-workspace",
  "auth",
  "listing-management",
  "listings",
];

const featureImportRestrictions = (featureName) => {
  const otherFeatures = featureNames
    .filter((candidate) => candidate !== featureName)
    .join("|");

  return [
    {
      group: appImportPatterns,
      message: "Features cannot depend on app routing.",
    },
    {
      regex: `^@/features/(?:${otherFeatures})/(?!public(?:/|$)).+`,
      message:
        "Features cannot deep-import another feature's internals; use its public boundary.",
    },
    {
      regex: `^(?:\\.\\./)+(?:${otherFeatures})/(?!public(?:/|$)).+`,
      message:
        "Features cannot deep-import another feature's internals by a relative path; use its public boundary.",
    },
  ];
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                ...featureImportPatterns,
                ...componentImportPatterns,
                ...appImportPatterns,
              ],
              message:
                "Generic lib modules cannot depend on features, components, or app routing.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [...featureImportPatterns, ...appImportPatterns],
              message:
                "Domain-free UI primitives cannot depend on features or app routing.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: appImportPatterns,
              message: "Features cannot depend on app routing.",
            },
          ],
        },
      ],
    },
  },
  ...featureNames.map((featureName) => ({
    files: [`src/features/${featureName}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: featureImportRestrictions(featureName),
        },
      ],
    },
  })),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
