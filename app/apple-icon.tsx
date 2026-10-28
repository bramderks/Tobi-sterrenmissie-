import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 38, background: "linear-gradient(180deg,#14a8ff 0%,#0756a8 52%,#41c72a 53%,#087d24 100%)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 19, width: 132, height: 132, borderRadius: 100, background: "radial-gradient(circle at 35% 25%,#fff 0%,#eef3f7 42%,#8b9bad 100%)", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#152236", fontSize: 78, fontWeight: 900 }}>⚽</div>
      <div style={{ position: "absolute", top: 57, left: 28, width: 124, height: 90, display: "flex", alignItems: "center", justifyContent: "center", color: "#42f21d", fontSize: 112, fontWeight: 900, lineHeight: 1, textShadow: "0 5px 0 #00551b, 3px 3px 0 #fff, -3px -3px 0 #fff" }}>T</div>
    </div>,
    { ...size }
  );
}