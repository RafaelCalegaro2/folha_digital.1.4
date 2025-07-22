// Espera o DOM carregar completamente antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES DE ELEMENTOS DOM ---
    const form = document.getElementById('formPonto');
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    const toggleMenu = document.getElementById('toggleMenu');
    const closeSidebar = document.getElementById('closeSidebar');
    const historySidebar = document.getElementById('historySidebar');
    const whatsappBtn = document.getElementById('whatsappBtn');
    
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

    // --- FUNÇÃO DE ENVIO PARA WHATSAPP ---

    /**
     * Gera o conteúdo CSV e abre o WhatsApp com a mensagem pronta.
     */
    const enviarPorWhatsApp = () => {
        if (registros.length === 0) {
            alert("Nenhum registro para enviar!");
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
        const csvContent = csvRows.join('\n');

        const nomeColaborador = registros[0]?.nome || 'Colaborador';
        const mesReferencia = registros.length > 0 ? new Date(registros[0].data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'mês atual';

        // Monta a mensagem para o WhatsApp, usando a formatação de monospaçado (```)
        const mensagem = `*Folha de Ponto Digital*\n\n` +
                       `Olá! Segue a folha de ponto de *${nomeColaborador}* ` +
                       `referente a *${mesReferencia}*.\n\n` +
                       `\`\`\`\n${csvContent}\n\`\`\``;

        const mensagemCodificada = encodeURIComponent(mensagem);

        // Este link abre o WhatsApp e permite que o usuário escolha o contato
        const whatsappURL = `whatsapp://send?text=${mensagemCodificada}`;

        // Abre o link em uma nova aba (que redirecionará para o app no celular)
        window.open(whatsappURL, '_blank');
    };

    // --- FUNÇÕES AUXILIARES ---

    const salvarNoLocalStorage = () => {
        localStorage.setItem('registrosPontos', JSON.stringify(registros));
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
    whatsappBtn.addEventListener('click', enviarPorWhatsApp);

    // Sidebar (Mobile)
    toggleMenu.addEventListener('click', () => historySidebar.classList.add('visible'));
    closeSidebar.addEventListener('click', () => historySidebar.classList.remove('visible'));

    // --- INICIALIZAÇÃO ---
    atualizarHistorico();
});
