export type ChangeType =
  | "started_following"
  | "stopped_following"
  | "gained_follower"
  | "lost_follower";

export type TimeRange = "1d" | "3d" | "7d" | "30d" | "90d" | "1y";

export interface User {
  id: string;
  ig_username: string;
  ig_user_id: string | null;
  created_at: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  ig_user_id: string | null;
  full_name: string | null;
  is_private: boolean;
  profile_pic_url: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
  follower_count?: number;
  following_count?: number;
}

export interface TrackedAccount extends InstagramAccount {
  tracked_at: string;
  recent_changes?: number;
}

export interface Snapshot {
  id: string;
  instagram_account_id: string;
  snapshot_date: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface Change {
  id: string;
  instagram_account_id: string;
  detected_date: string;
  change_type: ChangeType;
  target_username: string;
  target_ig_id: string | null;
  created_at: string;
}

export interface AccountSummary {
  account: InstagramAccount;
  snapshots: Snapshot[];
  changes: Change[];
  stats: {
    started_following: number;
    stopped_following: number;
    gained_follower: number;
    lost_follower: number;
  };
}

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: "1d", label: "1 día", days: 1 },
  { value: "3d", label: "3 días", days: 3 },
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
  { value: "90d", label: "90 días", days: 90 },
  { value: "1y", label: "1 año", days: 365 },
];

export const CHANGE_LABELS: Record<
  ChangeType,
  { label: string; color: string; icon: "plus" | "minus" | "user-plus" | "user-minus" }
> = {
  started_following: { label: "Empezó a seguir", color: "text-emerald-400", icon: "plus" },
  stopped_following: { label: "Dejó de seguir", color: "text-red-400", icon: "minus" },
  gained_follower: { label: "Nuevo seguidor", color: "text-sky-400", icon: "user-plus" },
  lost_follower: { label: "Perdió seguidor", color: "text-orange-400", icon: "user-minus" },
};
