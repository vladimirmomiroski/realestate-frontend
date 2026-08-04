import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import path from "node:path";

import openapiTS, { astToString, COMMENT_HEADER } from "openapi-typescript";
import { format } from "prettier";

export const defaultOpenApiUrl =
  "http://localhost:5231/swagger/v1/swagger.json";

export const generatedContractPath = path.resolve(
  "src/contracts/generated/openapi.d.ts"
);

function getOpenApiUrl() {
  const value = process.env.OPENAPI_URL?.trim() || defaultOpenApiUrl;
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OPENAPI_URL must use HTTP or HTTPS.");
  }

  return url;
}

function assertOpenApiDocument(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    typeof value.openapi !== "string" ||
    !value.openapi.startsWith("3.") ||
    !value.info ||
    typeof value.info !== "object" ||
    typeof value.info.title !== "string" ||
    !value.paths ||
    typeof value.paths !== "object" ||
    Array.isArray(value.paths) ||
    Object.keys(value.paths).length === 0
  ) {
    throw new Error(
      "The configured endpoint did not return a valid OpenAPI 3 document."
    );
  }
}

export async function createGeneratedContract() {
  const sourceUrl = getOpenApiUrl();
  const response = await fetch(sourceUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAPI request failed with ${response.status} ${response.statusText}.`
    );
  }

  let document;

  try {
    document = await response.json();
  } catch (error) {
    throw new Error("The configured endpoint did not return valid JSON.", {
      cause: error,
    });
  }

  assertOpenApiDocument(document);

  const nodes = await openapiTS(document, {
    alphabetize: true,
    silent: true,
  });

  return format(`${COMMENT_HEADER}${astToString(nodes)}`, {
    parser: "typescript",
    endOfLine: "lf",
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
  });
}

export async function writeGeneratedContract(
  destination = generatedContractPath
) {
  const generated = await createGeneratedContract();
  const directory = path.dirname(destination);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(destination)}.${process.pid}.${randomUUID()}.tmp`
  );

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, generated, "utf8");
    await rename(temporaryPath, destination);
  } finally {
    await rm(temporaryPath, { force: true });
  }

  return destination;
}

function isMainModule() {
  const entryPoint = process.argv[1];

  return (
    typeof entryPoint === "string" &&
    import.meta.url === pathToFileURL(path.resolve(entryPoint)).href
  );
}

if (isMainModule()) {
  const destination = await writeGeneratedContract();
  console.log(
    `Generated backend wire types at ${path.relative(process.cwd(), destination)}.`
  );
}
