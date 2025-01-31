export class ExportService {
  exportToJson(notas) {
    const jsonStr = JSON.stringify(notas, null, 2);
    this.downloadFile(jsonStr, 'notas_fiscais.json', 'application/json');
  }

  exportToCsv(notas) {
    const headers = [
      'Número',
      'Data Emissão',
      'Prestador CNPJ',
      'Prestador Razão Social',
      'Tomador CNPJ',
      'Tomador Razão Social',
      'Valor Total',
      'ISS'
    ];

    const rows = notas.map(nota => [
      nota.numero,
      nota.dataHoraEmissao,
      nota.prestador.cnpj,
      nota.prestador.razaoSocial,
      nota.tomador.cnpj,
      nota.tomador.razaoSocial,
      nota.valores.valorTotal,
      nota.valores.valorIss
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'notas_fiscais.csv', 'text/csv');
  }

  generateReport(notas) {
    const reportContent = this.createReportContent(notas);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Notas Fiscais</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            th { background-color: #f4f4f4; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `;

    this.downloadFile(htmlContent, 'relatorio_notas_fiscais.html', 'text/html');
  }

  createReportContent(notas) {
    const totalValor = notas.reduce((sum, nota) => sum + parseFloat(nota.valores.valorTotal.replace('R$ ', '').replace('.', '').replace(',', '.')), 0);
    const totalIss = notas.reduce((sum, nota) => sum + parseFloat(nota.valores.valorIss.replace('R$ ', '').replace('.', '').replace(',', '.')), 0);

    return `
      <h1>Relatório de Notas Fiscais</h1>
      <h2>Período: ${this.getReportPeriod(notas)}</h2>
      
      <h3>Resumo</h3>
      <table>
        <tr>
          <th>Quantidade de Notas</th>
          <td>${notas.length}</td>
        </tr>
        <tr>
          <th>Valor Total</th>
          <td>R$ ${totalValor.toFixed(2)}</td>
        </tr>
        <tr>
          <th>ISS Total</th>
          <td>R$ ${totalIss.toFixed(2)}</td>
        </tr>
      </table>

      <h3>Detalhamento</h3>
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Data Emissão</th>
            <th>Prestador</th>
            <th>Tomador</th>
            <th>Valor</th>
            <th>ISS</th>
          </tr>
        </thead>
        <tbody>
          ${notas.map(nota => `
            <tr>
              <td>${nota.numero}</td>
              <td>${nota.dataHoraEmissao}</td>
              <td>${nota.prestador.razaoSocial}</td>
              <td>${nota.tomador.razaoSocial}</td>
              <td>${nota.valores.valorTotal}</td>
              <td>${nota.valores.valorIss}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  getReportPeriod(notas) {
    if (notas.length === 0) return 'Nenhuma nota';
    
    const dates = notas.map(nota => new Date(nota.dataHoraEmissao.split(' ')[0].split('/').reverse().join('-')));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return `${minDate.toLocaleDateString()} a ${maxDate.toLocaleDateString()}`;
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}