# Backend do Study BI

Este é o serviço de backend para a aplicação Study BI, desenvolvido em Go.

## Visão Geral da Arquitetura

O backend segue uma estrutura de projeto Go padrão:

- **/cmd/api**: Contém o ponto de entrada da nossa aplicação (`main.go`). É responsável por inicializar o servidor, configurar as rotas e iniciar os serviços.
- **/internal**: Contém a lógica de negócio principal da aplicação. O código aqui dentro não pode ser importado por outros projetos, garantindo um forte encapsulamento.

## Como Começar

### Pré-requisitos

- Go (versão 1.21 ou superior)

### Passos

1.  **Navegue até o diretório do backend:**
    ```sh
    cd backend
    ```

2.  **Instale as dependências:**
    ```sh
    go mod tidy
    ```

3.  **Execute o servidor:**
    ```sh
    go run ./cmd/api
    ```

O servidor estará disponível em `http://localhost:4000`.
