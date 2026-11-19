import { Mailbox, Domain, UserPackage, Package } from "../models";
import { hashPassword } from "../utils/security";
import { logActivity } from "./log.service";
import { mailcowDriver } from "../drivers/MailcowDriver";
import { Op } from "sequelize";

export async function createMailbox(userId: string, domainId: string, emailAddress: string, password: string, quotaMb: number = 2048, isAdmin: boolean = false) {
  const normalizedEmail = emailAddress.trim().toLowerCase();

  // 1. Ownership authorization check (look up by UUID or domainName)
  const domain = await Domain.findOne({
    where: { [Op.or]: [{ id: domainId }, { domainName: domainId }] },
  });
  if (!domain) throw new Error("Domain not found.");

  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  // Ensure email matches domain
  if (!normalizedEmail.endsWith(`@${domain.domainName}`)) {
    throw new Error(`Email address must end with @${domain.domainName}`);
  }

  // Check if mailbox already exists
  const existing = await Mailbox.findOne({ where: { emailAddress: normalizedEmail } });
  if (existing) {
    throw new Error(`Mailbox ${normalizedEmail} already exists.`);
  }

  // 2. Package limit checks (max_mailboxes_per_domain and storage_quota_mb)
  const userSub = await UserPackage.findOne({
    where: { userId: domain.userId, status: "ACTIVE" },
    include: [{ model: Package, as: "package" }],
  });

  const activePkg = (userSub as any)?.package;
  const maxMailboxes = activePkg?.maxMailboxesPerDomain || 5;
  const storageQuotaMb = activePkg?.storageQuotaMb || 5120;

  const currentMailboxCount = await Mailbox.count({ where: { domainId: domain.id } });
  if (currentMailboxCount >= maxMailboxes) {
    throw new Error(`Domain mailbox limit reached (${maxMailboxes} per domain). Please upgrade your package.`);
  }

  // Check storage quota sum
  const userDomains = await Domain.findAll({ where: { userId: domain.userId }, attributes: ["id"] });
  const domainIds = userDomains.map((d) => d.id);
  const currentStorageSum = (await Mailbox.sum("quotaMb", { where: { domainId: domainIds } })) || 0;

  if (currentStorageSum + quotaMb > storageQuotaMb) {
    throw new Error(`Total storage quota limit exceeded (${storageQuotaMb} MB). Available headroom: ${storageQuotaMb - currentStorageSum} MB.`);
  }

  const passwordHash = await hashPassword(password);
  const mailbox = await Mailbox.create({
    domainId: domain.id,
    emailAddress: normalizedEmail,
    passwordHash,
    quotaMb,
    status: "ACTIVE",
  });

  // Provision on Mailcow mail server
  await mailcowDriver.createMailbox(normalizedEmail, domain.domainName, quotaMb);

  await logActivity(userId, "MAILBOX_CREATED", { mailboxId: mailbox.id, emailAddress: normalizedEmail, quotaMb });

  return mailbox;
}

export async function getUserMailboxes(userId: string) {
  const domains = await Domain.findAll({ where: { userId }, attributes: ["id"] });
  const domainIds = domains.map((d) => d.id);

  if (domainIds.length === 0) return [];

  return Mailbox.findAll({
    where: { domainId: domainIds },
    include: [{ model: Domain, as: "domain", attributes: ["domainName"] }],
    order: [["created_at", "DESC"]],
  });
}

export async function updateMailboxPassword(userId: string, mailboxId: string, newPassword: string, isAdmin: boolean = false) {
  const mailbox = await Mailbox.findByPk(mailboxId, { include: [{ model: Domain, as: "domain" }] });
  if (!mailbox) throw new Error("Mailbox not found.");

  const domain = (mailbox as any).domain;
  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  const passwordHash = await hashPassword(newPassword);
  mailbox.passwordHash = passwordHash;
  await mailbox.save();

  // Update on Mailcow API simultaneously
  await mailcowDriver.updateMailboxPassword(mailbox.emailAddress);

  await logActivity(userId, "MAILBOX_PASSWORD_UPDATED", { mailboxId, emailAddress: mailbox.emailAddress });

  return { success: true, message: "Password updated simultaneously in DB and Mail Server." };
}

export async function deleteMailbox(userId: string, mailboxId: string, isAdmin: boolean = false) {
  const mailbox = await Mailbox.findByPk(mailboxId, { include: [{ model: Domain, as: "domain" }] });
  if (!mailbox) throw new Error("Mailbox not found.");

  const domain = (mailbox as any).domain;
  if (!isAdmin && domain.userId !== userId) {
    throw new Error("Unauthorized: You do not own this domain.");
  }

  await mailbox.destroy();

  // Deprovision on Mailcow API
  await mailcowDriver.deleteMailbox(mailbox.emailAddress);

  await logActivity(userId, "MAILBOX_DELETED", { mailboxId, emailAddress: mailbox.emailAddress });

  return { success: true };
}
