import { BookOpen, FileText, Globe, LifeBuoy, Shield } from "lucide-react";
import { DiscordIcon, GithubIcon, XIcon } from "./BrandIcons";

interface LinkIconProps {
  name: string;
  href: string;
  size?: number;
  className?: string;
}

function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function LinkIcon({ name, href, size = 14, className }: LinkIconProps) {
  const host = hostOf(href);
  const label = name.toLowerCase();

  if (host === "github.com" || host.endsWith(".github.io"))
    return <GithubIcon size={size} className={className} />;
  if (
    host === "discord.gg" ||
    host === "discord.com" ||
    host === "discordapp.com"
  )
    return <DiscordIcon size={size} className={className} />;
  if (host === "x.com" || host === "twitter.com")
    return <XIcon size={size} className={className} />;
  if (
    label.includes("doc") ||
    label.includes("wiki") ||
    label.includes("guide")
  )
    return <BookOpen size={size} className={className} />;
  if (label.includes("support") || label.includes("help"))
    return <LifeBuoy size={size} className={className} />;
  if (label.includes("privacy") || label.includes("security"))
    return <Shield size={size} className={className} />;
  if (label.includes("terms") || label.includes("tos"))
    return <FileText size={size} className={className} />;
  return <Globe size={size} className={className} />;
}
