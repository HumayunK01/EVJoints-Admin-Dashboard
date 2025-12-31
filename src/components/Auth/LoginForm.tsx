"use client";

import React, { useState } from "react";
import { Loader2, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { sendOtp, verifyOtp } from "@/lib/api";

export const LoginForm = () => {
    const router = useRouter();

    const [step, setStep] = useState<"MOBILE" | "OTP">("MOBILE");
    const [isLoading, setIsLoading] = useState(false);
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mobile.length < 10) {
            setError("Please enter a valid 10-digit mobile number");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await sendOtp(mobile);
            if (response.success) {
                setStep("OTP");
            } else {
                setError(response.message || "Failed to send OTP");
            }
        } catch (err: any) {
            setError(err.message || "Connection failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 4) {
            setError("Please enter the 4-digit OTP");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await verifyOtp(mobile, otp);

            if (response.success) {
                document.cookie = `auth_token=${response.token || 'true'}; path=/; max-age=86400`;

                if (response.user) {
                    localStorage.setItem("user", JSON.stringify(response.user));
                }

                router.replace("/");
            } else {
                setError(response.message || "Invalid OTP");
            }
        } catch (err: any) {
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-[#020d1a]">
            <VisualBranding />

            <div className="flex w-full items-center justify-center p-6 sm:p-10 md:p-16 lg:w-1/2">
                <div className="w-full max-w-[400px] sm:max-w-[420px]">
                    <div className="mb-12 lg:hidden text-center">
                        <Logo className="mx-auto h-12 w-48" src="/images/logo/logo.svg" />
                    </div>

                    <header className="mb-8 sm:mb-10">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
                            {step === "MOBILE" ? "Admin Access" : "Verify OTP"}
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            {step === "MOBILE"
                                ? "Connect with your registered mobile number."
                                : `We've sent a code to +91 ${mobile.replace(/(\d{5})(\d{5})/, "$1 $2")}`}
                        </p>
                    </header>

                    <main>
                        {error && <FormErrorMessage message={error} />}

                        {step === "MOBILE" ? (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <TextField
                                    label="Mobile Number"
                                    type="tel"
                                    placeholder="98765 43210"
                                    value={mobile}
                                    onChange={(e: any) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    icon={<Phone size={18} />}
                                    required
                                />
                                <SubmitButton isLoading={isLoading} label="Send Verification Code" />
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                <TextField
                                    label="Verification Code"
                                    type="text"
                                    placeholder="0 0 0 0"
                                    value={otp}
                                    onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    icon={<ShieldCheck size={18} />}
                                    required
                                />

                                <div className="flex flex-col gap-4">
                                    <SubmitButton isLoading={isLoading} label="Access Dashboard" />

                                    <button
                                        type="button"
                                        onClick={() => { setStep("MOBILE"); setError(""); setOtp(""); }}
                                        className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors py-2"
                                    >
                                        <ArrowLeft size={16} />
                                        Change Mobile Number
                                    </button>
                                </div>
                            </form>
                        )}
                    </main>

                </div>
            </div>
        </div>
    );
};

const VisualBranding = () => (
    <div className="relative hidden w-1/2 overflow-hidden lg:block bg-[#020d1a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#22AD5C_0%,transparent_70%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,#22AD5C_0%,transparent_70%)] opacity-10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #22AD5C 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex h-full items-center justify-center p-16">
            <div className="absolute h-64 w-64 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <Logo className="h-28 w-80 relative" src="/images/logo/logo-white.svg" />
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="h-px w-8 bg-white/10" />
            <p className="text-[10px] font-bold text-white/40 tracking-[0.5em] uppercase">EVJoints Portal</p>
            <div className="h-px w-8 bg-white/10" />
        </div>
    </div>
);

const TextField = ({ label, icon, ...props }: any) => (
    <div className="space-y-2">
        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                {icon}
            </div>
            <input
                {...props}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white/50 pl-11 pr-4 text-sm sm:text-base text-black outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 dark:border-gray-800 dark:bg-gray-900/50 dark:text-white dark:focus:border-primary"
            />
        </div>
    </div>
);

const SubmitButton = ({ isLoading, label }: { isLoading: boolean, label: string }) => (
    <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white transition-all hover:bg-primary/95 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-primary/20"
    >
        {isLoading ? <Loader2 className="animate-spin" size={20} /> : label}
    </button>
);

const FormErrorMessage = ({ message }: { message: string }) => (
    <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-600 border border-red-500/20 animate-in fade-in zoom-in duration-300">
        {message}
    </div>
);
