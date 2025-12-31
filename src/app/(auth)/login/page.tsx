import { LoginForm } from "@/components/Auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | EVJoints Admin",
    description: "Sign in to manage your EV charging network",
};

export default function LoginPage() {
    return (
        <main className="w-full">
            <LoginForm />
        </main>
    );
}
