/* Questionnaire runner shared by survey/ and daily_reset/.
   runSurvey({ sections, step, sheet }) renders the sections one page at a
   time (types: likert, top3, piped_likert — see shared/surveys.js), saves
   each page's answers to `sheet`, then advances the session flow.
   Expects a page with #stepLabel, #bar, #host, #err and #nextBtn. */

function runSurvey({ sections: SECTIONS, step: STEP, sheet: SHEET }){
  const $ = id => document.getElementById(id);
  const L = Session.lang;
  const T = obj => Session.pick(obj);

  const answers = {};          // sectionId → answers
  let idx = 0;
  let sectionStart = 0;
  const TOTAL = SECTIONS.length;

  function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  /* One item = the statement with its own row of labelled answers under
     it (team doc 10/30: every question shows the labels, no numbers). */
  function likertItem(name, text, scale){
    return `<div class="lk-item" data-name="${esc(name)}"><div class="lk-stmt">${esc(text)}</div>` +
      `<div class="lk-opts" style="grid-template-columns:repeat(${scale.length},1fr)">` +
      scale.map((lab, i) => `<label><input type="radio" name="${esc(name)}" value="${i + 1}"><span>${esc(lab)}</span></label>`).join('') +
      `</div></div>`;
  }

  function render(){
    const sec = SECTIONS[idx];
    sectionStart = performance.now();
    $('stepLabel').textContent = Session.t('step_of', { n: idx + 1, total: TOTAL });
    $('bar').style.width = `${Math.round(100 * idx / TOTAL)}%`;
    $('err').textContent = '';
    $('nextBtn').textContent = Session.t(idx === TOTAL - 1 ? 'finish' : 'next');

    let html = `<section class="block"><h2>${esc(T(sec.title))}</h2><p class="instr">${esc(T(sec.instructions))}</p>`;

    if (sec.type === 'likert'){
      html += `<div class="likert">` +
        sec.items.map(it => likertItem(`${sec.id}_${it.id}`, T(it), sec.scale[L])).join('') + `</div>`;
    }
    else if (sec.type === 'top3'){
      html += `<div class="checks" id="checks">` +
        sec.activities.map(a => `
          <label data-id="${a.id}">
            <input type="checkbox" value="${a.id}">
            <span>${esc(T(a))}</span>
            ${a.other ? `<input type="text" id="otherText" data-i18n-placeholder="other_placeholder" disabled>` : ''}
          </label>`).join('') +
        `</div><div class="count" id="count"></div>`;
    }
    else if (sec.type === 'piped_likert'){
      const chosen = answers.tempting_top3?.chosen || [];
      html += `<div class="piped">` + chosen.map(c => `
        <h3>${esc(Session.t('rating_for', { activity: c.text }))}</h3>
        <div class="likert">` +
          sec.items.map(it => likertItem(`${sec.id}_${c.id}_${it.id}`, T(it), sec.scale[L])).join('') +
        `</div>`).join('') + `</div>`;
    }
    html += `</section>`;
    $('host').innerHTML = html;
    Session.applyI18n($('host'));

    if (sec.type === 'top3') wireTop3();
    // an answered statement stops being marked as missing
    $('host').querySelectorAll('.lk-item').forEach(it => it.addEventListener('change', () => it.classList.remove('missing')));
    window.scrollTo(0, 0);
  }

  function wireTop3(){
    const boxes = [...document.querySelectorAll('#checks input[type=checkbox]')];
    const other = $('otherText');
    const update = () => {
      const n = boxes.filter(b => b.checked).length;
      boxes.forEach(b => {
        const lab = b.closest('label');
        lab.classList.toggle('on', b.checked);
        const dis = !b.checked && n >= 3;
        b.disabled = dis; lab.classList.toggle('disabled', dis);
      });
      const oBox = boxes.find(b => b.value === '11');
      if (other){ other.disabled = !oBox.checked; if (oBox.checked) other.focus(); }
      $('count').textContent = Session.t('chosen_count', { n });
    };
    boxes.forEach(b => b.addEventListener('change', update));
    if (other) other.addEventListener('click', e => e.stopPropagation());
    update();
  }

  /* ---------- validation + collection ---------- */

  function collect(){
    const sec = SECTIONS[idx];
    const rows = [];
    const ms = Math.round(performance.now() - sectionStart);

    if (sec.type === 'likert' || sec.type === 'piped_likert'){
      let missing = false;
      document.querySelectorAll('.lk-item[data-name]').forEach(tr => {
        const name = tr.dataset.name;
        const v = tr.querySelector('input:checked');
        tr.classList.toggle('missing', !v);
        if (!v){ missing = true; return; }
        const row = { section: sec.id, item: name.slice(sec.id.length + 1), value: +v.value, label: sec.scale[L][+v.value - 1], section_ms: ms };
        if (sec.type === 'piped_likert'){
          const [actId, itemId] = row.item.split('_');
          const act = answers.tempting_top3.chosen.find(c => String(c.id) === actId);
          Object.assign(row, { item: itemId, activity_id: +actId, activity: act?.text ?? '' });
        } else {
          const it = sec.items.find(i => String(i.id) === row.item);
          row.item_text = it ? it.en : '';
        }
        rows.push(row);
      });
      if (missing) return null;
      answers[sec.id] = rows;
      return rows;
    }

    if (sec.type === 'top3'){
      const checked = [...document.querySelectorAll('#checks input[type=checkbox]:checked')];
      if (checked.length !== 3) return null;
      const chosen = checked.map((b, rank) => {
        const a = sec.activities.find(x => String(x.id) === b.value);
        const other = a.other ? ($('otherText').value || '').trim() : '';
        return { id: a.id, text: a.other ? (other || T(a)) : T(a), text_en: a.en, other, rank: rank + 1 };
      });
      if (chosen.some(c => c.id === 11 && !c.other)) return null;
      answers[sec.id] = { chosen };
      return chosen.map(c => ({ section: sec.id, item: 'activity', value: c.id, label: c.text_en, other_text: c.other, rank: c.rank, section_ms: ms }));
    }
  }

  $('nextBtn').addEventListener('click', async () => {
    const rows = collect();
    if (!rows){
      $('err').textContent = SECTIONS[idx].type === 'top3' ? Session.t('choose_three') : Session.t('please_answer_all');
      const m = document.querySelector('.lk-item.missing'); if (m) m.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    $('nextBtn').disabled = true;
    await Session.save({ [SHEET]: rows }, STEP);
    if (idx < TOTAL - 1){ idx++; render(); $('nextBtn').disabled = false; }
    else {
      $('bar').style.width = '100%';
      await Session.status(STEP, 'completed');
      await Session.log(STEP + '_complete');
      Session.next(STEP);
    }
  });

  Session.log(STEP + '_start');
  Session.status(STEP, 'not_completed');
  render();
}
