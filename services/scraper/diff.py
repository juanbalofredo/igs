from datetime import date
from typing import Any


def compute_changes(
    account_id: str,
    previous_followers: dict[str, dict[str, str | None]],
    current_followers: dict[str, dict[str, str | None]],
    previous_following: dict[str, dict[str, str | None]],
    current_following: dict[str, dict[str, str | None]],
    detected_date: date,
) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []

    prev_follower_ids = set(previous_followers.keys())
    curr_follower_ids = set(current_followers.keys())
    prev_following_ids = set(previous_following.keys())
    curr_following_ids = set(current_following.keys())

    for ig_id in curr_follower_ids - prev_follower_ids:
        user = current_followers[ig_id]
        changes.append(
            {
                "instagram_account_id": account_id,
                "detected_date": detected_date.isoformat(),
                "change_type": "gained_follower",
                "target_username": user["username"],
                "target_ig_id": ig_id,
            }
        )

    for ig_id in prev_follower_ids - curr_follower_ids:
        user = previous_followers[ig_id]
        changes.append(
            {
                "instagram_account_id": account_id,
                "detected_date": detected_date.isoformat(),
                "change_type": "lost_follower",
                "target_username": user["username"],
                "target_ig_id": ig_id,
            }
        )

    for ig_id in curr_following_ids - prev_following_ids:
        user = current_following[ig_id]
        changes.append(
            {
                "instagram_account_id": account_id,
                "detected_date": detected_date.isoformat(),
                "change_type": "started_following",
                "target_username": user["username"],
                "target_ig_id": ig_id,
            }
        )

    for ig_id in prev_following_ids - curr_following_ids:
        user = previous_following[ig_id]
        changes.append(
            {
                "instagram_account_id": account_id,
                "detected_date": detected_date.isoformat(),
                "change_type": "stopped_following",
                "target_username": user["username"],
                "target_ig_id": ig_id,
            }
        )

    return changes
