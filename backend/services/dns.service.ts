import { DnsRecord, Domain, DnsRecordType } from "../models";
import { logActivity } from "./log.service";
import { powerDnsDriver } from "../drivers/PowerDnsDriver";
import { Op } from "sequelize";

// DNS Format Validation Helper
export function validateDnsRecordFormat(type: DnsRecordType, value: string, priority?: number) {
  const v = value.trim();
  if (!v) throw new Error("DNS Record value cannot be empty.");

  if (type === "A") {
    const ipv4Regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipv4Regex.test(v)) {
      throw new Error(`Invalid IPv4 address format for A record: ${v}`);
    }
  } else if (type === "AAAA") {
    const ipv6Regex = /^[0-9a-fA-F:]+$/;
    if (!ipv6Regex.test(v)) {
      throw new Error(`Invalid IPv6 address format for AAAA record: ${v}`);
    }
  } else if (type === "MX") {
    if (priority === undefined || priority < 0 || priority > 65535) {
      throw new Error("MX record requires a valid priority integer (0 - 65535).");
    }
  }
}

export async function createDnsRecord(userId: string, domainId: string, type: DnsRecordType, name: string, value: string, ttl: number = 14400, priority: number = 10, isAdmin: boolean = false) {
  const domain = await Domain.findOne({
    where: { [Op.or]: [{ id: domainId }, { domainName: domainId }] },
  });
  if (!domain) throw new Error("Domain not found.");

  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  validateDnsRecordFormat(type, value, priority);

  const record = await DnsRecord.create({
    domainId: domain.id,
    type,
    name: name.trim() || "@",
    value: value.trim(),
    ttl: ttl || 14400,
    priority: priority || 10,
  });

  // Push to PowerDNS API
  await powerDnsDriver.syncRecord(domain.domainName, type, record.name, record.value, record.ttl, record.priority);

  await logActivity(userId, "DNS_RECORD_CREATED", { recordId: record.id, domainName: domain.domainName, type, name: record.name });

  return record;
}

export async function getDomainDnsRecords(userId: string, domainId: string, isAdmin: boolean = false) {
  const domain = await Domain.findOne({
    where: { [Op.or]: [{ id: domainId }, { domainName: domainId }] },
  });
  if (!domain) throw new Error("Domain not found.");

  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  return DnsRecord.findAll({
    where: { domainId: domain.id },
    order: [["type", "ASC"], ["name", "ASC"]],
  });
}

export async function updateDnsRecord(userId: string, recordId: string, value: string, ttl?: number, priority?: number, isAdmin: boolean = false) {
  const record = await DnsRecord.findByPk(recordId, { include: [{ model: Domain, as: "domain" }] });
  if (!record) throw new Error("DNS record not found.");

  const domain = (record as any).domain;
  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  validateDnsRecordFormat(record.type, value, priority);

  record.value = value.trim();
  if (ttl !== undefined) record.ttl = ttl;
  if (priority !== undefined) record.priority = priority;

  await record.save();

  // Push live update to PowerDNS API
  await powerDnsDriver.syncRecord(domain.domainName, record.type, record.name, record.value, record.ttl, record.priority);

  await logActivity(userId, "DNS_RECORD_UPDATED", { recordId: record.id, domainName: domain.domainName, type: record.type, name: record.name });

  return record;
}

export async function deleteDnsRecord(userId: string, recordId: string, isAdmin: boolean = false) {
  const record = await DnsRecord.findByPk(recordId, { include: [{ model: Domain, as: "domain" }] });
  if (!record) throw new Error("DNS record not found.");

  const domain = (record as any).domain;
  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  await record.destroy();

  // Remove from PowerDNS API
  await powerDnsDriver.deleteRecord(domain.domainName, record.type, record.name);

  await logActivity(userId, "DNS_RECORD_DELETED", { recordId, domainName: domain.domainName, type: record.type, name: record.name });

  return { success: true };
}
