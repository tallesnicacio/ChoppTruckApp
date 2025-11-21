// app.js - Lógica Principal da Aplicação

// ===== ESTADO GLOBAL =====
let currentComanda = null;
let currentTab = 'abertas';
let selectedPagamento = null;
let wakeLock = null;
let selectedColor = '#74B9FF'; // Cor padrão para novos produtos
let sortBy = 'data'; // Critério de ordenação: 'data' ou 'nome'

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();

    try {
        // Inicializa o banco de dados
        await db.init();
        await db.seedProdutos();

        // Configura event listeners
        setupEventListeners();

        // Carrega a tela inicial
        await loadComandasScreen();

        // Registra Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(() => console.log('Service Worker registrado'))
                .catch(err => console.error('Erro ao registrar Service Worker:', err));
        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showToast('Erro ao inicializar aplicação');
    } finally {
        hideLoading();
    }
});

// ===== NAVEGAÇÃO =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Listagem de Comandas
    document.getElementById('btn-nova-comanda').addEventListener('click', openNovaComandaModal);
    document.getElementById('btn-produtos').addEventListener('click', () => loadProdutosScreen());
    document.getElementById('tab-abertas').addEventListener('click', () => switchTab('abertas'));
    document.getElementById('tab-fechadas').addEventListener('click', () => switchTab('fechadas'));
    document.getElementById('search-comandas').addEventListener('input', handleSearchComandas);
    document.getElementById('sort-comandas').addEventListener('change', handleSortChange);

    // Modal Nova Comanda
    document.getElementById('btn-criar-comanda').addEventListener('click', criarComanda);
    document.getElementById('btn-cancelar-comanda').addEventListener('click', () => {
        hideModal('modal-nova-comanda');
        clearNovaComandaForm();
    });

    // Enter para criar comanda
    document.getElementById('input-cliente').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') criarComanda();
    });

    // Tela de Venda
    document.getElementById('btn-voltar-venda').addEventListener('click', async () => {
        await releaseWakeLock();
        loadComandasScreen();
    });
    document.getElementById('btn-fechar-comanda').addEventListener('click', openFechamentoScreen);
    document.getElementById('btn-editar-comanda').addEventListener('click', openEditarComandaModal);

    // Modal Editar Comanda
    document.getElementById('btn-salvar-edicao').addEventListener('click', salvarEdicaoComanda);
    document.getElementById('btn-cancelar-edicao').addEventListener('click', () => {
        hideModal('modal-editar-comanda');
    });

    // Tela de Fechamento
    document.getElementById('btn-voltar-fechamento').addEventListener('click', () => {
        loadVendaScreen(currentComanda.id);
    });
    document.getElementById('btn-confirmar-pagamento').addEventListener('click', confirmarPagamento);

    // Botões de pagamento
    document.querySelectorAll('.btn-pagamento').forEach(btn => {
        btn.addEventListener('click', () => selectPagamento(btn.dataset.metodo));
    });

    // Tela de Produtos
    document.getElementById('btn-voltar-produtos').addEventListener('click', () => loadComandasScreen());
    document.getElementById('btn-add-produto').addEventListener('click', openProdutoModal);

    // Modal Produto
    document.getElementById('btn-salvar-produto').addEventListener('click', salvarProduto);
    document.getElementById('btn-cancelar-produto').addEventListener('click', () => {
        hideModal('modal-produto');
        clearProdutoForm();
    });

    // Seletor de cores
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => selectColor(btn.dataset.color));
    });
}

// ===== TELA: LISTAGEM DE COMANDAS =====
async function loadComandasScreen() {
    showScreen('screen-comandas');
    await renderComandas();
    await updateStats();
}

async function renderComandas() {
    let comandas = await db.getComandasByStatus(currentTab === 'abertas' ? 'aberta' : 'paga');

    // Aplica ordenação
    if (sortBy === 'nome') {
        comandas.sort((a, b) => a.nome_cliente.localeCompare(b.nome_cliente));
    } else {
        // Já vem ordenado por data do banco, mas garantimos
        comandas.sort((a, b) => b.data_hora - a.data_hora);
    }

    const container = document.getElementById('comandas-list');

    if (comandas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">
                    ${currentTab === 'abertas' ? 'Nenhuma comanda aberta' : 'Nenhuma comanda fechada hoje'}
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = comandas.map(comanda => `
        <div class="comanda-card" onclick="loadVendaScreen(${comanda.id})">
            <div class="comanda-info">
                <h3>${comanda.nome_cliente}</h3>
                ${comanda.mesa ? `<span class="mesa-tag">Mesa ${comanda.mesa}</span>` : ''}
                <div class="comanda-detalhes">
                    ${comanda.itens.length} ${comanda.itens.length === 1 ? 'item' : 'itens'} •
                    ${new Date(comanda.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <div class="comanda-valor">
                <span class="valor">${formatMoeda(comanda.total)}</span>
                ${comanda.forma_pagamento ? `<div class="metodo-pagamento">${formatPagamento(comanda.forma_pagamento)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

async function updateStats() {
    const stats = await db.getStatsHoje();
    document.getElementById('stat-abertas').textContent = stats.abertas;
    document.getElementById('stat-total').textContent = formatMoeda(stats.totalDia);
}

function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    renderComandas();
}

function handleSortChange(e) {
    sortBy = e.target.value;
    renderComandas();
}

async function handleSearchComandas(e) {
    const searchTerm = e.target.value.trim();

    if (searchTerm === '') {
        renderComandas();
        return;
    }

    let comandas = await db.searchComandasByCliente(searchTerm);
    let comandasFiltradas = comandas.filter(c => c.status === (currentTab === 'abertas' ? 'aberta' : 'paga'));

    // Aplica ordenação
    if (sortBy === 'nome') {
        comandasFiltradas.sort((a, b) => a.nome_cliente.localeCompare(b.nome_cliente));
    } else {
        comandasFiltradas.sort((a, b) => b.data_hora - a.data_hora);
    }

    const container = document.getElementById('comandas-list');

    if (comandasFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Nenhum resultado para "${searchTerm}"</div>
            </div>
        `;
        return;
    }

    container.innerHTML = comandasFiltradas.map(comanda => `
        <div class="comanda-card" onclick="loadVendaScreen(${comanda.id})">
            <div class="comanda-info">
                <h3>${comanda.nome_cliente}</h3>
                ${comanda.mesa ? `<span class="mesa-tag">Mesa ${comanda.mesa}</span>` : ''}
                <div class="comanda-detalhes">
                    ${comanda.itens.length} ${comanda.itens.length === 1 ? 'item' : 'itens'} •
                    ${new Date(comanda.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <div class="comanda-valor">
                <span class="valor">${formatMoeda(comanda.total)}</span>
                ${comanda.forma_pagamento ? `<div class="metodo-pagamento">${formatPagamento(comanda.forma_pagamento)}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== MODAL: NOVA COMANDA =====
function openNovaComandaModal() {
    showModal('modal-nova-comanda');
    document.getElementById('input-cliente').focus();
}

async function criarComanda() {
    const nomeCliente = document.getElementById('input-cliente').value.trim();
    const mesa = document.getElementById('input-mesa').value.trim();

    if (!nomeCliente) {
        showToast('Digite o nome do cliente');
        return;
    }

    showLoading();

    try {
        const comandaId = await db.addComanda({
            nome_cliente: nomeCliente,
            mesa: mesa || null
        });

        hideModal('modal-nova-comanda');
        clearNovaComandaForm();
        vibrate(50);
        showToast('Comanda criada!');

        // Abre diretamente a tela de venda
        await loadVendaScreen(comandaId);
    } catch (error) {
        console.error('Erro ao criar comanda:', error);
        showToast('Erro ao criar comanda');
    } finally {
        hideLoading();
    }
}

function clearNovaComandaForm() {
    document.getElementById('input-cliente').value = '';
    document.getElementById('input-mesa').value = '';
}

// ===== MODAL: EDITAR COMANDA =====
function openEditarComandaModal() {
    if (!currentComanda) return;

    showModal('modal-editar-comanda');
    document.getElementById('edit-input-cliente').value = currentComanda.nome_cliente;
    document.getElementById('edit-input-mesa').value = currentComanda.mesa || '';
    document.getElementById('edit-input-cliente').focus();
}

async function salvarEdicaoComanda() {
    if (!currentComanda) return;

    const novoNome = document.getElementById('edit-input-cliente').value.trim();
    const novaMesa = document.getElementById('edit-input-mesa').value.trim();

    if (!novoNome) {
        showToast('Digite o nome do cliente');
        return;
    }

    showLoading();

    try {
        currentComanda.nome_cliente = novoNome;
        currentComanda.mesa = novaMesa || null;

        await db.updateComanda(currentComanda);

        // Atualiza a interface
        document.getElementById('venda-cliente-nome').textContent = currentComanda.nome_cliente;
        document.getElementById('venda-mesa-info').textContent = currentComanda.mesa ? `Mesa ${currentComanda.mesa}` : '';

        hideModal('modal-editar-comanda');
        vibrate(50);
        showToast('Comanda atualizada!');
    } catch (error) {
        console.error('Erro ao atualizar comanda:', error);
        showToast('Erro ao atualizar comanda');
    } finally {
        hideLoading();
    }
}

// ===== TELA: VENDA =====
async function loadVendaScreen(comandaId) {
    showLoading();

    try {
        currentComanda = await db.getComanda(comandaId);

        if (!currentComanda) {
            showToast('Comanda não encontrada');
            loadComandasScreen();
            return;
        }

        // Ativa Wake Lock
        await requestWakeLock();

        showScreen('screen-venda');

        // Atualiza cabeçalho
        document.getElementById('venda-cliente-nome').textContent = currentComanda.nome_cliente;
        document.getElementById('venda-mesa-info').textContent = currentComanda.mesa ? `Mesa ${currentComanda.mesa}` : '';

        // Renderiza produtos e resumo
        await renderProdutosGrid();
        renderResumo();
        updateTotal();
    } catch (error) {
        console.error('Erro ao carregar tela de venda:', error);
        showToast('Erro ao carregar comanda');
    } finally {
        hideLoading();
    }
}

async function renderProdutosGrid() {
    const produtos = await db.getAllProdutos();
    const container = document.getElementById('produtos-grid');

    container.innerHTML = produtos.map(produto => {
        const itemNaComanda = currentComanda.itens.find(i => i.produto_id === produto.id);
        const quantidade = itemNaComanda ? itemNaComanda.quantidade : 0;

        return `
            <button class="produto-card" style="background: ${produto.cor};" onclick="addProdutoToComanda(${produto.id})">
                ${quantidade > 0 ? `<span class="produto-badge">x${quantidade}</span>` : ''}
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-preco">${formatMoeda(produto.preco)}</div>
            </button>
        `;
    }).join('');
}

function renderResumo() {
    const container = document.getElementById('resumo-itens');

    if (currentComanda.itens.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gray);">
                Nenhum item adicionado
            </div>
        `;
        return;
    }

    container.innerHTML = currentComanda.itens.map(item => `
        <div class="resumo-item">
            <div class="resumo-item-info">
                <div class="resumo-item-nome">${item.nome}</div>
                <div class="resumo-item-detalhes">
                    ${item.quantidade} × ${formatMoeda(item.preco)} = ${formatMoeda(item.quantidade * item.preco)}
                </div>
            </div>
            <div class="resumo-item-acoes">
                <button class="btn-quantidade btn-menos" onclick="removeProdutoFromComanda(${item.produto_id})">−</button>
                <span class="item-quantidade">${item.quantidade}</span>
                <button class="btn-quantidade btn-mais" onclick="addProdutoToComanda(${item.produto_id})">+</button>
            </div>
        </div>
    `).join('');
}

function updateTotal() {
    document.getElementById('venda-total').textContent = formatMoeda(currentComanda.total);

    const btnFechar = document.getElementById('btn-fechar-comanda');
    btnFechar.disabled = currentComanda.total === 0;
}

async function addProdutoToComanda(produtoId) {
    vibrate(50);

    try {
        const produto = await db.getProduto(produtoId);

        await db.addItemToComanda(currentComanda.id, {
            produto_id: produto.id,
            nome: produto.nome,
            preco: produto.preco
        });

        // Atualiza comanda local
        currentComanda = await db.getComanda(currentComanda.id);

        // Re-renderiza
        renderProdutosGrid();
        renderResumo();
        updateTotal();
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        showToast('Erro ao adicionar produto');
    }
}

async function removeProdutoFromComanda(produtoId) {
    vibrate(50);

    try {
        await db.removeItemFromComanda(currentComanda.id, produtoId);

        // Atualiza comanda local
        currentComanda = await db.getComanda(currentComanda.id);

        // Re-renderiza
        renderProdutosGrid();
        renderResumo();
        updateTotal();
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        showToast('Erro ao remover produto');
    }
}

// ===== TELA: FECHAMENTO =====
function openFechamentoScreen() {
    if (currentComanda.itens.length === 0) {
        showToast('Adicione itens antes de fechar a comanda');
        return;
    }

    showScreen('screen-fechamento');
    selectedPagamento = null;

    // Atualiza informações
    document.getElementById('fechamento-cliente').textContent = currentComanda.nome_cliente;
    document.getElementById('fechamento-mesa').textContent = currentComanda.mesa ? `Mesa ${currentComanda.mesa}` : '';
    document.getElementById('fechamento-total').textContent = formatMoeda(currentComanda.total);

    // Renderiza itens
    const container = document.getElementById('conferencia-itens');
    container.innerHTML = currentComanda.itens.map(item => `
        <div class="conferencia-item">
            <div>
                <strong>${item.quantidade}×</strong> ${item.nome}
            </div>
            <div>${formatMoeda(item.quantidade * item.preco)}</div>
        </div>
    `).join('');

    // Reseta seleção de pagamento
    document.querySelectorAll('.btn-pagamento').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('btn-confirmar-pagamento').disabled = true;
}

function selectPagamento(metodo) {
    selectedPagamento = metodo;

    document.querySelectorAll('.btn-pagamento').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.metodo === metodo);
    });

    document.getElementById('btn-confirmar-pagamento').disabled = false;
    vibrate(50);
}

async function confirmarPagamento() {
    if (!selectedPagamento) {
        showToast('Selecione a forma de pagamento');
        return;
    }

    showLoading();

    try {
        await db.fecharComanda(currentComanda.id, selectedPagamento);

        vibrate([50, 100, 50]);
        showToast('Comanda fechada com sucesso!');

        await releaseWakeLock();
        currentComanda = null;
        selectedPagamento = null;

        loadComandasScreen();
    } catch (error) {
        console.error('Erro ao fechar comanda:', error);
        showToast('Erro ao fechar comanda');
    } finally {
        hideLoading();
    }
}

// ===== TELA: GESTÃO DE PRODUTOS =====
async function loadProdutosScreen() {
    showScreen('screen-produtos');
    await renderProdutosList();
}

async function renderProdutosList() {
    const produtos = await db.getAllProdutos();
    const container = document.getElementById('produtos-list');

    if (produtos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🍺</div>
                <div class="empty-state-text">Nenhum produto cadastrado</div>
            </div>
        `;
        return;
    }

    container.innerHTML = produtos.map(produto => `
        <div class="produto-item">
            <div class="produto-color-indicator" style="background: ${produto.cor};"></div>
            <div class="produto-item-info">
                <h3>${produto.nome}</h3>
                <p>${formatMoeda(produto.preco)}</p>
            </div>
            <div class="produto-item-acoes">
                <button class="btn-edit" onclick="editProduto(${produto.id})">✏️</button>
                <button class="btn-delete" onclick="deleteProduto(${produto.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===== MODAL: PRODUTO =====
function openProdutoModal() {
    showModal('modal-produto');
    document.getElementById('modal-produto-titulo').textContent = 'Novo Produto';
    document.getElementById('input-produto-nome').focus();
}

async function editProduto(id) {
    const produto = await db.getProduto(id);

    if (!produto) {
        showToast('Produto não encontrado');
        return;
    }

    showModal('modal-produto');
    document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
    document.getElementById('edit-produto-id').value = produto.id;
    document.getElementById('input-produto-nome').value = produto.nome;
    document.getElementById('input-produto-preco').value = produto.preco;
    selectColor(produto.cor);
}

async function salvarProduto() {
    const id = document.getElementById('edit-produto-id').value;
    const nome = document.getElementById('input-produto-nome').value.trim();
    const preco = parseFloat(document.getElementById('input-produto-preco').value);

    if (!nome) {
        showToast('Digite o nome do produto');
        return;
    }

    if (!preco || preco <= 0) {
        showToast('Digite um preço válido');
        return;
    }

    showLoading();

    try {
        const produto = {
            nome,
            preco,
            cor: selectedColor
        };

        if (id) {
            // Editar
            produto.id = parseInt(id);
            await db.updateProduto(produto);
            showToast('Produto atualizado!');
        } else {
            // Criar
            await db.addProduto(produto);
            showToast('Produto criado!');
        }

        hideModal('modal-produto');
        clearProdutoForm();
        vibrate(50);

        renderProdutosList();
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showToast('Erro ao salvar produto');
    } finally {
        hideLoading();
    }
}

async function deleteProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) {
        return;
    }

    showLoading();

    try {
        await db.deleteProduto(id);
        showToast('Produto excluído!');
        vibrate(50);
        renderProdutosList();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showToast('Erro ao excluir produto');
    } finally {
        hideLoading();
    }
}

function clearProdutoForm() {
    document.getElementById('edit-produto-id').value = '';
    document.getElementById('input-produto-nome').value = '';
    document.getElementById('input-produto-preco').value = '';
    selectColor('#74B9FF');
}

function selectColor(cor) {
    selectedColor = cor;
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === cor);
    });
}

// ===== WAKE LOCK =====
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock ativado');
        } catch (err) {
            console.error('Erro ao ativar Wake Lock:', err);
        }
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock desativado');
        } catch (err) {
            console.error('Erro ao desativar Wake Lock:', err);
        }
    }
}

// ===== UTILIDADES =====
function formatMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatPagamento(metodo) {
    const metodos = {
        'pix': '📱 Pix',
        'dinheiro': '💵 Dinheiro',
        'cartao': '💳 Cartão'
    };
    return metodos[metodo] || metodo;
}

function vibrate(pattern) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}
