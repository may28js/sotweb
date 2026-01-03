$currentDir = Get-Location
$relativePath = "..\WebBackend\Client\src\app\store\page.tsx"
$path = $currentDir.Path + "\" + $relativePath
$resolvedPath = $path
try {
    $resolvedPath = Resolve-Path $path -ErrorAction Stop
} catch {
    Write-Host "Path resolution failed for $path. Using constructed path."
}
if ($resolvedPath.Path) { $resolvedPath = $resolvedPath.Path }

Write-Host "Target Path: $resolvedPath"

# Rename asset folder if it exists
$assetPathOld = "..\WebBackend\Client\public\demo-assets\Home _ Next Vision CMS1_files"
$assetPathNew = "..\WebBackend\Client\public\demo-assets\store-assets"
$resolvedAssetPathOld = $currentDir.Path + "\" + $assetPathOld
$resolvedAssetPathNew = $currentDir.Path + "\" + $assetPathNew

if (Test-Path $resolvedAssetPathOld) {
    Rename-Item -Path $resolvedAssetPathOld -NewName "store-assets" -Force
    Write-Host "Renamed asset folder to store-assets"
} else {
    Write-Host "Asset folder already renamed or not found at $resolvedAssetPathOld"
}

$content = @'
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProducts, purchaseProduct } from '../../services/storeService';
import { Product } from '../../types/store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Demo products data
const DEMO_PRODUCTS: Product[] = [
  {
    id: 101,
    name: 'Ashes of Al\'ar',
    description: 'Summons a swift red phoenix mount. This is a very fast mount.',
    price: 500,
    category: 'mounts',
    image: '/demo-assets/store-assets/phoenix-alar.jpg',
    stock: 999
  },
  {
    id: 102,
    name: 'Level 80 Boost',
    description: 'Instantly boost your character to level 80 with starter gear.',
    price: 300,
    category: 'services',
    image: '/demo-assets/store-assets/level-boost.jpg',
    stock: 999
  },
  {
    id: 103,
    name: 'Faction Change',
    description: 'Change your character\'s faction from Alliance to Horde or vice versa.',
    price: 150,
    category: 'services',
    image: '/demo-assets/store-assets/faction-change.avif',
    stock: 999
  },
  {
    id: 104,
    name: 'Race Change',
    description: 'Change your character\'s race within the same faction.',
    price: 100,
    category: 'services',
    image: '/demo-assets/store-assets/race-change.webp',
    stock: 999
  },
  {
    id: 105,
    name: 'Name Change',
    description: 'Change your character\'s name.',
    price: 50,
    category: 'services',
    image: '/demo-assets/store-assets/name-change.avif',
    stock: 999
  },
  {
    id: 106,
    name: 'Gold Crate (10,000g)',
    description: 'A crate containing 10,000 gold coins.',
    price: 200,
    category: 'gear', // Using gear as misc category
    image: '/demo-assets/store-assets/gold-crate.webp',
    stock: 999
  }
];

export default function StorePage() {
  const { user, updatePoints } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Categories for visual layout
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'mounts', name: 'Mounts' },
    { id: 'pets', name: 'Pets' },
    { id: 'gear', name: 'Gear' },
    { id: 'services', name: 'Services' },
  ];
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // For demo purpose, mix API products with demo products
        // const data = await getProducts();
        // setProducts([...DEMO_PRODUCTS, ...data]);
        setProducts(DEMO_PRODUCTS);
      } catch (err) {
        console.error('Failed to fetch products', err);
        // Fallback to demo products
        setProducts(DEMO_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handlePurchase = async (product: Product) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!confirm(`Are you sure you want to purchase ${product.name} for ${product.price} Coins?`)) {
      return;
    }

    setPurchasing(product.id);
    setError('');
    setMessage('');

    try {
      // Mock purchase for demo items
      if (product.id > 100) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (user.points < product.price) {
           throw { response: { data: 'Insufficient funds' } };
        }
        updatePoints(user.points - product.price);
        setMessage(`Successfully purchased ${product.name}!`);
      } else {
        const response = await purchaseProduct(product.id);
        setMessage(response.message);
        updatePoints(response.newBalance);
      }
      
      // Optimistic update for stock (if managed)
      if (product.stock > 0) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, stock: p.stock - 1 } : p
        ));
      }
    } catch (err: any) {
      console.error('Purchase failed', err);
      setError(err.response?.data || 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] pt-20">
      {/* Header Banner */}
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/50 to-transparent z-10"></div>
          <div className="w-full h-full bg-[url('/sections/promo-1/bg.webp')] bg-cover bg-center opacity-40"></div>
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 h-full flex flex-col justify-end pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-600 tracking-widest uppercase drop-shadow-lg">
            Store
          </h1>
          <p className="mt-4 text-xl text-gray-300 font-serif max-w-2xl mx-auto drop-shadow-md">
            Unlock legendary rewards and enhance your adventure.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-[#1e1e1e] p-6 border border-white/5 rounded-sm shadow-xl sticky top-24">
              <div className="mb-8 pb-6 border-b border-white/10">
                 <h3 className="text-white font-serif font-bold uppercase tracking-wider mb-2 text-lg">Categories</h3>
                 <div className="w-12 h-0.5 bg-primary"></div>
              </div>
              
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-300 border-l-2 flex items-center justify-between group ${
                        activeCategory === category.id
                          ? 'border-primary text-primary bg-white/5'
                          : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:pl-6'
                      }`}
                    >
                      <span>{category.name}</span>
                      {activeCategory === category.id && <span className="text-primary">›</span>}
                    </button>
                  </li>
                ))}
              </ul>

              {user && (
                <div className="mt-10 pt-6 border-t border-white/10">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Your Balance</h3>
                  <div className="flex items-center bg-black/40 p-4 rounded border border-white/5">
                    <span className="text-2xl font-serif font-bold text-primary">{user.points}</span>
                    <span className="text-xs text-gray-500 ml-2 uppercase tracking-wide">Coins</span>
                  </div>
                  <button className="w-full mt-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs uppercase font-bold tracking-wider transition-colors">
                    Add Coins
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {message && (
              <div className="mb-8 p-4 bg-green-900/20 border-l-4 border-green-500 text-green-400 rounded-r-sm shadow-lg flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <p className="font-serif">{message}</p>
              </div>
            )}
            {error && (
              <div className="mb-8 p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400 rounded-r-sm shadow-lg flex items-center">
                 <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="font-serif">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="group relative bg-[#1e1e1e] border border-white/5 hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-1"
                >
                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] w-full bg-black/50 relative overflow-hidden border-b border-white/5">
                    {product.image ? (
                        <Image 
                            src={product.image} 
                            alt={product.name}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center z-0 group-hover:scale-110 transition-transform duration-500">
                            <span className="text-6xl text-white/10 font-serif">
                            {product.name.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent opacity-60 z-10"></div>
                    
                    {/* Price Tag Overlay */}
                    <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm border border-primary/30 px-3 py-1 rounded-sm">
                        <span className="text-primary font-bold font-serif">{product.price}</span>
                        <span className="text-[10px] text-gray-400 ml-1 uppercase">Coins</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow relative z-20">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors leading-tight">
                        {product.name}
                      </h3>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow font-sans leading-relaxed">
                      {product.description || 'No description available.'}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/10">
                      <button
                        onClick={() => handlePurchase(product)}
                        disabled={purchasing === product.id || (product.stock !== undefined && product.stock <= 0)}
                        className={`w-full py-3 bg-white/5 hover:bg-primary hover:text-black text-white text-xs font-serif font-bold uppercase tracking-widest transition-all clip-path-polygon flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(198,156,109,0.3)] ${
                          purchasing === product.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 80%, 95% 100%, 0 100%, 0 20%)' }}
                      >
                        {purchasing === product.id ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (product.stock !== undefined && product.stock <= 0 ? 'Out of Stock' : 'Purchase Now')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-24 bg-[#1e1e1e] border border-white/5 rounded-sm">
                <p className="text-gray-500 font-serif text-lg">No products found in this category.</p>
                <button 
                    onClick={() => setActiveCategory('all')}
                    className="mt-4 text-primary hover:text-white text-sm uppercase tracking-wider underline transition-colors"
                >
                    View all products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'@

[System.IO.File]::WriteAllText($resolvedPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Store page has been updated."
