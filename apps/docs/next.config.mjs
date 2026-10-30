import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs/api-reference/a-p-i--tokens",
        destination: "/docs/api-reference/api-tokens",
        permanent: true,
      },
      {
        source: "/docs/api-reference/platform--specific",
        destination: "/docs/api-reference/platform-specific",
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
