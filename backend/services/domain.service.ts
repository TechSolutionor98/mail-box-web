import { Domain, User, UserPackage, Package, DnsRecord } from "../models";
import { logActivity } from "./log.service";
import { powerDnsDriver } from "../drivers/PowerDnsDriver";

export async function createDomain(userId: string, domainName: string) {
  const normalizedDomain = domainName.trim().toLowerCase();

  const existing = await Domain.findOne({ where: { domainName: normalizedDomain } });
  if (existing) {
    throw new Error(`Domain ${normalizedDomain} is already registered.`);
  }

  // Quota check: Get user's active package max_domains
  const userSub = await UserPackage.findOne({
    where: { userId, status: "ACTIVE" },
    include: [{ model: Package, as: "package" }],
  });

  const maxDomains = (userSub as any)?.package?.maxDomains || 1;
  const currentDomainCount = await Domain.count({ where: { userId } });

  if (currentDomainCount >= maxDomains) {
    throw new Error(`Package limit reached. Your active plan allows up to ${maxDomains} domain(s). Please upgrade your package.`);
  }

  const domain = await Domain.create({
    userId,
    domainName: normalizedDomain,
    status: "ACTIVE",
  });

  // Provision default DNS records (A, MX, TXT)
  await DnsRecord.bulkCreate([
    { domainId: domain.id, type: "A", name: "@", value: "198.51.100.42", ttl: 14400, priority: 10 },
    { domainId: domain.id, type: "CNAME", name: "www", value: normalizedDomain, ttl: 14400, priority: 10 },
    { domainId: domain.id, type: "MX", name: "@", value: `mail.${normalizedDomain}`, ttl: 14400, priority: 10 },
    { domainId: domain.id, type: "TXT", name: "@", value: "v=spf1 mx a include:cloudhost.net ~all", ttl: 14400, priority: 10 },
  ]);

  // Push zone live to PowerDNS API
  await powerDnsDriver.createOrUpdateZone(normalizedDomain);

  await logActivity(userId, "DOMAIN_CREATED", { domainId: domain.id, domainName: normalizedDomain });

  return domain;
}

export async function getUserDomains(userId: string) {
  return Domain.findAll({
    where: { userId },
    include: [{ model: DnsRecord, as: "dnsRecords" }],
    order: [["created_at", "DESC"]],
  });
}

export async function getAllDomains() {
  return Domain.findAll({
    include: [
      { model: User, as: "owner", attributes: ["id", "email", "status"] },
      { model: DnsRecord, as: "dnsRecords" },
    ],
    order: [["created_at", "DESC"]],
  });
}

export async function setDomainStatus(domainId: string, status: "PENDING" | "ACTIVE" | "SUSPENDED", adminUserId?: string) {
  const domain = await Domain.findByPk(domainId);
  if (!domain) throw new Error("Domain not found.");

  domain.status = status;
  await domain.save();

  await logActivity(adminUserId || domain.userId, "DOMAIN_STATUS_UPDATED", { domainId, domainName: domain.domainName, status });
  return domain;
}

export async function deleteDomain(domainId: string, userId?: string, isAdmin: boolean = false) {
  const domain = await Domain.findByPk(domainId);
  if (!domain) throw new Error("Domain not found.");

  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  await domain.destroy();
  await logActivity(userId || domain.userId, "DOMAIN_DELETED", { domainId, domainName: domain.domainName });
  return { success: true };
}
