import "server-only";
import type { Statement } from "@/types/iam";

export type { Statement } from "@/types/iam";

const ARN_PREFIX = "animo";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matches(pattern: string, value: string): boolean {
  const source = pattern.split("*").map(escapeRegex).join(".*");
  return new RegExp(`^${source}$`).test(value);
}

function statementMatches(statement: Statement, action: string, resource: string): boolean {
  return (
    statement.actions.some((pattern) => matches(pattern, action)) &&
    statement.resources.some((pattern) => matches(pattern, resource))
  );
}

export function isAllowed(statements: Statement[], action: string, resource: string): boolean {
  const matching = statements.filter((statement) => statementMatches(statement, action, resource));
  if (matching.some((statement) => statement.effect === "DENY")) return false;
  return matching.some((statement) => statement.effect === "ALLOW");
}

export function resourceArn(resource: string, id = "*"): string {
  return `${ARN_PREFIX}:${resource}/${id}`;
}

export function defaultResource(action: string): string {
  return resourceArn(action.split(":")[0]);
}
