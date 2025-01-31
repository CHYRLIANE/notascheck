export class NotaFiscal {
  constructor(data, aliquotasService) {
    if (!data) {
      throw new Error('Dados da nota fiscal não fornecidos');
    }

    if (!data.numero) {
      throw new Error('Número da nota fiscal é obrigatório');
    }

    this.aliquotasService = aliquotasService;
    this.numero = data.numero;
    this.tomador = {
      razaoSocial: data.tomador?.razaoSocial || '',
      cnpj: data.tomador?.cnpj || ''
    };
    
    // Parse valorTotal for calculations
    const valorTotalNumeric = this.parseValorToNumber(data.valores?.valorTotal);
    
    this.valores = {
      valorTotal: data.valores?.valorTotal || 'R$ 0,00',
      valorIss: data.valores?.valorIss || this.calculateIss(valorTotalNumeric)
    };
    
    this.retencoes = {
      irpj: data.retencoes?.irpj || this.calculateIrpj(valorTotalNumeric),
      csll: data.retencoes?.csll || this.calculateCsll(valorTotalNumeric),
      cofins: data.retencoes?.cofins || this.calculateCofins(valorTotalNumeric),
      pis: data.retencoes?.pis || this.calculatePis(valorTotalNumeric)
    };

    // Validate retentions
    this.hasInconsistencies = this.validateRetentions(valorTotalNumeric);
  }

  validateRetentions(valorTotal) {
    const expectedRetentions = {
      irpj: this.calculateIrpj(valorTotal),
      csll: this.calculateCsll(valorTotal),
      cofins: this.calculateCofins(valorTotal),
      pis: this.calculatePis(valorTotal),
      iss: this.calculateIss(valorTotal)
    };

    // Convert actual values to numeric for comparison
    const actualRetentions = {
      irpj: this.parseValorToNumber(this.retencoes.irpj),
      csll: this.parseValorToNumber(this.retencoes.csll),
      cofins: this.parseValorToNumber(this.retencoes.cofins),
      pis: this.parseValorToNumber(this.retencoes.pis),
      iss: this.parseValorToNumber(this.valores.valorIss)
    };

    // Check for discrepancies with a small tolerance
    const tolerance = 0.01; // 1 cent tolerance
    for (const [type, expected] of Object.entries(expectedRetentions)) {
      const actual = actualRetentions[type];
      if (Math.abs(actual - expected) > tolerance) {
        return true;
      }
    }

    return false;
  }

  parseValorToNumber(valor) {
    if (!valor) return 0;
    return parseFloat(valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
  }

  formatCurrency(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  calculateIss(valorTotal) {
    return this.formatCurrency(this.aliquotasService.calculateIss(valorTotal));
  }

  calculateIrpj(valorTotal) {
    return this.formatCurrency(this.aliquotasService.calculateIrpj(valorTotal));
  }

  calculateCsll(valorTotal) {
    return this.formatCurrency(this.aliquotasService.calculateCsll(valorTotal));
  }

  calculateCofins(valorTotal) {
    return this.formatCurrency(this.aliquotasService.calculateCofins(valorTotal));
  }

  calculatePis(valorTotal) {
    return this.formatCurrency(this.aliquotasService.calculatePis(valorTotal));
  }

  toJSON() {
    return {
      numero: this.numero,
      tomador: this.tomador,
      valores: this.valores,
      retencoes: this.retencoes
    };
  }
}