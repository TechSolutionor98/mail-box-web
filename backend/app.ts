import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./config/database";
import { requireAuth, requireRole } from "./middleware/auth";

// Controllers
import * as authCtrl from "./controllers/auth.controller";
import * as userCtrl from "./controllers/user.controller";
import * as domainCtrl from "./controllers/domain.controller";
import * as dnsCtrl from "./controllers/dns.controller";
import * as mailboxCtrl from "./controllers/mailbox.controller";
import * as emailCtrl from "./controllers/email.controller";
import * as packageCtrl from "./controllers/package.controller";
import * as logCtrl from "./controllers/log.controller";
import { User, Domain, Mailbox, Package } from "./models";

import { checkExpiredSubscriptions } from "./services/package.service";
import { seedInitialData } from "./services/seed.service";

export const app = express();

app.use(cors());
app.use(express.json());

// Initialize Database Connection & Seed Data
connectDb().then(() => {
  seedInitialData();
});

// ----------------------------------------------------
// PUBLIC AUTH ENDPOINTS (/api/v1/auth)
// ----------------------------------------------------
const authRouter = express.Router();
authRouter.post("/register", authCtrl.register);
authRouter.post("/login", authCtrl.login);
authRouter.post("/refresh", authCtrl.refreshToken);
authRouter.post("/request-reset", authCtrl.requestPasswordReset);
authRouter.post("/reset-password", authCtrl.resetPassword);
authRouter.post("/2fa/setup", requireAuth, authCtrl.setup2FA);
authRouter.post("/2fa/verify", requireAuth, authCtrl.verify2FA);
authRouter.get("/me", requireAuth, authCtrl.getMe);

app.use("/api/v1/auth", authRouter);

// ----------------------------------------------------
// ADMIN NAMESPACE (/api/v1/admin/*) - SuperAdmin & Admin
// ----------------------------------------------------
const adminRouter = express.Router();
adminRouter.use(requireAuth);
adminRouter.use(requireRole("SUPER_ADMIN", "ADMIN"));

// Stats & Telemetry
adminRouter.get("/stats", async (_req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: "ACTIVE" } });
    const suspendedUsers = await User.count({ where: { status: "SUSPENDED" } });
    const totalDomains = await Domain.count();
    const activeDomains = await Domain.count({ where: { status: "ACTIVE" } });
    const totalMailboxes = await Mailbox.count();
    const activeMailboxes = await Mailbox.count({ where: { status: "ACTIVE" } });
    const totalPackages = await Package.count();

    const recentUsers = await User.findAll({
      attributes: ["id", "email", "role", "status", "created_at"],
      order: [["created_at", "DESC"]],
      limit: 6,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalDomains,
        activeDomains,
        totalMailboxes,
        activeMailboxes,
        totalPackages,
        recentUsers,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// User Management (Admin only)
adminRouter.get("/users", userCtrl.listUsers);
adminRouter.post("/users", userCtrl.createUser);
adminRouter.get("/users/:id", userCtrl.getUser);
adminRouter.put("/users/:id/status", userCtrl.updateUserStatus);
adminRouter.delete("/users/:id", userCtrl.deleteUser);

// Package Management (Admin only)
adminRouter.get("/packages", packageCtrl.listPackages);
adminRouter.post("/packages", packageCtrl.createPackage);
adminRouter.put("/upgrade-requests/:requestId", packageCtrl.processUpgrade);

// Domain Overview (Admin only)
adminRouter.get("/domains", domainCtrl.listAllDomainsAdmin);
adminRouter.put("/domains/:id/status", domainCtrl.updateDomainStatus);

// Audit Trail (Admin only)
adminRouter.get("/activity-logs", logCtrl.listActivityLogs);

app.use("/api/v1/admin", adminRouter);

// ----------------------------------------------------
// WEBMAIL NAMESPACE (/api/v1/webmail/*) - Mailbox, User, Admin
// ----------------------------------------------------
const webmailRouter = express.Router();
webmailRouter.use(requireAuth);
webmailRouter.use(requireRole("SUPER_ADMIN", "ADMIN", "USER", "MAILBOX_USER"));

webmailRouter.get("/messages", emailCtrl.listMessages);
webmailRouter.get("/messages/:id", emailCtrl.getMessage);
webmailRouter.post("/send", emailCtrl.sendEmail);
webmailRouter.post("/draft", emailCtrl.saveDraft);
webmailRouter.put("/messages/:id/folder", emailCtrl.moveFolder);
webmailRouter.put("/messages/:id/star", emailCtrl.toggleStar);
webmailRouter.delete("/messages/:id", emailCtrl.deleteMessage);

app.use("/api/v1/webmail", webmailRouter);

// ----------------------------------------------------
// USER NAMESPACE (/api/v1/user/*) - User & Admin Roles
// ----------------------------------------------------
const userRouter = express.Router();
userRouter.use(requireAuth);

// Webmail Client APIs (also accessible via /api/v1/user/webmail)
userRouter.use("/webmail", webmailRouter);

// Domain & Mailbox Management (Requires Domain Owner or Admin)
const domainOwnerOnly = requireRole("SUPER_ADMIN", "ADMIN", "USER");

// Profile & Real-time Usage Stats
userRouter.get("/profile", domainOwnerOnly, userCtrl.getProfile);

// Domain Management
userRouter.get("/domains", domainOwnerOnly, domainCtrl.listUserDomains);
userRouter.post("/domains", domainOwnerOnly, domainCtrl.addDomain);
userRouter.delete("/domains/:id", domainOwnerOnly, domainCtrl.deleteDomain);

// DNS Management (CRUD per domain)
userRouter.get("/domains/:domainId/dns", domainOwnerOnly, dnsCtrl.getDnsRecords);
userRouter.post("/dns", domainOwnerOnly, dnsCtrl.addDnsRecord);
userRouter.put("/dns/:id", domainOwnerOnly, dnsCtrl.updateDnsRecord);
userRouter.delete("/dns/:id", domainOwnerOnly, dnsCtrl.deleteDnsRecord);

// Mailbox Management (Domain owners create & manage mailboxes)
userRouter.get("/mailboxes", domainOwnerOnly, mailboxCtrl.listMailboxes);
userRouter.post("/mailboxes", domainOwnerOnly, mailboxCtrl.createMailbox);
userRouter.put("/mailboxes/:id/password", domainOwnerOnly, mailboxCtrl.updatePassword);
userRouter.delete("/mailboxes/:id", domainOwnerOnly, mailboxCtrl.deleteMailbox);

// Subscription & Upgrade Requests
userRouter.get("/packages", domainOwnerOnly, packageCtrl.listPackages);
userRouter.post("/upgrade-request", domainOwnerOnly, packageCtrl.requestUpgrade);

app.use("/api/v1/user", userRouter);

// ----------------------------------------------------
// BACKGROUND CRON / JOB PROCESSOR (Package Expiry Check)
// ----------------------------------------------------
setInterval(async () => {
  try {
    const result = await checkExpiredSubscriptions();
    if (result.expiredCount > 0) {
      console.log(`[Cron Job] Expired ${result.expiredCount} subscription(s).`);
    }
  } catch (err: any) {
    console.error("[Cron Job Error]", err.message);
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[HostControl Backend Server] Running on http://localhost:${PORT}/api/v1`);
  });
}
