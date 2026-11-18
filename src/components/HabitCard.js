import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '../theme'

export default function HabitCard({ habit, onMarkDone }) {
  const { name, emoji, streak, completedToday } = habit

  return (
    <View style={styles.card}>
      {/* Left side: emoji + habit info */}
      <View style={styles.leftSection}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.habitName}>{name}</Text>
          <View style={styles.streakRow}>
            <Text style={styles.fireEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
            <Text style={[styles.streakText, streak > 0 && styles.streakActive]}>
              {streak > 0
                ? `${streak} day${streak === 1 ? '' : 's'} streak`
                : 'No streak yet'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right side: mark done button */}
      {completedToday ? (
        <View style={styles.doneChip}>
          <Text style={styles.doneCheckmark}>✓</Text>
          <Text style={styles.doneText}>Done</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.markButton}
          onPress={onMarkDone}
          activeOpacity={0.75}
        >
          <Text style={styles.markButtonText}>Mark done</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.emojiBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  streakText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  streakActive: {
    color: COLORS.streak,
    fontWeight: '600',
  },
  markButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  markButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  doneCheckmark: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
  },
  doneText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
  },
})
