function showTab(tabName) {
  document.getElementById('tab-equipe').style.display = (tabName === 'equipe') ? 'block' : 'none';
  document.getElementById('tab-cliente').style.display = (tabName === 'cliente') ? 'block' : 'none';
}

async function carregarTarefas() {
  try {
    const response = await fetch('dados.json');
    const data = await response.json();

    const tarefasEquipe = [];
    const tarefasCliente = [];

    data.forEach(item => {
      const startDate = item.start ? item.start.split('T')[0] : '';
      const endDate = item.end ? item.end.split('T')[0] : '';

      tarefasEquipe.push({
        id: item.id || '',
        name: item.name || 'Sem nome',
        start: startDate,
        end: endDate,
        progress: parseInt(item.progress, 10) || 0,
        custom_class: (item.group_subgroup || 'grupo-desconhecido').replace(/\s+/g, '-').toLowerCase()
      });

      tarefasCliente.push({
        id: item.id || '',
        name: `${item.client || 'Cliente desconhecido'} :: ${item.name || 'Sem nome'}`,
        start: startDate,
        end: endDate,
        progress: parseInt(item.progress, 10) || 0,
        custom_class: (item.client || 'cliente-desconhecido').replace(/\s+/g, '-').toLowerCase()
      });
    });

    new Gantt("#gantt-equipe", tarefasEquipe, {
      view_mode: 'Day',
      date_format: 'YYYY-MM-DD',
      custom_popup_html: task => `
        <div class="details-container">
          <h5>${task.name}</h5>
          <p>Início: ${task.start}</p>
          <p>Fim: ${task.end}</p>
        </div>
      `
    });

    new Gantt("#gantt-cliente", tarefasCliente, {
      view_mode: 'Day',
      date_format: 'YYYY-MM-DD',
      custom_popup_html: task => `
        <div class="details-container">
          <h5>${task.name}</h5>
          <p>Início: ${task.start}</p>
          <p>Fim: ${task.end}</p>
        </div>
      `
    });

  } catch (error) {
    console.error("Erro ao carregar ou processar o dados.json:", error);
  }
}

// Carregar automaticamente ao abrir o site
carregarTarefas();
