import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";
import "@/resources/custom.css";

import classNames from "classnames";
import { Background, Column, Flex, opacity, SpacingToken } from "@once-ui-system/core";
import { AppChrome, Providers } from "@/components";
import { baseURL, dataStyle, effects, fonts, person, social, style } from "@/resources";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoxiq",
  description:
    "Hoxiq is a Discord bot platform for Full Suite installs, focused bots, and operator controls.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/hoxic-icon.png",
  },
  metadataBase: new URL(baseURL),
  openGraph: {
    title: "Hoxiq",
    description: "Run Full Suite or focused Discord bots with one control plane for provisioning and operator controls.",
    url: baseURL,
    siteName: "Hoxiq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoxiq",
    description: "Discord bot provisioning and controls in one platform.",
  },
  alternates: {
    canonical: baseURL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: person.name,
    url: baseURL,
    applicationCategory: "BusinessApplication",
    sameAs: social.map(item => item.link).filter(link => link.startsWith("http")),
    description:
      "Hoxiq is a Discord bot platform with Full Suite installs, focused bots, and operator controls.",
    publisher: {
      "@type": "Organization",
      name: "Hoxiq",
    },
    operatingSystem: "Web",
    featureList: [
      "Discord OAuth admin access",
      "Multi-bot fleet control",
      "Templates and per-bot overrides",
      "Runtime health and worker telemetry",
      "Tickets, moderation, reminders, AI, webhooks",
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={classNames(
        fonts.heading.variable,
        fonts.body.variable,
        fonts.label.variable,
        fonts.code.variable,
      )}
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const root = document.documentElement;
                  const config = ${JSON.stringify({
                    brand: style.brand,
                    accent: style.accent,
                    neutral: style.neutral,
                    solid: style.solid,
                    "solid-style": style.solidStyle,
                    border: style.border,
                    surface: style.surface,
                    transition: style.transition,
                    scaling: style.scaling,
                    "viz-style": dataStyle.variant,
                  })};
                  Object.entries(config).forEach(([key, value]) => {
                    root.setAttribute("data-" + key, value);
                  });
                  localStorage.setItem("data-theme", "dark");
                  root.setAttribute("data-theme", "dark");
                } catch (e) {
                  console.error("Theme initialization failed:", e);
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
          <Column background="page" fillWidth style={{ minHeight: "100vh" }} margin="0" padding="0" horizontal="center">
            <Background
              position="fixed"
              mask={{
                x: effects.mask.x,
                y: effects.mask.y,
                radius: effects.mask.radius,
                cursor: effects.mask.cursor,
              }}
              gradient={{
                display: effects.gradient.display,
                opacity: effects.gradient.opacity as opacity,
                x: effects.gradient.x,
                y: effects.gradient.y,
                width: effects.gradient.width,
                height: effects.gradient.height,
                tilt: effects.gradient.tilt,
                colorStart: effects.gradient.colorStart,
                colorEnd: effects.gradient.colorEnd,
              }}
              dots={{
                display: effects.dots.display,
                opacity: effects.dots.opacity as opacity,
                size: effects.dots.size as SpacingToken,
                color: effects.dots.color,
              }}
              grid={{
                display: effects.grid.display,
                opacity: effects.grid.opacity as opacity,
                color: effects.grid.color,
                width: effects.grid.width,
                height: effects.grid.height,
              }}
              lines={{
                display: effects.lines.display,
                opacity: effects.lines.opacity as opacity,
                size: effects.lines.size as SpacingToken,
                thickness: effects.lines.thickness,
                angle: effects.lines.angle,
                color: effects.lines.color,
              }}
            />
            <AppChrome>{children}</AppChrome>
          </Column>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
