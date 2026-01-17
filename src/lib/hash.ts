import crypto from "crypto";

const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
      }, {});
  }
  return value;
};

export const stableStringify = (value: unknown): string => {
  return JSON.stringify(sortObject(value));
};

export const sha256 = (value: string): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
