document.addEventListener('DOMContentLoaded', () => {
  const N = 4;
  let board, score, best, prev, prevScore, won;

  const COLORS = {
    2: { bg: '#2c2c48', fg: '#b8b4d8', fs: 38 },
    4: { bg: '#3a3860', fg: '#ccc8f0', fs: 38 },
    8: { bg: '#7a3c18', fg: '#ffd0a0', fs: 38 },
    16: { bg: '#9e3c0e', fg: '#ffd8a8', fs: 38 },
    32: { bg: '#b4320c', fg: '#ffe0b0', fs: 34 },
    64: { bg: '#c0280a', fg: '#ffe8c0', fs: 34 },
    128: { bg: '#b87a0c', fg: '#fff0c0', fs: 28 },
    256: { bg: '#c08c0e', fg: '#fff4c0', fs: 28 },
    512: { bg: '#c89e10', fg: '#fffad0', fs: 24 },
    1024: { bg: '#d0b010', fg: '#fffce0', fs: 20 },
    2048: { bg: '#e8c200', fg: '#0f0f14', fs: 20 },
  };

  function $(id) {
    return document.getElementById(id);
  }

  function buildGrid() {
    const g = $('grid');
    g.innerHTML = '';
    for (let i = 0; i < N * N; i++) {
      const d = document.createElement('div');
      d.className = 'cell';
      g.appendChild(d);
    }
  }

  function cellSize() {
    return $('grid').children[0].offsetWidth;
  }

  function render(newPos = [], mergedPos = []) {
    const layer = $('tiles');
    const cs = cellSize();
    const gap = 10;
    layer.innerHTML = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = board[r][c];
        if (!v) continue;
        const t = document.createElement('div');
        t.className = 'tile';
        const isNew = newPos.some((p) => p[0] === r && p[1] === c);
        const isMerged = mergedPos.some((p) => p[0] === r && p[1] === c);
        if (isMerged) t.className = 'tile merged';
        else if (isNew) t.className = 'tile new';
        t.style.width = cs + 'px';
        t.style.height = cs + 'px';
        t.style.left = c * (cs + gap) + 'px';
        t.style.top = r * (cs + gap) + 'px';
        const cfg = COLORS[v] || { bg: '#e8c200', fg: '#0f0f14', fs: 18 };
        t.style.background = cfg.bg;
        t.style.color = cfg.fg;
        t.style.fontSize = cfg.fs + 'px';
        t.textContent = v;
        layer.appendChild(t);
      }
    }
  }

  function updateScore() {
    const el = $('score');
    el.textContent = score;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 200);
    if (score > best) {
      best = score;
      localStorage.setItem('2048b', best);
      $('best').textContent = best;
    }
  }

  function addTile() {
    const empties = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!board[r][c]) empties.push([r, c]);
    if (!empties.length) return null;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return [r, c];
  }

  function slide(row) {
    let arr = row.filter((x) => x);
    const merged = [];
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        arr.splice(i + 1, 1);
        merged.push(i);
      }
    }
    while (arr.length < N) arr.push(0);
    return { arr, merged };
  }

  function move(dir) {
    if (won) return;
    const old = board.map((r) => [...r]);
    const oldScore = score;
    const mergedCells = [];

    for (let i = 0; i < N; i++) {
      let row, positions;
      if (dir === 'left') {
        row = board[i];
        positions = Array.from({ length: N }, (_, c) => [i, c]);
      } else if (dir === 'right') {
        row = [...board[i]].reverse();
        positions = Array.from({ length: N }, (_, c) => [i, N - 1 - c]);
      } else if (dir === 'up') {
        row = board.map((r) => r[i]);
        positions = Array.from({ length: N }, (_, r) => [r, i]);
      } else {
        row = board.map((r) => r[i]).reverse();
        positions = Array.from({ length: N }, (_, r) => [N - 1 - r, i]);
      }
      const { arr, merged } = slide(row);
      merged.forEach((mi) => mergedCells.push(positions[mi]));
      arr.forEach((v, k) => {
        const [r, c] = positions[k];
        board[r][c] = v;
      });
    }

    const moved = board.some((row, r) => row.some((v, c) => v !== old[r][c]));
    if (!moved) return;

    prev = old;
    prevScore = oldScore;
    const newCell = addTile();
    updateScore();
    render(newCell ? [newCell] : [], mergedCells);

    if (board.some((r) => r.includes(2048)) && !won) {
      won = true;
      showOverlay('You Win!', 'Keep Going', () => {
        won = false;
        hideOverlay();
      });
      return;
    }
    if (!canMove()) {
      showOverlay('Game Over', 'Try Again', newGame);
    }
  }

  function canMove() {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (!board[r][c]) return true;
        if (c < N - 1 && board[r][c] === board[r][c + 1]) return true;
        if (r < N - 1 && board[r][c] === board[r + 1][c]) return true;
      }
    return false;
  }

  function showOverlay(title, btnLabel, action) {
    $('ov-title').textContent = title;
    $('ov-sub').textContent = 'Score: ' + score;
    const btn = $('ov-btn');
    btn.textContent = btnLabel;
    btn.onclick = action;
    $('overlay').classList.add('on');
  }

  function hideOverlay() {
    $('overlay').classList.remove('on');
  }

  function newGame() {
    board = Array.from({ length: N }, () => Array(N).fill(0));
    score = 0;
    prev = null;
    prevScore = 0;
    won = false;
    hideOverlay();
    addTile();
    addTile();
    render();
    updateScore();
    $('score').textContent = '0';
  }

  function undo() {
    if (!prev) return;
    board = prev.map((r) => [...r]);
    score = prevScore;
    prev = null;
    $('score').textContent = score;
    render();
  }

  // Touch
  let tx, ty;
  const game = document.querySelector('.game');
  game.addEventListener(
    'touchstart',
    (e) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      e.preventDefault();
    },
    { passive: false },
  );
  game.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
      e.preventDefault();
    },
    { passive: false },
  );

  // Keyboard
  document.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) {
      e.preventDefault();
      move(map[e.key]);
    }
  });

  // Init
  best = parseInt(localStorage.getItem('2048b') || '0');
  $('best').textContent = best;
  buildGrid();
  newGame();
  window.addEventListener('resize', () => render());
});
