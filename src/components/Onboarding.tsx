import React, { useEffect, useState } from "react";
import { KeyRound, QrCode, ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import cookies from "js-cookie";

import { API_URL } from "../config/config";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MyJwtPayload {
  updatePassword: boolean;
}

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [authCode, setAuthcode] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const auth = cookies.get("auth");
    if (!auth) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode<MyJwtPayload>(auth);
      if (decoded.updatePassword === false) {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      const auth = cookies.get("auth");
      const updatePassRequest = axios.put(
        API_URL + "/auth/credentials",
        { oldPassword, newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth,
          },
        }
      );
      toast.promise(updatePassRequest, {
        loading: "Saving your new password...",
        success: (data) => {
          setQrUrl(data.data.authenticator.otpauth_url);
          setAuthcode(data.data.authenticator.base32);
          setStep(2);
          return "Your password has been updated successfully.";
        },
        error: (data) => {
          return data.response.data.message;
        },
      });
    } else {
      toast.warning("Passwords do not match.");
    }
  };

  const handleAuthenticatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const auth = cookies.get("auth");
    const authenticatorRequest = axios.post(
      API_URL + "/auth/tOtp",
      { credential: authCode, otp: parseInt(otpCode) },
      { headers: { Authorization: "Bearer " + auth } }
    );
    toast.promise(authenticatorRequest, {
      loading: "Authenticator added successfully...",
      success: () => {
        cookies.remove("auth");
        navigate("/login");
        return "Authenticator added successfully. Please log in again to continue.";
      },
      error: "Failed to add authenticator. Please try again.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              {step === 1 ? (
                <KeyRound className="h-8 w-8 text-blue-500" />
              ) : (
                <QrCode className="h-8 w-8 text-blue-500" />
              )}
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">
            {step === 1 ? "Update Password" : "Setup Authenticator"}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {step === 1
              ? "Create a new password for your account"
              : "Enhance your account security with 2FA"}
          </p>
        </div>

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Old Password
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Re-enter Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleAuthenticatorSubmit}>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={qrUrl} size={200} />
                </div>
              </div>

              <p className="text-sm text-gray-400 text-center">
                Scan this QR code with your authenticator app and enter the code
                below
              </p>

              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Authentication Code
                </label>
                <input
                  id="otpCode"
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  pattern="\d{6}"
                  className="block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 6-digit code"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Finish Setup
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
