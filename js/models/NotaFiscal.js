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
    const validationResult = this.validateRetentions(valorTotalNumeric);
    this.hasInconsistencies = validationResult.hasErrors;
    this.inconsistencyMessages = validationResult.messages;
  }

  validateRetentions(valorTotal) {
    const result = {
      hasErrors: false,
      messages: []
    };

    const retentions = {
      'IRPJ': {
        actual: this.parseValorToNumber(this.retencoes.irpj),
        expected: valorTotal * 0.015
      },
      'CSLL': {
        actual: this.parseValorToNumber(this.retencoes.csll),
        expected: valorTotal * 0.01
      },
      'COFINS': {
        actual: this.parseValorToNumber(this.retencoes.cofins),
        expected: valorTotal * 0.0108
      },
      'PIS': {
        actual: this.parseValorToNumber(this.retencoes.pis),
        expected: valorTotal * 0.03
      },
      'ISS': {
        actual: this.parseValorToNumber(this.valores.valorIss),
        expected: valorTotal * 0.05
      }
    };

    // Check each retention
    for (const [type, values] of Object.entries(retentions)) {
      if (values.actual === 0) {
        result.hasErrors = true;
        result.messages.push(`${type} está zerado`);
      } else if (Math.abs(values.actual - values.expected) > 0.01) { // 1 cent tolerance
        result.hasErrors = true;
        result.messages.push(`${type} incorreto (esperado: R$ ${values.expected.toFixed(2)})`);
      }
    }

    return result;
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