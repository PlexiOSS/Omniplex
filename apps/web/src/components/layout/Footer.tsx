import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import Link from "next/link";
import { BsDiscord, BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";
import { SOCIAL_LINKS } from "@/lib/social";
import { Container } from "./Container";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/bots", label: "Bots" },
      { href: "/servers", label: "Servers" },
      { href: "/shop/premium", label: "Premium" },
      { href: "/shop/auto-vote", label: "Auto-vote" },
      { href: "/bots/add", label: "Add your bot" },
      { href: "/alternatives", label: "Compare bot lists" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/kb", label: "Knowledge Base" },
      { href: "https://docs.omniplex.gg", label: "Developer docs" },
      { href: "/changelog", label: "Changelog" },
      { href: "/blog", label: "Blog" },
      { href: "https://status.omniplex.gg", label: "Status" },
      { href: "/brand", label: "Brand kit" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about/team", label: "Team" },
      { href: "/about/omi", label: "Meet Omi" },
      { href: "/partners", label: "Partners" },
      { href: "/about/stats", label: "Platform stats" },
      { href: "/about/moderation", label: "Transparency" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/service-agreement", label: "Service agreement" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
      { href: "/legal/developer-api", label: "Developer & API" },
      { href: "/legal/dmca", label: "DMCA" },
    ],
  },
];

const SOCIALS = [
  { href: SOCIAL_LINKS.discord, label: "Discord", icon: BsDiscord },
  { href: SOCIAL_LINKS.twitter, label: "X", icon: BsTwitter },
  { href: SOCIAL_LINKS.github, label: "GitHub", icon: BsGithub },
  { href: SOCIAL_LINKS.instagram, label: "Instagram", icon: BsInstagram },
];

const LINK =
  "text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,3fr)] lg:gap-16">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-950 dark:text-zinc-50"
            >
              <OmniplexLogo size={22} />
              <span className="font-semibold tracking-tight">Omniplex</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
              The best place to find Discord bots and servers.
            </p>
            <div className="mt-5 flex items-center gap-1">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Omniplex on ${label}`}
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4"
          >
            {COLUMNS.map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-xs font-semibold tracking-wide text-zinc-950 uppercase dark:text-zinc-50">
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
                          className={LINK}
                        >
                          {label}
                        </a>
                      ) : (
                        <Link href={href} className={LINK}>
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-zinc-200 py-6 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://nodebyte.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            NodeByte LTD
          </a>
          . Not affiliated with Discord.
        </div>
      </Container>
    </footer>
  );
}
