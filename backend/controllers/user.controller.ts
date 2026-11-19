import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import * as userService from "../services/user.service";

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password, role, packageId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const user = await userService.createUser({ email, password, role, packageId });
    return res.status(201).json({ success: true, message: "User created successfully.", data: user });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function getUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ success: false, error: "User not found." });

    return res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be ACTIVE or SUSPENDED." });
    }

    const user = await userService.setUserStatus(id, status);
    return res.status(200).json({ success: true, message: `User status updated to ${status}.`, data: user });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    await userService.deleteUser(id);
    return res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const stats = await userService.getUserUsageStats(userId);
    return res.status(200).json({ success: true, data: stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
