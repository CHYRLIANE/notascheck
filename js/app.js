import { NotaFiscal } from './models/NotaFiscal.js';
import { NotaFiscalController } from './controllers/NotaFiscalController.js';
import { StorageService } from './services/StorageService.js';
import { FileProcessor } from './services/FileProcessor.js';
import { ExportService } from './services/ExportService.js';
import { UIManager } from './ui/UIManager.js';
import { AliquotasService } from './services/AliquotasService.js';

class App {
  constructor() {
    this.storage = new StorageService();
    this.fileProcessor = new FileProcessor();
    this.exportService = new ExportService();
    this.aliquotasService = new AliquotasService();
    this.controller = new NotaFiscalController(this.storage);
    this.ui = new UIManager(this.aliquotasService);
    
    this.initializeEventListeners();
    this.loadStoredNotas();
  }

  initializeEventListeners() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const aliquotasForm = document.getElementById('aliquotasForm');
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      await this.processFiles(files);
    });

    fileInput.addEventListener('change', async (e) => {
      await this.processFiles(e.target.files);
    });

    // Aliquotas form handler
    aliquotasForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const aliquotas = {
        iss: parseFloat(document.getElementById('aliquotaIss').value),
        irpj: parseFloat(document.getElementById('aliquotaIrpj').value),
        csll: parseFloat(document.getElementById('aliquotaCsll').value),
        cofins: parseFloat(document.getElementById('aliquotaCofins').value),
        pis: parseFloat(document.getElementById('aliquotaPis').value)
      };
      
      // Save aliquotas and recalculate all existing notas
      this.aliquotasService.saveAliquotas(aliquotas);
      this.recalculateAllNotas();
      this.ui.showSuccessMessage('Alíquotas atualizadas. Todas as notas foram recalculadas.');
    });

    // Export buttons
    document.getElementById('exportJson').addEventListener('click', () => {
      this.exportService.exportToJson(this.controller.getAllNotas());
    });

    document.getElementById('exportCsv').addEventListener('click', () => {
      this.exportService.exportToCsv(this.controller.getAllNotas());
    });

    document.getElementById('gerarRelatorio').addEventListener('click', () => {
      this.exportService.generateReport(this.controller.getAllNotas());
    });
  }

  recalculateAllNotas() {
    const notas = this.controller.getAllNotas();
    const updatedNotas = notas.map(nota => 
      new NotaFiscal(nota, this.aliquotasService, nota)
    );

    // Clear and repopulate the table
    this.storage.clearNotas();
    updatedNotas.forEach(nota => {
      this.controller.addNota(nota);
    });

    // Refresh UI
    this.ui.refreshTable(updatedNotas);
  }

  async processFiles(files) {
    if (files.length === 0) return;

    const confirmed = await this.ui.showImportConfirmation(files.length);
    if (!confirmed) return;

    this.ui.showProgressOverlay();
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.ui.updateProgressStatus(i + 1, files.length);
      
      try {
        const notaData = await this.fileProcessor.processFile(file);
        const nota = new NotaFiscal(notaData, this.aliquotasService);
        this.controller.addNota(nota);
        this.ui.addNotaToTable(nota);
        successCount++;
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        errorCount++;
      }
    }

    this.ui.hideProgressOverlay();
    this.ui.showCompletionMessage(successCount, errorCount);
  }

  loadStoredNotas() {
    const notas = this.controller.getAllNotas();
    notas.forEach(nota => this.ui.addNotaToTable(nota));
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});