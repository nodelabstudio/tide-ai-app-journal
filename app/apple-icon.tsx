import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple Touch Icon — used by iOS Add to Home Screen. Same brand mark as
 * the favicon, scaled up. iOS automatically masks to its own corner radius,
 * so we render the gradient flush to the bezel and skip rounding here.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FF6B4A 0%, #007AFF 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Inner highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "relative", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))" }}
        >
          <path d="M12 2 Q13 11 22 12 Q13 13 12 22 Q11 13 2 12 Q11 11 12 2 Z" />
        </svg>
      </div>
    ),
    size,
  );
}
