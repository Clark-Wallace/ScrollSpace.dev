# ScrollSpace.dev Authentication System Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for adding a robust user authentication system to ScrollSpace.dev while maintaining the cyberpunk aesthetic and seamless integration with existing features.

## Tech Stack
- **Frontend**: Astro with React components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (built-in)
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **State Management**: React Context + Supabase Realtime
- **TypeScript**: For type safety

## Database Schema Updates

### 1. Users Table (Managed by Supabase Auth)
```sql
-- Supabase auth.users table is automatically created
-- We'll create a public profiles table for additional user data

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_status ON profiles(status);
```

### 2. Update Existing Tables
```sql
-- Update chat_messages to use user_id instead of username
ALTER TABLE chat_messages ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE chat_messages ADD COLUMN user_profile JSONB; -- Cache username/avatar

-- Update signal_fragments
ALTER TABLE signal_fragments ADD COLUMN claimed_by_id UUID REFERENCES auth.users(id);

-- Update fragment_pickups
ALTER TABLE fragment_pickups ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- OAuth accounts tracking (Supabase handles this internally)
-- No additional tables needed for OAuth
```

### 3. Row Level Security (RLS) Policies
```sql
-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Update chat_messages policies
CREATE POLICY "Authenticated users can send messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update fragments policies for authenticated users
CREATE POLICY "Authenticated users can claim fragments" 
  ON signal_fragments FOR UPDATE 
  USING (auth.uid() IS NOT NULL);
```

## Component Architecture

### 1. Authentication Components

#### `/src/components/auth/LoginForm.tsx`
- Email/password login
- OAuth provider buttons (GitHub, Google)
- "Forgot password" link
- Cyberpunk terminal-style UI
- Error handling with matrix-style messages

#### `/src/components/auth/RegisterForm.tsx`
- Email/password registration
- Username selection (unique)
- Terms acceptance
- Automatic profile creation
- Welcome fragment assignment

#### `/src/components/auth/UserProfile.tsx`
- Display user info (avatar, bio, stats)
- Edit profile functionality
- Fragment collection display
- Chat statistics
- Cyberpunk-themed profile card

#### `/src/components/auth/AuthGuard.tsx`
- Protected route wrapper
- Redirect to login if unauthenticated
- Loading state with matrix rain effect

#### `/src/components/auth/UserMenu.tsx`
- Dropdown menu for authenticated users
- Profile link
- Settings
- Logout option
- Status selector (online/away/busy)

### 2. Auth Context/Store

#### `/src/contexts/AuthContext.tsx`
```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}
```

### 3. Auth Hooks

#### `/src/hooks/useAuth.ts`
- Access auth context
- Handle auth state

#### `/src/hooks/useProfile.ts`
- Fetch and cache user profile
- Real-time profile updates

#### `/src/hooks/useRequireAuth.ts`
- Redirect if not authenticated
- Return user/profile data

## Auth Flow Architecture

### 1. Registration Flow
```
1. User clicks "Join the Matrix" 
2. Enters email, password, unique username
3. Creates Supabase auth user
4. Creates profile with username
5. Sends welcome email
6. Auto-login after registration
7. Redirect to profile setup
8. Award welcome fragment
```

### 2. Login Flow
```
1. User clicks "Jack In"
2. Email/password or OAuth
3. Verify credentials
4. Load user profile
5. Update last_seen
6. Redirect to original page or chat
7. Restore chat session if exists
```

### 3. OAuth Flow
```
1. User clicks GitHub/Google button
2. Redirect to OAuth provider
3. Handle callback
4. Check if profile exists
5. If new user, prompt for username
6. Create/update profile
7. Continue to app
```

### 4. Session Management
- Supabase handles JWT tokens
- Auto-refresh tokens
- Persist sessions in localStorage
- Handle expired sessions gracefully

## Integration Points

### 1. Chat System Integration
- Replace username-based auth with user_id
- Maintain backward compatibility
- Auto-populate username from profile
- Show online/offline status from auth
- Profile avatars in chat
- Click username to view profile

### 2. Fragment System Integration
- Link fragments to user_id
- Profile shows fragment collection
- Fragment trading between users (future)
- Achievement system based on fragments

### 3. Navigation Updates
- Add auth state to header
- Show user menu when logged in
- Update navigation links
- Protected admin routes

## Implementation Phases

### Phase 1: Core Authentication (Week 1)
1. Set up Supabase Auth
2. Create database schema
3. Build login/register components
4. Implement auth context
5. Basic session management

### Phase 2: User Profiles (Week 2)
1. Profile creation/editing
2. Avatar upload
3. Bio and display name
4. Public profile pages
5. User statistics

### Phase 3: OAuth Integration (Week 3)
1. Configure GitHub OAuth
2. Configure Google OAuth
3. Handle OAuth callbacks
4. Username selection for OAuth users

### Phase 4: System Integration (Week 4)
1. Update chat system
2. Update fragment system
3. Protected routes
4. Admin panel auth
5. Testing and polish

## Security Considerations

1. **Password Requirements**
   - Minimum 8 characters
   - Supabase handles hashing

2. **Rate Limiting**
   - Login attempts
   - API calls per user
   - Fragment claims

3. **Data Privacy**
   - Email verification required
   - Profile privacy settings
   - GDPR compliance

4. **Session Security**
   - HTTP-only cookies
   - Secure flag in production
   - CSRF protection

## UI/UX Considerations

### Cyberpunk Theme Elements
- Terminal-style input fields
- Matrix rain effects
- Glitch transitions
- Neon borders and shadows
- Monospace fonts
- ASCII art decorations
- Error messages as "system alerts"
- Success messages as "access granted"

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Adaptive layouts
- Performance optimization

## Migration Strategy

1. **Existing Users**
   - Prompt to create account
   - Reserve existing usernames
   - Migrate chat history
   - Preserve fragments

2. **Backward Compatibility**
   - Guest mode for chat (limited)
   - View-only for unauthenticated
   - Gradual feature rollout

## Testing Strategy

1. **Unit Tests**
   - Auth functions
   - Profile operations
   - Validation logic

2. **Integration Tests**
   - Auth flow
   - OAuth providers
   - Database operations

3. **E2E Tests**
   - Registration process
   - Login/logout
   - Profile editing
   - Protected routes

## Performance Optimization

1. **Caching**
   - Profile data
   - Auth state
   - User preferences

2. **Lazy Loading**
   - Profile images
   - Fragment collections
   - User statistics

3. **Database Optimization**
   - Proper indexes
   - Query optimization
   - Connection pooling

## Future Enhancements

1. **Two-Factor Authentication**
2. **Social Features**
   - Friend system
   - Private messaging
   - Fragment trading

3. **Gamification**
   - XP system
   - Achievements
   - Leaderboards

4. **Advanced Profiles**
   - Custom themes
   - Profile badges
   - Showcase fragments