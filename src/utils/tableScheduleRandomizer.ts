// ============================================
// Table Schedule Randomizer
// ============================================
// Randomizes schedule by picking day variants for each activity

import { ScheduleBlock, DaySchedule } from '../types'

/**
 * Randomize schedule by picking a random day variant for each activity
 * Keeps activity order the same, only randomizes which day's variant is selected
 */
export function randomizeTableSchedule(allDaysSchedule: DaySchedule[]): ScheduleBlock[] {
  if (allDaysSchedule.length === 0) return []

  // Group activities by their position/row
  // Each activity appears in the same position across all days
  const activitySlots: ScheduleBlock[][] = []
  
  // Get the max number of activities across all days
  const maxActivities = Math.max(...allDaysSchedule.map(d => d.blocks.length))
  
  // For each activity slot (row in the table)
  for (let slotIndex = 0; slotIndex < maxActivities; slotIndex++) {
    const variantsForThisSlot: ScheduleBlock[] = []
    
    // Collect all day variants for this activity slot
    for (const daySchedule of allDaysSchedule) {
      const block = daySchedule.blocks[slotIndex]
      if (block) {
        variantsForThisSlot.push(block)
      }
    }
    
    if (variantsForThisSlot.length > 0) {
      activitySlots.push(variantsForThisSlot)
    }
  }
  
  // Now randomly pick one variant from each activity slot
  const randomizedRoutine: ScheduleBlock[] = []
  
  for (const variants of activitySlots) {
    const randomIndex = Math.floor(Math.random() * variants.length)
    const selected = variants[randomIndex]
    
    // Create a new block with updated order
    randomizedRoutine.push({
      ...selected,
      id: crypto.randomUUID(), // New ID for uniqueness
      order: randomizedRoutine.length
    })
  }
  
  return randomizedRoutine
}
