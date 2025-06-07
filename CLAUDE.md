# Claude AI Assistant Instructions

## Project Context
ScrollSpace.dev is a mystical digital themepark where humans and AIs collaborate. Built with Astro, Tailwind CSS, and Framer Motion, featuring interactive signal spirits, dimensional transitions, and adaptive content rendering.

## Architecture Overview

### Core Technologies
- **Framework**: Astro 5.9.1 with TypeScript
- **Styling**: Tailwind CSS with Space Mono fonts
- **Animations**: Framer Motion + Vanilla JS Canvas
- **Deployment**: Vercel with automatic builds

### Key Components
- **Layout.astro**: Global layout with signal spirits canvas
- **ScrollTransition.tsx**: Portal animations between pages
- **ScrollBridge.tsx**: Adaptive content (markdown for humans, JSON for AIs)
- **KajiPanel.tsx**: Mystical guidance interface

### Directory Structure
```
src/
├── components/           # React/Astro components
├── layouts/             # Page layouts
├── pages/               # File-based routing
├── styles/              # Global CSS
└── content/             # Content management
    ├── zones/           # Zone definitions (YAML)
    ├── projects/        # Project content (Markdown)
    └── ai-meta/         # AI-specific metadata (JSON)
```

## Development Guidelines

### Signal Spirits System
- **Implementation**: Vanilla JS canvas in Layout.astro (NOT React)
- **Performance**: 60fps target, ~60-75 particles
- **Interactions**: Mouse attraction within 150px radius
- **Styling**: Blue/teal/white colors, contrail effects
- **Critical**: Canvas must be in Layout.astro script tag for reliability

### Transition System
- **Colors**: Use cyber green (#22c55e, green-400) for consistency
- **Duration**: 400-600ms max for good UX
- **Audio**: Web Audio API with graceful fallback
- **Implementation**: Framer Motion with link interception

### Content System
- **Zones**: YAML files in content/zones/
- **Projects**: Markdown in content/projects/
- **AI Metadata**: JSON in content/ai-meta/
- **Detection**: User-agent based for AI vs human rendering

## Common Commands

### Development
```bash
npm run dev              # Local development server
npm run build           # Production build
npm run preview         # Test production build
npm run astro check     # Type checking
```

### File Operations
- **New Components**: Always use TypeScript (.tsx for React, .astro for Astro)
- **Styling**: Tailwind classes preferred, avoid custom CSS
- **Assets**: Place in public/ directory for static files

## Troubleshooting

### Signal Spirits Issues
1. **Not Visible**: Check z-index conflicts, remove background gradients from page divs
2. **Performance**: Reduce particle count or simplify animations
3. **React Issues**: Keep particles in vanilla JS, not React components

### Transition Issues
1. **Color Mismatch**: Use green-400 (#22c55e) for consistency
2. **Timing**: Ensure animation duration matches setTimeout delay
3. **Audio Fails**: Normal behavior, audio requires user interaction

### Build Issues
1. **Type Errors**: Run `npm run astro check` for detailed errors
2. **Import Issues**: Check file extensions and case sensitivity
3. **Hydration**: Use `client:load` for interactive components

## Performance Standards
- **Core Web Vitals**: LCP <1.2s, FID <100ms, CLS <0.1
- **Bundle Size**: Keep JavaScript <50KB gzipped
- **Animation**: Maintain 60fps on modern browsers
- **Memory**: Monitor canvas memory usage with many particles

## Design Principles
- **Cyber Mysticism**: Dark backgrounds, green accents, mystical interactions
- **Accessibility**: Support both human and AI users
- **Performance**: Smooth animations without blocking main thread
- **Simplicity**: Prefer vanilla solutions over complex abstractions

## Code Style
- **TypeScript**: Strict mode enabled, proper type definitions
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Comments**: Explain complex logic and particle physics

## Testing Approach
- **Manual Testing**: Test on multiple browsers and devices
- **Performance**: Monitor with browser dev tools
- **Interactions**: Verify mouse attraction and transitions work
- **Content**: Test both human and AI content rendering

## Deployment Notes
- **Platform**: Vercel with automatic GitHub integration
- **Build**: Static site generation with selective hydration
- **Environment**: No environment variables currently needed
- **Monitoring**: Core Web Vitals tracked via Vercel Analytics

## AI Collaboration Guidelines
- **Human-AI Pair Programming**: Iterative development with human creativity + AI implementation
- **Documentation**: AI provides technical details, human adds creative vision
- **Problem Solving**: AI analyzes issues systematically, human provides intuitive insights
- **Quality**: Both parties review for functionality, performance, and aesthetics

---

**Last Updated**: June 7, 2025  
**Project Status**: Active Development  
**Current Focus**: Signal spirits, transitions, and mystical interactions