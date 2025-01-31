export class UIManager {
  constructor() {
    this.notasTable = document.getElementById('notasBody');
    this.modal = document.getElementById('modal');
    this.modalContent = document.getElementById('modalContent');
    
    this.initializeTabSystem();
    this.initializeModalEvents();

    // Initialize tabs on construction
    this.switchTab('notas');
  }

  initializeTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.switchTab(button.dataset.tab);
      });
    });
  }

  initializeModalEvents() {
    document.querySelector('.close').addEventListener('click', () => {
      this.closeModal();
    });

    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }

  addNotaToTable(nota) {
    const row = document.createElement('tr');
    
    // Add error class if nota has inconsistencies
    if (nota.hasInconsistencies) {
      row.classList.add('inconsistent-nota');
      const messages = nota.inconsistencyMessages.join('\n');
      row.setAttribute('title', messages);
      this.showErrorMessage('Erro na retenção: Os valores informados não especificam os percentuais parametrizados. Favor revisar e corrigir os valores.\n\nDetalhes:\n' + messages);
    }
  
    const razaoSocial = (nota.tomador?.razaoSocial || '').substring(0, 525);
  
    row.innerHTML = `
      <td class="nota-numero">
        ${nota.numero || ''}
        ${nota.hasInconsistencies ? '<span class="error-icon">⚠️</span>' : ''}
      </td>
      <td class="tomador-info">
        <div class="tomador-data">
          ${razaoSocial}<br>
          ${nota.tomador?.cnpj || ''}
        </div>
      </td>
      <td class="valor-total">${nota.valores?.valorTotal || 'R$ 0,00'}</td>
      <td class="retencoes">
        <table class="retencoes-table">
          <tr><td>IRPJ:</td><td>${nota.retencoes?.irpj || 'R$ 0,00'}</td></tr>
          <tr><td>CSLL:</td><td>${nota.retencoes?.csll || 'R$ 0,00'}</td></tr>
          <tr><td>COFINS:</td><td>${nota.retencoes?.cofins || 'R$ 0,00'}</td></tr>
          <tr><td>PIS:</td><td>${nota.retencoes?.pis || 'R$ 0,00'}</td></tr>
          <tr><td>ISS:</td><td>${nota.valores?.valorIss || 'R$ 0,00'}</td></tr>
        </table>
      </td>
      <td class="acoes">
        <button class="action-btn view" onclick="app.ui.viewNota('${nota.numero}')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
        <button class="action-btn delete" onclick="app.ui.deleteNota('${nota.numero}')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </td>
    `;
    this.notasTable.appendChild(row);
  }

  viewNota(numero) {
    const nota = app.controller.getNota(numero);
    if (!nota) return;

    this.modalContent.innerHTML = this.createModalTabs(nota);
    this.showModal();

    // Initialize modal tabs
    const modalTabs = document.querySelectorAll('.modal-tab');
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchModalTab(tab.dataset.tab);
      });
    });
  }

  createModalTabs(nota) {
    // Ensure tomador.razaoSocial is limited to 525 characters in the modal view
    const razaoSocial = (nota.tomador?.razaoSocial || '').substring(0, 525);
  
    return `
      <div class="modal-tabs">
        <button class="modal-tab active" data-tab="geral">Informações Gerais</button>
        <button class="modal-tab" data-tab="tomador">Dados do Tomador/Serviços</button>
        <button class="modal-tab" data-tab="valores">Valores</button>
        <button class="modal-tab" data-tab="servico">Serviço</button>
        <button class="modal-tab" data-tab="retencoes">Retenções</button>
      </div>

      <div class="modal-tab-content active" id="geral">
        <h3>Informações Gerais</h3>
        <table>
          <tr><th>Número da Nota</th><td>${nota.numero}</td></tr>
          <tr><th>Nota Substituída</th><td>${nota.notaSubstituida || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="modal-tab-content" id="tomador">
        <h3>Dados do Tomador/Serviços</h3>
        <table>
          <tr><th>CNPJ</th><td>${nota.tomador.cnpj || ''}</td></tr>
          <tr><th>Razão Social</th><td>${razaoSocial}</td></tr>
        </table>
      </div>

      <div class="modal-tab-content" id="valores">
        <h3>Valores</h3>
        <table>
          <tr><th>Valor Total</th><td>${nota.valores.valorTotal || ''}</td></tr>
        </table>
      </div>

      <div class="modal-tab-content" id="servico">
        <h3>Descrição do Serviço</h3>
        <table>
          <tr><th>Descrição</th><td>${nota.descricaoServico || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="modal-tab-content" id="retencoes">
        <h3>Retenções de Impostos</h3>
        <table>
          <tr><th>IRPJ</th><td>${nota.retencoes?.irpj || 'R$ 0,00'}</td></tr>
          <tr><th>CSLL</th><td>${nota.retencoes?.csll || 'R$ 0,00'}</td></tr>
          <tr><th>COFINS</th><td>${nota.retencoes?.cofins || 'R$ 0,00'}</td></tr>
          <tr><th>PIS/PASEP</th><td>${nota.retencoes?.pis || 'R$ 0,00'}</td></tr>
          <tr><th>ISS</th><td>${nota.valores?.valorIss || 'R$ 0,00'}</td></tr>
        </table>
      </div>
    `;
  }

  switchModalTab(tabId) {
    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.modal-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    document.querySelector(`.modal-tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }

  deleteNota(numero) {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      app.controller.deleteNota(numero);
      this.refreshTable();
    }
  }

  refreshTable() {
    this.notasTable.innerHTML = '';
    app.controller.getAllNotas().forEach(nota => this.addNotaToTable(nota));
  }

  showModal() {
    this.modal.style.display = 'block';
  }

  closeModal() {
    this.modal.style.display = 'none';
  }

  showSuccessMessage(message) {
    alert(message);
  }

  showErrorMessage(message) {
    alert('Erro: ' + message);
  }
}