-- Idempotent migration: compound indexes and unique constraints
-- DueRadar 0003

-- obligations: compound indexes for hot list/filter paths
CREATE INDEX IF NOT EXISTS idx_obligations_workspace_status
  ON obligations (workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_obligations_workspace_due
  ON obligations (workspace_id, due_date);

CREATE INDEX IF NOT EXISTS idx_obligations_workspace_id
  ON obligations (workspace_id);

-- workspace_members: unique membership + lookup indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_unique
  ON workspace_members (workspace_id, clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id
  ON workspace_members (workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_email
  ON workspace_members (workspace_id, email);

-- reminder_rules: active rules per obligation
CREATE INDEX IF NOT EXISTS idx_reminder_rules_obligation_active
  ON reminder_rules (obligation_id, is_active);
