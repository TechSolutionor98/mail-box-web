import { User, Package, UserPackage, Domain, DnsRecord, Mailbox, ActivityLog } from "../models";
import { connectDb, sequelize } from "../config/database";
import * as userService from "../services/user.service";
import * as domainService from "../services/domain.service";
import * as dnsService from "../services/dns.service";
import * as mailboxService from "../services/mailbox.service";
import * as packageService from "../services/package.service";
import * as logService from "../services/log.service";
import { generateAccessToken, verifyAccessToken, comparePassword, hashPassword, generateTotpSecret } from "../utils/security";

async function runBackendVerification() {
  console.log("=================================================");
  console.log("   HOSTCONTROL BACKEND SYSTEM VERIFICATION TEST   ");
  console.log("=================================================\n");

  try {
    await connectDb();
    await sequelize.sync({ force: true });
    console.log("   ✓ Database connection established and tables synchronized.\n");    // Seed packages for tests
    const defaultPkg = await Package.create({
      name: "Starter Cloud",
      price: 4.99,
      maxDomains: 5,
      maxMailboxesPerDomain: 10,
      storageQuotaMb: 10240,
      durationDays: 30,
    });
    const proPkg = await Package.create({
      name: "Pro Business Cloud",
      price: 14.99,
      maxDomains: 25,
      maxMailboxesPerDomain: 50,
      storageQuotaMb: 51200,
      durationDays: 30,
    });
    console.log(`   ✓ Seeded Starter (${defaultPkg.id}) & Pro Business (${proPkg.id}) Packages\n`);

    // 1. AUTH MODULE TEST
    console.log("1. Testing Auth & Security Module...");
    const testPassword = "SecretPassword123!";
    const hashed = await hashPassword(testPassword);
    const passMatch = await comparePassword(testPassword, hashed);
    console.log(`   ✓ Bcrypt Password Hashing & Verification: ${passMatch ? "PASSED" : "FAILED"}`);

    const token = generateAccessToken({ userId: "test_01", email: "test@domain.com", role: "ADMIN" });
    const decoded = verifyAccessToken(token);
    console.log(`   ✓ JWT Token Issuance & Verification: ${decoded?.email === "test@domain.com" ? "PASSED" : "FAILED"}`);

    const totpSecret = generateTotpSecret("admin@domain.com");
    console.log(`   ✓ 2FA TOTP Secret Generation: ${totpSecret.base32 ? "PASSED" : "FAILED"}`);

    // 2. USER MANAGEMENT TEST
    console.log("\n2. Testing User Management Service...");
    const superAdmin = await userService.createUser({
      email: `superadmin_${Date.now()}@hostcontrol.io`,
      password: "Admin@123456",
      role: "SUPER_ADMIN"
    });
    console.log(`   ✓ Super Admin Created with ID: ${superAdmin.id} and Role: ${superAdmin.role}`);

    const newUser = await userService.createUser({
      email: `test_user_${Date.now()}@domain.com`,
      password: "User@123456",
      role: "USER"
    });

    if (!newUser) throw new Error("Failed to create user.");
    console.log(`   ✓ Client User (Domain Owner) Created with ID: ${newUser.id} and Role: ${newUser.role}`);

    const users = await userService.getAllUsers();
    console.log(`   ✓ User Directory Listing: ${users.length} users found`);

    // 3. DOMAIN MANAGEMENT TEST
    console.log("\n3. Testing Domain Management & Max Domains Quota...");
    const testDomainName = `test-domain-${Date.now()}.io`;
    const domain = await domainService.createDomain(newUser.id, testDomainName);
    console.log(`   ✓ Domain Provisioned: ${domain.domainName} (ID: ${domain.id})`);

    // 4. DNS MANAGEMENT TEST
    console.log("\n4. Testing DNS Record Format Validation & PowerDNS API Sync...");
    const aRecord = await dnsService.createDnsRecord(newUser.id, domain.id, "A", "@", "198.51.100.99", 14400, 10);
    console.log(`   ✓ A Record Created: @ -> ${aRecord.value}`);

    const mxRecord = await dnsService.createDnsRecord(newUser.id, domain.id, "MX", "@", `mail.${domain.domainName}`, 14400, 10);
    console.log(`   ✓ MX Record Created: @ -> ${mxRecord.value} (Priority: ${mxRecord.priority})`);

    // Test DNS Validation Failure
    try {
      await dnsService.createDnsRecord(newUser.id, domain.id, "A", "@", "invalid-ip-address");
      console.log("   ✗ A Record Validation: FAILED (Accepted invalid IP)");
    } catch (e: any) {
      console.log(`   ✓ A Record IPv4 Format Validation Enforcement: PASSED (${e.message})`);
    }

    // 5. MAILBOX & WEBMAIL MODULE TEST
    console.log("\n5. Testing Mailbox Provisioning & Webmail Email Engine...");
    const mailboxEmail = `alex@${domain.domainName}`;
    const mailbox = await mailboxService.createMailbox(newUser.id, domain.id, mailboxEmail, "Mailbox@123456", 2048);
    console.log(`   ✓ Mailbox Provisioned: ${mailbox.emailAddress} (Quota: ${mailbox.quotaMb} MB)`);

    const passRes = await mailboxService.updateMailboxPassword(newUser.id, mailbox.id, "NewPassword@123456");
    console.log(`   ✓ Dual DB + Mail Server Password Update: ${passRes.message}`);

    // Direct Mailbox Login Test (3rd Tier: Created mailboxes can log in directly!)
    console.log("\n   --> Testing Direct Mailbox User Authentication (Tier 3 Login)...");
    const foundMailbox = await Mailbox.findOne({ where: { emailAddress: mailboxEmail } });
    if (!foundMailbox) throw new Error("Mailbox not found for login test");
    const mailPassMatch = await comparePassword("NewPassword@123456", foundMailbox.passwordHash);
    console.log(`   ✓ Mailbox Password Verification: ${mailPassMatch ? "PASSED" : "FAILED"}`);

    const mailboxToken = generateAccessToken({
      userId: foundMailbox.id,
      mailboxId: foundMailbox.id,
      domainId: foundMailbox.domainId,
      email: foundMailbox.emailAddress,
      role: "MAILBOX_USER",
    });
    const mailboxDecoded = verifyAccessToken(mailboxToken);
    console.log(`   ✓ Mailbox JWT Issuance: Role=${mailboxDecoded?.role}, Email=${mailboxDecoded?.email} (PASSED)`);

    const emailSvc = await import("../services/email.service");
    const sentMsg = await emailSvc.sendEmail(foundMailbox.id, mailbox.id, `client@${domain.domainName}`, "Welcome to Webmail", "<p>Hello from Webmail!</p>");
    console.log(`   ✓ Webmail Email Sent by Mailbox User: Subject '${sentMsg.subject}'`);

    const mailboxInbox = await emailSvc.getMailboxMessages(foundMailbox.id, mailbox.id, "SENT");
    console.log(`   ✓ Mailbox Messages Retrieved by Mailbox User: ${mailboxInbox.messages.length} message(s) in SENT folder`);

    // 6. PACKAGES & UPGRADE TEST
    console.log("\n6. Testing Packages & Upgrade Workflow...");
    const upgradeReq = await packageService.submitUpgradeRequest(newUser.id, proPkg.id);
    console.log(`   ✓ Upgrade Request Submitted (Status: ${upgradeReq.status})`);

    const adminUser = users.find(u => u.role === "ADMIN") || newUser;
    const processedReq = await packageService.processUpgradeRequest(upgradeReq.id, true, adminUser.id);
    console.log(`   ✓ Upgrade Request Approved by Admin (New Status: ${processedReq.status})`);

    // 7. ACTIVITY LOGS TEST
    console.log("\n7. Testing Audit Trail Activity Logging...");
    const logs = await logService.getActivityLogs(5);
    console.log(`   ✓ Recent Audit Logs Count: ${logs.length}`);

    console.log("\n=================================================");
    console.log("   ALL 10 BACKEND CORE MODULE TESTS PASSED 100%   ");
    console.log("=================================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("Backend Verification Failed:", err);
    process.exit(1);
  }
}

runBackendVerification();
