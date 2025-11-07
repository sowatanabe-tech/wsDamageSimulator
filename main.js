"use strict";

// ====== ユーティリティ ======
const $ = (id) => document.getElementById(id);
const getInt = (id) => {
  const el = $(id);
  if (!el) return 0; // 要素がなければ0（安全に）
  return Math.max(0, Math.floor(Number(el.value || 0)));
};
const clampNonNeg = (n) => Math.max(0, Math.floor(Number(n || 0)));

// フィールド相互更新
function updateMyTriggerAuto(){
  const deckTotal = getInt('myDeckTotal');
  const t1 = getInt('myTrig1');
  const t2 = getInt('myTrig2');
  const t0 = Math.max(0, deckTotal - (t1 + t2));
  $('myTrig0').value = String(t0);

  const sum = t0 + t1 + t2;
  $('myTrigSum').textContent = String(sum);
  $('myDeckTotalEcho').textContent = String(deckTotal);

  const ok = (sum === deckTotal);
  const el1 = $('myTrig1'); const el2 = $('myTrig2'); const elT = $('myDeckTotal');
  if (el1) el1.classList.toggle('is-invalid', !ok);
  if (el2) el2.classList.toggle('is-invalid', !ok);
  if (elT) elT.classList.toggle('is-invalid', !ok);
}

function updateMyWRTriggerAuto(){
  const wrTotal = getInt('myWrTotal');
  const w1 = getInt('myWrTrig1');
  const w2 = getInt('myWrTrig2');
  const w0 = Math.max(0, wrTotal - (w1 + w2));
  $('myWrTrig0').value = String(w0);
  const sum = w0 + w1 + w2;
  $('myWrTrigSum').textContent = String(sum);
  $('myWrTotalEcho').textContent = String(wrTotal);

  const ok = (sum === wrTotal);
  const a = $('myWrTrig1'); const b = $('myWrTrig2'); const c = $('myWrTotal');
  if (a) a.classList.toggle('is-invalid', !ok);
  if (b) b.classList.toggle('is-invalid', !ok);
  if (c) c.classList.toggle('is-invalid', !ok);
}

function updateOpponentSums(){
  const dTot = getInt('oppDeckTotal');
  const dCx = getInt('oppDeckCX');
  const dOthers = Math.max(0, dTot - dCx);
  $('oppDeckOthers').textContent = String(dOthers);
  $('oppDeckSum').textContent = String(dCx + dOthers);

  const wTot = getInt('oppWrTotal');
  const wCx = getInt('oppWrCX');
  const wOthers = Math.max(0, wTot - wCx);
  $('oppWrOthers').textContent = String(wOthers);
  $('oppWrSum').textContent = String(wCx + wOthers);
}

document.addEventListener('input', (e) => {
  if (e.target.matches('#myDeckTotal, #myTrig1, #myTrig2')) updateMyTriggerAuto();
  if (e.target.matches('#myWrTotal, #myWrTrig1, #myWrTrig2')) updateMyWRTriggerAuto();
  if (e.target.matches('#oppDeckTotal, #oppDeckCX, #oppWrTotal, #oppWrCX')) updateOpponentSums();
});

// 初期描画
updateMyTriggerAuto();
updateMyWRTriggerAuto();
updateOpponentSums();

// ====== 攻撃行（種別+値） ======
const attackRows = $('attackRows');

function addAttackRow(kind='attack', value=2) {
  const tr = document.createElement('tr');

  const tdKind = document.createElement('td');
  const sel = document.createElement('select');
  sel.className = 'form-select form-select-sm';
  sel.innerHTML = `
    <option value="attack"${kind==='attack'?' selected':''}>アタック</option>
    <option value="effect"${kind==='effect'?' selected':''}>効果ダメージ</option>`;
  tdKind.appendChild(sel);

  const tdVal = document.createElement('td');
  const inp = document.createElement('input');
  inp.type = 'number'; inp.min = '0';
  inp.value = String(value);
  inp.className = 'form-control form-control-sm';
  tdVal.appendChild(inp);

  const tdDel = document.createElement('td');
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm btn-outline-danger';
  btn.textContent = '削除';
  btn.addEventListener('click', () => tr.remove());
  tdDel.appendChild(btn);

  tr.append(tdKind, tdVal, tdDel);
  attackRows.appendChild(tr);
}

// 初期行
addAttackRow('attack', 2);
addAttackRow('attack', 3);
addAttackRow('effect', 4);
addAttackRow('attack', 3);
addAttackRow('effect', 4);

$('addRow').addEventListener('click', () => addAttackRow());

function readAttacks() {
  const rows = Array.from(attackRows.querySelectorAll('tr'));
  return rows.map(r => {
    const type = r.querySelector('select').value;
    const val = clampNonNeg(r.querySelector('input').value);
    return { type, value: val };
  }).filter(a => a.value > 0);
}

// ====== デッキ/相手状態 ======
class AttackerDeck {
  constructor({ total, t0, t1, t2 }, wr) {
    this.total = clampNonNeg(total);
    this.t0 = clampNonNeg(t0);
    this.t1 = clampNonNeg(t1);
    this.t2 = clampNonNeg(t2);
    this.wr = wr; // { total, t0, t1, t2 }
  }

  refreshFromWR() {
    if (this.wr.total <= 0) return; // 追加カードなし
    this.total += this.wr.total;
    this.t0 += this.wr.t0; this.t1 += this.wr.t1; this.t2 += this.wr.t2;
    this.wr.total = this.wr.t0 = this.wr.t1 = this.wr.t2 = 0;
  }

  drawTriggerPlusSoul() {
    if (this.total <= 0) this.refreshFromWR();

    const pool = this.t0 + this.t1 + this.t2;
    if (this.total <= 0 || pool <= 0) {
      if (this.total > 0) this.total--; // カードは消費
      return 0;
    }
    const r = Math.random() * pool;
    let add = 0;
    if (r < this.t0) { this.t0--; add = 0; }
    else if (r < this.t0 + this.t1) { this.t1--; add = 1; }
    else { this.t2--; add = 2; }
    this.total--; // トリガーで1枚消費
    return add;
  }
}

class DefenderState {
  constructor({deckTotal, deckCX, wrTotal, wrCX, level, clock}) {
    this.deckTotal = clampNonNeg(deckTotal);
    this.deckCX = clampNonNeg(deckCX);
    this.wrTotal = clampNonNeg(wrTotal);
    this.wrCX = clampNonNeg(wrCX);
    this.level = clampNonNeg(level);
    this.clock = clampNonNeg(clock);
    this.refreshCount = 0;
    this.levelUpCount = 0;
    this.refreshPenaltyClock = 0;
  }

  flipOne() {
    if (this.deckTotal <= 0) this.refresh();
    const isCx = Math.random() * this.deckTotal < this.deckCX;
    this.deckTotal--;
    if (isCx) this.deckCX--;
    return { isClimax: isCx };
  }

  refresh() {
    this.deckTotal += this.wrTotal;
    this.deckCX += this.wrCX;
    this.wrTotal = 0; this.wrCX = 0;
    this.refreshCount++;
    this.applyClockDamage(1, true);
    this.refreshPenaltyClock++;
  }

  applyClockDamage(n) {
    this.clock += n;
    while (this.clock >= 7) {
      this.clock -= 7; this.level++; this.levelUpCount++;
      this.wrTotal += 7;
    }
  }

  settleReveals(reveals, canceled) {
    if (canceled) {
      let cxAdd = 0; reveals.forEach(r => { if (r.isClimax) cxAdd++; });
      this.wrTotal += reveals.length; this.wrCX += cxAdd;
    } else {
      this.applyClockDamage(reveals.length);
    }
  }
}

// ====== シミュレーション本体 ======
function loadSettings() {
  // 自分（攻撃側）
  const deckTotal = getInt('myDeckTotal');
  const t1 = getInt('myTrig1');
  const t2 = getInt('myTrig2');
  const t0 = Math.max(0, deckTotal - (t1 + t2));
  const myWrTotal = getInt('myWrTotal');
  const myWr1 = getInt('myWrTrig1');
  const myWr2 = getInt('myWrTrig2');
  const myWr0 = Math.max(0, myWrTotal - (myWr1 + myWr2));

  const myDeck = new AttackerDeck({ total: deckTotal, t0, t1, t2 },
                                  { total: myWrTotal, t0: myWr0, t1: myWr1, t2: myWr2 });

  const attacks = readAttacks();

  // 相手（防御側）
  const opp = new DefenderState({
    deckTotal: getInt('oppDeckTotal'),
    deckCX:    getInt('oppDeckCX'),
    wrTotal:   getInt('oppWrTotal'),
    wrCX:      getInt('oppWrCX'),
    level:     getInt('oppLevel'),
    clock:     getInt('oppClock'),
  });

  return { myDeck, attacks, opp };
}

// 1回分
function simulateOnce() {
  const { myDeck, attacks, opp } = loadSettings();

  const trialLog = [];
  let totalDamageThrough = 0;
  let totalCanceledAttacks = 0;

  attacks.forEach((atk, i) => {
    const idx = i + 1;
    let base = clampNonNeg(atk.value);
    let addSoul = 0;
    let planned = 0;
    let canceledAt = 0;
    let reveals = [];

    if (atk.type === 'attack') {
      addSoul = myDeck.drawTriggerPlusSoul();
      planned = base + addSoul;
    } else {
      addSoul = 0;
      planned = base;
    }

    let canceled = false;
    for (let p = 1; p <= planned; p++) {
      const card = opp.flipOne();
      reveals.push(card);
      if (card.isClimax) { canceled = true; canceledAt = p; break; }
    }

    opp.settleReveals(reveals, canceled);

    const dealt = canceled ? 0 : reveals.length;
    if (dealt > 0) totalDamageThrough += dealt;
    if (canceled) totalCanceledAttacks++;

    trialLog.push({
      attackIndex: idx,
      type: atk.type,
      base,
      addSoul,
      planned,
      canceled,
      canceledAt: canceled ? canceledAt : null,
      revealed: reveals.length,
      oppClockAfter: opp.clock,
      oppLevelAfter: opp.level,
    });
  });

  const result = {
    totalDamageThrough,
    totalCanceledAttacks,
    attackCount: attacks.length,
    oppLevel: opp.level,
    oppClock: opp.clock,
    refreshCount: opp.refreshCount,
    levelUpCount: opp.levelUpCount,
    refreshPenaltyClock: opp.refreshPenaltyClock,
    log: trialLog,
  };

  const lines = [];
  lines.push(`開始: Lv${getInt('oppLevel')} / Clock ${getInt('oppClock')}`);
  for (const r of trialLog) {
    const head = `#${r.attackIndex} ${r.type==='attack'?'アタック':'効果'}`
    const dmgTxt = r.type==='attack'
      ? `ダメージ（ソウル ${r.base} + 追加 ${r.addSoul} = ${r.planned}）`
      : `ダメージ（効果 ${r.planned}）`;
    const cancelTxt = r.canceled
      ? `→ ${r.canceledAt}点目でキャンセル（公開${r.revealed}枚は控室）`
      : `→ 通過 ${r.revealed}点（公開${r.revealed}枚がクロックへ）`;
    const st = ` / 相手: Lv${r.oppLevelAfter} Clock ${r.oppClockAfter}`;
    lines.push(`${head}: ${dmgTxt} ${cancelTxt}${st}`);
  }
  lines.push(`――`);
  lines.push(`合計ダメージ: ${totalDamageThrough}`);
  lines.push(`キャンセル数: ${totalCanceledAttacks} / 攻撃数 ${attacks.length}`);
  lines.push(`レベルアップ回数: ${result.levelUpCount}`);
  lines.push(`リフレ回数: ${result.refreshCount}（ペナルティClock +${result.refreshPenaltyClock}）`);
  $('lastResult').innerHTML = lines.map(s => `<div>${s}</div>`).join('');

  console.log(result);
  return result;
}

// 複数回（詳細CSVも作る）
const manyHistory = { trials: [], csv: '' };

function simulateMany(times = 5000) {
  manyHistory.trials = [];
  let dmgSum = 0, cancelSum = 0, lvlUpSum = 0, refreshSum = 0;

  const cancelDistMap = new Map(); // key: "攻撃iでN点キャンセル" → 回数
  const totalDistMap = new Map();  // key: 総ダメージ → 回数

  const attacks = readAttacks();
  const colHeaders = [
    'trial',
    ...attacks.flatMap((_, i) => [
      `a${i+1}_type`, `a${i+1}_base`, `a${i+1}_addSoul`,
      `a${i+1}_planned`, `a${i+1}_canceled`, `a${i+1}_canceledAt`,
      `a${i+1}_revealed`, `a${i+1}_oppLevelAfter`, `a${i+1}_oppClockAfter`
    ]),
    'totalDamage', 'canceledAttacks', 'finalLevel', 'finalClock',
    'levelUps', 'refreshes', 'refreshPenaltyClock'
  ];

  const csvRows = [colHeaders.join(',')];

  for (let t = 1; t <= times; t++) {
    const r = simulateOnce();

    dmgSum += r.totalDamageThrough;
    cancelSum += r.totalCanceledAttacks;
    lvlUpSum += r.levelUpCount;
    refreshSum += r.refreshCount;

    const keyTotal = String(r.totalDamageThrough);
    totalDistMap.set(keyTotal, (totalDistMap.get(keyTotal) || 0) + 1);

    r.log.forEach((a, idx) => {
      if (a.canceled) {
        const key = `攻撃${idx+1}:${a.canceledAt}点`;
        cancelDistMap.set(key, (cancelDistMap.get(key) || 0) + 1);
      }
    });

    const flat = [t];
    r.log.forEach(a => {
      flat.push(a.type, a.base, a.addSoul, a.planned,
                a.canceled, a.canceledAt ?? '', a.revealed,
                a.oppLevelAfter, a.oppClockAfter);
    });
    flat.push(r.totalDamageThrough, r.totalCanceledAttacks, r.oppLevel, r.oppClock,
              r.levelUpCount, r.refreshCount, r.refreshPenaltyClock);
    csvRows.push(flat.join(','));

    manyHistory.trials.push(r);
  }

  const trialCount = manyHistory.trials.length || 1;
  const attackCount = readAttacks().length || 1;
  $('statTrials').textContent = String(trialCount);
  $('statAvgDmg').textContent = (dmgSum / trialCount).toFixed(3);
  $('statCancelRate').textContent = ((cancelSum / (trialCount * attackCount)) * 100).toFixed(2) + '%';
  $('statAvgLvlUp').textContent = (lvlUpSum / trialCount).toFixed(3);
  $('statAvgRefresh').textContent = (refreshSum / trialCount).toFixed(3);

  const cancelHtml = [...cancelDistMap.entries()]
    .sort((a,b)=>a[0].localeCompare(b[0], 'ja'))
    .map(([k,v]) => `<div>${k}: ${v}</div>`).join('');
  $('cancelDist').innerHTML = cancelHtml || '<div>（データなし）</div>';

  const totalHtml = [...totalDistMap.entries()]
    .sort((a,b)=>Number(a[0])-Number(b[0]))
    .map(([k,v]) => `<div>${k}点: ${v}</div>`).join('');
  $('totalDist').innerHTML = totalHtml || '<div>（データなし）</div>';

  // CSVを改行で連結
  manyHistory.csv = csvRows.join('\n');
}

// ====== ボタン ======
$('runOnce').addEventListener('click', () => simulateOnce());
$('runMany').addEventListener('click', () => simulateMany(5000));

$('exportCSV').addEventListener('click', () => {
  if (!manyHistory.csv) { alert('先に「5000回シミュレーション」を実行してください。'); return; }
  const blob = new Blob([manyHistory.csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ws_damage_details.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

$('reset').addEventListener('click', () => {
  // 自分（初期: 山札30 / トリガー14 → 0は自動で16）
  $('myDeckTotal').value = 30;
  $('myTrig1').value = 8; $('myTrig2').value = 6; updateMyTriggerAuto();
  $('myWrTotal').value = 0; $('myWrTrig1').value = 0; $('myWrTrig2').value = 0; updateMyWRTriggerAuto();

  // 攻撃シーケンス初期化
  addAttackRow('attack', 2);
  addAttackRow('attack', 3);
  addAttackRow('effect', 4);
  addAttackRow('attack', 3);
  addAttackRow('effect', 4);

  // 相手（指定の初期値）
  $('oppDeckTotal').value = 5; $('oppDeckCX').value = 2;
  $('oppWrTotal').value = 20; $('oppWrCX').value = 6; updateOpponentSums();
  $('oppLevel').value = 2; $('oppClock').value = 5;

  // 結果クリア
  $('lastResult').innerHTML = '';
  $('statTrials').textContent = '0';
  $('statAvgDmg').textContent = '-';
  $('statCancelRate').textContent = '-';
  $('statAvgLvlUp').textContent = '-';
  $('statAvgRefresh').textContent = '-';
  $('cancelDist').innerHTML = '';
  $('totalDist').innerHTML = '';
  manyHistory.trials = []; manyHistory.csv = '';
});
