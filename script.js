const amountInput = document.querySelector("#amount");
const form = document.querySelector("#form-sort");
const noRepeatInput = document.querySelector("#no-repeat");
const resultPanel = document.querySelector("#result-panel");
const resultClientLabel = document.querySelector("#result-client-label");
const resultSummary = document.querySelector("#result-summary");
const resultNumbers = document.querySelector("#result-numbers");
const winnerList = document.querySelector("#winner-list");
const winnerSection = document.querySelector("#winner-section");
const statusMessage = document.querySelector("#status-message");
const exportButton = document.querySelector("#btn-export-csv");
const csvInput = document.querySelector("#csv-input");
const clearButton = document.querySelector("#btn-clear-list");
const recordsTableBody = document.querySelector("#records-table-body");
const infoToggle = document.querySelector(".info-toggle");
const heroInfo = document.querySelector("#hero-info");
const toolsToggle = document.querySelector("#btn-tools-toggle");
const toolsPanel = document.querySelector("#tools-panel");

const STORAGE_KEY = "netfacil-sorter-records";
const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-toggle__icon');
let records = loadRecords();
let allClientIds = [];
let availableClientIds = [];
let selectedClientIds = [];
let clientDetailsById = new Map();

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('netfacil-theme', theme);
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☾' : '☀';
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('netfacil-theme');
  const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
  applyTheme(initialTheme);
}

function normalizeHeader(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows.shift().map(normalizeHeader);
  return rows.map((values) =>
    headers.reduce((accumulator, header, index) => {
      accumulator[header] = values[index] ?? "";
      return accumulator;
    }, {})
  );
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function parseResultNumbers(value) {
  return value
    .split(/[|;,•]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getClientIdFromRow(row) {
  const candidate = row.client_id ?? row.clientid ?? row.clientid_ ?? row.id_do_cliente ?? row.id ?? row.cliente_id ?? row.customer_id ?? "";
  return String(candidate ?? "").trim();
}

function getClientNameFromRow(row) {
  const candidate = row.nome_completo ?? row.nome ?? row.full_name ?? row.customer_name ?? row.name ?? row.nome_cliente ?? "";
  return String(candidate ?? "").trim();
}

function getContractIdFromRow(row) {
  const candidate = row.id_contrato ?? row.contrato_id ?? row.contract_id ?? row.contract ?? row.contrato ?? "";
  return String(candidate ?? "").trim();
}

function registerClientDetails(row) {
  const clientId = getClientIdFromRow(row);
  if (!clientId) {
    return;
  }

  clientDetailsById.set(clientId, {
    clientId,
    name: getClientNameFromRow(row),
    contract: getContractIdFromRow(row),
  });
}

function buildClientPool(rows) {
  const uniqueIds = new Set();
  rows.forEach((row) => {
    const clientId = getClientIdFromRow(row);
    if (clientId) {
      uniqueIds.add(clientId);
      registerClientDetails(row);
    }
  });
  return [...uniqueIds];
}

function getClientDisplayLabel(row) {
  const clientId = getClientIdFromRow(row);
  const clientName = getClientNameFromRow(row);
  const contractId = getContractIdFromRow(row);
  const parts = [];

  if (clientId) {
    parts.push(clientId);
  }
  if (clientName) {
    parts.push(clientName);
  }
  if (contractId) {
    parts.push(`Contrato ${contractId}`);
  }

  return parts.join(" • ");
}

function pickClientIds(amount, noRepeat = true) {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error("A quantidade precisa ser um número inteiro maior que zero.");
  }

  const pool = noRepeat ? [...availableClientIds] : [...allClientIds];

  if (!pool.length) {
    throw new Error("Importe uma planilha com IDs de clientes antes de sortear.");
  }

  const drawCount = Math.min(amount, pool.length);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, drawCount);

  selectedClientIds = [...selectedClientIds, ...selected];

  if (noRepeat) {
    availableClientIds = availableClientIds.filter((id) => !selected.includes(id));
  }

  return selected;
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Não foi possível carregar os registros salvos.", error);
    return [];
  }
}

function renderRecords() {
  if (!records.length) {
    recordsTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum registro ainda. Gere um sorteio ou importe um CSV.</td></tr>';
    return;
  }

  recordsTableBody.innerHTML = records
    .map((record) => {
      return `
        <tr>
          <td>${record.amount}</td>
          <td>${record.source}</td>
          <td>${record.result}</td>
        </tr>
      `;
    })
    .join("");
}

function renderWinnerList(clients, focusedClientIds = []) {
  if (!clients.length) {
    winnerSection.classList.add("hidden");
    winnerList.innerHTML = "";
    return;
  }

  const focusedIds = new Set(focusedClientIds.map((id) => String(id)));
  winnerSection.classList.remove("hidden");
  winnerList.innerHTML = clients
    .map((client) => {
      const clientId = String(client.clientId ?? "");
      const name = client.name || client.clientId || "Cliente";
      const contract = client.contract ? `Contrato: ${client.contract}` : "Contrato não informado";
      const isFocused = focusedIds.has(clientId);
      const cardClass = isFocused ? "winner-card is-focused" : "winner-card is-blurred";

      return `
        <article class="${cardClass}">
          <div class="winner-card__badge">🎉</div>
          <div class="winner-card__content">
            <p class="winner-card__label">Você foi premiado</p>
            <h3>${name}</h3>
            <p>${contract}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderResult(record) {
  resultPanel.classList.remove("hidden");
  resultClientLabel.textContent = "Clientes sorteados";
  resultSummary.textContent = `${record.amount} cliente(s) selecionado(s) da planilha • ${record.noRepeat ? "sem repetição" : "permitindo repetição"}`;
  resultNumbers.innerHTML = "";
  winnerList.innerHTML = "";
  resultNumbers.classList.add("is-animating");

  const placeholder = document.createElement("div");
  placeholder.className = "number-item is-loading";
  placeholder.innerHTML = '<span class="spinner"></span>';
  resultNumbers.appendChild(placeholder);

  const revealDelay = 2200;
  const revealStep = 450;

  window.setTimeout(() => {
    resultNumbers.innerHTML = "";
    const winnerClients = record.resultNumbers.map((number) => clientDetailsById.get(number) || { clientId: number, name: number, contract: "" });
    renderWinnerList(winnerClients);
    record.resultNumbers.forEach((number, index) => {
      window.setTimeout(() => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "number-item flip-card";
        card.dataset.clientId = String(number);
        card.setAttribute("aria-label", `Cliente ${number}`);
        card.innerHTML = `
          <span class="flip-card__inner">
            <span class="flip-card__face flip-card__face--front">Cliente</span>
            <span class="flip-card__face flip-card__face--back">${number}</span>
          </span>
        `;
        card.addEventListener("click", () => {
          const isCurrentlyFlipped = card.classList.contains("is-flipped");
          resultNumbers.querySelectorAll(".flip-card").forEach((item) => item.classList.remove("is-flipped"));
          if (!isCurrentlyFlipped) {
            card.classList.add("is-flipped");
          }

          const activeClientIds = Array.from(resultNumbers.querySelectorAll(".flip-card.is-flipped"))
            .map((item) => item.dataset.clientId)
            .filter(Boolean);
          const clientId = number;
          const clientData = clientDetailsById.get(clientId) || { clientId, name: clientId, contract: "" };
          renderWinnerList(winnerClients, activeClientIds);
          if (clientData.clientId && activeClientIds.includes(String(clientData.clientId))) {
            showStatus(`Cliente ${clientData.clientId} em foco.`);
          }
        });
        resultNumbers.appendChild(card);
      }, index * revealStep);
    });
    resultNumbers.classList.remove("is-animating");
  }, revealDelay);
}

function createRecordFromForm() {
  const amount = Number.parseInt(amountInput.value, 10);
  const noRepeat = noRepeatInput?.checked ?? true;
  const resultNumbers = pickClientIds(amount, noRepeat);

  return {
    clientId: resultNumbers.join(", "),
    amount: resultNumbers.length,
    source: "CSV importado",
    noRepeat,
    result: resultNumbers.join(" • "),
    resultNumbers,
  };
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const record = createRecordFromForm();
    records.unshift(record);
    saveRecords();
    renderRecords();
    renderResult(record);
    showStatus(`Sorteio concluído para ${record.clientId}.`);
  } catch (error) {
    showStatus(error.message, true);
  }
});

exportButton.addEventListener("click", () => {
  const headers = ["client_id", "nome_completo", "id_contrato"];
  const csvContent = headers.map(escapeCsvValue).join(",");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "netfacil-modelo.csv";
  anchor.click();
  URL.revokeObjectURL(url);
  showStatus("Modelo CSV exportado. Preencha e importe.");
});

csvInput.addEventListener("change", async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsedRows = parseCsv(text);

    if (!parsedRows.length) {
      throw new Error("O arquivo CSV está vazio.");
    }

    const importedClientIds = buildClientPool(parsedRows);

    if (!importedClientIds.length) {
      throw new Error("Nenhum cliente válido foi encontrado no CSV.");
    }

    const newPoolIds = importedClientIds.filter((id) => !selectedClientIds.includes(id));
    allClientIds = [...new Set([...allClientIds, ...importedClientIds])];
    availableClientIds = [...new Set([...availableClientIds, ...newPoolIds])];
    records = [
      ...importedClientIds.map((clientId) => ({
        clientId,
        amount: 1,
        source: "CSV importado",
        noRepeat: true,
        result: clientId,
        resultNumbers: [clientId],
      })),
      ...records,
    ];
    saveRecords();
    renderRecords();
    showStatus(`${importedClientIds.length} ID(s) carregado(s) da planilha.`);
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    event.target.value = "";
  }
});

clearButton.addEventListener("click", () => {
  records = [];
  allClientIds = [];
  availableClientIds = [];
  selectedClientIds = [];
  saveRecords();
  renderRecords();
  showStatus("Registros removidos.");
});

infoToggle?.addEventListener("click", () => {
  const expanded = infoToggle.getAttribute("aria-expanded") === "true";
  infoToggle.setAttribute("aria-expanded", String(!expanded));
  heroInfo.hidden = expanded;
});

toolsToggle?.addEventListener("click", () => {
  const isOpen = toolsPanel.hidden;
  toolsPanel.hidden = !isOpen;
  toolsToggle.setAttribute("aria-expanded", String(isOpen));
  toolsToggle.classList.toggle("is-active", isOpen);
});

themeToggle?.addEventListener('click', () => {
  const currentTheme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

initTheme();
renderRecords();
showStatus("Pronto para processar um novo lote.");
