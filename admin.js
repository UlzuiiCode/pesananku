const SUPABASE_URL = 'https://yklsygjqtampqiliuncz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHN5Z2pxdGFtcHFpbGl1bmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNzM5NTAsImV4cCI6MjA2NDg0OTk1MH0.YuiD2lLHTM9y9CMJ6ZV_Z2kMe99C8vDSQh73xr4ogC8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Login Gagal: ' + error.message);
    } else {
        // Jika berhasil, arahkan ke dashboard
        window.location.href = 'dashboard.html';
    }
});