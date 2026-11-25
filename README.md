# Festival Noite Dourada 2026 — Gerenciador de Ingressos

Aplicação mobile/web desenvolvida em **React Native (Expo)** e **TypeScript** integrada ao **Supabase** para gerenciamento de lotes, vendas de ingressos e controle financeiro do evento **Festival Noite Dourada 2026**.

## Funcionalidades

### Bilheteria (Comprador)
* Visualização de lotes disponíveis, preços unitários e quantidade restante em tempo real.
* Seleção de lote e quantidade com cálculo prévio do valor total da compra.
* Finalização da compra com registro automático da transação e baixa imediata no estoque disponível.

### Acesso Administrativo (Login e Cadastro)
* Tela de login autenticando usuários e senhas diretamente na tabela `admins` do Supabase.
* Tela de cadastro de novos administradores com validação de campos, tamanho mínimo de senha, confirmação de senha e verificação de usuário duplicado.
* Botão de saída para retornar rapidamente ao painel da bilheteria.

### Painel Administrativo
* **Resumo financeiro:** exibição de **Total Arrecadado** e **Saldo Financeiro Parado** (ingressos disponíveis multiplicados pelo preço unitário).
* **Cadastro de lotes:** criação de novos lotes/tipos de ingresso com nome, preço unitário e quantidade inicial.
* **Lançamento manual de vendas:** registro de vendas pelo administrador com atualização automática do estoque e dos totais financeiros.
* **Detalhamento por lote:** acompanhamento de vendidos, disponíveis e saldo parado de cada lote.

## Identidade Visual e Interface
* Paleta temática de Ano Novo combinando branco, dourado, tons rosados suaves e cinza claro.
* Textos de interface padronizados em caixa alta para facilitar a leitura.

## Tecnologias Utilizadas
* **React Native** + **Expo**
* **TypeScript**
* **Supabase** (banco de dados PostgreSQL e API cliente)

## Estrutura do Banco de Dados (Supabase)
* **`lotes`**: `id`, `nome`, `preco`, `quantidade_inicial`, `quantidade_disponivel`
* **`vendas`**: `id`, `lote_id`, `quantidade_vendida`, `valor_total`, `created_at`
* **`admins`**: `id`, `usuario`, `senha`, `created_at`

## Como Executar o Projeto

1. Clone o repositório:
   ```bash
  git clone [https://github.com/BrigidaPimentel/gerenciador-de-ingressos.git](https://github.com/BrigidaPimentel/gerenciador-de-ingressos.git)
