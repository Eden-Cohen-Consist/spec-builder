import { TriangleAlert } from 'lucide-react'
import WorkflowModal from './WorkflowModal.jsx'
import { useWorkflowsApi } from '../../workflow/useWorkflows.js'

export default function WorkflowDeleteDialog({ workflow, onClose }) {
  const api = useWorkflowsApi()
  const name = workflow.name.trim() || 'תהליך ללא שם'

  const confirm = () => {
    api.removeWorkflow(workflow.id)
    onClose()
  }

  return (
    <WorkflowModal
      title="מחיקת תהליך"
      icon={TriangleAlert}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={confirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-red-600/25 transition-colors hover:bg-red-700"
          >
            מחק תהליך
          </button>
        </>
      }
    >
      <div className="px-6 py-5">
        <p className="text-[14.5px] leading-relaxed text-stone-600 dark:text-stone-300">
          למחוק את התהליך &quot;{name}&quot;? הפעולה תמחק גם את {workflow.nodes.length} השלבים שבתוכו.
        </p>
      </div>
    </WorkflowModal>
  )
}
