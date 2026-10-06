-- Writes one "AuditLog" row per inserted, updated or deleted row.
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

  IF TG_TABLE_NAME = 'User' THEN
    old_data := old_data - 'passwordHash';
    new_data := new_data - 'passwordHash';
  END IF;

  row_data := COALESCE(new_data, old_data);

  record_id := CASE TG_TABLE_NAME
    WHEN 'UserRole' THEN (row_data ->> 'userId') || ':' || (row_data ->> 'roleId')
    WHEN 'RolePolicy' THEN (row_data ->> 'roleId') || ':' || (row_data ->> 'policyId')
    ELSE row_data ->> 'id'
  END;

  INSERT INTO "AuditLog" ("tableName", "recordId", "action", "oldData", "newData", "changedById", "changedAt")
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
AFTER INSERT OR UPDATE OR DELETE ON "User"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_user_role
AFTER INSERT OR UPDATE OR DELETE ON "UserRole"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_role
AFTER INSERT OR UPDATE OR DELETE ON "Role"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_role_policy
AFTER INSERT OR UPDATE OR DELETE ON "RolePolicy"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_policy
AFTER INSERT OR UPDATE OR DELETE ON "Policy"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_policy_statement
AFTER INSERT OR UPDATE OR DELETE ON "PolicyStatement"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_field
AFTER INSERT OR UPDATE OR DELETE ON "Field"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_yield_record
AFTER INSERT OR UPDATE OR DELETE ON "YieldRecord"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_arimax_model
AFTER INSERT OR UPDATE OR DELETE ON "ArimaxModel"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
