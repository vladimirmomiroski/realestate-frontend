import { readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  createGeneratedContract,
  generatedContractPath,
} from "./generate-api-types.mjs";

const temporaryPath = path.join(
  path.dirname(generatedContractPath),
  `.${path.basename(generatedContractPath)}.check.${process.pid}.${randomUUID()}.tmp`
);

try {
  const generated = await createGeneratedContract();
  await writeFile(temporaryPath, generated, "utf8");

  let committed;

  try {
    committed = await readFile(generatedContractPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      throw new Error(
        "Generated API types are missing. Run npm run api:generate."
      );
    }

    throw error;
  }

  const candidate = await readFile(temporaryPath, "utf8");

  if (candidate !== committed) {
    throw new Error(
      "Generated API types have drifted. Run npm run api:generate and review the contract diff."
    );
  }

  console.log("Generated API types match Development Swagger exactly.");
} finally {
  await rm(temporaryPath, { force: true });
}
