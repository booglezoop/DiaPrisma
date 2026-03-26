// ─── QUESTION BANK ────────────────────────────────────────────────────────────
//
// Architecture:
//   steps 0–3  → shared (Q1–Q4)
//   step  4    → Q5 branch point (listed yes/no)
//   steps 5–8  → track-specific (pre-market OR on-market)
//   step  9    → Q9 shared fears (multiselect)
//
// Client score: starts at 85, deductions applied, floor at 20.
// Lead score:   additive, capped at 100.
// Sub-questions: inline on same step as parent (unchanged pattern).

// ── Shared questions (Q1–Q4) ─────────────────────────────────────────────────
const sharedQuestions = [
  {
    id: 'location',
    text: 'В кой град се намира имотът?',
    type: 'dropdown',
    scored: false,
    options: [
      'София','Пловдив','Варна','Бургас','Стара Загора',
      'Велико Търново','Плевен','Русе','Благоевград','Друго'
    ]
  },
  {
    id: 'neighborhood',
    text: 'В кой квартал се намира имотът?',
    type: 'text',
    scored: false,
    placeholder: 'напр. Лозенец, Младост 1, Кършияка...'
  },
  {
    id: 'property_type',
    text: 'Какъв е видът на имота?',
    type: 'radio',
    scored: false,
    options: [
      { text: 'Апартамент',          value: 'apartment'  },
      { text: 'Къща',                value: 'house'      },
      { text: 'Търговско помещение', value: 'commercial' },
      { text: 'Парцел',              value: 'land'       },
      { text: 'Гараж / Паркомясто', value: 'garage'     }
    ],
    subQuestion: {
      triggerValue: 'apartment',
      id: 'construction_type',
      text: 'Вид строителство',
      type: 'radio',
      scored: false,
      options: [
        { text: 'Тухла', value: 'brick' },
        { text: 'Панел', value: 'panel' },
        { text: 'ЕПК',   value: 'epk'   }
      ]
    }
  },
  {
    id: 'area',
    text: 'Каква е приблизителната квадратура на имота?',
    type: 'text',
    scored: false,
    placeholder: 'напр. 85 кв.м.'
  }
];

// ── Q5: Branch point ─────────────────────────────────────────────────────────
const branchQuestion = {
  id: 'listed',
  text: 'В момента активно ли продавате имота?',
  type: 'radio',
  scored: false,
  isBranch: true,
  options: [
    { text: 'Да, имотът е активна обява',   value: 'yes' },
    { text: 'Не, все още не съм го пуснал', value: 'no'  }
  ]
};

// ── Pre-market track (Q5a–Q8a) ───────────────────────────────────────────────
const preMarketTrack = [
  {
    id: 'pm_timeline',
    text: 'Кога планирате да пуснете имота?',
    type: 'radio',
    scored: true,
    options: [
      { text: 'До 1 месец',       value: 'within1',   deduction: 0,  leadPoints: 15 },
      { text: '1–3 месеца',       value: 'within3',   deduction: 0,  leadPoints: 15 },
      { text: '3–6 месеца',       value: 'within6',   deduction: 3,  leadPoints: 5  },
      { text: 'Още не съм решил', value: 'undecided', deduction: 5,  leadPoints: 0  }
    ]
  },
  {
    id: 'pm_price_strategy',
    text: 'Как планирате да определите цената?',
    type: 'radio',
    scored: true,
    options: [
      { text: 'Консултация с брокер',      value: 'broker',   deduction: 0,  leadPoints: 0  },
      { text: 'Сравнение с подобни обяви', value: 'market',   deduction: 8,  leadPoints: 5  },
      { text: 'По лична преценка',          value: 'personal', deduction: 15, leadPoints: 20 },
      { text: 'Още не съм мислил',          value: 'none',     deduction: 10, leadPoints: 10 }
    ]
  },
  {
    id: 'pm_docs',
    text: 'Документацията на имота готова ли е за продажба?',
    type: 'radio',
    scored: true,
    options: [
      { text: 'Да, всичко е наред',  value: 'ready',     deduction: 0,  leadPoints: 0  },
      { text: 'Не съм проверявал',   value: 'unchecked', deduction: 12, leadPoints: 15 },
      { text: 'Имам притеснения',    value: 'concerns',  deduction: 12, leadPoints: 15 }
    ]
  },
  {
    id: 'pm_priority',
    text: 'Какво е най-важното за вас при продажбата?',
    type: 'radio',
    scored: false,
    options: [
      { text: 'Максимална цена',          value: 'max_price',  deduction: 0, leadPoints: 0  },
      { text: 'Бърза продажба',           value: 'fast',       deduction: 0, leadPoints: 10 },
      { text: 'Сигурност и без изненади', value: 'security',   deduction: 0, leadPoints: 5  },
      { text: 'Минимален стрес',          value: 'low_stress', deduction: 0, leadPoints: 5  }
    ]
  }
];

// ── On-market track (Q5b–Q8b) ────────────────────────────────────────────────
const onMarketTrack = [
  {
    id: 'om_offers',
    text: 'Колко оферти сте получили?',
    type: 'radio',
    scored: true,
    options: [
      { text: '0 — не съм получил нито една', value: '0',   deduction: 0, leadPoints: 0  },
      { text: '1–3',                           value: '1-3', deduction: 0, leadPoints: 10 },
      { text: '4–10',                          value: '4-10',deduction: 0, leadPoints: 5  },
      { text: '10+',                           value: '10+', deduction: 0, leadPoints: 0  }
    ]
  },
  {
    id: 'om_viewings',
    text: 'Имали ли сте огледи без последваща оферта?',
    type: 'radio',
    scored: true,
    options: [
      { text: 'Не',          value: 'none', deduction: 0,  leadPoints: 0  },
      { text: 'Да, няколко', value: 'some', deduction: 20, leadPoints: 25 },
      { text: 'Да, много',   value: 'many', deduction: 20, leadPoints: 25 }
    ]
  },
  {
    id: 'om_price_basis',
    text: 'Как определихте цената?',
    type: 'radio',
    scored: true,
    options: [
      { text: 'Консултация с брокер',             value: 'broker',   deduction: 0,  leadPoints: 0  },
      { text: 'На база подобни оферти на пазара', value: 'market',   deduction: 8,  leadPoints: 5  },
      { text: 'Препоръка от близък',              value: 'friend',   deduction: 15, leadPoints: 20 },
      { text: 'Лична нужда',                      value: 'personal', deduction: 15, leadPoints: 20 }
    ]
  },
  {
    id: 'om_changes',
    text: 'Правили ли сте промени по обявата от пускането досега?',
    type: 'radio',
    scored: false,
    options: [
      { text: 'Не',                  value: 'none',       deduction: 0, leadPoints: 0  },
      { text: 'Да, снижих цената',   value: 'price_cut',  deduction: 0, leadPoints: 10 },
      { text: 'Да, смених снимките', value: 'new_photos', deduction: 0, leadPoints: 5  },
      { text: 'Да, смених брокера',  value: 'new_broker', deduction: 0, leadPoints: 15 }
    ]
  }
];

// ── Q9: Shared fears (both tracks) ───────────────────────────────────────────
const fearsQuestion = {
  id: 'fears',
  text: 'Кое от следното ви притеснява най-много?',
  type: 'multiselect',
  scored: true,
  maxSelect: 2,
  options: [
    { text: 'Притеснявам се, че ще продам на по-ниска цена от реалната', value: 'undervalue',    leadPoints: 10 },
    { text: 'Не знам дали имотът ми е правилно позициониран',             value: 'positioning',   leadPoints: 5  },
    { text: 'Имам нужда от бърза продажба, но не получавам оферти',       value: 'fast_no_offer', leadPoints: 10 },
    { text: 'Притеснявам се от правни или документални проблеми',         value: 'legal',         leadPoints: 5  },
    { text: 'Не знам дали да се доверя на брокер',                        value: 'trust_broker',  leadPoints: 5  }
  ]
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = {
  currentStep: 0,
  track: null,       // 'pre' | 'on' | null
  answers: {},
  submitted: false
};

// ─── STEP SEQUENCE ────────────────────────────────────────────────────────────
// Returns the ordered question objects for current state.
// Total is always 10 once branched: 4 shared + branch + 4 track + fears.
function getSteps() {
  const trackQs = state.track === 'pre' ? preMarketTrack
                : state.track === 'on'  ? onMarketTrack
                : [];
  return [...sharedQuestions, branchQuestion, ...trackQs, fearsQuestion];
}

const TOTAL_STEPS = 10; // used for progress bar

// ─── SCORING ──────────────────────────────────────────────────────────────────
function computeScores() {
  let deductions = 0;
  let leadRaw    = 0;
  const track    = state.track;

  if (track === 'on') {
    const offers   = state.answers['om_offers'];
    const viewings = state.answers['om_viewings'];
    const price    = state.answers['om_price_basis'];
    const changes  = state.answers['om_changes'];

    // Viewings with no offers → price/presentation problem
    if (viewings && (viewings.value === 'some' || viewings.value === 'many')) {
      deductions += 20;
      leadRaw    += 25;
    }

    // 0 offers AND no viewings → invisible listing (marketing problem)
    if (offers && offers.value === '0' && viewings && viewings.value === 'none') {
      deductions += 25;
      leadRaw    += 35;
    } else if (offers && offers.value === '0') {
      leadRaw += 10; // had some viewings — viewings block already fired
    }

    if (price)   { deductions += price.deduction;   leadRaw += price.leadPoints;   }
    if (changes) { leadRaw += changes.leadPoints; }

  } else if (track === 'pre') {
    const timeline = state.answers['pm_timeline'];
    const priceStr = state.answers['pm_price_strategy'];
    const docs     = state.answers['pm_docs'];
    const priority = state.answers['pm_priority'];

    if (timeline) {
      deductions += timeline.deduction;
      if (timeline.value === 'within1' || timeline.value === 'within3') leadRaw += 15;
    }
    if (priceStr) { deductions += priceStr.deduction; leadRaw += priceStr.leadPoints; }
    if (docs)     { deductions += docs.deduction;     leadRaw += docs.leadPoints;     }
    if (priority) { leadRaw += priority.leadPoints; }
  }

  // Fears — lead quality only
  const fears = state.answers['fears'] || [];
  fears.forEach(fv => {
    const opt = fearsQuestion.options.find(o => o.value === fv);
    if (opt) leadRaw += opt.leadPoints;
    if (fv === 'fast_no_offer') leadRaw += 5; // urgency multiplier
  });

  const clientScore = Math.max(20, Math.min(85, 85 - deductions));
  const leadScore   = Math.min(100, leadRaw);
  return { clientScore, leadScore };
}

// ─── PRIMARY RISK DRIVER ──────────────────────────────────────────────────────
// Priority: 1 market rejection → 2 invisible listing → 3 mispricing
//           → 4 legal/docs risk → 5 strategic unpreparedness
function getPrimaryRisk() {
  const track      = state.track;
  const offers     = state.answers['om_offers'];
  const viewings   = state.answers['om_viewings'];
  const omPrice    = state.answers['om_price_basis'];
  const pmPrice    = state.answers['pm_price_strategy'];
  const docs       = state.answers['pm_docs'];
  const fears      = state.answers['fears'] || [];

  const mispricedValues = ['personal', 'friend', 'none'];

  // Tier 1 — Market rejection
  if (track === 'on' && viewings && (viewings.value === 'some' || viewings.value === 'many')) {
    return {
      title: 'Имотът ви привлича огледи, но не и оферти',
      body:  'Това е класически сигнал за проблем с цената или презентацията — купувачите идват, виждат, и решават, че не си заслужава. Без корекция тази динамика ще продължи.',
      secondary: buildSecondary(1, track, omPrice, pmPrice, docs, fears)
    };
  }

  // Tier 2 — Invisible listing
  if (track === 'on' && offers && offers.value === '0' && viewings && viewings.value === 'none') {
    return {
      title: 'Обявата ви не достига до правилните купувачи',
      body:  'Нулеви огледи означава проблем с позиционирането или маркетинга — имотът не е видим там, където търсят активните купувачи. Това не е проблем на имота, а на стратегията.',
      secondary: buildSecondary(2, track, omPrice, pmPrice, docs, fears)
    };
  }

  // Tier 3 — Mispricing
  const activePriceAnswer = omPrice || pmPrice;
  if (activePriceAnswer && mispricedValues.includes(activePriceAnswer.value)) {
    return {
      title: 'Цената на имота ви носи риск',
      body:  track === 'on'
        ? 'Цена, определена по лична нужда или препоръка, рядко съвпада с пазарната реалност. Прекалено висока — отблъсква купувачи. Прекалено ниска — губите пари.'
        : 'Ценова стратегия, базирана на лична преценка, е втората най-честа причина имоти да стоят месеци без оферта. Пазарната оценка преди пускане е инвестиция, не разход.',
      secondary: buildSecondary(3, track, omPrice, pmPrice, docs, fears)
    };
  }

  // Tier 4 — Documentation risk (pre-market only)
  if (track === 'pre' && docs && docs.value !== 'ready') {
    return {
      title: 'Документацията крие потенциални рискове',
      body:  'Некоректна или непроверена документация може да спре сделка в последния момент — след месеци чакане и разходи. По-лесно и по-евтино е да се провери сега, отколкото след подписан предварителен договор.',
      secondary: buildSecondary(4, track, omPrice, pmPrice, docs, fears)
    };
  }

  // Tier 5 — Strategic unpreparedness
  return {
    title: 'Имотът ви има потенциал — но планът липсва',
    body:  'Продавачите, които влизат на пазара без ясна стратегия, губят средно 8–12% от крайната цена. Добрата новина: преди пускане е точният момент да се поправи това.',
    secondary: buildSecondary(5, track, omPrice, pmPrice, docs, fears)
  };
}

function buildSecondary(skipTier, track, omPrice, pmPrice, docs, fears) {
  const mispricedValues = ['personal', 'friend', 'none'];
  const activePriceAnswer = omPrice || pmPrice;

  if (skipTier !== 3 && activePriceAnswer && mispricedValues.includes(activePriceAnswer.value)) {
    return 'Освен това начинът, по който е определена цената, носи допълнителен риск от неправилно позициониране.';
  }
  if (skipTier !== 4 && track === 'pre' && docs && docs.value !== 'ready') {
    return 'Освен това не сте проверили документацията — това е втората най-честа причина за забавени или пропаднали сделки.';
  }
  if (fears.includes('fast_no_offer')) {
    return 'Отбелязали сте нужда от бърза продажба — това прави навременното действие още по-важно.';
  }
  return null;
}

function getLeadTier(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'nurture';
}

function getClientTier(score) {
  if (score >= 65) return 'Висока готовност';
  if (score >= 45) return 'Средна готовност';
  if (score >= 30) return 'Ниска готовност';
  return 'Нужна е спешна промяна';
}

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────
function render() {
  const root = document.getElementById('quiz-inner');
  root.innerHTML = '';
  const steps = getSteps();
  setTimeout(() => {
    if (state.currentStep < steps.length) renderStep(root, steps);
    else renderResult(root);
  }, 30);
}

function goBack() {
  // If retreating to or past the branch, reset track state
  if (state.currentStep <= 5) {
    state.track = null;
    Object.keys(state.answers).forEach(k => {
      if (k.startsWith('pm_') || k.startsWith('om_')) delete state.answers[k];
    });
  }
  state.currentStep--;
  render();
}

function goToLanding() {
  var qr = document.getElementById('quiz-root');
  var lp = document.getElementById('landing-page');
  qr.style.transition = 'opacity 0.35s ease';
  qr.style.opacity = '0';
  setTimeout(function () {
    qr.style.display = 'none';
    lp.style.display = 'flex';
    lp.style.opacity = '0';
    lp.style.transition = 'opacity 0.35s ease';
    setTimeout(function () { lp.style.opacity = '1'; }, 30);
  }, 350);
}

function renderStep(root, steps) {
  const q        = steps[state.currentStep];
  const progress = (state.currentStep / TOTAL_STEPS) * 100;
  const isLast   = state.currentStep === steps.length - 1;

  const wrap = document.createElement('div');
  wrap.className = 'fade-in';
  wrap.innerHTML = `
    <div class="brand">
      <div class="brand-eyebrow">DOMA Real Estate Bulgaria</div>
      <div class="brand-title">Разберете защо имотът ви не се продава.</div>
      <div class="brand-trust">Безплатна консултация от експерт брокер</div>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" style="width:${progress}%"></div>
    </div>
    <div class="q-counter">
      <span>Въпрос ${state.currentStep + 1} от ${TOTAL_STEPS}</span>
      <span>Остават ~${Math.max(1, TOTAL_STEPS - state.currentStep)} въпроса</span>
    </div>
    <div class="q-text">${q.text}</div>
    <div id="main-area"></div>
    <div id="sub-area"></div>
    <div class="nav-row">
  ${state.currentStep > 0
    ? `<button class="back-btn" id="back-btn">← Назад</button>`
      : `<button class="back-btn" id="back-btn">← Назад</button>`}
  <button class="next-btn" id="next-btn" disabled>
    ${isLast ? 'Вижте резултата →' : 'Следващ въпрос →'}
  </button>
</div>
  `;
  root.appendChild(wrap);

  const mainArea = document.getElementById('main-area');
  const subArea  = document.getElementById('sub-area');
  const nextBtn  = document.getElementById('next-btn');

  renderInput(q, mainArea, nextBtn, () => {
    if (q.isBranch && state.answers['listed']) {
      state.track = state.answers['listed'].value === 'yes' ? 'on' : 'pre';
    }
    if (q.subQuestion) refreshSubQuestion(q, subArea, nextBtn);
  });

  // Restore sub-question if returning to this step
  if (q.subQuestion && state.answers[q.id]) {
    if (q.isBranch && state.answers['listed']) {
      state.track = state.answers['listed'].value === 'yes' ? 'on' : 'pre';
    }
    refreshSubQuestion(q, subArea, nextBtn);
  }

  nextBtn.onclick = () => {
    const inp = mainArea.querySelector('input.field-input');
    if (inp && q.type === 'text') state.answers[q.id] = inp.value.trim();
    state.currentStep++;
    const updatedSteps = getSteps();
    if (state.currentStep >= updatedSteps.length) {
      // Clear root and render result
      root.innerHTML = '';
      renderResult(root);
    } else {
      render();
    }
  };
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.onclick = state.currentStep === 0 ? goToLanding : goBack;
}

// ─── INPUT RENDERER ───────────────────────────────────────────────────────────
function renderInput(q, container, nextBtn, onChange) {
  const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];

  if (q.type === 'dropdown') {
    const sel = document.createElement('select');
    sel.className = 'field-input dropdown-input';
    sel.innerHTML = `<option value="">— Изберете град —</option>` +
      q.options.map(o => `<option value="${o}" ${state.answers[q.id] === o ? 'selected' : ''}>${o}</option>`).join('');
    sel.onchange = () => {
      state.answers[q.id] = sel.value;
      nextBtn.disabled = !sel.value;
      if (onChange) onChange();
    };
    if (state.answers[q.id]) nextBtn.disabled = false;
    container.appendChild(sel);
  }

  else if (q.type === 'text') {
    const inp = document.createElement('input');
    inp.className = 'field-input';
    inp.type = 'text';
    inp.placeholder = q.placeholder || '';
    inp.value = state.answers[q.id] || '';
    inp.oninput = () => { state.answers[q.id] = inp.value.trim(); if (onChange) onChange(); };
    inp.onblur  = () => { state.answers[q.id] = inp.value.trim(); };
    nextBtn.disabled = false;
    container.appendChild(inp);
  }

  else if (q.type === 'radio') {
    const list = document.createElement('div');
    list.className = 'options-list';
    q.options.forEach((o, i) => {
      const btn = document.createElement('button');
      const isSelected = state.answers[q.id] && state.answers[q.id].value === o.value;
      btn.className = 'option-btn' + (isSelected ? ' selected' : '');
      btn.innerHTML = `<span class="option-letter">${letters[i]}</span>${o.text}`;
      btn.onclick = () => {
        state.answers[q.id] = o;
        list.querySelectorAll('.option-btn').forEach((b, bi) => b.classList.toggle('selected', bi === i));
        nextBtn.disabled = false;
        if (onChange) onChange();
      };
      list.appendChild(btn);
    });
    if (state.answers[q.id]) nextBtn.disabled = false;
    container.appendChild(list);
  }

  else if (q.type === 'multiselect') {
    if (!state.answers[q.id]) state.answers[q.id] = [];

    const hint = document.createElement('div');
    hint.className = 'multiselect-hint';
    hint.textContent = `Изберете до ${q.maxSelect || 2} отговора`;
    container.appendChild(hint);

    const list = document.createElement('div');
    list.className = 'options-list';

    q.options.forEach((o, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn' + (state.answers[q.id].includes(o.value) ? ' selected' : '');
      btn.innerHTML = `<span class="option-letter">${letters[i]}</span>${o.text}`;
      btn.onclick = () => {
        const arr = state.answers[q.id];
        const idx = arr.indexOf(o.value);
        if (idx > -1) {
          arr.splice(idx, 1);
          btn.classList.remove('selected');
        } else if (arr.length < (q.maxSelect || 99)) {
          arr.push(o.value);
          btn.classList.add('selected');
        }
        nextBtn.disabled = arr.length === 0;
        if (onChange) onChange();
      };
      list.appendChild(btn);
    });

    container.appendChild(list);
    nextBtn.disabled = state.answers[q.id].length === 0;
  }
}

// ─── SUB-QUESTION (INLINE) ────────────────────────────────────────────────────
function refreshSubQuestion(q, subArea, nextBtn) {
  const sq        = q.subQuestion;
  const answer    = state.answers[q.id];
  const triggered = answer && answer.value === sq.triggerValue;

  subArea.innerHTML = '';

  if (!triggered) {
    delete state.answers[sq.id];
    if (state.answers[q.id]) nextBtn.disabled = false;
    return;
  }

  const subWrap = document.createElement('div');
  subWrap.className = 'sub-question-wrap';

  const subLabel = document.createElement('div');
  subLabel.className = 'sub-q-text';
  subLabel.textContent = sq.text;
  subWrap.appendChild(subLabel);

  const subContainer = document.createElement('div');
  subWrap.appendChild(subContainer);
  subArea.appendChild(subWrap);

  if (sq.scored && !state.answers[sq.id]) nextBtn.disabled = true;
  renderInput(sq, subContainer, nextBtn, () => { nextBtn.disabled = false; });
}

// ─── RESULT SCREEN ────────────────────────────────────────────────────────────
function renderResult(root) {
  root = document.getElementById('quiz-inner');
  root.innerHTML = '';

  const { clientScore, leadScore } = computeScores();
  const risk      = getPrimaryRisk();
  const leadTier  = getLeadTier(leadScore);
  const clientTier = getClientTier(clientScore);

  const ringColor = clientScore >= 65 ? '#4caf82'
                  : clientScore >= 45 ? '#c9a84c'
                  : clientScore >= 30 ? '#e07a2f'
                  : '#C0272D';

  const r = 68, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;

  const wrap = document.createElement('div');
  wrap.className = 'result-wrap fade-in';
  wrap.innerHTML = `
    <div class="score-ring-wrap">
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ringColor}22" stroke-width="8"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ringColor}" stroke-width="8"
          stroke-dasharray="0 ${circ}" stroke-linecap="round" id="score-arc"/>
      </svg>
      <div class="score-number" id="score-num" style="color:${ringColor}">0</div>
    </div>

    <div class="score-label">Готовност за продажба</div>

    <div class="risk-card">
      <div class="risk-card-title">${risk.title}</div>
      <div class="risk-card-body">${risk.body}</div>
      ${risk.secondary ? `<div class="risk-card-secondary">${risk.secondary}</div>` : ''}
    </div>

    <div class="contact-box">
      <div class="contact-box-title">Искате конкретен план за действие?</div>
      <div class="contact-box-sub">Оставете контакт и ще се свържем с вас за безплатна 15-минутна консултация — без ангажимент.</div>
      <div class="field-row">
        <input class="field-input" type="text"  placeholder="Вашето име"         id="inp-name"/>
        <input class="field-input" type="tel" placeholder="Телефон" id="inp-phone" inputmode="numeric" maxlength="15" pattern="[0-9+\\s\\-]{7,15}"/>
        <input class="field-input" type="email" placeholder="Имейл (по желание)" id="inp-email"/>
      </div>
      <button class="submit-btn" id="submit-btn">Получете безплатен план за продажба →</button>
      <div class="thankyou-msg" id="ty-msg" style="display:none">Благодарим! Ще се свържем с вас скоро.</div>
    </div>

    <button class="restart-link" id="restart-btn">Започни отначало</button>
  `;
  root.appendChild(wrap);

  // Animate score ring
  const arcEl = document.getElementById('score-arc');
  const numEl = document.getElementById('score-num');
  let startTs = null;
  (function animate(ts) {
    if (!startTs) startTs = ts;
    const p     = Math.min((ts - startTs) / 1200, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const cur   = Math.round(eased * clientScore);
    numEl.textContent = cur;
    arcEl.setAttribute('stroke-dasharray', `${(cur / 100) * circ} ${circ}`);
    if (p < 1) requestAnimationFrame(animate);
  })(performance.now());

  // Submit
  document.getElementById('submit-btn').onclick = async () => {
    const name  = document.getElementById('inp-name').value.trim();
    const phone = document.getElementById('inp-phone').value.trim();
    const email = document.getElementById('inp-email').value.trim();
    const phoneClean = phone.replace(/[\s\-]/g, '');
    const phoneValid = /^\+?[0-9]{7,15}$/.test(phoneClean);
    if (!name || !phone) { alert('Моля, въведете имe и телефон.'); return; }
    if (!phoneValid) { alert('Моля, въведете валиден телефонен номер.'); return; }
    if (state.submitted) return;
    state.submitted = true;

    const payload = {
      name, phone, email,
      track:              state.track,
      client_score:       clientScore,
      client_tier:        clientTier,
      lead_quality_score: leadScore,
      lead_tier:          leadTier,
      primary_risk:       risk.title,
      location:           state.answers['location'] || '',
      neighborhood:       state.answers['neighborhood'] || '',
      property_type:      state.answers['property_type']?.text || '',
      construction_type:  state.answers['construction_type']?.text || '',
      area:               state.answers['area'] || '',
      listed:             state.answers['listed']?.text || '',
      // Pre-market answers
      pm_timeline:        state.answers['pm_timeline']?.text || '',
      pm_price_strategy:  state.answers['pm_price_strategy']?.text || '',
      pm_docs:            state.answers['pm_docs']?.text || '',
      pm_priority:        state.answers['pm_priority']?.text || '',
      // On-market answers
      om_offers:          state.answers['om_offers']?.text || '',
      om_viewings:        state.answers['om_viewings']?.text || '',
      om_price_basis:     state.answers['om_price_basis']?.text || '',
      om_changes:         state.answers['om_changes']?.text || '',
      // Fears
      fears:              (state.answers['fears'] || []).join(', ')
    };

    try {
      await fetch('https://tkzgggyebjiubqldpywi.supabase.co/rest/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRremdnZ3llYmppdWJxbGRweXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTI2MjIsImV4cCI6MjA4OTkyODYyMn0.N_3InZ1B0AZn9yB54AhIDG1FG9krMpCwaIFt0_2fOkg',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRremdnZ3llYmppdWJxbGRweXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTI2MjIsImV4cCI6MjA4OTkyODYyMn0.N_3InZ1B0AZn9yB54AhIDG1FG9krMpCwaIFt0_2fOkg',
          'Prefer':        'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    } catch(e) { console.warn('Supabase error:', e); }

    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('ty-msg').style.display = 'block';
    ['inp-name','inp-phone','inp-email'].forEach(id => document.getElementById(id).disabled = true);
  };

  // Restart
  document.getElementById('restart-btn').onclick = () => {
    state = { currentStep: 0, track: null, answers: {}, submitted: false };
    render();
  };
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
render();
