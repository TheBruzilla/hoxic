import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import { home, person } from "./content";

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

const routes = {
  "/": true,
  "/docs": true,
  "/pricing": true,
  "/add-bot": true,
  "/login": true,
  "/app": true,
  "/app/servers": true,
};

const display = {
  location: false,
  time: false,
  themeSwitcher: false,
};

const protectedRoutes = {};

const heading = Ubuntu({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});
const body = Ubuntu({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});
const label = Ubuntu({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});
const code = Ubuntu_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const fonts = { heading, body, label, code };

const style = {
  theme: "dark",
  neutral: "gray",
  brand: "cyan",
  accent: "cyan",
  solid: "color",
  solidStyle: "flat",
  border: "rounded",
  surface: "translucent",
  transition: "all",
  scaling: "100",
};

const dataStyle = {
  variant: "gradient",
  mode: "categorical",
  height: 24,
  axis: {
    stroke: "var(--neutral-alpha-weak)",
  },
  tick: {
    fill: "var(--neutral-on-background-weak)",
    fontSize: 11,
    line: false,
  },
};

const effects = {
  mask: { cursor: true, x: 50, y: 0, radius: 100 },
  gradient: {
    display: true,
    opacity: 90,
    x: 50,
    y: 0,
    width: 50,
    height: 50,
    tilt: 0,
    colorStart: "accent-background-strong",
    colorEnd: "static-transparent",
  },
  dots: {
    display: true,
    opacity: 20,
    size: "2",
    color: "brand-on-background-weak",
  },
  grid: {
    display: false,
    opacity: 100,
    color: "neutral-alpha-medium",
    width: "0.25rem",
    height: "0.25rem",
  },
  lines: {
    display: false,
    opacity: 100,
    color: "neutral-alpha-medium",
    size: "16",
    thickness: 1,
    angle: 90,
  },
};

const mailchimp = { effects };

const schema = {
  logo: "/hoxic-icon.png",
  type: "Organization",
  name: person.name,
  description: home.description,
  email: person.email,
};

const sameAs = {};

const theme = {
  tokens: {
    color: {
      light: {
        neutral: {
          weak: "#444444",
          weaker: "#666666",
          medium: "#2f2f2f",
          onBackground: "#1a1a1a",
        },
        brand: {
          weak: "#79dcff",
          onBackground: "#2ebff0",
        },
        accent: {
          weak: "#79dcff",
        },
        surface: {
          background: "#ffffff",
          card: "rgba(245,245,245,0.92)",
          border: "rgba(0,0,0,0.08)",
          overlay: "rgba(0,0,0,0.03)",
        },
      },
      dark: {},
    },
  },
};

export {
  display,
  mailchimp,
  routes,
  protectedRoutes,
  baseURL,
  fonts,
  style,
  schema,
  sameAs,
  effects,
  dataStyle,
  theme,
};
