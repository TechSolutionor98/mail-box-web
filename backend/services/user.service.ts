import { User, Package, UserPackage, Domain, Mailbox } from "../models";
import { hashPassword } from "../utils/security";
import { logActivity } from "./log.service";
import { sequelize } from "../config/database";

export async function createUser(data: { email: string; password: string; role?: "SUPER_ADMIN" | "ADMIN" | "USER"; packageId?: string }) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    throw new Error("User with this email already exists.");
  }

  const transaction = await sequelize.transaction();
  try {
    const passwordHash = await hashPassword(data.password);
    const user = await User.create(
      {
        email: data.email,
        passwordHash,
        role: data.role || "USER",
        status: "ACTIVE",
      },
      { transaction }
    );

    // Find requested package or fallback to first package
    let pkg = null;
    if (data.packageId) {
      pkg = await Package.findByPk(data.packageId, { transaction });
    }
    if (!pkg) {
      pkg = await Package.findOne({ transaction });
    }

    if (pkg) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (pkg.durationDays || 30) * 24 * 60 * 60 * 1000);
      await UserPackage.create(
        {
          userId: user.id,
          packageId: pkg.id,
          status: "ACTIVE",
          expiresAt,
        },
        { transaction }
      );
    }

    await transaction.commit();
    await logActivity(user.id, "USER_CREATED", { email: user.email, role: user.role, packageId: pkg?.id });

    return getUserById(user.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function getAllUsers() {
  return User.findAll({
    attributes: { exclude: ["passwordHash", "totpSecret"] },
    include: [
      {
        model: UserPackage,
        as: "subscriptions",
        where: { status: "ACTIVE" },
        required: false,
        include: [{ model: Package, as: "package" }],
      },
      {
        model: Domain,
        as: "domains",
        include: [{ model: Mailbox, as: "mailboxes" }],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

export async function getUserById(userId: string) {
  return User.findByPk(userId, {
    attributes: { exclude: ["passwordHash", "totpSecret"] },
    include: [
      {
        model: UserPackage,
        as: "subscriptions",
        where: { status: "ACTIVE" },
        required: false,
        include: [{ model: Package, as: "package" }],
      },
      {
        model: Domain,
        as: "domains",
        include: [{ model: Mailbox, as: "mailboxes" }],
      },
    ],
  });
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found.");

  user.status = status;
  await user.save();
  await logActivity(userId, "USER_STATUS_UPDATED", { status });
  return user;
}

export async function deleteUser(userId: string) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found.");

  await user.destroy();
  await logActivity(null, "USER_DELETED", { userId, email: user.email });
  return { success: true };
}

export async function getUserUsageStats(userId: string) {
  const user = (await getUserById(userId)) as any;
  if (!user) throw new Error("User not found.");

  const activeSub = user.subscriptions?.[0]?.package;
  const maxDomains = activeSub?.maxDomains || 1;
  const maxMailboxesPerDomain = activeSub?.maxMailboxesPerDomain || 5;
  const storageQuotaMb = activeSub?.storageQuotaMb || 5120;

  const domainsUsed = await Domain.count({ where: { userId } });

  const domains = await Domain.findAll({ where: { userId }, attributes: ["id"] });
  const domainIds = domains.map((d) => d.id);

  let mailboxesUsed = 0;
  let storageUsedMb = 0;

  if (domainIds.length > 0) {
    mailboxesUsed = await Mailbox.count({ where: { domainId: domainIds } });
    const sumResult = await Mailbox.sum("quotaMb", { where: { domainId: domainIds } });
    storageUsedMb = sumResult || 0;
  }

  return {
    user,
    usage: {
      domainsUsed,
      maxDomains,
      mailboxesUsed,
      maxMailboxesPerDomain,
      storageUsedMb,
      storageQuotaMb,
    },
  };
}
