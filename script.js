// =================================================================
// KONFIGURASI DAN INISIALISASI
// =================================================================
const SUPABASE_URL = 'https://yklsygjqtampqiliuncz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHN5Z2pxdGFtcHFpbGl1bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNzM5NTAsImV4cCI6MjA2NDg0OTk1MH0.YuiD2lLHTM9y9CMJ6ZV_Z2kMe99C8vDSQh73xr4ogC8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allMenuItems = [];
const CART_STORAGE_KEY = 'pesananku_cart';
let cart = loadCartFromStorage();

// Variabel Global untuk Elemen DOM
let menuGrid, cartSidebar, overlay, cartCount, cartItems, cartTotal, checkoutModal, modalOrderSummary, modalTotalPrice;

const placeholderImageURL = 'https://placehold.co/400x250/E0E0E0/B0B0B0?text=Gambar+Tidak+Tersedia';


// =================================================================
// FUNGSI UTAMA DAN ALUR APLIKASI
// =================================================================

// Berjalan saat halaman HTML selesai dimuat
document.addEventListener('DOMContentLoaded', async function() {
    // Menghubungkan variabel dengan elemen di HTML
    menuGrid = document.getElementById('menuGrid');
    cartSidebar = document.getElementById('cartSidebar');
    overlay = document.getElementById('overlay');
    cartCount = document.getElementById('cartCount');
    cartItems = document.getElementById('cartItems');
    cartTotal = document.getElementById('cartTotal');
    checkoutModal = document.getElementById('checkoutModal');
    modalOrderSummary = document.getElementById('modalOrderSummary');
    modalTotalPrice = document.getElementById('modalTotalPrice');

    if (!menuGrid) {
        console.error("Elemen menuGrid tidak ditemukan.");
        return;
    }

    await loadMenu(); // Memuat menu dari Supabase
    updateCartUI();   // Memperbarui tampilan keranjang dari data yang ada
    
    // Mengatur tombol filter "Semua" aktif saat pertama kali dimuat
    const initialActiveButton = document.querySelector('.category-btn[onclick*="\'all\'"]');
    if (initialActiveButton) {
        initialActiveButton.classList.add('active');
    }
});

// Mengambil data menu dari Supabase
async function loadMenu() {
    const { data, error } = await supabaseClient
        .from('menu')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Gagal memuat menu dari database:', error);
        menuGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal Memuat Menu</p>';
    } else {
        allMenuItems = data;
        renderMenu('all');
    }
}

// Menampilkan item menu ke halaman
// Ganti fungsi renderMenu yang ada dengan yang ini:

// GANTI SELURUH FUNGSI renderMenu (sekitar line 72-99) dengan kode ini:

function renderMenu(filterCategory = 'all') {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';
    
    const filteredMenu = filterCategory === 'all' 
        ? allMenuItems 
        : allMenuItems.filter(item => item.category === filterCategory);
    
    if (filteredMenu.length === 0) {
        menuGrid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">Tidak ada menu untuk kategori ini.</p>`;
        return;
    }

    filteredMenu.forEach(item => {
        const menuItemHTML = `
            <div class="menu-item bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02] duration-300" data-category="${item.category}">
                <div class="w-full h-60 overflow-hidden">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" onerror="this.onerror=null; this.src='${placeholderImageURL}'">
                </div>
                
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${item.name}</h3>
                    <p class="text-sm text-gray-600 mb-3 flex-grow">${item.description}</p>
                    <div class="menu-item-footer mt-auto flex justify-between items-center">
                        <span class="menu-item-price text-lg font-bold text-orange-500">Rp ${Number(item.price).toLocaleString('id-ID')}</span>
                        <button class="add-to-cart-btn bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-md" onclick="addToCart(${item.id}, event)">Tambah</button>
                    </div>
                </div>
            </div>
        `;
        menuGrid.innerHTML += menuItemHTML;
    });
}

// Memfilter menu berdasarkan kategori
function filterMenu(category, event) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    if (event.currentTarget) event.currentTarget.classList.add('active');
    renderMenu(category);
}


// =================================================================
// FUNGSI-FUNGSI KERANJANG BELANJA (CART)
// =================================================================

// Menambah item ke keranjang
function addToCart(itemId, event) {
    const item = allMenuItems.find(menuItem => menuItem.id === itemId);
    if (!item) return;

    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    saveCartToStorage();
    updateCartUI();

    // Animasi tombol
    if (event && event.currentTarget) {
        const button = event.currentTarget;
        button.textContent = 'Ditambahkan!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Tambah';
            button.disabled = false;
        }, 1200);
    }
}

// Mengupdate jumlah item di keranjang
function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(cartItem => cartItem.id !== itemId);
    }
    
    saveCartToStorage();
    updateCartUI();
}

// Memperbarui tampilan UI keranjang belanja
function updateCartUI() {
    if (!cartCount || !cartItems || !cartTotal) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `<p class="text-center text-gray-500">Keranjang belanja kosong</p>`;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item flex items-center justify-between p-2">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-3" onerror="this.onerror=null; this.src='${placeholderImageURL}'">
                <div class="flex-grow">
                    <h4 class="font-semibold text-sm">${item.name}</h4>
                    <div class="text-xs text-gray-500">Rp ${Number(item.price).toLocaleString('id-ID')}</div>
                </div>
                <div class="flex items-center">
                    <button class="px-2 font-bold hover:text-orange-500" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="px-2">${item.quantity}</span>
                    <button class="px-2 font-bold hover:text-orange-500" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');
    }
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = totalPrice.toLocaleString('id-ID');
    
    const checkoutBtn = cartSidebar.querySelector('.checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

// Membuka/menutup sidebar keranjang
function toggleCart() {
    if(!cartSidebar || !overlay) return;
    cartSidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}


// =================================================================
// FUNGSI CHECKOUT DAN LOCALSTORAGE
// =================================================================

function checkout() {
    if (cart.length === 0) return;

    const modalDialog = checkoutModal.querySelector('div > div');
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    modalOrderSummary.innerHTML = cart.map(item => `
        <div class="flex justify-between py-1">
            <span>${item.name} <span class="text-xs text-gray-500">(x${item.quantity})</span></span>
            <span>Rp ${Number(item.price * item.quantity).toLocaleString('id-ID')}</span>
        </div>
    `).join('');
    
    modalTotalPrice.textContent = totalPrice.toLocaleString('id-ID');
    
    checkoutModal.classList.remove('hidden');
    checkoutModal.classList.add('flex');
    setTimeout(() => {
        if(modalDialog) modalDialog.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closeCheckoutModal() {
    const modalDialog = checkoutModal.querySelector('div > div');
    if (modalDialog) modalDialog.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        checkoutModal.classList.add('hidden');
        checkoutModal.classList.remove('flex');
        
        cart = [];
        saveCartToStorage(); // Simpan keranjang kosong
        updateCartUI();
        
        if (cartSidebar.classList.contains('open')) {
            toggleCart();
        }
    }, 300);
}

// Menyimpan keranjang ke localStorage
function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Memuat keranjang dari localStorage
function loadCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
}

// Event listener untuk tombol Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (!checkoutModal.classList.contains('hidden')) {
            closeCheckoutModal();
        } else if (cartSidebar.classList.contains('open')) {
            toggleCart();
        }
    }
});