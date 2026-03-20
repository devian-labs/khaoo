"use client";

import { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Smartphone, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Setup reCAPTCHA verifier on component mount
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response: any) => {
          // reCAPTCHA solved
        },
      });
    }
  }, []);

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please check the number.");
      // reset reCAPTCHA if failed
      if (window.recaptchaVerifier) window.recaptchaVerifier.render();
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setLoading(true);
    setError("");

    try {
      await confirmationResult.confirm(otp);
      // Successfully authenticated
      router.push("/dashboard"); // Or wherever the vendor should go
    } catch (err: any) {
      setError("Invalid OTP code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 font-sans">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl ring-1 ring-zinc-200 dark:ring-white/10 relative">
        <div id="recaptcha-container"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500 inline-block mb-2">
            Khaoo Vendors
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {step === "PHONE" ? "Login or create an account" : "Enter the code sent to your phone"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {step === "PHONE" ? (
          <form onSubmit={requestOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="tel"
                  id="phone"
                  required
                  placeholder="Enter 10-digit number"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-zinc-400"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md mt-4"
            >
              {loading ? "Sending..." : "Send OTP"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  id="otp"
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all tracking-widest text-center text-xl placeholder:text-zinc-400"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md mt-4"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setStep("PHONE")}
                className="text-xs text-orange-600 hover:text-orange-500 font-medium"
              >
                Change phone number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
