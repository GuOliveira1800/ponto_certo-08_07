CREATE TABLE IF NOT EXISTS registros_ponto (
                                               id                SERIAL PRIMARY KEY,
                                               usuario_id        INTEGER   NOT NULL REFERENCES usuarios(id),
    data_ponto        TIMESTAMP NOT NULL,
    ativo             BOOLEAN   DEFAULT TRUE,
    incluido_manual   BOOLEAN   DEFAULT FALSE,
    motivo_ajuste_id  INTEGER   REFERENCES motivos_ajuste(id),
    observacao        TEXT,
    criado_em         TIMESTAMP DEFAULT NOW(),
    atualizado_em     TIMESTAMP DEFAULT NOW()
    );

CREATE INDEX idx_registros_usuario_id ON registros_ponto(usuario_id);
CREATE INDEX idx_registros_data_ponto ON registros_ponto(data_ponto);