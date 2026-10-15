// ==================== CONFIG ====================
const API_BASE = "https://api.github.com";

// OPTIONAL: Add your GitHub PAT here to avoid rate-limit (60/hr -> 5000/hr)
// Generate at: https://github.com/settings/tokens  (no scopes needed for public data)
const GITHUB_TOKEN = "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"; // <-- paste token like "ghp_xxxx" if needed

const headers = GITHUB_TOKEN
  ? { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
  : { Accept: "application/vnd.github+json" };

// ==================== DOM refs ====================
const singleSearch  = document.getElementById("singleSearch");
const battleSearch  = document.getElementById("battleSearch");
const searchForm    = document.getElementById("searchForm");
const battleForm    = document.getElementById("battleForm");
const usernameInput = document.getElementById("usernameInput");
const battleToggle  = document.getElementById("battleToggle");
const loadingEl     = document.getElementById("loading");
const errorBox      = document.getElementById("errorBox");
const errorMessage  = document.getElementById("errorMessage");
const profileCard   = document.getElementById("profileCard");
const reposSection  = document.getElementById("reposSection");
const reposList     = document.getElementById("reposList");
const battleResults = document.getElementById("battleResults");

let isBattleMode = false;

// ==================== HELPERS ====================
function showLoading() {
  loadingEl.classList.remove("hidden");
  errorBox.classList.add("hidden");
  profileCard.classList.add("hidden");
  reposSection.classList.add("hidden");
  battleResults.classList.add("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function showError(msg) {
  hideLoading();
  errorMessage.textContent = msg || "No user exists with that username.";
  errorBox.classList.remove("hidden");
  profileCard.classList.add("hidden");
  reposSection.classList.add("hidden");
  battleResults.classList.add("hidden");
}

function clearAll() {
  profileCard.innerHTML = "";
  reposList.innerHTML = "";
  battleResults.innerHTML = "";
  errorBox.classList.add("hidden");
}

// ISO string -> "25 Jan 2023"
function formatDate(isoString) {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// ==================== FETCH UTILITIES ====================
async function fetchUser(username) {
  const res = await fetch(`${API_BASE}/users/${username}`, { headers });
  if (res.status === 404) throw { type: "NOT_FOUND", message: "User Not Found" };
  if (res.status === 403) throw { type: "RATE_LIMIT", message: "GitHub API rate limit exceeded. Add a PAT." };
  if (!res.ok)            throw { type: "HTTP_ERROR", message: `HTTP ${res.status}` };
  return res.json();
}

async function fetchRepos(reposUrl) {
  // get latest 5 repos sorted by pushed_at / created_at
  const res = await fetch(`${reposUrl}?sort=updated&per_page=5`, { headers });
  if (!res.ok) throw { type: "HTTP_ERROR", message: `Repo fetch failed (${res.status})` };
  return res.json();
}

async function fetchAllRepos(username) {
  // For battle mode: get up to 100 repos to compute total stars
  const res = await fetch(`${API_BASE}/users/${username}/repos?per_page=100`, { headers });
  if (!res.ok) throw { type: "HTTP_ERROR", message: `Repo fetch failed (${res.status})` };
  return res.json();
}

// ==================== RENDER: PROFILE ====================
function renderProfile(user) {
  const joined = formatDate(user.created_at);
  const name   = user.name || user.login;
  const bio    = user.bio || "This user has no bio.";

  profileCard.innerHTML = `
    <img src="${user.avatar_url}" alt="${name}" />
    <div class="profile-info">
      <h2>${name}</h2>
      <a class="username" href="${user.html_url}" target="_blank" rel="noopener">@${user.login}</a>
      <p class="bio">${bio}</p>
      <div class="profile-meta">
        <span>📅 Joined: ${joined}</span>
        <span>📦 Repos: ${user.public_repos}</span>
        <span>👥 Followers: ${user.followers}</span>
        ${
          user.blog
            ? `<a href="${user.blog.startsWith("http") ? user.blog : "https://" + user.blog}"
                 target="_blank" rel="noopener">🔗 Portfolio</a>`
            : ""
        }
      </div>
    </div>
  `;
  profileCard.classList.remove("hidden");
}

// ==================== RENDER: REPOS ====================
function renderRepos(repos) {
  if (!repos.length) {
    reposSection.classList.add("hidden");
    return;
  }
  reposList.innerHTML = repos
    .map(
      (repo) => `
      <div class="repo-item">
        <a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>
        <p class="repo-desc">${repo.description || "No description provided."}</p>
        <div class="repo-meta">
          <span>⭐ ${repo.stargazers_count}</span>
          <span>🍴 ${repo.forks_count}</span>
          <span>🕒 Updated: ${formatDate(repo.updated_at)}</span>
        </div>
      </div>`
    )
    .join("");
  reposSection.classList.remove("hidden");
}

// ==================== SINGLE SEARCH FLOW ====================
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  clearAll();
  showLoading();

  try {
    const user  = await fetchUser(username);
    const repos = await fetchRepos(user.repos_url);

    hideLoading();
    renderProfile(user);
    renderRepos(repos);
  } catch (err) {
    console.error(err);
    if (err.type === "NOT_FOUND")   showError("No GitHub user found with that username.");
    else if (err.type === "RATE_LIMIT") showError("API rate limit hit. Please wait or add a PAT.");
    else showError(err.message || "Something went wrong. Please try again.");
  }
});

// ==================== BATTLE MODE TOGGLE ====================
battleToggle.addEventListener("click", () => {
  isBattleMode = !isBattleMode;

  if (isBattleMode) {
    battleToggle.textContent = "⚔️ Battle Mode: ON";
    battleToggle.classList.add("active");
    singleSearch.classList.add("hidden");
    battleSearch.classList.remove("hidden");
  } else {
    battleToggle.textContent = "⚔️ Battle Mode: OFF";
    battleToggle.classList.remove("active");
    singleSearch.classList.remove("hidden");
    battleSearch.classList.add("hidden");
  }

  clearAll();
});

// ==================== BATTLE FLOW ====================
battleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const u1 = document.getElementById("user1Input").value.trim();
  const u2 = document.getElementById("user2Input").value.trim();
  if (!u1 || !u2) return;

  clearAll();
  showLoading();

  try {
    // Promise.all -> parallel fetch of both users
    const [user1, user2] = await Promise.all([fetchUser(u1), fetchUser(u2)]);

    // Parallel fetch repos for both
    const [repos1, repos2] = await Promise.all([
      fetchAllRepos(user1.login),
      fetchAllRepos(user2.login),
    ]);

    // Reduce -> total stars
    const stars1 = repos1.reduce((sum, r) => sum + r.stargazers_count, 0);
    const stars2 = repos2.reduce((sum, r) => sum + r.stargazers_count, 0);

    hideLoading();
    renderBattle(user1, stars1, user2, stars2);
  } catch (err) {
    console.error(err);
    if (err.type === "NOT_FOUND")   showError("One or both usernames not found.");
    else if (err.type === "RATE_LIMIT") showError("API rate limit hit. Please wait or add a PAT.");
    else showError(err.message || "Something went wrong.");
  }
});

function renderBattle(user1, stars1, user2, stars2) {
  let c1 = "tie", c2 = "tie", b1 = "TIE", b2 = "TIE", bClass = "tie-badge";

  if (stars1 > stars2) {
    c1 = "winner"; c2 = "loser";
    b1 = "WINNER 🏆"; b2 = "DEFEATED";
  } else if (stars2 > stars1) {
    c2 = "winner"; c1 = "loser";
    b2 = "WINNER 🏆"; b1 = "DEFEATED";
  }

  battleResults.innerHTML = `
    ${battleCardHTML(user1, stars1, c1, b1)}
    ${battleCardHTML(user2, stars2, c2, b2)}
  `;
  battleResults.classList.remove("hidden");
}

function battleCardHTML(user, stars, cls, badgeText) {
  const badgeClass =
    cls === "winner" ? "winner-badge" : cls === "loser" ? "loser-badge" : "tie-badge";
  return `
    <div class="battle-card ${cls}">
      <img src="${user.avatar_url}" alt="${user.login}" />
      <h3>${user.name || user.login}</h3>
      <a class="username" href="${user.html_url}" target="_blank" rel="noopener">@${user.login}</a>
      <p class="stars">⭐ ${stars} Total Stars</p>
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
  `;
}