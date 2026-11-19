import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as domainService from "../services/domain.service";

export async function listUserDomains(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const domains = await domainService.getUserDomains(userId);
    return res.status(200).json({ success: true, data: domains });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function listAllDomainsAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const domains = await domainService.getAllDomains();
    return res.status(200).json({ success: true, data: domains });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function addDomain(req: AuthenticatedRequest, res: Response) {
  try {
    const { domainName, targetUserId } = req.body;
    const userId = req.user!.role === "ADMIN" && targetUserId ? targetUserId : req.user!.userId;

    if (!domainName) {
      return res.status(400).json({ success: false, error: "Domain name is required." });
    }

    const domain = await domainService.createDomain(userId, domainName);
    return res.status(201).json({ success: true, message: "Domain added and DNS zone initialized.", data: domain });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateDomainStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid domain status." });
    }

    const domain = await domainService.setDomainStatus(id, status, req.user!.userId);
    return res.status(200).json({ success: true, message: `Domain status updated to ${status}.`, data: domain });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteDomain(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const isAdmin = req.user!.role === "ADMIN";
    await domainService.deleteDomain(id, req.user!.userId, isAdmin);
    return res.status(200).json({ success: true, message: "Domain deleted successfully." });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
