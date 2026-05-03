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
const showResultsBtn = document.getElementById('showResultsBtn');
const resetBtn = document.getElementById('resetBtn');

let authorized = false;
let lastTeams = [];
const GAME_STATE_TEAM = '__game_state__';

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

async function saveGameState(state) {
  const payload = {
    team_name: GAME_STATE_TEAM,
    current_stage: 0,
    answers: state,
    score: 0,
    finished: true,
    elapsed_seconds: 0,
    updated_at: new Date().toISOString()
  };
  const savePayload = { ...payload };

  while (true) {
    let error = null;
    let updatedRows = null;
    try {
      const updateResult = await db
        .from('teams')
        .update(savePayload)
        .eq('team_name', GAME_STATE_TEAM)
        .select('team_name');
      error = updateResult.error;
      updatedRows = updateResult.data || [];

      if (!error && updatedRows.length === 0) {
        const insertResult = await db.from('teams').insert(savePayload);
        error = insertResult.error;
      }
    } catch (caughtError) {
      error = caughtError;
    }

    if (!error) return null;

    const missingColumn = getMissingSchemaColumn(error);
    if (missingColumn && Object.hasOwn(savePayload, missingColumn)) {
      console.warn(`Retrying game state save without missing database column: ${missingColumn}`);
      delete savePayload[missingColumn];
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
  const stateError = await saveGameState({
    results_released: false,
    released_at: null,
    winner_team: null,
    leaderboard: []
  });

  resetBtn.disabled = false;
  resetBtn.textContent = originalLabel;

  if (error || stateError) {
    alert(`Failed to reset game: ${(error || stateError).message}`);
    return;
  }

  lastTeams = [];
  tbody.innerHTML = '';
  dashboardMeta.textContent = '0 team(s) loaded.';
  alert('Game reset complete. All teams, answers, scores, and times were cleared.');
}

async function releaseResults() {
  if (!authorized) return;
  if (!lastTeams.length) {
    await loadTeams();
  }
  if (!lastTeams.length) {
    alert('No teams to release yet.');
    return;
  }

  const leaderboard = sortTeamsForLeaderboard(lastTeams).map((team, index) => ({
    rank: index + 1,
    team_name: team.team_name,
    score: team.score || 0,
    elapsed_seconds: getDisplayElapsedSeconds(team),
    elapsed_time: formatElapsedTime(getDisplayElapsedSeconds(team)),
    finished: !!team.finished
  }));
  const winner = leaderboard[0];

  const confirmed = window.confirm(`Release results now? Winner: ${winner.team_name}`);
  if (!confirmed) return;

  showResultsBtn.disabled = true;
  const originalLabel = showResultsBtn.textContent;
  showResultsBtn.textContent = 'Releasing...';

  const error = await saveGameState({
    results_released: true,
    released_at: new Date().toISOString(),
    winner_team: winner.team_name,
    winner_score: winner.score,
    winner_elapsed_seconds: winner.elapsed_seconds,
    winner_elapsed_time: winner.elapsed_time,
    leaderboard
  });

  showResultsBtn.disabled = false;
  showResultsBtn.textContent = originalLabel;

  if (error) {
    alert(`Failed to release results: ${error.message}`);
    return;
  }

  alert('Results released. Teams can now press Show my fate.');
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
showResultsBtn.addEventListener('click', releaseResults);
resetBtn.addEventListener('click', resetGame);
