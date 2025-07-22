let registros = JSON.parse(localStorage.getItem('registrosPontos')) || [];

// Elementos DOM
const form = document.getElementById('formPonto');
const tabelaHistorico = document.getElementById('tabelaHistorico');
const toggleMenu = document.getElementById('toggleMenu');
const closeSidebar = document.getElementById('closeSidebar');
const historySidebar = document.getElementById('historySidebar');

// Alternar menu lateral (mobile)
toggleMenu.addEventListener('click', () => {
    historySidebar.style.right = '0';
});

closeSidebar.addEventListener('click', () => {
    historySidebar.style.right = '-100%';
});

// Salvar novo registro
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const novoRegistro = {
        id: Date.now(),
        nome: document.getElementById('nome').value,
        data: document.getElementById('data').value,
        entrada: document.getElementById('entrada').value,
        saida: document.getElementById('saida').value,
        timestamp: new Date().toISOString()
    };
    
    // Validação básica
    if (novoRegistro.saida && novoRegistro.entrada > novoRegistro.saida) {
        alert("A saída não pode ser antes da entrada!");
        return;
    }
    
    registros.push(novoRegistro);
    salvarNoLocalStorage();
    atualizarHistorico();
    form.reset();
});

// Exportar para CSV
document.getElementById('exportCSV').addEventListener('click', () => {
    if (registros.length === 0) {
        alert("Nenhum registro para exportar!");
        return;
    }
    
    const headers = ['Nome', 'Data', 'Entrada', 'Saida'];
    const csvRows = [
        headers.join(','),
        ...registros.map(reg => 
            [reg.nome, reg.data, reg.entrada, reg.saida]
            .map(field => `"${field || ''}"`).join(',')
        )
    ];
    
    downloadFile('Folha - '+csvRows[1].split(',')[0].replace(/"/g, '')+'.csv', csvRows.join('\n'), 'text/csv');
});

// Atualizar função atualizarHistorico()
function atualizarHistorico() {
    if (registros.length === 0) {
        tabelaHistorico.innerHTML = '<p class="empty-message">Nenhum registro encontrado</p>';
        return;
    }
    
    const sortedRegistros = [...registros].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    tabelaHistorico.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Data</th>
                    <th>Entrada</th>
                    <th>Saída</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${sortedRegistros.map(reg => `
                    <tr>
                        <td>${reg.nome}</td>
                        <td>${formatarData(reg.data)}</td>
                        <td>${reg.entrada || '-'}</td>
                        <td>${reg.saida || '-'}</td>
                        <td class="actions-cell">
                            <button class="action-btn edit-btn" onclick="editarRegistro(${reg.id})">Editar</button>
                            <button class="action-btn delete-btn" onclick="excluirRegistro(${reg.id})">Excluir</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Funções de edição/exclusão (adicionar ao script.js)
function editarRegistro(id) {
    const registro = registros.find(reg => reg.id === id);
    if (!registro) return;
    
    // Preenche o formulário com os dados do registro
    document.getElementById('nome').value = registro.nome;
    document.getElementById('data').value = registro.data;
    document.getElementById('entrada').value = registro.entrada;
    document.getElementById('saida').value = registro.saida;
    
    // Remove o registro antigo (será readicionado ao salvar)
    registros = registros.filter(reg => reg.id !== id);
    salvarNoLocalStorage();
    
    // Foca no campo de nome para facilitar a edição
    document.getElementById('nome').focus();
    
    // Atualiza o histórico (removendo o registro que está sendo editado)
    atualizarHistorico();
    
    // Fecha o sidebar em mobile
    if (window.innerWidth < 769) {
        historySidebar.style.right = '-100%';
    }
}

function excluirRegistro(id) {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
        registros = registros.filter(reg => reg.id !== id);
        salvarNoLocalStorage();
        atualizarHistorico();
    }
}

// Funções auxiliares
function salvarNoLocalStorage() {
    localStorage.setItem('registrosPontos', JSON.stringify(registros));
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function formatarData(dataStr) {
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}`;
}

// Inicialização
atualizarHistorico();

// Mostrar/ocultar sidebar baseado no tamanho da tela
function handleResponsive() {
    if (window.innerWidth >= 769) {
        historySidebar.style.right = '0';
    } else {
        historySidebar.style.right = '-100%';
    }
}

window.addEventListener('resize', handleResponsive);
handleResponsive();