// =================================================================
// KONFIGURASI DAN INISIALISASI
// =================================================================
const SUPABASE_URL = 'https://yklsygjqtampqiliuncz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHN5Z2pxdGFtcHFpbGl1bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNzM5NTAsImV4cCI6MjA2NDg0OTk1MH0.YuiD2lLHTM9y9CMJ6ZV_Z2kMe99C8vDSQh73xr4ogC8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =================================================================
// FUNGSI UTAMA - BERJALAN SAAT HALAMAN DIMUAT
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'admin.html';
        return; 
    }

    setupEventListeners();
    await fetchAndRenderMenu();
    await loadInitialOrders();
    await updateCompletedOrderCount();
    listenForNewOrders();
});


// =================================================================
// SETUP SEMUA EVENT LISTENER DI SATU TEMPAT
// =================================================================
function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'admin.html';
    });

    document.getElementById('menuForm').addEventListener('submit', handleMenuFormSubmit);
    document.getElementById('menuList').addEventListener('click', handleMenuListClick);
    document.getElementById('cancelBtn').addEventListener('click', resetFormState);

    const tabMenu = document.getElementById('tab-menu');
    const tabPesanan = document.getElementById('tab-pesanan');
    const contentMenu = document.getElementById('menu-management-content');
    const contentPesanan = document.getElementById('order-management-content');

    tabMenu.addEventListener('click', () => {
        contentMenu.classList.remove('hidden');
        contentPesanan.classList.add('hidden');
        tabMenu.classList.add('border-orange-500', 'text-orange-600');
        tabPesanan.classList.remove('border-orange-500', 'text-orange-600');
        tabPesanan.classList.add('border-transparent', 'text-gray-500');
    });

    tabPesanan.addEventListener('click', () => {
        contentPesanan.classList.remove('hidden');
        contentMenu.classList.add('hidden');
        tabPesanan.classList.add('border-orange-500', 'text-orange-600');
        tabMenu.classList.remove('border-orange-500', 'text-orange-600');
        tabMenu.classList.add('border-transparent', 'text-gray-500');
        
        // Saat tab pesanan diklik, sembunyikan notifikasi
        document.getElementById('pesanan-notif-dot').classList.add('hidden');
        if (document.title.startsWith('(1)')) {
            document.title = 'Dashboard Admin - Pesananku'; // Kembalikan ke judul asli
        }
    });

    document.getElementById('order-list').addEventListener('click', (event) => {
        const targetButton = event.target.closest('.complete-order-btn');
        if (targetButton) {
            const orderId = targetButton.dataset.id;
            if (orderId) completeOrder(orderId);
        }
    });
}

// =================================================================
// FUNGSI-FUNGSI MANAJEMEN MENU
// =================================================================
async function fetchAndRenderMenu() {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;
    const { data, error } = await supabaseClient.from('menu').select('*').order('id', { ascending: true });
    if (error) { console.error('Error fetching menu:', error); return; }
    menuList.innerHTML = data.map(item => `
        <tr class="border-b">
            <td class="p-2">${item.name}</td>
            <td class="p-2">Rp ${item.price.toLocaleString('id-ID')}</td>
            <td class="p-2">${item.category}</td>
            <td class="p-2 flex gap-2">
                <button class="edit-btn text-blue-500 hover:underline" data-id="${item.id}">Edit</button>
                <button class="delete-btn text-red-500 hover:underline" data-id="${item.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
}

async function handleMenuFormSubmit(event) {
    event.preventDefault();
    const menuData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        description: document.getElementById('description').value
    };
    const id = document.getElementById('menuId').value;
    const { error } = id ? await supabaseClient.from('menu').update(menuData).eq('id', id) : await supabaseClient.from('menu').insert([menuData]);
    if (error) { alert('Gagal menyimpan data: ' + error.message); }
    else { resetFormState(); await fetchAndRenderMenu(); }
}

async function handleMenuListClick(event) {
    const target = event.target;
    if (target.classList.contains('delete-btn')) {
        const id = target.dataset.id;
        if (confirm('Yakin ingin menghapus menu ini?')) {
            await supabaseClient.from('menu').delete().eq('id', id);
            await fetchAndRenderMenu();
        }
    }
    if (target.classList.contains('edit-btn')) {
        const id = target.dataset.id;
        const { data } = await supabaseClient.from('menu').select('*').eq('id', id).single();
        if(!data) return;
        document.getElementById('menuId').value = data.id;
        document.getElementById('name').value = data.name;
        document.getElementById('price').value = data.price;
        document.getElementById('category').value = data.category;
        document.getElementById('image').value = data.image;
        document.getElementById('description').value = data.description;
        document.getElementById('formTitle').innerText = 'Edit Menu';
        document.getElementById('submitBtn').innerText = 'Update';
        document.getElementById('cancelBtn').classList.remove('hidden');
    }
}

function resetFormState() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuId').value = '';
    document.getElementById('formTitle').innerText = 'Tambah Menu Baru';
    document.getElementById('submitBtn').innerText = 'Simpan';
    document.getElementById('cancelBtn').classList.add('hidden');
}


// =================================================================
// FUNGSI-FUNGSI MANAJEMEN PESANAN
// =================================================================
async function loadInitialOrders() {
    const orderListDiv = document.getElementById('order-list');
    if(!orderListDiv) return;
    const { data, error } = await supabaseClient.from('orders').select(`*, order_items(*, menu(name))`).eq('status', 'pending').order('created_at', { ascending: false });
    if (error) { console.error('Gagal memuat pesanan awal:', error); return; }
    if (data && data.length > 0) {
        orderListDiv.innerHTML = data.map(order => createOrderTicketHTML(order)).join('');
    } else {
        orderListDiv.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-20">
                <svg class="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                <h3 class="mt-2 text-xl font-semibold text-gray-900">Belum ada pesanan masuk</h3>
                <p class="mt-1 text-sm text-gray-500">Tampilan ini akan diperbarui secara otomatis saat ada pesanan baru.</p>
            </div>
        `;
    }
}

// FUNGSI BARU UNTUK MENGHITUNG PESANAN YANG SELESAI
async function updateCompletedOrderCount() {
    const { count, error } = await supabaseClient
        .from('orders')
        .select('*', { count: 'exact', head: true }) // Hanya minta hitungan, bukan datanya
        .eq('status', 'completed');

    if (error) {
        console.error('Gagal menghitung pesanan selesai:', error);
        return;
    }

    const countElement = document.getElementById('completed-orders-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

function listenForNewOrders() {
    const originalTitle = document.title;
    supabaseClient.channel('pesanan-masuk').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
        if (payload.new.status === 'pending') {
            const { data: newOrder } = await supabaseClient.from('orders').select(`*, order_items(*, menu(name))`).eq('id', payload.new.id).single();
            if (newOrder) {
                const orderListDiv = document.getElementById('order-list');
                const emptyState = orderListDiv.querySelector('.col-span-full');
                if(emptyState) emptyState.remove(); // Hapus pesan "kosong" jika ada
                
                orderListDiv.insertAdjacentHTML('afterbegin', createOrderTicketHTML(newOrder));
                
                // Tampilkan notifikasi
                document.getElementById('pesanan-notif-dot').classList.remove('hidden');
                document.title = `(1) Pesanan Baru! - ${originalTitle}`;
            }
        }
    }).subscribe();

    window.addEventListener('focus', () => {
        if (document.title.startsWith('(1)')) {
            document.title = originalTitle;
        }
    });
}

function createOrderTicketHTML(order) {
    const itemsHTML = order.order_items.map(item => `
        <li class="text-sm">${item.quantity}x ${item.menu ? item.menu.name : 'Menu Dihapus'}</li>
    `).join('');
    return `
        <div id="order-card-${order.id}" class="bg-yellow-100 p-4 rounded-lg shadow border border-yellow-300 flex flex-col">
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-bold">Pesanan #${order.id}</h4>
                <span class="text-xs text-gray-600">${new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p class="text-sm font-medium">Pemesan: ${order.customer_name}</p>
            <p class="text-sm font-medium mb-2">Meja: <span class="font-bold text-lg">${order.table_number || '-'}</span></p>
            <ul class="list-disc list-inside my-2 pl-2 space-y-1 flex-grow">${itemsHTML}</ul>
            <button data-id="${order.id}" class="complete-order-btn mt-4 w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 text-sm font-semibold">Selesaikan & Bayar</button>
        </div>
    `;
}

async function completeOrder(orderId) {
    const { error } = await supabaseClient.from('orders').update({ status: 'completed' }).eq('id', orderId);
    if (error) {
        alert('Gagal menyelesaikan pesanan: ' + error.message);
    } else {
        const orderCard = document.getElementById(`order-card-${orderId}`);
        if(orderCard) {
            orderCard.style.transition = 'opacity 0.5s, transform 0.5s';
            orderCard.style.opacity = '0';
            orderCard.style.transform = 'scale(0.95)';
            setTimeout(() => orderCard.remove(), 500);

            updateCompletedOrderCount();
        }
    }
}