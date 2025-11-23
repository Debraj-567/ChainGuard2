import { User, UserRole } from '../types';

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'mfg@chainguard.com',
    name: 'Global Mfg Co.',
    role: UserRole.MANUFACTURER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mfg'
  },
  {
    id: 'u2',
    email: 'warehouse@chainguard.com',
    name: 'Central Logistics',
    role: UserRole.WAREHOUSE,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=warehouse'
  },
  {
    id: 'u3',
    email: 'retail@chainguard.com',
    name: 'City Superstore',
    role: UserRole.RETAILER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retail'
  },
  {
    id: 'u4',
    email: 'admin@chainguard.com',
    name: 'System Admin',
    role: UserRole.EXPLORER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  }
];

export const login = async (email: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) return user;
  return null;
};

export const register = async (email: string, role: UserRole, name: string): Promise<User> => {
    // In a real app, this would verify invite codes or create DB entries
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
        id: `u-${Date.now()}`,
        email,
        name,
        role
    };
};

export const getAvailableCategories = (): string[] => {
    const stored = localStorage.getItem('chainguard_categories');
    if (stored) return JSON.parse(stored);
    
    const defaults = [
        "Electronics", 
        "Clothing", 
        "Cosmetics", 
        "Home Appliances", 
        "Food & Groceries", 
        "Pharmaceuticals", 
        "Toys", 
        "Furniture", 
        "Sports Equipment", 
        "Automobiles"
    ];
    localStorage.setItem('chainguard_categories', JSON.stringify(defaults));
    return defaults;
};

export const addCategory = (category: string) => {
    const current = getAvailableCategories();
    if (!current.includes(category)) {
        const updated = [...current, category];
        localStorage.setItem('chainguard_categories', JSON.stringify(updated));
        return true;
    }
    return false;
};