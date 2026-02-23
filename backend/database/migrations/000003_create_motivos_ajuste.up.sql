CREATE TABLE IF NOT EXISTS motivos_ajuste (
                                              id         SERIAL PRIMARY KEY,
                                              descricao  VARCHAR(100) UNIQUE NOT NULL,
    ativo      BOOLEAN   DEFAULT TRUE,
    criado_em  TIMESTAMP DEFAULT NOW()
    );

INSERT INTO motivos_ajuste (descricao) VALUES
                                           ('Esquecimento'),
                                           ('Consulta Médica'),
                                           ('Day Off');