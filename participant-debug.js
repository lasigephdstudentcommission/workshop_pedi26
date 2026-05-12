(() => {
  const DEBUG_AUTH_KEY = 'pedipaper_debug_tools_authorized';

  function isAuthorized() {
    return sessionStorage.getItem(DEBUG_AUTH_KEY) === 'true';
  }

  function requireQuizmasterPassword(actionLabel) {
    if (isAuthorized()) return true;

    const expectedPassword = window.APP_CONFIG?.quizmasterPassword;
    if (!expectedPassword) {
      alert('Debug tools are not available: quizmaster password is not configured.');
      return false;
    }

    const password = prompt(`Quizmaster password required to ${actionLabel}.`);
    if (password === null) return false;

    if (password === expectedPassword) {
      sessionStorage.setItem(DEBUG_AUTH_KEY, 'true');
      return true;
    }

    alert('Incorrect quizmaster password.');
    return false;
  }

  function gateDebugClick(event) {
    const button = event.target.closest('#debugUnlockBtn, #debugResetBtn');
    if (!button) return;

    const actionLabel =
      button.id === 'debugUnlockBtn'
        ? 'unlock questions'
        : 'reset this team locally';

    if (!requireQuizmasterPassword(actionLabel)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  function moveDebugButton(button, label, parent) {
    if (!button || !parent || button.closest('.participant-debug-tools')) return;

    const details = document.createElement('details');
    details.className = 'participant-debug-tools';

    const summary = document.createElement('summary');
    summary.textContent = label;

    const actions = document.createElement('div');
    actions.className = 'participant-debug-actions';

    button.parentNode.insertBefore(details, button);
    details.append(summary, actions);
    actions.append(button);
  }

  function setupDiscreteDebugControls() {
    const debugUnlockBtn = document.getElementById('debugUnlockBtn');
    const debugResetBtn = document.getElementById('debugResetBtn');

    moveDebugButton(
      debugUnlockBtn,
      'Organizer tools',
      debugUnlockBtn?.parentElement
    );

    moveDebugButton(
      debugResetBtn,
      'Organizer tools',
      debugResetBtn?.parentElement
    );
  }

  document.addEventListener('click', gateDebugClick, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDiscreteDebugControls);
  } else {
    setupDiscreteDebugControls();
  }
})();
