// ============================================
// Table-Based Schedule Parser
// ============================================
// Parses the table format from Schedule.MD

import { ScheduleBlock, DaySchedule } from '../types'

export interface TableScheduleRow {
  activity: string
  brainwaveTarget: number
  onColor: string
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

/**
 * Parse markdown table schedule into structured routine blocks per day
 */
export function parseTableSchedule(markdown: string): DaySchedule[] {
  const rows = parseTableRows(markdown)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const daySchedules: DaySchedule[] = []

  for (const dayName of days) {
    const blocks: ScheduleBlock[] = []
    const dayKey = dayName.toLowerCase() as keyof Pick<TableScheduleRow, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const content = row[dayKey]
      
      if (content && content !== '-' && content.trim()) {
        const youtubeUrl = extractMarkdownLink(content)
        const title = extractMarkdownText(content) || row.activity

        blocks.push({
          id: crypto.randomUUID(),
          title,
          youtubeUrl,
          tags: [row.activity.toLowerCase().replace(/\s+/g, '-')],
          order: i,
          phase: i === 0 ? 'warmup' : 'main',
          duration: undefined,
          description: `Target: ${row.brainwaveTarget} Hz`,
          // Store metadata for trainer mode
          metadata: {
            brainwaveHz: row.brainwaveTarget,
            onColor: row.onColor
          }
        } as ScheduleBlock & { metadata: { brainwaveHz: number; onColor: string } })
      }
    }

    daySchedules.push({
      day: dayName,
      blocks
    })
  }

  return daySchedules
}

/**
 * Parse table rows from markdown
 */
function parseTableRows(markdown: string): TableScheduleRow[] {
  const lines = markdown.split('\n').filter(l => l.trim())
  const rows: TableScheduleRow[] = []

  // Find table start (header row with |)
  const tableStartIndex = lines.findIndex(l => l.includes('| Activity'))
  if (tableStartIndex === -1) return rows

  // Parse data rows (skip header and separator)
  for (let i = tableStartIndex + 2; i < lines.length; i++) {
    const line = lines[i]
    if (!line.includes('|')) break // End of table

    const cells = line.split('|').map(c => c.trim()).filter(c => c)
    
    if (cells.length >= 10) {
      rows.push({
        activity: cells[0],
        brainwaveTarget: parseInt(cells[1].match(/\d+/)?.[0] || '10', 10),
        onColor: cells[2].replace(/`/g, ''),
        monday: cells[3],
        tuesday: cells[4],
        wednesday: cells[5],
        thursday: cells[6],
        friday: cells[7],
        saturday: cells[8],
        sunday: cells[9]
      })
    }
  }

  return rows
}

/**
 * Extract URL from markdown link [text](url)
 */
function extractMarkdownLink(text: string): string | undefined {
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/)
  return match ? match[2] : undefined
}

/**
 * Extract text from markdown link [text](url)
 */
function extractMarkdownText(text: string): string | undefined {
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/)
  return match ? match[1] : text
}

/**
 * Get routine blocks for today
 */
export function getTodayRoutine(schedule: DaySchedule[]): ScheduleBlock[] {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const daySchedule = schedule.find(d => d.day === today)
  return daySchedule?.blocks || []
}
