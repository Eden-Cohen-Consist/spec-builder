import { makeBlock, makeContactRow } from "../lib.js";
import { defaultAdmin, defaultBusiness } from "./defaults.js";

// Older drafts stored contacts as free text and http blocks without endpoint/method/headers
export const migrateAdmin = (saved) => {
  const admin = { ...defaultAdmin(), ...saved };
  if (!Array.isArray(admin.contacts) || admin.contacts.length === 0) {
    const legacyLines =
      typeof admin.contacts === "string"
        ? admin.contacts
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        : [];
    admin.contacts = legacyLines.length
      ? legacyLines.map((line) => ({ ...makeContactRow(), name: line }))
      : [makeContactRow()];
  }
  return admin;
};

// Drop legacy trigger fields — workflow triggers own that concern now
export const migrateBusiness = (saved) => {
  if (!saved) return defaultBusiness();
  return { goal: saved.goal ?? "" };
};

const foldSecurityIntoHttp = (httpBlock, security) => {
  // authType UI was removed — keep any legacy value as a note in fallback
  const authNote =
    security.authType && security.authType !== "None"
      ? `Authentication: ${security.authType}`
      : "";
  const merged = [httpBlock.fallback, authNote, security.fallback]
    .filter((t) => t?.trim())
    .join("\n");
  if (merged) httpBlock.fallback = merged;
};

// Security is now part of the http block — fold legacy standalone security blocks into
// their nearest http block; orphans with content become a free-text block so nothing is lost
export const migrateBlocks = (blocks) => {
  const migrated = [];
  const pending = [];
  for (const block of blocks) {
    if (block.type === "http") {
      const httpBlock = {
        title: "",
        endpoint: "",
        method: "GET",
        headers: [],
        fallback: "",
        ...block,
      };
      // Older drafts had no toggle — open the table when any row already has content
      if (!("headersEnabled" in block)) {
        httpBlock.headersEnabled = httpBlock.headers.some(
          (h) => h.key?.trim() || h.value?.trim(),
        );
      }
      if (!("mappingEnabled" in block)) {
        httpBlock.mappingEnabled = httpBlock.mapping.some(
          (row) => row.sourceField?.trim() || row.targetField?.trim() || row.notes?.trim(),
        );
      }
      for (const security of pending.splice(0))
        foldSecurityIntoHttp(httpBlock, security);
      migrated.push(httpBlock);
    } else if (block.type === "security") {
      const target = migrated.findLast((b) => b.type === "http");
      if (target) foldSecurityIntoHttp(target, block);
      else pending.push(block);
    } else {
      migrated.push(block);
    }
  }
  for (const security of pending) {
    if (
      !security.fallback?.trim() &&
      (!security.authType || security.authType === "None")
    )
      continue;
    migrated.push({
      ...makeBlock("freeText"),
      title: "אבטחה וטיפול בשגיאות",
      text: [
        `Authentication: ${security.authType ?? "None"}`,
        security.fallback ?? "",
      ]
        .filter((t) => t.trim())
        .join("\n"),
    });
  }
  return migrated;
};
