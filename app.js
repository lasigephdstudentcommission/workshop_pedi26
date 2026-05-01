const { createClient } = supabase;
const config = window.APP_CONFIG;
const db = createClient(config.supabaseUrl, config.supabaseAnonKey);

const teamForm = document.getElementById('teamForm');
const teamNameInput = document.getElementById('teamName');
const teamCard = document.getElementById('teamCard');
const locationCard = document.getElementById('locationCard');
const quizCard = document.getElementById('quizCard');
const quizForm = document.getElementById('quizForm');
const quizEyebrow = document.getElementById('quizEyebrow');
const quizTitle = document.getElementById('quizTitle');
const finalCard = document.getElementById('finalCard');
const finalMessage = document.getElementById('finalMessage');
const statusText = document.getElementById('statusText');
const teamPill = document.getElementById('teamPill');
const stagePill = document.getElementById('stagePill');
const scorePill = document.getElementById('scorePill');
const timePill = document.getElementById('timePill');
const timerDisplay = document.getElementById('timerDisplay');
const progressLabel = document.getElementById('progressLabel');
const progressBar = document.getElementById('progressBar');
const stageStepsWrap = document.getElementById('stageSteps');
const locationEyebrow = document.getElementById('locationEyebrow');
const locationTitle = document.getElementById('locationTitle');
const checkpointDescription = document.getElementById('checkpointDescription');
const checkpointMediaWrap = document.getElementById('checkpointMediaWrap');
const locationStatus = document.getElementById('locationStatus');
const mapLinkWrap = document.getElementById('mapLinkWrap');
const checkLocationBtn = document.getElementById('checkLocationBtn');
const debugUnlockBtn = document.getElementById('debugUnlockBtn');
const debugResetBtn = document.getElementById('debugResetBtn');

let currentTeam = null;
let currentStage = 1;
let answers = {};
let score = 0;
let finished = false;
let startedAt = null;
let elapsedSeconds = 0;
let timerInterval = null;

const TEAM_STORAGE_KEY = 'pedipaper_team_name';

function normalizeAnswer(value = '') {
  return value.trim().toLowerCase();
}

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderFunFactText(text = '') {
  return escapeHtml(text).replace('but first comes the pursuit!', '<span class="fun-fact-emphasis">but first comes the pursuit!</span>');
}

function renderCheckpointMedia(checkpoint) {
  if (!checkpoint.imageUrl) return '';

  return `
    <figure class="checkpoint-media-card">
      <img class="checkpoint-image" src="${escapeHtml(checkpoint.imageUrl)}" alt="${escapeHtml(checkpoint.description)}" loading="lazy" />
      <figcaption>${escapeHtml(checkpoint.description)}</figcaption>
    </figure>
  `;
}

function calculateScore(allAnswers) {
  let total = 0;
  for (const checkpoint of config.checkpoints) {
    for (const q of checkpoint.questions) {
      if (normalizeAnswer(allAnswers[q.id]) === normalizeAnswer(q.correctAnswer)) {
        total += 1;
      }
    }
  }
  return total;
}

function getCheckpoint(stage) {
  return config.checkpoints[stage - 1] || null;
}

function getGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function getMapLinkHtml(checkpoint) {
  return `<a class="map-link" target="_blank" rel="noopener noreferrer" href="${getGoogleMapsUrl(checkpoint.lat, checkpoint.lng)}">Open checkpoint in Google Maps</a>`;
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

function getCurrentElapsedSeconds() {
  if (!startedAt) return elapsedSeconds || 0;
  if (finished) return elapsedSeconds || 0;
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
}

function renderTimer() {
  elapsedSeconds = getCurrentElapsedSeconds();
  const formatted = formatElapsedTime(elapsedSeconds);
  timePill.textContent = `Time: ${formatted}`;
  if (timerDisplay) {
    timerDisplay.textContent = formatted;
  }
}

function startTimerTicker() {
  if (timerInterval) clearInterval(timerInterval);
  renderTimer();
  if (currentTeam && startedAt && !finished) {
    timerInterval = setInterval(renderTimer, 1000);
  }
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resetLocalTeamState() {
  currentTeam = null;
  currentStage = 1;
  answers = {};
  score = 0;
  finished = false;
  startedAt = null;
  elapsedSeconds = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  localStorage.removeItem(TEAM_STORAGE_KEY);
  teamCard.classList.remove('hidden');
  locationCard.classList.add('hidden');
  quizCard.classList.add('hidden');
  finalCard.classList.add('hidden');
  teamNameInput.value = '';
}

function renderStatus() {
  const totalStages = config.checkpoints.length;
  teamPill.textContent = currentTeam ? `Team: ${currentTeam}` : 'No team yet';
  stagePill.textContent = finished ? 'Stage: Finished' : `Stage: ${currentStage}/${totalStages}`;
  scorePill.textContent = `Score: ${score}/${totalStages * 3}`;
  renderTimer();

  const progressStage = finished ? totalStages : Math.max(currentStage - 1, 0);
  const progressPercent = totalStages ? (progressStage / totalStages) * 100 : 0;
  progressBar.style.width = `${progressPercent}%`;
  progressBar.style.backgroundSize = progressPercent > 0 ? `${10000 / progressPercent}% 100%` : '100% 100%';
  progressLabel.textContent = finished ? `All ${totalStages} stages completed` : `Stage ${currentStage} of ${totalStages}`;

  stageStepsWrap.style.setProperty('--stage-count', totalStages);
  stageStepsWrap.innerHTML = config.checkpoints
    .map((_, index) => `<span class="stage-step" data-index="${index}">${index + 1}</span>`)
    .join('');
  Array.from(stageStepsWrap.querySelectorAll('.stage-step')).forEach((step, index) => {
    step.classList.remove('active', 'done');
    if (finished || index < currentStage - 1) {
      step.classList.add('done');
    }
    if (!finished && index === currentStage - 1) {
      step.classList.add('active');
    }
  });

  if (!currentTeam) {
    statusText.textContent = 'Choose a team name to begin your checkpoint adventure.';
  } else if (finished) {
    statusText.textContent = 'All checkpoints completed. Your final score and time are shown below.';
  } else {
    statusText.textContent = 'You\'ve entered the pursuit! Clear this checkpoint to reveal your next destination.';
  }
}

function renderCheckpointGate() {
  const checkpoint = getCheckpoint(currentStage);
  if (!checkpoint || finished || !currentTeam) {
    locationCard.classList.add('hidden');
    checkpointMediaWrap.innerHTML = '';
    return;
  }

  const isFirstStage = currentStage === 1;
  locationCard.classList.toggle('hidden', isFirstStage);
  if (isFirstStage) {
    checkpointMediaWrap.innerHTML = '';
    return;
  }

  checkpointDescription.textContent = '';
  locationEyebrow.textContent = 'Palace Pursuit';
  locationTitle.textContent = `Checkpoint ${currentStage}`;

  if (checkpoint.imageUrl) {
    checkpointMediaWrap.innerHTML = `
      ${renderCheckpointMedia(checkpoint)}
      ${checkpoint.funFact ? `<p class="checkpoint-funfact">${renderFunFactText(checkpoint.funFact)}</p>` : ''}
    `;
  } else if (checkpoint.funFact) {
    checkpointMediaWrap.innerHTML = `<p class="checkpoint-funfact">${renderFunFactText(checkpoint.funFact)}</p>`;
  } else {
    checkpointMediaWrap.innerHTML = '';
  }

  mapLinkWrap.innerHTML = getMapLinkHtml(checkpoint);
  locationStatus.textContent = 'Check your location to unlock the next 3 questions.';
}

function renderQuestionInput(q) {
  if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
    return `
      <fieldset class="answer-options">
        <legend>Your answer</legend>
        ${q.options.map(option => {
          const checked = answers[q.id] === option ? 'checked' : '';
          return `
            <label class="option-card">
              <input type="radio" name="${escapeHtml(q.id)}" value="${escapeHtml(option)}" required ${checked} />
              <span>${escapeHtml(option)}</span>
            </label>
          `;
        }).join('')}
      </fieldset>
    `;
  }

  return `
    <label>
      Your answer
      <textarea name="${escapeHtml(q.id)}" required>${escapeHtml(answers[q.id] || '')}</textarea>
    </label>
  `;
}

function renderQuestions() {
  const checkpoint = getCheckpoint(currentStage);
  if (!checkpoint || finished || !currentTeam) {
    quizCard.classList.add('hidden');
    return;
  }

  quizCard.classList.remove('hidden');
  quizEyebrow.textContent = 'Palace Pursuit';
  quizTitle.textContent = `Checkpoint ${currentStage}`;
  quizForm.innerHTML = `
    ${checkpoint.imageUrl ? `
      <div class="checkpoint-media-wrap">
        ${renderCheckpointMedia(checkpoint)}
      </div>
      <div class="quiz-map-link">${getMapLinkHtml(checkpoint)}</div>
    ` : ''}
    ${checkpoint.funFact ? `<div class="checkpoint-story"><strong>Fun Fact:</strong><p>${renderFunFactText(checkpoint.funFact)}</p></div>` : ''}
    ${checkpoint.questions.map((q, index) => `
    <div class="question">
      <h3>Question ${index + 1}</h3>
      <p class="question-text">Description ${index + 1}</p>
      ${renderQuestionInput(q)}
    </div>
  `).join('')}
    <button type="submit">Reveal next checkpoint</button>
  `;

  if (currentStage > 1) {
    quizCard.classList.add('hidden');
  }
}

function showFinal() {
  finalCard.classList.remove('hidden');
  finalMessage.textContent = `Congratulations ${currentTeam}! Your final score is ${score} out of ${config.checkpoints.length * 3}. Final time: ${formatElapsedTime(elapsedSeconds)}.`;
}

function getMissingSchemaColumn(error) {
  const match = String(error?.message || '').match(/Could not find the '([^']+)' column/);
  return match ? match[1] : null;
}

async function upsertTeamRecord() {
  elapsedSeconds = getCurrentElapsedSeconds();
  const payload = {
    team_name: currentTeam,
    current_stage: currentStage,
    answers,
    score,
    finished,
    started_at: startedAt,
    elapsed_seconds: elapsedSeconds,
    updated_at: new Date().toISOString()
  };

  const savePayload = { ...payload };
  while (true) {
    const { error } = await db.from('teams').upsert(savePayload, { onConflict: 'team_name' });
    if (!error) return;

    const missingColumn = getMissingSchemaColumn(error);
    if (missingColumn && Object.hasOwn(savePayload, missingColumn)) {
      console.warn(`Retrying save without missing database column: ${missingColumn}`);
      delete savePayload[missingColumn];
      continue;
    }

    console.error(error);
    alert(`Failed to save your progress online: ${error.message}`);
    throw error;
  }
}

async function updateTeamRecord(matchColumn, matchValue, payload) {
  const updatePayload = { ...payload };
  while (true) {
    const { error } = await db.from('teams').update(updatePayload).eq(matchColumn, matchValue);
    if (!error) return null;

    const missingColumn = getMissingSchemaColumn(error);
    if (missingColumn && Object.hasOwn(updatePayload, missingColumn)) {
      console.warn(`Retrying update without missing database column: ${missingColumn}`);
      delete updatePayload[missingColumn];
      continue;
    }

    return error;
  }
}

async function loadExistingTeam(teamName, { createIfMissing = true } = {}) {
  const { data, error } = await db.from('teams').select('*').eq('team_name', teamName).gte('current_stage', 1).maybeSingle();
  if (error) {
    console.error(error);
    alert(`Failed to load team: ${error.message}`);
    return false;
  }
  if (data) {
    currentTeam = data.team_name;
    currentStage = data.current_stage || 1;
    answers = data.answers || {};
    score = data.score || 0;
    finished = !!data.finished;
    startedAt = data.started_at || new Date().toISOString();
    elapsedSeconds = data.elapsed_seconds || 0;
  } else if (createIfMissing) {
    currentTeam = teamName;
    currentStage = 1;
    answers = {};
    score = 0;
    finished = false;
    startedAt = new Date().toISOString();
    elapsedSeconds = 0;
    await upsertTeamRecord();
  } else {
    resetLocalTeamState();
    renderAll();
    return false;
  }
  localStorage.setItem(TEAM_STORAGE_KEY, currentTeam);
  teamCard.classList.add('hidden');
  startTimerTicker();
  renderAll();
  if (finished) showFinal();
  return true;
}

function renderAll() {
  renderStatus();
  renderCheckpointGate();
  renderQuestions();
}

function showUnlockedQuestions(message) {
  locationStatus.textContent = message;
  locationCard.classList.add('hidden');
  quizCard.classList.remove('hidden');
  quizCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function unlockQuestionsByLocation() {
  const checkpoint = getCheckpoint(currentStage);
  if (!checkpoint) return;

  if (!navigator.geolocation) {
    alert('Geolocation is not available on this device/browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude, accuracy } = position.coords;
    const distance = haversineDistanceMeters(latitude, longitude, checkpoint.lat, checkpoint.lng);

    if (distance <= config.unlockRadiusMeters) {
      showUnlockedQuestions(`Unlocked. You are about ${Math.round(distance)} m away (accuracy +/-${Math.round(accuracy)} m).`);
    } else {
      locationStatus.textContent = `Not close enough yet. You are about ${Math.round(distance)} m away (accuracy +/-${Math.round(accuracy)} m).`;
    }
  }, error => {
    locationStatus.textContent = `Location check failed: ${error.message}`;
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  });
}

teamForm.addEventListener('submit', async e => {
  e.preventDefault();
  const teamName = teamNameInput.value.trim();
  if (!teamName) return;
  await loadExistingTeam(teamName, { createIfMissing: true });
});

quizForm.addEventListener('submit', async e => {
  e.preventDefault();
  const checkpoint = getCheckpoint(currentStage);
  const formData = new FormData(quizForm);
  checkpoint.questions.forEach(q => {
    answers[q.id] = String(formData.get(q.id) || '').trim();
  });

  score = calculateScore(answers);

  if (currentStage >= config.checkpoints.length) {
    elapsedSeconds = getCurrentElapsedSeconds();
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  } else {
    currentStage += 1;
  }

  await upsertTeamRecord();
  startTimerTicker();
  renderAll();

  if (finished) {
    showFinal();
    quizCard.classList.add('hidden');
    locationCard.classList.add('hidden');
  } else {
    alert('Answers submitted. The next checkpoint is now visible. Go there and use the location button to unlock the next questions.');
  }
});

checkLocationBtn.addEventListener('click', unlockQuestionsByLocation);

debugUnlockBtn.addEventListener('click', () => {
  if (!currentTeam || finished) return;
  showUnlockedQuestions('Debug unlock active. Moving to the checkpoint questions.');
});

debugResetBtn.addEventListener('click', async () => {
  const teamToReset = currentTeam || localStorage.getItem(TEAM_STORAGE_KEY);
  const originalLabel = debugResetBtn.textContent;
  debugResetBtn.disabled = true;
  debugResetBtn.textContent = 'Resetting...';

  if (teamToReset) {
    const error = await updateTeamRecord('team_name', teamToReset, {
      current_stage: 0,
      answers: {},
      score: 0,
      finished: true,
      elapsed_seconds: 0,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.error(error);
      alert(`Failed to reset team online: ${error.message}`);
      debugResetBtn.disabled = false;
      debugResetBtn.textContent = originalLabel;
      return;
    }
  }

  resetLocalTeamState();
  renderAll();
  debugResetBtn.disabled = false;
  debugResetBtn.textContent = originalLabel;
  teamNameInput.focus();
});

(async function init() {
  const savedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
  if (savedTeam) {
    const restored = await loadExistingTeam(savedTeam, { createIfMissing: false });
    if (!restored) {
      alert('The saved team from this device was not found online. The game may have been reset. Please enter the team name again to start fresh.');
    }
  }
  renderAll();
})();
