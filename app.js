// GitHub Profile Viewer - Logic
const form = document.getElementById('lookup-form');
const input = document.getElementById('username');
const results = document.getElementById('results');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMsg = document.getElementById('error-msg');

// Profile elements
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const loginEl = document.getElementById('login');
const bioEl = document.getElementById('bio');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const reposEl = document.getElementById('repos');
const companyEl = document.getElementById('company');
const blogEl = document.getElementById('blog');
const locationEl = document.getElementById('location');

// Graph elements
const graphImg = document.getElementById('contrib-graph');
const graphFallback = document.getElementById('graph-fallback');

// Resume elements
const resumeInput = document.getElementById('resume-input');
const resumeViewer = document.getElementById('resume-viewer');
const resumeDownload = document.getElementById('resume-download');
let resumeUrl = null;

// Helpers
function setLoading(isLoading){
  const btn = document.getElementById('submit-btn');
  if(isLoading){
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Loading…';
  } else {
    btn.disabled = false;
    if(btn.dataset.originalText){ btn.textContent = btn.dataset.originalText; }
  }
}

function showError(message){
  errorMsg.textContent = message;
  errorState.classList.remove('hidden');
}
function clearError(){ errorState.classList.add('hidden'); }

function showResults(){
  results.classList.remove('hidden');
  emptyState.classList.add('hidden');
}

function clearResume(){
  if(resumeUrl){ URL.revokeObjectURL(resumeUrl); resumeUrl = null; }
  if(resumeViewer){ resumeViewer.innerHTML = '<div class="muted">No resume uploaded.</div>'; }
  if(resumeDownload){
    resumeDownload.classList.add('hidden');
    resumeDownload.removeAttribute('href');
    resumeDownload.removeAttribute('download');
  }
}

function resetProfile(){
  avatar.src = '';
  nameEl.textContent = '—';
  loginEl.textContent = '—';
  loginEl.href = '#';
  bioEl.textContent = '—';
  followersEl.textContent = '0 followers';
  followingEl.textContent = '0 following';
  reposEl.textContent = '0 public repos';
  companyEl.textContent = '';
  blogEl.textContent = '';
  blogEl.removeAttribute('href');
  locationEl.textContent = '';
}

function sanitizeUrl(url){
  try{ const u = new URL(url.startsWith('http')? url : 'https://' + url); return u.href; }catch{ return ''; }
}

async function fetchProfile(username){
  const resp = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if(resp.status === 404){ throw new Error('User not found'); }
  if(!resp.ok){ throw new Error('Failed to fetch user profile'); }
  return await resp.json();
}

function setGraph(username){
  // Primary: ghchart by Rohan Shah (returns SVG image). Color customizable via hex.
  const primary = `https://ghchart.rshah.org/2196f3/${encodeURIComponent(username)}`;
  graphImg.src = primary;
  graphImg.alt = `GitHub contributions graph for ${username}`;
  graphFallback.classList.add('hidden');
  graphImg.onerror = () => {
    // Fallback to another public service if available
    const fallback = `https://github-contributions-api.deno.dev/${encodeURIComponent(username)}.svg`;
    graphImg.onerror = () => {
      graphFallback.classList.remove('hidden');
    };
    graphImg.src = fallback;
  };
}

async function handleSubmit(evt){
  evt.preventDefault();
  clearError();
  const username = input.value.trim();
  if(!username){ return; }
  setLoading(true);
  resetProfile();

  try{
    const user = await fetchProfile(username);
    // Populate profile card
    avatar.src = user.avatar_url;
    nameEl.textContent = user.name || user.login;
    loginEl.textContent = '@' + user.login;
    loginEl.href = user.html_url;
    bioEl.textContent = user.bio || '—';
    followersEl.textContent = `${user.followers} follower${user.followers === 1 ? '' : 's'}`;
    followingEl.textContent = `${user.following} following`;
    reposEl.textContent = `${user.public_repos} public repo${user.public_repos === 1 ? '' : 's'}`;
    companyEl.textContent = user.company ? `🏢 ${user.company}` : '';
    const blog = sanitizeUrl(user.blog || '');
    blogEl.textContent = blog ? '🔗 Website' : '';
    if(blog){ blogEl.href = blog; }
    locationEl.textContent = user.location ? `📍 ${user.location}` : '';

    // Set contribution graph
    setGraph(user.login);

    // Reveal results
    showResults();
  }catch(err){
    showError(err.message || 'Something went wrong');
  }finally{
    setLoading(false);
  }
}

form.addEventListener('submit', handleSubmit);

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    input.value = e.target.dataset.username;
    form.requestSubmit();
  });
});

if(resumeInput){
  resumeInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file){ clearResume(); return; }
    if(file.type !== 'application/pdf'){
      clearResume();
      showError('Please select a PDF file');
      return;
    }
    clearError();
    if(resumeUrl){ URL.revokeObjectURL(resumeUrl); }
    resumeUrl = URL.createObjectURL(file);
    if(resumeViewer){
      resumeViewer.innerHTML = '';
      const embed = document.createElement('embed');
      embed.type = 'application/pdf';
      embed.src = resumeUrl;
      embed.className = 'pdf-embed';
      embed.setAttribute('aria-label', 'Resume PDF');
      resumeViewer.appendChild(embed);
    }
    if(resumeDownload){
      resumeDownload.href = resumeUrl;
      resumeDownload.download = file.name || 'resume.pdf';
      resumeDownload.classList.remove('hidden');
    }
    showResults();
  });
}

window.addEventListener('beforeunload', () => { if(resumeUrl){ URL.revokeObjectURL(resumeUrl); } });
