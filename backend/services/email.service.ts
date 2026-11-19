import { EmailMessage, Mailbox, Domain } from "../models";
import { logActivity } from "./log.service";

export async function getMailboxMessages(
  userId: string,
  mailboxId: string,
  folder: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH" = "INBOX",
  isAdmin: boolean = false
) {
  const mailbox = await Mailbox.findByPk(mailboxId, {
    include: [{ model: Domain, as: "domain" }],
  });
  if (!mailbox) throw new Error("Mailbox not found.");

  const domain = (mailbox as any).domain;
  const isAuthorized = isAdmin || domain?.userId === userId || mailbox.id === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized: You do not own this domain mailbox.");
  }

  const messages = await EmailMessage.findAll({
    where: { mailboxId, folder },
    order: [["created_at", "DESC"]],
  });

  const unreadCount = await EmailMessage.count({
    where: { mailboxId, folder: "INBOX", isRead: false },
  });

  return {
    messages,
    unreadCount,
    activeFolder: folder,
  };
}

export async function getMessageDetails(userId: string, messageId: string, isAdmin: boolean = false) {
  const message = await EmailMessage.findByPk(messageId, {
    include: [{ model: Mailbox, as: "mailbox", include: [{ model: Domain, as: "domain" }] }],
  });
  if (!message) throw new Error("Email message not found.");

  const domain = (message as any).mailbox?.domain;
  const isAuthorized = isAdmin || domain?.userId === userId || (message as any).mailboxId === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized: You do not own this mailbox.");
  }

  if (!message.isRead) {
    message.isRead = true;
    await message.save();
  }

  return message;
}

export async function sendEmail(
  userId: string,
  mailboxId: string,
  recipient: string,
  subject: string,
  bodyHtml: string,
  attachmentsJson?: string,
  isAdmin: boolean = false
) {
  const mailbox = await Mailbox.findByPk(mailboxId, {
    include: [{ model: Domain, as: "domain" }],
  });
  if (!mailbox) throw new Error("Mailbox not found.");

  const domain = (mailbox as any).domain;
  const isAuthorized = isAdmin || domain?.userId === userId || mailbox.id === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized: You do not own this domain mailbox.");
  }

  const sender = mailbox.emailAddress;

  // 1. Create SENT message record for sender
  const sentMessage = await EmailMessage.create({
    mailboxId,
    sender,
    recipient: recipient.trim(),
    subject: subject.trim() || "(No Subject)",
    bodyHtml,
    folder: "SENT",
    isRead: true,
    isStarred: false,
    attachmentsJson,
  });

  // 2. If recipient is a local mailbox on our system, deliver to recipient's INBOX directly!
  const recipientMailbox = await Mailbox.findOne({ where: { emailAddress: recipient.trim().toLowerCase() } });
  if (recipientMailbox) {
    await EmailMessage.create({
      mailboxId: recipientMailbox.id,
      sender,
      recipient: recipient.trim(),
      subject: subject.trim() || "(No Subject)",
      bodyHtml,
      folder: "INBOX",
      isRead: false,
      isStarred: false,
      attachmentsJson,
    });
  }

  await logActivity(domain?.userId || null, "EMAIL_SENT", { sender, recipient, subject });

  return sentMessage;
}

export async function saveDraft(
  userId: string,
  mailboxId: string,
  recipient: string,
  subject: string,
  bodyHtml: string,
  isAdmin: boolean = false
) {
  const mailbox = await Mailbox.findByPk(mailboxId, {
    include: [{ model: Domain, as: "domain" }],
  });
  if (!mailbox) throw new Error("Mailbox not found.");

  const domain = (mailbox as any).domain;
  const isAuthorized = isAdmin || domain?.userId === userId || mailbox.id === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized: You do not own this domain mailbox.");
  }

  const draftMessage = await EmailMessage.create({
    mailboxId,
    sender: mailbox.emailAddress,
    recipient: recipient.trim(),
    subject: subject.trim() || "(Draft)",
    bodyHtml,
    folder: "DRAFTS",
    isRead: true,
    isStarred: false,
  });

  return draftMessage;
}

export async function updateMessageFolder(
  userId: string,
  messageId: string,
  targetFolder: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH",
  isAdmin: boolean = false
) {
  const message = await EmailMessage.findByPk(messageId, {
    include: [{ model: Mailbox, as: "mailbox", include: [{ model: Domain, as: "domain" }] }],
  });
  if (!message) throw new Error("Email message not found.");

  const domain = (message as any).mailbox?.domain;
  const isAuthorized = isAdmin || domain?.userId === userId || (message as any).mailboxId === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized.");
  }

  message.folder = targetFolder;
  await message.save();

  return message;
}

export async function toggleMessageStar(userId: string, messageId: string, isAdmin: boolean = false) {
  const message = await EmailMessage.findByPk(messageId, {
    include: [{ model: Mailbox, as: "mailbox", include: [{ model: Domain, as: "domain" }] }],
  });
  if (!message) throw new Error("Email message not found.");

  const domain = (message as any).mailbox?.domain;
  const isAuthorized = isAdmin || domain?.userId === userId || (message as any).mailboxId === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized.");
  }

  message.isStarred = !message.isStarred;
  await message.save();

  return message;
}

export async function deleteMessage(userId: string, messageId: string, isAdmin: boolean = false) {
  const message = await EmailMessage.findByPk(messageId, {
    include: [{ model: Mailbox, as: "mailbox", include: [{ model: Domain, as: "domain" }] }],
  });
  if (!message) throw new Error("Email message not found.");

  const domain = (message as any).mailbox?.domain;
  const isAuthorized = isAdmin || domain?.userId === userId || (message as any).mailboxId === userId;
  if (!isAuthorized) {
    throw new Error("Unauthorized.");
  }

  if (message.folder !== "TRASH") {
    message.folder = "TRASH";
    await message.save();
    return { success: true, message: "Moved to Trash" };
  } else {
    await message.destroy();
    return { success: true, message: "Permanently deleted" };
  }
}
