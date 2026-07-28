(() => {
  'use strict';

  const STORAGE_KEY = 'genevieveSafeConnectionV1';
  const defaultState = {
    profile: { name: 'Tracey', place: '', phrase: '', lowStim: false },
    checkins: [],
    creamSessions: [],
    touchMenu: {},
    currentStage: 1
  };

  const stages = [
    { title: '1. Safety and self-trust', text: 'Notice body signals, use the stop sequence and rebuild trust in your own no.', step: 'Read your Personal Rights statement once. You do not have to believe every word yet.' },
    { title: '2. Body ownership and care', text: 'Practise chosen body care without forced exposure. Stopping is part of the skill.', step: 'Choose one manageable area, such as one arm or part of one leg.' },
    { title: '3. Consent and boundaries', text: 'Use short boundaries before distress becomes an emergency.', step: 'Practise: “Please move back.”' },
    { title: '4. Communication', text: 'Separate what happened, what it meant, what you need and what you will do.', step: 'Write one four-line message without sending it.' },
    { title: '5. Friendship and social safety', text: 'Control the beginning, depth and ending of interactions.', step: 'Practise ending a neutral conversation politely and deliberately.' },
    { title: '6. Relationship readiness', text: 'Define standards, warning signs and what must move slowly.', step: 'Write one thing you require and one thing you will not accept.' },
    { title: '7. Touch and intimacy planning', text: 'Create a touch menu. Maybe never means yes, and consent can change.', step: 'Review one touch item and choose your answer for today.' }
  ];

  const scripts = [
    'No.',
    'Please move back.',
    'Do not touch me without asking.',
    'I have changed my mind. Stop now.',
    'My brain is overloaded. I need one question at a time.',
    'I want to answer properly, but I need to pause.',
    'I understand you disagree. My answer is still no.',
    'My boundary still stands, even though I am sorry for how I said it.',
    'I am leaving now. I will decide what happens next when I feel safe.'
  ];

  const touchItems = ['Sitting nearby', 'Hand contact', 'Hugging', 'Hair', 'Face', 'Torso', 'Lying beside someone', 'Massage', 'Sexual contact'];
  const touchOptions = ['Yes', 'Maybe', 'Not now', 'No', 'Unsure'];
  const gentleSteps = [
    ['Choose, do not force', 'Notice one body signal and ask, “What might I need?” You do not need to solve it.'],
    ['Use one clear sentence', 'Practise: “Please give me more room.”'],
    ['Keep one promise to yourself', 'Choose one tiny boundary and follow through on it.'],
    ['Stay with the manageable area', 'For body care, arms or legs are enough today. Face and torso are optional.'],
    ['End on purpose', 'End one interaction before you become completely depleted.'],
    ['Notice behaviour, not promises', 'Trust can be based on repeated respectful behaviour over time.'],
    ['Stopping is a skill', 'Say: “This is enough for today.” Then stop.']
  ];

  let state = loadState();
  let creamRuntime = { area: '', pace: 0, supports: [], seconds: 0, interval: null, paused: false, stopped: false, symptoms: [], after: '' };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...structuredClone(defaultState), ...(saved || {}), profile: { ...defaultState.profile, ...(saved?.profile || {}) } };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateUI();
  }

  function nowISO() { return new Date().toISOString(); }
  function localDateString(date = new Date()) { return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function localDateTime(iso) { return new Date(iso).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }); }
  function todayKey() { return new Date().toLocaleDateString('en-CA'); }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function goTo(id) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
    $$('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.go === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'grounding') updateClock();
  }

  function updateProfileUI() {
    $$('[data-user-name]').forEach(el => el.textContent = state.profile.name || 'Tracey');
    $$('[data-today]').forEach(el => el.textContent = localDateString());
    $('#settingName').value = state.profile.name || '';
    $('#settingPlace').value = state.profile.place || '';
    $('#settingPhrase').value = state.profile.phrase || '';
    $('#lowStim').checked = !!state.profile.lowStim;
    document.body.classList.toggle('low-stim', !!state.profile.lowStim);
    if (!$('#currentPlace').value) $('#currentPlace').value = state.profile.place || '';

    const phrase = state.profile.phrase || `My name is ${state.profile.name || 'Tracey'}. Today is ${localDateString()}. I am here, and I am choosing what happens to my body.`;
    $('#anchorPhrase').textContent = phrase;
  }

  function updateTodayState() {
    const today = state.checkins.findLast?.(x => x.day === todayKey()) || [...state.checkins].reverse().find(x => x.day === todayKey());
    const banner = $('#todayState');
    banner.className = 'status-banner';
    if (!today) {
      banner.classList.add('neutral');
      banner.textContent = 'No check-in saved today';
    } else {
      banner.classList.add(today.colour);
      banner.textContent = `${today.colour.toUpperCase()} today · safety ${today.safety}/10`;
    }
  }

  function renderStages() {
    $('#stageList').innerHTML = stages.map((s, i) => `
      <details class="stage-item ${state.currentStage === i + 1 ? 'current' : ''}" ${state.currentStage === i + 1 ? 'open' : ''}>
        <summary>${escapeHTML(s.title)}${state.currentStage === i + 1 ? ' · Current' : ''}</summary>
        <div class="stage-body">
          <p>${escapeHTML(s.text)}</p>
          <strong>One gentle step:</strong><p>${escapeHTML(s.step)}</p>
          <button class="button ghost" data-set-stage="${i + 1}">Make this my current stage</button>
        </div>
      </details>`).join('');
  }

  function renderScripts() {
    $('#scriptList').innerHTML = scripts.map(s => `<div class="script"><p>“${escapeHTML(s)}”</p><button data-copy="${escapeAttr(s)}">Copy</button></div>`).join('');
  }

  function renderTouchMenu() {
    $('#touchMenu').innerHTML = touchItems.map(item => {
      const selected = state.touchMenu[item] || 'Unsure';
      return `<div class="touch-row"><strong>${escapeHTML(item)}</strong><div class="touch-options">${touchOptions.map(o => `<button type="button" class="${selected === o ? 'selected' : ''}" data-touch-item="${escapeAttr(item)}" data-touch-value="${escapeAttr(o)}">${escapeHTML(o)}</button>`).join('')}</div></div>`;
    }).join('');
  }

  function renderProgress() {
    $('#checkinCount').textContent = state.checkins.length;
    $('#creamCount').textContent = state.creamSessions.length;
    $('#stoppedCount').textContent = state.creamSessions.filter(x => x.stopped).length;

    const checkins = [...state.checkins].reverse().slice(0, 8);
    $('#recentCheckins').className = `history-list${checkins.length ? '' : ' empty-state'}`;
    $('#recentCheckins').innerHTML = checkins.length ? checkins.map(x => `<div class="history-item"><p><strong>${x.colour.toUpperCase()}</strong> · Safety ${x.safety}/10</p><p>${escapeHTML(x.need || 'No need recorded')}</p><p class="meta">${localDateTime(x.createdAt)}</p></div>`).join('') : 'No check-ins yet.';

    const cream = [...state.creamSessions].reverse().slice(0, 8);
    $('#recentCream').className = `history-list${cream.length ? '' : ' empty-state'}`;
    $('#recentCream').innerHTML = cream.length ? cream.map(x => `<div class="history-item"><p><strong>${capitalise(x.area)}</strong> · ${x.stopped ? 'Stopped and grounded' : 'Finished enough'}</p><p>${escapeHTML(x.after || 'No after-state recorded')}${x.note ? ` · ${escapeHTML(x.note)}` : ''}</p><p class="meta">${localDateTime(x.createdAt)}</p></div>`).join('') : 'No cream sessions yet.';
  }

  function updateUI() {
    updateProfileUI();
    updateTodayState();
    renderStages();
    renderScripts();
    renderTouchMenu();
    renderProgress();
  }

  function capitalise(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
  function escapeHTML(s = '') { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function escapeAttr(s = '') { return escapeHTML(s); }

  function openStop(reason = '') {
    stopCreamTimer();
    creamRuntime.stopped = true;
    const dialog = $('#stopDialog');
    if (!dialog.open) dialog.showModal();
    if (reason) showToast(`Stopped because: ${reason}`);
  }

  function closeStop() {
    if ($('#stopDialog').open) $('#stopDialog').close();
  }

  function stopCreamTimer() {
    if (creamRuntime.interval) clearInterval(creamRuntime.interval);
    creamRuntime.interval = null;
  }

  function setCreamInstruction() {
    const area = creamRuntime.area;
    const difficult = area === 'face' || area === 'torso';
    $('#creamAreaTitle').textContent = `${capitalise(area)} · ${difficult ? 'high-difficulty area' : 'manageable area'}`;
    $('#creamInstruction').textContent = difficult
      ? `Use only a tiny amount on one small chosen part of your ${area}. Look around between each movement. You do not need to finish the whole area.`
      : `Begin with one small section of your ${area}. Keep noticing the room. Finishing the whole area is optional.`;
  }

  function startCreamTimer() {
    stopCreamTimer();
    if (!creamRuntime.pace) {
      $('#creamTimer').textContent = 'NO TIMER';
      return;
    }
    creamRuntime.seconds = creamRuntime.pace;
    $('#creamTimer').textContent = creamRuntime.seconds;
    creamRuntime.interval = setInterval(() => {
      if (creamRuntime.paused) return;
      creamRuntime.seconds -= 1;
      $('#creamTimer').textContent = creamRuntime.seconds;
      if (creamRuntime.seconds <= 0) {
        stopCreamTimer();
        $('#creamTimer').textContent = 'PAUSE';
        $('#creamInstruction').textContent = 'Hands away. Look around the room. Decide whether this is enough. You do not automatically continue.';
      }
    }, 1000);
  }

  function finishCream(stopped = false) {
    stopCreamTimer();
    creamRuntime.stopped = stopped || creamRuntime.stopped;
    $('#creamSession').classList.add('hidden');
    $('#creamResult').classList.remove('hidden');
    $('#creamResultTitle').textContent = creamRuntime.stopped ? 'You listened and stopped.' : 'Finished enough is enough.';
    $('#creamResultText').textContent = creamRuntime.stopped
      ? 'Stopping when dissociation begins is body protection, not failure.'
      : 'You chose the area, pace and ending. The amount completed is not the measure of success.';
  }

  function updateClock() {
    $('#currentTime').textContent = new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  }

  document.addEventListener('click', async (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { goTo(go.dataset.go); return; }

    const stage = e.target.closest('[data-set-stage]');
    if (stage) { state.currentStage = Number(stage.dataset.setStage); saveState(); showToast('Current stage saved'); return; }

    const copy = e.target.closest('[data-copy]');
    if (copy) {
      try { await navigator.clipboard.writeText(copy.dataset.copy); showToast('Boundary copied'); }
      catch { showToast('Press and hold the words to copy'); }
      return;
    }

    const touch = e.target.closest('[data-touch-item]');
    if (touch) {
      state.touchMenu[touch.dataset.touchItem] = touch.dataset.touchValue;
      saveState();
      showToast(`${touch.dataset.touchItem}: ${touch.dataset.touchValue}`);
      return;
    }

    const after = e.target.closest('[data-after]');
    if (after) {
      creamRuntime.after = after.dataset.after;
      $$('.result-feelings button').forEach(b => b.classList.toggle('selected', b === after));
      return;
    }
  });

  $('#newGentleStep').addEventListener('click', () => {
    const item = gentleSteps[Math.floor(Math.random() * gentleSteps.length)];
    $('#gentleStepTitle').textContent = item[0];
    $('#gentleStepText').textContent = item[1];
  });

  $('#safetyLevel').addEventListener('input', e => $('#safetyOutput').textContent = e.target.value);

  $('#checkinForm').addEventListener('change', () => {
    const form = new FormData($('#checkinForm'));
    const colour = form.get('colour');
    const safety = Number(form.get('safety'));
    const box = $('#checkinSafetyMessage');
    const unsafe = colour === 'red' || safety <= 2;
    box.classList.toggle('hidden', !unsafe);
    if (unsafe) box.innerHTML = 'Exercises stop here. Use immediate safety support: <a href="tel:000">000</a> if in danger, or <a href="tel:+61131114">Lifeline 13 11 14</a>.';
  });

  $('#checkinForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const entry = {
      createdAt: nowISO(), day: todayKey(), colour: f.get('colour'), safety: Number(f.get('safety')),
      body: f.get('body') || '', feeling: f.get('feeling') || '', people: f.get('people') || '', touch: f.get('touch') || '', need: f.get('need') || '', boundary: f.get('boundary') || ''
    };
    state.checkins.push(entry);
    saveState();
    showToast('Check-in saved privately');
    if (entry.colour === 'red' || entry.safety <= 2) openStop('red safety check-in'); else goTo('home');
  });

  $('#prepareCream').addEventListener('click', () => {
    $('#creamIntro').classList.add('hidden');
    $('#creamSetup').classList.remove('hidden');
  });

  $('#creamSetup').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    creamRuntime = {
      area: String(f.get('area')),
      pace: Number(f.get('pace')),
      supports: f.getAll('supports'), seconds: 0, interval: null, paused: false, stopped: false, symptoms: [], after: ''
    };
    $('#creamSetup').classList.add('hidden');
    $('#creamSession').classList.remove('hidden');
    setCreamInstruction();
    startCreamTimer();
  });

  $$('.symptom-grid button').forEach(btn => btn.addEventListener('click', () => {
    const symptom = btn.dataset.symptom;
    if (!creamRuntime.symptoms.includes(symptom)) creamRuntime.symptoms.push(symptom);
    btn.classList.add('selected');
    openStop(symptom);
  }));

  $('#presentButton').addEventListener('click', () => {
    showToast('Present noticed. Choose whether to continue or finish enough.');
    if (creamRuntime.pace && !creamRuntime.interval && creamRuntime.seconds <= 0) startCreamTimer();
  });

  $('#pauseCream').addEventListener('click', e => {
    creamRuntime.paused = !creamRuntime.paused;
    e.currentTarget.textContent = creamRuntime.paused ? 'Resume only if I choose' : 'Pause';
    $('#creamInstruction').textContent = creamRuntime.paused ? 'Paused. Put your hands down and look around. There is no requirement to resume.' : 'Resume with one small movement, then orient to the room again.';
  });

  $('#stopCream').addEventListener('click', () => openStop('you chose stop'));
  $('#finishCream').addEventListener('click', () => finishCream(false));
  $('#quickStopHeader').addEventListener('click', () => openStop('quick stop'));

  $('#goGroundingFromStop').addEventListener('click', () => {
    closeStop();
    if (!$('#creamSession').classList.contains('hidden')) finishCream(true);
    goTo('grounding');
  });
  $('#closeStopDialog').addEventListener('click', () => {
    closeStop();
    if (!$('#creamSession').classList.contains('hidden')) finishCream(true);
  });

  $('#saveCreamResult').addEventListener('click', () => {
    state.creamSessions.push({
      createdAt: nowISO(), area: creamRuntime.area, pace: creamRuntime.pace, supports: creamRuntime.supports,
      stopped: creamRuntime.stopped, symptoms: creamRuntime.symptoms, after: creamRuntime.after || 'not recorded', note: $('#creamNote').value.trim()
    });
    saveState();
    $('#creamResult').classList.add('hidden');
    $('#creamIntro').classList.remove('hidden');
    $('#creamSetup').reset();
    $('#creamChoice').checked = false;
    $('#creamNote').value = '';
    $$('.symptom-grid button, .result-feelings button').forEach(b => b.classList.remove('selected'));
    showToast('Cream session saved privately');
    goTo('progress');
  });

  $('#groundingComplete').addEventListener('click', () => {
    showToast('You oriented to the present');
    goTo('home');
  });
  $('#stillAway').addEventListener('click', () => openStop('still feeling far away'));

  $('#settingsForm').addEventListener('submit', e => {
    e.preventDefault();
    state.profile = {
      name: $('#settingName').value.trim() || 'Tracey',
      place: $('#settingPlace').value.trim(),
      phrase: $('#settingPhrase').value.trim(),
      lowStim: $('#lowStim').checked
    };
    saveState();
    showToast('Settings saved');
  });

  $('#wipeData').addEventListener('click', () => {
    const confirmed = confirm('Delete all check-ins, cream sessions, touch choices and settings from this browser? This cannot be undone unless you exported a backup.');
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);
    saveState();
    showToast('All app data deleted');
    goTo('home');
  });

  $('#exportData').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ exportedAt: nowISO(), app: 'Genevieve Safe Connection', data: state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genevieve-safe-connection-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  $('#printSummary').addEventListener('click', () => window.print());

  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); });
  setInterval(updateClock, 30000);

  updateUI();
  updateClock();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
