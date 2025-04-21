// Login com PIN
document.getElementById("btnLogin").addEventListener("click", () => {
  const pin = document.getElementById("pinInput").value;
  if (pin === "1234") {
    document.getElementById("loginContainer").style.display = "none";
    document.querySelector(".container").style.display = "block";
    atualizarDashboard();
  } else {
    document.getElementById("pinErro").style.display = "block";
  }
});

// Dark Mode
document.getElementById("toggleDarkMode").addEventListener("change", (e) => {
  document.body.classList.toggle("dark-mode", e.target.checked);
});

// Variáveis principais
const form = document.getElementById("pedidoForm");
const containerCards = document.getElementById("containerCards");
const campoBusca = document.getElementById("campoBusca");
const btnAbertos = document.getElementById("btnAbertos");
const btnEntregues = document.getElementById("btnEntregues");
const exportPdf = document.getElementById("exportPdf");
const exportCsv = document.getElementById("exportCsv");
const salvarBackup = document.getElementById("salvarBackup");
const restaurarBackup = document.getElementById("restaurarBackup");
const menuToggle = document.getElementById("menuToggle");
const menuOpcoes = document.getElementById("menuOpcoes");

let pedidoEditandoIndex = null;
let modoAtual = 'abertos';

window.addEventListener("load", () => {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  atualizarCards(pedidos);
  atualizarDashboard();
});

// Adicionar/Editar Pedido
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const pedido = obterDados();
  pedido.valorTotal = (parseFloat(pedido.quantidade) * parseFloat(pedido.valor || 0)).toFixed(2);

  let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];

  if (pedidoEditandoIndex !== null) {
    pedidos[pedidoEditandoIndex] = pedido;
    pedidoEditandoIndex = null;
    exibirMensagem("Pedido editado com sucesso!");
  } else {
    pedidos.push(pedido);
    exibirMensagem("Pedido adicionado com sucesso!");
  }

  localStorage.setItem("pedidos", JSON.stringify(pedidos));
  atualizarCards(pedidos);
  atualizarDashboard();
  form.reset();
  document.getElementById("status").value = "Cobrar";
  document.getElementById("data").focus();
});

// Busca
campoBusca.addEventListener("input", () => {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  atualizarCards(pedidos);
});

// Filtros
btnAbertos.addEventListener("click", () => {
  modoAtual = "abertos";
  btnAbertos.classList.add("ativo");
  btnEntregues.classList.remove("ativo");
  atualizarCards(JSON.parse(localStorage.getItem("pedidos")) || []);
});

btnEntregues.addEventListener("click", () => {
  modoAtual = "entregues";
  btnEntregues.classList.add("ativo");
  btnAbertos.classList.remove("ativo");
  atualizarCards(JSON.parse(localStorage.getItem("pedidos")) || []);
});

// Menu ⋮
menuToggle.addEventListener("click", () => {
  menuOpcoes.style.display = menuOpcoes.style.display === "block" ? "none" : "block";
});
document.addEventListener("click", (e) => {
  if (!menuToggle.contains(e.target) && !menuOpcoes.contains(e.target)) {
    menuOpcoes.style.display = "none";
  }
});

// Dados do formulário
function obterDados() {
  return {
    data: document.getElementById("data").value,
    cliente: document.getElementById("cliente").value,
    telefone: document.getElementById("telefone").value,
    endereco: document.getElementById("endereco").value,
    vendedor: document.getElementById("vendedor").value,
    fornecedor: document.getElementById("fornecedor").value,
    quantidade: document.getElementById("quantidade").value,
    valor: document.getElementById("valor").value,
    pedido: document.getElementById("pedido").value,
    status: document.getElementById("status").value
  };
}

// Atualizar cards
function atualizarCards(pedidos) {
  const busca = campoBusca.value.toLowerCase();
  containerCards.innerHTML = "";

  const filtrados = pedidos.map((p, i) => ({ ...p, id: i }))
    .filter(p => {
      const statusCond = modoAtual === "abertos" ? p.status !== "Entregue" : p.status === "Entregue";
      const buscaCond = p.cliente.toLowerCase().includes(busca) || p.endereco.toLowerCase().includes(busca);
      return statusCond && buscaCond;
    });

  filtrados.forEach(pedido => {
    const card = document.createElement("div");
    const valorTotal = (pedido.quantidade * pedido.valor).toFixed(2);
    const enderecoLink = `https://www.google.com/maps/search/${encodeURIComponent(pedido.endereco)}`;
    const numeroLimpo = pedido.telefone.replace(/\D/g, ''); // remove tudo que não é número
    const whatsapp = `https://wa.me/55${numeroLimpo}`;

    card.className = "card-pedido";
    card.innerHTML = `
      <div class="info"><span>Data:</span> ${pedido.data}</div>
      <div class="info"><span>Cliente:</span> ${pedido.cliente}</div>
      <div class="info"><span>Telefone:</span> <a href="${whatsapp}" target="_blank">${pedido.telefone}</a></div>
      <div class="info"><span>Endereço:</span> <a href="${enderecoLink}" target="_blank">${pedido.endereco}</a></div>
      <div class="info"><span>Quantidade:</span> ${pedido.quantidade} m²</div>
      <div class="info"><span>Valor Total:</span> R$ ${valorTotal}</div>
      <div class="info"><span>Status:</span> ${pedido.status}</div>
      <div class="acoes">
        <button onclick="editarPedidoCard(${pedido.id})">Editar</button>
        <button onclick="removerPedidoCard(${pedido.id})">Excluir</button>
        <button class="btn-whatsapp" onclick="compartilharPedidoPDF(${pedido.id})">WhatsApp</button>
      </div>
    `;
    containerCards.appendChild(card);
  });
}

// Atualizar dashboard
function atualizarDashboard() {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  let total = pedidos.length;
  let entregues = pedidos.filter(p => p.status === "Entregue").length;
  let abertos = total - entregues;
  let totalValor = pedidos.reduce((acc, p) => acc + parseFloat(p.valorTotal || 0), 0);

  document.getElementById("totalPedidos").textContent = total;
  document.getElementById("totalEntregues").textContent = entregues;
  document.getElementById("totalAbertos").textContent = abertos;
  document.getElementById("valorTotalGeral").textContent = "R$ " + totalValor.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

}

// Editar
function editarPedidoCard(index) {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  const pedido = pedidos[index];
  if (!pedido) return exibirMensagem("Erro ao localizar o pedido.");

  document.getElementById("data").value = pedido.data;
  document.getElementById("cliente").value = pedido.cliente;
  document.getElementById("telefone").value = pedido.telefone;
  document.getElementById("endereco").value = pedido.endereco;
  document.getElementById("vendedor").value = pedido.vendedor;
  document.getElementById("fornecedor").value = pedido.fornecedor;
  document.getElementById("quantidade").value = pedido.quantidade;
  document.getElementById("valor").value = pedido.valor;
  document.getElementById("pedido").value = pedido.pedido;
  document.getElementById("status").value = pedido.status;

  pedidoEditandoIndex = index;
  document.getElementById("telaPedidos").style.display = "none";
  document.getElementById("telaHome").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Remover
function removerPedidoCard(index) {
  let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  if (confirm("Deseja realmente remover este pedido?")) {
    pedidos.splice(index, 1);
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
    atualizarCards(pedidos);
    atualizarDashboard();
    exibirMensagem("Pedido removido com sucesso!");
  }
}

// Exportar CSV
exportCsv.addEventListener("click", () => {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  if (pedidos.length === 0) return exibirMensagem("Nenhum pedido para exportar.");
  const csv = [["Data", "Cliente", "Telefone", "Endereço", "Vendedor", "Fornecedor", "Quantidade", "Valor", "Pedido", "Status"]];
  pedidos.forEach(p =>
    csv.push([p.data, p.cliente, p.telefone, p.endereco, p.vendedor, p.fornecedor, p.quantidade, p.valor, p.pedido, p.status])
  );
  const blob = new Blob([csv.map(l => l.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pedidos.csv";
  a.click();
  exibirMensagem("CSV exportado com sucesso!");
});

// Backup
salvarBackup.addEventListener("click", () => {
  const dados = localStorage.getItem("pedidos");
  const blob = new Blob([dados], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_pedidos.json";
  a.click();
  exibirMensagem("Backup salvo!");
});

restaurarBackup.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result);
        localStorage.setItem("pedidos", JSON.stringify(dados));
        atualizarCards(dados);
        atualizarDashboard();
        exibirMensagem("Backup restaurado com sucesso!");
      } catch {
        exibirMensagem("Erro ao restaurar backup.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

// Exportar PDF geral
exportPdf.addEventListener("click", () => {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.setFontSize(18);
  doc.text("Pedidos de Grama - Serra Verde", 150, 15, null, null, "center");

  const headers = [["Data", "Cliente", "Qtd (m²)", "Endereço", "Telefone", "Status", "Valor (R$)"]];
  const body = pedidos.map(p => [p.data, p.cliente, p.quantidade, p.endereco, p.telefone, p.status, p.valor]);

  doc.autoTable({
    startY: 25,
    head: headers,
    body: body,
    styles: { fontSize: 10 },
    theme: "striped"
  });

  doc.save("pedidos.pdf");
  exibirMensagem("PDF exportado com sucesso!");
});

// PDF do pedido individual (WhatsApp)
function compartilharPedidoPDF(index) {
  const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  const pedido = pedidos[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait" });

  const valorTotal = (pedido.quantidade * pedido.valor).toFixed(2);

  doc.setFontSize(16);
  doc.text("Serra Verde Gramas", 105, 15, null, null, 'center');
  doc.setFontSize(11);
  doc.text("Estrada das Fazendas, 95", 105, 22, null, null, 'center');
  doc.text("Poço da Faca, São Francisco de Paula - RS", 105, 28, null, null, 'center');
  doc.text("(54) 9 9922-2025 | serraverdegrama@hotmail.com", 105, 34, null, null, 'center');
  doc.line(10, 38, 200, 38);

  doc.setFontSize(12);
  doc.text(`Cliente: ${pedido.cliente}`, 10, 48);
  doc.text(`Endereço: ${pedido.endereco}`, 10, 55);
  doc.text(`Telefone: ${pedido.telefone}`, 10, 62);
  doc.line(10, 66, 200, 66);

  doc.text("Grama", 10, 74);
  doc.text("Qtd (m²)", 90, 74);
  doc.text("Valor Unit.", 130, 74);
  doc.text("Total", 170, 74);

  doc.text(`${pedido.fornecedor}`, 10, 82);
  doc.text(`${pedido.quantidade}`, 90, 82);
  doc.text(`R$ ${parseFloat(pedido.valor).toFixed(2)}`, 130, 82);
  doc.text(`R$ ${valorTotal}`, 170, 82);

  doc.line(10, 88, 200, 88);
  doc.setFontSize(12);
  doc.text(`Valor Total: R$ ${valorTotal}`, 130, 98);
  doc.text("Forma de Pagamento: PIX CNPJ - 24.651.559/0001-40", 10, 108);
  doc.line(10, 112, 200, 112);

  doc.text("Observações:", 10, 120);
  doc.text(pedido.pedido || "-", 10, 128);

  doc.line(10, 270, 200, 270);
  doc.text("Obrigado pela preferência!", 105, 280, null, null, 'center');

  doc.save(`pedido_${pedido.cliente.replace(/\s+/g, '_')}.pdf`);
  exibirMensagem("PDF do pedido gerado com sucesso!");
}

// Toast
function exibirMensagem(texto) {
  const alerta = document.createElement("div");
  alerta.className = "toast-alert";
  alerta.textContent = texto;
  document.body.appendChild(alerta);
  setTimeout(() => alerta.remove(), 2500);
}

// Formatação da data
document.getElementById("data").addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length >= 3 && v.length <= 4)
    v = v.slice(0, 2) + "/" + v.slice(2);
  else if (v.length > 4)
    v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4, 6);
  e.target.value = v.slice(0, 8);
});
