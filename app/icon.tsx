import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Tide app mark — coral-to-blue gradient tile with a single white 4-pointed
 * sparkle. Same brand mark used on /login. Next.js renders this through
 * Satori at build/request time and serves it as the favicon.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FF6B4A 0%, #007AFF 100%)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2 Q13 11 22 12 Q13 13 12 22 Q11 13 2 12 Q11 11 12 2 Z" />
        </svg>
      </div>
    ),
    size,
  );
}
