import Image from "next/image";

export function Logo({ src, alt, className = "h-7 w-auto" }: { src: string; alt: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={162}
      height={33}
      className={className}
      priority
    />
  );
}
