import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as mailboxService from "../services/mailbox.service";

export async function listMailboxes(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const mailboxes = await mailboxService.getUserMailboxes(userId);
    return res.status(200).json({ success: true, data: mailboxes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createMailbox(req: AuthenticatedRequest, res: Response) {
  try {
    const { domainId, emailAddress, password, quotaMb } = req.body;
    if (!domainId || !emailAddress || !password) {
      return res.status(400).json({ success: false, error: "domainId, emailAddress, and password are required." });
    }

    const isAdmin = req.user!.role === "ADMIN";
    const mailbox = await mailboxService.createMailbox(req.user!.userId, domainId, emailAddress, password, quotaMb || 2048, isAdmin);
    return res.status(201).json({ success: true, message: "Mailbox created and provisioned on Mailcow API.", data: mailbox });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updatePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, error: "newPassword is required." });
    }

    const isAdmin = req.user!.role === "ADMIN";
    const result = await mailboxService.updateMailboxPassword(req.user!.userId, id, newPassword, isAdmin);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteMailbox(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const isAdmin = req.user!.role === "ADMIN";
    await mailboxService.deleteMailbox(req.user!.userId, id, isAdmin);
    return res.status(200).json({ success: true, message: "Mailbox deleted from DB and Mailcow server." });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
