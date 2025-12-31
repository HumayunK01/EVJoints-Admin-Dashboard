import type { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#020D1A]">
            {/* Background Decorative Elements - Only visible if children don't cover them */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />

                {/* Technical Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, #22AD5C 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
}
