import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Code2, SquareChevronRight, Webhook } from 'lucide-react';
import { OmniplexLogo } from '@/components/OmniplexLogo';

export const baseOptions: BaseLayoutProps = {
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
      type: 'menu',
      text: 'Documentation',
      url: '/docs',
      items: [
        {
          icon: <Code2 />,
          text: 'API Reference',
          description: 'The Popplio API powering Omniplex.',
          url: '/docs/api-reference',
        },
        {
          icon: <Webhook />,
          text: 'Webhooks',
          description: 'Real time notifications for votes and more.',
          url: '/docs/developer/webhooks',
        },
        {
          icon: <SquareChevronRight />,
          text: 'Discord Bot Commands',
          description: "Slash commands for managing your server's listing.",
          url: '/docs/guides/bot-commands',
        },
      ],
    },
    {
      text: 'Production',
      url: 'https://omniplex.gg',
    },
    {
      text: 'Staging',
      url: 'https://reedwhisker.omniplex.gg',
    },
    {
      text: 'GitHub Repository',
      url: 'https://github.com/PlexiOSS'
    }
  ],
};
