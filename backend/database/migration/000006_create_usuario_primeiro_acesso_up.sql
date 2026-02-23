CREATE TABLE IF NOT EXISTS usuario_primeiro_acesso (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(150) UNIQUE NOT NULL,
    cargo         VARCHAR(100)        NOT NULL,
    departamento  VARCHAR(100)        NOT NULL,
    criado_em     TIMESTAMP           DEFAULT NOW(),
    primeiro_login_em TIMESTAMP       NULL
);

CREATE INDEX idx_usuario_primeiro_acesso_email ON usuario_primeiro_acesso(email);
