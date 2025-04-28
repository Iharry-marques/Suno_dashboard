function showTab(tabName) {
  document.getElementById('tab-equipe').style.display = (tabName === 'equipe') ? 'block' : 'none';
  document.getElementById('tab-cliente').style.display = (tabName === 'cliente') ? 'block' : 'none';
}

async function carregarTarefas() {
  try {
    let filteredData = [];
    let ganttEquipe = null;
    let ganttCliente = null;

    const response = await fetch('dados.json');

    function getCustomClass(item) {
        const groupSubgroupColors = {
            "Criacao": "blue",
            "Midia": "purple",
            "Producao": "orange",
        };
        const clientColors = {
            "Cliente A": "lightgreen",
            "Cliente B": "lightcoral",
        };
        const tipoColors = {
            "Tarefa": "darkblue",
            "Subtarefa": "lightblue",
        };
    
        const groupColor = groupSubgroupColors[item.group_subgroup] || "gray";
        const clientColor = clientColors[item.client] || "lightgray";
        const tipoColor = tipoColors[item.tipo] || "gray";
    
        return `${groupColor}-${clientColor}-${tipoColor}`;
    }
    
    function formatarData(dataString) {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    }

    function populateFilter(selectId, values) {
      const select = document.getElementById(selectId);
      values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.text = value;
        select.appendChild(option);
      });
    }
    
    function updateGanttCharts(newData) {
      if (ganttEquipe) {
        ganttEquipe.clear();
      }
      if (ganttCliente) {
        ganttCliente.clear();
      }
    
      const tarefasEquipe = [];
      const tarefasCliente = [];
    
      newData.forEach(item => {
        const startDate = item.start ? item.start.split('T')[0] : '';
        const endDate = item.end ? item.end.split('T')[0] : '';
    
        tarefasEquipe.push({
          id: item.id || '',
          name: item.name || 'Sem nome',
          start: startDate,
          end: endDate,
          progress: parseInt(item.progress, 10) || 0,
          custom_class: getCustomClass(item)
        });
    
        tarefasCliente.push({
          id: item.id || '',
          name: `${item.client || 'Cliente desconhecido'} :: ${item.name || 'Sem nome'}`,
          start: startDate,
          end: endDate,
          progress: parseInt(item.progress, 10) || 0,
          custom_class: getCustomClass(item)
        });
      });
    
      ganttEquipe = new Gantt("#gantt-equipe", tarefasEquipe, {
        view_mode: 'Day',
        date_format: 'YYYY-MM-DD',
        custom_popup_html: task => `<div class="details-container" style="font-size:14px"><h6><b>${newData.find(item => item.id == task.id)?.name || ''}</b></h6><p><b>Responsável:</b> ${newData.find(item => item.id == task.id)?.responsible || ''}</p><p><b>Cliente:</b> ${newData.find(item => item.id == task.id)?.client || ''}</p><p><b>Projeto:</b> ${newData.find(item => item.id == task.id)?.project || ''}</p><p><b>Status:</b> ${newData.find(item => item.id == task.id)?.PipelineStepTitle || ''}</p></div>`,
      });
    
      ganttCliente = new Gantt("#gantt-cliente", tarefasCliente, {
        view_mode: 'Day',
        date_format: 'YYYY-MM-DD',
        custom_popup_html: task => `<div class="details-container" style="font-size:14px"><h6><b>${newData.find(item => item.id == task.id)?.name || ''}</b></h6><p><b>Responsável:</b> ${newData.find(item => item.id == task.id)?.responsible || ''}</p><p><b>Cliente:</b> ${newData.find(item => item.id == task.id)?.client || ''}</p><p><b>Projeto:</b> ${newData.find(item => item.id == task.id)?.project || ''}</p><p><b>Status:</b> ${newData.find(item => item.id == task.id)?.PipelineStepTitle || ''}</p></div>`
      });

      document.getElementById('btn-day').addEventListener('click', () => {
        ganttEquipe.change_view_mode('Day');
        ganttCliente.change_view_mode('Day');
      });
    
      document.getElementById('btn-week').addEventListener('click', () => {
        ganttEquipe.change_view_mode('Week');
        ganttCliente.change_view_mode('Week');
      });
    
      document.getElementById('btn-month').addEventListener('click', () => {
        ganttEquipe.change_view_mode('Month');
        ganttCliente.change_view_mode('Month');
      });      
      document.getElementById('btn-fullscreen').addEventListener('click', () => {
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (document.fullscreenElement) {
          document.exitFullscreen();
          btnFullscreen.textContent = "Tela Cheia";
        } else {
          const ganttElement = document.getElementById('gantt-equipe');
          if (ganttElement.requestFullscreen) {
            ganttElement.requestFullscreen()
            .then(()=>{
              btnFullscreen.textContent = "Sair Tela Cheia";
            })
            .catch((err) => {
              console.error("Erro ao entrar em tela cheia:", err);
            });
          }
        }
      });
    
      document.addEventListener('fullscreenchange', () => {
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (document.fullscreenElement) {
          btnFullscreen.textContent = "Sair Tela Cheia";
        } else {
          btnFullscreen.textContent = "Tela Cheia";
        }
      });    
      document.getElementById('btn-today').addEventListener('click', () => {ganttEquipe.scroll_to_today();ganttCliente.scroll_to_today();});
      
    }

    function filterTasks(group, client, type, status) {
      filteredData = data.filter(item => {
        const groupMatch = !group || item.group_subgroup === group;
        const clientMatch = !client || item.client === client;
        const typeMatch = !type || item.tipo === type;
        const statusMatch = !status || item.PipelineStepTitle === status;
        return groupMatch && clientMatch && typeMatch && statusMatch;
      });
      updateGanttCharts(filteredData);
    }

    
    const uniqueGroups = [...new Set(data.map(item => item.group_subgroup))];
    const uniqueClients = [...new Set(data.map(item => item.client))];
    const uniqueTypes = [...new Set(data.map(item => item.tipo))];
    const uniqueStatuses = [...new Set(data.map(item => item.PipelineStepTitle))];
    const data = await response.json();
    filteredData = data;
    updateGanttCharts(filteredData);

    populateFilter('filter-group', uniqueGroups);
    populateFilter('filter-client', uniqueClients);
    populateFilter('filter-type', uniqueTypes);
    populateFilter('filter-status', uniqueStatuses);

    document.getElementById('filter-group').addEventListener('change', () => {
      filterTasks(document.getElementById('filter-group').value, document.getElementById('filter-client').value, document.getElementById('filter-type').value, document.getElementById('filter-status').value);
    });
    document.getElementById('filter-client').addEventListener('change', () => {
      filterTasks(document.getElementById('filter-group').value, document.getElementById('filter-client').value, document.getElementById('filter-type').value, document.getElementById('filter-status').value);
    });
    document.getElementById('filter-type').addEventListener('change', () => {
      filterTasks(document.getElementById('filter-group').value, document.getElementById('filter-client').value, document.getElementById('filter-type').value, document.getElementById('filter-status').value);
    });
    document.getElementById('filter-status').addEventListener('change', () => {
      filterTasks(document.getElementById('filter-group').value, document.getElementById('filter-client').value, document.getElementById('filter-type').value, document.getElementById('filter-status').value);
    });
  } catch (error) {
    console.error("Erro ao carregar ou processar o dados.json:", error);
  }
}

// Carregar automaticamente ao abrir o site
carregarTarefas();
