import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FrontPage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#fdf2f2",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 64,
        fontWeight: 700,
        color: "#0f0f0f",
      }}
    >
      FrontPage
    </div>
  );
}