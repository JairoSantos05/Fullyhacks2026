/**
 * Adaptive Motivation Engine
 * A pure JavaScript rule-based system for tracking and motivating user goals.
 * Works for ANY goal type: studying, fitness, habits, productivity, learning skills, etc.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE POOLS - Categorized for different motivational contexts
// ═══════════════════════════════════════════════════════════════════════════════

// Gentle recovery messages for when user misses goals (supportive, not harsh)
const MISSED_GOAL_MESSAGES = {
  normal: [
    "It's okay to restart. Progress is built on comebacks.",
    "Every expert was once a beginner who didn't give up.",
    "A step backward is just a setup for a leap forward.",
    "Today is a fresh start. One small action matters.",
    "The ocean has depths, but you have persistence.",
    "Rest, then dive back in. You've got this.",
    "One missed day doesn't define your journey.",
    "The tide goes out, but it always comes back in.",
  ],
  stronger: [
    "You've been off track recently. Start small—just one step today.",
    "Don't let one slip become a slide. Reclaim your momentum now.",
    "Your future self will thank you for starting again today.",
    "The hardest part is beginning. Take one small step.",
    "Pressure builds diamonds. Let this challenge refine you.",
  ],
  special: [
    "Champions aren't those who never fall, but those who rise every time.",
    "The depth you're diving into requires resilience. Come back stronger.",
    "This is where most quit. Be different. Start now.",
  ]
};

// Consistency and momentum messages (intensity increases with streak)
const STREAK_MESSAGES = {
  1: {  // Starting the streak
    normal: [
      "Great start! The journey of a thousand miles begins with one step.",
      "You've initiated the momentum. Keep it flowing.",
      "First step done. The path ahead is waiting.",
      "A ripple becomes a wave. Watch your progress grow.",
    ],
    stronger: [
      "Momentum is building. You're on your way.",
      "The engine is warming up. Stay in the flow.",
      "You've started something powerful. Keep going.",
    ],
    special: [
      "Every legend began exactly where you are right now.",
      "This is the first stroke of something great.",
    ]
  },
  3: {  // Building consistency
    normal: [
      "Great consistency! Momentum is building.",
      "Three in a row! You're developing real strength.",
      "Your dedication is showing. Keep the rhythm going.",
      "The habit is taking root. Nurture it further.",
    ],
    stronger: [
      "You're building an elite habit system. Keep going!",
      "Consistency is your superpower now. Embrace it.",
      "Three days strong—your future self is grateful.",
    ],
    special: [
      "This is how legends are made. One day at a time.",
      "Your discipline is inspiring. The ocean respects that.",
    ]
  },
  7: {  // Strong momentum
    normal: [
      "A full week! You're building something remarkable.",
      "Seven days of commitment. That's real progress.",
      "Your streak is becoming unbreakable.",
      "The habit is now part of who you are.",
    ],
    stronger: [
      "You're building an elite habit system. Keep going!",
      "One week strong—your dedication is showing.",
      "This is elite-level consistency. Impressive.",
    ],
    special: [
      "A full week of dominance. You're in rare company.",
      "This is where most fail. You didn't. Exceptional.",
      "Seven days of choosing growth. That's a lifestyle now.",
    ]
  },
  14: {  // Advanced streak
    normal: [
      "Two weeks strong! Your dedication is remarkable.",
      "The habit is now unbreakable. Well done.",
      "Consistency at this level is rare. Keep it up.",
    ],
    stronger: [
      "Two weeks of elite performance. You're unstoppable.",
      "Your streak has become legendary. The ocean knows your name.",
    ],
    special: [
      "Fourteen days of choosing growth. You're in the top 1%.",
      "This level of commitment separates achievers from dreamers.",
    ]
  },
  30: {  // Master level streak
    normal: [
      "One month! Your commitment is extraordinary.",
      "A full month of consistency. That's a lifestyle change.",
    ],
    stronger: [
      "30 days of excellence. You've built something that lasts.",
      "One month strong—you've proven you're different.",
    ],
    special: [
      "A month of dominance. You're not just consistent—you're legendary.",
      "This is the behavior of the exceptional. The ocean bows to you.",
    ]
  }
};

// Goal completion / reward messages (celebratory, rewarding)
const SUCCESS_MESSAGES = {
  normal: [
    "Goal completed! The depth grows with each victory.",
    "Another task conquered. You're diving deeper.",
    "Well done! Your progress is measurable and real.",
    "Task complete. The ocean gets a little more familiar.",
    "You moved the needle. Keep pushing forward.",
    "A win in the books. On to the next depth.",
  ],
  stronger: [
    "Massive progress detected. You're leveling up fast.",
    "You're diving deeper than ever before. Incredible.",
    "Each goal pushes you into new territory. Amazing.",
    "Your momentum is accelerating. The depths await.",
  ],
  special: [
    "A true conqueror of depths. This victory echoes in the abyss.",
    "You've just added a pearl to your collection. Magnificent.",
    "The ocean recognizes your achievement. Legendary.",
  ]
};

// Rare, exciting progression messages (for level-ups)
const LEVEL_UP_MESSAGES = {
  normal: [
    "You just reached a new level: {level}. Growth is happening.",
    "Zone unlocked: {level}. The depths deepen before you.",
    "You've ascended to {level}. New challenges await.",
  ],
  stronger: [
    "BREAKTHROUGH! You've entered {level}. The real dive begins now.",
    "Level up to {level}! Your dedication is paying off massively.",
    "You've crossed into {level}. The view from here is incredible.",
  ],
  special: [
    "🌊 LEGENDARY ASCENSION! You've reached {level}! The ocean itself acknowledges you!",
    "🏆 You've achieved {level}! This is rare company—you're in the top tier now!",
    "⚡ MASSIVE BREAKTHROUGH! {level} unlocked! Your commitment is extraordinary!",
  ]
};

// Default/encouragement messages
const DEFAULT_MESSAGES = {
  normal: [
    "Start with one small win today.",
    "Dive deeper. Focus on the next meter.",
    "One task at a time. The depth will come.",
    "Your next victory is waiting. Go claim it.",
    "The ocean is vast. Take one stroke at a time.",
  ],
  stronger: [
    "Your potential is deeper than you know. Start now.",
    "Today is another chance to go deeper. Take it.",
    "The best time to dive was when you started. The second best is now.",
  ],
  special: [
    "This is your moment. Make it count.",
    "The depth you're seeking is earned, not given. Begin.",
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// RANDOMNESS CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns a random tier based on controlled probability.
 * - 70% normal
 * - 20% stronger
 * - 10% special
 */
function getRandomTier() {
  const roll = Math.random();
  if (roll < 0.70) return 'normal';
  if (roll < 0.90) return 'stronger';
  return 'special';
}

/**
 * Selects a random message from the given pool.
 * If tier is provided, selects from that tier.
 * Otherwise, uses controlled randomness.
 */
function selectMessage(pool, tier = null) {
  if (!tier) tier = getRandomTier();
  const messages = pool[tier] || pool.normal || [];
  if (!messages.length) return pool.normal?.[0] || "Start with one small win today.";
  return messages[Math.floor(Math.random() * messages.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOTIVATION STATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a new motivation state object
 * @returns {Object} Initial state for the motivation system
 */
function createMotivationState() {
  return {
    points: 0,
    streak: 0,
    missedCount: 0,
    level: 'Twilight Zone',
    previousLevel: null,
    previousPoints: 0,
    message: null
  };
}

/**
 * Updates the level based on points (sea zones)
 * @param {number} points - Current points
 * @returns {string} The appropriate sea zone level
 */
function updateLevel(points) {
  if (points >= 1200) return 'Trench Zone';
  if (points >= 500) return 'Abyssal Zone';
  if (points >= 100) return 'Midnight Zone';
  return 'Twilight Zone';
}

/**
 * Gets an adaptive motivational message based on behavior patterns
 * Uses controlled randomness for message variety.
 * @param {Object} state - Current motivation state
 * @returns {string} Motivational message
 */
function getMotivationMessage(state) {
  // Priority 1: Handle missed count patterns (recovery tone)
  if (state.missedCount >= 3) {
    return selectMessage(MISSED_GOAL_MESSAGES);
  }
  if (state.missedCount >= 1) {
    return selectMessage(MISSED_GOAL_MESSAGES);
  }

  // Priority 2: Handle streak patterns (consistency + momentum)
  // Find the appropriate streak tier
  let streakTier = 1;
  const sortedTiers = Object.keys(STREAK_MESSAGES).map(Number).sort((a, b) => b - a);
  for (const tier of sortedTiers) {
    if (state.streak >= tier) {
      streakTier = tier;
      break;
    }
  }

  if (state.streak >= 3) {
    return selectMessage(STREAK_MESSAGES[streakTier]);
  }

  // Priority 3: Handle level changes (rare, exciting)
  if (state.previousLevel && state.level !== state.previousLevel) {
    const levelUp = ['Twilight Zone', 'Midnight Zone', 'Abyssal Zone', 'Trench Zone'];
    const currentIndex = levelUp.indexOf(state.level);
    const previousIndex = levelUp.indexOf(state.previousLevel);
    if (currentIndex > previousIndex) {
      const msg = selectMessage(LEVEL_UP_MESSAGES);
      return msg.replace('{level}', state.level);
    }
  }

  // Priority 4: Handle significant point increases (success/reward)
  const pointsGained = state.points - state.previousPoints;
  if (pointsGained >= 30) {
    return selectMessage(SUCCESS_MESSAGES);
  }

  // Priority 5: Handle regular success (streak of 1-2)
  if (state.streak === 1) {
    return selectMessage(STREAK_MESSAGES[1]);
  }

  // Default message
  return selectMessage(DEFAULT_MESSAGES);
}

/**
 * Completes a goal - updates state and returns new state with message
 * @param {Object} state - Current motivation state
 * @returns {Object} Updated state with message
 */
function completeGoal(state) {
  const previousLevel = state.level;
  const previousPoints = state.points;

  // Update points and streak
  const newState = {
    ...state,
    points: state.points + 10,
    streak: state.streak + 1,
    missedCount: 0,
    previousLevel,
    previousPoints
  };

  // Update level
  newState.level = updateLevel(newState.points);

  // Add motivation message
  newState.message = getMotivationMessage(newState);

  return newState;
}

/**
 * Fails or skips a goal - updates state and returns new state with message
 * @param {Object} state - Current motivation state
 * @returns {Object} Updated state with message
 */
function failOrSkipGoal(state) {
  const newState = {
    ...state,
    missedCount: state.missedCount + 1,
    streak: 0,
    previousPoints: state.points
  };

  // Add motivation message
  newState.message = getMotivationMessage(newState);

  return newState;
}

/**
 * Resets the motivation state to initial values
 * @param {Object} state - Current motivation state
 * @returns {Object} Reset state
 */
function resetMotivationState(state) {
  return createMotivationState();
}

/**
 * Gets a summary of the current motivation state
 * @param {Object} state - Current motivation state
 * @returns {Object} Summary object
 */
function getMotivationSummary(state) {
  return {
    points: state.points,
    streak: state.streak,
    missedCount: state.missedCount,
    level: state.level,
    message: state.message || getMotivationMessage(state)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIERARCHICAL TASK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a new subtask object
 * @param {number} id - Unique subtask ID
 * @param {string} title - Subtask title
 * @returns {Object} Subtask object
 */
function createSubtask(id, title) {
  return {
    id,
    title,
    completed: false
  };
}

/**
 * Creates a new main task with subtasks
 * @param {number} id - Unique task ID
 * @param {string} title - Main task title
 * @param {Array} subtasks - Array of subtask objects
 * @returns {Object} Main task object
 */
function createTask(id, title, subtasks = []) {
  return {
    id,
    title,
    completed: false,
    subtasks: subtasks.map((st, idx) =>
      typeof st === 'string' ? createSubtask(idx + 1, st) : st
    )
  };
}

/**
 * Gets the progress percentage of a task
 * @param {Object} task - Main task object
 * @returns {number} Percentage (0-100) of completed subtasks
 */
function getTaskProgress(task) {
  if (!task.subtasks || task.subtasks.length === 0) return 0;
  const completed = task.subtasks.filter(st => st.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
}

/**
 * Completes a subtask within a main task
 * Returns updated task; if all subtasks done, marks main task complete
 * @param {Object} task - Main task object
 * @param {number} subtaskId - ID of subtask to complete
 * @returns {Object} Updated task object
 */
function completeSubtask(task, subtaskId) {
  const updatedTask = {
    ...task,
    subtasks: task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: true } : st
    )
  };

  // Check if all subtasks are now complete
  const allComplete = updatedTask.subtasks.every(st => st.completed);
  if (allComplete) {
    updatedTask.completed = true;
  }

  return updatedTask;
}

/**
 * Resets a task and all its subtasks to incomplete
 * @param {Object} task - Main task object
 * @returns {Object} Reset task object
 */
function resetTask(task) {
  return {
    ...task,
    completed: false,
    subtasks: task.subtasks.map(st => ({ ...st, completed: false }))
  };
}

/**
 * Skips or marks a subtask as missed
 * @param {Object} task - Main task object
 * @param {number} subtaskId - ID of subtask to skip
 * @returns {Object} Updated task object
 */
function skipSubtask(task, subtaskId) {
  // Skipped subtasks are not marked complete, but the task remains incomplete
  // This allows the user to acknowledge a missed subtask without completion
  return task;
}

/**
 * Gets the number of completed subtasks
 * @param {Object} task - Main task object
 * @returns {number} Count of completed subtasks
 */
function getCompletedSubtaskCount(task) {
  return task.subtasks.filter(st => st.completed).length;
}

/**
 * Completes a subtask and updates motivation state
 * Returns { updatedTask, motivationState, reward }
 * @param {Object} task - Main task object
 * @param {number} subtaskId - ID of subtask to complete
 * @param {Object} motivationState - Current motivation state
 * @returns {Object} Object with updatedTask, updated motivationState, and reward info
 */
function completeSubtaskWithMotivation(task, subtaskId, motivationState) {
  const updatedTask = completeSubtask(task, subtaskId);
  const isMainTaskComplete = updatedTask.completed;

  // Determine reward based on whether main task completed
  const subtaskReward = 5;
  const mainTaskReward = 15;
  const totalReward = isMainTaskComplete ? (subtaskReward + mainTaskReward) : subtaskReward;

  // Update motivation state
  const newMotivationState = {
    ...motivationState,
    points: motivationState.points + totalReward,
    streak: motivationState.streak + 1,
    missedCount: 0,
    previousLevel: motivationState.level,
    previousPoints: motivationState.points
  };

  // Update level
  newMotivationState.level = updateLevel(newMotivationState.points);

  // Get motivation message
  newMotivationState.message = getMotivationMessage(newMotivationState);

  return {
    updatedTask,
    motivationState: newMotivationState,
    reward: totalReward,
    isMainTaskComplete,
    message: isMainTaskComplete
      ? `Task "${task.title}" completed! +${totalReward} points!`
      : `Subtask completed! +${totalReward} points`
  };
}

/**
 * Marks a subtask as missed and updates motivation state
 * Returns { updatedTask, motivationState }
 * @param {Object} task - Main task object
 * @param {number} subtaskId - ID of subtask to miss
 * @param {Object} motivationState - Current motivation state
 * @returns {Object} Object with updated task and motivation state
 */
function missSubtaskWithMotivation(task, subtaskId, motivationState) {
  // Skipped subtasks reset the streak
  const newMotivationState = {
    ...motivationState,
    missedCount: motivationState.missedCount + 1,
    streak: 0,
    previousPoints: motivationState.points
  };

  newMotivationState.message = getMotivationMessage(newMotivationState);

  return {
    updatedTask: task,  // Task structure unchanged when missing
    motivationState: newMotivationState,
    message: `Subtask missed. Focus on what's next.`
  };
}

// Export for module usage (Node.js, ES6 modules, etc.)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createMotivationState,
    updateLevel,
    getMotivationMessage,
    completeGoal,
    failOrSkipGoal,
    resetMotivationState,
    getMotivationSummary,
    // Hierarchical task system
    createTask,
    createSubtask,
    getTaskProgress,
    completeSubtask,
    resetTask,
    skipSubtask,
    getCompletedSubtaskCount,
    completeSubtaskWithMotivation,
    missSubtaskWithMotivation,
    // Also export message pools for external use
    MISSED_GOAL_MESSAGES,
    STREAK_MESSAGES,
    SUCCESS_MESSAGES,
    LEVEL_UP_MESSAGES,
    DEFAULT_MESSAGES,
    getRandomTier,
    selectMessage
  };
}

// For browser usage - expose functions globally
if (typeof window !== 'undefined') {
  window.MotivationEngine = {
    createMotivationState,
    updateLevel,
    getMotivationMessage,
    completeGoal,
    failOrSkipGoal,
    resetMotivationState,
    getMotivationSummary,
    // Hierarchical task system
    createTask,
    createSubtask,
    getTaskProgress,
    completeSubtask,
    resetTask,
    skipSubtask,
    getCompletedSubtaskCount,
    completeSubtaskWithMotivation,
    missSubtaskWithMotivation,
    MISSED_GOAL_MESSAGES,
    STREAK_MESSAGES,
    SUCCESS_MESSAGES,
    LEVEL_UP_MESSAGES,
    DEFAULT_MESSAGES,
    getRandomTier,
    selectMessage
  };
}

// Example usage
if (typeof require !== 'undefined' && require.main === module) {
  // Create state
  let state = createMotivationState();

  // Complete a goal
  state = completeGoal(state);
  console.log(`Level: ${state.level}`);
  console.log(`Points: ${state.points}`);
  console.log(`Message: ${state.message}`);
  console.log();

  // Complete 3 more goals (streak = 3)
  for (let i = 0; i < 3; i++) {
    state = completeGoal(state);
  }
  console.log(`Streak: ${state.streak}`);
  console.log(`Message: ${state.message}`);
  console.log();

  // Simulate a failure
  state = failOrSkipGoal(state);
  console.log(`Missed count: ${state.missedCount}`);
  console.log(`Streak: ${state.streak}`);
  console.log(`Message: ${state.message}`);
}