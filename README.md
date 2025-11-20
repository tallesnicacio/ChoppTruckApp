# 🍺 Chopp Truck App

Sistema de comandas offline-first para food trucks de chopp/cerveja. PWA (Progressive Web App) rápido, simples e instalável.

## ✨ Funcionalidades

### Gestão de Comandas
- ✅ Criar nova comanda com nome do cliente e mesa (opcional)
- ✅ Listagem de comandas abertas e fechadas
- ✅ Busca rápida por nome do cliente
- ✅ Visualização de estatísticas (comandas abertas e faturamento do dia)

### Operação de Venda
- ✅ Catálogo visual de produtos em cards coloridos
- ✅ One-tap add: clique no produto adiciona 1 unidade instantaneamente
- ✅ Badge de quantidade em tempo real nos produtos
- ✅ Resumo do pedido com possibilidade de remover itens
- ✅ Cálculo automático do total

### Fechamento
- ✅ Conferência detalhada dos itens
- ✅ Seleção de forma de pagamento (Pix, Dinheiro, Cartão)
- ✅ Registro de comandas pagas com timestamp

### Gestão de Produtos
- ✅ Cadastro de produtos (nome, preço, cor do card)
- ✅ Edição rápida de produtos
- ✅ Exclusão de produtos
- ✅ 5 produtos pré-cadastrados para começar

### PWA e UX
- ✅ Funciona 100% offline (IndexedDB)
- ✅ Instalável na tela inicial (Android/iOS)
- ✅ Wake Lock: tela não apaga durante uso
- ✅ Feedback tátil (vibração)
- ✅ Notificações toast
- ✅ Animações suaves
- ✅ Design mobile-first

## 🚀 Como Usar

### Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/tallesnicacio/ChoppTruckApp.git
cd ChoppTruckApp
```

2. Sirva os arquivos com um servidor HTTP simples:

**Opção 1: Python**
```bash
python3 -m http.server 8000
```

**Opção 2: Node.js (http-server)**
```bash
npx http-server -p 8000
```

**Opção 3: PHP**
```bash
php -S localhost:8000
```

3. Abra no navegador:
```
http://localhost:8000
```

### Instalação no Celular

1. Acesse o app pelo navegador (Chrome/Safari)
2. Toque no menu do navegador (⋮)
3. Selecione "Adicionar à tela inicial" ou "Instalar app"
4. O ícone aparecerá na tela inicial como um app nativo

## 📱 Fluxo de Uso

1. **Abrir o app** → Vê listagem de comandas
2. **Criar comanda** → Botão "+" → Informar nome do cliente
3. **Adicionar produtos** → Clicar nos cards dos produtos
4. **Revisar pedido** → Ver resumo em tempo real
5. **Fechar comanda** → Conferir → Selecionar pagamento → Confirmar
6. **Comanda paga** → Aparece na aba "Fechadas"

## 🗂️ Estrutura do Projeto

```
BeerTruckApp/
├── index.html              # Página principal (single page)
├── styles.css              # Estilos responsivos
├── app.js                  # Lógica principal
├── db.js                   # Wrapper do IndexedDB
├── service-worker.js       # Service Worker (offline)
├── manifest.json           # Configuração PWA
├── icon-192.png            # Ícone 192x192
├── icon-512.png            # Ícone 512x512
├── generate-icons.py       # Script para gerar ícones
└── README.md               # Este arquivo
```

## 💾 Banco de Dados

### IndexedDB - Object Stores

**produtos**
```javascript
{
  id: 1,                    // Auto-increment
  nome: "Chopp Pilsen",
  preco: 12.00,
  cor: "#FF6B6B"
}
```

**comandas**
```javascript
{
  id: 1,                    // Auto-increment
  nome_cliente: "Talles",
  mesa: "5",               // Opcional
  status: "aberta",        // "aberta" | "paga"
  itens: [
    {
      produto_id: 1,
      nome: "Chopp Pilsen",
      preco: 12.00,
      quantidade: 3
    }
  ],
  total: 36.00,
  data_hora: 1700000000000,
  forma_pagamento: "pix"   // null | "pix" | "dinheiro" | "cartao"
}
```

## 🎨 Customização

### Alterar Cores

Edite as variáveis CSS em `styles.css`:

```css
:root {
    --primary-color: #FFA500;      /* Cor principal */
    --secondary-color: #4ECDC4;    /* Cor secundária */
    --success-color: #2ECC71;      /* Verde (total) */
    --danger-color: #E74C3C;       /* Vermelho (remover) */
}
```

### Alterar Produtos Iniciais

Edite a função `seedProdutos()` em `db.js`:

```javascript
const produtosIniciais = [
    { nome: 'Seu Produto', preco: 10.00, cor: '#FF6B6B' },
    // Adicione mais produtos aqui
];
```

### Alterar Ícones

Substitua os arquivos `icon-192.png` e `icon-512.png` por suas próprias imagens, ou edite o script `generate-icons.py` e execute:

```bash
python3 generate-icons.py
```

## 🔧 Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos com variáveis e grid/flexbox
- **JavaScript (Vanilla)** - Lógica sem dependências
- **IndexedDB** - Banco de dados local
- **Service Worker** - Cache e offline
- **Web APIs**:
  - Wake Lock API (manter tela ativa)
  - Vibration API (feedback tátil)
  - Web App Manifest (instalação)

## 📊 Compatibilidade

- ✅ Chrome/Edge (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (Android/Desktop)
- ⚠️ Wake Lock pode não funcionar em todos os navegadores (fallback silencioso)

## 🐛 Troubleshooting

### App não instala
- Certifique-se de estar usando HTTPS (ou localhost)
- Verifique se o manifest.json está acessível
- Tente limpar o cache do navegador

### Dados não persistem
- Verifique se o IndexedDB não está bloqueado
- Limpe dados antigos: DevTools → Application → IndexedDB → Deletar

### Service Worker não registra
- Verifique o console do navegador
- Certifique-se de que todos os arquivos do cache existem
- Atualize a versão do cache em `service-worker.js`

## 🚀 Deploy

### GitHub Pages

1. Faça push para o repositório
2. Vá em Settings → Pages
3. Selecione branch `main` e pasta `/root`
4. Acesse: `https://tallesnicacio.github.io/ChoppTruckApp/`

### Netlify / Vercel

1. Conecte o repositório
2. Configure build:
   - Build command: (vazio)
   - Publish directory: `/`
3. Deploy!

## 📝 Roadmap (Futuras Melhorias)

- [ ] Relatórios de vendas (diário, semanal, mensal)
- [ ] Exportar dados para CSV/PDF
- [ ] Modo escuro
- [ ] Editar comanda fechada
- [ ] Múltiplos usuários/garçons
- [ ] Impressão de comanda
- [ ] Integração com impressora térmica
- [ ] Dashboard de métricas

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

## 👨‍💻 Autor

Desenvolvido para uso em food trucks.

**Repositório**: https://github.com/tallesnicacio/ChoppTruckApp

---

**⭐ Se este projeto foi útil, deixe uma estrela no GitHub!**
