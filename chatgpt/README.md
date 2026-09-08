# Configuração dos GPTs

Esta pasta contém os ficheiros que devem ser copiados para o editor de GPTs do ChatGPT.

## Admin Restaurante

- `admin-restaurante/instructions.md`: conteúdo do campo **Instructions**.
- `admin-restaurante/openapi.json`: schema da Action que lista e altera apenas os pratos ativos das diárias.

Configuração recomendada:

- **Name:** `Admin das Diárias`
- **Description:** `Mostra os pratos ativos e permite adicionar ou retirar pratos das diárias.`
- **Conversation starter:** `Mostrar pratos ativos`
- **Authentication:** None

## Mensagem das Diárias

- `mensagem-diarias/instructions.md`: conteúdo do campo **Instructions**.
- `mensagem-diarias/openapi.json`: conteúdo do campo **Actions → Schema**.

As API Routes usadas por estes schemas permanecem em `src/app/api/ai/`.
