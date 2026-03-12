const person = {
  firstName: "Hoxiq",
  lastName: "",
  get name() {
    return "Hoxiq";
  },
  role: "Discord bot platform",
  avatar: "/hoxic-icon.png",
  email: "support@hoxic.com",
  location: "Asia/Kolkata",
  languages: ["English"],
};

const social = [
  {
    name: "Contact",
    link: "mailto:support@hoxic.com",
  },
];

const newsletter = {
  display: false,
  title: "",
  description: "",
  mailchimp: {
    apiKey: "",
    audience: "",
  },
};

const home = {
  path: "/",
  label: "Home",
  title: "Hoxiq",
  description: "HOXiq is a Discord bot platform for moderation, support, onboarding, automation, and multi-bot setup.",
  headline: "Run one Full Suite bot or build a focused bot stack for each server.",
  kicker: "Discord Bot Platform",
  image: "/hoxic-icon.png",
  featured: {
    display: false,
    title: "",
    href: "",
  },
  subline:
    "Provision Full Suite or focused bots, manage operators, and keep runtime visibility in one clean control plane built for Discord communities, support teams, and server admins.",
  stats: [
    { value: "1 Full Suite", label: "Per server option" },
    { value: "4 Focused Bots", label: "Focused bot allowance" },
    { value: "Template Control", label: "Provisioning flow" },
  ],
  topology: [
    {
      label: "Full Suite",
      title: "One managed bot for everything",
      description: "Install the HOXiq-managed main bot when you want one workspace for moderation, support, onboarding, and utilities.",
    },
    {
      label: "Focused Bots",
      title: "Up to four specialized bots",
      description: "Link focused bots by token, assign a template per slot, and keep each workflow scoped to the server that needs it.",
    },
    {
      label: "Controls",
      title: "Operator controls without clutter",
      description: "Keep setup, templates, invites, and bot management in one control surface instead of spreading it across tools.",
    },
  ],
  features: [
    {
      eyebrow: "Provisioning",
      title: "Choose the right bot path per server",
      description: "Keep setup simple with a clear Full Suite path and a focused-bot path that respects the server slot limit.",
    },
    {
      eyebrow: "Operations",
      title: "Manage templates, operators, and controls",
      description: "Use one console for template selection, per-bot controls, and the operator flows your team needs day to day.",
    },
    {
      eyebrow: "Guidance",
      title: "Keep setup straightforward",
      description: "Give admins a cleaner path through templates, invites, and focused setup without exposing backend details.",
    },
  ],
};

export { person, social, newsletter, home };
