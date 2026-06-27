export type ElementType = 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Earth';
export type RarityType = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type HiddenAbility = 'Critical Strike' | 'Vampire' | 'Dodge' | 'Thorns' | 'None';

export interface CardStats {
  element: ElementType;
  rarity: RarityType;
  power: number;
  energy: number;
  seed: number;
  value: number;
  hidden_ability: HiddenAbility;
}

const ELEMENTS: ElementType[] = ['Fire', 'Water', 'Grass', 'Electric', 'Earth'];

// Simple string hash function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Pseudo-random generator using a seed
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateCardStats(file: File): CardStats {
  const hash = hashString(file.name) + file.size;
  const seed = Math.abs(hash);

  // 1. Element
  const elementIndex = seed % 5;
  const element = ELEMENTS[elementIndex];

  // 2. Rarity (1 - 100)
  const rarityRoll = Math.floor(seededRandom(seed) * 100) + 1;
  let rarity: RarityType;
  
  if (rarityRoll <= 50) {
    rarity = 'Common';
  } else if (rarityRoll <= 80) {
    rarity = 'Rare';
  } else if (rarityRoll <= 95) {
    rarity = 'Epic';
  } else {
    rarity = 'Legendary';
  }

  // 3. Power & Energy
  // Base values depend on rarity
  let basePower = 0;
  let baseEnergy = 0;
  
  switch (rarity) {
    case 'Common':
      basePower = 10;
      baseEnergy = 5;
      break;
    case 'Rare':
      basePower = 25;
      baseEnergy = 10;
      break;
    case 'Epic':
      basePower = 50;
      baseEnergy = 15;
      break;
    case 'Legendary':
      basePower = 80;
      baseEnergy = 20;
      break;
  }

  // Variance based on seed
  const powerVariance = Math.floor(seededRandom(seed + 1) * 20) - 10; // -10 to +10
  const energyVariance = Math.floor(seededRandom(seed + 2) * 6) - 3; // -3 to +3

  const power = Math.max(1, basePower + powerVariance);
  const energy = Math.max(1, baseEnergy + energyVariance);

  // Calculate Value based on rarity and stats
  const rarityMultiplier: Record<RarityType, number> = {
    'Common': 1,
    'Rare': 3,
    'Epic': 10,
    'Legendary': 50
  };
  
  const baseValue = (power + energy) * 2; // base from stats
  const value = Math.floor(baseValue * rarityMultiplier[rarity]);

  // 4. Hidden Ability
  let hidden_ability: HiddenAbility = 'None';
  const abilityRoll = Math.floor(seededRandom(seed + 3) * 100) + 1;
  
  // Rarity affects the chance of getting a hidden ability
  let hasAbility = false;
  if (rarity === 'Legendary') hasAbility = true; // 100% chance
  else if (rarity === 'Epic' && abilityRoll <= 70) hasAbility = true; // 70% chance
  else if (rarity === 'Rare' && abilityRoll <= 40) hasAbility = true; // 40% chance
  else if (rarity === 'Common' && abilityRoll <= 10) hasAbility = true; // 10% chance

  if (hasAbility) {
    const abilities: HiddenAbility[] = ['Critical Strike', 'Vampire', 'Dodge', 'Thorns'];
    const abilityIndex = Math.floor(seededRandom(seed + 4) * 4);
    hidden_ability = abilities[abilityIndex];
  }

  return {
    element,
    rarity,
    power,
    energy,
    seed,
    value,
    hidden_ability
  };
}
