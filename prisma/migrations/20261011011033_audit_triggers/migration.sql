-- Writes one "audit_logs" row per inserted, updated or deleted row.
-- "changedById" comes from `SELECT set_config('app.user_id', <userId>, true)`
-- run inside the same transaction; it is null for seeds and manual SQL.
CREATE OR REPLACE FUNCTION audit_log_trigger() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_data  jsonb;
  new_data  jsonb;
  row_data  jsonb;
  record_id text;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    old_data := to_jsonb(OLD);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    new_data := to_jsonb(NEW);
  END IF;

  IF TG_TABLE_NAME = 'users' THEN
    old_data := old_data - 'passwordHash';
    new_data := new_data - 'passwordHash';
  END IF;

  row_data := COALESCE(new_data, old_data);

  record_id := CASE TG_TABLE_NAME
    WHEN 'user_roles' THEN (row_data ->> 'userId') || ':' || (row_data ->> 'roleId')
    WHEN 'role_policies' THEN (row_data ->> 'roleId') || ':' || (row_data ->> 'policyId')
    ELSE row_data ->> 'id'
  END;

  INSERT INTO "audit_logs" ("tableName", "recordId", "action", "oldData", "newData", "changedById", "changedAt")
  VALUES (
    TG_TABLE_NAME,
    record_id,
    TG_OP::"AuditAction",
    old_data,
    new_data,
    NULLIF(current_setting('app.user_id', true), ''),
    now()
  );

  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_user
AFTER INSERT OR UPDATE OR DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_user_role
AFTER INSERT OR UPDATE OR DELETE ON "user_roles"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_role
AFTER INSERT OR UPDATE OR DELETE ON "roles"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_role_policy
AFTER INSERT OR UPDATE OR DELETE ON "role_policies"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_policy
AFTER INSERT OR UPDATE OR DELETE ON "policies"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_policy_statement
AFTER INSERT OR UPDATE OR DELETE ON "policy_statements"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_field
AFTER INSERT OR UPDATE OR DELETE ON "fields"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_yield_record
AFTER INSERT OR UPDATE OR DELETE ON "yield_records"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_arimax_model
AFTER INSERT OR UPDATE OR DELETE ON "arimax_models"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
