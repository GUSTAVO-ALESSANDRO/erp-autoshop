-- SCRIPT DE POPULAÇÃO DE BANCO DE DADOS - AUTOSHOP ERP

-- Limpeza de dados, resetando os dados do banco de dados, excluindo tudo o que existia e populando novamente
TRUNCATE TABLE service_order_employees, service_order_items, service_orders, stock_movements, products, users RESTART IDENTITY CASCADE;

-- INSERÇÃO DE USUÁRIOS

-- Criação de 5 Admins
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Carlos Mendes', 'carlos.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW()),
('a0000000-0000-0000-0000-000000000002', 'Fernanda Lima', 'fernanda.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW()),
('a0000000-0000-0000-0000-000000000003', 'Roberto Justino', 'roberto.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW()),
('a0000000-0000-0000-0000-000000000004', 'Patricia Almeida', 'patricia.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW()),
('a0000000-0000-0000-0000-000000000005', 'Ricardo Barbosa', 'ricardo.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW());

-- Criação de 8 Funcionários
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'Marcos Oliveira', 'marcos.mecanico@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000002', 'João Silva', 'joao.eletrica@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000003', 'Lucas Ribeiro', 'lucas.funilaria@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000004', 'Pedro Santos', 'pedro.borracha@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000005', 'Juliano Souza', 'juliano.pintura@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000006', 'USUÁRIO REAL', 'gualessandro2017@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000007', 'Rodrigo Teixeira', 'rodrigo.mecanica@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000008', 'Andreia Fonseca', 'andreia.atendimento@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW());

-- Criação de 15 Clientes
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'Ana Paula Silveira', 'ana.silveira@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000002', 'Bruno Henrique Santos', 'bruno.santos@yahoo.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000003', 'Camila Rodrigues', 'camila.rodrigues@hotmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000004', 'Diego Souza Oliveira', 'diego.oliveira@outlook.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000005', 'Eduarda Ferreira', 'eduarda.ferreira@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000006', 'Felipe Nunes Castro', 'felipe.castro@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000007', 'Gabriela Martins', 'gabriela.martins@yahoo.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000008', 'Henrique Cardoso', 'henrique.cardoso@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000009', 'Isabela Rocha', 'isabela.rocha@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000010', 'Joaquim Barbosa', 'joaquim.barbosa@hotmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000011', 'Karen Freitas', 'karen.freitas@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000012', 'Leonardo Lima', 'leonardo.lima@yahoo.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000013', 'Mariana Peixoto', 'mariana.peixoto@outlook.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000014', 'Nicolas Santos', 'nicolas.santos@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000015', 'Olivia Monteiro', 'olivia.monteiro@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW());

-- INSERÇÃO DE 15 PRODUTOS
INSERT INTO products (id, name, description, cost_price, sell_price, current_stock, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Amortecedor Dianteiro', 'Amortecedor pressurizado desenvolvido para alta performance e durabilidade. Garante estabilidade superior em curvas e absorção eficiente de impactos severos. Compatível com diversos modelos de veículos nacionais e importados de linha leve.', 180.00, 320.00, 20, true, NOW()),
('00000000-0000-0000-0000-000000000002', 'Pastilha de Freio Cerâmica', 'Jogo de pastilhas dianteiras fabricadas com composto cerâmico avançado. Oferece frenagem progressiva e segura sem emitir ruídos indesejados. Reduz drasticamente o acúmulo de fuligem nas rodas e possui alta resistência térmica.', 90.00, 170.00, 35, true, NOW()),
('00000000-0000-0000-0000-000000000003', 'Óleo Sintético 5W30', 'Lubrificante 100% sintético de última geração para motores modernos a gasolina e flex. Protege contra o desgaste prematuro em partidas a frio e reduz o consumo de combustível. Mantém a limpeza interna do motor impedindo a formação de borras e depósitos nocivos.', 35.00, 65.00, 100, true, NOW()),
('00000000-0000-0000-0000-000000000004', 'Filtro de Óleo do Motor', 'Filtro blindado de alta eficiência para retenção de impurezas e partículas metálicas. Assegura que o lubrificante circule limpo e com vazão ideal por todo o sistema. Recomendado para trocas periódicas conforme o manual do fabricante do automóvel.', 20.00, 45.00, 50, true, NOW()),
('00000000-0000-0000-0000-000000000005', 'Vela de Ignição Iridium', 'Jogo com 4 velas de ignição com eletrodo central em liga de Iridium. Proporciona centelha mais estável, melhorando a queima de combustível e a potência. Possui vida útil estendida e garante partidas rápidas em quaisquer condições climáticas.', 120.00, 240.00, 15, true, NOW()),
('00000000-0000-0000-0000-000000000006', 'Disco de Freio Ventilado', 'Par de discos de freio dianteiros ventilados com tratamento anticorrosivo. Garante excelente dissipação de calor em frenagens severas e continuadas.', 140.00, 260.00, 25, true, NOW()),
('00000000-0000-0000-0000-000000000007', 'Filtro de Ar do Motor', 'Elemento filtrante de alta capacidade de retenção de poeira e micropartículas. Otimiza o fluxo de ar para a câmara de combustão.', 25.00, 55.00, 40, true, NOW()),
('00000000-0000-0000-0000-000000000008', 'Filtro de Ar Condicionado (Cabine)', 'Filtro purificador com camada de carvão ativado. Elimina maus odores e bloqueia pólens e bactérias do sistema de ventilação.', 30.00, 60.00, 30, true, NOW()),
('00000000-0000-0000-0000-000000000009', 'Aditivo de Radiador Orgânico', 'Fluido concentrado com tecnologia orgânica anticorrosiva. Eleva o ponto de ebulição e evita o congelamento do sistema de arrefecimento.', 18.00, 40.00, 60, true, NOW()),
('00000000-0000-0000-0000-000000000010', 'Bateria Automotiva 60Ah', 'Bateria livre de manutenção com liga de prata de alta partida a frio (CCA). Indicada para veículos com elevado consumo elétrico.', 280.00, 480.00, 12, true, NOW()),
('00000000-0000-0000-0000-000000000011', 'Palheta Limpadora de Para-brisa', 'Par de palhetas de silicone flexíveis tipo Flat Blade. Proporcionam varredura silenciosa e sem riscos no vidro dianteiro.', 35.00, 75.00, 45, true, NOW()),
('00000000-0000-0000-0000-000000000012', 'Correia Dentada de Distribuição', 'Correia HNBR reforçada com fibra de vidro para sincronismo do motor. Alta resistência a tração, temperatura e abrasão mecânica.', 60.00, 130.00, 18, true, NOW()),
('00000000-0000-0000-0000-000000000013', 'Tensor da Correia Dentada', 'Polia tensionadora com rolamento selado de alta precisão. Mantém a tensão ideal da correia prevenindo saltos de dente.', 75.00, 150.00, 15, true, NOW()),
('00000000-0000-0000-0000-000000000014', 'Fluido de Freio DOT 4', 'Fluido sintético de alta estabilidade térmica para sistemas de freio hidráulico e embreagem. Ponto de ebulição elevado.', 15.00, 35.00, 70, true, NOW()),
('00000000-0000-0000-0000-000000000015', 'Lâmpada Super Branca H7', 'Par de lâmpadas halógenas de alta eficiência luminosa. Melhora a visibilidade noturna com feixe de luz mais denso.', 45.00, 95.00, 72, true, NOW());

-- MOVIMENTAÇÕES DE ESTOQUE INICIAL
INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason, created_at) VALUES 
('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ENTRADA', 20, 20, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'ENTRADA', 35, 35, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'ENTRADA', 100, 100, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'ENTRADA', 50, 50, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'ENTRADA', 15, 15, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'ENTRADA', 25, 25, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'ENTRADA', 40, 40, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 'ENTRADA', 30, 30, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 'ENTRADA', 60, 60, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'ENTRADA', 12, 12, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'ENTRADA', 45, 45, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'ENTRADA', 18, 18, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', 'ENTRADA', 15, 15, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', 'ENTRADA', 50, 50, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', 'ENTRADA', 22, 22, 'Estoque inicial de cadastro', NOW()),
('90000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000015', 'ENTRADA', 40, 62, 'Estoque para deleção posterior', NOW()),
('90000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000014', 'ENTRADA', 30, 80, 'Estoque para alteração posterior', NOW()),
('90000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000014', 'SAIDA', 10, 70, 'Estoque para alteração posterior', NOW()),
('90000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000015', 'ENTRADA', 10, 72, 'Estoque para deleção posterior', NOW()),
('90000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000015', 'SAIDA', 2, 70, 'Estoque para deleção posterior', NOW());

-- INSERÇÃO DE OS
-- OS 01 a 05 - Sem produtos e Sem funcionários

-- OS 1
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000001', 'OS-2026-001', 'c0000000-0000-0000-0000-000000000001', 'Chevrolet', 'Onix', '2021', 'Diagnóstico de barulho na suspensão', 'Cliente relata estalo agudo ao esterçar o volante totalmente para a esquerda. Necessário realizar teste de rodagem na pista de testes e checar batentes da suspensão. Verificar também se há folgas na caixa de direção e terminais de articulação.', 'ORCAMENTO', 150.00, 0.00, 150.00, NOW());

-- OS 2
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000002', 'OS-2026-002', 'c0000000-0000-0000-0000-000000000002', 'Volkswagen', 'Gol', '2015', 'Revisão Geral Preventiva', 'Mutirão completo de verificação cobrindo sistemas mecânicos, elétricos e de carroceria. Equipe multidisciplinar empenhada em identificar desgastes ocultos antes de viagens longas. Gerar relatório detalhado com prioridades de substituição de componentes para o cliente.', 'ORCAMENTO', 400.00, 50.00, 350.00, NOW());

-- OS 3
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000003', 'OS-2026-003', 'c0000000-0000-0000-0000-000000000003', 'Fiat', 'Palio', '2012', 'Troca de óleo simples', 'Execução de troca simples de óleo lubrificante do motor e substituição do elemento filtrante. Inspeção visual rápida de mangueiras, nível de fluido de freio e calibragem dos pneus. Procedimento padrão para assegurar a vida útil prolongada do propulsor do veículo.', 'ORCAMENTO', 80.00, 0.00, 80.00, NOW());

-- OS 4
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000004', 'OS-2026-004', 'c0000000-0000-0000-0000-000000000004', 'Toyota', 'Corolla', '2022', 'Orçamento de funilaria para-choque', 'Avaliação de pequeno ralado e amassado na lateral do para-choque dianteiro direito. Orçamento contempla serviços de lanternagem, aplicação de massa niveladora e pintura total. Aguardando aprovação prévia do cliente para início dos procedimentos na cabine.', 'ORCAMENTO', 300.00, 0.00, 300.00, NOW());

-- OS 5
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000005', 'OS-2026-005', 'c0000000-0000-0000-0000-000000000005', 'Ford', 'Ka', '2019', 'Diagnóstico de luz de injeção', 'Veículo acendeu a luz de injeção no painel e apresenta engasgos em marcha lenta. Necessário passar scanner automotivo para leitura dos códigos de falha armazenados na ECU.', 'APROVADO', 120.00, 0.00, 120.00, NOW());

-- OS 06 a 10 - Apenas PRODUTOS adicionadoS, sem funcionários alocados

-- OS 6
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000006', 'OS-2026-006', 'c0000000-0000-0000-0000-000000000006', 'Honda', 'Civic', '2018', 'Troca de pastilhas e óleo', 'Manutenção periódica corretiva englobando substituição de pastilhas de freio gastas. Incluso também troca completa do óleo sintético e do filtro de óleo do motor. Testes finais em dinamômetro e pista para validação da eficiência de parada.', 'APROVADO', 200.00, 20.00, 655.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 1, 90.00, 170.00),
('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 4, 35.00, 65.00),
('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 1, 20.00, 45.00);

-- OS 7
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000007', 'OS-2026-007', 'c0000000-0000-0000-0000-000000000007', 'Hyundai', 'HB20', '2020', 'Revisão de freios e ignição', 'Troca preventivas dos componentes de ignição e discos dianteiros.', 'EM_EXECUCAO', 180.00, 10.00, 930.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', 1, 120.00, 240.00),
('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', 2, 140.00, 260.00);

-- OS 8
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000008', 'OS-2026-008', 'c0000000-0000-0000-0000-000000000008', 'Renault', 'Sandero', '2016', 'Substituição de Bateria e Lâmpadas', 'Instalação de bateria nova e substituição do par de lâmpadas do farol alto.', 'CONCLUIDO', 80.00, 0.00, 655.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000010', 1, 280.00, 480.00),
('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000015', 1, 45.00, 95.00);

-- OS 9
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000009', 'OS-2026-009', 'c0000000-0000-0000-0000-000000000009', 'Jeep', 'Renegade', '2021', 'Troca de Correia Dentada e Tensor', 'Manutenção preventiva dos componentes de sincronismo do motor.', 'CANCELADO', 250.00, 0.00, 530.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000012', 1, 60.00, 130.00),
('60000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000013', 1, 75.00, 150.00);

-- OS 10
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000010', 'OS-2026-010', 'c0000000-0000-0000-0000-000000000010', 'Nissan', 'Kicks', '2019', 'Higienização de Ar e Filtro de Cabine', 'Limpeza do sistema de ar-condicionado e substituição do elemento purificador.', 'CONCLUIDO', 90.00, 0.00, 150.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008', 1, 30.00, 60.00);

-- OS 11 a 15 Apenas FUNCIONÁRIOS alocados, sem produtos

-- OS 11
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000011', 'OS-2026-011', 'c0000000-0000-0000-0000-000000000011', 'Peugeot', '208', '2022', 'Alinhamento e Balanceamento 3D', 'Serviço de geometria computadorizada de suspensão e balanceamento das quatro rodas.', 'EM_EXECUCAO', 160.00, 0.00, 160.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000004');

-- OS 12
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000012', 'OS-2026-012', 'c0000000-0000-0000-0000-000000000012', 'Citroën', 'C4 Cactus', '2021', 'Reparo na fiação do farol auxiliar', 'Correção de curto-circuito e substituição do chicote elétrico avariado.', 'APROVADO', 220.00, 20.00, 200.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002');

-- OS 13
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000013', 'OS-2026-013', 'c0000000-0000-0000-0000-000000000013', 'Mitsubishi', 'L200', '2017', 'Polimento técnico e Martelinho de ouro', 'Remoção de pequenos amassados na porta traseira esquerda e polimento de lataria.', 'CONCLUIDO', 450.00, 50.00, 400.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003'),
('70000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000005');

-- OS 14
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000014', 'OS-2026-014', 'c0000000-0000-0000-0000-000000000014', 'Volkswagen', 'Polo', '2023', 'Revisão e limpeza de bicos injetores', 'Serviço de ultrassom e equalização da bancada de injetores.', 'ORCAMENTO', 200.00, 0.00, 200.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000006');

-- OS 15
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000015', 'OS-2026-015', 'c0000000-0000-0000-0000-000000000015', 'Chevrolet', 'Tracker', '2022', 'Sanitização e higienização interna', 'Limpeza detalhada de estofamentos e aplicação de ozônio no habitáculo.', 'CONCLUIDO', 250.00, 0.00, 250.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000008');


-- OS 16 a 20 com Produtos e Funcionários alocados

-- OS 16
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000016', 'OS-2026-016', 'c0000000-0000-0000-0000-000000000001', 'Jeep', 'Compass', '2022', 'Troca de amortecedores e pastilhas', 'Veículo posicionado no elevador hidráulico para intervenção completa na suspensão dianteira.', 'EM_EXECUCAO', 300.00, 50.00, 1060.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 2, 180.00, 320.00),
('60000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000002', 1, 90.00, 170.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001'),
('70000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000006');

-- OS 17
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000017', 'OS-2026-017', 'c0000000-0000-0000-0000-000000000002', 'Ford', 'EcoSport', '2018', 'Troca de Óleo e Filtros completa', 'Substituição do lubrificante e dos filtros de óleo, ar do motor e ar condicionado.', 'CONCLUIDO', 150.00, 0.00, 525.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000003', 4, 35.00, 65.00),
('60000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000004', 1, 20.00, 45.00),
('60000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000007', 1, 25.00, 55.00),
('60000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000008', 1, 30.00, 60.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000007');

-- OS 18
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000018', 'OS-2026-018', 'c0000000-0000-0000-0000-000000000003', 'Fiat', 'Toro', '2021', 'Revisão do Sistema de Arrefecimento', 'Troca de aditivo de radiador e substituição de mangueira reservatório.', 'APROVADO', 140.00, 10.00, 210.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000009', 2, 18.00, 40.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001');

-- OS 19
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000019', 'OS-2026-019', 'c0000000-0000-0000-0000-000000000004', 'Honda', 'HR-V', '2020', 'Manutenção Geral e Fluido de Freio', 'Substituição completa do fluido de freio DOT 4 e troca de palhetas limpadora.', 'EM_EXECUCAO', 150.00, 0.00, 260.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000011', 1, 35.00, 75.00),
('60000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000014', 1, 15.00, 35.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000006'),
('70000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000004');

-- OS 20
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000020', 'OS-2026-020', 'c0000000-0000-0000-0000-000000000005', 'Toyota', 'Yaris', '2021', 'Revisão dos 60.000km', 'Revisão de grande porte incluindo troca de velas Iridium, óleo do motor e filtros.', 'CONCLUIDO', 350.00, 30.00, 925.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
('60000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000003', 4, 35.00, 65.00),
('60000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000004', 1, 20.00, 45.00),
('60000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000005', 1, 120.00, 240.00),
('60000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000007', 1, 25.00, 55.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
('70000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001'),
('70000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000002'),
('70000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000006');