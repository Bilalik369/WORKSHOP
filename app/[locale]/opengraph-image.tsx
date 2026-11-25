import { ImageResponse } from "next/og";

/**
 * Image de partage (WhatsApp, Facebook, LinkedIn…), générée dans le style
 * de l'affiche. Le texte reste en français : c'est la langue principale
 * et le rendu de l'arabe n'est pas fiable dans ce générateur d'images.
 */
export const alt =
  "Workshop « L’Intelligence Artificielle au Service de l’Éducation Marocaine » — 2 janvier 2027, ESEF Beni Mellal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0a2a8c";

/**
 * Charge Plus Jakarta Sans depuis Google Fonts (graisses 300, 600 et 800).
 * En cas d'échec réseau, l'image est générée avec la police par défaut.
 */
async function loadFonts() {
  const weights = [300, 600, 800] as const;
  try {
    return await Promise.all(
      weights.map(async (weight) => {
        const css = await fetch(
          `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}`,
          { signal: AbortSignal.timeout(6000) },
        ).then((response) => response.text());
        const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
        if (!url) throw new Error("font url not found");
        const data = await fetch(url, { signal: AbortSignal.timeout(8000) }).then((response) =>
          response.arrayBuffer(),
        );
        return { name: "Plus Jakarta Sans", data, weight, style: "normal" as const };
      }),
    );
  } catch {
    return undefined;
  }
}

export default async function OpenGraphImage() {
  const fonts = await loadFonts();
  // Petit réseau de neurones décoratif (positions fixes).
  const nodes = [
    [70, 60], [150, 30], [230, 70], [110, 130], [200, 150], [280, 130],
    [60, 200], [150, 220], [250, 230], [320, 60], [330, 200], [190, 290],
  ];
  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5],
    [3, 6], [3, 7], [4, 7], [4, 8], [5, 8], [6, 7], [7, 8], [2, 9], [5, 9],
    [5, 10], [8, 10], [7, 11], [8, 11],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #f5f7ff 0%, #eef1ff 50%, #f3eeff 100%)",
          fontFamily: fonts ? "Plus Jakarta Sans" : "sans-serif",
        }}
      >
        {/* Halo et réseau, à droite */}
        <div
          style={{
            position: "absolute",
            right: -80,
            top: 60,
            width: 560,
            height: 560,
            borderRadius: 560,
            background: "radial-gradient(circle, #cfe0ff 0%, #dcd9ff 55%, rgba(233,228,255,0) 72%)",
            display: "flex",
          }}
        />
        <svg
          width="400"
          height="330"
          viewBox="0 0 400 330"
          style={{ position: "absolute", right: 70, top: 150 }}
        >
          {edges.map(([a, b], index) => (
            <line
              key={index}
              x1={nodes[a][0]}
              y1={nodes[a][1]}
              x2={nodes[b][0]}
              y2={nodes[b][1]}
              stroke="#5b8def"
              strokeWidth="2"
              opacity="0.55"
            />
          ))}
          {nodes.map(([x, y], index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={index % 3 === 0 ? 11 : 8}
              fill={index % 4 === 0 ? "#3cc6b8" : "#ffffff"}
              stroke="#5b8def"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "46px 70px",
            width: 900,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              height: 46,
              lineHeight: 1,
              border: "2px solid #9db9f5",
              borderRadius: 999,
              padding: "0 26px",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 6,
              color: NAVY,
              background: "rgba(255,255,255,0.7)",
            }}
          >
            WORKSHOP
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 22,
              lineHeight: 1.08,
            }}
          >
            <div style={{ display: "flex", fontSize: 74, fontWeight: 800, color: NAVY }}>
              L’Intelligence
            </div>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 800, color: NAVY }}>
              Artificielle
            </div>
            <div style={{ display: "flex", fontSize: 46, fontWeight: 300, color: NAVY, marginTop: 4 }}>
              au Service de
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 58,
                fontWeight: 600,
                color: "#17a58c",
                marginTop: 2,
              }}
            >
              l’Éducation Marocaine
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                width: 130,
                height: 5,
                borderRadius: 5,
                background: "linear-gradient(90deg, #5b8def, #a99bf0)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#5b8def",
                marginLeft: 14,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 22 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: NAVY }}>
              Samedi 2 janvier 2027 · 09h30 – 15h30
            </div>
            <div style={{ display: "flex", fontSize: 25, fontWeight: 600, color: "#2f3c6b", marginTop: 6 }}>
              ESEF Beni Mellal — Université Sultan Moulay Slimane
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 70,
            bottom: 30,
            display: "flex",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 4,
            color: NAVY,
          }}
        >
          ENSEMBLE POUR UNE ÉDUCATION AUGMENTÉE · ENTRÉE GRATUITE
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
