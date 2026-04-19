/**
 * Adaptive Motivation Engine
 * A pure JavaScript rule-based system for tracking and motivating user goals.
 * Works for ANY goal type: studying, fitness, habits, productivity, learning skills, etc.
 */

// Goal types supported by the system
const GoalType = {
  STUDYING: 'studying',
  FITNESS: 'fitness',
  HABITS: 'habits',
  PRODUCTIVITY: 'productivity',
  LEARNING_SKILLS: 'learning_skills'
};

/**
 * Creates a new motivation state object
 * @param {string} goalType - The type of goal (use GoalType constants)
 * @returns {Object} Initial state for the motivation system
 */
function createMotivationState(goalType = GoalType.HABITS) {
  return {
    goalType,
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
 * @param {Object} state - Current motivation state
 * @returns {string} Motivational message
 */
function getMotivationMessage(state) {
  // Priority 1: Handle missed count patterns
  if (state.missedCount >= 3) {
    return "You've been off track recently. Start small—just one step today.";
  }
  if (state.missedCount >= 1) {
    return "It's okay to restart. Progress is built on comebacks.";
  }

  // Priority 2: Handle streak patterns
  if (state.streak >= 7) {
    return "You're building an elite habit system. Keep going!";
  }
  if (state.streak >= 3) {
    return "Great consistency! Momentum is building.";
  }

  // Priority 3: Handle level changes
  if (state.previousLevel && state.level !== state.previousLevel) {
    const levelUp = ['Twilight Zone', 'Midnight Zone', 'Abyssal Zone', 'Trench Zone'];
    const currentIndex = levelUp.indexOf(state.level);
    const previousIndex = levelUp.indexOf(state.previousLevel);
    if (currentIndex > previousIndex) {
      return `You just reached a new level: ${state.level}. Growth is happening.`;
    }
  }

  // Priority 4: Handle significant point increases
  const pointsGained = state.points - state.previousPoints;
  if (pointsGained >= 30) {
    return "Massive progress detected. You're leveling up fast.";
  }

  // Default message
  return "Start with one small win today.";
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
  return createMotivationState(state.goalType);
}

/**
 * Gets a summary of the current motivation state
 * @param {Object} state - Current motivation state
 * @returns {Object} Summary object
 */
function getMotivationSummary(state) {
  return {
    goalType: state.goalType,
    points: state.points,
    streak: state.streak,
    missedCount: state.missedCount,
    level: state.level,
    message: state.message || getMotivationMessage(state)
  };
}

// Export for module usage (Node.js, ES6 modules, etc.)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GoalType,
    createMotivationState,
    updateLevel,
    getMotivationMessage,
    completeGoal,
    failOrSkipGoal,
    resetMotivationState,
    getMotivationSummary
  };
}

// Example usage
if (require.main === module) {
  // Create state for studying goal
  let state = createMotivationState(GoalType.STUDYING);

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