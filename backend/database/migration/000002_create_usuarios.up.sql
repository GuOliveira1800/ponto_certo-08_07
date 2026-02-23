CREATE TABLE IF NOT EXISTS usuarios (
                                        id            SERIAL PRIMARY KEY,
                                        pessoa_id     INTEGER      NOT NULL REFERENCES pessoas(id),
    google_id     VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    foto          VARCHAR(500),
    cargo         VARCHAR(100),
    departamento  VARCHAR(100),
    ativo         BOOLEAN      DEFAULT TRUE,
    criado_em     TIMESTAMP    DEFAULT NOW(),
    atualizado_em TIMESTAMP    DEFAULT NOW()
    );

CREATE INDEX idx_usuarios_pessoa_id ON usuarios(pessoa_id);
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);