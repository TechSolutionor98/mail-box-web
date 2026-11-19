import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as emailService from "../services/email.service";

export async function listMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { mailboxId, folder } = req.query;
    const targetMailboxId = (mailboxId as string) || req.user?.mailboxId || (req.user?.role === "MAILBOX_USER" ? req.user?.userId : null);
    if (!targetMailboxId) {
      return res.status(400).json({ success: false, error: "mailboxId query parameter is required." });
    }

    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const result = await emailService.getMailboxMessages(
      userId,
      targetMailboxId,
      (folder as any) || "INBOX",
      isAdmin
    );

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function getMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const message = await emailService.getMessageDetails(userId, id, isAdmin);
    return res.status(200).json({ success: true, data: message });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function sendEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const { mailboxId, recipient, subject, bodyHtml, attachmentsJson } = req.body;
    const targetMailboxId = (mailboxId as string) || req.user?.mailboxId || (req.user?.role === "MAILBOX_USER" ? req.user?.userId : null);
    if (!targetMailboxId || !recipient || !bodyHtml) {
      return res.status(400).json({ success: false, error: "mailboxId, recipient, and bodyHtml are required." });
    }

    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const sent = await emailService.sendEmail(
      userId,
      targetMailboxId,
      recipient,
      subject,
      bodyHtml,
      attachmentsJson,
      isAdmin
    );

    return res.status(201).json({ success: true, message: "Email sent successfully.", data: sent });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function saveDraft(req: AuthenticatedRequest, res: Response) {
  try {
    const { mailboxId, recipient, subject, bodyHtml } = req.body;
    const targetMailboxId = (mailboxId as string) || req.user?.mailboxId || (req.user?.role === "MAILBOX_USER" ? req.user?.userId : null);
    if (!targetMailboxId) {
      return res.status(400).json({ success: false, error: "mailboxId is required." });
    }

    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const draft = await emailService.saveDraft(
      userId,
      targetMailboxId,
      recipient,
      subject,
      bodyHtml,
      isAdmin
    );

    return res.status(201).json({ success: true, message: "Draft saved.", data: draft });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function moveFolder(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { folder } = req.body;
    if (!folder) {
      return res.status(400).json({ success: false, error: "Target folder is required." });
    }

    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const updated = await emailService.updateMessageFolder(userId, id, folder, isAdmin);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function toggleStar(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const updated = await emailService.toggleMessageStar(userId, id, isAdmin);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN";

    const resObj = await emailService.deleteMessage(userId, id, isAdmin);
    return res.status(200).json(resObj);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
