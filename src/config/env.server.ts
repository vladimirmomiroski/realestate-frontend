import "server-only";

import { parseRuntimeEnvironment } from "./env";

export const env = parseRuntimeEnvironment(process.env);
