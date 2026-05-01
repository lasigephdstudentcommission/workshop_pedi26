const { createClient } = supabase;
const config = window.APP_CONFIG;
const db = createClient(config.supabaseUrl, config.supabaseAnonKey);

const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('passwordInput');
const gateCard = document.getElementById('gateCard');
const dashboardCard = document.getElementById('dashboardCard');
const tbody = document.querySelector('#teamsTable tbody');
const dashboardMeta = document.getElementById('dashboardMeta');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');

let authorized = false;
let lastTeams = [];

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function answersToText(answers) {
  return Object.entries(answers || {})
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function formatElapsedTime(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getDisplayElapsedSeconds(team) {
  if (team.finished || !team.started_at) {
    return team.elapsed_seconds || 0;
  }
  return Math.floor((Date.now() - new Date(team.started_at).getTime()) / 1000);
}

function sortTeamsForLeaderboard(teams) {
  return [...teams].sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    return getDisplayElapsedSeconds(a) - getDisplayElapsedSeconds(b);
  });
}

function getMissingSchemaColumn(error) {
  const match = String(error?.message || '').match(/Could not find the '([^']+)' column/);
  return match ? match[1] : null;
}

async function archiveActiveTeams(payload) {
  const updatePayload = { ...payload };
  while (true) {
    const { error } = await db.from('teams').update(updatePayload).gte('current_stage', 1);
    if (!error) return null;

    const missingColumn = getMissingSchemaColumn(error);
    if (missingColumn && Object.hasOwn(updatePayload, missingColumn)) {
      console.warn(`Retrying reset without missing database column: ${missingColumn}`);
      delete updatePayload[missingColumn];
      continue;
    }

    return error;
  }
}

async function loadTeams() {
  const { data, error } = await db.from('teams').select('*').gte('current_stage', 1).order('updated_at', { ascending: false });
  if (error) {
    alert(`Failed to load teams: ${error.message}`);
    return;
  }

  lastTeams = sortTeamsForLeaderboard(data || []);
  dashboardMeta.textContent = `${lastTeams.length} team(s) loaded. Ties are ordered by fastest time.`;
  tbody.innerHTML = lastTeams.map(team => `
    <tr>
      <td>${escapeHtml(team.team_name)}</td>
      <td>${team.current_stage}</td>
      <td>${team.finished ? 'Yes' : 'No'}</td>
      <td>${team.score}</td>
      <td>${formatElapsedTime(getDisplayElapsedSeconds(team))}</td>
      <td>${new Date(team.updated_at).toLocaleString()}</td>
      <td><pre>${escapeHtml(answersToText(team.answers))}</pre></td>
    </tr>
  `).join('');
}

function exportCsv() {
  const headers = [
    'team_name',
    'current_stage',
    'finished',
    'score',
    'elapsed_seconds',
    'elapsed_time',
    'started_at',
    'updated_at',
    'answers'
  ];
  const rows = lastTeams.map(team => {
    const elapsed = getDisplayElapsedSeconds(team);
    return [
      team.team_name,
      team.current_stage,
      team.finished,
      team.score,
      elapsed,
      formatElapsedTime(elapsed),
      team.started_at || '',
      team.updated_at,
      JSON.stringify(team.answers || {})
    ];
  });
  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pedipaper-teams.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function resetGame() {
  if (!authorized) return;

  const confirmed = window.confirm(
    'Reset the whole game? This will permanently delete all team names, answers, stages, scores, and times from the online database.'
  );
  if (!confirmed) return;

  resetBtn.disabled = true;
  const originalLabel = resetBtn.textContent;
  resetBtn.textContent = 'Resetting...';

  const error = await archiveActiveTeams({
    current_stage: 0,
    answers: {},
    score: 0,
    finished: true,
    elapsed_seconds: 0,
    updated_at: new Date().toISOString()
  });

  resetBtn.disabled = false;
  resetBtn.textContent = originalLabel;

  if (error) {
    alert(`Failed to reset game: ${error.message}`);
    return;
  }

  lastTeams = [];
  tbody.innerHTML = '';
  dashboardMeta.textContent = '0 team(s) loaded.';
  alert('Game reset complete. All teams, answers, scores, and times were cleared.');
}

passwordForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (passwordInput.value !== config.quizmasterPassword) {
    alert('Wrong password.');
    return;
  }
  authorized = true;
  gateCard.classList.add('hidden');
  dashboardCard.classList.remove('hidden');
  await loadTeams();
});

refreshBtn.addEventListener('click', () => authorized && loadTeams());
exportBtn.addEventListener('click', exportCsv);
resetBtn.addEventListener('click', resetGame);
