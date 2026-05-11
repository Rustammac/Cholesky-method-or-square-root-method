const body = document.body;
const themeBtn = document.getElementById("theme-toggle");
body.classList.add("light");
themeBtn.addEventListener("click", () => {
  if (body.classList.contains("light")) {
    body.classList.replace("light", "dark");
    themeBtn.textContent = "☀️";
  } else {
    body.classList.replace("dark", "light");
    themeBtn.textContent = "🌙";
  }
});

// Элементы управления
const sizeInput = document.getElementById("size-input");
const createBtn = document.getElementById("create-btn");
const fillExampleBtn = document.getElementById("fill-example-btn");
const matrixArea = document.getElementById("matrix-area");
const vectorArea = document.getElementById("vector-area");
const solveBtn = document.getElementById("solve-btn");
const resetBtn = document.getElementById("reset-btn");
const resultDiv = document.getElementById("result");

let currentN = parseInt(sizeInput.value, 10) || 4;

// --- Функции для построения сетки ввода ---
function createGrid(n) {
  currentN = n;
  matrixArea.innerHTML = "";
  vectorArea.innerHTML = "";
  resultDiv.innerHTML = "";

  // настраиваем grid-template-columns через inline style
  matrixArea.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  matrixArea.style.width = `${Math.min(720, 80 * n)}px`; // ограничение ширины
  matrixArea.style.gridAutoRows = "48px";

  // создаём n*n input'ов
  for (let i = 0; i < n * n; i++) {
    const inp = document.createElement("input");
    inp.className = "cell-input matrix-cell";
    inp.type = "text";
    inp.value = "0";
    inp.dataset.index = i;
    matrixArea.appendChild(inp);
  }

  // divider height
  const dv = document.querySelector(".divider-vertical");
  if (dv) dv.style.height = `${Math.max(48 * n, 120)}px`;

  // создаём вектор ввода
  vectorArea.style.gridAutoRows = "48px";
  for (let i = 0; i < n; i++) {
    const vinp = document.createElement("input");
    vinp.className = "cell-input vector-cell";
    vinp.type = "text";
    vinp.value = "0";
    vinp.dataset.row = i;
    vectorArea.appendChild(vinp);
  }
}

// Вспомогательные: чтение матрицы и вектора
function readMatrixAndVector() {
  const matrixInputs = document.querySelectorAll(".matrix-cell");
  const vectorInputs = document.querySelectorAll(".vector-cell");

  const n = currentN;
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  const b = Array.from({ length: n }, () => 0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const idx = i * n + j;
      const raw = matrixInputs[idx].value.trim();
      const val = parseFloat(raw);
      if (Number.isNaN(val))
        throw new Error(`Неверный ввод в A[${i}][${j}]: "${raw}"`);
      A[i][j] = val;
    }
    const rawb = vectorInputs[i].value.trim();
    const bv = parseFloat(rawb);
    if (Number.isNaN(bv)) throw new Error(`Неверный ввод в b[${i}]: "${rawb}"`);
    b[i] = bv;
  }
  return { A, b };
}

// Проверка на симметрию
function isSymmetric(A, eps = 1e-9) {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j] - A[j][i]) > eps) return false;
    }
  }
  return true;
}

// Холецкий: возвращает { L, steps }
function choleskyDecomposition(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  let steps = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
        steps += 1;
      }
      if (i === j) {
        const val = A[i][i] - sum;
        if (val <= 0) throw new Error("Матрица не положительно определённая");
        L[i][j] = Math.sqrt(val);
        steps += 1; // sqrt
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j];
        steps += 1; // деление
      }
    }
  }
  return { L, steps };
}

// Форматирование матрицы для вывода
function formatMatrix(M) {
  if (!M) return "";
  return (
    '<div style="display:inline-block; text-align:left; padding:8px; margin:6px; border-radius:8px; background:rgba(255,255,255,0.06)">' +
    M.map((row) =>
      row
        .map((v) => (Number.isFinite(v) ? v.toFixed(6) : String(v)))
        .join("   ")
    ).join("<br>") +
    "</div>"
  );
}

// --- Кнопки: Создать, Пример, Решить, Сброс ---
createBtn.addEventListener("click", () => {
  const n = parseInt(sizeInput.value, 10);
  if (!Number.isInteger(n) || n < 2 || n > 200) {
    alert("Введите корректный размер n (2 ≤ n ≤ 200)");
    return;
  }
  createGrid(n);
});

// SPD
fillExampleBtn.addEventListener("click", () => {
  const n = currentN;
  const M = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Math.round(Math.random() * 10 - 5))
  );
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += M[k][i] * M[k][j];
      A[i][j] = s;
    }
  }
  for (let i = 0; i < n; i++) A[i][i] += n;

  const matrixInputs = document.querySelectorAll(".matrix-cell");
  const vectorInputs = document.querySelectorAll(".vector-cell");
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrixInputs[i * n + j].value = A[i][j].toString();
    }
    let sum = 0;
    for (let j = 0; j < n; j++) sum += A[i][j] * 1;
    vectorInputs[i].value = sum.toString();
  }
  resultDiv.innerHTML = "Заполнен пример: A = MᵀM + nI, b = A·(1,...,1)ᵀ";
});

// Сброc
resetBtn.addEventListener("click", () => {
  document.querySelectorAll(".matrix-cell").forEach((inp) => (inp.value = "0"));
  document.querySelectorAll(".vector-cell").forEach((inp) => (inp.value = "0"));
  resultDiv.innerHTML = "";
});

// --- Вспомогательные функции для оценки точности ---
function computeResidual(A, xArray, bArray) {
  // xArray — плоский массив чисел
  // bArray — плоский массив чисел
  // используем math.js: Ax, r = Ax - b, residual = norm(r)
  const Ax = math.multiply(A, xArray); // вектор
  const r = math.subtract(Ax, bArray);
  const residual = math.norm(r); // евклидова норма по умолчанию
  return { Ax, r, residual };
}

// Решить: собираем данные и решаем систему (с выводом невязки и времени)
solveBtn.addEventListener("click", () => {
  try {
    const { A, b } = readMatrixAndVector();
    const n = A.length;
    resultDiv.innerHTML = "Вычисление...";
    const t0 = performance.now();

    // если симметрична, пробуем Холецкого
    if (isSymmetric(A)) {
      try {
        const { L, steps } = choleskyDecomposition(A);
        // преобразуем b в столбец для mathjs
        const bcol = b.map((v) => [v]);
        const y = math.lusolve(L, bcol);
        const LT = math.transpose(L);
        const xcol = math.lusolve(LT, y);
        // преобразуем к плоскому массиву
        const x = xcol.map((r) => r[0]);

        // вычисляем невязку и время
        const { residual } = computeResidual(A, x, b);
        const t1 = performance.now();

        resultDiv.innerHTML =
          `<strong>Решение (использован Холецкий):</strong><br>` +
          `<div style="margin-top:8px">${formatMatrix(L)}</div>` +
          `<div style="margin-top:8px"><strong>x =</strong> ${x
            .map((v) => v.toFixed(6))
            .join(", ")}</div>` +
          `<div style="margin-top:8px"><strong>Невязка (||Ax - b||):</strong> ${residual.toExponential(
            6
          )}</div>` +
          `<div style="margin-top:6px"><strong>Шаги (оценка операций):</strong> ${steps}</div>` +
          `<div style="margin-top:6px"><strong>Время выполнения:</strong> ${(
            t1 - t0
          ).toFixed(3)} ms</div>`;
        return;
      } catch (err) {
        // Холецкий не сработал (не PD)
        console.warn("Cholesky failed:", err);
      }
    }

    // fallback: пробуем math.lusolve для общей матрицы (LU)
    const bcol = b.map((v) => [v]);
    try {
      const sol = math.lusolve(A, bcol); // может бросить ошибку
      const x = sol.map((r) => r[0]);

      // вычисляем невязку и время
      const { residual } = computeResidual(A, x, b);
      const t1 = performance.now();

      resultDiv.innerHTML =
        `<strong>Решение (использован LU):</strong><br>` +
        `<div style="margin-top:8px"><strong>x =</strong> ${x
          .map((v) => v.toFixed(6))
          .join(", ")}</div>` +
        `<div style="margin-top:8px"><strong>Невязка (||Ax - b||):</strong> ${residual.toExponential(
          6
        )}</div>` +
        `<div style="margin-top:6px"><strong>Время выполнения:</strong> ${(
          t1 - t0
        ).toFixed(3)} ms</div>`;
      return;
    } catch (err) {
      console.error("lusolve failed", err);
      resultDiv.innerHTML = "";
      alert(
        "Не удалось решить систему: матрица может быть вырожденной или неподходящей для алгоритма."
      );
    }
  } catch (err) {
    alert("Ошибка чтения: " + err.message);
    resultDiv.innerHTML = "";
  }
});

createGrid(currentN);
