import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as dnsService from "../services/dns.service";

export async function getDnsRecords(req: AuthenticatedRequest, res: Response) {
  try {
    const domainId = req.params.domainId as string;
    const isAdmin = req.user!.role === "ADMIN";
    const records = await dnsService.getDomainDnsRecords(req.user!.userId, domainId, isAdmin);
    return res.status(200).json({ success: true, data: records });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function addDnsRecord(req: AuthenticatedRequest, res: Response) {
  try {
    const { domainId, type, name, value, ttl, priority } = req.body;
    if (!domainId || !type || !value) {
      return res.status(400).json({ success: false, error: "domainId, type, and value are required." });
    }

    const isAdmin = req.user!.role === "ADMIN";
    const record = await dnsService.createDnsRecord(req.user!.userId, domainId, type, name || "@", value, ttl, priority, isAdmin);
    return res.status(201).json({ success: true, message: "DNS Record created and pushed to PowerDNS API.", data: record });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateDnsRecord(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { value, ttl, priority } = req.body;
    if (!value) {
      return res.status(400).json({ success: false, error: "Value is required." });
    }

    const isAdmin = req.user!.role === "ADMIN";
    const record = await dnsService.updateDnsRecord(req.user!.userId, id, value, ttl, priority, isAdmin);
    return res.status(200).json({ success: true, message: "DNS Record updated and synced.", data: record });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteDnsRecord(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const isAdmin = req.user!.role === "ADMIN";
    await dnsService.deleteDnsRecord(req.user!.userId, id, isAdmin);
    return res.status(200).json({ success: true, message: "DNS Record deleted and synced with PowerDNS API." });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
