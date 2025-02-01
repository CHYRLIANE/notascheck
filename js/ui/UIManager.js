export class UIManager {
  constructor() {
    this.notasTable = document.getElementById('notasBody');
    this.modal = document.getElementById('modal');
    this.modalContent = document.getElementById('modalContent');
    
    this.initializeTabSystem();
    this.initializeModalEvents();
    this.selectedNotas = new Set();
    this.initializeBatchActions();
    this.initializeSelectAll();
    this.initializeEventListeners();

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

  initializeBatchActions() {
    const deleteSelectedBtn = document.createElement('button');
    deleteSelectedBtn.className = 'delete-selected-btn';
    deleteSelectedBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
      Apagar Selecionados
    `;
    deleteSelectedBtn.style.display = 'none';
    deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedNotas());
    
    const batchActions = document.createElement('div');
    batchActions.className = 'batch-actions';
    batchActions.appendChild(deleteSelectedBtn);
    
    const tableContainer = document.querySelector('.table-container');
    tableContainer.parentNode.insertBefore(batchActions, tableContainer);
  }

  initializeSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllNotas');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll('.nota-checkbox');
        
        checkboxes.forEach(checkbox => {
          checkbox.checked = isChecked;
          const numero = checkbox.dataset.numero;
          
          if (isChecked) {
            this.selectedNotas.add(numero);
          } else {
            this.selectedNotas.delete(numero);
          }
        });
        
        this.updateDeleteSelectedButton();
      });
    }
  }

  addNotaToTable(nota) {
    const row = document.createElement('tr');
    
    const validationStatus = this.getValidationStatus(nota);
    if (validationStatus.hasIssues) {
      row.classList.add('inconsistent-nota');
    }

    const razaoSocial = (nota.tomador?.razaoSocial || '').substring(0, 525);
    const nonZeroRetentions = this.getNonZeroRetentions(nota);
    const retentionsHtml = nonZeroRetentions.length > 0 
      ? `<table class="retencoes-table">
          ${nonZeroRetentions.map(ret => `
            <tr><td>${ret.label}:</td><td>${ret.value}</td></tr>
          `).join('')}
        </table>`
      : '<span class="no-retentions">Sem retenções</span>';

    const alertIcon = validationStatus.hasIssues 
      ? `<span class="alert-icon" title="${validationStatus.message}">
          ${validationStatus.icon}
         </span>`
      : '';

    row.innerHTML = `
      <td class="checkbox-column">
        <input type="checkbox" class="nota-checkbox" data-numero="${nota.numero}">
      </td>
      <td class="nota-numero">
        ${nota.numero || ''}
        ${alertIcon}
      </td>
      <td class="tomador-info">
        <div class="tomador-data">
          ${razaoSocial}
        </div>
      </td>
      <td class="valor-total">${nota.valores?.valorTotal || 'R$ 0,00'}</td>
      <td class="retencoes compact">
        ${retentionsHtml}
      </td>
      <td class="actions-column">
        <div class="action-menu">
          <button type="button" class="action-menu-btn" aria-label="Menu de ações">⋮</button>
          <div class="action-menu-content">
            <div class="action-menu-item" onclick="event.stopPropagation(); app.ui.viewNota('${nota.numero}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Ver Detalhes
            </div>
            <div class="action-menu-item" onclick="event.stopPropagation(); app.ui.deleteNota('${nota.numero}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Excluir
            </div>
          </div>
        </div>
      </td>
    `;

    // Add event listeners
    const actionMenuBtn = row.querySelector('.action-menu-btn');
    actionMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleActionMenu(actionMenuBtn);
    });

    const checkbox = row.querySelector('.nota-checkbox');
    checkbox.addEventListener('change', (e) => this.handleNotaSelection(e, nota.numero));
    
    this.notasTable.appendChild(row);
  }

  toggleActionMenu(button) {
    // Close all other menus first
    const allMenus = document.querySelectorAll('.action-menu');
    allMenus.forEach(menu => {
      if (menu !== button.parentElement) {
        menu.classList.remove('open');
      }
    });
    
    // Toggle the clicked menu
    const menu = button.parentElement;
    menu.classList.toggle('open');
  }

  handleNotaSelection(event, numero) {
    if (event.target.checked) {
      this.selectedNotas.add(numero);
    } else {
      this.selectedNotas.delete(numero);
    }
    this.updateDeleteSelectedButton();
  }

  updateDeleteSelectedButton() {
    const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
    if (this.selectedNotas.size > 0) {
      deleteSelectedBtn.style.display = 'inline-flex';
      deleteSelectedBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
        Apagar Selecionados (${this.selectedNotas.size})
      `;
    } else {
      deleteSelectedBtn.style.display = 'none';
    }

    // Update select all checkbox state
    const selectAllCheckbox = document.getElementById('selectAllNotas');
    const totalCheckboxes = document.querySelectorAll('.nota-checkbox').length;
    selectAllCheckbox.checked = this.selectedNotas.size === totalCheckboxes && totalCheckboxes > 0;
    selectAllCheckbox.indeterminate = this.selectedNotas.size > 0 && this.selectedNotas.size < totalCheckboxes;
  }

  initializeEventListeners() {
    // Add click event listener to close menus when clicking outside
    document.addEventListener('click', (e) => {
      // If the click is not within a menu, close all menus
      if (!e.target.closest('.action-menu')) {
        document.querySelectorAll('.action-menu').forEach(menu => {
          menu.classList.remove('open');
        });
      }
    });

    // Prevent menu from closing when clicking inside it
    document.querySelectorAll('.action-menu-content').forEach(menu => {
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
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
    // Format razaoSocial to prevent overflow
    const razaoSocial = (nota.tomador?.razaoSocial || '').substring(0, 525);

    return `
      <div class="modal-tabs">
        <button class="modal-tab active" data-tab="geral">Informações Gerais</button>
        <button class="modal-tab" data-tab="tomador">Dados do Tomador</button>
        <button class="modal-tab" data-tab="valores">Valores e Retenções</button>
        <button class="modal-tab" data-tab="servico">Dados do Serviço</button>
      </div>

      <div class="modal-tab-content active" id="geral">
        <h3>Informações Gerais</h3>
        <table>
          <tr><th>Número da Nota</th><td>${nota.numero}</td></tr>
          <tr><th>Data de Emissão</th><td>${nota.dataHoraEmissao || 'N/A'}</td></tr>
          <tr><th>Nota Substituída</th><td>${nota.notaSubstituida || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="modal-tab-content" id="tomador">
        <h3>Dados do Tomador</h3>
        <table>
          <tr><th>CNPJ</th><td>${nota.tomador?.cnpj || 'N/A'}</td></tr>
          <tr><th>Razão Social</th><td>${razaoSocial}</td></tr>
        </table>
      </div>

      <div class="modal-tab-content" id="valores">
        <h3>Valores e Retenções</h3>
        <table>
          <tr><th>Valor Total</th><td>${nota.valores?.valorTotal || 'R$ 0,00'}</td></tr>
          <tr><th>ISS</th><td>${nota.valores?.valorIss || 'R$ 0,00'}</td></tr>
          <tr><th>IRPJ</th><td>${nota.retencoes?.irpj || 'R$ 0,00'}</td></tr>
          <tr><th>CSLL</th><td>${nota.retencoes?.csll || 'R$ 0,00'}</td></tr>
          <tr><th>COFINS</th><td>${nota.retencoes?.cofins || 'R$ 0,00'}</td></tr>
          <tr><th>PIS/PASEP</th><td>${nota.retencoes?.pis || 'R$ 0,00'}</td></tr>
        </table>
        ${this.createValidationWarning(nota)}
      </div>

      <div class="modal-tab-content" id="servico">
        <h3>Dados do Serviço</h3>
        <table>
          <tr><th>Descrição</th><td>${nota.descricaoServico || 'N/A'}</td></tr>
        </table>
      </div>
    `;
  }

  createValidationWarning(nota) {
    if (!nota.hasInconsistencies && !this.areAllRetentionsZero(nota)) {
      return '';
    }

    const message = nota.hasInconsistencies 
      ? `Erro na retenção: ${nota.validationErrors.join('\n')}`
      : 'Atenção: Todas as retenções estão zeradas. Favor verificar se isto está correto.';

    return `
      <div class="validation-warning" style="
        margin-top: 1rem;
        padding: 1rem;
        background: ${nota.hasInconsistencies ? '#fff5f5' : '#fff3cd'};
        border-radius: 8px;
        color: ${nota.hasInconsistencies ? '#c53030' : '#856404'};
        border: 1px solid ${nota.hasInconsistencies ? '#fed7d7' : '#ffeeba'};
      ">
        <p style="margin: 0;">
          ${nota.hasInconsistencies ? '❌' : '⚠️'} ${message}
        </p>
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

  getNonZeroRetentions(nota) {
    const retentions = [
      { label: 'IRPJ', value: nota.retencoes?.irpj },
      { label: 'CSLL', value: nota.retencoes?.csll },
      { label: 'COFINS', value: nota.retencoes?.cofins },
      { label: 'PIS', value: nota.retencoes?.pis },
      { label: 'ISS', value: nota.valores?.valorIss }
    ];

    return retentions.filter(ret => {
      const value = parseFloat(ret.value?.replace('R$ ', '').replace(',', '.')) || 0;
      return value > 0;
    });
  }

  deleteNota(numero) {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      app.controller.deleteNota(numero);
      this.refreshTable();
    }
  }

  refreshTable(notas) {
    const notasBody = document.getElementById('notasBody');
    notasBody.innerHTML = ''; // Clear current table
    notas.forEach(nota => this.addNotaToTable(nota));
  }

  showModal() {
    this.modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeModal() {
    this.modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }

  showSuccessMessage(message) {
    alert(message);
  }

  showErrorMessage(message) {
    alert('Erro: ' + message);
  }

  getValidationStatus(nota) {
    // Check if all retentions are zero
    const allRetentionsZero = this.areAllRetentionsZero(nota);
    
    // Check if retentions match parametrization rules
    const hasParametrizationErrors = nota.hasInconsistencies;

    if (allRetentionsZero) {
      return {
        hasIssues: true,
        icon: '⚠️',
        message: 'Atenção: Todas as retenções estão zeradas. Favor verificar se isto está correto.'
      };
    } else if (hasParametrizationErrors) {
      return {
        hasIssues: true,
        icon: '❌',
        message: `Erro na retenção: Os valores informados não correspondem aos percentuais parametrizados.\n\nDetalhes:\n${nota.validationErrors.join('\n')}`
      };
    }

    return {
      hasIssues: false,
      icon: '',
      message: ''
    };
  }

  areAllRetentionsZero(nota) {
    const values = [
      this.parseValorToNumber(nota.retencoes?.irpj),
      this.parseValorToNumber(nota.retencoes?.csll),
      this.parseValorToNumber(nota.retencoes?.cofins),
      this.parseValorToNumber(nota.retencoes?.pis),
      this.parseValorToNumber(nota.valores?.valorIss)
    ];
    
    return values.every(value => value === 0);
  }

  parseValorToNumber(valor) {
    if (!valor) return 0;
    return parseFloat(valor.replace('R$ ', '').replace('.', '').replace(',', '.')) || 0;
  }

  async deleteSelectedNotas() {
    if (this.selectedNotas.size === 0) return;

    const confirmed = await this.showConfirmDialog(
      `Tem certeza que deseja excluir ${this.selectedNotas.size} nota${this.selectedNotas.size > 1 ? 's' : ''}?`
    );

    if (confirmed) {
      this.selectedNotas.forEach(numero => {
        app.controller.deleteNota(numero);
      });
      this.selectedNotas.clear();
      this.refreshTable(app.controller.getAllNotas());
      this.updateDeleteSelectedButton();
    }
  }

  showConfirmDialog(message) {
    return new Promise((resolve) => {
      const confirmed = confirm(message);
      resolve(confirmed);
    });
  }

  async showImportConfirmation(fileCount) {
    return new Promise((resolve) => {
      const pluralSuffix = fileCount > 1 ? 's' : '';
      const message = `Você está prestes a importar ${fileCount} arquivo${pluralSuffix}. Deseja continuar?`;
      const confirmed = confirm(message);
      resolve(confirmed);
    });
  }

  showProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'progressOverlay';
    overlay.innerHTML = `
      <div class="progress-container">
        <div class="progress-spinner"></div>
        <p class="progress-text">Importando notas fiscais...</p>
        <div id="progressStatus" class="progress-status"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  updateProgressStatus(current, total) {
    const status = document.getElementById('progressStatus');
    if (status) {
      status.textContent = `Processando ${current} de ${total} arquivos...`;
    }
  }

  hideProgressOverlay() {
    const overlay = document.getElementById('progressOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  showCompletionMessage(successCount, errorCount) {
    const totalFiles = successCount + errorCount;
    let message = `Importação concluída!\n`;
    if (successCount > 0) {
      message += `${successCount} nota${successCount > 1 ? 's' : ''} importada${successCount > 1 ? 's' : ''} com sucesso.`;
    }
    if (errorCount > 0) {
      message += `\n${errorCount} arquivo${errorCount > 1 ? 's' : ''} não pude${errorCount > 1 ? 'ram' : ''} ser processado${errorCount > 1 ? 's' : ''}.`;
    }
    alert(message);
  }
}