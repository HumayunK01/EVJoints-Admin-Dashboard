import { LoginForm } from "@/components/Auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password | EVJoints Admin",
    description: "Recover your account access",
};

export default function ForgotPasswordPage() {
    return <LoginForm initialMode="FORGOT_PASSWORD" />;
}
