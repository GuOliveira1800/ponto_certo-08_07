CREATE TABLE IF NOT EXISTS pessoas (
                                       id            SERIAL PRIMARY KEY,
                                       nome          VARCHAR(100) NOT NULL,
    sobrenome     VARCHAR(100) NOT NULL,
    cpf           VARCHAR(14)  UNIQUE NOT NULL,
    dt_nascimento DATE         NOT NULL,
    criado_em     TIMESTAMP    DEFAULT NOW(),
    atualizado_em TIMESTAMP    DEFAULT NOW()
    );