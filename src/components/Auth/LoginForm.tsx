"use client";

import React, { useState } from "react";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { login, registerVendor, sendVendorOtp, verifyVendorOtp, VendorRegistrationData } from "@/lib/api";
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, Phone, User, Calendar, Building, Globe, Briefcase, Hash, AlertCircle, ArrowLeft } from "lucide-react";

export const LoginForm = ({ initialMode }: { initialMode?: "LOGIN" | "SIGNUP" }) => {
    const router = useRouter();

    const [mode, setMode] = useState<"LOGIN" | "SIGNUP">(initialMode || "LOGIN");
    const [loginStep, setLoginStep] = useState<"CREDENTIALS" | "OTP">("CREDENTIALS");
    const [signupStep, setSignupStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Auth States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [otp, setOtp] = useState("");
    const [vendorId, setVendorId] = useState<number | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Registration Data Object
    const [regData, setRegData] = useState<VendorRegistrationData>({
        name: "",
        date_of_birth: "",
        email: "",
        mobile: "",
        pan: "",
        gst_no: "",
        area: 0,
        business_type: "",
        business_url: "",
        business_mobile: "",
        business_email: ""
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await sendVendorOtp(mobile, email);

            // Backend returns { status: 1, message: "...", result: { customer_id, otp_id } }
            if (response.status === 1 || response.success === true) {
                const vendorId = response.result?.customer_id || response.vendor_id || null;
                setVendorId(vendorId);
                setLoginStep("OTP");
                setSuccessMessage(response.message || "OTP sent successfully");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(response.message || "Failed to send OTP");
                setTimeout(() => setError(""), 3000);
            }
        } catch (err: any) {
            setError(err.message || "Login request failed.");
            setTimeout(() => setError(""), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId) {
            setError("Session expired. Please try again.");
            setTimeout(() => setError(""), 3000);
            setLoginStep("CREDENTIALS");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await verifyVendorOtp(mobile, vendorId, otp);

            // Backend returns { status: 1, message: "...", result: { token, user } }
            if (response.status === 1 || response.success === true) {
                const token = response.result?.token || response.token || 'authenticated';
                const user = response.result?.user || response.user;

                document.cookie = `auth_token=${token}; path=/; max-age=86400`;

                // Store user data with vendor ID for API calls
                const userData = {
                    id: vendorId, // Use the vendor ID from send OTP step
                    ...user
                };

                localStorage.setItem("user", JSON.stringify(userData));

                router.replace("/");
            } else {
                setError(response.message || "Invalid OTP");
                setTimeout(() => setError(""), 3000);
            }
        } catch (err: any) {
            setError(err.message || "Verification failed.");
            setTimeout(() => setError(""), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await registerVendor(regData);
            if (response.success) {
                setSuccessMessage(response.message || "Registration successful! Redirecting to login...");

                // Reset form data
                setRegData({
                    name: "",
                    date_of_birth: "",
                    email: "",
                    mobile: "",
                    pan: "",
                    gst_no: "",
                    area: 0,
                    business_type: "",
                    business_url: "",
                    business_mobile: "",
                    business_email: ""
                });

                // Reset stepper
                setSignupStep(1);

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    setSuccessMessage("");
                    toggleMode("LOGIN");
                }, 2000);
            } else {
                setError(response.message || "Registration failed");
                setTimeout(() => setError(""), 3000);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
            setTimeout(() => setError(""), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        setError("");
        if (signupStep === 1) {
            if (!regData.name.trim() || !regData.date_of_birth || !regData.email.trim() || regData.mobile.length < 10) {
                setError("Complete all profile details before proceeding.");
                setTimeout(() => setError(""), 3000);
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regData.email)) {
                setError("Enter a valid email address.");
                setTimeout(() => setError(""), 3000);
                return;
            }
        } else if (signupStep === 2) {
            if (!regData.pan || regData.pan.length < 10 || !regData.gst_no || regData.gst_no.length < 15 || !regData.area) {
                setError("Please provide valid identity documentation.");
                setTimeout(() => setError(""), 3000);
                return;
            }
        }
        setSignupStep(prev => prev + 1);
    };
    const prevStep = () => setSignupStep(prev => prev - 1);

    const toggleMode = (newMode: typeof mode) => {
        setMode(newMode);
        setLoginStep("CREDENTIALS");
        setSignupStep(1);
        setError("");
        setSuccessMessage("");
        setPassword("");
        setResetCode("");
        setMobile("");
        setOtp("");
        setVendorId(null);

        if (newMode === "LOGIN") router.push("/login");
    };

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-[#020d1a]">
            <VisualBranding />

            <div className="flex w-full items-center justify-center p-6 sm:p-8 md:p-10 lg:w-1/2">
                <div className="w-full max-w-[400px] sm:max-w-[420px]">
                    <div className="mb-8 lg:hidden text-center">
                        <Logo className="mx-auto h-12 w-48" src="/images/logo/logo.svg" />
                    </div>

                    <header className="mb-6 sm:mb-8 text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white mx-auto">
                            {mode === "LOGIN" && "Admin Access"}
                            {mode === "SIGNUP" && "Join the Network"}

                        </h1>
                    </header>

                    <main>
                        {error && <FormErrorMessage message={error} />}
                        {successMessage && (
                            <div className="mb-4 rounded-xl bg-green-500/10 p-4 text-sm font-medium text-green-600 border border-green-500/20 animate-in fade-in duration-300">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-4">
                            {mode === "LOGIN" && (
                                <>
                                    {loginStep === "CREDENTIALS" ? (
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <TextField
                                                label="Email Address"
                                                type="email"
                                                placeholder="vendor@evjoints.com"
                                                value={email}
                                                onChange={(e: any) => setEmail(e.target.value)}
                                                icon={<Mail size={18} />}
                                                required
                                            />
                                            <TextField
                                                label="Mobile Number"
                                                type="tel"
                                                placeholder="98765 43210"
                                                value={mobile}
                                                onChange={(e: any) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                icon={<Phone size={18} />}
                                                required
                                            />
                                            <SubmitButton isLoading={isLoading} label="Send OTP" />
                                        </form>
                                    ) : (
                                        <form onSubmit={handleLoginVerify} className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                            <TextField
                                                label="Enter OTP"
                                                type="text"
                                                placeholder="0 0 0 0"
                                                value={otp}
                                                onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                icon={<ShieldCheck size={18} />}
                                                className="tracking-[0.5em] text-center font-semibold text-lg"
                                                required
                                            />
                                            <div className="flex flex-col gap-3">
                                                <SubmitButton isLoading={isLoading} label="Verify & Login" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLoginStep("CREDENTIALS");
                                                        setOtp("");
                                                        setVendorId(null);
                                                    }}
                                                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors py-2"
                                                >
                                                    <ArrowLeft size={16} />
                                                    Change Details
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}



                            {mode === "SIGNUP" && (
                                <div className="space-y-4">
                                    {/* Stepper Indicator */}
                                    <div className="flex items-center justify-between mb-8 px-4 relative">
                                        <div className="absolute top-[18px] left-10 right-10 h-0.5 bg-gray-100 dark:bg-gray-800 -z-0" />
                                        <div
                                            className="absolute top-[18px] left-10 h-0.5 bg-primary transition-all duration-500 ease-in-out -z-0"
                                            style={{ width: signupStep === 1 ? '0%' : signupStep === 2 ? '42%' : '84%' }}
                                        />
                                        {[
                                            { step: 1, label: "Profile" },
                                            { step: 2, label: "Identity" },
                                            { step: 3, label: "Business" }
                                        ].map((s) => (
                                            <div key={s.step} className="flex flex-col items-center gap-2 z-10">
                                                <div className={cn(
                                                    "size-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500",
                                                    signupStep === s.step ? "bg-primary text-white scale-110 shadow-[0_0_20px_rgba(34,173,92,0.4)]" :
                                                        signupStep > s.step ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                                )}>
                                                    {signupStep > s.step ? "✓" : s.step}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                                    signupStep >= s.step ? "text-primary" : "text-gray-400"
                                                )}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {signupStep === 1 && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <TextField label="Full Name" type="text" placeholder="John Doe" value={regData.name} onChange={(e: any) => setRegData({ ...regData, name: e.target.value })} icon={<User size={18} />} required />
                                            <TextField label="Date of Birth" type="date" placeholder="YYYY-MM-DD" value={regData.date_of_birth} onChange={(e: any) => setRegData({ ...regData, date_of_birth: e.target.value })} icon={<Calendar size={18} />} required />
                                            <TextField label="Email Address" type="email" placeholder="john@example.com" value={regData.email} onChange={(e: any) => setRegData({ ...regData, email: e.target.value })} icon={<Mail size={18} />} required />
                                            <TextField label="Mobile Number" type="tel" placeholder="98765 43210" value={regData.mobile} onChange={(e: any) => setRegData({ ...regData, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} icon={<Phone size={18} />} required />
                                            <button onClick={nextStep} className="w-full h-11 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 transition-all mt-2">Continue</button>
                                        </div>
                                    )}

                                    {signupStep === 2 && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <TextField label="PAN Number" type="text" placeholder="ABCDE1234F" value={regData.pan} onChange={(e: any) => setRegData({ ...regData, pan: e.target.value.toUpperCase() })} icon={<Hash size={18} />} required />
                                            <TextField label="GST Number" type="text" placeholder="27ABCDE1234F1Z5" value={regData.gst_no} onChange={(e: any) => setRegData({ ...regData, gst_no: e.target.value.toUpperCase() })} icon={<Building size={18} />} required />
                                            <TextField label="Area Coverage (Sq Ft)" type="number" placeholder="500" value={regData.area || ""} onChange={(e: any) => setRegData({ ...regData, area: Number(e.target.value) })} icon={<Hash size={18} />} required />
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={prevStep}
                                                    className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    onClick={nextStep}
                                                    className="flex-[2.5] h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
                                                >
                                                    Continue
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {signupStep === 3 && (
                                        <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <TextField label="Business Type" type="text" placeholder="Retail / Individual" value={regData.business_type} onChange={(e: any) => setRegData({ ...regData, business_type: e.target.value })} icon={<Briefcase size={18} />} required />
                                            <TextField label="Business Website" type="url" placeholder="https://example.com" value={regData.business_url} onChange={(e: any) => setRegData({ ...regData, business_url: e.target.value })} icon={<Globe size={18} />} required />
                                            <TextField label="Business Mobile" type="tel" placeholder="98765 43210" value={regData.business_mobile} onChange={(e: any) => setRegData({ ...regData, business_mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} icon={<Phone size={18} />} required />
                                            <TextField label="Business Email" type="email" placeholder="biz@example.com" value={regData.business_email} onChange={(e: any) => setRegData({ ...regData, business_email: e.target.value })} icon={<Mail size={18} />} required />
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={prevStep}
                                                    className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                                >
                                                    Back
                                                </button>
                                                <div className="flex-[2.5]">
                                                    <SubmitButton isLoading={isLoading} label="Complete Registration" />
                                                </div>
                                            </div>
                                        </form>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => toggleMode("LOGIN")}
                                        className="w-full text-sm font-medium text-gray-500 hover:text-primary transition-colors text-center mt-4"
                                    >
                                        Already have an account? Log in
                                    </button>
                                </div>
                            )}

                            {mode === "LOGIN" && (
                                <>
                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white dark:bg-[#020d1a] px-2 text-gray-500">New here?</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleMode("SIGNUP")}
                                        className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                    >
                                        Set up Vendor Profile
                                    </button>
                                </>
                            )}
                        </div>
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

const TextField = ({ label, icon, className, ...props }: any) => (
    <div className="space-y-2">
        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                {icon}
            </div>
            <input
                {...props}
                className={cn(
                    "h-12 w-full rounded-xl border border-gray-200 bg-white/50 pl-11 pr-4 text-sm sm:text-base text-black outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 dark:border-gray-800 dark:bg-gray-900/50 dark:text-white dark:focus:border-primary",
                    className
                )}
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
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-[400px] rounded-2xl bg-white dark:bg-[#0a1622] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-red-500/20 animate-in slide-in-from-top-8 duration-500 flex items-center gap-4">
        <div className="size-10 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
            <AlertCircle size={22} />
        </div>
        <div className="flex-1">
            <p className="text-sm font-bold text-black dark:text-white">Validation Error</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
        </div>
    </div>
);
