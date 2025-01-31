export class StorageService {
  constructor() {
    this.STORAGE_KEY = 'nfse_notas';
  }

  saveNota(nota) {
    const notas = this.getAllNotas();
    notas.push(nota);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notas));
  }

  getNota(numero) {
    const notas = this.getAllNotas();
    return notas.find(nota => nota.numero === numero);
  }

  getAllNotas() {
    const notasJson = localStorage.getItem(this.STORAGE_KEY);
    return notasJson ? JSON.parse(notasJson) : [];
  }

  deleteNota(numero) {
    const notas = this.getAllNotas();
    const filteredNotas = notas.filter(nota => nota.numero !== numero);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredNotas));
  }

  updateNota(updatedNota) {
    const notas = this.getAllNotas();
    const index = notas.findIndex(nota => nota.numero === updatedNota.numero);
    if (index !== -1) {
      notas[index] = updatedNota;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notas));
    }
  }
}