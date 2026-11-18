# HabitFlow — React Native Habit Tracker

A simple mobile app to track daily habits and build streaks. Built with **Expo** + **Supabase**.

---

## Features

- Email sign-up & login (Supabase Auth)
- Add habits with a custom emoji
- Mark a habit as done for today
- Streak counter per habit (🔥 consecutive days)
- Pull-to-refresh on the home screen
- Data is private to each user (Row Level Security)

---

## Before you run: Supabase setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In your project dashboard, open **SQL Editor → New query** and run the SQL from the section below.
3. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public** key

> **Tip:** If you want to skip email confirmation while testing, go to  
> **Authentication → Providers → Email** and disable "Confirm email".

### SQL to run in Supabase

```sql
create table public.habits (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  emoji       text        not null default '✅',
  created_at  timestamptz default now() not null
);

create table public.habit_completions (
  id             uuid  default gen_random_uuid() primary key,
  habit_id       uuid  references public.habits(id) on delete cascade not null,
  user_id        uuid  references auth.users(id) on delete cascade not null,
  completed_date date  default current_date not null,
  created_at     timestamptz default now() not null,
  unique(habit_id, completed_date)
);

alter table public.habits enable row level security;
create policy "Users can view their own habits"   on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert their own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update their own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete their own habits" on public.habits for delete using (auth.uid() = user_id);

alter table public.habit_completions enable row level security;
create policy "Users can view their own completions"   on public.habit_completions for select using (auth.uid() = user_id);
create policy "Users can insert their own completions" on public.habit_completions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own completions" on public.habit_completions for delete using (auth.uid() = user_id);
```

---

## Running the app

### 1. Install Node.js and Expo CLI

If you don't have them yet:
- Download Node.js from [nodejs.org](https://nodejs.org) (LTS version)
- Install the Expo CLI:
  ```bash
  npm install -g expo-cli
  ```

### 2. Clone / open the project

```bash
cd habit-tracker-app
```

### 3. Install dependencies

```bash
npm install
```

### 4. Add your Supabase credentials

Copy the example env file and fill it in:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 5. Start the app

```bash
npx expo start
```

This opens Expo DevTools in your browser. Then:
- **On your phone:** Install the [Expo Go](https://expo.dev/client) app and scan the QR code.
- **On Android emulator:** Press `a` in the terminal.
- **On iOS simulator:** Press `i` in the terminal (Mac only).

---

## Project structure

```
habit-tracker-app/
├── App.js                  # Entry point, navigation, auth state
├── app.json                # Expo config
├── .env                    # Your Supabase keys (not committed to git)
├── .env.example            # Template for .env
└── src/
    ├── theme.js            # Colors — change these to retheme the app
    ├── lib/
    │   └── supabase.js     # Supabase client setup
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── SignUpScreen.js
    │   ├── HomeScreen.js
    │   └── AddHabitScreen.js
    └── components/
        └── HabitCard.js    # Single habit card (emoji, name, streak, button)
```

---

## How streaks work

A streak increments each day you mark a habit done. The app counts consecutive days ending today (or yesterday, so you don't lose your streak first thing in the morning). If you miss a day the streak resets to 0.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Invalid API key" error | Double-check your `.env` values match the Supabase dashboard |
| Sign up succeeds but you can't log in | Turn off email confirmation in Supabase Auth settings |
| Habits not showing | Make sure you ran the full SQL (including the RLS policies) |
| App crashes on start | Run `npm install` again and restart with `npx expo start --clear` |
