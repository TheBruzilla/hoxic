export const DORMANT_STATES = {
  DORMANT_UNPROVISIONED: "DORMANT_UNPROVISIONED",
  DORMANT_NOT_IN_TEMPLATE: "DORMANT_NOT_IN_TEMPLATE",
  DORMANT_NOT_IMPLEMENTED: "DORMANT_NOT_IMPLEMENTED",
} as const;

export type DormantState = (typeof DORMANT_STATES)[keyof typeof DORMANT_STATES];

export const DORMANT_STATE_COPY: Record<DormantState, { title: string; description: string }> = {
  DORMANT_UNPROVISIONED: {
    title: "Unprovisioned and dormant",
    description: "This bot or slot has not been provisioned with a template yet.",
  },
  DORMANT_NOT_IN_TEMPLATE: {
    title: "Not included in template",
    description: "This module is not part of the currently selected template scope.",
  },
  DORMANT_NOT_IMPLEMENTED: {
    title: "Template-ready placeholder",
    description: "The module slot is active in structure but awaits full implementation.",
  },
};
