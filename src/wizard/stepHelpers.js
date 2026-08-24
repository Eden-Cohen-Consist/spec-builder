const STEP_SCOPES = {
  1: new Set(["admin", "business"]),
  2: new Set(["workflow"]),
  3: new Set(["block"]),
};

export const stepFromScope = (scope) => {
  if (scope === "admin" || scope === "business") return 1;
  if (scope === "workflow") return 2;
  return 3;
};

export const issuesForStep = (issues, step) =>
  issues.filter((item) => STEP_SCOPES[step].has(item.scope));

export const stepHasError = (issues, step) =>
  issuesForStep(issues, step).some((item) => item.severity === "error");
