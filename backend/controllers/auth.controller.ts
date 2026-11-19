import { Request, Response } from "express";
import { User, ResetToken, Mailbox, Domain, Package, UserPackage } from "../models";
import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword, generateTotpSecret, verifyTotpToken, TokenPayload } from "../utils/security";
import { logActivity } from "../services/log.service";
import crypto from "crypto";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, packageId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      totpEnabled: false,
    });

    // Assign starter or requested package
    let pkg = null;
    if (packageId) {
      pkg = await Package.findByPk(packageId);
    }
    if (!pkg) {
      pkg = await Package.findOne();
    }
    if (pkg) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (pkg.durationDays || 30));
      await UserPackage.create({
        userId: user.id,
        packageId: pkg.id,
        status: "ACTIVE",
        expiresAt,
      });
    }

    const payload: TokenPayload = { userId: user.id, email: user.email, role: "USER" };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await logActivity(user.id, "USER_REGISTERED", { email: user.email, package: pkg?.name }, req.ip);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        accessToken,
        refreshToken,
        redirectUrl: "/dashboard",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, totpToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check User table (SUPER_ADMIN, ADMIN, USER)
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (user) {
      if (user.status === "SUSPENDED") {
        return res.status(403).json({ success: false, error: "Account suspended. Please contact administrator." });
      }

      const match = await comparePassword(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
      }

      // 2FA Verification for SuperAdmin/Admin if enabled
      if ((user.role === "SUPER_ADMIN" || user.role === "ADMIN") && user.totpEnabled) {
        if (!totpToken) {
          return res.status(200).json({
            success: true,
            require2FA: true,
            message: "2FA TOTP token required for administrator authentication.",
          });
        }

        const valid2FA = verifyTotpToken(totpToken, user.totpSecret || "");
        if (!valid2FA) {
          return res.status(401).json({ success: false, error: "Invalid 2FA authentication token." });
        }
      }

      const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      await logActivity(user.id, "USER_LOGIN", { email: user.email, role: user.role }, req.ip);

      const redirectUrl = (user.role === "SUPER_ADMIN" || user.role === "ADMIN") ? "/admin" : "/dashboard";

      return res.status(200).json({
        success: true,
        message: "Login successful.",
        data: {
          accessToken,
          refreshToken,
          redirectUrl,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        },
      });
    }

    // 2. Check Mailbox table (Created Email Account Login!)
    const mailbox = await Mailbox.findOne({
      where: { emailAddress: normalizedEmail },
      include: [{ model: Domain, as: "domain" }],
    });

    if (mailbox) {
      if (mailbox.status === "SUSPENDED") {
        return res.status(403).json({
          success: false,
          error: "Mailbox suspended. Please contact your domain administrator.",
        });
      }

      const match = await comparePassword(password, mailbox.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
      }

      const payload: TokenPayload = {
        userId: mailbox.id,
        mailboxId: mailbox.id,
        domainId: mailbox.domainId,
        email: mailbox.emailAddress,
        role: "MAILBOX_USER",
      };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      const domain = (mailbox as any).domain;
      await logActivity(domain?.userId || mailbox.id, "MAILBOX_LOGIN", { email: mailbox.emailAddress }, req.ip);

      return res.status(200).json({
        success: true,
        message: "Webmail login successful.",
        data: {
          accessToken,
          refreshToken,
          redirectUrl: "/webmail",
          user: {
            id: mailbox.id,
            mailboxId: mailbox.id,
            domainId: mailbox.domainId,
            email: mailbox.emailAddress,
            role: "MAILBOX_USER",
            quotaMb: mailbox.quotaMb,
            status: mailbox.status,
          },
        },
      });
    }

    return res.status(401).json({ success: false, error: "Invalid email or password." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) {
      return res.status(400).json({ success: false, error: "Refresh token is required." });
    }

    const payload = generateAccessToken({ userId: "mock", email: "mock", role: "USER" }); // validation placeholder
    return res.status(200).json({ success: true, accessToken: rToken });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: "Invalid refresh token." });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(200).json({ success: true, message: "If account exists, password reset token generated." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await ResetToken.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await logActivity(user.id, "PASSWORD_RESET_REQUESTED", { email: user.email, resetToken: token });

    return res.status(200).json({
      success: true,
      message: "Password reset token generated.",
      data: { resetToken: token },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    const resetRec = await ResetToken.findOne({ where: { token, used: false } });

    if (!resetRec || new Date() > resetRec.expiresAt) {
      return res.status(400).json({ success: false, error: "Invalid or expired password reset token." });
    }

    const user = await User.findByPk(resetRec.userId);
    if (!user) throw new Error("User not found.");

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    resetRec.used = true;
    await resetRec.save();

    await logActivity(user.id, "PASSWORD_RESET_COMPLETED", { email: user.email });

    return res.status(200).json({ success: true, message: "Password reset successful. You may now login." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function setup2FA(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const user = await User.findByPk(authReq.user.userId);
    if (!user) throw new Error("User not found.");

    const { base32, otpauth_url } = generateTotpSecret(user.email);
    user.totpSecret = base32;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { secret: base32, otpauth_url },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function verify2FA(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const { token } = req.body;
    const user = await User.findByPk(authReq.user.userId);
    if (!user || !user.totpSecret) {
      return res.status(400).json({ success: false, error: "2FA not initialized." });
    }

    const valid = verifyTotpToken(token, user.totpSecret);
    if (!valid) {
      return res.status(400).json({ success: false, error: "Invalid 2FA code." });
    }

    user.totpEnabled = true;
    await user.save();

    await logActivity(user.id, "2FA_ENABLED", { email: user.email });

    return res.status(200).json({ success: true, message: "2FA successfully enabled for account." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { role, userId, email, mailboxId, domainId } = authReq.user;
    if (role === "MAILBOX_USER") {
      const mailbox = await Mailbox.findByPk(mailboxId || userId);
      return res.status(200).json({
        success: true,
        data: {
          id: mailbox?.id || userId,
          email: mailbox?.emailAddress || email,
          role: "MAILBOX_USER",
          quotaMb: mailbox?.quotaMb || 2048,
          domainId: mailbox?.domainId || domainId,
          redirectUrl: "/webmail",
        },
      });
    }

    const user = await User.findByPk(userId);
    return res.status(200).json({
      success: true,
      data: {
        id: user?.id || userId,
        email: user?.email || email,
        role: user?.role || role,
        status: user?.status,
        redirectUrl: (role === "SUPER_ADMIN" || role === "ADMIN") ? "/admin" : "/dashboard",
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
