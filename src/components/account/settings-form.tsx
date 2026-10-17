"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import type { SafeUser } from "@/lib/auth/get-user";

export interface SettingsFormProps {
  user: SafeUser;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();

  // Profile state
  const [name, setName] = useState(user.name);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Logout state
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Failed to update profile";
        setProfileError(errorMsg);
        toast.error("Could not update profile", errorMsg);
      } else {
        const successMsg = "Display name updated successfully.";
        setProfileSuccess(successMsg);
        toast.success("Profile updated", "Your display name has been saved across all kitchens.");
        router.refresh();
      }
    } catch {
      const networkError = "Network error. Please try again.";
      setProfileError(networkError);
      toast.error("Network issue", networkError);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmNewPassword) {
      const mismatch = "New passwords do not match.";
      setPasswordError(mismatch);
      toast.warning("Password mismatch", mismatch);
      return;
    }

    if (newPassword.length < 8) {
      const shortErr = "New password must be at least 8 characters.";
      setPasswordError(shortErr);
      toast.warning("Password too short", shortErr);
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const passErr = data.error || "Failed to update password";
        setPasswordError(passErr);
        toast.error("Password update failed", passErr);
      } else {
        const passSuccess =
          "Password updated successfully. Other active sessions were signed out.";
        setPasswordSuccess(passSuccess);
        toast.success("Password updated", "Your credentials have been securely updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      const netErr = "Network error. Please try again.";
      setPasswordError(netErr);
      toast.error("Network issue", netErr);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      toast.success("Signed out successfully", "Until next time in the kitchen!");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Sign out error", "Redirecting to login...");
      router.push("/login");
    } finally {
      setLogoutLoading(false);
      setSignOutModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Profile Details Card */}
      <Card className="p-6 bg-white border border-[#DDDCD3]">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your display name across your family kitchen archives.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {profileSuccess && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-[#2E4742]/10 border border-[#2E4742]/30 text-[#2E4742] text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2E4742]" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{profileError}</span>
            </div>
          )}

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address (Normalized & Immutable)"
            value={user.email}
            disabled
            helperText="Account email cannot be modified directly."
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="forest"
              size="md"
              isLoading={profileLoading}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Change Card */}
      <Card className="p-6 bg-white border border-[#DDDCD3]">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password. Updating your
            password revokes all other active sessions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordSuccess && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-800 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-sage-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <Input
            label="Current Password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="p-1 hover:text-warm-900 pointer-events-auto transition-colors"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          <Input
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="At least 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="p-1 hover:text-warm-900 pointer-events-auto transition-colors"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          <Input
            label="Confirm New Password"
            type={showNewPassword ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            placeholder="Re-enter new password"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="outline"
              size="md"
              isLoading={passwordLoading}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Session & Sign Out Card */}
      <Card className="p-6 bg-[#FAF9F5] border border-[#DDDCD3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-lg text-[#202723] font-bold">
              Sign Out of Account
            </h3>
            <p className="text-xs text-[#202723]/70 font-sans">
              Revokes the active refresh session and clears all secure HttpOnly cookies.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setSignOutModalOpen(true)}
            isLoading={logoutLoading}
            className="text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200/80 cursor-pointer"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </Card>

      <ConfirmModal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        onConfirm={handleLogout}
        title="Leaving the kitchen?"
        description="You will be signed out of your Simmory account on this device. Your family recipes, cooking memories, and active archives remain securely preserved."
        confirmLabel="Sign Out"
        cancelLabel="Stay in Kitchen"
        variant="danger"
        isLoading={logoutLoading}
        icon={<LogOut className="w-5 h-5 text-[#E97B77]" />}
      />
    </div>
  );
}
