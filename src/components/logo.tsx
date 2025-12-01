import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  imageClassName,
  src = "/images/logo/logo.svg",
}: {
  className?: string;
  imageClassName?: string;
  src?: string;
}) {
  return (
    <div className={cn("relative h-8 w-32", className)}>
      <Image
        src={src}
        fill
        className={cn("object-contain", imageClassName)}
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
