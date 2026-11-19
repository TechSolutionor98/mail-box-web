import { Package, UserPackage, UpgradeRequest } from "../models";
import { logActivity } from "./log.service";
import { sequelize } from "../config/database";
import { Op } from "sequelize";

export async function createPackage(data: { name: string; price: number; maxDomains: number; maxMailboxesPerDomain: number; storageQuotaMb: number; durationDays?: number }) {
  const pkg = await Package.create({
    name: data.name,
    price: data.price,
    maxDomains: data.maxDomains,
    maxMailboxesPerDomain: data.maxMailboxesPerDomain,
    storageQuotaMb: data.storageQuotaMb,
    durationDays: data.durationDays || 30,
  });

  await logActivity(null, "PACKAGE_CREATED", { packageId: pkg.id, name: pkg.name });
  return pkg;
}

export async function getAllPackages() {
  return Package.findAll({ order: [["price", "ASC"]] });
}

export async function submitUpgradeRequest(userId: string, targetPackageId: string) {
  const targetPkg = await Package.findByPk(targetPackageId);
  if (!targetPkg) throw new Error("Target package does not exist.");

  const request = await UpgradeRequest.create({
    userId,
    packageId: targetPackageId,
    status: "PENDING",
  });

  await logActivity(userId, "UPGRADE_REQUEST_SUBMITTED", { packageId: targetPackageId, packageName: targetPkg.name });
  return request;
}

export async function processUpgradeRequest(requestId: string, approve: boolean, adminUserId: string) {
  const request = await UpgradeRequest.findByPk(requestId, {
    include: [
      { model: Package, as: "package" },
    ],
  });

  if (!request) throw new Error("Upgrade request not found.");
  if (request.status !== "PENDING") throw new Error("Upgrade request has already been processed.");

  const transaction = await sequelize.transaction();
  try {
    if (approve) {
      request.status = "APPROVED";
      await request.save({ transaction });

      // Expire previous active package
      await UserPackage.update(
        { status: "EXPIRED" },
        { where: { userId: request.userId, status: "ACTIVE" }, transaction }
      );

      // Create new active package subscription
      const pkg = (request as any).package;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (pkg.durationDays || 30) * 24 * 60 * 60 * 1000);

      await UserPackage.create(
        {
          userId: request.userId,
          packageId: pkg.id,
          status: "ACTIVE",
          expiresAt,
        },
        { transaction }
      );
    } else {
      request.status = "REJECTED";
      await request.save({ transaction });
    }

    await transaction.commit();
    await logActivity(adminUserId, approve ? "UPGRADE_APPROVED" : "UPGRADE_REJECTED", { requestId, userId: request.userId });

    return request;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function checkExpiredSubscriptions() {
  const now = new Date();
  const expiredSubs = await UserPackage.findAll({
    where: {
      status: "ACTIVE",
      expiresAt: { [Op.lt]: now },
    },
  });

  for (const sub of expiredSubs) {
    sub.status = "EXPIRED";
    await sub.save();
    await logActivity(sub.userId, "PACKAGE_EXPIRED", { packageId: sub.packageId });
  }

  return { expiredCount: expiredSubs.length };
}
