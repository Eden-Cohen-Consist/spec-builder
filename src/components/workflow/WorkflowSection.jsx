import { useEffect, useState } from 'react'
import LockedSection from '../LockedSection.jsx'
import WorkflowTabs from './WorkflowTabs.jsx'
import WorkflowHeader from './WorkflowHeader.jsx'
import WorkflowCanvas from './WorkflowCanvas.jsx'
import WorkflowDeleteDialog from './WorkflowDeleteDialog.jsx'
import WorkflowValidationSummary from './WorkflowValidationSummary.jsx'
import { WorkflowsContext } from '../../workflow/useWorkflows.js'

export default function WorkflowSection({ api, blocks, dark, submitted, delay }) {
  const [pendingDelete, setPendingDelete] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [fullscreen])

  const workflow = api.activeWorkflow

  return (
    <WorkflowsContext.Provider value={api}>
      <LockedSection
        id="section-workflows"
        number="3"
        title="תהליכים עסקיים"
        subtitle="הגדרת התהליכים, הקשרים ביניהם והלוגיקה הפנימית של כל תהליך."
        issues={api.issues}
        submitted={submitted}
        delay={delay}
      >
        <div className="space-y-5">
          <WorkflowTabs onRequestDelete={setPendingDelete} />

          {workflow && (
            <>
              <div className="h-px bg-stone-100 dark:bg-stone-800" />
              <WorkflowHeader workflow={workflow} />
              <WorkflowCanvas
                workflow={workflow}
                blocks={blocks}
                dark={dark}
                fullscreen={false}
                onToggleFullscreen={() => setFullscreen(true)}
              />
              <WorkflowValidationSummary />
            </>
          )}
        </div>
      </LockedSection>

      {fullscreen && workflow && (
        <div className="animate-fade fixed inset-0 z-[70] overscroll-none bg-paper p-4">
          <WorkflowCanvas
            workflow={workflow}
            blocks={blocks}
            dark={dark}
            fullscreen
            onToggleFullscreen={() => setFullscreen(false)}
          />
        </div>
      )}

      {pendingDelete && (
        <WorkflowDeleteDialog workflow={pendingDelete} onClose={() => setPendingDelete(null)} />
      )}
    </WorkflowsContext.Provider>
  )
}
