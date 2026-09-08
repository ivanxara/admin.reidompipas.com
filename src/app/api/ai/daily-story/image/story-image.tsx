import type { StoryMenuItem } from "../story";

type DailyStoryImageProps = {
  dateLabel: string;
  logoUrl: string;
  normalItems: StoryMenuItem[];
  specialItems: StoryMenuItem[];
};

const colors = {
  brand: "#F59F0A",
  light: "#F4EFE5",
  dark: "#322D29",
};

export function DailyStoryImage({
  dateLabel,
  logoUrl,
  normalItems,
  specialItems,
}: DailyStoryImageProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "160px 112px 220px",
        backgroundColor: colors.dark,
        color: colors.light,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          color: colors.brand,
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Menu Executivo
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
          color: colors.light,
          fontSize: 58,
          fontWeight: 700,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {dateLabel}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 64,
        }}
      >
        {normalItems.map((item) => (
          <div
            key={item.id}
            style={{ display: "flex", fontSize: 42, lineHeight: 1.2 }}
          >
            {item.name}
          </div>
        ))}
      </div>

      {specialItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              height: 2,
              margin: "48px 16px",
              backgroundColor: colors.light,
              opacity: 0.75,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill={colors.brand}
              stroke={colors.brand}
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ fontSize: 48, fontWeight: 700 }}>Especiais</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 32,
            }}
          >
            {specialItems.map((item) => (
              <div
                key={item.id}
                style={{ display: "flex", fontSize: 42, lineHeight: 1.2 }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          width: 1080,
          boxSizing: "border-box",
          padding: "24px 112px",
          backgroundColor: colors.light,
          color: colors.dark,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 32, fontWeight: 600, textTransform: "uppercase" }}>
            Reservas &amp; Take-away
          </span>
          <span style={{ fontSize: 32, textTransform: "uppercase" }}>
            912040915 / 256386200
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="Rei Dom Pipas"
          width={80}
          height={80}
          style={{ marginLeft: "auto" }}
        />
      </div>
    </div>
  );
}
