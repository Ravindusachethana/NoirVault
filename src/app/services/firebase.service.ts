import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

export interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'customer';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string; // 'Woody' | 'Floral' | 'Fresh' | 'Oriental'
  description: string;
  notes: string;
  limitedEdition: boolean;
}

export interface CollectionType {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Oud Nocturne',
    price: 240,
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop',
    category: 'Woody',
    description: 'An opulent, dark, and smoky fragrance centering around the complexity of rich Agarwood (Oud) paired with damask rose and warm patchouli.',
    notes: 'Oud, Damask Rose, Patchouli, Amber',
    limitedEdition: true
  },
  {
    id: 'prod-2',
    name: 'Petals & Rain',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop',
    category: 'Floral',
    description: 'A fresh, dewy floral fragrance that captures the essence of wet blossoms after a spring shower. Clean, light, and ethereal.',
    notes: 'Jasmine, Lily of the Valley, Dew Drops, White Musk',
    limitedEdition: false
  },
  {
    id: 'prod-3',
    name: 'Royal Amber',
    price: 295,
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop',
    category: 'Oriental',
    description: 'Warm, sensual, and complex. An intense blend of Baltic amber, Madagascar vanilla, and spicy cardamom.',
    notes: 'Baltic Amber, Cardamom, Vanilla, Tonka Bean',
    limitedEdition: true
  },
  {
    id: 'prod-4',
    name: 'Bergamot Splash',
    price: 145,
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop',
    category: 'Fresh',
    description: 'Vibrant and uplifting, combining Italian bergamot, crisp sea salt, and clean cedarwood. Perfect for summer days.',
    notes: 'Bergamot, Sea Salt, Lemon, Cedarwood',
    limitedEdition: false
  },
  {
    id: 'prod-5',
    name: 'Rose & Saffron',
    price: 210,
    imageUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&auto=format&fit=crop',
    category: 'Floral',
    description: 'A luxurious and spicy rose fragrance that pairs dark rose petals with precious Kashmiri saffron and smoky incense.',
    notes: 'Saffron, Bulgarian Rose, Leather, Incense',
    limitedEdition: false
  },
  {
    id: 'prod-6',
    name: 'Cedarwood Forest',
    price: 165,
    imageUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=600&auto=format&fit=crop',
    category: 'Woody',
    description: 'A clean, grounding woody scent that feels like walking through a damp pine forest in the early morning.',
    notes: 'Cedarwood, Pine, Vetiver, Sandalwood',
    limitedEdition: false
  }
];

const SEED_COLLECTIONS: CollectionType[] = [
  {
    id: 'coll-1',
    name: 'Nocturnal Whispers',
    description: 'Dark, rich, and mysterious scents engineered for the night, featuring oud, leather, and dark spices.',
    imageUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&auto=format&fit=crop'
  },
  {
    id: 'coll-2',
    name: 'Elixir of Light',
    description: 'Crisp, airy, and bright scents representing clean mornings, citrus groves, and summer breeze.',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop'
  },
  {
    id: 'coll-3',
    name: 'Botanical Gardens',
    description: 'Rich floral and botanical compositions capturing fresh rose, wet jasmine, and garden herbal undertones.',
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop'
  }
];

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app?: FirebaseApp;
  private auth?: Auth;
  private db?: Firestore;
  
  // Signals for state
  readonly currentUser = signal<UserSession | null>(null);
  readonly products = signal<Product[]>([]);
  readonly collections = signal<CollectionType[]>([]);
  readonly cart = signal<CartItem[]>([]);
  readonly loading = signal<boolean>(true);
  
  // Computed values
  readonly cartCount = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));
  readonly cartTotal = computed(() => this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0));
  readonly isSimulation = signal<boolean>(true);

  constructor() {
    this.checkMode();
    this.initDatabase();
    this.initAuthListener();
  }

  private checkMode() {
    const hasKeys = environment.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY' && environment.firebase.projectId !== 'YOUR_FIREBASE_PROJECT_ID';
    this.isSimulation.set(environment.useSimulation || !hasKeys);
    console.log(`[AURA Service] Active Mode: ${this.isSimulation() ? 'SIMULATION (LocalStorage)' : 'LIVE FIREBASE'}`);
  }

  private initDatabase() {
    if (this.isSimulation()) {
      // Setup simulated database in LocalStorage
      if (!localStorage.getItem('aura_products')) {
        localStorage.setItem('aura_products', JSON.stringify(SEED_PRODUCTS));
      }
      if (!localStorage.getItem('aura_collections')) {
        localStorage.setItem('aura_collections', JSON.stringify(SEED_COLLECTIONS));
      }
      
      this.products.set(JSON.parse(localStorage.getItem('aura_products') || '[]'));
      this.collections.set(JSON.parse(localStorage.getItem('aura_collections') || '[]'));
      this.loading.set(false);
    } else {
      try {
        if (!getApps().length) {
          this.app = initializeApp(environment.firebase);
        } else {
          this.app = getApps()[0];
        }
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        
        // Fetch products and collections from live firebase
        this.syncWithFirebase();
      } catch (err) {
        console.error('Failed to initialize live Firebase, falling back to Simulation:', err);
        this.isSimulation.set(true);
        this.initDatabase();
      }
    }
  }

  private async syncWithFirebase() {
    this.loading.set(true);
    try {
      if (!this.db) return;
      
      // Load products
      const prodSnap = await getDocs(collection(this.db, 'products'));
      if (prodSnap.empty) {
        // Seed live DB with default products if empty
        const promises = SEED_PRODUCTS.map(async (prod) => {
          if (!this.db) return;
          await setDoc(doc(this.db, 'products', prod.id), prod);
        });
        await Promise.all(promises);
        this.products.set(SEED_PRODUCTS);
      } else {
        const prods: Product[] = [];
        prodSnap.forEach(d => prods.push(d.data() as Product));
        this.products.set(prods);
      }

      // Load collections
      const collSnap = await getDocs(collection(this.db, 'collections'));
      if (collSnap.empty) {
        const promises = SEED_COLLECTIONS.map(async (coll) => {
          if (!this.db) return;
          await setDoc(doc(this.db, 'collections', coll.id), coll);
        });
        await Promise.all(promises);
        this.collections.set(SEED_COLLECTIONS);
      } else {
        const colls: CollectionType[] = [];
        collSnap.forEach(d => colls.push(d.data() as CollectionType));
        this.collections.set(colls);
      }
    } catch (e) {
      console.error('Firebase DB sync failed. Reverting database state to memory.', e);
    } finally {
      this.loading.set(false);
    }
  }

  private initAuthListener() {
    if (this.isSimulation()) {
      const savedUser = localStorage.getItem('aura_currentUser');
      if (savedUser) {
        this.currentUser.set(JSON.parse(savedUser));
      }
    } else if (this.auth) {
      onAuthStateChanged(this.auth, async (fbUser) => {
        if (fbUser) {
          // Fetch user metadata/role from Firestore
          let role: 'admin' | 'customer' = 'customer';
          let displayName = fbUser.displayName || 'User';
          
          if (this.db) {
            const userDoc = await getDoc(doc(this.db, 'users', fbUser.uid));
            if (userDoc.exists()) {
              const uData = userDoc.data();
              role = uData['role'] || 'customer';
              displayName = uData['displayName'] || displayName;
            }
          }
          
          this.currentUser.set({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName,
            role
          });
        } else {
          this.currentUser.set(null);
        }
      });
    }
  }

  /* --- Auth APIs --- */

  async register(email: string, password: string, name: string, role: 'admin' | 'customer'): Promise<void> {
    if (this.isSimulation()) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const simulatedUsers = JSON.parse(localStorage.getItem('aura_users') || '[]');
          if (simulatedUsers.find((u: any) => u.email === email)) {
            reject(new Error('Email is already registered.'));
            return;
          }

          const newUser = {
            uid: 'usr-' + Math.random().toString(36).substr(2, 9),
            email,
            password, // Simulated only
            displayName: name,
            role
          };
          simulatedUsers.push(newUser);
          localStorage.setItem('aura_users', JSON.stringify(simulatedUsers));
          resolve();
        }, 800);
      });
    } else {
      if (!this.auth || !this.db) throw new Error('Firebase Auth not initialized');
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      // Create user role documentation in Firestore
      await setDoc(doc(this.db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email,
        displayName: name,
        role
      });
    }
  }

  async login(email: string, password: string): Promise<UserSession> {
    if (this.isSimulation()) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Check standard seed admin credentials
          if (email === 'admin@aura.com' && password === 'admin123') {
            const adminUser: UserSession = {
              uid: 'admin-seed',
              email: 'admin@aura.com',
              displayName: 'Principal Admin',
              role: 'admin'
            };
            this.currentUser.set(adminUser);
            localStorage.setItem('aura_currentUser', JSON.stringify(adminUser));
            resolve(adminUser);
            return;
          }

          const simulatedUsers = JSON.parse(localStorage.getItem('aura_users') || '[]');
          const matchedUser = simulatedUsers.find((u: any) => u.email === email && u.password === password);
          
          if (matchedUser) {
            const user: UserSession = {
              uid: matchedUser.uid,
              email: matchedUser.email,
              displayName: matchedUser.displayName,
              role: matchedUser.role
            };
            this.currentUser.set(user);
            localStorage.setItem('aura_currentUser', JSON.stringify(user));
            resolve(user);
          } else {
            reject(new Error('Invalid email or password.'));
          }
        }, 800);
      });
    } else {
      if (!this.auth || !this.db) throw new Error('Firebase Auth not initialized');
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      const userDoc = await getDoc(doc(this.db, 'users', credential.user.uid));
      let role: 'admin' | 'customer' = 'customer';
      let name = credential.user.displayName || 'User';

      if (userDoc.exists()) {
        const data = userDoc.data();
        role = data['role'] || 'customer';
        name = data['displayName'] || name;
      }

      const session: UserSession = {
        uid: credential.user.uid,
        email: credential.user.email || '',
        displayName: name,
        role
      };
      
      this.currentUser.set(session);
      return session;
    }
  }

  async logout(): Promise<void> {
    if (this.isSimulation()) {
      this.currentUser.set(null);
      localStorage.removeItem('aura_currentUser');
      return Promise.resolve();
    } else {
      if (!this.auth) return;
      await signOut(this.auth);
      this.currentUser.set(null);
    }
  }

  /* --- Products APIs --- */

  async addProduct(prodData: Omit<Product, 'id'>): Promise<void> {
    if (this.isSimulation()) {
      const newProd: Product = {
        ...prodData,
        id: 'prod-' + Math.random().toString(36).substr(2, 9)
      };
      const prods = this.products();
      const updated = [...prods, newProd];
      this.products.set(updated);
      localStorage.setItem('aura_products', JSON.stringify(updated));
      return Promise.resolve();
    } else {
      if (!this.db) throw new Error('Firebase not initialized');
      const colRef = collection(this.db, 'products');
      const docRef = await addDoc(colRef, prodData);
      const newProd: Product = {
        ...prodData,
        id: docRef.id
      };
      // Save ID back to document for consistency
      await setDoc(doc(this.db, 'products', docRef.id), newProd);
      this.products.set([...this.products(), newProd]);
    }
  }

  async editProduct(id: string, prodData: Partial<Product>): Promise<void> {
    if (this.isSimulation()) {
      const updated = this.products().map(p => {
        if (p.id === id) {
          return { ...p, ...prodData };
        }
        return p;
      });
      this.products.set(updated);
      localStorage.setItem('aura_products', JSON.stringify(updated));
      return Promise.resolve();
    } else {
      if (!this.db) throw new Error('Firebase not initialized');
      const docRef = doc(this.db, 'products', id);
      await updateDoc(docRef, prodData);
      const updated = this.products().map(p => {
        if (p.id === id) {
          return { ...p, ...prodData } as Product;
        }
        return p;
      });
      this.products.set(updated);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (this.isSimulation()) {
      const updated = this.products().filter(p => p.id !== id);
      this.products.set(updated);
      localStorage.setItem('aura_products', JSON.stringify(updated));
      return Promise.resolve();
    } else {
      if (!this.db) throw new Error('Firebase not initialized');
      await deleteDoc(doc(this.db, 'products', id));
      const updated = this.products().filter(p => p.id !== id);
      this.products.set(updated);
    }
  }

  /* --- Collections APIs --- */

  async addCollection(collData: Omit<CollectionType, 'id'>): Promise<void> {
    if (this.isSimulation()) {
      const newColl: CollectionType = {
        ...collData,
        id: 'coll-' + Math.random().toString(36).substr(2, 9)
      };
      const colls = this.collections();
      const updated = [...colls, newColl];
      this.collections.set(updated);
      localStorage.setItem('aura_collections', JSON.stringify(updated));
      return Promise.resolve();
    } else {
      if (!this.db) throw new Error('Firebase not initialized');
      const colRef = collection(this.db, 'collections');
      const docRef = await addDoc(colRef, collData);
      const newColl: CollectionType = {
        ...collData,
        id: docRef.id
      };
      await setDoc(doc(this.db, 'collections', docRef.id), newColl);
      this.collections.set([...this.collections(), newColl]);
    }
  }

  /* --- Cart Operations --- */

  addToCart(product: Product, quantity = 1) {
    const currentCart = [...this.cart()];
    const existing = currentCart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      currentCart.push({ product, quantity });
    }
    this.cart.set(currentCart);
  }

  removeFromCart(productId: string) {
    const updated = this.cart().filter(item => item.product.id !== productId);
    this.cart.set(updated);
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const updated = this.cart().map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    });
    this.cart.set(updated);
  }

  clearCart() {
    this.cart.set([]);
  }
}
