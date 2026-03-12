/**
 * Build validation using Ajv
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Build } from "./schema/build.js";

// Load the JSON schema
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = join(__dirname, "..", "specs", "build.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

// Create Ajv instance with formats support
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile the schema
const validateFn = ajv.compile(schema);

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a build against the schema
 */
export function validate(build: unknown): ValidationResult {
  const valid = validateFn(build);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = [];
  for (const err of validateFn.errors || []) {
    errors.push({
      field: err.instancePath || "(root)",
      message: err.message || "validation failed",
      value: err.data,
    });
  }

  return { valid: false, errors };
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow(build: unknown): asserts build is Build {
  const result = validate(build);
  if (!result.valid) {
    const errorList = result.errors
      .map((e) => `  ${e.field}: ${e.message}`)
      .join("\n");
    throw new Error(`Build validation failed:\n${errorList}`);
  }
}
