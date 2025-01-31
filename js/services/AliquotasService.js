export class AliquotasService {
  constructor() {
    this.STORAGE_KEY = 'nfse_aliquotas';
    this.loadAliquotas();
  }

  getDefaultAliquotas() {
    return {
      iss: 5.00,
      irpj: 1.50,
      csll: 1.00,
      cofins: 3.00,
      pis: 0.65
    };
  }

  loadAliquotas() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    this.aliquotas = stored ? JSON.parse(stored) : this.getDefaultAliquotas();
    return this.aliquotas;
  }

  saveAliquotas(aliquotas) {
    this.aliquotas = aliquotas;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(aliquotas));
  }

  getAliquotas() {
    return this.aliquotas;
  }

  calculateIrpj(valorTotal) {
    return valorTotal * (this.aliquotas.irpj / 100); // 0.015 = 1.5%
  }

  calculateCsll(valorTotal) {
    return valorTotal * (this.aliquotas.csll / 100); // 0.01 = 1%
  }

  calculateCofins(valorTotal) {
    return valorTotal * (this.aliquotas.cofins / 100); // 0.0108 = 1.08%
  }

  calculatePis(valorTotal) {
    return valorTotal * (this.aliquotas.pis / 100); // 0.03 = 3%
  }

  calculateIss(valorTotal) {
    return valorTotal * (this.aliquotas.iss / 100); // 0.05 = 5%
  }
}