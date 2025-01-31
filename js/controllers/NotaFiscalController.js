export class NotaFiscalController {
  constructor(storageService) {
    this.storage = storageService;
  }

  addNota(nota) {
    this.storage.saveNota(nota);
  }

  getNota(numero) {
    return this.storage.getNota(numero);
  }

  getAllNotas() {
    return this.storage.getAllNotas();
  }

  deleteNota(numero) {
    this.storage.deleteNota(numero);
  }

  updateNota(nota) {
    this.storage.updateNota(nota);
  }
}