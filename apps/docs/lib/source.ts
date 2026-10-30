import { loader } from "fumadocs-core/source";
import { docs } from "@/.source/server";
import { openapi } from "@/lib/openapi";

export const source = loader(
  {
    docs: docs.toFumadocsSource(),
    openapi: await openapi.staticSource({
      per: "tag",
      baseDir: "api-reference",
    }),
  },
  {
    baseUrl: "/docs",
    plugins: [openapi.loaderPlugin()],
  },
);

export function getPageImageUrl(page: { slugs: string[] }) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}
