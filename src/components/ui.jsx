import { Check, ChevronDown } from 'lucide-react'

const inputBase =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[15px] text-ink shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-all duration-150 placeholder:text-stone-400 hover:border-stone-300 focus:border-teal-600 focus:outline-none focus:ring-[3px] focus:ring-teal-600/10 dark:border-stone-700 dark:bg-stone-800/60 dark:shadow-none dark:placeholder:text-stone-500 dark:hover:border-stone-600 dark:focus:border-teal-500 dark:focus:ring-teal-500/15'

export function Field({ label, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
        {label}
        {hint && <span className="font-normal text-stone-400 dark:text-stone-500">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function Input({ className = '', ...props }) {
  return <input type="text" {...props} className={`${inputBase} ${className}`} />
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} {...props} className={`${inputBase} resize-y ${className}`} />
}

export function Select({ className = '', wrapperClassName = '', children, ...props }) {
  return (
    <span className={`relative block ${wrapperClassName}`}>
      <select {...props} className={`${inputBase} cursor-pointer appearance-none pe-9 ${className}`}>
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

export function DeleteButton({ className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg p-1.5 text-stone-300 transition-all duration-150 hover:bg-red-50 hover:text-red-600 dark:text-stone-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 ${className}`}
    />
  )
}
