import Link from "next/link";
import { BsDiscord, BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { SOCIAL_LINKS } from "@/lib/social";
import { Container } from "./Container";

const FOOTER_LINKS = [
  {
    heading: "Discover",
    links: [
      { href: "/bots", label: "View Bots" },
      { href: "/servers", label: "View Servers" },
      { href: "/packs", label: "View Packs" },
      { href: "/emojis", label: "Emojis" },
      { href: "/stickers", label: "Stickers" },
      { href: "/templates", label: "Templates" },
      { href: "/search", label: "Discovery" },
    ],
  },
  {
    heading: "Documentation",
    links: [
      {
        href: "https://docs.omniplex.gg/docs/api-reference",
        label: "API Reference",
      },
      { href: "https://docs.omniplex.gg/docs#faq", label: "Frequently Asked" },
      { href: "https://docs.omniplex.gg/docs/guides", label: "User Guides" },
      {
        href: "https://docs.omniplex.gg/docs/api-reference/rate-limits",
        label: "Rate Limits",
      },
      {
        href: "https://docs.omniplex.gg/docs/api-reference/webhooks",
        label: "Webhooks",
      },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "https://status.omniplex.gg", label: "System Status" },
      { href: "/about/moderation", label: "Moderation Stats" },
      { href: "/partners", label: "Our Partners" },
      { href: "/about/team", label: "Our Team" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal", label: "All Policies" },
      { href: "/legal/acceptable-use", label: "Acceptable Usage" },
      { href: "/legal/service-agreement", label: "Service Agreement" },
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
    ],
  },
];

/**
 * Footer component that displays links and information at the bottom of the page.
 * @returns {JSX.Element} The rendered footer component.
 */
export function Footer() {
  return (
    <footer className="py-12 mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <Container>
        <div className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50">
          <OmniplexLogo size={22} />
          <span className="font-semibold">Omniplex</span>
        </div>
        <p className="max-w-sm mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The best place to find Discord bots and servers.
        </p>

        <div className="grid grid-cols-2 gap-8 mt-10 sm:grid-cols-4">
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {heading}
              </p>
              <ul className="mt-3 space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    {href.startsWith("http") ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm transition-colors text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm transition-colors text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col-reverse items-center gap-4 pt-6 mt-10 border-t border-zinc-200 dark:border-zinc-800 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            © 2021–{new Date().getFullYear()}{" "}
            <a
              href="https://nodebyte.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600 dark:hover:text-zinc-400"
            >
              NodeByte LTD
            </a>
            . Not affiliated with Discord.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-50"
              aria-label="Omniplex on Instagram"
            >
              <BsInstagram size={17} />
            </a>
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-50"
              aria-label="Omniplex on X"
            >
              <BsTwitter size={17} />
            </a>
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-50"
              aria-label="Omniplex on GitHub"
            >
              <BsGithub size={17} />
            </a>
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-50"
              aria-label="Omniplex on Discord"
            >
              <BsDiscord size={17} />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
