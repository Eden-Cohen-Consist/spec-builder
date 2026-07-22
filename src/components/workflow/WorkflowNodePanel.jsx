import { AlertTriangle, ArrowUpLeft, ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { Checkbox, DeleteButton, Field, GhostButton, Input, Select, Textarea } from '../ui.jsx'

const NODE_LABELS = {
  START: 'התחלה',
  ACTION: 'פעולה',
  DECISION: 'החלטה',
  HTTP_REQUEST: 'בקשת HTTP',
  CALL_WORKFLOW: 'הפעלת תהליך אחר',
  PARALLEL: 'מסלולים מקבילים',
  DELAY: 'השהיה',
  END: 'סיום',
}

const SOURCE_LABELS = {
  STATIC: 'ערך קבוע',
  WORKFLOW_INPUT: 'קלט של התהליך',
  NODE_OUTPUT: 'פלט של Node',
  CONTEXT: 'Context',
}

const FAILURE_LABELS = {
  STOP: 'עצור את התהליך',
  CONTINUE: 'המשך במסלול הרגיל',
  GO_TO_NODE: 'עבור ל־Node אחר',
}

const makeId = () => crypto.randomUUID()

function updateAt(items, index, patch) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
}

function mappingHasContent(config) {
  return [...(config.inputMappings ?? []), ...(config.outputMappings ?? [])].some(
    (mapping) => mapping.sourceValue?.trim() || mapping.targetVariable?.trim(),
  )
}

function buildMappings(target, workflow) {
  return {
    inputMappings: target.inputs.map((input) => {
      const sameName = workflow.inputs.find((candidate) => candidate.name === input.name)
      return {
        targetInput: input.name,
        sourceType: sameName ? 'WORKFLOW_INPUT' : 'STATIC',
        sourceValue: sameName?.name ?? '',
      }
    }),
    outputMappings: target.outputs.map((output) => ({
      sourceOutput: output.name,
      targetVariable: workflow.outputs.some((candidate) => candidate.name === output.name) ? output.name : '',
    })),
  }
}

function RouteSelect({ label, value, workflow, nodeId, onChange, allowEmpty = true }) {
  return (
    <Field label={label}>
      <Select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty && <option value="">לא נבחר המשך</option>}
        {workflow.nodes
          .filter((candidate) => candidate.id !== nodeId && candidate.type !== 'START')
          .map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.title || NODE_LABELS[candidate.type]}
            </option>
          ))}
      </Select>
    </Field>
  )
}

function BranchEditor({ node, workflow, onUpdate, onSetRoute, onRemoveEdge }) {
  const branches = node.config?.branches ?? []

  const updateBranches = (next) => onUpdate({ config: { ...node.config, branches: next } })
  const removeBranch = (branch) => {
    workflow.edges
      .filter((edge) => edge.source === node.id && edge.sourceHandle === branch.id)
      .forEach((edge) => onRemoveEdge(edge.id))
    updateBranches(branches.filter((candidate) => candidate.id !== branch.id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-bold text-stone-700 dark:text-stone-200">מסלולים</div>
          <div className="mt-0.5 text-[11.5px] text-stone-400 dark:text-stone-500">נדרשים לפחות שני מסלולים מחוברים</div>
        </div>
        <GhostButton
          icon={Plus}
          onClick={() =>
            updateBranches([
              ...branches,
              { id: makeId(), label: `מסלול ${branches.length + 1}`, ...(node.type === 'DECISION' && { condition: '' }) },
            ])
          }
        >
          מסלול
        </GhostButton>
      </div>

      {branches.map((branch, index) => {
        const edge = workflow.edges.find(
          (candidate) => candidate.source === node.id && candidate.sourceHandle === branch.id,
        )
        return (
          <div key={branch.id} className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-950/35">
            <div className="mb-2 flex items-center gap-2">
              <Input
                value={branch.label}
                onChange={(event) => updateBranches(updateAt(branches, index, { label: event.target.value }))}
                placeholder={`מסלול ${index + 1}`}
                className="!py-1.5 !text-[13px]"
              />
              {branches.length > 2 && (
                <DeleteButton aria-label="מחיקת מסלול" onClick={() => removeBranch(branch)}>
                  <Trash2 className="size-3.5" />
                </DeleteButton>
              )}
            </div>
            {node.type === 'DECISION' && (
              <Input
                value={branch.condition ?? ''}
                onChange={(event) => updateBranches(updateAt(branches, index, { condition: event.target.value }))}
                placeholder="תנאי, למשל status === 'open'"
                dir="ltr"
                className="mb-2 !py-1.5 !text-left !font-mono !text-[12px]"
              />
            )}
            <Select
              value={edge?.target ?? ''}
              onChange={(event) => onSetRoute(branch.id, event.target.value, branch.label, branch.condition)}
              className="!py-1.5 !text-[12.5px]"
            >
              <option value="">בחרו Node יעד</option>
              {workflow.nodes
                .filter((candidate) => candidate.id !== node.id && candidate.type !== 'START')
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
            </Select>
          </div>
        )
      })}
    </div>
  )
}

function HttpNodeFields({ node, blocks, onUpdate, onOpenHttpBlock }) {
  const httpBlocks = blocks.filter((block) => block.type === 'http')
  return (
    <div className="space-y-3">
      <Field label="בלוק HTTP מקושר" hint="מקור האמת נשאר באזור הבלוקים הטכניים">
        <Select
          value={node.config?.technicalBlockId ?? ''}
          onChange={(event) => onUpdate({ config: { ...node.config, technicalBlockId: event.target.value } })}
        >
          <option value="">בחרו בלוק HTTP</option>
          {httpBlocks.map((block, index) => (
            <option key={block.id} value={block.id}>
              {block.title?.trim() || block.endpoint || block.destination || `בקשת HTTP ${index + 1}`} · {block.method}
            </option>
          ))}
        </Select>
      </Field>
      {node.config?.technicalBlockId && (
        <GhostButton icon={ExternalLink} onClick={() => onOpenHttpBlock(node.config.technicalBlockId)}>
          פתח בלוק HTTP
        </GhostButton>
      )}
      {httpBlocks.length === 0 && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-300">
          עדיין אין בלוק HTTP. הוסיפו אחד באזור הבלוקים הטכניים ואז חזרו לכאן.
        </p>
      )}
    </div>
  )
}

function MappingSourceField({ mapping, workflow, onChange }) {
  if (mapping.sourceType === 'WORKFLOW_INPUT') {
    return (
      <Select value={mapping.sourceValue} onChange={(event) => onChange(event.target.value)} className="!py-1.5 !text-[12px]">
        <option value="">בחרו קלט</option>
        {workflow.inputs.map((input) => (
          <option key={input.id} value={input.name}>
            {input.name}
          </option>
        ))}
      </Select>
    )
  }
  return (
    <Input
      value={mapping.sourceValue}
      onChange={(event) => onChange(event.target.value)}
      placeholder={
        mapping.sourceType === 'STATIC'
          ? 'ערך'
          : mapping.sourceType === 'NODE_OUTPUT'
            ? 'nodeId.outputName'
            : 'context.key'
      }
      dir="ltr"
      className="!py-1.5 !text-left !font-mono !text-[12px]"
    />
  )
}

function CallWorkflowFields({
  node,
  workflow,
  workflows,
  unavailableTargetIds,
  onUpdate,
  onOpenWorkflow,
  onSetRoute,
}) {
  const config = {
    targetWorkflowId: '',
    waitForCompletion: true,
    inputMappings: [],
    outputMappings: [],
    onSuccess: {},
    onFailure: { behavior: 'STOP' },
    ...node.config,
  }
  const target = workflows.find((candidate) => candidate.id === config.targetWorkflowId)
  const successEdge = workflow.edges.find(
    (edge) => edge.source === node.id && edge.sourceHandle !== 'failure',
  )
  const failureEdge = workflow.edges.find(
    (edge) => edge.source === node.id && edge.sourceHandle === 'failure',
  )
  const setConfig = (patch) => onUpdate({ config: { ...config, ...patch } })

  const changeTarget = (targetId) => {
    if (targetId !== config.targetWorkflowId && mappingHasContent(config)) {
      const confirmed = window.confirm('החלפת תהליך היעד תבנה מחדש את טבלאות המיפוי. להמשיך?')
      if (!confirmed) return
    }
    const nextTarget = workflows.find((candidate) => candidate.id === targetId)
    setConfig({
      targetWorkflowId: targetId,
      ...(nextTarget ? buildMappings(nextTarget, workflow) : { inputMappings: [], outputMappings: [] }),
    })
  }

  const setFailureBehavior = (behavior) => {
    setConfig({ onFailure: { behavior, ...(behavior === 'GO_TO_NODE' && { targetNodeId: failureEdge?.target ?? '' }) } })
    if (behavior !== 'GO_TO_NODE') onSetRoute('failure', '')
  }

  return (
    <div className="space-y-4">
      <Field label="תהליך יעד">
        <Select value={config.targetWorkflowId} onChange={(event) => changeTarget(event.target.value)}>
          <option value="">בחרו תהליך</option>
          {workflows
            .filter((candidate) => candidate.id !== workflow.id)
            .map((candidate) => (
              <option key={candidate.id} value={candidate.id} disabled={unavailableTargetIds.has(candidate.id)}>
                {candidate.name}{unavailableTargetIds.has(candidate.id) ? ' · יוצר תלות מעגלית' : ''}
              </option>
            ))}
        </Select>
      </Field>
      {target && (
        <GhostButton icon={ArrowUpLeft} onClick={() => onOpenWorkflow(target.id)}>
          פתח את {target.name}
        </GhostButton>
      )}

      <div>
        <div className="mb-1.5 text-[13px] font-semibold text-stone-600 dark:text-stone-300">מצב הפעלה</div>
        <div className="grid grid-cols-2 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
          {[
            [true, 'המתן לסיום'],
            [false, 'הפעל ברקע'],
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setConfig({ waitForCompletion: value })}
              className={`rounded-md px-2 py-2 text-[12px] font-bold transition-colors ${
                config.waitForCompletion === value
                  ? 'bg-white text-teal-700 shadow-sm dark:bg-stone-700 dark:text-teal-300'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {target && (
        <>
          <div>
            <div className="mb-2 text-[13px] font-bold text-stone-700 dark:text-stone-200">מיפוי Inputs</div>
            <div className="space-y-2">
              {config.inputMappings.map((mapping, index) => {
                const targetInput = target.inputs.find((input) => input.name === mapping.targetInput)
                return (
                  <div key={`${mapping.targetInput}-${index}`} className="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                    <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11.5px] text-stone-600 dark:text-stone-300" dir="ltr">
                      <span>{mapping.targetInput}</span>
                      {targetInput?.required && <span className="font-sans text-[10px] font-bold text-red-500">חובה</span>}
                    </div>
                    <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
                      <Select
                        value={mapping.sourceType}
                        onChange={(event) =>
                          setConfig({
                            inputMappings: updateAt(config.inputMappings, index, {
                              sourceType: event.target.value,
                              sourceValue: '',
                            }),
                          })
                        }
                        className="!py-1.5 !text-[11.5px]"
                      >
                        {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <MappingSourceField
                        mapping={mapping}
                        workflow={workflow}
                        onChange={(sourceValue) =>
                          setConfig({ inputMappings: updateAt(config.inputMappings, index, { sourceValue }) })
                        }
                      />
                    </div>
                  </div>
                )
              })}
              {config.inputMappings.length === 0 && <p className="text-[12px] text-stone-400">לתהליך היעד אין Inputs</p>}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[13px] font-bold text-stone-700 dark:text-stone-200">מיפוי Outputs</div>
            <div className="space-y-2">
              {config.outputMappings.map((mapping, index) => (
                <div key={`${mapping.sourceOutput}-${index}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                  <code className="truncate text-left text-[11.5px] text-stone-600 dark:text-stone-300" dir="ltr">{mapping.sourceOutput}</code>
                  <span className="text-stone-300 dark:text-stone-600">←</span>
                  <Select
                    value={mapping.targetVariable}
                    onChange={(event) =>
                      setConfig({
                        outputMappings: updateAt(config.outputMappings, index, { targetVariable: event.target.value }),
                      })
                    }
                    className="!py-1.5 !text-[11.5px]"
                  >
                    <option value="">לא למפות</option>
                    {workflow.outputs.map((output) => (
                      <option key={output.id} value={output.name}>
                        {output.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
              {config.outputMappings.length === 0 && <p className="text-[12px] text-stone-400">לתהליך היעד אין Outputs</p>}
            </div>
          </div>
        </>
      )}

      <RouteSelect
        label="במקרה הצלחה"
        value={successEdge?.target ?? config.onSuccess?.nextNodeId}
        workflow={workflow}
        nodeId={node.id}
        onChange={(targetId) => onSetRoute('success', targetId)}
      />

      <Field label="במקרה כשל">
        <Select value={config.onFailure?.behavior ?? 'STOP'} onChange={(event) => setFailureBehavior(event.target.value)}>
          {Object.entries(FAILURE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      {config.onFailure?.behavior === 'GO_TO_NODE' && (
        <RouteSelect
          label="Node יעד לכשל"
          value={failureEdge?.target ?? config.onFailure?.targetNodeId}
          workflow={workflow}
          nodeId={node.id}
          onChange={(targetId) => onSetRoute('failure', targetId)}
        />
      )}
    </div>
  )
}

export default function WorkflowNodePanel({
  node,
  workflow,
  workflows,
  blocks,
  issues = [],
  unavailableTargetIds = new Set(),
  onClose,
  onUpdate,
  onDelete,
  onOpenWorkflow,
  onOpenHttpBlock,
  onSetRoute,
  onRemoveEdge,
}) {
  const nodeIssues = issues.filter((issue) => issue.nodeId === node.id)

  return (
    <aside className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
      <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-3.5 dark:border-stone-800">
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">הגדרות Node</div>
          <h3 className="mt-0.5 font-display text-[17px] font-bold text-ink">{NODE_LABELS[node.type] ?? node.type}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירת פאנל"
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="max-h-[620px] space-y-5 overflow-y-auto p-4">
        {nodeIssues.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[11.5px] text-red-700 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300">
            {nodeIssues.map((issue, index) => (
              <div key={`${issue.code}-${index}`} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        <Field label="שם ה־Node">
          <Input value={node.title} onChange={(event) => onUpdate({ title: event.target.value })} />
        </Field>
        <Field label="תיאור" hint="בשפה עסקית וברורה">
          <Textarea value={node.description ?? ''} onChange={(event) => onUpdate({ description: event.target.value })} rows={3} />
        </Field>

        {(node.type === 'DECISION' || node.type === 'PARALLEL') && (
          <BranchEditor
            node={node}
            workflow={workflow}
            onUpdate={onUpdate}
            onSetRoute={onSetRoute}
            onRemoveEdge={onRemoveEdge}
          />
        )}

        {node.type === 'HTTP_REQUEST' && (
          <HttpNodeFields node={node} blocks={blocks} onUpdate={onUpdate} onOpenHttpBlock={onOpenHttpBlock} />
        )}

        {node.type === 'DELAY' && (
          <div className="grid grid-cols-[1fr_1.2fr] gap-2">
            <Field label="משך">
              <Input
                type="number"
                min="0"
                value={node.config?.duration ?? 1}
                onChange={(event) =>
                  onUpdate({ config: { ...node.config, duration: Math.max(0, Number(event.target.value) || 0) } })
                }
                dir="ltr"
              />
            </Field>
            <Field label="יחידה">
              <Select
                value={node.config?.unit ?? 'MINUTES'}
                onChange={(event) => onUpdate({ config: { ...node.config, unit: event.target.value } })}
              >
                <option value="SECONDS">שניות</option>
                <option value="MINUTES">דקות</option>
                <option value="HOURS">שעות</option>
                <option value="DAYS">ימים</option>
              </Select>
            </Field>
          </div>
        )}

        {node.type === 'CALL_WORKFLOW' && (
          <CallWorkflowFields
            node={node}
            workflow={workflow}
            workflows={workflows}
            unavailableTargetIds={unavailableTargetIds}
            onUpdate={onUpdate}
            onOpenWorkflow={onOpenWorkflow}
            onSetRoute={onSetRoute}
          />
        )}

        {node.type !== 'END' && (
          <Checkbox
            checked={Boolean(node.isDraft)}
            onChange={(isDraft) => onUpdate({ isDraft })}
            label="Node בטיוטה — אפשר להשאיר אותו מנותק"
          />
        )}
      </div>

      {node.type !== 'START' && (
        <footer className="border-t border-stone-100 px-4 py-3 dark:border-stone-800">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/35"
          >
            <Trash2 className="size-3.5" />
            מחיקת Node
          </button>
        </footer>
      )}
    </aside>
  )
}
