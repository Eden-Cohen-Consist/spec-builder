import { sanitizeWizard } from "../lib.js";
import { DRAFT_KEY } from "./keys.js";
import { defaultAdmin, defaultBusiness } from "./defaults.js";
import { migrateAdmin, migrateBusiness, migrateBlocks } from "./migrations.js";

export const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
};

export const draft = loadDraft();
// The legacy linear flow is round-tripped untouched so a rollback never loses text the PM
// already wrote — migrateWorkflows only reads it when no `workflows` key exists yet
export const legacyFlow = Array.isArray(draft?.flow) ? draft.flow : null;
export const initialWizard = sanitizeWizard(draft?.wizard);

export const getInitialAdmin = () =>
  draft?.admin ? migrateAdmin(draft.admin) : defaultAdmin();

export const getInitialBusiness = () => migrateBusiness(draft?.business);

export const getInitialBlocks = () => migrateBlocks(draft?.blocks ?? []);
