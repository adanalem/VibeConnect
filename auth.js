// 1. Supabase Initialization
const _supabaseUrl = 'https://ejifepvtfczndeezyfgz.supabase.co';
const _supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaWZlcHZ0ZmN6bmRlZXp5Zmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTY1NDAsImV4cCI6MjA5MjkzMjU0MH0.n44Jhmux7oj1QJtYbVo2uXRxjOknKehDkFEJSDdVkwc';
const supabaseClient = supabase.createClient(_supabaseUrl, _supabaseKey);

// --- LOGIN LOGIC ---
const loginBtn = document.getElementById('auth-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please enter both email and password.',
                background: '#1f2937',
                color: '#fff'
            });
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: error.message,
                background: '#1f2937',
                color: '#fff'
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Welcome Back!',
                text: 'Access granted. Opening your feed...',
                timer: 1500,
                showConfirmButton: false,
                background: '#1f2937',
                color: '#fff'
            });
            
            // Timeout use kar rahay hain taakay browser session handle kar lay
            setTimeout(() => {
                // .replace use karne se back-loop nahi banta
                window.location.replace("dashboard.html"); 
            }, 1500);
        }
    });
}

// --- SIGNUP LOGIC ---
const signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!email || !password || !fullName) {
            Swal.fire({
                icon: 'info',
                title: 'Incomplete Form',
                text: 'All fields are required to create an account.',
                background: '#1f2937',
                color: '#fff'
            });
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: fullName
                }
            }
        });

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Signup Error',
                text: error.message,
                background: '#1f2937',
                color: '#fff'
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Account Created!',
                text: 'Registration successful. You can now log in.',
                background: '#1f2937',
                color: '#fff'
            });
            setTimeout(() => {
                window.location.replace("index.html");
            }, 2500);
        }
    });
}