import { User, Package, UserPackage, Domain, DnsRecord, Mailbox, EmailMessage } from "../models";
import { hashPassword } from "../utils/security";
import { powerDnsDriver } from "../drivers/PowerDnsDriver";
import { mailcowDriver } from "../drivers/MailcowDriver";

export async function seedInitialData() {
  try {
    // 1. Seed Packages
    let starterPkg = await Package.findOne({ where: { name: "Starter Cloud" } });
    if (!starterPkg) {
      starterPkg = await Package.create({
        name: "Starter Cloud",
        price: 4.99,
        maxDomains: 5,
        maxMailboxesPerDomain: 10,
        storageQuotaMb: 10240,
        durationDays: 30,
      });
      console.log("[Seed] Created Starter Cloud package.");
    }

    let proPkg = await Package.findOne({ where: { name: "Pro Business Cloud" } });
    if (!proPkg) {
      proPkg = await Package.create({
        name: "Pro Business Cloud",
        price: 14.99,
        maxDomains: 25,
        maxMailboxesPerDomain: 50,
        storageQuotaMb: 51200,
        durationDays: 30,
      });
      console.log("[Seed] Created Pro Business Cloud package.");
    }

    // 2. Seed Super Admin Accounts
    let primarySuperAdmin = await User.findOne({ where: { email: "superadmin@techsolutionor.com" } });
    if (!primarySuperAdmin) {
      const pass = await hashPassword("Admin@123456");
      primarySuperAdmin = await User.create({
        email: "superadmin@techsolutionor.com",
        passwordHash: pass,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        totpEnabled: false,
      });
      console.log("[Seed] Created Super Admin: superadmin@techsolutionor.com (Password: Admin@123456)");
    }

    let superAdmin = await User.findOne({ where: { email: "superadmin@hostcontrol.io" } });
    if (!superAdmin) {
      const superAdminPass = await hashPassword("Admin@123456");
      superAdmin = await User.create({
        email: "superadmin@hostcontrol.io",
        passwordHash: superAdminPass,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        totpEnabled: false,
      });
      console.log("[Seed] Created Super Admin: superadmin@hostcontrol.io (Password: Admin@123456)");
    }

    // 3. Seed Client User (Domain Owner who creates mailboxes)
    let clientUser = await User.findOne({ where: { email: "user@apexdesign.io" } });
    if (!clientUser) {
      const clientPass = await hashPassword("User@123456");
      clientUser = await User.create({
        email: "user@apexdesign.io",
        passwordHash: clientPass,
        role: "USER",
        status: "ACTIVE",
        totpEnabled: false,
      });

      // Assign Pro Business Package
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await UserPackage.create({
        userId: clientUser.id,
        packageId: proPkg.id,
        status: "ACTIVE",
        expiresAt,
      });
      console.log("[Seed] Created Client User: user@apexdesign.io (Password: User@123456)");
    }

    // 4. Seed Domain for Client User
    let domain = await Domain.findOne({ where: { domainName: "apexdesign.io" } });
    if (!domain) {
      domain = await Domain.create({
        userId: clientUser.id,
        domainName: "apexdesign.io",
        status: "ACTIVE",
      });
      await powerDnsDriver.createOrUpdateZone("apexdesign.io");

      // Seed Core DNS Records
      await DnsRecord.create({ domainId: domain.id, type: "A", name: "@", value: "198.51.100.42", ttl: 14400, priority: 10 });
      await DnsRecord.create({ domainId: domain.id, type: "MX", name: "@", value: "mail.techsolutionor.com", ttl: 14400, priority: 10 });
      await DnsRecord.create({ domainId: domain.id, type: "CNAME", name: "webmail", value: "mail.techsolutionor.com", ttl: 14400, priority: 10 });
      await DnsRecord.create({ domainId: domain.id, type: "TXT", name: "@", value: "v=spf1 mx a include:mail.techsolutionor.com ~all", ttl: 14400, priority: 10 });
      console.log("[Seed] Created Domain & DNS: apexdesign.io (MX: mail.techsolutionor.com)");
    }

    // 5. Seed Mailbox Users (Emails that can directly log in to Webmail!)
    let alexMailbox = await Mailbox.findOne({ where: { emailAddress: "alex@apexdesign.io" } });
    if (!alexMailbox) {
      const alexPass = await hashPassword("Alex@123456");
      alexMailbox = await Mailbox.create({
        domainId: domain.id,
        emailAddress: "alex@apexdesign.io",
        passwordHash: alexPass,
        quotaMb: 2048,
        status: "ACTIVE",
      });
      await mailcowDriver.createMailbox("alex@apexdesign.io", "apexdesign.io", 2048);
      console.log("[Seed] Created Mailbox User: alex@apexdesign.io (Password: Alex@123456)");

      // Seed sample emails in Alex's mailbox
      await EmailMessage.create({
        mailboxId: alexMailbox.id,
        sender: "Security Operations <security@cloudhost.net>",
        recipient: "alex@apexdesign.io",
        subject: "🔐 Welcome to HostControl Webmail",
        bodyHtml: "<p>Hello Alexander,</p><p>Your high-performance corporate mailbox <strong>alex@apexdesign.io</strong> has been provisioned and is active.</p><p>You can directly log in using your email address and password at the HostControl Portal.</p>",
        folder: "INBOX",
        isRead: false,
        isStarred: true,
      });

      await EmailMessage.create({
        mailboxId: alexMailbox.id,
        sender: "Sarah Jenkins <sarah@clientcorp.com>",
        recipient: "alex@apexdesign.io",
        subject: "Updated Q4 Enterprise Hosting & Email Quotation",
        bodyHtml: "<p>Hi Alex,</p><p>Thanks for setting up our domain mailboxes. Looking forward to reviewing the DNS and storage allocations.</p><p>Best regards,<br/><strong>Sarah Jenkins</strong></p>",
        folder: "INBOX",
        isRead: false,
        isStarred: false,
      });
    }

    let supportMailbox = await Mailbox.findOne({ where: { emailAddress: "support@apexdesign.io" } });
    if (!supportMailbox) {
      const supportPass = await hashPassword("Support@123456");
      supportMailbox = await Mailbox.create({
        domainId: domain.id,
        emailAddress: "support@apexdesign.io",
        passwordHash: supportPass,
        quotaMb: 1024,
        status: "ACTIVE",
      });
      await mailcowDriver.createMailbox("support@apexdesign.io", "apexdesign.io", 1024);
      console.log("[Seed] Created Mailbox User: support@apexdesign.io (Password: Support@123456)");
    }
  } catch (err: any) {
    console.error("[Seed Error]", err.message);
  }
}
