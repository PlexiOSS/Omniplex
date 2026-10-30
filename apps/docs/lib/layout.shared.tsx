import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared";
import {
  Code2,
  Globe,
  Package,
  SquareChevronRight,
  Webhook,
} from "lucide-react";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { OmniplexLogo } from "@/components/OmniplexLogo";

export const linkItems: LinkItemType[] = [
  {
    type: "icon",
    text: "Discord",
    icon: <FaDiscord className="size-4" />,
    url: "https://discord.gg/zmQE9TZF9J",
    label: "Discord",
  },
  {
    type: "icon",
    text: "Twitter / X",
    icon: <FaTwitter className="size-4" />,
    url: "https://twitter.com/InfinityBotList",
    label: "Twitter / X",
  },
];

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: "https://github.com/PlexiOSS",
    nav: {
      title: (
        <>
          <OmniplexLogo size={22} />
          <span className="font-semibold">Omniplex Docs</span>
        </>
      ),
    },
    links: [
      {
        type: "menu",
        text: "Documentation",
        url: "/docs",
        items: [
          {
            icon: <Code2 />,
            text: "API Reference",
            description: "The Popplio API powering Omniplex.",
            url: "/docs/api-reference",
          },
          {
            icon: <Package />,
            text: "SDKs",
            description:
              "Official libraries for JavaScript, Python, Go and Rust.",
            url: "/docs/sdks",
          },
          {
            icon: <Webhook />,
            text: "Developer Docs",
            description: "Guides for building against the Popplio API.",
            url: "/docs/developer",
          },
          {
            icon: <SquareChevronRight />,
            text: "User Guides",
            description:
              "Discord bot commands and other developer-facing guides.",
            url: "/docs/guides",
          },
        ],
      },
      {
        text: "Main Website",
        url: "https://omniplex.gg",
        icon: <Globe />,
      },
      ...linkItems,
    ],
  };
}
