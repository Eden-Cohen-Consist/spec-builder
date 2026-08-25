import {
  createContext,
  useContext,
  useRef,
  Children,
  isValidElement,
} from 'react'
import { Plus } from 'lucide-react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import MuiCheckbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

const FieldMetaContext = createContext(null)

function useFieldMeta() {
  return useContext(FieldMetaContext)
}

function buildFieldLabel(label, afterLabel) {
  if (!afterLabel) return label
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      {afterLabel}
    </span>
  )
}

function resolveFieldState(meta, invalid) {
  const hasError = Boolean(meta?.error) || invalid
  const helperText =
    meta?.error || (!hasError && meta?.hint ? meta.hint : undefined)

  return {
    hasError,
    helperText,
    label: meta ? buildFieldLabel(meta.label, meta.afterLabel) : undefined,
    required: meta?.required ?? false,
  }
}

/** Ring for the bare <input className="cell-input"> elements used inside tables. */
export const invalidCell =
  'rounded-lg ring-2 ring-inset ring-red-400/70 dark:ring-red-500/50'

export function Field({
  label,
  afterLabel,
  hint,
  required = false,
  error,
  className = '',
  children,
}) {
  const meta = { label, afterLabel, hint, required, error }

  return (
    <FieldMetaContext.Provider value={meta}>
      <Box className={className}>{children}</Box>
    </FieldMetaContext.Provider>
  )
}

export function Input({ className = '', invalid = false, ...props }) {
  const meta = useFieldMeta()
  const { hasError, helperText, label, required } = resolveFieldState(
    meta,
    invalid,
  )

  return (
    <TextField
      type="text"
      variant="outlined"
      fullWidth
      size="small"
      label={label}
      required={required}
      error={hasError}
      helperText={helperText}
      aria-invalid={hasError || undefined}
      className={className}
      {...props}
    />
  )
}

export function Textarea({
  className = '',
  rows = 3,
  invalid = false,
  ...props
}) {
  const meta = useFieldMeta()
  const { hasError, helperText, label, required } = resolveFieldState(
    meta,
    invalid,
  )

  return (
    <TextField
      multiline
      minRows={rows}
      variant="outlined"
      fullWidth
      size="small"
      label={label}
      required={required}
      error={hasError}
      helperText={helperText}
      aria-invalid={hasError || undefined}
      className={className}
      {...props}
    />
  )
}

function mapOptionChildren(children) {
  return Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return child
    return (
      <MenuItem key={child.props.value} value={child.props.value}>
        {child.props.children}
      </MenuItem>
    )
  })
}

export function Select({
  className = '',
  wrapperClassName = '',
  invalid = false,
  children,
  ...props
}) {
  const meta = useFieldMeta()
  const { hasError, helperText, label, required } = resolveFieldState(
    meta,
    invalid,
  )

  return (
    <Box className={wrapperClassName}>
      <TextField
        select
        variant="outlined"
        fullWidth
        size="small"
        label={label}
        required={required}
        error={hasError}
        helperText={helperText}
        aria-invalid={hasError || undefined}
        className={className}
        {...props}
      >
        {mapOptionChildren(children)}
      </TextField>
    </Box>
  )
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <FormControlLabel
      control={
        <MuiCheckbox
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          color="primary"
          size="small"
        />
      }
      label={label}
      sx={{
        marginInlineStart: 0,
        marginInlineEnd: 0,
        '& .MuiFormControlLabel-label': {
          fontSize: '14.5px',
          fontWeight: 500,
        },
      }}
    />
  )
}

export function GhostButton({ icon: Icon, children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[13.5px] font-semibold text-stone-600 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 hover:border-teal-600/40 hover:text-teal-700 hover:shadow-sm active:scale-[0.98] dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300 dark:shadow-none dark:hover:border-teal-500/50 dark:hover:text-teal-400 ${className}`}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </button>
  )
}

/** Persistent last row inside a data table — click/activate adds a real row and focuses it. */
export function GhostAddRow({ colSpan, label = 'הוסף שורה', onAdd }) {
  const rowRef = useRef(null)

  const activate = () => {
    onAdd()
    // Double rAF: wait for React to commit the new row before focusing it
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rowRef.current
          ?.previousElementSibling
          ?.querySelector('input, select, textarea')
          ?.focus()
      })
    })
  }

  return (
    <tr ref={rowRef} className="group/ghost">
      <td colSpan={colSpan} className="p-0">
        <button
          type="button"
          onClick={activate}
          className="flex w-full items-center gap-1.5 px-3 py-2.5 text-start text-[13.5px] text-stone-400/70 transition-colors hover:bg-stone-50/60 hover:text-stone-500 focus-visible:bg-teal-600/5 focus-visible:text-teal-700 focus-visible:outline-none dark:text-stone-500 dark:hover:bg-stone-800/30 dark:hover:text-stone-400 dark:focus-visible:bg-teal-500/10 dark:focus-visible:text-teal-400"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" strokeWidth={2.5} />
          <span>{label}</span>
        </button>
      </td>
    </tr>
  )
}

export function DeleteButton({ className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg p-1.5 text-stone-300 transition-all duration-150 hover:bg-red-50 hover:text-red-600 dark:text-stone-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 ${className}`}
    />
  )
}
