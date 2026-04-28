const _supabaseUrl = 'https://ejifepvtfczndeezyfgz.supabase.co';
const _supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaWZlcHZ0ZmN6bmRlZXp5Zmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTY1NDAsImV4cCI6MjA5MjkzMjU0MH0.n44Jhmux7oj1QJtYbVo2uXRxjOknKehDkFEJSDdVkwc';
const supabaseClient = supabase.createClient(_supabaseUrl, _supabaseKey);

// --- 1. STATE MANAGEMENT ---
let currentTheme = localStorage.getItem('app-theme') || 'dark'; 
let selectedImageBase64 = null;

async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return window.location.replace("index.html");

    // Fetch Latest Profile Photo from Supabase (WhatsApp Logic)
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('avator_url')
        .eq('id', session.user.id)
        .single();

    const name = session.user.user_metadata.display_name || "User";
    document.getElementById('user-display-name').innerText = name;

    const defaultAvatar = `https://ui-avatars.com/api/?name=${name}&background=random`;
    const finalPhoto = profile?.avator_url || localStorage.getItem(`user_dp_${session.user.id}`) || defaultAvatar;
    
    document.querySelectorAll('.profile-img-sync').forEach(img => img.src = finalPhoto);

    applyTheme(currentTheme);
    fetchPosts();
}
init();

// --- 2. THEME ENGINE ---
function applyTheme(theme) {
    const body = document.getElementById('body-bg');
    const textArea = document.getElementById('post-content');
    localStorage.setItem('app-theme', theme);
    currentTheme = theme;

    body.className = "min-h-screen transition-all duration-500 ";
    
    if (theme === 'light') {
        body.classList.add("bg-[#f8fafc]", "text-[#1e293b]");
        if(textArea) textArea.style.color = "#1e293b";
    } else if (theme === 'blue') {
        body.classList.add("bg-[#1e1b4b]", "text-blue-50");
        if(textArea) textArea.style.color = "white";
    } else if (theme === 'brown') {
        body.classList.add("bg-[#3e2723]", "text-[#efebe9]");
        if(textArea) textArea.style.color = "white";
    } else if (theme === 'sunset') {
        body.classList.add("bg-[#4a1e12]", "text-[#fff3e0]");
        if(textArea) textArea.style.color = "white";
    } else if (theme === 'forest') {
        body.classList.add("bg-[#1b5e20]", "text-[#e8f5e9]");
        if(textArea) textArea.style.color = "white";
    } else {
        body.classList.add("bg-[#0f172a]", "text-white");
        if(textArea) textArea.style.color = "white";
    }
    fetchPosts(); 
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const themes = ['dark', 'light', 'blue', 'brown', 'sunset', 'forest'];
    let nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    applyTheme(themes[nextIndex]);
});

// --- 3. PROFILE UPDATE (Global WhatsApp Style) ---
document.getElementById('image-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target.result;
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            // Update in Supabase Profiles Table
            const { error } = await supabaseClient.from('profiles').upsert({ 
                id: session.user.id, 
                avator_url: base64Image,
                display_name: session.user.user_metadata.display_name 
            });

            if (!error) {
                localStorage.setItem(`user_dp_${session.user.id}`, base64Image);
                document.querySelectorAll('.profile-img-sync').forEach(img => img.src = base64Image);
                Swal.fire({ icon: 'success', title: 'DP Updated Everywhere!', showConfirmButton: false, timer: 1500 });
                fetchPosts();
            }
        };
        reader.readAsDataURL(file);
    }
});

// --- 4. POSTING LOGIC ---
document.getElementById('post-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            selectedImageBase64 = ev.target.result;
            document.getElementById('post-image-preview').src = selectedImageBase64;
            document.getElementById('image-preview-container').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('submit-post')?.addEventListener('click', async () => {
    const contentArea = document.getElementById('post-content');
    const content = contentArea.value.trim();
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!content && !selectedImageBase64) return;

    const confirm = await Swal.fire({
        title: 'Ready to post? 🚀',
        showCancelButton: true,
        confirmButtonText: 'Yes, Post it!',
        background: currentTheme === 'light' ? '#fff' : '#1f2937',
        color: currentTheme === 'light' ? '#1e293b' : '#fff'
    });

    if (confirm.isConfirmed) {
        const { error } = await supabaseClient.from('posts').insert([{ 
            content: content, 
            author_name: session.user.user_metadata.display_name || "User",
            user_id: session.user.id,
            image_url: selectedImageBase64
        }]);

        if (!error) {
            contentArea.value = "";
            selectedImageBase64 = null;
            document.getElementById('image-preview-container').classList.add('hidden');
            Swal.fire({ icon: 'success', title: 'Posted Successfully!', showConfirmButton: false, timer: 1500 });
            fetchPosts();
        }
    }
});

// --- 5. RENDER 3D FEED (With Global DP & Permanent Likes) ---
async function fetchPosts() {
    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select(`*, profiles (avator_url)`)
        .order('created_at', { ascending: false });

    const { data: { session } } = await supabaseClient.auth.getSession();
    const feed = document.getElementById('blog-feed');
    
    if (error || !feed) return;
    feed.innerHTML = "";

    const isLight = currentTheme === 'light';
    const cardClass = isLight 
        ? "bg-white shadow-[0_15px_40px_rgba(0,0,0,0.1)] text-[#1e293b]" 
        : "glass shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white";

    posts.forEach(post => {
        const isOwner = session && session.user.id === post.user_id;
        const userPhoto = post.profiles?.avator_url || `https://ui-avatars.com/api/?name=${post.author_name}&background=random`;

        const postHTML = `
            <div class="${cardClass} rounded-[2.5rem] p-7 mb-8 transform transition hover:scale-[1.01] border border-white/5">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-4">
                        <img src="${userPhoto}" class="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-md" />
                        <div>
                            <p class="font-black text-sm tracking-tight">${post.author_name || 'Anonymous'}</p>
                            <p class="text-[10px] opacity-40 font-bold">${new Date(post.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="flex gap-2">
                            <button onclick="editPost('${post.id}')" class="px-4 py-2 rounded-xl text-[10px] font-black bg-blue-600 text-white shadow-md">EDIT</button>
                            <button onclick="deletePost('${post.id}')" class="px-4 py-2 rounded-xl text-[10px] font-black bg-red-600 text-white shadow-md">DELETE</button>
                        </div>` : ''}
                </div>
                <p id="post-text-${post.id}" class="mt-6 text-[15px] leading-relaxed font-semibold opacity-90">${post.content}</p>
                ${post.image_url ? `<div class="mt-5 rounded-[2rem] overflow-hidden shadow-2xl"><img src="${post.image_url}" class="w-full object-cover"></div>` : ''}
                <div class="flex gap-8 mt-6 pt-5 border-t border-black/5 flex items-center">
                    <button onclick="handleLike(this, '${post.id}')" class="group flex items-center gap-2 hover:scale-110 transition-all">
                        <div class="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">❤️</div>
                        <span class="like-count font-black">${post.likes_count || 0}</span>
                    </button>
                </div>
            </div>`;
        feed.insertAdjacentHTML('beforeend', postHTML);
    });
}

// --- 6. ACTIONS ---
window.deletePost = async (id) => {
    const result = await Swal.fire({
        title: 'Are you sure? 🤔',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        background: currentTheme === 'light' ? '#fff' : '#1f2937',
        color: currentTheme === 'light' ? '#1e293b' : '#fff'
    });

    if (result.isConfirmed) {
        await supabaseClient.from('posts').delete().eq('id', id);
        Swal.fire({ icon: 'success', title: 'Deleted!', showConfirmButton: false, timer: 1500 });
        fetchPosts();
    }
};

window.editPost = async (id) => {
    const oldText = document.getElementById(`post-text-${id}`).innerText;
    const { value: newContent } = await Swal.fire({
        title: 'Edit Post ✍️',
        input: 'textarea',
        inputValue: oldText,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        background: currentTheme === 'light' ? '#fff' : '#1f2937',
        color: currentTheme === 'light' ? '#1e293b' : '#fff'
    });

    if (newContent && newContent !== oldText) {
        await supabaseClient.from('posts').update({ content: newContent }).eq('id', id);
        Swal.fire({ icon: 'success', title: 'Updated!', showConfirmButton: false, timer: 1500 });
        fetchPosts();
    }
};

window.handleLike = async (btn, postId) => {
    const countSpan = btn.querySelector('.like-count');
    let currentLikes = parseInt(countSpan.innerText);
    
    const isLiked = btn.classList.toggle('text-red-500');
    const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    countSpan.innerText = newLikes;

    await supabaseClient.from('posts').update({ likes_count: newLikes }).eq('id', postId);
};

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.replace("index.html");
});
