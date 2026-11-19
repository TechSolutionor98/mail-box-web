import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface EmailMessageAttributes {
  id: string;
  mailboxId: string;
  sender: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  folder: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH";
  isRead: boolean;
  isStarred: boolean;
  attachmentsJson?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailMessageCreationAttributes
  extends Optional<EmailMessageAttributes, "id" | "isRead" | "isStarred" | "bodyText" | "attachmentsJson"> {}

export class EmailMessage
  extends Model<EmailMessageAttributes, EmailMessageCreationAttributes>
  implements EmailMessageAttributes
{
  declare id!: string;
  declare mailboxId!: string;
  declare sender!: string;
  declare recipient!: string;
  declare subject!: string;
  declare bodyHtml!: string;
  declare bodyText?: string;
  declare folder!: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH";
  declare isRead!: boolean;
  declare isStarred!: boolean;
  declare attachmentsJson?: string;

  declare readonly createdAt!: Date;
  declare readonly updatedAt!: Date;
}

EmailMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mailboxId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "mailbox_id",
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "(No Subject)",
    },
    bodyHtml: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "body_html",
    },
    bodyText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "body_text",
    },
    folder: {
      type: DataTypes.ENUM("INBOX", "SENT", "DRAFTS", "SPAM", "TRASH"),
      allowNull: false,
      defaultValue: "INBOX",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_read",
    },
    isStarred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_starred",
    },
    attachmentsJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "attachments_json",
    },
  },
  {
    sequelize,
    tableName: "email_messages",
    indexes: [
      { fields: ["mailbox_id"] },
      { fields: ["folder"] },
      { fields: ["is_read"] },
      { fields: ["created_at"] },
    ],
  }
);
