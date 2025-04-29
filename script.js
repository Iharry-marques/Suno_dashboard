/**
 * Suno Dashboard - SOMOS • CREATORS
 * Script principal com depuração aprimorada
 */

// Função de debug - ajuda a identificar problemas
function debug(message) {
  const debugOutput = document.getElementById('debug-output');
  if (debugOutput) {
    const timestamp = new Date().toLocaleTimeString();
    debugOutput.innerHTML += `[${timestamp}] ${message}\n`;
    // Mostra o console de debug durante desenvolvimento
    document.getElementById('debug-console').style.display = 'block';
  }
  console.log(message);
}

// Função para alternar as abas
function showTab(tabName) {
  // Remove a classe active de todas as abas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Adiciona a classe active na aba selecionada
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`btn-${tabName}`).classList.add('active');
  
  debug(`Alternado para a aba: ${tabName}`);
}

// Inicializa eventos de clique das abas
function initTabs() {
  document.getElementById('btn-equipe').addEventListener('click', () => showTab('equipe'));
  document.getElementById('btn-cliente').addEventListener('click', () => showTab('cliente'));
}

// Controles de visualização
function initViewControls() {
  const viewButtons = document.querySelectorAll('.view-button');
  viewButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Remove a classe active de todos os botões
      viewButtons.forEach(btn => btn.classList.remove('active'));
      // Adiciona a classe active no botão clicado
      e.target.closest('button').classList.add('active');
    });
  });
}

// Carrega e processa as tarefas
async function carregarTarefas() {
  try {
    debug("Iniciando carregamento de tarefas...");
    
    let filteredData = [];
    let ganttEquipe = null;
    let ganttCliente = null;
    
    // Tenta carregar o arquivo dados.json
    try {
      debug("Tentando carregar dados.json...");
      const response = await fetch('dados.json');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      debug(`Dados carregados com sucesso. ${data.length} tarefas encontradas.`);
      
      // Armazena os dados originais
      filteredData = [...data];
      
      // Determina uma classe CSS personalizada com base nos atributos da tarefa
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

      // Preenche os filtros com valores únicos dos dados
      function populateFilter(selectId, values) {
        debug(`Preenchendo filtro ${selectId} com ${values.length} valores.`);
        
        const select = document.getElementById(selectId);
        if (!select) {
          debug(`ERRO: Elemento ${selectId} não encontrado.`);
          return;
        }
        
        // Limpa opções existentes, mantendo a primeira (Todos)
        while (select.options.length > 1) {
          select.remove(1);
        }
        
        // Adiciona novas opções
        values.sort().forEach(value => {
          const option = document.createElement('option');
          option.value = value;
          option.text = value;
          select.appendChild(option);
        });
      }

      // Formata uma data para exibição agradável
      function formatDate(isoDate) {
        if (!isoDate) return 'N/D';
        
        try {
          const date = new Date(isoDate);
          return date.toLocaleDateString('pt-BR') + ' ' + 
                 date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          debug(`ERRO ao formatar data ${isoDate}: ${e.message}`);
          return isoDate;
        }
      }

      // Cria o tooltip detalhado para uma tarefa
      function createDetailedTooltip(task, sourceData) {
        try {
          const taskData = sourceData.find(item => item.id == task.id);
          if (!taskData) return '';
          
          return `
            <div class="details-container">
              <h6>${taskData.name || 'Sem nome'}</h6>
              
              <p><span class="label">Responsável:</span> <span>${taskData.responsible || 'N/D'}</span></p>
              <p><span class="label">Cliente:</span> <span>${taskData.client || 'N/D'}</span></p>
              <p><span class="label">Projeto:</span> <span>${taskData.project || 'N/D'}</span></p>
              <p><span class="label">Status:</span> <span>${taskData.PipelineStepTitle || 'N/D'}</span></p>
              <p><span class="label">Tipo:</span> <span>${taskData.tipo || 'N/D'}</span></p>
              <p><span class="label">Equipe:</span> <span>${taskData.group_subgroup || 'N/D'}</span></p>
              <p><span class="label">Progresso:</span> <span>${taskData.progress || '0'}%</span></p>
              
              <div class="dates-section">
                <p><span class="label">Início:</span> <span>${formatDate(taskData.start)}</span></p>
                <p><span class="label">Fim:</span> <span>${formatDate(taskData.end)}</span></p>
                <p><span class="label">Criação:</span> <span>${formatDate(taskData.creation_date)}</span></p>
                <p><span class="label">Modificação:</span> <span>${formatDate(taskData.modification_date)}</span></p>
              </div>
            </div>
          `;
        } catch (e) {
          debug(`ERRO ao criar tooltip: ${e.message}`);
          return '<div class="details-container"><p>Erro ao mostrar detalhes.</p></div>';
        }
      }

      // Atualiza os gráficos Gantt com os dados filtrados
      function updateGanttCharts(newData) {
        debug(`Atualizando gráficos Gantt com ${newData.length} tarefas.`);
        
        try {
          // Prepara as tarefas para o Gantt
          const tarefasEquipe = [];
          const tarefasCliente = [];

          newData.forEach(item => {
            // Extrai a data sem a parte de horas
            const startDate = item.start ? item.start.split('T')[0] : '';
            const endDate = item.end ? item.end.split('T')[0] : '';

            // Para visualização por Equipe
            tarefasEquipe.push({
              id: item.id || '',
              name: item.name || 'Sem nome',
              start: startDate,
              end: endDate,
              progress: parseInt(item.progress, 10) || 0,
              custom_class: getCustomClass(item)
            });

            // Para visualização por Cliente
            tarefasCliente.push({
              id: item.id || '',
              name: `${item.client || 'Cliente'}: ${item.name || 'Sem nome'}`,
              start: startDate,
              end: endDate,
              progress: parseInt(item.progress, 10) || 0,
              custom_class: getCustomClass(item)
            });
          });

          // Limpa os gráficos existentes
          if (ganttEquipe) {
            ganttEquipe.clear();
          }
          
          if (ganttCliente) {
            ganttCliente.clear();
          }

          // Inicializa o Gantt de Equipe
          ganttEquipe = new Gantt("#gantt-equipe", tarefasEquipe, {
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            custom_popup_html: task => createDetailedTooltip(task, newData)
          });
          
          debug("Gantt por Equipe inicializado.");

          // Inicializa o Gantt de Cliente
          ganttCliente = new Gantt("#gantt-cliente", tarefasCliente, {
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            custom_popup_html: task => createDetailedTooltip(task, newData)
          });
          
          debug("Gantt por Cliente inicializado.");

          // Configura os botões de visualização
          document.getElementById('btn-day').addEventListener('click', () => {
            ganttEquipe.change_view_mode('Day');
            ganttCliente.change_view_mode('Day');
            debug("Alterado para visualização: Dia");
          });
          
          document.getElementById('btn-week').addEventListener('click', () => {
            ganttEquipe.change_view_mode('Week');
            ganttCliente.change_view_mode('Week');
            debug("Alterado para visualização: Semana");
          });
          
          document.getElementById('btn-month').addEventListener('click', () => {
            ganttEquipe.change_view_mode('Month');
            ganttCliente.change_view_mode('Month');
            debug("Alterado para visualização: Mês");
          });

          // Configura o botão "Hoje"
          document.getElementById('btn-hoje').addEventListener('click', () => {
            ganttEquipe.scroll_to_today();
            ganttCliente.scroll_to_today();
            debug("Centralizado na data atual.");
          });

          // Configura o botão de tela cheia
          const fullscreenBtn = document.getElementById('btn-fullscreen');
          
          fullscreenBtn.addEventListener('click', () => {
            const activeTab = document.querySelector('.tab-content.active .gantt-container');
            
            if (document.fullscreenElement) {
              document.exitFullscreen();
              fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> <span>Tela Cheia</span>';
              debug("Saindo do modo tela cheia.");
            } else if (activeTab) {
              activeTab.requestFullscreen().catch(err => {
                debug(`ERRO ao entrar em tela cheia: ${err.message}`);
              });
              fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> <span>Sair</span>';
              debug("Entrando em modo tela cheia.");
            }
          });

          // Listener para mudanças no estado de tela cheia
          document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
              fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> <span>Tela Cheia</span>';
            }
          });
        } catch (e) {
          debug(`ERRO ao atualizar gráficos Gantt: ${e.message}`);
        }
      }

      // Filtra as tarefas com base nos critérios selecionados
      function filterTasks() {
        try {
          const group = document.getElementById('filter-group').value;
          const client = document.getElementById('filter-client').value;
          const type = document.getElementById('filter-type').value;
          const status = document.getElementById('filter-status').value;
          
          debug(`Filtrando tarefas - Grupo: ${group || 'Todos'}, Cliente: ${client || 'Todos'}, Tipo: ${type || 'Todos'}, Status: ${status || 'Todos'}`);
          
          const filtered = data.filter(item => {
            const groupMatch = !group || item.group_subgroup === group;
            const clientMatch = !client || item.client === client;
            const typeMatch = !type || item.tipo === type;
            const statusMatch = !status || item.PipelineStepTitle === status;
            return groupMatch && clientMatch && typeMatch && statusMatch;
          });
          
          debug(`Filtragem concluída: ${filtered.length} tarefas correspondem aos critérios.`);
          filteredData = filtered;
          updateGanttCharts(filteredData);
        } catch (e) {
          debug(`ERRO ao filtrar tarefas: ${e.message}`);
        }
      }

      // Extrai valores únicos para os filtros
      const uniqueGroups = [...new Set(data.map(item => item.group_subgroup))].filter(Boolean);
      const uniqueClients = [...new Set(data.map(item => item.client))].filter(Boolean);
      const uniqueTypes = [...new Set(data.map(item => item.tipo))].filter(Boolean);
      const uniqueStatuses = [...new Set(data.map(item => item.PipelineStepTitle))].filter(Boolean);

      // Preenche os filtros
      populateFilter('filter-group', uniqueGroups);
      populateFilter('filter-client', uniqueClients);
      populateFilter('filter-type', uniqueTypes);
      populateFilter('filter-status', uniqueStatuses);

      // Adiciona listeners para os filtros
      document.querySelectorAll('.filter-group select').forEach(select => {
        select.addEventListener('change', filterTasks);
      });

      // Configura o botão de limpar filtros
      const clearFiltersBtn = document.getElementById('btn-clear-filters');
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
          document.querySelectorAll('.filter-group select').forEach(select => {
            select.value = '';
          });
          filteredData = [...data];
          updateGanttCharts(filteredData);
          debug("Filtros limpos. Exibindo todas as tarefas.");
        });
      }

      // Inicializa os gráficos com todos os dados
      updateGanttCharts(data);
      
    } catch (fetchError) {
      debug(`ERRO ao carregar dados: ${fetchError.message}`);
      
      // Mensagem visual de erro para o usuário
      const equipeContainer = document.getElementById('gantt-equipe');
      const clienteContainer = document.getElementById('gantt-cliente');
      
      if (equipeContainer) {
        equipeContainer.innerHTML = `<div class="error-message">
          <p>❌ Erro ao carregar dados: ${fetchError.message}</p>
          <p>Verifique se o arquivo dados.json está na mesma pasta que este HTML.</p>
        </div>`;
      }
      
      if (clienteContainer) {
        clienteContainer.innerHTML = `<div class="error-message">
          <p>❌ Erro ao carregar dados: ${fetchError.message}</p>
          <p>Verifique se o arquivo dados.json está na mesma pasta que este HTML.</p>
        </div>`;
      }
    }
    
  } catch (globalError) {
    debug(`ERRO GLOBAL: ${globalError.message}`);
    console.error("Erro global:", globalError);
  }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  debug("Aplicação iniciando...");
  
  try {
    // Inicializa os controladores de abas
    initTabs();
    
    // Inicializa os botões de visualização
    initViewControls();
    
    // Define a aba padrão (Equipe)
    showTab('equipe');
    
    // Carrega as tarefas
    carregarTarefas();
    
    debug("Inicialização concluída com sucesso!");
  } catch (e) {
    debug(`ERRO durante a inicialização: ${e.message}`);
    console.error("Erro de inicialização:", e);
  }
});