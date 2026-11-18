import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import HabitCard from '../components/HabitCard'
import { COLORS } from '../theme'

// Returns how many consecutive days ending today (or yesterday) a habit was completed.
function calculateStreak(completions) {
  if (!completions || completions.length === 0) return 0

  // Get unique sorted dates, newest first
  const dates = [...new Set(completions.map((c) => c.completed_date))]
    .sort()
    .reverse()

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const today = todayDate.toISOString().split('T')[0]

  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toISOString().split('T')[0]

  // Streak must be active (completed today or yesterday)
  if (dates[0] !== today && dates[0] !== yesterday) return 0

  let streak = 1
  let current = dates[0]

  for (let i = 1; i < dates.length; i++) {
    const currentDate = new Date(current + 'T00:00:00')
    currentDate.setDate(currentDate.getDate() - 1)
    const expected = currentDate.toISOString().split('T')[0]

    if (dates[i] === expected) {
      streak++
      current = dates[i]
    } else {
      break
    }
  }

  return streak
}

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState(null)

  // Get the current user once when the screen mounts
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  // Fetch habits when we have a user
  useEffect(() => {
    if (user) fetchHabits()
  }, [user])

  // Re-fetch when coming back from AddHabitScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) fetchHabits()
    })
    return unsubscribe
  }, [navigation, user])

  const fetchHabits = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch all habits for this user
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true })

      if (habitsError) throw habitsError

      // Fetch all completions for this user
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')

      if (completionsError) throw completionsError

      // Attach streak + "completed today" info to each habit
      const enriched = habitsData.map((habit) => {
        const habitCompletions = completionsData.filter(
          (c) => c.habit_id === habit.id
        )
        return {
          ...habit,
          completedToday: habitCompletions.some(
            (c) => c.completed_date === today
          ),
          streak: calculateStreak(habitCompletions),
        }
      })

      setHabits(enriched)
    } catch (error) {
      Alert.alert('Error loading habits', error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  async function markDone(habit) {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]

    // Optimistically update UI
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, completedToday: true } : h
      )
    )

    const { error } = await supabase.from('habit_completions').insert({
      habit_id: habit.id,
      user_id: user.id,
      completed_date: today,
    })

    if (error) {
      // Unique constraint means it's already marked — not a real error
      if (!error.message.includes('unique')) {
        Alert.alert('Error', error.message)
        // Revert optimistic update
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, completedToday: false } : h
          )
        )
      }
    } else {
      // Refresh to get updated streak counts
      fetchHabits()
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const completedCount = habits.filter((h) => h.completedToday).length

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.headerTitle}>My Habits</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Progress summary */}
      {habits.length > 0 && (
        <View style={styles.progressBar}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completedCount} / {habits.length} done today
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round((completedCount / habits.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedCount / habits.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Habit list */}
      {loading ? (
        <ActivityIndicator
          color={COLORS.primary}
          size="large"
          style={{ marginTop: 60 }}
        />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard habit={item} onMarkDone={() => markDone(item)} />
          )}
          contentContainerStyle={
            habits.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetchHabits()
              }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add your first habit
              </Text>
            </View>
          }
        />
      )}

      {/* Floating add button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddHabit')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  signOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  signOutText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  progressBar: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
  },
})
