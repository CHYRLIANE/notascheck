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
    // Validate input to ensure numeric values
    Object.keys(aliquotas).forEach(key => {
      aliquotas[key] = parseFloat(aliquotas[key]) || 0;
    });

    this.aliquotas = aliquotas;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(aliquotas));
    return aliquotas;
  }

  getAliquotas() {
    this.loadAliquotas(); 
    return this.aliquotas;
  }

  calculateIss(valorTotal) {
    return valorTotal * (this.aliquotas.iss / 100);
  }

  calculateIrpj(valorTotal) {
    return valorTotal * (this.aliquotas.irpj / 100);
  }

  calculateCsll(valorTotal) {
    return valorTotal * (this.aliquotas.csll / 100);
  }

  calculateCofins(valorTotal) {
    return valorTotal * (this.aliquotas.cofins / 100);
  }

  calculatePis(valorTotal) {
    return valorTotal * (this.aliquotas.pis / 100);
  }
}