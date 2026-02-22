const exprEl    = document.getElementById('expr');
const previewEl = document.getElementById('preview');
const sciPanel  = document.getElementById('sciPanel');
const sciToggle = document.getElementById('sciToggle');
const kbdTip    = document.getElementById('kbdTip');

let expr = '0';
let justEvaled = false;

// ── DISPLAY ──────────────────────────────────────────────────────────────────

function setExpr(val) {
    expr = val;
    exprEl.textContent = expr.replace(/\*/g, '×').replace(/\//g, '÷');
    updatePreview();
}

function updatePreview() {
    try {
        const raw    = expr.replace(/×/g, '*').replace(/÷/g, '/');
        const result = Function('"use strict"; return (' + raw + ')')();
        previewEl.textContent = (isFinite(result) && String(result) !== raw) ? '= ' + fmt(result) : '';
    } catch {
        previewEl.textContent = '';
    }
}

function fmt(n) {
    if (Number.isInteger(n)) return String(n);
    const s = parseFloat(n.toPrecision(10)).toString();
    return s.length > 12 ? n.toExponential(5) : s;
}

// ── CORE INPUT ───────────────────────────────────────────────────────────────

const OPS = new Set(['+', '-', '*', '/']);

function input(val) {
    if (justEvaled && val !== '⌫' && val !== 'C' && !OPS.has(val)) {
        expr = '0';
    }
    justEvaled = false;

    switch (val) {
        case 'C':  return setExpr('0');
        case '⌫':  return setExpr(expr.length > 1 ? expr.slice(0, -1) : '0');
        case '=':  return evaluate();
        case '()': return insertBracket();
        case '.':  return insertDot();
        default:
            if (OPS.has(val)) return insertOperator(val);
            setExpr(expr === '0' ? val : expr + val);
    }
}

function evaluate() {
    try {
        const result = Function('"use strict"; return (' + expr + ')')();
        if (!isFinite(result)) throw new Error();
        setExpr(fmt(result));
        justEvaled = true;
    } catch {
        exprEl.textContent = 'Error';
        previewEl.textContent = '';
        setTimeout(() => setExpr('0'), 900);
    }
}

function insertOperator(op) {
    if (expr === '0' && op === '-') { setExpr('-'); return; }

    const last = expr.slice(-1);
    if (OPS.has(last)) {
        setExpr(expr.slice(0, -1) + op);
    } else {
        setExpr(expr + op);
    }
}

function insertBracket() {
    const opens  = (expr.match(/\(/g) || []).length;
    const closes = (expr.match(/\)/g) || []).length;
    const last   = expr.slice(-1);
    const addOpen = opens === closes || OPS.has(last) || last === '(';
    setExpr(expr === '0' ? '(' : expr + (addOpen ? '(' : ')'));
}

function insertDot() {
    const lastNum = expr.split(/[+\-*/()]/).pop();
    if (!lastNum.includes('.')) setExpr(expr + '.');
}

// ── SCIENTIFIC ───────────────────────────────────────────────────────────────

const TO_RAD = Math.PI / 180;

function applyFn(fn) {
    const n = Number(expr);
    const results = {
        sin:  () => Math.sin(n * TO_RAD),
        cos:  () => Math.cos(n * TO_RAD),
        tan:  () => Math.tan(n * TO_RAD),
        log:  () => Math.log10(n),
        ln:   () => Math.log(n),
        sqrt: () => Math.sqrt(n),
        sq:   () => Math.pow(n, 2),
        cb:   () => Math.pow(n, 3),
        inv:  () => 1 / n,
    };

    if (fn === 'pow') { setExpr(expr + '**');         return; }
    if (fn === 'pi')  { setExpr(expr === '0' ? fmt(Math.PI) : expr + fmt(Math.PI)); return; }
    if (fn === 'e')   { setExpr(expr === '0' ? fmt(Math.E)  : expr + fmt(Math.E));  return; }

    if (results[fn]) { setExpr(fmt(results[fn]())); justEvaled = true; }
}

// ── TOOLTIP ──────────────────────────────────────────────────────────────────

let tipTimeout;

function showTip(btn, e) {
    const tip = btn.dataset.tip;
    if (!tip) return;
    kbdTip.textContent = tip;
    kbdTip.classList.add('show');
    moveTip(e);
}

function moveTip(e) {
    const x = e.clientX, y = e.clientY;
    kbdTip.style.left = (x + 14) + 'px';
    kbdTip.style.top  = (y - 32) + 'px';
}

function hideTip() {
    kbdTip.classList.remove('show');
}

// Tooltips only on desktop (not touch devices)
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (!isTouch) {
    document.querySelectorAll('.pad button[data-tip]').forEach(btn => {
        btn.addEventListener('mouseenter', e => showTip(btn, e));
        btn.addEventListener('mousemove',  moveTip);
        btn.addEventListener('mouseleave', hideTip);
    });
}

// ── EVENTS ───────────────────────────────────────────────────────────────────

document.querySelector('.pad').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.id === 'sciToggle') {
        sciPanel.classList.toggle('open');
        sciToggle.classList.toggle('active');
    } else {
        input(btn.dataset.val);
    }
});

sciPanel.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn) applyFn(btn.dataset.fn);
});

document.addEventListener('keydown', e => {
    if ('0123456789.+-*/'.includes(e.key)) { input(e.key); return; }
    const map = { Enter: '=', Backspace: '⌫', Escape: 'C' };
    if (map[e.key]) input(map[e.key]);
    if (e.key === '(' || e.key === ')') input('()');
    if (e.key.toLowerCase() === 'f') {
        sciPanel.classList.toggle('open');
        sciToggle.classList.toggle('active');
    }
});

// ── INIT ─────────────────────────────────────────────────────────────────────
setExpr('0');