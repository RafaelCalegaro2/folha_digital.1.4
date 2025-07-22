// Espera o DOM carregar completamente antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES DE ELEMENTOS DOM ---
    const form = document.getElementById('formPonto');
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    const toggleMenu = document.getElementById('toggleMenu');
    const closeSidebar = document.getElementById('closeSidebar');
    const historySidebar = document.getElementById('historySidebar');
    const shareBtn = document.getElementById('shareBtn');
    
    // --- ESTADO DA APLICAÇÃO ---
    let registros = JSON.parse(localStorage.getItem('registrosPontos')) || [];

    // --- FUNÇÕES PRINCIPAIS ---

    const salvarRegistro = (e) => {
        e.preventDefault();
        const nomeInput = document.getElementById('nome');
        
        const novoRegistro = {
            id: Date.now(),
            nome: nomeInput.value.trim(),
            data: document.getElementById('data').value,
            entrada: document.getElementById('entrada').value,
            saida: document.getElementById('saida').value,
        };
        
        if (novoRegistro.saida && novoRegistro.entrada > novoRegistro.saida) {
            alert("A hora de saída não pode ser anterior à hora de entrada!");
            return;
        }
        
        registros.push(novoRegistro);
        salvarNoLocalStorage();
        atualizarHistorico();
        
        const nomeAtual = nomeInput.value;
        form.reset();
        nomeInput.value = nomeAtual;
    };

    const atualizarHistorico = () => {
        if (registros.length === 0) {
            tabelaHistorico.innerHTML = '<p class="empty-message">Nenhum registro encontrado.</p>';
            return;
        }
        
        const sortedRegistros = [...registros].sort((a, b) => new Date(b.data) - new Date(a.data) || b.id - a.id);
        
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
                        <tr data-id="${reg.id}">
                            <td>${reg.nome}</td>
                            <td>${formatarData(reg.data)}</td>
                            <td>${reg.entrada || '---'}</td>
                            <td>${reg.saida || '---'}</td>
                            <td class="actions-cell">
                                <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    };

    const handleAcoesTabela = (e) => {
        const target = e.target.closest('.action-btn');
        if (!target) return;

        const id = Number(target.closest('tr').dataset.id);

        if (target.classList.contains('edit-btn')) {
            editarRegistro(id);
        } else if (target.classList.contains('delete-btn')) {
            excluirRegistro(id);
        }
    };

    const editarRegistro = (id) => {
        const registro = registros.find(reg => reg.id === id);
        if (!registro) return;
        
        document.getElementById('nome').value = registro.nome;
        document.getElementById('data').value = registro.data;
        document.getElementById('entrada').value = registro.entrada;
        document.getElementById('saida').value = registro.saida;
        
        registros = registros.filter(reg => reg.id !== id);
        salvarNoLocalStorage();
        
        document.getElementById('nome').focus();
        atualizarHistorico();
        
        if (window.innerWidth < 769) {
            historySidebar.classList.remove('visible');
        }
    };

    const excluirRegistro = (id) => {
        if (confirm("Tem certeza que deseja excluir este registro? A ação não pode ser desfeita.")) {
            registros = registros.filter(reg => reg.id !== id);
            salvarNoLocalStorage();
            atualizarHistorico();
        }
    };

    // --- FUNÇÃO DE COMPARTILHAMENTO / DOWNLOAD ---

    /**
     * Gera o conteúdo CSV para ser usado no compartilhamento ou download.
     * @returns {{content: string, filename: string}|null}
     */
    const gerarDadosCSV = () => {
        if (registros.length === 0) {
            alert("Nenhum registro para compartilhar!");
            return null;
        }

        const headers = ['Nome', 'Data', 'Entrada', 'Saida'];
        const csvRows = [
            headers.join(','),
            ...registros.map(reg => 
                [reg.nome, reg.data, reg.entrada, reg.saida]
                .map(field => `"${field || ''}"`).join(',')
            )
        ];
        
        // CORREÇÃO: Verifica se existe um nome antes de usar o 'replace'
        const nomeColaborador = (registros[0]?.nome || 'Geral').replace(/\s+/g, '_');
        const nomeArquivo = `Folha_Ponto_${nomeColaborador}.csv`;

        return {
            content: csvRows.join('\n'),
            filename: nomeArquivo,
        };
    };

    /**
     * Tenta compartilhar o arquivo CSV. Se não for possível, faz o download.
     */
    const compartilharOuBaixar = async () => {
        const dadosCSV = gerarDadosCSV();
        if (!dadosCSV) return;

        const { content, filename } = dadosCSV;
        const file = new File([content], filename, { type: 'text/csv' });

        // Verifica se a API de compartilhamento de arquivos está disponível
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                // Se estiver no celular, abre o menu de compartilhamento
                await navigator.share({
                    title: 'Folha de Ponto',
                    text: `Folha de ponto em anexo: ${filename}`,
                    files: [file],
                });
            } catch (error) {
                // Ignora o erro se o usuário simplesmente cancelar o compartilhamento
                if (error.name !== 'AbortError') {
                    console.error('Erro ao compartilhar:', error);
                    alert(`Ocorreu um erro ao tentar compartilhar. O arquivo será baixado.`);
                    downloadFile(filename, content, 'text/csv');
                }
            }
        } else {
            // Se estiver no PC ou navegador sem suporte, apenas baixa o arquivo
            console.log('API de compartilhamento não suportada. Baixando o arquivo.');
            downloadFile(filename, content, 'text/csv');
        }
    };

    // --- FUNÇÕES AUXILIARES ---

    const salvarNoLocalStorage = () => {
        localStorage.setItem('registrosPontos', JSON.stringify(registros));
    };

    const downloadFile = (filename, content, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatarData = (dataStr) => {
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dataObj = new Date(`${dataStr}T00:00:00`);
        const diaSemana = diasSemana[dataObj.getUTCDay()];
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        return `${dia}/${mes} - ${diaSemana}`;
    };

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', salvarRegistro);
    tabelaHistorico.addEventListener('click', handleAcoesTabela);
    shareBtn.addEventListener('click', compartilharOuBaixar);

    // Sidebar (Mobile)
    toggleMenu.addEventListener('click', () => historySidebar.classList.add('visible'));
    closeSidebar.addEventListener('click', () => historySidebar.classList.remove('visible'));

    // --- INICIALIZAÇÃO ---
    atualizarHistorico();
});
