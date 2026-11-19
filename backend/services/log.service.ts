import { ActivityLog } from "../models";

export async function logActivity(userId: string | null, action: string, details: any = {}, ipAddress: string = "127.0.0.1") {
  try {
    await ActivityLog.create({
      userId,
      action,
      detailsJson: JSON.stringify(details),
      ipAddress,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function getActivityLogs(limit: number = 50) {
  return ActivityLog.findAll({
    order: [["created_at", "DESC"]],
    limit,
  });
}
