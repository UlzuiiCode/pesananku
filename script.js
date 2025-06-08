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
let menuGrid, cartSidebar, overlay, cartCount, cartItems, cartTotal, checkoutModal;

const placeholderImageURL = 'https://placehold.co/400x250/E0E0E0/B0B0B0?text=Gambar+Tidak+Tersedia';

// =================================================================
// FUNGSI UTAMA DAN ALUR APLIKASI
// =================================================================
document.addEventListener('DOMContentLoaded', async function() {
    menuGrid = document.getElementById('menuGrid');
    cartSidebar = document.getElementById('cartSidebar');
    overlay = document.getElementById('overlay');
    cartCount = document.getElementById('cartCount');
    checkoutModal = document.getElementById('checkoutModal');
    
    if (!menuGrid || !cartSidebar || !overlay || !cartCount || !checkoutModal) {
        console.error("Elemen-elemen penting tidak ditemukan.");
        return;
    }

    loadCartUI(); 
    await loadMenu(); 
    updateCartUI(); 
    
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
    
    const initialActiveButton = document.querySelector('.category-btn');
    if (initialActiveButton) initialActiveButton.classList.add('active');
});

async function loadMenu() {
    const { data, error } = await supabaseClient.from('menu').select('*').order('id', { ascending: true });
    if (error) {
        menuGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal Memuat Menu</p>';
    } else {
        allMenuItems = data;
        renderMenu('all');
    }
}

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


function filterMenu(category, event) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    if (event.currentTarget) event.currentTarget.classList.add('active');
    renderMenu(category);
}

// =================================================================
// FUNGSI-FUNGSI KERANJANG BELANJA (CART)
// =================================================================
function loadCartUI() {
    if (!cartSidebar) return;
    cartSidebar.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-700">Keranjang Anda</h2>
            <button onclick="toggleCart()" class="text-gray-500 hover:text-gray-700 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div id="cartItemsContainer" class="flex-grow overflow-y-auto p-4 space-y-3"><div id="cartItems"></div></div>
        <div class="p-4 border-t border-gray-200 bg-gray-50">
            <div class="flex justify-between items-center mb-3">
                <span class="text-lg font-semibold text-gray-700">Total:</span>
                <span class="text-xl font-bold text-orange-600">Rp <span id="cartTotal">0</span></span>
            </div>
            <button class="checkout-btn w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md" onclick="checkout()">Pesan Sekarang</button>
        </div>
    `;
    cartItems = document.getElementById('cartItems');
    cartTotal = document.getElementById('cartTotal');
}

function addToCart(itemId) {
    const item = allMenuItems.find(menuItem => menuItem.id === itemId);
    if (!item) return;
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem) existingItem.quantity++;
    else cart.push({ ...item, quantity: 1 });
    saveCartToStorage();
    updateCartUI();
       // Animasi tombol
    // Animasi tombol
     if (event && event.currentTarget) {
        const button = event.currentTarget;
        const originalText = button.textContent; // Simpan teks asli
        const originalClasses = button.className; // Simpan kelas asli

        button.textContent = 'Ditambahkan!';
        button.disabled = true;
        
        // Hapus kelas warna biru dan tambahkan kelas warna hijau
        button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        button.classList.add('bg-green-500', 'hover:bg-green-600'); // Ganti ke hijau

        setTimeout(() => {
            button.textContent = originalText; // Kembalikan teks asli
            button.disabled = false;
            
            // Kembalikan kelas warna asli (biru)
            button.className = originalClasses;
        }, 500); // Durasi animasi 1.2 detik
    }
}


function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) cart = cart.filter(cartItem => cartItem.id !== itemId);
    saveCartToStorage();
    updateCartUI();
}

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

// =================================================================
// FUNGSI CHECKOUT DAN PENYIMPANAN
// =================================================================
function checkout() {
    if (cart.length === 0) return;
    document.getElementById('form-pesanan').classList.remove('hidden');
    document.getElementById('pesanan-berhasil').classList.add('hidden');
    const modalOrderSummary = document.getElementById('modalOrderSummary');
    const modalTotalPrice = document.getElementById('modalTotalPrice');
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    modalOrderSummary.innerHTML = cart.map(item => `<div class="flex justify-between py-1"><span>${item.name} (x${item.quantity})</span><span>Rp ${Number(item.price * item.quantity).toLocaleString('id-ID')}</span></div>`).join('');
    modalTotalPrice.textContent = totalPrice.toLocaleString('id-ID');
    checkoutModal.classList.remove('hidden');
    checkoutModal.classList.add('flex');
}

async function handleOrderSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Memproses...';

    // 1. Ambil data dari kedua input
    const customerName = document.getElementById('customer_name').value;
    const tableNumber = document.getElementById('table_number').value; // <-- BARIS BARU
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 2. Masukkan data baru (termasuk table_number) ke Supabase
    const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert({ 
            customer_name: customerName, 
            table_number: tableNumber, // <-- DATA BARU DISIMPAN
            total_price: totalPrice, 
            status: 'pending' 
        })
        .select('id')
        .single();

    if (orderError) {
        alert('Maaf, terjadi kesalahan saat membuat pesanan.');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Buat Pesanan & Dapatkan Nomor';
        return;
    }

    const orderId = orderData.id;
    const orderItems = cart.map(item => ({ order_id: orderId, menu_id: item.id, quantity: item.quantity, price_at_purchase: item.price }));
    
    const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        alert('Maaf, terjadi kesalahan saat menyimpan detail pesanan.');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Buat Pesanan & Dapatkan Nomor';
        return;
    }
    
    document.getElementById('orderNumber').textContent = `#${orderId}`;
    document.getElementById('form-pesanan').classList.add('hidden');
    document.getElementById('pesanan-berhasil').classList.remove('hidden');
    
    cart = [];
    saveCartToStorage();
    updateCartUI();
}

function closeCheckoutModal() {
    checkoutModal.classList.add('hidden');
    checkoutModal.classList.remove('flex');
    // Jangan clear cart di sini, biarkan sampai pesanan baru dibuat atau dibatalkan
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCartFromStorage() {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
}

function toggleCart() {
    if(!cartSidebar || !overlay) return;
    cartSidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (!checkoutModal.classList.contains('hidden')) closeCheckoutModal();
        else if (cartSidebar.classList.contains('open')) toggleCart();
    }
});