import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as logService from "../services/log.service";

export async function listActivityLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const logs = await logService.getActivityLogs(limit);
    return res.status(200).json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
