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
      this.aliquotasService.saveAliquotas(aliquotas);
      this.ui.showSuccessMessage('Alíquotas salvas com sucesso!');
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

  async processFiles(files) {
    for (const file of files) {
      try {
        const notaData = await this.fileProcessor.processFile(file);
        const nota = new NotaFiscal(notaData, this.aliquotasService);
        this.controller.addNota(nota);
        this.ui.addNotaToTable(nota);
        this.ui.showSuccessMessage(`Nota ${nota.numero} importada com sucesso!`);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        this.ui.showErrorMessage(`Erro ao processar arquivo ${file.name}: ${error.message}`);
      }
    }
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