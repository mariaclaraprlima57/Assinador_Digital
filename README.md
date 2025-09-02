Assinador Digital Web
1. Visão Geral do Projeto
Este projeto é uma aplicação web full-stack desenvolvida para a criação e verificação de assinaturas digitais. O sistema foi projetado para garantir os três pilares fundamentais da segurança da informação em assinaturas digitais: Integridade, Autenticidade e Não-repúdio.

A aplicação permite que usuários se cadastrem (gerando um par de chaves criptográficas), assinem digitalmente qualquer texto e verifiquem a validade de qualquer assinatura gerada pelo sistema.

2. Tecnologias Utilizadas
Frontend: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS.

Backend: Node.js, Express.js.

Banco de Dados: SQLite.

Bibliotecas Criptográficas e de Suporte:

crypto (módulo nativo do Node.js) para operações RSA e SHA-256.

bcryptjs para hashing de senhas.

sqlite3 como driver do banco de dados.

uuid para geração de IDs únicos.

cors para segurança da API.

3. Como Rodar o Projeto
Siga os passos abaixo para executar a aplicação em um ambiente local.

Pré-requisitos
Ter o Node.js (versão 16 ou superior) instalado.

Passos para Execução
Clone ou baixe este repositório:

git clone <url-do-seu-repositorio>
cd <nome-da-pasta-do-projeto>

Instale as dependências do projeto:
Abra um terminal na pasta raiz do projeto e execute o comando:

npm install

Inicie o servidor:
Ainda no terminal, execute o comando:

node server.js

Você deverá ver a mensagem Servidor rodando na porta 3000 no console.

Acesse a aplicação:
Abra seu navegador e acesse o seguinte endereço:
http://localhost:3000

4. Estrutura da API (Endpoints)
A API segue o padrão RESTful. Todas as rotas estão sob o prefixo /api.

POST /api/register
Descrição: Cadastra um novo usuário e gera seu par de chaves (pública/privada).

Request Body (Exemplo):

{
    "username": "meu_usuario",
    "password": "uma_senha_forte"
}

Success Response (200 OK):

{
    "message": "Usuário criado com sucesso!",
    "userId": 1
}

Error Response (400 Bad Request):

{
    "error": "Usuário já existe."
}

POST /api/sign
Descrição: Assina um texto utilizando a chave privada do usuário.

Request Body (Exemplo):

{
    "userId": 1,
    "password": "uma_senha_forte",
    "textToSign": "Este é o documento que eu quero assinar."
}

Success Response (200 OK):

{
    "message": "Texto assinado com sucesso!",
    "signatureId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
}

Error Response (401 Unauthorized):

{
    "error": "Senha incorreta."
}

GET /api/verify/:id
Descrição: Verifica a validade de uma assinatura a partir do seu ID.

URL Parameter: :id é o UUID da assinatura.

Success Response (200 OK - Válida):

{
    "status": "VÁLIDA",
    "signatory": "meu_usuario",
    "signed_at": "2025-09-02 11:30:00"
}

Success Response (200 OK - Inválida):

{
    "status": "INVÁLIDA"
}

Error Response (404 Not Found):

{
    "error": "Assinatura não encontrada."
}

POST /api/user/signatures
Descrição: Lista todas as assinaturas de um usuário após autenticação.

Request Body (Exemplo):

{
    "username": "meu_usuario",
    "password": "uma_senha_forte"
}

Success Response (200 OK):

[
    {
        "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "original_text": "Este é o documento que eu quero assinar.",
        "created_at": "2025-09-02 11:30:00"
    },
    {
        "id": "f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c",
        "original_text": "Outro documento importante.",
        "created_at": "2025-09-02 11:35:15"
    }
]

5. Dump do Banco de Dados
O projeto utiliza SQLite. A grande vantagem é que o banco de dados inteiro está contido em um único arquivo: assinaturas.db.

Como funciona: Este arquivo é criado automaticamente na pasta raiz do projeto na primeira vez que o servidor é iniciado e uma operação de banco de dados é realizada.

Dump: O próprio arquivo assinaturas.db serve como o "dump" do banco. Para entregar o projeto com dados de exemplo, basta incluir este arquivo no repositório. Qualquer pessoa que clonar o projeto e rodá-lo já terá acesso aos dados pré-existentes.