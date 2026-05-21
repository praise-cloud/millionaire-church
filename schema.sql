-- Run this in your Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('host', 'contestant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  prize_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contestant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  join_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  current_question_index INTEGER NOT NULL DEFAULT 0,
  total_prize INTEGER NOT NULL DEFAULT 0,
  lifeline_50 BOOLEAN DEFAULT TRUE,
  lifeline_phone BOOLEAN DEFAULT TRUE,
  lifeline_audience BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Game rounds table
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  contestant_answer TEXT CHECK (contestant_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  prize_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

-- Session questions (links questions to sessions)
CREATE TABLE session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  UNIQUE(session_id, question_order)
);

ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Profiles: users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questions: hosts can CRUD their own, contestants can read host questions via sessions
CREATE POLICY "Hosts can insert their own questions"
  ON questions FOR INSERT
  WITH CHECK (auth.uid() = host_id AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'host'
  ));

CREATE POLICY "Users can read questions for their sessions"
  ON questions FOR SELECT
  USING (
    auth.uid() = host_id OR
    auth.uid() IN (
      SELECT contestant_id FROM game_sessions WHERE id IN (
        SELECT session_id FROM session_questions WHERE question_id = questions.id
      )
    )
  );

CREATE POLICY "Hosts can update their own questions"
  ON questions FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own questions"
  ON questions FOR DELETE
  USING (auth.uid() = host_id);

-- Game sessions: hosts and contestants can read
CREATE POLICY "Users can read their sessions"
  ON game_sessions FOR SELECT
  USING (
    auth.uid() = host_id OR
    auth.uid() = contestant_id OR
    (status = 'waiting' AND contestant_id IS NULL)
  );

CREATE POLICY "Hosts can create sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts or contestants can update sessions"
  ON game_sessions FOR UPDATE
  USING (
    auth.uid() = host_id OR
    auth.uid() = contestant_id OR
    (status = 'waiting' AND contestant_id IS NULL)
  );

-- Game rounds: participants can read
CREATE POLICY "Users can read their rounds"
  ON game_rounds FOR SELECT
  USING (
    auth.uid() IN (
      SELECT host_id FROM game_sessions WHERE id = session_id
      UNION
      SELECT contestant_id FROM game_sessions WHERE id = session_id
    )
  );

CREATE POLICY "Contestants can insert rounds"
  ON game_rounds FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT contestant_id FROM game_sessions WHERE id = session_id
    )
  );

-- Session questions: participants can read
CREATE POLICY "Users can read session questions"
  ON session_questions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT host_id FROM game_sessions WHERE id = session_id
      UNION
      SELECT contestant_id FROM game_sessions WHERE id = session_id
    )
  );

CREATE POLICY "Hosts can insert session questions"
  ON session_questions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT host_id FROM game_sessions WHERE id = session_id
    )
  );

-- Create join_code index
CREATE INDEX idx_game_sessions_join_code ON game_sessions(join_code);
CREATE INDEX idx_game_sessions_host ON game_sessions(host_id);
CREATE INDEX idx_game_sessions_contestant ON game_sessions(contestant_id);
CREATE INDEX idx_questions_host ON questions(host_id);
CREATE INDEX idx_session_questions_session ON session_questions(session_id);
