import "server-only";
import { forbidden, redirect } from "next/navigation";
import { defaultResource, isAllowed } from "@/lib/iam";
import { getCurrentUser } from "@/lib/session";
import type { CurrentUser } from "@/types/iam";

export const PERMISSION_DENIED_ERROR = "You don't have permission to do that";

export function can(user: CurrentUser | null, action: string, resource = defaultResource(action)): boolean {
  return user !== null && isAllowed(user.statements, action, resource);
}

export async function requirePermission(action: string, resource?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user, action, resource)) forbidden();
  return user;
}

export async function authorize(action: string, resource?: string): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return can(user, action, resource) ? user : null;
}
