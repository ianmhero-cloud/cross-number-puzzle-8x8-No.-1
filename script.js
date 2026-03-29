// ------------------------------
// CLUE DATA (original numeric IDs)
// ------------------------------
const clues = {
  across: {
    1: "A(14D - 102)",
    4: "(18A²)",
    6: "((1A / 3) × 2)",
    8: "((18A / 3) × 4)",
    10: "((14D - 3) / 2)",
    13: "(13D - 12)",
    15: "((16D - 2)²)",
    17: "((19A × (18A - 2)) × 3)",
    18: "(2D / 8)",
    19: "(17D × 3)"
  },
  down: {
    2: "(18A × 8)",
    3: "((2D × 10) + 1)",
    4: "(4A - 9)",
    5: "((4D × 3) - 1)",
    7: "(4A + 11)",
    9: "(2D - 5)",
    11: "(2D / 2)",
    12: "(19A × 21)",
    13: "((16D²) - 38)",
    14: "(1A + 102)",
    16: "A prime number between 12 and 32",
    17: "(8A - 1)"
  }
};

// ------------------------------
// GRID LAYOUT (original)
// ------------------------------
const layout = [
  "111##111",
  "#111#1#1",
  "1#1##1#1",
  "1##11#1#",
  "111##111",
  "#111#1#1",
  "1#1#1111",
  "11#11##1"
];

const puzzle = document.getElementById("puzzle");

// ------------------------------
// CLUE → CELL MAPPING (original)
// ------------------------------
const clueCells = {
  across: {
    1:  [[0,0],[0,1],[0,2]],
    4:  [[0,5],[0,6],[0,7]],
    6:  [[1,1],[1,2],[1,3]],
    8:  [[3,3],[3,4]],
    10: [[4,0],[4,1],[4,2]],
    13: [[4,5],[4,6]],
    15: [[5,1],[5,2],[5,3]],
    17: [[6,4],[6,5],[6,6],[6,7]],
    18: [[7,0],[7,1]],
    19: [[7,3],[7,4]]
  },
  down: {
    2:  [[0,1],[1,1]],
    3:  [[0,2],[1,2],[2,2]],
    4:  [[0,5],[1,5],[2,5]],
    5:  [[0,7],[1,7],[2,7]],
    7:  [[2,0],[3,0],[4,0]],
    9:  [[3,6],[4,6]],
    11: [[4,1],[5,1]],
    12: [[4,2],[5,2],[6,2]],
    13: [[4,5],[5,5],[6,5]],
    14: [[4,7],[5,7],[6,7],[7,7]],
    16: [[6,0],[7,0]],
    17: [[6,4],[7,4]]
  }
};

// ------------------------------
// SOLUTIONS (original)
// ------------------------------
const solutions = {
  across: {
    1:  "999",
    4:  "144",
    6:  "666",
    8:  "16",
    10: "549",
    13: "911",
    15: "841",
    17: "1350",
    18: "12",
    19: "45"
  },
  down: {
    2:  "96",
    3:  "961",
    4:  "135",
    5:  "404",
    7:  "155",
    9:  "91",
    11: "48",
    12: "945",
    13: "923",
    14: "1101",
    16: "31",
    17: "15"
  }
};

// ------------------------------
// STATE
// ------------------------------
let activeDirection = null;
let activeClueNum = null;
let checkMode = false;
const mobileClueBar = document.getElementById("mobile-clue-bar");
const cellToClues = {};

// ------------------------------
// BUILD cellToClues MAP
// ------------------------------
function buildCellToCluesMap() {
  for (const dir of ["across", "down"]) {
    for (const num in clueCells[dir]) {
      clueCells[dir][num].forEach(([r, c]) => {
        const key = `${r},${c}`;
        if (!cellToClues[key]) {
          cellToClues[key] = { across: null, down: null };
        }
        cellToClues[key][dir] = Number(num);
      });
    }
  }
}

// ------------------------------
// RENDER CLUES
// ------------------------------
function renderClues() {
  const acrossList = document.getElementById("across-list");
  const downList = document.getElementById("down-list");

  acrossList.innerHTML = "";
  downList.innerHTML = "";

  for (const num in clues.across) {
    const li = document.createElement("li");
    li.id = `across-${num}`;
    li.innerHTML = `
      <span class="clue-num">${num}.</span>
      <span class="clue-text">${clues.across[num]}</span>
    `;
    li.addEventListener("click", () => setActiveClue("across", Number(num), true));
    acrossList.appendChild(li);
  }

  for (const num in clues.down) {
    const li = document.createElement("li");
    li.id = `down-${num}`;
    li.innerHTML = `
      <span class="clue-num">${num}.</span>
      <span class="clue-text">${clues.down[num]}</span>
    `;
    li.addEventListener("click", () => setActiveClue("down", Number(num), true));
    downList.appendChild(li);
  }
}

// ------------------------------
// CREATE GRID
// ------------------------------
function createGrid() {
  layout.forEach((row, r) => {
    [...row].forEach((cell, c) => {
      const div = document.createElement("div");
      div.classList.add("cell");

      if (cell === "#") {
        div.classList.add("blocked");
      } else {
        const input = document.createElement("input");

        // DIGITS ONLY + MOBILE KEYPAD + HARD OVERWRITE
        input.type = "tel";
        input.inputMode = "numeric";
        input.pattern = "[0-9]*";
        input.maxLength = 1;

        input.addEventListener("input", (e) => {
          const v = e.target.value.replace(/[^0-9]/g, "");
          e.target.value = v.slice(-1);
          if (e.target.value !== "") moveToNextCellInActiveClue(r, c);
        });

        input.addEventListener("focus", (e) => e.target.select());

        input.addEventListener("keydown", (e) => {
          if (e.key >= "0" && e.key <= "9") {
            e.preventDefault();
            e.target.value = e.key;
            moveToNextCellInActiveClue(r, c);
            return;
          }
          if (e.key === "Backspace") {
            e.preventDefault();
            e.target.value = "";
            return;
          }
          handleKeyDown(e, r, c);
        });

        div.addEventListener("click", () => handleCellClick(r, c));
        div.appendChild(input);
      }

      puzzle.appendChild(div);
    });
  });
}

// ------------------------------
// ADD CLUE NUMBERS
// ------------------------------
function addClueNumbers() {
  const cells = document.querySelectorAll("#puzzle .cell");

  const numbering = {
    "0,0": "1", "0,1": "2", "0,2": "3",
    "0,5": "4", "0,7": "5",
    "1,1": "6",
    "2,0": "7",
    "3,3": "8", "3,6": "9",
    "4,0": "10", "4,1": "11", "4,2": "12",
    "4,5": "13", "4,7": "14",
    "5,1": "15",
    "6,0": "16", "6,4": "17",
    "7,0": "18", "7,3": "19"
  };

  Object.keys(numbering).forEach(key => {
    const [r, c] = key.split(",").map(Number);
    const index = r * 8 + c;
    const cell = cells[index];

    if (cell && !cell.classList.contains("blocked")) {
      const num = document.createElement("div");
      num.className = "clue-number";
      num.textContent = numbering[key];
      cell.appendChild(num);
    }
  });
}

// ------------------------------
// ACTIVE CLUE HANDLING
// ------------------------------
function setActiveClue(direction, num, focusFirstCell = false) {
  activeDirection = direction;
  activeClueNum = num;

  clearHighlights();
  highlightActiveClue();

  if (focusFirstCell) {
    const coords = clueCells[direction][num];
    if (coords && coords.length > 0) {
      const [r, c] = coords[0];
      focusCell(r, c);
    }
  }

  updateMobileClueBar();
}

function clearHighlights() {
  document.querySelectorAll("#puzzle .cell")
    .forEach(cell => cell.classList.remove("active-clue-cell", "active-cell"));

  document.querySelectorAll(".clue-list li")
    .forEach(li => li.classList.remove("active-clue"));
}

function highlightActiveClue() {
  if (!activeDirection || !activeClueNum) return;

  const cells = document.querySelectorAll("#puzzle .cell");
  const coords = clueCells[activeDirection][activeClueNum];

  coords.forEach(([r, c]) => {
    const index = r * 8 + c;
    cells[index]?.classList.add("active-clue-cell");
  });

  const li = document.getElementById(`${activeDirection}-${activeClueNum}`);
  li?.classList.add("active-clue");
}

function updateMobileClueBar() {
  if (!activeDirection || !activeClueNum) {
    mobileClueBar.textContent = "";
    return;
  }

  const clueText = clues[activeDirection][activeClueNum];
  const letter = activeDirection === "across" ? "A" : "D";

  mobileClueBar.textContent = `${activeClueNum}${letter}: ${clueText}`;
}

function focusCell(r, c) {
  const index = r * 8 + c;
  const cell = document.querySelectorAll("#puzzle .cell")[index];
  if (!cell || cell.classList.contains("blocked")) return;

  const input = cell.querySelector("input");
  if (input) input.focus();

  clearHighlights();
  highlightActiveClue();
  cell.classList.add("active-cell");
}

// ------------------------------
// CELL CLICK
// ------------------------------
function handleCellClick(r, c) {
  const key = `${r},${c}`;
  const info = cellToClues[key];
  if (!info) return;

  if (info.across) {
    setActiveClue("across", info.across);
  } else if (info.down) {
    setActiveClue("down", info.down);
  }

  focusCell(r, c);
}

// ------------------------------
// KEYBOARD NAVIGATION
// ------------------------------
function handleKeyDown(e, r, c) {
  const key = e.key;

  if (key === "ArrowRight") { e.preventDefault(); moveCursor(r, c, "right"); }
  else if (key === "ArrowLeft") { e.preventDefault(); moveCursor(r, c, "left"); }
  else if (key === "ArrowDown") { e.preventDefault(); moveCursor(r, c, "down"); }
  else if (key === "ArrowUp") { e.preventDefault(); moveCursor(r, c, "up"); }
  else if (key === "Backspace") {
    const index = r * 8 + c;
    const cell = document.querySelectorAll("#puzzle .cell")[index];
    const input = cell.querySelector("input");

    if (input && input.value === "") {
      moveToPreviousCellInActiveClue(r, c);
      e.preventDefault();
    }
  } else if (key === "Enter") {
    e.preventDefault();
    toggleDirectionAtCell(r, c);
  }
}

function moveCursor(r, c, dir) {
  let nr = r, nc = c;
  if (dir === "right") nc++;
  if (dir === "left") nc--;
  if (dir === "down") nr++;
  if (dir === "up") nr--;

  if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return;

  const index = nr * 8 + nc;
  const cell = document.querySelectorAll("#puzzle .cell")[index];
  if (!cell || cell.classList.contains("blocked")) return;

  handleCellClick(nr, nc);
}

function toggleDirectionAtCell(r, c) {
  const key = `${r},${c}`;
  const info = cellToClues[key];
  if (!info) return;

  if (activeDirection === "across" && info.down) {
    setActiveClue("down", info.down);
  } else if (activeDirection === "down" && info.across) {
    setActiveClue("across", info.across);
  } else if (info.across) {
    setActiveClue("across", info.across);
  } else if (info.down) {
    setActiveClue("down", info.down);
  }

  focusCell(r, c);
}

function moveToNextCellInActiveClue(r, c) {
  if (!activeDirection || !activeClueNum) return;
  const coords = clueCells[activeDirection][activeClueNum];
  const idx = coords.findIndex(([rr, cc]) => rr === r && cc === c);
  if (idx >= 0 && idx < coords.length - 1) {
    const [nr, nc] = coords[idx + 1];
    focusCell(nr, nc);
  }
}

function moveToPreviousCellInActiveClue(r, c) {
  if (!activeDirection || !activeClueNum) return;
  const coords = clueCells[activeDirection][activeClueNum];
  const idx = coords.findIndex(([rr, cc]) => rr === r && cc === c);
  if (idx > 0) {
    const [nr, nc] = coords[idx - 1];
    focusCell(nr, nc);
  }
}

// ------------------------------
// VALIDATION
// ------------------------------
function checkPuzzle() {
  const cells = document.querySelectorAll("#puzzle .cell");
  cells.forEach(cell => cell.classList.remove("correct", "incorrect"));

  // Across
  for (const num in clueCells.across) {
    const coords = clueCells.across[num];
    const expected = solutions.across[num];

    coords.forEach(([r, c], i) => {
      const index = r * 8 + c;
      const cell = cells[index];
      if (!cell || cell.classList.contains("blocked")) return;

      const digit = cell.querySelector("input")?.value || "";
      if (digit === "") return;

      if (digit === expected[i]) {
        cell.classList.add("correct");
      } else {
        cell.classList.add("incorrect");
      }
    });
  }

  // Down
  for (const num in clueCells.down) {
    const coords = clueCells.down[num];
    const expected = solutions.down[num];

    coords.forEach(([r, c], i) => {
      const index = r * 8 + c;
      const cell = cells[index];
      if (!cell || cell.classList.contains("blocked")) return;

      const digit = cell.querySelector("input")?.value || "";
      if (digit === "") return;

      if (digit === expected[i]) {
        cell.classList.add("correct");
      } else {
        cell.classList.add("incorrect");
      }
    });
  }
}

function clearAllErrors() {
  document.querySelectorAll("#puzzle .cell")
    .forEach(cell => cell.classList.remove("correct", "incorrect"));
}

// ------------------------------
// CHECK / CLEAR BUTTON
// ------------------------------
document.getElementById("check-btn").addEventListener("click", () => {
  const btn = document.getElementById("check-btn");

  if (!checkMode) {
    checkPuzzle();
    btn.textContent = "Clear";
    checkMode = true;
  } else {
    clearAllErrors();
    btn.textContent = "Check";
    checkMode = false;
  }
});

// ------------------------------
// INITIALISE
// ------------------------------
buildCellToCluesMap();
createGrid();
addClueNumbers();
renderClues();
setActiveClue("across", 1, true);