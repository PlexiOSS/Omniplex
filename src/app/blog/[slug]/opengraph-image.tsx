import { ImageResponse } from "next/og";
import { blogs } from "@/lib/api";
import { toOgImageSrc } from "@/lib/og/image";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgBrand,
  OgFrame,
  og,
  ogClamp,
} from "@/lib/og/shared";
import { formatRelativeTime } from "@/lib/utils/format";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await blogs.getPost(slug).catch(() => null);

  const title = ogClamp(post?.title ?? "Blog", 90);
  const description = ogClamp(
    post?.description ?? "Read the latest from Omniplex.",
    150,
  );
  const authorAvatar = await toOgImageSrc(post?.author?.avatar);

  return new ImageResponse(
    <OgFrame>
      <OgBrand />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
          flex: 1,
          maxWidth: 980,
        }}
      >
        {post && post.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {post.tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  background: og.border,
                  color: og.muted,
                  borderRadius: 9999,
                  padding: "5px 14px",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        <span
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: og.fg,
            letterSpacing: "-1.5px",
            lineHeight: 1.15,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </span>

        <span
          style={{
            fontSize: 24,
            color: og.muted,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </span>
      </div>

      {/* Author + date */}
      {post?.author && (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {authorAvatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorAvatar}
              width={48}
              height={48}
              style={{ borderRadius: "50%" }}
              alt=""
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: og.fg }}>
              {post.author.display_name || post.author.username}
            </span>
            <span style={{ fontSize: 15, color: og.dim }}>
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
      )}
    </OgFrame>,
    { ...size },
  );
}
