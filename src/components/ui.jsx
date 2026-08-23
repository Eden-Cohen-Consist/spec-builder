import { useRef } from 'react'
import { Check, ChevronDown, CircleAlert, Plus } from 'lucide-react'

// Layout and typography only — the border/ring colours live in the two variants below,
// because appending a red border after a stone one does not reliably override it in Tailwind
const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2 text-[15px] text-ink shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-all duration-150 placeholder:text-stone-400 focus:outline-none dark:bg-stone-800/60 dark:shadow-none dark:placeholder:text-stone-500'

const inputIdle =
  'border-stone-200 hover:border-stone-300 focus:border-teal-600 focus:ring-[3px] focus:ring-teal-600/10 dark:border-stone-700 dark:hover:border-stone-600 dark:focus:border-teal-500 dark:focus:ring-teal-500/15'

const inputInvalid =
  'border-red-300 ring-[3px] ring-red-500/10 hover:border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-900 dark:hover:border-red-800 dark:focus:border-red-700'

const inputClasses = (invalid, className) =>
  `${inputBase} ${invalid ? inputInvalid : inputIdle} ${className}`

/** Ring for the bare <input className="cell-input"> elements used inside tables. */
export const invalidCell =
  'rounded-lg ring-2 ring-inset ring-red-400/70 dark:ring-red-500/50'

export function Field({ label, afterLabel, hint, required = false, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
        <span className="inline-flex items-center gap-2">
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          )}
          {afterLabel}
        </span>
        {hint && <span className="font-normal text-stone-400 dark:text-stone-500">{hint}</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
          <CircleAlert className="size-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  )
}

export function Input({ className = '', invalid = false, ...props }) {
  return (
    <input
      type="text"
      aria-invalid={invalid || undefined}
      {...props}
      className={inputClasses(invalid, className)}
    />
  )
}

export function Textarea({ className = '', rows = 3, invalid = false, ...props }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      {...props}
      className={`${inputClasses(invalid, className)} resize-y`}
    />
  )
}

export function Select({ className = '', wrapperClassName = '', invalid = false, children, ...props }) {
  return (
    <span className={`relative block ${wrapperClassName}`}>
      <select
        aria-invalid={invalid || undefined}
        {...props}
        className={`${inputClasses(invalid, className)} cursor-pointer appearance-none pe-9`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
    </span>
  )
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group flex select-none items-center gap-2.5"
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150 ${
          checked
            ? 'border-teal-700 bg-teal-700 shadow-sm shadow-teal-700/30 dark:border-teal-600 dark:bg-teal-600'
            : 'border-stone-300 bg-white group-hover:border-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:group-hover:border-stone-500'
        }`}
      >
        <Check
          strokeWidth={3.5}
          className={`size-3 text-white transition-transform duration-150 ${checked ? 'scale-100' : 'scale-0'}`}
        />
      </span>
      {label && (
        <span className="text-[14.5px] font-medium text-stone-700 dark:text-stone-200">{label}</span>
      )}
    </button>
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
