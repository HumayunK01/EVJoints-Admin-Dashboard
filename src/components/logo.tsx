import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-12 w-48">
      <Image
        src="/images/logo/logo.svg"
        fill
        className="object-contain"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
