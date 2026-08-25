import { useState } from "react";
import { MoveLeft, Globe } from "lucide-react";
import { Field, Input, Select } from "./ui.jsx";
import { HTTP_METHODS } from "../constants.js";
import { isThirdParty, makeHeaderRow } from "../lib.js";
import DynamicBlock from "./DynamicBlock.jsx";
import CurlImport, { CurlImportTrigger } from "./http/CurlImport.jsx";
import PayloadEditor from "./http/PayloadEditor.jsx";
import HeadersEditor from "./http/HeadersEditor.jsx";
import MappingTable from "./http/MappingTable.jsx";
import SecurityFields from "./http/SecurityFields.jsx";

/** Card shell — cURL trigger sits in the header next to delete, panel opens in the body. */
export function HttpBlockCard({
  block,
  issues,
  submitted,
  onDelete,
  errors,
  onUpdate,
}) {
  const [curlOpen, setCurlOpen] = useState(false);
  return (
    <DynamicBlock
      block={block}
      issues={issues}
      submitted={submitted}
      onDelete={onDelete}
      headerActions={
        curlOpen ? null : (
          <CurlImportTrigger onClick={() => setCurlOpen(true)} />
        )
      }
    >
      <HttpBlock
        block={block}
        errors={errors}
        onUpdate={onUpdate}
        curlOpen={curlOpen}
        onCurlOpenChange={setCurlOpen}
      />
    </DynamicBlock>
  );
}

function HttpBlock({ block, errors = new Map(), onUpdate, curlOpen, onCurlOpenChange }) {
  const thirdParty = isThirdParty(block.destination);

  const applyCurl = (parsed) => {
    const headers = parsed.headers.map(({ key, value }) => ({
      ...makeHeaderRow(),
      key,
      value,
    }));
    const patch = {
      endpoint: parsed.url,
      method: HTTP_METHODS.includes(parsed.method) ? parsed.method : "GET",
      headers,
      headersEnabled: headers.length > 0,
    };
    if (parsed.body) patch.requestPayload = parsed.body;
    onUpdate(patch);
  };

  return (
    <div>
      <CurlImport
        open={curlOpen}
        onOpenChange={onCurlOpenChange}
        onImport={applyCurl}
      />

      <Field
        label="כותרת הבלוק"
        hint="תופיע בבחירת הבלוק מתוך שלב קריאת API"
        required
        error={errors.get("title")}
      >
        <Input
          value={block.title ?? ""}
          invalid={errors.has("title")}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="למשל: פתיחת לקוח ב-Priority"
        />
      </Field>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field label="מערכת מקור" required error={errors.get("source")}>
          <Input
            dir="auto"
            value={block.source}
            invalid={errors.has("source")}
            onChange={(e) => onUpdate({ source: e.target.value })}
            placeholder="Glassix"
          />
        </Field>
        <MoveLeft
          aria-hidden="true"
          className="mb-2.5 size-5 text-stone-300 dark:text-stone-600"
        />
        <Field
          label="מערכת יעד"
          required
          error={errors.get("destination")}
          afterLabel={
            thirdParty ? (
              <span className="animate-pop inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-px text-[11px] font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400">
                <Globe className="size-3" />
                צד שלישי
              </span>
            ) : null
          }
        >
          <Input
            dir="auto"
            value={block.destination}
            invalid={errors.has("destination")}
            onChange={(e) => onUpdate({ destination: e.target.value })}
            placeholder="Salesforce / Priority / Consist..."
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-[128px_1fr] items-end gap-3">
        <Field label="Method">
          <Select
            value={block.method}
            onChange={(e) => onUpdate({ method: e.target.value })}
            className="font-mono !text-[13.5px]"
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={<span dir="ltr">Endpoint</span>}
          required
          error={errors.get("endpoint")}
        >
          <Input
            dir="ltr"
            value={block.endpoint}
            invalid={errors.has("endpoint")}
            onChange={(e) => onUpdate({ endpoint: e.target.value })}
            placeholder="https://api.example.com/v1/tickets"
            className="text-left font-mono !text-[13.5px]"
          />
        </Field>
      </div>

      <HeadersEditor
        headers={block.headers}
        enabled={Boolean(block.headersEnabled)}
        onChange={(headers) => onUpdate({ headers })}
        onEnabledChange={(headersEnabled) => onUpdate({ headersEnabled })}
      />

      {thirdParty && (
        <div className="animate-block-in mt-5 space-y-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
            <Globe className="size-3.5 text-amber-600 dark:text-amber-400" />
            אינטגרציה מול מערכת חיצונית — חובה לצרף את מבני ה-JSON המלאים
          </p>
          <PayloadEditor
            label="Request Payload"
            value={block.requestPayload}
            onChange={(requestPayload) => onUpdate({ requestPayload })}
            error={errors.get("requestPayload")}
          />
          <PayloadEditor
            label="Response"
            value={block.responsePayload}
            onChange={(responsePayload) => onUpdate({ responsePayload })}
            error={errors.get("responsePayload")}
          />
        </div>
      )}

      <MappingTable
        mapping={block.mapping}
        source={block.source}
        destination={block.destination}
        onChange={(mapping) => onUpdate({ mapping })}
      />

      <SecurityFields block={block} errors={errors} onUpdate={onUpdate} />
    </div>
  );
}
