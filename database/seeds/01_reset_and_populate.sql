-- SCRIPT DE POPULAÇÃO DE BANCO DE DADOS - AUTOSHOP ERP

-- Limpeza de dados, resetando os dados do banco de dados, excluindo todo o que existia e populando novamente
TRUNCATE TABLE service_order_employees, service_order_items, service_orders, stock_movements, products, users RESTART IDENTITY CASCADE;

-- INSERÇÃO DE USUÁRIOS (Senhas em hash bcrypt correspondentes a 'password123')

-- Criação de 3 Admins
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Carlos Mendes', 'carlos.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW()),
('a0000000-0000-0000-0000-000000000002', 'Fernanda Lima', 'fernanda.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW()),
('a0000000-0000-0000-0000-000000000003', 'Roberto Justino', 'roberto.admin@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'ADMIN', true, NOW());

-- Criação de 5 Funcionários
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'Marcos Oliveira', 'marcos.mecanico@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000002', 'João Silva', 'joao.eletrica@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000003', 'Lucas Ribeiro', 'lucas.funilaria@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000004', 'Pedro Santos', 'pedro.borracha@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW()),
('b0000000-0000-0000-0000-000000000005', 'Juliano Souza', 'juliano.pintura@autoshop.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'EMPLOYEE', true, NOW());

-- Criação de 8 Clientes
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'Ana Paula Silveira', 'ana.silveira@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000002', 'Bruno Henrique Santos', 'bruno.santos@yahoo.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000003', 'Camila Rodrigues', 'camila.rodrigues@hotmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000004', 'Diego Souza Oliveira', 'diego.oliveira@outlook.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000005', 'Eduarda Ferreira', 'eduarda.ferreira@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000006', 'Felipe Nunes Castro', 'felipe.castro@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000007', 'Gabriela Martins', 'gabriela.martins@yahoo.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW()),
('c0000000-0000-0000-0000-000000000008', 'Henrique Cardoso', 'henrique.cardoso@gmail.com', '$2b$10$2Dr4N.53EsM1ohGMA6e.neaeyBddXmQn7Kp8Ciz.NIURn0743g3ae', 'CUSTOMER', true, NOW());

-- Inserção de 5 PRODUTOS
INSERT INTO products (id, name, description, cost_price, sell_price, current_stock, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Amortecedor Dianteiro', 'Amortecedor pressurizado desenvolvido para alta performance e durabilidade.
Garante estabilidade superior em curvas e absorção eficiente de impactos severos.
Compatível com diversos modelos de veículos nacionais e importados de linha leve.', 180.00, 320.00, 20, true, NOW()),

('00000000-0000-0000-0000-000000000002', 'Pastilha de Freio Cerâmica', 'Jogo de pastilhas dianteiras fabricadas com composto cerâmico avançado.
Oferece frenagem progressiva e segura sem emitir ruídos indesejados.
Reduz drasticamente o acúmulo de fuligem nas rodas e possui alta resistência térmica.', 90.00, 170.00, 35, true, NOW()),

('00000000-0000-0000-0000-000000000003', 'Óleo Sintético 5W30', 'Lubrificante 100% sintético de última geração para motores modernos a gasolina e flex.
Protege contra o desgaste prematuro em partidas a frio e reduz o consumo de combustível.
Mantém a limpeza interna do motor impedindo a formação de borras e depósitos nocivos.', 35.00, 65.00, 100, true, NOW()),

('00000000-0000-0000-0000-000000000004', 'Filtro de Óleo do Motor', 'Filtro blindado de alta eficiência para retenção de impurezas e partículas metálicas.
Assegura que o lubrificante circule limpo e com vazão ideal por todo o sistema.
Recomendado para trocas periódicas conforme o manual do fabricante do automóvel.', 20.00, 45.00, 50, true, NOW()),

('00000000-0000-0000-0000-000000000005', 'Vela de Ignição Iridium', 'Jogo com 4 velas de ignição com eletrodo central em liga de Iridium.
Proporciona centelha mais estável, melhorando a queima de combustível e a potência.
Possui vida útil estendida e garante partidas rápidas em quaisquer condições climáticas.', 120.00, 240.00, 15, true, NOW());

-- Movimentações de estoque inicial correspondentes
INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason, created_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ENTRADA', 20, 20, 'Estoque inicial de cadastro', NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'ENTRADA', 35, 35, 'Estoque inicial de cadastro', NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'ENTRADA', 100, 100, 'Estoque inicial de cadastro', NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000004', 'ENTRADA', 50, 50, 'Estoque inicial de cadastro', NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'ENTRADA', 15, 15, 'Estoque inicial de cadastro', NOW());

-- INSERÇÃO DE 10 ORDENS DE SERVIÇO

-- OS 1: Apenas 1 funcionário (Marcos), sem produtos
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000001', 'OS-2026-001', 'c0000000-0000-0000-0000-000000000001', 'Chevrolet', 'Onix', '2021', 'Diagnóstico de barulho na suspensão', 
'Cliente relata estalo agudo ao esterçar o volante totalmente para a esquerda.
Necessário realizar teste de rodagem na pista de testes e checar batentes da suspensão.
Verificar também se há folgas na caixa de direção e terminais de articulação.', 'ORCAMENTO', 150.00, 0.00, 150.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');

-- OS 2: Os 3 funcionários alocados, sem produtos
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000002', 'OS-2026-002', 'c0000000-0000-0000-0000-000000000002', 'Volkswagen', 'Gol', '2015', 'Revisão Geral Preventiva', 
'Mutirão completo de verificação cobrindo sistemas mecânicos, elétricos e de carroceria.
Equipe multidisciplinar empenhada em identificar desgastes ocultos antes de viagens longas.
Gerar relatório detalhado com prioridades de substituição de componentes para o cliente.', 'ORCAMENTO', 400.00, 50.00, 350.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003');

-- OS 3: Começa com 1 funcionário e depois adiciona mais 1
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000003', 'OS-2026-003', 'c0000000-0000-0000-0000-000000000003', 'Fiat', 'Palio', '2012', 'Troca de óleo', 
'Execução de troca simples de óleo lubrificante do motor e substituição do elemento filtrante.
Inspeção visual rápida de mangueiras, nível de fluido de freio e calibragem dos pneus.
Procedimento padrão para assegurar a vida útil prolongada do propulsor do veículo.', 'ORCAMENTO', 80.00, 0.00, 80.00, NOW());

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001'),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004');

-- OS 4: Não tem produtos, sem funcionários
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000004', 'OS-2026-004', 'c0000000-0000-0000-0000-000000000004', 'Toyota', 'Corolla', '2022', 'Orçamento de funilaria para-choque', 
'Avaliação de pequeno ralado e amassado na lateral do para-choque dianteiro direito.
Orçamento contempla serviços de lanternagem, aplicação de massa niveladora e pintura total.
Aguardando aprovação prévia do cliente para início dos procedimentos na cabine.', 'ORCAMENTO', 300.00, 0.00, 300.00, NOW());

-- OS 5: Tem 3 produtos
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000005', 'OS-2026-005', 'c0000000-0000-0000-0000-000000000005', 'Honda', 'Civic', '2018', 'Troca de pastilhas e óleo', 
'Manutenção periódica corretiva englobando substituição de pastilhas de freio gastas.
Incluso também troca completa do óleo sintético e do filtro de óleo do motor.
Testes finais em dinamômetro e pista para validação da eficiência de parada.', 'ORCAMENTO', 200.00, 20.00, 655.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 1, 90.00, 170.00),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 4, 35.00, 65.00),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 1, 20.00, 45.00);

-- OS 6: Começa com 2 produtos e depois adiciona mais 3 produtos nela
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000006', 'OS-2026-006', 'c0000000-0000-0000-0000-000000000006', 'Hyundai', 'HB20', '2020', 'Revisão Completa Avançada', 
'Ordem aberta inicialmente com troca de amortecedores e pastilhas de freio dianteiras.
Posteriormente foram solicitados pelo cliente aditivos de óleo, filtro e velas de ignição.
Serviço multifacetado exigindo atenção redobrada aos torques especificados em manual.', 'ORCAMENTO', 350.00, 30.00, 1740.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 2, 180.00, 320.00),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 1, 90.00, 170.00),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 5, 35.00, 65.00),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 1, 20.00, 45.00),
(gen_random_uuid(), '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 1, 120.00, 240.00);

-- OS 7: Ordem de Serviço concluída
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000007', 'OS-2026-007', 'c0000000-0000-0000-0000-000000000007', 'Renault', 'Sandero', '2016', 'Troca de velas rápida', 
'Substituição do jogo completo de velas de ignição com verificação dos cabos de alta tensão.
Serviço executado com sucesso e veículo liberado para retirada no pátio de atendimento.
Cliente notificado automaticamente via e-mail corporativo sobre a conclusão do serviço.', 'CONCLUIDO', 120.00, 0.00, 360.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', 1, 120.00, 240.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002');

-- OS 8: Ordem de Serviço cancelada
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000008', 'OS-2026-008', 'c0000000-0000-0000-0000-000000000008', 'Jeep', 'Renegade', '2021', 'Orçamento recusado', 
'Cliente analisou a proposta comercial detalhada e optou por não realizar o reparo neste momento.
Ordem de serviço formalmente cancelada a pedido do proprietário via canal de atendimento.
Nenhum componente foi retirado do estoque nem houve execução de mão de obra.', 'CANCELADO', 100.00, 0.00, 100.00, NOW());

-- OS 9: Em andamento (EM_EXECUCAO)
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000009', 'OS-2026-009', 'c0000000-0000-0000-0000-000000000001', 'Jeep', 'Compass', '2022', 'Troca de amortecedores', 
'Veículo posicionado no elevador hidráulico número três para intervenção na suspensão.
Retirada dos componentes antigos danificados e preparação para montagem das peças novas.
Previsão de término estipulada para o final do turno vespertino de trabalho.', 'EM_EXECUCAO', 300.00, 50.00, 890.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 2, 180.00, 320.00);

INSERT INTO service_order_employees (id, os_id, employee_id) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001');

-- OS 10: Aprovada aguardando execução
INSERT INTO service_orders (id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, title, description, status, labor_cost, discount, total_amount, created_at) VALUES
('30000000-0000-0000-0000-000000000010', 'OS-2026-010', 'c0000000-0000-0000-0000-000000000002', 'Nissan', 'Kicks', '2019', 'Revisão de freios', 
'Orçamento aprovado via contato telefônico com o titular da conta cadastrada.
Peças separadas no almoxarifado e aguardando liberação da baia de reparos mecânicos.
Processo pronto para transicionar para o estágio de execução na próxima escala.', 'APROVADO', 150.00, 0.00, 320.00, NOW());

INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price) VALUES
(gen_random_uuid(), '30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 1, 90.00, 170.00);