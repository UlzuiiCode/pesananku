const SUPABASE_URL = 'https://yklsygjqtampqiliuncz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHN5Z2pxdGFtcHFpbGl1bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNzM5NTAsImV4cCI6MjA2NDg0OTk1MH0.YuiD2lLHTM9y9CMJ6ZV_Z2kMe99C8vDSQh73xr4ogC8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const menuList = document.getElementById('menuList');
const menuForm = document.getElementById('menuForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const logoutBtn = document.getElementById('logoutBtn');
const menuIdInput = document.getElementById('menuId');

// Cek status login saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession(); // DIUBAH DI SINI
    if (!session) {
        window.location.href = 'admin.html';
    } else {
        await fetchAndRenderMenu();
    }
});

// Fungsi untuk Logout
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut(); // DIUBAH DI SINI
    window.location.href = 'admin.html';
});

// Fungsi untuk mengambil dan menampilkan data menu (READ)
const fetchAndRenderMenu = async () => {
    const { data, error } = await supabaseClient // DIUBAH DI SINI
        .from('menu')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching menu:', error);
        return;
    }

    menuList.innerHTML = '';
    data.forEach(item => {
        const row = `
            <tr class="border-b">
                <td class="p-2">${item.name}</td>
                <td class="p-2">Rp ${item.price.toLocaleString('id-ID')}</td>
                <td class="p-2">${item.category}</td>
                <td class="p-2 flex gap-2">
                    <button class="edit-btn text-blue-500 hover:underline" data-id="${item.id}">Edit</button>
                    <button class="delete-btn text-red-500 hover:underline" data-id="${item.id}">Hapus</button>
                </td>
            </tr>
        `;
        menuList.innerHTML += row;
    });
};

// Fungsi untuk Tambah & Edit Menu (CREATE & UPDATE)
menuForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const menuData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        description: document.getElementById('description').value
    };

    const id = menuIdInput.value;
    let error;

    if (id) {
        ({ error } = await supabaseClient.from('menu').update(menuData).eq('id', id)); // DIUBAH DI SINI
    } else {
        ({ error } = await supabaseClient.from('menu').insert([menuData])); // DIUBAH DI SINI
    }

    if (error) {
        alert('Gagal menyimpan data: ' + error.message);
    } else {
        menuForm.reset();
        resetFormState();
        await fetchAndRenderMenu();
    }
});

// Event listener untuk tombol Edit & Hapus
menuList.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.classList.contains('delete-btn')) {
        const id = target.dataset.id;
        if (confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
            const { error } = await supabaseClient.from('menu').delete().eq('id', id); // DIUBAH DI SINI
            if (error) {
                alert('Gagal menghapus: ' + error.message);
            } else {
                await fetchAndRenderMenu();
            }
        }
    }

    if (target.classList.contains('edit-btn')) {
        const id = target.dataset.id;
        const { data, error } = await supabaseClient.from('menu').select('*').eq('id', id).single(); // DIUBAH DI SINI
        if (error) {
            console.error('Gagal mengambil data untuk diedit', error);
            return;
        }
        
        menuIdInput.value = data.id;
        document.getElementById('name').value = data.name;
        document.getElementById('price').value = data.price;
        document.getElementById('category').value = data.category;
        document.getElementById('image').value = data.image;
        document.getElementById('description').value = data.description;
        
        formTitle.innerText = 'Edit Menu';
        submitBtn.innerText = 'Update';
        cancelBtn.classList.remove('hidden');
    }
});

// Tombol Batal Edit
cancelBtn.addEventListener('click', () => {
    resetFormState();
});

function resetFormState() {
    menuForm.reset();
    menuIdInput.value = '';
    formTitle.innerText = 'Tambah Menu Baru';
    submitBtn.innerText = 'Simpan';
    cancelBtn.classList.add('hidden');
}