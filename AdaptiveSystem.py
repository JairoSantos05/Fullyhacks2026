"""
Adaptive Motivation Engine
A pure Python rule-based system for tracking and motivating user goals.
Works for ANY goal type: studying, fitness, habits, productivity, learning skills, etc.
"""

import random
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field


class GoalType(Enum):
    """Goal types supported by the system"""
    STUDYING = 'studying'
    FITNESS = 'fitness'
    HABITS = 'habits'
    PRODUCTIVITY = 'productivity'
    LEARNING_SKILLS = 'learning_skills'


# ═══════════════════════════════════════════════════════════════════════════════
# MESSAGE POOLS - Categorized for different motivational contexts
# ═══════════════════════════════════════════════════════════════════════════════

# Gentle recovery messages for when user misses goals (supportive, not harsh)
MISSED_GOAL_MESSAGES = {
    'normal': [
        "It's okay to restart. Progress is built on comebacks.",
        "Every expert was once a beginner who didn't give up.",
        "A step backward is just a setup for a leap forward.",
        "Today is a fresh start. One small action matters.",
        "The ocean has depths, but you have persistence.",
        "Rest, then dive back in. You've got this.",
        "One missed day doesn't define your journey.",
        "The tide goes out, but it always comes back in.",
    ],
    'stronger': [
        "You've been off track recently. Start small—just one step today.",
        "Don't let one slip become a slide. Reclaim your momentum now.",
        "Your future self will thank you for starting again today.",
        "The hardest part is beginning. Take one small step.",
        "Pressure builds diamonds. Let this challenge refine you.",
    ],
    'special': [
        "Champions aren't those who never fall, but those who rise every time.",
        "The depth you're diving into requires resilience. Come back stronger.",
        "This is where most quit. Be different. Start now.",
    ]
}

# Consistency and momentum messages (intensity increases with streak)
STREAK_MESSAGES = {
    1: {  # Starting the streak
        'normal': [
            "Great start! The journey of a thousand miles begins with one step.",
            "You've initiated the momentum. Keep it flowing.",
            "First step done. The path ahead is waiting.",
            "A ripple becomes a wave. Watch your progress grow.",
        ],
        'stronger': [
            "Momentum is building. You're on your way.",
            "The engine is warming up. Stay in the flow.",
            "You've started something powerful. Keep going.",
        ],
        'special': [
            "Every legend began exactly where you are right now.",
            "This is the first stroke of something great.",
        ]
    },
    3: {  # Building consistency
        'normal': [
            "Great consistency! Momentum is building.",
            "Three in a row! You're developing real strength.",
            "Your dedication is showing. Keep the rhythm going.",
            "The habit is taking root. Nurture it further.",
        ],
        'stronger': [
            "You're building an elite habit system. Keep going!",
            "Consistency is your superpower now. Embrace it.",
            "Three days strong—your future self is grateful.",
        ],
        'special': [
            "This is how legends are made. One day at a time.",
            "Your discipline is inspiring. The ocean respects that.",
        ]
    },
    7: {  # Strong momentum
        'normal': [
            "A full week! You're building something remarkable.",
            "Seven days of commitment. That's real progress.",
            "Your streak is becoming unbreakable.",
            "The habit is now part of who you are.",
        ],
        'stronger': [
            "You're building an elite habit system. Keep going!",
            "One week strong—your dedication is showing.",
            "This is elite-level consistency. Impressive.",
        ],
        'special': [
            "A full week of dominance. You're in rare company.",
            "This is where most fail. You didn't. Exceptional.",
            "Seven days of choosing growth. That's a lifestyle now.",
        ]
    },
    14: {  # Advanced streak
        'normal': [
            "Two weeks strong! Your dedication is remarkable.",
            "The habit is now unbreakable. Well done.",
            "Consistency at this level is rare. Keep it up.",
        ],
        'stronger': [
            "Two weeks of elite performance. You're unstoppable.",
            "Your streak has become legendary. The ocean knows your name.",
        ],
        'special': [
            "Fourteen days of choosing growth. You're in the top 1%.",
            "This level of commitment separates achievers from dreamers.",
        ]
    },
    30: {  # Master level streak
        'normal': [
            "One month! Your commitment is extraordinary.",
            "A full month of consistency. That's a lifestyle change.",
        ],
        'stronger': [
            "30 days of excellence. You've built something that lasts.",
            "One month strong—you've proven you're different.",
        ],
        'special': [
            "A month of dominance. You're not just consistent—you're legendary.",
            "This is the behavior of the exceptional. The ocean bows to you.",
        ]
    }
}

# Goal completion / reward messages (celebratory, rewarding)
SUCCESS_MESSAGES = {
    'normal': [
        "Goal completed! The depth grows with each victory.",
        "Another task conquered. You're diving deeper.",
        "Well done! Your progress is measurable and real.",
        "Task complete. The ocean gets a little more familiar.",
        "You moved the needle. Keep pushing forward.",
        "A win in the books. On to the next depth.",
    ],
    'stronger': [
        "Massive progress detected. You're leveling up fast.",
        "You're diving deeper than ever before. Incredible.",
        "Each goal pushes you into new territory. Amazing.",
        "Your momentum is accelerating. The depths await.",
    ],
    'special': [
        "A true conqueror of depths. This victory echoes in the abyss.",
        "You've just added a pearl to your collection. Magnificent.",
        "The ocean recognizes your achievement. Legendary.",
    ]
}

# Rare, exciting progression messages (for level-ups)
LEVEL_UP_MESSAGES = {
    'normal': [
        "You just reached a new level: {level}. Growth is happening.",
        "Zone unlocked: {level}. The depths deepen before you.",
        "You've ascended to {level}. New challenges await.",
    ],
    'stronger': [
        "BREAKTHROUGH! You've entered {level}. The real dive begins now.",
        "Level up to {level}! Your dedication is paying off massively.",
        "You've crossed into {level}. The view from here is incredible.",
    ],
    'special': [
        "🌊 LEGENDARY ASCENSION! You've reached {level}! The ocean itself acknowledges you!",
        "🏆 You've achieved {level}! This is rare company—you're in the top tier now!",
        "⚡ MASSIVE BREAKTHROUGH! {level} unlocked! Your commitment is extraordinary!",
    ]
}

# Default/encouragement messages
DEFAULT_MESSAGES = {
    'normal': [
        "Start with one small win today.",
        "Dive deeper. Focus on the next meter.",
        "One task at a time. The depth will come.",
        "Your next victory is waiting. Go claim it.",
        "The ocean is vast. Take one stroke at a time.",
    ],
    'stronger': [
        "Your potential is deeper than you know. Start now.",
        "Today is another chance to go deeper. Take it.",
        "The best time to dive was when you started. The second best is now.",
    ],
    'special': [
        "This is your moment. Make it count.",
        "The depth you're seeking is earned, not given. Begin.",
    ]
}


# ═══════════════════════════════════════════════════════════════════════════════
# RANDOMNESS CONTROLLER
# ═══════════════════════════════════════════════════════════════════════════════

def get_random_tier() -> str:
    """
    Returns a random tier based on controlled probability.
    - 70% normal
    - 20% stronger
    - 10% special
    """
    roll = random.random()
    if roll < 0.70:
        return 'normal'
    elif roll < 0.90:
        return 'stronger'
    else:
        return 'special'


def select_message(pool: dict, tier: str = None) -> str:
    """
    Selects a random message from the given pool.
    If tier is provided, selects from that tier.
    Otherwise, uses controlled randomness.
    """
    if tier is None:
        tier = get_random_tier()
    
    messages = pool.get(tier, pool.get('normal', []))
    if not messages:
        messages = pool.get('normal', [])
    
    return random.choice(messages)


# ═══════════════════════════════════════════════════════════════════════════════
# MOTIVATION STATE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class MotivationState:
    """State object for the motivation system"""
    goal_type: GoalType = GoalType.HABITS
    points: int = 0
    streak: int = 0
    missed_count: int = 0
    level: str = 'Twilight Zone'
    previous_level: Optional[str] = None
    previous_points: int = 0
    message: Optional[str] = None


def update_level(points: int) -> str:
    """
    Updates the level based on points (sea zones).
    
    Args:
        points: Current points
        
    Returns:
        The appropriate sea zone level
    """
    if points >= 1200:
        return 'Trench Zone'
    elif points >= 500:
        return 'Abyssal Zone'
    elif points >= 100:
        return 'Midnight Zone'
    else:
        return 'Twilight Zone'


def get_motivation_message(state: MotivationState) -> str:
    """
    Gets an adaptive motivational message based on behavior patterns.
    Uses controlled randomness for message variety.
    
    Args:
        state: Current motivation state
        
    Returns:
        Motivational message
    """
    # Priority 1: Handle missed count patterns (recovery tone)
    if state.missed_count >= 3:
        return select_message(MISSED_GOAL_MESSAGES)
    if state.missed_count >= 1:
        return select_message(MISSED_GOAL_MESSAGES)
    
    # Priority 2: Handle streak patterns (consistency + momentum)
    # Find the appropriate streak tier
    streak_tier = 1
    for tier in sorted(STREAK_MESSAGES.keys(), reverse=True):
        if state.streak >= tier:
            streak_tier = tier
            break
    
    if state.streak >= 3:
        return select_message(STREAK_MESSAGES[streak_tier])
    
    # Priority 3: Handle level changes (rare, exciting)
    if state.previous_level and state.level != state.previous_level:
        level_up = ['Twilight Zone', 'Midnight Zone', 'Abyssal Zone', 'Trench Zone']
        current_index = level_up.index(state.level)
        previous_index = level_up.index(state.previous_level)
        if current_index > previous_index:
            msg = select_message(LEVEL_UP_MESSAGES)
            return msg.format(level=state.level)
    
    # Priority 4: Handle significant point increases (success/reward)
    points_gained = state.points - state.previous_points
    if points_gained >= 30:
        return select_message(SUCCESS_MESSAGES)
    
    # Priority 5: Handle regular success (streak of 1-2)
    if state.streak == 1:
        return select_message(STREAK_MESSAGES[1])
    
    # Default message
    return select_message(DEFAULT_MESSAGES)


def complete_goal(state: MotivationState) -> MotivationState:
    """
    Completes a goal - updates state and returns new state with message.
    
    Args:
        state: Current motivation state
        
    Returns:
        Updated state with message
    """
    previous_level = state.level
    previous_points = state.points
    
    # Create new state with updated values
    new_state = MotivationState(
        goal_type=state.goal_type,
        points=state.points + 10,
        streak=state.streak + 1,
        missed_count=0,
        previous_level=previous_level,
        previous_points=previous_points
    )
    
    # Update level
    new_state.level = update_level(new_state.points)
    
    # Add motivation message
    new_state.message = get_motivation_message(new_state)
    
    return new_state


def fail_or_skip_goal(state: MotivationState) -> MotivationState:
    """
    Fails or skips a goal - updates state and returns new state with message.
    
    Args:
        state: Current motivation state
        
    Returns:
        Updated state with message
    """
    new_state = MotivationState(
        goal_type=state.goal_type,
        points=state.points,
        streak=0,
        missed_count=state.missed_count + 1,
        level=state.level,
        previous_level=state.previous_level,
        previous_points=state.points
    )
    
    # Add motivation message
    new_state.message = get_motivation_message(new_state)
    
    return new_state


def reset_motivation_state(state: MotivationState) -> MotivationState:
    """
    Resets the motivation state to initial values.
    
    Args:
        state: Current motivation state
        
    Returns:
        Reset state
    """
    return MotivationState(goal_type=state.goal_type)


def get_motivation_summary(state: MotivationState) -> dict:
    """
    Gets a summary of the current motivation state.
    
    Args:
        state: Current motivation state
        
    Returns:
        Summary dictionary
    """
    return {
        'goal_type': state.goal_type.value,
        'points': state.points,
        'streak': state.streak,
        'missed_count': state.missed_count,
        'level': state.level,
        'message': state.message or get_motivation_message(state)
    }


# Example usage
if __name__ == '__main__':
    # Create state for studying goal
    state = MotivationState(goal_type=GoalType.STUDYING)
    
    # Complete a goal
    state = complete_goal(state)
    print(f"Level: {state.level}")
    print(f"Points: {state.points}")
    print(f"Message: {state.message}")
    print()
    
    # Complete 3 more goals (streak = 3)
    for _ in range(3):
        state = complete_goal(state)
    print(f"Streak: {state.streak}")
    print(f"Message: {state.message}")
    print()
    
    # Simulate a failure
    state = fail_or_skip_goal(state)
    print(f"Missed count: {state.missed_count}")
    print(f"Streak: {state.streak}")
    print(f"Message: {state.message}")