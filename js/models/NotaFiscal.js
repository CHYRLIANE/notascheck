export class NotaFiscal {
  constructor(data, aliquotasService, existingNota = null) {
    if (!data) {
      throw new Error('Dados da nota fiscal não fornecidos');
    }

    if (!data.numero) {
      throw new Error('Número da nota fiscal é obrigatório');
    }

    this.aliquotasService = aliquotasService;
    this.numero = data.numero;
    
    // Copy retention values if specified, otherwise calculate
    const valorTotalNumeric = this.parseValorToNumber(data.valores?.valorTotal);
    const aliquotas = this.aliquotasService.getAliquotas();

    // Determine whether to override calculated values or use provided values
    this.valores = {
      valorTotal: data.valores?.valorTotal || 'R$ 0,00',
      valorIss: data.valores?.valorIss || this.formatCurrency(
        this.aliquotasService.calculateIss(valorTotalNumeric)
      )
    };

    this.retencoes = {
      irpj: this.aliquotasService.getAliquotas().irpj > 0 
        ? this.formatCurrency(this.aliquotasService.calculateIrpj(valorTotalNumeric)) 
        : "R$ 0,00",

      csll: this.aliquotasService.getAliquotas().csll > 0 
        ? this.formatCurrency(this.aliquotasService.calculateCsll(valorTotalNumeric)) 
        : "R$ 0,00",

      cofins: this.aliquotasService.getAliquotas().cofins > 0 
        ? this.formatCurrency(this.aliquotasService.calculateCofins(valorTotalNumeric)) 
        : "R$ 0,00",

      pis: this.aliquotasService.getAliquotas().pis > 0 
        ? this.formatCurrency(this.aliquotasService.calculatePis(valorTotalNumeric)) 
        : "R$ 0,00"
    };

    // Existing validation logic
    this.tomador = {
      razaoSocial: data.tomador?.razaoSocial || '',
      cnpj: data.tomador?.cnpj || ''
    };

    // Validate retentions and check for zero values
    this.validationErrors = this.validateRetentions(valorTotalNumeric);
    this.hasInconsistencies = this.validationErrors.length > 0;
  }

  validateRetentions(valorTotal) {
    const errors = [];

    // Garante que estamos pegando a parametrização mais atualizada
    this.aliquotasService.loadAliquotas();
    const aliquotas = this.aliquotasService.getAliquotas();
    console.log("Alíquotas carregadas na validação:", aliquotas);

    // Calcula os valores esperados conforme a parametrização atual
    const expectedRetentions = {
        iss: aliquotas.iss > 0 ? valorTotal * (aliquotas.iss / 100) : 0,
        irpj: aliquotas.irpj > 0 ? valorTotal * (aliquotas.irpj / 100) : 0,
        csll: aliquotas.csll > 0 ? valorTotal * (aliquotas.csll / 100) : 0,
        cofins: aliquotas.cofins > 0 ? valorTotal * (aliquotas.cofins / 100) : 0,
        pis: aliquotas.pis > 0 ? valorTotal * (aliquotas.pis / 100) : 0
    };

    // Obtém os valores informados na nota fiscal
    const actualRetentions = {
        iss: this.parseValorToNumber(this.valores.valorIss),
        irpj: this.parseValorToNumber(this.retencoes.irpj),
        csll: this.parseValorToNumber(this.retencoes.csll),
        cofins: this.parseValorToNumber(this.retencoes.cofins),
        pis: this.parseValorToNumber(this.retencoes.pis)
    };

    // Adicionando LOG para depuração
    console.log("Valores esperados com base na parametrização:", expectedRetentions);
    console.log("Valores preenchidos na nota fiscal:", actualRetentions);

    // Define tolerância para evitar erro de arredondamento
    const tolerance = 0.01;

    for (const [type, expected] of Object.entries(expectedRetentions)) {
        const actual = actualRetentions[type];

        // Se um imposto foi parametrizado como 0%, mas aparece na nota, gerar erro
        if (aliquotas[type] === 0 && actual > 0) {
            errors.push(`${type.toUpperCase()} foi preenchido como R$ ${actual.toFixed(2)}, mas deveria ser R$ 0,00 conforme a parametrização.`);
        } 
        // Se o imposto deveria existir na nota mas está ausente, gerar erro
        else if (aliquotas[type] > 0 && (actual === null || actual === undefined || actual === 0)) {
            errors.push(`${type.toUpperCase()} deveria ser R$ ${expected.toFixed(2)}, mas não foi informado na nota.`);
        }
        // Se o imposto foi preenchido e o valor é diferente do esperado, gerar erro
        else if (aliquotas[type] > 0) {
            const expectedFormatted = parseFloat(expected.toFixed(2));
            if (Math.abs(actual - expectedFormatted) > tolerance) {
                errors.push(`${type.toUpperCase()} deveria ser R$ ${expectedFormatted.toFixed(2)}, mas foi preenchido como R$ ${actual.toFixed(2)}.`);
            }
        }
    }

    return errors;
  }

  parseValorToNumber(valor) {
    if (!valor) return 0;
    return parseFloat(valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
  }

  formatCurrency(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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