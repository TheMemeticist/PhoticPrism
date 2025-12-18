// ============================================
// Trainer Mode Component
// ============================================
// Displays current activity and navigation controls
// for stepping through today's routine

import { useAppStore } from '../../store/appStore'
import './TrainerMode.css'

export function TrainerMode() {
  const trainerMode = useAppStore((s) => s.schedule.trainerMode)
  const todayRoutine = useAppStore((s) => s.schedule.todayRoutine)
  const currentIndex = useAppStore((s) => s.schedule.currentRoutineIndex)
  const setTrainerMode = useAppStore((s) => s.setTrainerMode)
  const nextActivity = useAppStore((s) => s.nextActivity)
  const previousActivity = useAppStore((s) => s.previousActivity)

  if (!trainerMode || todayRoutine.length === 0) {
    return null
  }

  const current = todayRoutine[currentIndex]
  const progress = ((currentIndex + 1) / todayRoutine.length) * 100

  return (
    <div className="trainer-mode">
      <div className="trainer-header">
        <div className="trainer-info">
          <span className="trainer-label">🎯 Trainer Mode</span>
          <span className="trainer-progress">
            {currentIndex + 1} / {todayRoutine.length}
          </span>
        </div>
        <button
          className="btn btn-secondary trainer-close"
          onClick={() => setTrainerMode(false)}
          title="Exit Trainer Mode"
        >
          × Exit
        </button>
      </div>

      <div className="trainer-content">
        {/* Current Activity Info */}
        <div className="trainer-activity">
          <h3>{current.title}</h3>
          {current.description && (
            <p className="activity-description">{current.description}</p>
          )}
          {current.metadata?.onColor && (
            <div className="activity-color" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                className="color-swatch" 
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px', 
                  backgroundColor: current.metadata.onColor 
                }} 
              />
              <span className="color-label">{current.metadata.onColor}</span>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="trainer-controls">
          <button
            className="btn btn-secondary trainer-nav-btn"
            onClick={previousActivity}
            title="Previous Activity"
          >
            ◀ Prev
          </button>
          
          <div className="trainer-progress-bar">
            <div 
              className="trainer-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <button
            className="btn btn-secondary trainer-nav-btn"
            onClick={nextActivity}
            title="Next Activity"
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  )
}
