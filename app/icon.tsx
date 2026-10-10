import { ImageResponse } from "next/og";

// Route segment config
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Brand app icon: teal rounded square with a saffron underline accent
// and a white "N" glyph. Kept in sync with the app theme color.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(135deg, #0D7377 0%, #14a0a5 100%)",
          borderRadius: 112,
        }}
      >
        <div
          style={{
            fontSize: 320,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "sans-serif",
            lineHeight: 1,
            marginTop: -24,
          }}
        >
          N
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 128,
            width: 150,
            height: 20,
            borderRadius: 10,
            background: "#F4A261",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
