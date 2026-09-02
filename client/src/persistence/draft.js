import { sanitizeWizard, makeContactRow } from "../lib.js";
import { DRAFT_KEY } from "./keys.js";
import { defaultAdmin, defaultBusiness } from "./defaults.js";

export const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
};

export const draft = loadDraft();
export const initialWizard = sanitizeWizard(draft?.wizard);

export const getInitialAdmin = () => {
  if (!draft?.admin) return defaultAdmin();
  const admin = { ...defaultAdmin(), ...draft.admin };
  if (!Array.isArray(admin.contacts) || admin.contacts.length === 0) {
    admin.contacts = [makeContactRow()];
  }
  return admin;
};

export const getInitialBusiness = () =>
  draft?.business ? { ...defaultBusiness(), ...draft.business } : defaultBusiness();

export const getInitialBlocks = () => (Array.isArray(draft?.blocks) ? draft.blocks : []);
