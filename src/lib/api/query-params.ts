export type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Readonly<Record<string, QueryParamValue>>;

type QuerySerializationOptions = {
  omitEmptyStringFor?: readonly string[];
};

function compareKeys(left: string, right: string) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function assertSupportedValue(value: unknown, key: string) {
  if (
    value !== null &&
    value !== undefined &&
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    throw new TypeError(`Unsupported query value for ${key}.`);
  }
}

export function serializeQueryParams(
  values: QueryParams,
  { omitEmptyStringFor = [] }: QuerySerializationOptions = {}
): string {
  const semanticallyEmptyKeys = new Set(omitEmptyStringFor);
  const searchParams = new URLSearchParams();

  for (const key of Object.keys(values).sort(compareKeys)) {
    const value = values[key];

    assertSupportedValue(value, key);

    if (
      value === null ||
      value === undefined ||
      (value === "" && semanticallyEmptyKeys.has(key))
    ) {
      continue;
    }

    searchParams.append(key, String(value));
  }

  return searchParams.toString();
}
