const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const successEnvelope = (dataSchema) => ({
    type: 'object',
    properties: {
        status: { type: 'string', example: 'success' },
        ...(dataSchema ? { data: dataSchema } : {})
    }
});

const errorResponse = (description) => ({
    description,
    content: {
        'application/json': {
            schema: ref('ErrorResponse')
        }
    }
});

const pathParameter = (name, description) => ({
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'string', format: 'uuid' }
});

const textPathParameter = (name, description) => ({
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'string' }
});

const queryParameter = (name, description, schema = { type: 'string' }) => ({
    name,
    in: 'query',
    required: false,
    description,
    schema
});

const requestBody = (schemaName) => ({
    required: true,
    content: {
        'application/json': {
            schema: ref(schemaName)
        }
    }
});

const operation = ({
    tag,
    summary,
    description,
    parameters = [],
    body,
    responseSchema,
    responseCode = 200,
    responseDescription = 'Requisição processada com sucesso.',
    auth = true,
    security
}) => ({
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    ...(security ? { security } : auth ? { security: [{ BearerAuth: [] }] } : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(body ? { requestBody: requestBody(body) } : {}),
    responses: {
        [responseCode]: {
            description: responseDescription,
            content: {
                'application/json': {
                    schema: responseSchema || successEnvelope()
                }
            }
        },
        400: errorResponse('Dados inválidos ou requisição malformada.'),
        401: errorResponse('Autenticação ausente ou inválida.'),
        403: errorResponse('Acesso negado para este perfil.'),
        404: errorResponse('Recurso ou rota não encontrada.'),
        422: errorResponse('A requisição viola uma regra de negócio.'),
        500: errorResponse('Erro interno do servidor.')
    }
});

const optionalAuthentication = [{ BearerAuth: [] }, {}];
const idParameter = pathParameter('id', 'Identificador UUID do recurso.');

export const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'AutoShop ERP API',
        version: '1.0.0',
        description: 'Documentação da API do ERP AutoShop. Endpoints protegidos aceitam JWT no cabeçalho Authorization: Bearer <token>.'
    },
    servers: [{ url: '/', description: 'Servidor atual' }],
    tags: [
        { name: 'Sistema', description: 'Status e diagnóstico da aplicação.' },
        { name: 'Autenticação', description: 'Login, logout e recuperação de senha.' },
        { name: 'Usuários', description: 'Cadastro e gerenciamento de usuários.' },
        { name: 'Produtos', description: 'Consulta e gerenciamento de produtos.' },
        { name: 'FIPE', description: 'Consultas de veículos e valores da Tabela FIPE.' },
        { name: 'Ordens de Serviço', description: 'Criação, consulta e gerenciamento de ordens de serviço.' },
        { name: 'Estoque', description: 'Consulta e gerenciamento de movimentações de estoque.' },
        { name: 'Dashboard', description: 'Indicadores administrativos.' },
        { name: 'Documentação', description: 'Acesso à especificação OpenAPI.' }
    ],
    paths: {
        '/': {
            get: operation({
                tag: 'Sistema',
                summary: 'Verificar status da aplicação',
                auth: false,
                responseSchema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            })
        },
        '/db': {
            get: operation({
                tag: 'Sistema',
                summary: 'Verificar conexão com o banco de dados',
                auth: false,
                responseSchema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string' },
                        database: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' },
                                responseTimeMs: { type: 'integer' }
                            }
                        }
                    }
                }
            })
        },
        '/api-docs.json': {
            get: operation({
                tag: 'Documentação',
                summary: 'Obter especificação OpenAPI em JSON',
                auth: false,
                responseSchema: { type: 'object', description: 'Documento OpenAPI 3.0.3.' }
            })
        },
        '/auth/login': {
            post: operation({
                tag: 'Autenticação',
                summary: 'Autenticar usuário',
                auth: false,
                body: 'LoginRequest',
                responseSchema: ref('LoginResponse')
            })
        },
        '/auth/logout': {
            post: operation({
                tag: 'Autenticação',
                summary: 'Encerrar sessão no cliente',
                description: 'Como o JWT é stateless, o cliente deve descartar o token recebido no login.',
                responseSchema: ref('MessageResponse')
            })
        },
        '/auth/forgot-password': {
            post: operation({
                tag: 'Autenticação',
                summary: 'Solicitar recuperação de senha',
                auth: false,
                body: 'ForgotPasswordRequest',
                responseSchema: ref('MessageResponse')
            })
        },
        '/auth/reset-password': {
            post: operation({
                tag: 'Autenticação',
                summary: 'Redefinir senha com token',
                auth: false,
                body: 'ResetPasswordRequest',
                responseSchema: ref('MessageResponse')
            })
        },
        '/users/cadastro': {
            post: operation({
                tag: 'Usuários',
                summary: 'Cadastrar usuário',
                description: 'Cadastro público cria clientes. Somente administradores podem atribuir outros papéis.',
                auth: false,
                security: optionalAuthentication,
                body: 'CreateUserRequest',
                responseCode: 201,
                responseDescription: 'Usuário cadastrado.',
                responseSchema: successEnvelope(ref('User'))
            })
        },
        '/users': {
            get: operation({
                tag: 'Usuários',
                summary: 'Listar usuários',
                parameters: [
                    queryParameter('name', 'Filtrar pelo nome.'),
                    queryParameter('email', 'Filtrar pelo e-mail.'),
                    queryParameter('role', 'Filtrar pelo papel.', { type: 'string', enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'] }),
                    queryParameter('isActive', 'Filtrar pela situação do usuário.', { type: 'boolean' })
                ],
                responseSchema: successEnvelope({ type: 'array', items: ref('User') })
            })
        },
        '/users/{id}': {
            get: operation({
                tag: 'Usuários',
                summary: 'Buscar usuário por ID',
                parameters: [idParameter],
                responseSchema: successEnvelope(ref('User'))
            }),
            put: operation({
                tag: 'Usuários',
                summary: 'Atualizar usuário',
                parameters: [idParameter],
                body: 'UpdateUserRequest',
                responseSchema: successEnvelope(ref('User'))
            }),
            delete: operation({
                tag: 'Usuários',
                summary: 'Desativar usuário',
                parameters: [idParameter],
                responseSchema: ref('MessageResponse')
            })
        },
        '/products': {
            get: operation({
                tag: 'Produtos',
                summary: 'Listar produtos',
                description: 'A resposta inclui campos diferentes conforme o perfil: preço de custo é restrito a funcionários e administradores.',
                auth: false,
                security: optionalAuthentication,
                responseSchema: successEnvelope({ type: 'array', items: ref('Product') })
            }),
            post: operation({
                tag: 'Produtos',
                summary: 'Cadastrar produto',
                body: 'CreateProductRequest',
                responseCode: 201,
                responseDescription: 'Produto cadastrado.',
                responseSchema: successEnvelope(ref('Product'))
            })
        },
        '/products/{id}': {
            get: operation({
                tag: 'Produtos',
                summary: 'Buscar produto por ID',
                auth: false,
                security: optionalAuthentication,
                parameters: [idParameter],
                responseSchema: successEnvelope(ref('Product'))
            }),
            put: operation({
                tag: 'Produtos',
                summary: 'Atualizar produto',
                description: 'O estoque não pode ser alterado por esta rota; use uma movimentação de estoque.',
                parameters: [idParameter],
                body: 'UpdateProductRequest',
                responseSchema: successEnvelope(ref('Product'))
            }),
            delete: operation({
                tag: 'Produtos',
                summary: 'Inativar produto',
                parameters: [idParameter],
                responseSchema: successEnvelope(ref('Product'))
            })
        },
        '/fipe/plate/{plate}': {
            get: operation({
                tag: 'FIPE',
                summary: 'Consultar veículo pela placa',
                parameters: [{
                    name: 'plate',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', example: 'ABC1D23' }
                }],
                responseSchema: successEnvelope({ type: 'object', additionalProperties: true })
            })
        },
        '/fipe/brands': {
            get: operation({
                tag: 'FIPE',
                summary: 'Listar marcas',
                parameters: [queryParameter('type', 'Tipo de veículo.', { type: 'string', enum: ['cars', 'motorcycles', 'trucks'], default: 'cars' })],
                responseSchema: successEnvelope({ type: 'array', items: { type: 'object', additionalProperties: true } })
            })
        },
        '/fipe/brands/{brandId}/models': {
            get: operation({
                tag: 'FIPE',
                summary: 'Listar modelos de uma marca',
                parameters: [
                    textPathParameter('brandId', 'Identificador da marca na FIPE.'),
                    queryParameter('type', 'Tipo de veículo.', { type: 'string', enum: ['cars', 'motorcycles', 'trucks'], default: 'cars' })
                ],
                responseSchema: successEnvelope({ type: 'object', additionalProperties: true })
            })
        },
        '/fipe/brands/{brandId}/models/{modelId}/years': {
            get: operation({
                tag: 'FIPE',
                summary: 'Listar anos de um modelo',
                parameters: [
                    textPathParameter('brandId', 'Identificador da marca na FIPE.'),
                    textPathParameter('modelId', 'Identificador do modelo na FIPE.'),
                    queryParameter('type', 'Tipo de veículo.', { type: 'string', enum: ['cars', 'motorcycles', 'trucks'], default: 'cars' })
                ],
                responseSchema: successEnvelope({ type: 'array', items: { type: 'object', additionalProperties: true } })
            })
        },
        '/fipe/price': {
            get: operation({
                tag: 'FIPE',
                summary: 'Consultar preço FIPE',
                description: 'Informe fipeCode e yearId, ou informe brandId, modelId e yearId.',
                parameters: [
                    queryParameter('type', 'Tipo de veículo.', { type: 'string', enum: ['cars', 'motorcycles', 'trucks'], default: 'cars' }),
                    queryParameter('fipeCode', 'Código FIPE do veículo.'),
                    queryParameter('brandId', 'Identificador da marca.'),
                    queryParameter('modelId', 'Identificador do modelo.'),
                    queryParameter('yearId', 'Identificador do ano.')
                ],
                responseSchema: successEnvelope({ type: 'object', additionalProperties: true })
            })
        },
        '/service-orders': {
            post: operation({
                tag: 'Ordens de Serviço',
                summary: 'Criar ordem de serviço',
                body: 'CreateServiceOrderRequest',
                responseCode: 201,
                responseDescription: 'Ordem de serviço criada.',
                responseSchema: successEnvelope(ref('ServiceOrder'))
            }),
            get: operation({
                tag: 'Ordens de Serviço',
                summary: 'Listar ordens de serviço',
                parameters: [
                    queryParameter('customer_id', 'Filtrar por UUID do cliente.'),
                    queryParameter('status', 'Filtrar pelo status.', { type: 'string', enum: ['ORCAMENTO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'] }),
                    queryParameter('code', 'Filtrar pelo código da ordem de serviço.')
                ],
                responseSchema: successEnvelope({ type: 'array', items: ref('ServiceOrder') })
            })
        },
        '/service-orders/{id}': {
            get: operation({
                tag: 'Ordens de Serviço',
                summary: 'Buscar ordem de serviço por ID',
                parameters: [idParameter],
                responseSchema: successEnvelope(ref('ServiceOrder'))
            }),
            put: operation({
                tag: 'Ordens de Serviço',
                summary: 'Atualizar dados da ordem de serviço',
                parameters: [idParameter],
                body: 'UpdateServiceOrderRequest',
                responseSchema: successEnvelope(ref('ServiceOrder'))
            }),
            delete: operation({
                tag: 'Ordens de Serviço',
                summary: 'Excluir ordem de serviço',
                parameters: [idParameter],
                responseSchema: ref('MessageResponse')
            })
        },
        '/service-orders/{id}/status': {
            put: operation({
                tag: 'Ordens de Serviço',
                summary: 'Atualizar status da ordem de serviço',
                parameters: [idParameter],
                body: 'UpdateServiceOrderStatusRequest',
                responseSchema: successEnvelope(ref('ServiceOrder'))
            })
        },
        '/service-orders/{id}/items': {
            post: operation({
                tag: 'Ordens de Serviço',
                summary: 'Adicionar produto à ordem de serviço',
                description: 'A operação também registra a saída e atualiza o estoque do produto.',
                parameters: [idParameter],
                body: 'AddServiceOrderItemRequest',
                responseSchema: successEnvelope(ref('ServiceOrder'))
            })
        },
        '/service-orders/{id}/items/{itemId}': {
            delete: operation({
                tag: 'Ordens de Serviço',
                summary: 'Remover produto da ordem de serviço',
                description: 'A operação estorna ao estoque a quantidade removida.',
                parameters: [idParameter, pathParameter('itemId', 'Identificador UUID do item da ordem de serviço.')],
                responseSchema: successEnvelope(ref('ServiceOrder'))
            })
        },
        '/service-orders/{id}/employees': {
            post: operation({
                tag: 'Ordens de Serviço',
                summary: 'Atribuir funcionário à ordem de serviço',
                parameters: [idParameter],
                body: 'AddServiceOrderEmployeeRequest',
                responseSchema: successEnvelope(ref('ServiceOrder'))
            })
        },
        '/service-orders/{id}/employees/{employeeId}': {
            delete: operation({
                tag: 'Ordens de Serviço',
                summary: 'Remover funcionário da ordem de serviço',
                parameters: [idParameter, pathParameter('employeeId', 'Identificador UUID do funcionário.')],
                responseSchema: successEnvelope(ref('ServiceOrder'))
            })
        },
        '/stock': {
            get: operation({
                tag: 'Estoque',
                summary: 'Listar movimentações de estoque',
                responseSchema: successEnvelope({ type: 'array', items: ref('StockMovement') })
            })
        },
        '/stock/products/{id}/stock': {
            post: operation({
                tag: 'Estoque',
                summary: 'Registrar movimentação de estoque',
                parameters: [idParameter],
                body: 'CreateStockMovementRequest',
                responseCode: 201,
                responseDescription: 'Movimentação registrada.',
                responseSchema: successEnvelope(ref('StockMovement'))
            })
        },
        '/stock/products/{id}/stock-movements': {
            get: operation({
                tag: 'Estoque',
                summary: 'Listar movimentações de um produto',
                parameters: [idParameter],
                responseSchema: successEnvelope({ type: 'array', items: ref('StockMovement') })
            })
        },
        '/stock/{id}': {
            put: operation({
                tag: 'Estoque',
                summary: 'Atualizar movimentação de estoque',
                parameters: [idParameter],
                body: 'UpdateStockMovementRequest',
                responseSchema: successEnvelope(ref('StockMovement'))
            }),
            delete: operation({
                tag: 'Estoque',
                summary: 'Remover movimentação e estornar saldo',
                parameters: [idParameter],
                responseSchema: ref('MessageResponse')
            })
        },
        '/dashboard/summary': {
            get: operation({
                tag: 'Dashboard',
                summary: 'Consultar resumo administrativo',
                responseSchema: successEnvelope({ type: 'object', additionalProperties: true })
            })
        },
        '/dashboard/financial': {
            get: operation({
                tag: 'Dashboard',
                summary: 'Consultar indicadores financeiros',
                responseSchema: successEnvelope({ type: 'object', additionalProperties: true })
            })
        }
    },
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Use o token retornado por POST /auth/login.'
            }
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string' },
                    details: { type: 'array', items: { type: 'string' } }
                }
            },
            MessageResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'] },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    cost_price: { type: 'number', description: 'Visível somente para funcionários e administradores.' },
                    sell_price: { type: 'number' },
                    current_stock: { type: 'number' },
                    is_active: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            StockMovement: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    product_id: { type: 'string', format: 'uuid' },
                    type: { type: 'string', enum: ['ENTRADA', 'SAIDA', 'AJUSTE'] },
                    quantity: { type: 'number' },
                    balance_after: { type: 'number' },
                    reason: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    product_name: { type: 'string' }
                }
            },
            ServiceOrder: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    code: { type: 'string', example: 'OS-2026-001' },
                    customer_id: { type: 'string', format: 'uuid' },
                    vehicle_brand: { type: 'string' },
                    vehicle_model: { type: 'string' },
                    vehicle_year: { type: 'string' },
                    vehicle_fipe_code: { type: 'string', nullable: true },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['ORCAMENTO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'] },
                    labor_cost: { type: 'number' },
                    discount: { type: 'number' },
                    total_amount: { type: 'number' },
                    created_at: { type: 'string', format: 'date-time' },
                    items: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    employees: { type: 'array', items: { type: 'object', additionalProperties: true } }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
                    password: { type: 'string', format: 'password', example: 'Senha123' }
                }
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    token: { type: 'string', description: 'JWT para usar como Bearer token.' },
                    user: ref('User')
                }
            },
            ForgotPasswordRequest: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } }
            },
            ResetPasswordRequest: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                    token: { type: 'string' },
                    newPassword: { type: 'string', format: 'password', minLength: 8, maxLength: 72 }
                }
            },
            CreateUserRequest: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password', minLength: 8, maxLength: 72 },
                    role: { type: 'string', enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'], description: 'O papel só é aceito quando definido por um administrador.' }
                }
            },
            UpdateUserRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password', minLength: 8, maxLength: 72 },
                    role: { type: 'string', enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'] },
                    isActive: { type: 'boolean' }
                }
            },
            CreateProductRequest: {
                type: 'object',
                required: ['name', 'cost_price', 'current_stock'],
                properties: {
                    name: { type: 'string', minLength: 3 },
                    description: { type: 'string' },
                    cost_price: { type: 'number', minimum: 0 },
                    sell_price: { type: 'number', minimum: 0, description: 'Se omitido, assume o valor de cost_price.' },
                    current_stock: { type: 'number', minimum: 0 }
                }
            },
            UpdateProductRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 3 },
                    description: { type: 'string' },
                    cost_price: { type: 'number', minimum: 0 },
                    sell_price: { type: 'number', minimum: 0 },
                    is_active: { type: 'boolean' }
                },
                not: { required: ['current_stock'] }
            },
            CreateServiceOrderRequest: {
                type: 'object',
                required: ['customer_id', 'vehicle_brand', 'vehicle_model', 'title'],
                properties: {
                    customer_id: { type: 'string', format: 'uuid' },
                    vehicle_brand: { type: 'string', minLength: 2 },
                    vehicle_model: { type: 'string', minLength: 2 },
                    vehicle_year: { type: 'string' },
                    vehicle_fipe_code: { type: 'string', nullable: true },
                    title: { type: 'string', minLength: 3 },
                    description: { type: 'string' },
                    labor_cost: { type: 'number', minimum: 0, default: 0 },
                    discount: { type: 'number', minimum: 0, default: 0 }
                }
            },
            UpdateServiceOrderRequest: {
                type: 'object',
                properties: {
                    vehicle_brand: { type: 'string', minLength: 2 },
                    vehicle_model: { type: 'string', minLength: 2 },
                    vehicle_year: { type: 'string' },
                    vehicle_fipe_code: { type: 'string', nullable: true },
                    title: { type: 'string', minLength: 3 },
                    description: { type: 'string' },
                    labor_cost: { type: 'number', minimum: 0 },
                    discount: { type: 'number', minimum: 0 }
                }
            },
            UpdateServiceOrderStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['ORCAMENTO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'] }
                }
            },
            AddServiceOrderItemRequest: {
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: {
                    product_id: { type: 'string', format: 'uuid' },
                    quantity: { type: 'integer', minimum: 1 }
                }
            },
            AddServiceOrderEmployeeRequest: {
                type: 'object',
                required: ['employee_id'],
                properties: { employee_id: { type: 'string', format: 'uuid' } }
            },
            CreateStockMovementRequest: {
                type: 'object',
                required: ['type', 'quantity'],
                properties: {
                    type: { type: 'string', enum: ['ENTRADA', 'SAIDA', 'AJUSTE'] },
                    quantity: { type: 'number', minimum: 0, exclusiveMinimum: true, description: 'Em AJUSTE, representa o novo saldo.' },
                    reason: { type: 'string' }
                }
            },
            UpdateStockMovementRequest: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['ENTRADA', 'SAIDA', 'AJUSTE'] },
                    quantity: { type: 'number', minimum: 0, exclusiveMinimum: true },
                    reason: { type: 'string' }
                }
            }
        }
    }
};
