import { LoginForm } from "@/components/Auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reset Password | EVJoints Admin",
    description: "Set a new password for your account",
};

export default function ResetPasswordPage() {
    return <LoginForm initialMode="RESET_PASSWORD" />;
}
