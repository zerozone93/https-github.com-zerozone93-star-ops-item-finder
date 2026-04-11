export interface Resource {
  id: string;
  name: string;
  type: 'gas' | 'mineral' | 'metal' | 'organic' | 'quantum' | 'other';
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare';
  locationIds: string[];
  miningMethodIds: string[];
  toolIds: string[];
  vehicleIds: string[];
  recipeIds: string[];
  imageUrl?: string;
  patch?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'planet' | 'moon' | 'asteroid_belt' | 'asteroid_field' | 'space_station' | 'outpost' | 'cave' | 'city';
  system: string;
  description: string;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  resourceIds: string[];
  vendorIds: string[];
  lootSourceIds: string[];
}

export interface MiningMethod {
  id: string;
  name: string;
  type: 'fps' | 'roc' | 'ship';
  description: string;
  toolIds: string[];
  vehicleIds: string[];
  resourceIds: string[];
}

export interface Tool {
  id: string;
  name: string;
  type: 'fps_tool' | 'ship_module' | 'roc_attachment' | 'multi_tool' | 'mining_head';
  description: string;
  miningMethodId?: string;
  resourceIds: string[];
  obtainMethod: 'buy' | 'craft' | 'loot' | 'mission_reward';
  vendorIds: string[];
  price?: number;
  currency?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'ground' | 'ship' | 'hover' | 'submarine';
  manufacturer: string;
  description: string;
  miningMethodIds: string[];
  resourceIds: string[];
  obtainMethod: 'buy' | 'rent' | 'pledge';
  price?: number;
  currency?: string;
}

export interface Recipe {
  id: string;
  name: string;
  outputItemId: string;
  outputItemType: 'resource' | 'weapon' | 'armor' | 'component' | 'consumable';
  outputQuantity: number;
  ingredients: RecipeIngredient[];
  blueprintId?: string;
  craftingStation: string;
  craftingTime?: string;
  description: string;
}

export interface RecipeIngredient {
  itemId: string;
  itemType: 'resource' | 'component' | 'consumable';
  quantity: number;
  name: string;
}

export interface Blueprint {
  id: string;
  name: string;
  recipeId: string;
  description: string;
  obtainMethod: 'buy' | 'loot' | 'mission_reward' | 'research';
  vendorIds: string[];
  lootSourceIds: string[];
  price?: number;
  currency?: string;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'ballistic' | 'laser' | 'plasma' | 'shotgun' | 'sniper' | 'pistol' | 'smg' | 'rifle' | 'heavy' | 'melee';
  class: 'fps' | 'ship_weapon';
  manufacturer: string;
  description: string;
  damage?: string;
  range?: string;
  fireRate?: string;
  magazineSize?: number;
  obtainMethods: ObtainMethod[];
  recipeId?: string;
  stats?: Record<string, string | number>;
  patch?: string;
}

export interface Armor {
  id: string;
  name: string;
  type: 'helmet' | 'chest' | 'arms' | 'legs' | 'undersuit' | 'full_set';
  class: 'light' | 'medium' | 'heavy';
  manufacturer: string;
  description: string;
  protection?: string;
  obtainMethods: ObtainMethod[];
  recipeId?: string;
  stats?: Record<string, string | number>;
  patch?: string;
}

export interface ObtainMethod {
  method: 'buy' | 'loot' | 'craft' | 'mission_reward';
  locationId?: string;
  vendorId?: string;
  lootSourceId?: string;
  price?: number;
  currency?: string;
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'shop' | 'kiosk' | 'terminal' | 'black_market';
  locationId: string;
  description: string;
  inventoryIds: string[];
  inventoryTypes: ('weapon' | 'armor' | 'tool' | 'blueprint' | 'consumable' | 'component')[];
}

export interface LootSource {
  id: string;
  name: string;
  type: 'enemy' | 'box' | 'container' | 'derelict' | 'cave_cache' | 'mission_reward';
  locationId: string;
  description: string;
  possibleItemIds: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export interface StarCitizenData {
  meta: {
    version: string;
    lastUpdated: string;
    patch: string;
    note: string;
  };
  resources: Resource[];
  locations: Location[];
  miningMethods: MiningMethod[];
  tools: Tool[];
  vehicles: Vehicle[];
  recipes: Recipe[];
  blueprints: Blueprint[];
  weapons: Weapon[];
  armor: Armor[];
  vendors: Vendor[];
  lootSources: LootSource[];
}
