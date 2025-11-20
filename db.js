// db.js - Gerenciamento do IndexedDB

const DB_NAME = 'ChoppTruckDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    // Inicializa o banco de dados
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Object Store: produtos
                if (!db.objectStoreNames.contains('produtos')) {
                    const produtosStore = db.createObjectStore('produtos', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    produtosStore.createIndex('nome', 'nome', { unique: false });
                }

                // Object Store: comandas
                if (!db.objectStoreNames.contains('comandas')) {
                    const comandasStore = db.createObjectStore('comandas', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    comandasStore.createIndex('status', 'status', { unique: false });
                    comandasStore.createIndex('data_hora', 'data_hora', { unique: false });
                    comandasStore.createIndex('nome_cliente', 'nome_cliente', { unique: false });
                }
            };
        });
    }

    // Seed inicial de produtos
    async seedProdutos() {
        const produtos = await this.getAllProdutos();

        if (produtos.length === 0) {
            const produtosIniciais = [
                { nome: 'Chopp Pilsen', preco: 12.00, cor: '#FF6B6B' },
                { nome: 'Chopp IPA', preco: 15.00, cor: '#FFA500' },
                { nome: 'Água Mineral', preco: 3.00, cor: '#45B7D1' },
                { nome: 'Refrigerante', preco: 5.00, cor: '#4ECDC4' },
                { nome: 'Suco Natural', preco: 8.00, cor: '#96CEB4' }
            ];

            for (const produto of produtosIniciais) {
                await this.addProduto(produto);
            }
        }
    }

    // ===== PRODUTOS =====

    // Adicionar produto
    async addProduto(produto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['produtos'], 'readwrite');
            const store = transaction.objectStore('produtos');
            const request = store.add(produto);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Obter todos os produtos
    async getAllProdutos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['produtos'], 'readonly');
            const store = transaction.objectStore('produtos');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Obter produto por ID
    async getProduto(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['produtos'], 'readonly');
            const store = transaction.objectStore('produtos');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Atualizar produto
    async updateProduto(produto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['produtos'], 'readwrite');
            const store = transaction.objectStore('produtos');
            const request = store.put(produto);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Deletar produto
    async deleteProduto(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['produtos'], 'readwrite');
            const store = transaction.objectStore('produtos');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ===== COMANDAS =====

    // Adicionar comanda
    async addComanda(comanda) {
        const comandaCompleta = {
            nome_cliente: comanda.nome_cliente,
            mesa: comanda.mesa || null,
            status: 'aberta',
            itens: [],
            total: 0,
            data_hora: Date.now(),
            forma_pagamento: null,
            ...comanda
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['comandas'], 'readwrite');
            const store = transaction.objectStore('comandas');
            const request = store.add(comandaCompleta);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Obter todas as comandas
    async getAllComandas() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['comandas'], 'readonly');
            const store = transaction.objectStore('comandas');
            const request = store.getAll();

            request.onsuccess = () => {
                // Ordena por data_hora (mais recente primeiro)
                const comandas = request.result.sort((a, b) => b.data_hora - a.data_hora);
                resolve(comandas);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Obter comandas por status
    async getComandasByStatus(status) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['comandas'], 'readonly');
            const store = transaction.objectStore('comandas');
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => {
                // Ordena por data_hora (mais recente primeiro)
                const comandas = request.result.sort((a, b) => b.data_hora - a.data_hora);
                resolve(comandas);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Obter comanda por ID
    async getComanda(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['comandas'], 'readonly');
            const store = transaction.objectStore('comandas');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Atualizar comanda
    async updateComanda(comanda) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['comandas'], 'readwrite');
            const store = transaction.objectStore('comandas');
            const request = store.put(comanda);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Deletar comanda
    async deleteComanda(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['comandas'], 'readwrite');
            const store = transaction.objectStore('comandas');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Adicionar item à comanda
    async addItemToComanda(comandaId, item) {
        const comanda = await this.getComanda(comandaId);

        if (!comanda) {
            throw new Error('Comanda não encontrada');
        }

        // Verifica se o item já existe na comanda
        const itemExistente = comanda.itens.find(i => i.produto_id === item.produto_id);

        if (itemExistente) {
            // Incrementa quantidade
            itemExistente.quantidade += 1;
        } else {
            // Adiciona novo item
            comanda.itens.push({
                produto_id: item.produto_id,
                nome: item.nome,
                preco: item.preco,
                quantidade: 1
            });
        }

        // Recalcula total
        comanda.total = comanda.itens.reduce((sum, item) => {
            return sum + (item.preco * item.quantidade);
        }, 0);

        return this.updateComanda(comanda);
    }

    // Remover item da comanda
    async removeItemFromComanda(comandaId, produtoId) {
        const comanda = await this.getComanda(comandaId);

        if (!comanda) {
            throw new Error('Comanda não encontrada');
        }

        const itemIndex = comanda.itens.findIndex(i => i.produto_id === produtoId);

        if (itemIndex !== -1) {
            const item = comanda.itens[itemIndex];

            if (item.quantidade > 1) {
                // Decrementa quantidade
                item.quantidade -= 1;
            } else {
                // Remove item completamente
                comanda.itens.splice(itemIndex, 1);
            }

            // Recalcula total
            comanda.total = comanda.itens.reduce((sum, item) => {
                return sum + (item.preco * item.quantidade);
            }, 0);

            return this.updateComanda(comanda);
        }
    }

    // Fechar comanda (marcar como paga)
    async fecharComanda(comandaId, formaPagamento) {
        const comanda = await this.getComanda(comandaId);

        if (!comanda) {
            throw new Error('Comanda não encontrada');
        }

        comanda.status = 'paga';
        comanda.forma_pagamento = formaPagamento;

        return this.updateComanda(comanda);
    }

    // Buscar comandas por nome do cliente
    async searchComandasByCliente(searchTerm) {
        const comandas = await this.getAllComandas();
        const term = searchTerm.toLowerCase().trim();

        return comandas.filter(comanda =>
            comanda.nome_cliente.toLowerCase().includes(term)
        );
    }

    // Obter estatísticas do dia
    async getStatsHoje() {
        const comandas = await this.getAllComandas();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicioHoje = hoje.getTime();

        const comandasHoje = comandas.filter(c => c.data_hora >= inicioHoje);
        const comandasAbertas = comandasHoje.filter(c => c.status === 'aberta');
        const comandasPagas = comandasHoje.filter(c => c.status === 'paga');

        const totalDia = comandasPagas.reduce((sum, c) => sum + c.total, 0);

        return {
            abertas: comandasAbertas.length,
            totalDia: totalDia,
            comandasHoje: comandasHoje.length,
            pagas: comandasPagas.length
        };
    }
}

// Instância global do banco
const db = new Database();
