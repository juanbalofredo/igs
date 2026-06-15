CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_username TEXT NOT NULL UNIQUE,
  ig_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  ig_user_id TEXT,
  full_name TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  profile_pic_url TEXT,
  last_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_tracked (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, instagram_account_id)
);

CREATE TABLE ig_sessions (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  encrypted_session TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instagram_account_id, snapshot_date)
);

CREATE TABLE snapshot_followers (
  snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  PRIMARY KEY (snapshot_id, ig_user_id)
);

CREATE TABLE snapshot_following (
  snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  PRIMARY KEY (snapshot_id, ig_user_id)
);

CREATE TABLE changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  detected_date DATE NOT NULL,
  change_type TEXT NOT NULL CHECK (
    change_type IN (
      'started_following',
      'stopped_following',
      'gained_follower',
      'lost_follower'
    )
  ),
  target_username TEXT NOT NULL,
  target_ig_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_tracked_user ON user_tracked(user_id);
CREATE INDEX idx_user_tracked_account ON user_tracked(instagram_account_id);
CREATE INDEX idx_snapshots_account_date ON snapshots(instagram_account_id, snapshot_date DESC);
CREATE INDEX idx_changes_account_date ON changes(instagram_account_id, detected_date DESC);
CREATE INDEX idx_changes_type ON changes(change_type);
CREATE INDEX idx_snapshot_followers_snapshot ON snapshot_followers(snapshot_id);
CREATE INDEX idx_snapshot_following_snapshot ON snapshot_following(snapshot_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
