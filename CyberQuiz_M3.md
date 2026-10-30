# CyberQuiz — M3
## Passo 7: Modelo físico — DDL no PostgreSQL

**Projeto:** CyberQuiz  
**Base:** modelo lógico definido no M2  
**SGBD:** PostgreSQL

---

## 1. Objetivo

Implementar o modelo lógico do CyberQuiz em PostgreSQL, criando tabelas, tipos de dados, chaves primárias, chaves estrangeiras e restrições de integridade.

## 2. Script DDL

O script abaixo pode ser executado em um banco PostgreSQL vazio. Ele cria as tabelas na ordem necessária para que as chaves estrangeiras funcionem.

```sql
-- CyberQuiz - M3
-- Modelo físico PostgreSQL

CREATE TABLE categoria (
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE fonte (
    id_fonte INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao VARCHAR(250) NOT NULL,
    url TEXT
);

CREATE TABLE publicador (
    id_publicador INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

CREATE TABLE idioma (
    id_idioma INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE pergunta (
    id_pergunta INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enunciado TEXT NOT NULL,
    id_categoria INTEGER NOT NULL,
    id_fonte INTEGER NOT NULL,
    id_publicador INTEGER NOT NULL,
    id_idioma INTEGER NOT NULL,

    CONSTRAINT fk_pergunta_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria (id_categoria),

    CONSTRAINT fk_pergunta_fonte
        FOREIGN KEY (id_fonte)
        REFERENCES fonte (id_fonte),

    CONSTRAINT fk_pergunta_publicador
        FOREIGN KEY (id_publicador)
        REFERENCES publicador (id_publicador),

    CONSTRAINT fk_pergunta_idioma
        FOREIGN KEY (id_idioma)
        REFERENCES idioma (id_idioma)
);

CREATE TABLE alternativa (
    id_alternativa INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pergunta INTEGER NOT NULL,
    identificador VARCHAR(20) NOT NULL,
    texto TEXT NOT NULL,

    CONSTRAINT fk_alternativa_pergunta
        FOREIGN KEY (id_pergunta)
        REFERENCES pergunta (id_pergunta)
        ON DELETE CASCADE,

    CONSTRAINT uq_alternativa_identificador
        UNIQUE (id_pergunta, identificador)
);

CREATE TABLE jogador (
    id_jogador INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL
);

-- Índices auxiliares para consultas por relacionamento.
CREATE INDEX idx_pergunta_categoria ON pergunta (id_categoria);
CREATE INDEX idx_pergunta_fonte ON pergunta (id_fonte);
CREATE INDEX idx_pergunta_publicador ON pergunta (id_publicador);
CREATE INDEX idx_pergunta_idioma ON pergunta (id_idioma);
CREATE INDEX idx_alternativa_pergunta ON alternativa (id_pergunta);
```

## 3. Decisões físicas

- `INTEGER GENERATED ALWAYS AS IDENTITY` gera identificadores numéricos automaticamente.
- `TEXT` permite armazenar enunciados e textos de alternativas sem fixar um limite curto.
- `NOT NULL` implementa os dados obrigatórios definidos no M2.
- `UNIQUE` impede nomes de categoria repetidos, nomes de idioma repetidos, códigos de idioma repetidos e e-mails duplicados.
- As chaves estrangeiras garantem que cada pergunta esteja ligada a registros existentes de categoria, fonte, publicador e idioma.
- `ON DELETE CASCADE` em `alternativa` permite excluir as alternativas quando a pergunta correspondente for excluída. Essa é uma decisão de implementação para evitar alternativas órfãs; se a política de exclusão da disciplina for diferente, remova essa cláusula.
- A restrição `UNIQUE (id_pergunta, identificador)` impede que a mesma pergunta tenha duas alternativas com o mesmo rótulo, sem impedir que perguntas diferentes usem os mesmos rótulos.
- Não existe limite fixo de duas alternativas.
- Não foi criada regra de “exatamente uma alternativa correta”, porque ela não aparece no M1 fornecido.

## 4. Relação entre requisito e restrição

| Regra do M1/M2 | Implementação |
|---|---|
| Cada pergunta tem categoria | `pergunta.id_categoria NOT NULL` + FK |
| Cada pergunta tem fonte | `pergunta.id_fonte NOT NULL` + FK |
| Cada pergunta tem publicador | `pergunta.id_publicador NOT NULL` + FK |
| Cada pergunta tem idioma | `pergunta.id_idioma NOT NULL` + FK |
| Cada alternativa pertence a uma pergunta | `alternativa.id_pergunta NOT NULL` + FK |
| Alternativas em quantidade variável | tabela separada `alternativa` |
| Impedir identificadores repetidos na mesma pergunta | `UNIQUE (id_pergunta, identificador)` |
| Evitar duplicidade de categoria | `UNIQUE (categoria.nome)` |
| Cadastro/login de jogadores | tabela `jogador`; e-mail único e hash obrigatório |

## 5. Como executar

1. Abra o pgAdmin ou outro cliente PostgreSQL.
2. Crie ou selecione um banco de dados para o projeto.
3. Abra a ferramenta de consulta SQL.
4. Cole o script da seção 2 e execute.
5. Atualize a lista de tabelas e confirme a criação de `categoria`, `fonte`, `publicador`, `idioma`, `pergunta`, `alternativa` e `jogador`.

## 6. Limites conhecidos

Este script implementa o modelo definido a partir do M1. Ele não implementa telas, autenticação de aplicação, recuperação de senha, histórico de respostas, pontuação, ranking ou comunicação entre usuários, pois essas funcionalidades não fazem parte do escopo informado.
