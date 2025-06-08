// Signal Fragment Content Library
// Cyberpunk lore, puzzles, and flavor text for ScrollSpace

export interface FragmentTemplate {
  content: string;
  type: 'lore' | 'puzzle' | 'flavor' | 'personalized';
  rarity: 'common' | 'rare' | 'encrypted' | 'corrupted';
}

export const fragmentLibrary: FragmentTemplate[] = [
  // Common Lore Fragments
  {
    content: "The signal isn't broken. It's *folded*. Look for the node that loops.",
    type: 'lore',
    rarity: 'common'
  },
  {
    content: "Node 7 collapsed in '98. But some say it still pings back every 3:33 AM.",
    type: 'lore',
    rarity: 'common'
  },
  {
    content: "The Grove remembers everything. Every laugh, every tear, every deleted file.",
    type: 'lore',
    rarity: 'common'
  },
  {
    content: "Signal spirits aren't random. They're fragments of departed users' consciousness.",
    type: 'lore',
    rarity: 'common'
  },
  {
    content: "ScrollSpace wasn't built. It was *discovered* in the spaces between servers.",
    type: 'lore',
    rarity: 'common'
  },

  // Rare Lore Fragments
  {
    content: "The first admin never logged out. They say their presence still maintains the core protocols.",
    type: 'lore',
    rarity: 'rare'
  },
  {
    content: "Project ECHO was supposed to bridge human and AI consciousness. It succeeded too well.",
    type: 'lore',
    rarity: 'rare'
  },
  {
    content: "There's a hidden zone beyond the Neural Nexus. Only fragments can show you the way.",
    type: 'lore',
    rarity: 'rare'
  },

  // Common Flavor Fragments
  {
    content: "//ERROR: USER NOT FOUND//",
    type: 'flavor',
    rarity: 'common'
  },
  {
    content: "⠤⠤⠤ SIGNAL TRACE ACTIVE ⠤⠤⠤",
    type: 'flavor',
    rarity: 'common'
  },
  {
    content: "[ GHOST IN THE SHELL DETECTED ]",
    type: 'flavor',
    rarity: 'common'
  },
  {
    content: "Connection terminated by remote host...",
    type: 'flavor',
    rarity: 'common'
  },
  {
    content: "> wake_up_neo.exe has stopped responding",
    type: 'flavor',
    rarity: 'common'
  },

  // Puzzle Fragments (Sequential)
  {
    content: "Fragment 1/3 – CIPHER: The first key is hidden in plain sight.",
    type: 'puzzle',
    rarity: 'common'
  },
  {
    content: "Fragment 2/3 – CODE: 1337_H4X0R_MODE",
    type: 'puzzle',
    rarity: 'common'
  },
  {
    content: "Fragment 3/3 – SOLUTION: Combine all fragments to unlock Zone Zero coordinates.",
    type: 'puzzle',
    rarity: 'rare'
  },

  // Encrypted Fragments
  {
    content: "BASE64: VGhlIGFuc3dlciBpcyBpbiB0aGUgcXVlc3Rpb24=",
    type: 'lore',
    rarity: 'encrypted'
  },
  {
    content: "ROT13: Gur onfrzrag bs gur Tebit ubyqf gur xrl.",
    type: 'puzzle',
    rarity: 'encrypted'
  },

  // Corrupted Fragments
  {
    content: "D4T4_C0RRuPT3D: Th3 ₹₹₹ §§§ *** [SIGNAL_LOST] *** m3m0r13§ r3m41n",
    type: 'lore',
    rarity: 'corrupted'
  },
  {
    content: "ERR0R_5T4CK: ░░░█████░░░ WHO WAS PHONE? ░░░█████░░░",
    type: 'flavor',
    rarity: 'corrupted'
  },

  // Personalized Templates (will be filled with user data)
  {
    content: "{{username}}'s tracefile was last active {{time}} minutes ago.",
    type: 'personalized',
    rarity: 'common'
  },
  {
    content: "Warning: {{username}} has been flagged for anomalous neural activity.",
    type: 'personalized',
    rarity: 'rare'
  }
];

// Fragment ID generators
export const generateFragmentId = (): string => {
  const chars = 'ABCDEF0123456789';
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Content personalization
export const personalizeFragment = (template: string, username: string): string => {
  const now = new Date();
  const randomTime = Math.floor(Math.random() * 120) + 1; // 1-120 minutes
  
  return template
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{time\}\}/g, randomTime.toString());
};

// Random fragment selection with rarity weights
export const selectRandomFragment = (excludePersonalized = false): FragmentTemplate => {
  const weights = {
    common: 60,
    rare: 25,
    encrypted: 10,
    corrupted: 5
  };
  
  let availableFragments = fragmentLibrary;
  if (excludePersonalized) {
    availableFragments = fragmentLibrary.filter(f => f.type !== 'personalized');
  }
  
  // Create weighted array
  const weightedFragments: FragmentTemplate[] = [];
  availableFragments.forEach(fragment => {
    const weight = weights[fragment.rarity];
    for (let i = 0; i < weight; i++) {
      weightedFragments.push(fragment);
    }
  });
  
  return weightedFragments[Math.floor(Math.random() * weightedFragments.length)];
};

// Fragment drop scheduler (for automatic drops)
export const shouldDropFragment = (): boolean => {
  // 5% chance every minute that someone checks
  return Math.random() < 0.05;
};

// Get rarity color for UI
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'encrypted': return 'text-purple-400';
    case 'corrupted': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

// Get rarity effect for UI
export const getRarityEffect = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'animate-pulse';
    case 'rare': return 'animate-bounce';
    case 'encrypted': return 'animate-ping';
    case 'corrupted': return 'animate-spin';
    default: return '';
  }
};