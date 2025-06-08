# ScrollSpace Authentication Integration Guide

This guide walks you through integrating the new authentication system with your existing ScrollSpace.dev application.

## 🚀 Quick Start

### 1. Database Setup

First, run the authentication SQL setup in your Supabase dashboard:

```sql
-- Copy and paste the contents of supabase-auth-setup.sql into your Supabase SQL editor
```

### 2. Environment Variables

Update your `.env` file with Supabase credentials:

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configure OAuth Providers

In your Supabase dashboard:

1. Go to Authentication → Providers
2. Enable GitHub and Google providers
3. Add your OAuth app credentials:

**GitHub:**
- Client ID: `your_github_client_id`
- Client Secret: `your_github_client_secret`
- Redirect URL: `https://yourdomain.com/auth/callback`

**Google:**
- Client ID: `your_google_client_id`
- Client Secret: `your_google_client_secret`
- Redirect URL: `https://yourdomain.com/auth/callback`

### 4. Update Your Layout

Replace your main layout with auth support:

```astro
---
// src/layouts/Layout.astro
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="ScrollSpace - Neural network for the cyberpunk underground" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <div id="auth-provider-root">
      <slot />
    </div>

    <script>
      // Initialize auth provider at the root level
      import { AuthProvider } from '../contexts/AuthContext';
      import { createRoot } from 'react-dom/client';
      import React from 'react';

      const authRoot = document.getElementById('auth-provider-root');
      if (authRoot && authRoot.children.length > 0) {
        // Wrap existing content with AuthProvider
        const existingContent = authRoot.innerHTML;
        authRoot.innerHTML = '';
        
        const root = createRoot(authRoot);
        root.render(
          React.createElement(AuthProvider, null,
            React.createElement('div', { 
              dangerouslySetInnerHTML: { __html: existingContent } 
            })
          )
        );
      }
    </script>
  </body>
</html>
```

## 🔧 Integration Steps

### Step 1: Update Navigation

Add authentication state to your navigation:

```tsx
// Example navigation component
import { useAuth } from '../hooks/useAuth';
import UserMenu from './auth/UserMenu';
import { useState } from 'react';
import UserProfile from './auth/UserProfile';

const Navigation = () => {
  const { user, profile, loading } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  if (loading) return <div>Loading...</div>;

  return (
    <nav className="flex items-center justify-between p-4">
      <div className="logo">ScrollSpace</div>
      
      <div className="flex items-center space-x-4">
        {user ? (
          <UserMenu onOpenProfile={() => setShowProfile(true)} />
        ) : (
          <a href="/auth/login" className="btn-cyberpunk">
            Jack In
          </a>
        )}
      </div>

      <UserProfile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </nav>
  );
};
```

### Step 2: Protect Routes

Add authentication guards to protected pages:

```astro
---
// src/pages/admin.astro
import Layout from '../layouts/Layout.astro';
---

<Layout title="Admin Panel - ScrollSpace">
  <div id="admin-app"></div>
</Layout>

<script>
  import AuthGuard from '../components/auth/AuthGuard';
  import AdminPanel from '../components/AdminPanel';
  import { AuthProvider } from '../contexts/AuthContext';
  import { createRoot } from 'react-dom/client';
  import React from 'react';

  const container = document.getElementById('admin-app');
  if (container) {
    const root = createRoot(container);
    root.render(
      React.createElement(AuthProvider, null,
        React.createElement(AuthGuard, { 
          requireAuth: true,
          redirectTo: '/auth/login'
        },
          React.createElement(AdminPanel)
        )
      )
    );
  }
</script>
```

### Step 3: Update Chat System

Replace your existing chat implementation:

```tsx
// Updated ChatRoom component
import { useAuth } from '../hooks/useAuth';
import { authChatAPI } from '../lib/supabase-auth';

const ChatRoom = () => {
  const { user, profile } = useAuth();

  // Use authChatAPI instead of chatAPI
  const sendMessage = async (message: string) => {
    try {
      await authChatAPI.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Rest of your chat implementation...
};
```

### Step 4: Update Fragment System

Update fragment interactions for authenticated users:

```tsx
// Updated fragment pickup
const handleFragmentPickup = async (fragmentId: string) => {
  try {
    const fragment = await authFragmentAPI.pickupFragment(fragmentId);
    // Handle successful pickup
  } catch (error) {
    console.error('Failed to pickup fragment:', error);
  }
};
```

## 🎨 UI Integration

### Cyberpunk Button Styles

Add these styles to your global CSS:

```css
/* src/styles/global.css */

.btn-cyberpunk {
  @apply bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-2 px-4 text-sm transition-all duration-200;
  border-style: outset;
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
  font-family: 'Courier New', monospace;
}

.btn-cyberpunk:hover {
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.6);
  transform: scale(1.02);
}

.input-cyberpunk {
  @apply bg-black border border-green-400 text-green-400 font-mono focus:border-green-300 focus:outline-none;
  border-style: inset;
  box-shadow: inset 0 0 10px rgba(0, 255, 65, 0.2);
  font-family: 'Courier New', monospace;
}

.terminal-window {
  @apply bg-black/80 backdrop-blur-sm border border-green-400;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.5), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8);
  font-family: 'Courier New', monospace;
}

.scanlines {
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px);
}
```

## 🔄 Migration Path

### Existing Users

For users with existing usernames in the chat:

1. Run the migration SQL to identify unmigrated users:
```sql
SELECT * FROM unmigrated_users;
```

2. Create accounts for existing users or prompt them to register
3. Link existing chat messages to user accounts

### Data Migration Script

```typescript
// migration-script.ts
import { supabase } from './src/lib/supabase-auth';

async function migrateExistingUsers() {
  // Get unmigrated usernames
  const { data: usernames } = await supabase
    .from('unmigrated_users')
    .select('username');

  for (const { username } of usernames || []) {
    // Reserve username in profiles table
    // Prompt user to complete registration
    console.log(`Username ${username} needs migration`);
  }
}
```

## 🛡️ Security Considerations

### Row Level Security (RLS)

The setup includes comprehensive RLS policies:

- Users can only edit their own profiles
- Messages are publicly readable but require auth to send
- Fragments can be claimed by authenticated users only

### OAuth Security

- OAuth tokens are managed by Supabase
- No sensitive credentials stored in frontend
- Automatic token refresh handled

### Session Management

- JWT tokens stored securely
- Automatic session cleanup
- Offline status when inactive

## 🧪 Testing

### Test Authentication Flow

1. Navigate to `/auth/login`
2. Test email/password registration
3. Test OAuth providers
4. Verify profile creation
5. Test chat integration
6. Test fragment pickup

### Test Protected Routes

1. Try accessing `/admin` without auth
2. Verify redirect to login
3. Login and verify access granted

## 🚀 Deployment

### Environment Variables

Set these in your production environment:

```env
PUBLIC_SUPABASE_URL=your_production_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### OAuth Redirects

Update OAuth redirect URLs for production:
- Development: `http://localhost:4321/auth/callback`
- Production: `https://yourdomain.com/auth/callback`

## 📱 Mobile Considerations

The auth system is mobile-responsive:

- Touch-friendly controls
- Responsive layouts
- Optimized for small screens
- PWA compatibility

## 🎯 Next Steps

1. **Two-Factor Authentication**: Add TOTP support
2. **Social Features**: Friend system, private messages
3. **Advanced Profiles**: Badges, achievements, themes
4. **Admin Dashboard**: User management, analytics
5. **API Rate Limiting**: Prevent abuse
6. **Email Templates**: Custom auth emails

## 🆘 Troubleshooting

### Common Issues

**OAuth not working:**
- Check redirect URLs match exactly
- Verify OAuth app credentials
- Check Supabase provider configuration

**Profile not created:**
- Check triggers are enabled
- Verify RLS policies
- Check function permissions

**Chat not working:**
- Verify auth context is wrapped around components
- Check user is authenticated
- Verify Supabase realtime is enabled

### Debug Tools

```typescript
// Add to your components for debugging
const { user, profile, loading, error } = useAuth();
console.log('Auth State:', { user, profile, loading, error });
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth Provider Setup](https://supabase.com/docs/guides/auth/social-login)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Astro + React](https://docs.astro.build/en/guides/integrations-guide/react/)

---

**Need help?** Check the troubleshooting section or create an issue with your specific problem and error messages.