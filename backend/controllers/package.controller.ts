import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as packageService from "../services/package.service";

export async function listPackages(req: AuthenticatedRequest, res: Response) {
  try {
    const packages = await packageService.getAllPackages();
    return res.status(200).json({ success: true, data: packages });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createPackage(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, price, maxDomains, maxMailboxesPerDomain, storageQuotaMb, durationDays } = req.body;
    if (!name || price === undefined || !maxDomains || !storageQuotaMb) {
      return res.status(400).json({ success: false, error: "name, price, maxDomains, and storageQuotaMb are required." });
    }

    const pkg = await packageService.createPackage({ name, price, maxDomains, maxMailboxesPerDomain, storageQuotaMb, durationDays });
    return res.status(201).json({ success: true, message: "Package created successfully.", data: pkg });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function requestUpgrade(req: AuthenticatedRequest, res: Response) {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({ success: false, error: "packageId is required." });
    }

    const request = await packageService.submitUpgradeRequest(req.user!.userId, packageId);
    return res.status(201).json({ success: true, message: "Upgrade request submitted successfully.", data: request });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function processUpgrade(req: AuthenticatedRequest, res: Response) {
  try {
    const requestId = req.params.requestId as string;
    const { approve } = req.body;

    const request = await packageService.processUpgradeRequest(requestId, Boolean(approve), req.user!.userId);
    return res.status(200).json({
      success: true,
      message: approve ? "Upgrade approved and user subscription updated." : "Upgrade request rejected.",
      data: request,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
