import { ImageResponse } from "next/og";

export const alt = "MOOR SPICE — 毎日の料理に、イタリアの風を。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f3ea",
        color: "#8f201c",
        position: "relative"
      }}
    >
      <div style={{ position: "absolute", inset: 32, border: "2px solid #b18a45", opacity: 0.7 }} />
      <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 18 }}>
        <div style={{ fontFamily: "serif", fontSize: 92, letterSpacing: 20 }}>MOOR SPICE</div>
        <div style={{ width: 150, height: 2, background: "#b18a45" }} />
        <div style={{ color: "#4b512b", fontSize: 27, letterSpacing: 6 }}>毎日の料理に、イタリアの風を。</div>
      </div>
    </div>,
    size
  );
}
