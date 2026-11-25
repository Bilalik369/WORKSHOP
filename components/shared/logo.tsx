import Image from "next/image";
import logo from "@/public/logo-usms-esef.png";
import { cn } from "@/lib/utils";

/** Logo officiel USMS — ESEF (fichier : public/logo-usms-esef.png). */
export function Logo({
  alt,
  className,
  priority = false,
}: {
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt={alt}
      priority={priority}
      sizes="(min-width: 640px) 120px, 90px"
      className={cn("h-12 w-auto", className)}
    />
  );
}
