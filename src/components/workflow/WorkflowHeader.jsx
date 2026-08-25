import { Field, Input, Textarea, Select } from "../ui.jsx";
import { useWorkflowsApi } from "../../workflow/useWorkflows.js";
import {
  TRIGGER_HINTS,
  TRIGGER_LABELS,
  WORKFLOW_TRIGGER_TYPES,
} from "../../workflow/constants.js";

export default function WorkflowHeader({ workflow }) {
  const api = useWorkflowsApi();

  const set = (patch) => api.updateWorkflow(workflow.id, patch);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="שם התהליך">
          <Input
            value={workflow.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="למשל: יצירת קריאה"
          />
        </Field>
        <Field label="מתי התהליך מופעל" hint="טריגר">
          <Select
            value={workflow.triggerType}
            onChange={(e) => set({ triggerType: e.target.value })}
          >
            {WORKFLOW_TRIGGER_TYPES.map((type) => (
              <option key={type} value={type}>
                {TRIGGER_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="פירוט הטריגר" >
        <Input
          value={workflow.triggerDescription}
          onChange={(e) => set({ triggerDescription: e.target.value })}
          placeholder={TRIGGER_HINTS[workflow.triggerType]}
        />
      </Field>

      <Field label="תיאור קצר" >
        <Textarea
          rows={2}
          value={workflow.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="מה התהליך הזה עושה, במשפט אחד"
        />
      </Field>
    </div>
  );
}
