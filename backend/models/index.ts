import { User } from "./User";
import { Package } from "./Package";
import { UserPackage } from "./UserPackage";
import { Domain } from "./Domain";
import { DnsRecord, DnsRecordType } from "./DnsRecord";
import { Mailbox } from "./Mailbox";
import { ActivityLog } from "./ActivityLog";
import { ResetToken } from "./ResetToken";
import { UpgradeRequest } from "./UpgradeRequest";
import { EmailMessage } from "./EmailMessage";

// Setup Relationships & Foreign Keys
User.hasMany(UserPackage, { foreignKey: "userId", as: "subscriptions" });
UserPackage.belongsTo(User, { foreignKey: "userId", as: "user" });

Package.hasMany(UserPackage, { foreignKey: "packageId", as: "subscriptions" });
UserPackage.belongsTo(Package, { foreignKey: "packageId", as: "package" });

User.belongsToMany(Package, { through: UserPackage, foreignKey: "userId", otherKey: "packageId", as: "packages" });
Package.belongsToMany(User, { through: UserPackage, foreignKey: "packageId", otherKey: "userId", as: "users" });

User.hasMany(Domain, { foreignKey: "userId", as: "domains" });
Domain.belongsTo(User, { foreignKey: "userId", as: "owner" });

Domain.hasMany(DnsRecord, { foreignKey: "domainId", as: "dnsRecords" });
DnsRecord.belongsTo(Domain, { foreignKey: "domainId", as: "domain" });

Domain.hasMany(Mailbox, { foreignKey: "domainId", as: "mailboxes" });
Mailbox.belongsTo(Domain, { foreignKey: "domainId", as: "domain" });

Mailbox.hasMany(EmailMessage, { foreignKey: "mailboxId", as: "messages" });
EmailMessage.belongsTo(Mailbox, { foreignKey: "mailboxId", as: "mailbox" });

User.hasMany(ActivityLog, { foreignKey: "userId", as: "activityLogs" });
ActivityLog.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(ResetToken, { foreignKey: "userId", as: "resetTokens" });
ResetToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(UpgradeRequest, { foreignKey: "userId", as: "upgradeRequests" });
UpgradeRequest.belongsTo(User, { foreignKey: "userId", as: "user" });

Package.hasMany(UpgradeRequest, { foreignKey: "packageId", as: "upgradeRequests" });
UpgradeRequest.belongsTo(Package, { foreignKey: "packageId", as: "package" });

export {
  User,
  Package,
  UserPackage,
  Domain,
  DnsRecord,
  Mailbox,
  ActivityLog,
  ResetToken,
  UpgradeRequest,
  EmailMessage,
};
export type { DnsRecordType };


