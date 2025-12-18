// ============================================
// Schedule Parser & Randomizer Utilities
// ============================================

import { ScheduleBlock, DaySchedule, RandomizerMode } from '../types'

/**
 * Parse a markdown schedule into structured data.
 * 
 * Expected format:
 * ```
 * ## Monday
 * 
 * ### Warm-up [warmup]
 * - 5 min: Stretching @youtube(https://youtube.com/watch?v=xxx)
 * 
 * ### Main Practice [main]
 * - 20 min: Forms practice #tai-chi #forms
 * - 15 min: Meditation @youtube(https://youtube.com/watch?v=yyy)
 * 
 * ### Cool-down [cooldown]
 * - 5 min: Breathing exercises
 * ```
 */
export function parseSchedule(markdown: string): DaySchedule[] {
  const days: DaySchedule[] = []
  const lines = markdown.split('\n')
  
  let currentDay: DaySchedule | null = null
  let currentPhase: 'warmup' | 'main' | 'cooldown' | undefined = undefined
  let blockOrder = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Day header (## Monday)
    if (/^##\s+(?!#)/.test(trimmed)) {
      if (currentDay) {
        days.push(currentDay)
      }
      const dayName = trimmed.replace(/^##\s+/, '').trim()
      currentDay = { day: dayName, blocks: [] }
      blockOrder = 0
      currentPhase = undefined
    }
    
    // Section header (### Warm-up [warmup])
    else if (/^###\s+/.test(trimmed) && currentDay) {
      const phaseMatch = trimmed.match(/\[(warmup|main|cooldown)\]/i)
      if (phaseMatch) {
        currentPhase = phaseMatch[1].toLowerCase() as 'warmup' | 'main' | 'cooldown'
      } else {
        currentPhase = 'main' // Default to main
      }
    }
    
    // Block item (- 5 min: Description)
    else if (/^-\s+/.test(trimmed) && currentDay) {
      const block = parseBlockLine(trimmed, blockOrder++, currentPhase)
      if (block) {
        currentDay.blocks.push(block)
      }
    }
  }
  
  // Add last day
  if (currentDay) {
    days.push(currentDay)
  }
  
  return days
}

/**
 * Parse a single block line
 * Format: - 5 min: Description #tag1 #tag2 @youtube(url)
 */
function parseBlockLine(
  line: string, 
  order: number, 
  phase?: 'warmup' | 'main' | 'cooldown'
): ScheduleBlock | null {
  // Remove leading dash and whitespace
  const content = line.replace(/^-\s+/, '')
  
  // Extract duration (e.g., "5 min:" or "10m:")
  const durationMatch = content.match(/^(\d+)\s*(?:min|m|minutes?)[:.]?\s*/i)
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : undefined
  const afterDuration = durationMatch 
    ? content.slice(durationMatch[0].length) 
    : content
  
  // Extract YouTube URL
  const youtubeMatch = afterDuration.match(/@youtube\(([^)]+)\)/i)
  const youtubeUrl = youtubeMatch ? youtubeMatch[1] : extractYouTubeUrl(afterDuration)
  
  // Extract tags (#tag)
  const tags: string[] = []
  const tagMatches = afterDuration.matchAll(/#([\w-]+)/g)
  for (const match of tagMatches) {
    tags.push(match[1])
  }
  
  // Clean title (remove URLs, tags, and @youtube())
  let title = afterDuration
    .replace(/@youtube\([^)]+\)/gi, '')
    .replace(/#[\w-]+/g, '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim()
  
  if (!title) {
    title = 'Untitled block'
  }
  
  return {
    id: crypto.randomUUID(),
    title,
    duration,
    youtubeUrl,
    tags,
    order,
    phase
  }
}

/**
 * Extract YouTube URL from text (not in @youtube() format)
 */
function extractYouTubeUrl(text: string): string | undefined {
  const patterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/,
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`
    }
  }
  
  return undefined
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Randomize schedule blocks according to mode
 */
export function randomizeBlocks(
  blocks: ScheduleBlock[],
  mode: RandomizerMode
): ScheduleBlock[] {
  // Separate by phase for constraint handling
  const warmupBlocks = blocks.filter(b => b.phase === 'warmup')
  const mainBlocks = blocks.filter(b => b.phase === 'main')
  const cooldownBlocks = blocks.filter(b => b.phase === 'cooldown')
  const unphased = blocks.filter(b => !b.phase)
  
  switch (mode) {
    case 'blocked':
      // Keep original order within phases
      return [
        ...warmupBlocks,
        ...mainBlocks,
        ...unphased,
        ...cooldownBlocks
      ]
    
    case 'random':
      // Fully random main blocks, keep warmup first and cooldown last
      return [
        ...warmupBlocks,
        ...shuffleArray([...mainBlocks, ...unphased]),
        ...cooldownBlocks
      ]
    
    case 'progressive':
      // Progressive randomization: small shuffles that maintain some structure
      return [
        ...warmupBlocks,
        ...progressiveShuffle([...mainBlocks, ...unphased]),
        ...cooldownBlocks
      ]
    
    default:
      return blocks
  }
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Progressive shuffle: swap adjacent elements with some probability
 * Maintains more of the original structure than full random
 */
function progressiveShuffle<T>(array: T[]): T[] {
  const result = [...array]
  const swapProbability = 0.4
  
  for (let i = 0; i < result.length - 1; i++) {
    if (Math.random() < swapProbability) {
      [result[i], result[i + 1]] = [result[i + 1], result[i]]
      i++ // Skip the swapped element
    }
  }
  
  return result
}

/**
 * Get blocks for a specific day
 */
export function getBlocksForDay(
  schedule: DaySchedule[],
  dayName: string
): ScheduleBlock[] {
  const day = schedule.find(
    d => d.day.toLowerCase() === dayName.toLowerCase()
  )
  return day?.blocks ?? []
}

/**
 * Determine current day name
 */
export function getCurrentDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Validate schedule markdown for parsing issues
 */
export function validateSchedule(markdown: string): {
  valid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []
  
  const lines = markdown.split('\n')
  let hasDay = false
  let lineNum = 0
  
  for (const line of lines) {
    lineNum++
    const trimmed = line.trim()
    
    if (/^##\s+(?!#)/.test(trimmed)) {
      hasDay = true
    }
    
    // Check for malformed YouTube references
    if (/@youtube\(/.test(trimmed) && !/@youtube\([^)]+\)/.test(trimmed)) {
      warnings.push(`Line ${lineNum}: Malformed @youtube() reference`)
    }
    
    // Check for blocks outside of days
    if (/^-\s+/.test(trimmed) && !hasDay) {
      warnings.push(`Line ${lineNum}: Block defined before any day header`)
    }
  }
  
  if (!hasDay) {
    errors.push('No day headers found (use ## DayName format)')
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  }
}
