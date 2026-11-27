export type Effect = "ALLOW" | "DENY";

export interface Statement {
  effect: Effect;
  actions: string[];
  resources: string[];
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleNames: string[];
  statements: Statement[];
}
