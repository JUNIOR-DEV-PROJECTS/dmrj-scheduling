# Esquema do banco de dados

**Status:** proposta técnica inicial. Este documento descreve um modelo planejado para PostgreSQL/Supabase. Ainda não é uma migration, não cria tabelas e não comprova que políticas de segurança estejam implementadas.

## 1. Objetivo e princípios

Este esquema orienta a modelagem dos dados do DMRJ Scheduling antes da implementação.

Princípios obrigatórios:

- **Isolamento multiempresa:** toda informação pertencente a uma empresa deve ter um identificador de empresa e autorização validada no servidor e no banco.
- **Integridade referencial:** relacionamentos devem usar chaves estrangeiras e restrições, não apenas validações da interface.
- **Menor privilégio:** cada usuário acessa somente os dados necessários para sua função.
- **Dados mínimos:** não coletar dados pessoais ou sensíveis sem necessidade definida.
- **Histórico comercial:** um agendamento deve preservar o preço, a moeda e a duração aceitos no momento da reserva.
- **Horários consistentes:** instantes são armazenados com timestamptz em UTC; fusos são identificados por nomes IANA.
- **Segurança em concorrência:** a prevenção de sobreposição de reservas deve ser garantida pelo PostgreSQL, além da lógica da aplicação.
- **Evolução controlada:** migrations versionadas, revisadas e testadas antes de produção.

## 2. Visão das entidades

| Área | Tabelas propostas | Finalidade |
|---|---|---|
| Plataforma | plans, subscriptions, subscription_events | Catálogo de planos e assinatura do SaaS |
| Empresas | organizations, locations | Empresas clientes e unidades |
| Identidade e acesso | Supabase Auth auth.users, organization_members | Identidade global e vínculo com cada empresa |
| Equipe | staff_profiles, services, staff_services, service_locations | Profissionais, serviços e onde são oferecidos |
| Disponibilidade | location_business_hours, staff_working_hours, schedule_blocks | Horários regulares, folgas e exceções |
| Clientes | customers | Dados mínimos de clientes dentro de cada empresa |
| Reservas | appointments, appointment_events | Agendamentos e histórico de alterações |
| Operação | audit_logs, idempotency_keys | Auditoria e proteção contra requisições repetidas |

Os nomes são propostas e poderão ser ajustados durante a implementação. A lista não significa que essas tabelas já existam.

## 3. Empresas e unidades

### organizations

Representa cada empresa assinante.

Campos principais propostos:

- id: UUID, chave primária.
- name: nome de exibição.
- slug: identificador público único para a página de agendamento.
- status: estado da empresa, como active, suspended ou closed.
- default_timezone: fuso IANA padrão da empresa.
- default_currency: código ISO 4217 usado como padrão para os serviços.
- created_at, updated_at: datas de criação e atualização.

A moeda e o fuso de cada unidade poderão sobrescrever os padrões da empresa. Validar o código de moeda e o nome do fuso na camada de aplicação e, quando possível, com restrições adicionais.

### locations

Representa cada unidade de uma empresa.

Campos principais:

- id: UUID.
- organization_id: empresa proprietária.
- name: nome da unidade.
- timezone: fuso IANA da unidade.
- currency: código ISO 4217 para os serviços daquela unidade, se diferente do padrão da empresa.
- address: endereço necessário para a operação, se aplicável.
- is_active: indica se a unidade está ativa.
- created_at, updated_at.

Restrições: chave única composta (organization_id, id). Relações de outras tabelas com uma unidade devem incluir também organization_id, para impedir referências cruzadas entre empresas.

## 4. Identidade, membros e permissões

### Supabase Auth: auth.users

O Supabase Auth será a fonte de identidade e autenticação. Não duplicar senha, hash de senha, token ou credencial nas tabelas do aplicativo.

### organization_members

Vincula uma identidade autenticada a uma empresa.

Campos principais:

- id: UUID.
- organization_id: empresa.
- user_id: referência a auth.users.id.
- role: owner, admin ou staff.
- status: invited, active ou disabled.
- created_at, updated_at.

Restrições: único por (organization_id, user_id), e chave única composta (organization_id, id).

A mesma pessoa pode pertencer a mais de uma empresa, com funções diferentes em cada uma. O papel da pessoa é sempre contextual à empresa. Não confiar em um papel enviado pelo navegador; a autorização deve ser verificada no servidor e no banco.

### Administradores da plataforma

A função de administrador global não deve ser concedida por um campo que o próprio usuário possa editar. Definir um mecanismo administrativo separado, protegido e auditável, usando claims confiáveis ou tabela administrativa com acesso estritamente restrito. Não expor uma política RLS que permita a um administrador de empresa se tornar administrador da plataforma.

### staff_profiles

Complementa um membro que trabalha como profissional e recebe agendamentos.

Campos principais:

- id: UUID.
- organization_id: empresa.
- member_id: vínculo com organization_members.
- display_name: nome profissional.
- is_bookable: indica se pode receber reservas.
- created_at, updated_at.

Restrições: membro deve pertencer à mesma empresa; um membro terá no máximo um perfil profissional por empresa, salvo decisão futura em contrário.

## 5. Serviços e locais de atendimento

### services

Campos principais:

- id: UUID.
- organization_id: empresa.
- name, description.
- duration_minutes: duração padrão em minutos.
- price_minor: preço em unidade monetária mínima (por exemplo, centavos), como inteiro não negativo.
- currency: código ISO 4217.
- is_active.
- created_at, updated_at.

Usar inteiros para valores monetários, evitando cálculos com ponto flutuante. A interpretação de casas decimais deve respeitar a moeda. Não presumir que todas as moedas usam duas casas decimais.

### staff_services

Relação muitos-para-muitos entre profissionais e serviços. Um profissional pode realizar vários serviços e um serviço pode ser realizado por vários profissionais.

Campos: organization_id, staff_id, service_id, is_active. Chave única composta para impedir duplicação. As chaves estrangeiras devem garantir que profissional e serviço pertençam à mesma empresa.

### service_locations

Relação entre serviços e unidades onde são oferecidos. Campos: organization_id, service_id, location_id, is_active. Impedir relações entre empresas diferentes.

Se futuramente um serviço tiver duração ou preço diferente por profissional ou unidade, criar uma tabela de configuração específica em vez de alterar silenciosamente o preço base.

## 6. Horários e disponibilidade

A disponibilidade deve resultar da combinação de horário da unidade, jornada do profissional, serviço, duração, intervalos, bloqueios e reservas existentes.

### location_business_hours

Horário regular de funcionamento da unidade.

Campos: organization_id, location_id, weekday (0 a 6, com convenção documentada), opens_at, closes_at, is_closed.

Permitir mais de um intervalo no mesmo dia, por exemplo, manhã e tarde. Não assumir que o estabelecimento funciona em um único intervalo contínuo.

### staff_working_hours

Jornada regular de cada profissional por unidade e dia da semana.

Campos: organization_id, location_id, staff_id, weekday, starts_at, ends_at, is_available.

Também permitir vários intervalos no mesmo dia. Validar que os horários estejam dentro do expediente da unidade, quando essa for a regra comercial definida.

### schedule_blocks

Bloqueios e exceções de disponibilidade, como férias, folgas, pausas, feriados e indisponibilidade pontual.

Campos: id, organization_id, location_id (opcional quando o bloqueio for geral ao profissional), staff_id (opcional para bloqueio da unidade), starts_at, ends_at, reason_code, created_by, created_at.

Usar intervalos com início inclusivo e fim exclusivo. Validar que o fim seja posterior ao início e que o bloqueio pertença à empresa correta.

## 7. Clientes

### customers

Cadastro de clientes isolado por empresa.

Campos principais:

- id: UUID.
- organization_id: empresa.
- name: nome necessário para identificar a reserva.
- email: opcional, se necessário para comunicação.
- phone: opcional, se necessário para comunicação.
- created_at, updated_at.

O cliente pode fazer uma reserva como convidado, sem criar uma conta ou senha. Não criar automaticamente uma identidade global no Supabase Auth para cada cliente final.

Não usar e-mail ou telefone como identificador global entre empresas. A mesma pessoa poderá ter registros separados em empresas diferentes. Definir regras de deduplicação somente dentro da empresa e com cuidado para não combinar pessoas diferentes.

Não incluir campos livres para diagnósticos, prontuários ou informações médicas no modelo básico. Se futuramente houver necessidade legítima de dados sensíveis, será necessária avaliação específica de privacidade, segurança, finalidade e base legal.

## 8. Agendamentos

### appointments

Cada reserva deve pertencer a uma empresa, unidade, serviço e profissional.

Campos principais propostos:

- id: UUID.
- organization_id: empresa.
- location_id: unidade.
- service_id: serviço reservado.
- staff_id: profissional reservado.
- customer_id: cliente da empresa, opcional para permitir reserva de convidado.
- customer_name_snapshot: nome informado no momento da reserva.
- customer_email_snapshot: e-mail informado, se houver.
- customer_phone_snapshot: telefone informado, se houver.
- starts_at, ends_at: instantes com fuso, armazenados como timestamptz.
- timezone_snapshot: fuso IANA utilizado para apresentar a reserva no momento da criação.
- service_name_snapshot: nome do serviço no momento da reserva.
- duration_minutes_snapshot: duração aceita na reserva.
- price_minor_snapshot: preço aceito na reserva.
- currency_snapshot: moeda aceita na reserva.
- status: estado da reserva.
- notes: opcional, com limite e finalidade definidos; não incentivar dados sensíveis.
- created_at, updated_at, cancelled_at (quando aplicável).

Estados iniciais sugeridos: pending, confirmed, completed, cancelled e no_show. A transição entre estados deve ser validada no servidor, com histórico. Se for necessário pagamento antecipado no futuro, definir estados e fluxo de pagamento próprios, sem misturar o estado financeiro com o estado do agendamento.

Os snapshots preservam o que foi combinado mesmo que o nome, preço ou duração do serviço sejam alterados posteriormente. O horário deve ser armazenado como instante absoluto; o fuso registrado serve para contexto e apresentação, não para substituir timestamptz.

### Prevenção de reservas sobrepostas

A verificação na interface não é suficiente. Duas solicitações simultâneas podem tentar reservar o mesmo profissional.

A proteção deve ser aplicada dentro de uma transação no PostgreSQL, com uma restrição de exclusão usando intervalo de tempo e identificadores da empresa e do profissional. Uma estratégia possível é habilitar a extensão btree_gist e criar uma exclusion constraint para impedir sobreposição de intervalos tstzrange(starts_at, ends_at, '[)') do mesmo profissional na mesma empresa, exceto reservas canceladas.

O intervalo [) inclui o início e exclui o fim, permitindo uma reserva começar exatamente quando a anterior termina. A regra deve considerar todos os estados que ocupam a agenda, inclusive reservas concluídas e faltas no histórico; somente estados que efetivamente liberam o horário, como canceladas, devem ser excluídos da restrição.

A aplicação deve tratar a violação da restrição como conflito de horário e oferecer nova consulta de disponibilidade. A criação da reserva, validação de serviço, profissional, unidade e duração deve ocorrer de forma atômica.

Se o produto futuramente permitir reservas simultâneas com vários profissionais ou recursos, será necessário modelar os recursos reserváveis separadamente e rever a restrição.

### appointment_events

Histórico imutável de alterações relevantes.

Campos: id, organization_id, appointment_id, actor_user_id (opcional para convidado/sistema), event_type, previous_values e new_values em JSON limitado ao necessário, created_at.

Não guardar segredos, tokens ou dados sensíveis desnecessários no histórico. Restringir leitura e escrita por função.

## 9. Planos e assinaturas do SaaS

### plans

Catálogo administrado pela plataforma, não pela empresa cliente.

Campos: id, code (Starter, Pro, Business), name, monthly_price_minor, annual_price_minor, currency, limits estruturados, features estruturadas, is_active, created_at, updated_at.

Os limites e recursos finais ainda precisam ser definidos no documento PLANS.md. Não transformar recursos ainda não aprovados em permissões efetivas.

### subscriptions

Assinatura vinculada à empresa.

Campos: id, organization_id, plan_id, status, billing_interval, currency, amount_minor, trial_starts_at, trial_ends_at, current_period_starts_at, current_period_ends_at, cancel_at_period_end, provider e provider_subscription_id (opcionais até a integração), created_at, updated_at.

Definir restrições para impedir múltiplas assinaturas ativas conflitantes para a mesma empresa, conforme o modelo comercial aprovado. O estado da assinatura deve ser atualizado a partir de eventos validados do provedor quando houver integração.

### subscription_events

Registro de eventos de cobrança e assinatura recebidos ou gerados pelo sistema. Deve conter identificador externo idempotente, tipo, data e metadados mínimos. Verificar assinatura/autenticidade de webhooks antes de processar eventos. Não armazenar dados completos de cartão.

A integração de pagamentos não foi escolhida nem implementada. Nenhuma cobrança real deve ser realizada nesta fase.

**Importante:** limites de plano devem ser aplicados no servidor. Não confiar em limites enviados pelo navegador nem apenas ocultar botões na interface.

## 10. Auditoria e idempotência

### audit_logs

Registro de ações administrativas e de segurança relevantes.

Campos: id, organization_id (opcional para eventos globais da plataforma), actor_user_id, action, resource_type, resource_id, created_at, metadados estritamente necessários.

Não registrar senhas, tokens, chaves, conteúdo integral de cartões ou dados pessoais sem necessidade.

### idempotency_keys

Protege operações sensíveis contra repetição acidental, por exemplo, envio duplicado de uma solicitação de reserva.

Campos: id, organization_id, key, request_hash, response_reference, created_at, expires_at.

Criar unicidade por empresa e chave. Reutilizar a mesma chave com conteúdo de requisição diferente deve ser rejeitado. Definir prazo de retenção e limpeza.

## 11. Regras de isolamento e RLS

A Row Level Security (RLS) deverá ser habilitada em todas as tabelas expostas pela API do Supabase que contenham dados do aplicativo.

Requisitos:

1. Cada consulta ou alteração de dados de empresa deve ser autorizada pelo vínculo ativo do usuário com aquela empresa.
2. O organization_id deve ser validado no banco e não aceito cegamente do cliente.
3. As relações entre registros devem usar chaves estrangeiras compostas com organization_id, sempre que necessário para impedir referências cruzadas.
4. Políticas de leitura, inserção, atualização e exclusão devem ser escritas separadamente e seguir o menor privilégio.
5. Clientes convidados não recebem acesso direto ao banco. Reservas públicas devem passar por endpoint/ação de servidor com validação, rate limiting e proteção contra abuso.
6. Chaves privilegiadas do Supabase nunca podem ser enviadas ao navegador nem armazenadas no repositório.
7. Funções administrativas com privilégios elevados devem validar a identidade e autorização no servidor e registrar ações relevantes.
8. Testar acesso cruzado entre empresas usando usuários reais de teste e chamadas diretas à API, não somente a interface.

Não usar uma política genérica que permita acesso a qualquer registro apenas porque o usuário está autenticado. A configuração exata das políticas depende do esquema final e deverá ser revisada antes de produção.

## 12. Índices e integridade

Índices iniciais a avaliar:

- organization_members(organization_id, user_id) com unicidade.
- locations(organization_id, is_active).
- staff_profiles(organization_id, member_id) com unicidade.
- services(organization_id, is_active).
- staff_services(organization_id, staff_id, service_id) com unicidade.
- appointments(organization_id, starts_at).
- appointments(organization_id, staff_id, starts_at).
- appointments(organization_id, location_id, starts_at).
- Índices em chaves estrangeiras utilizadas em joins e filtros RLS.

Usar restrições CHECK para valores positivos, intervalos válidos e estados permitidos. Confirmar planos de consulta e índices com dados de teste; evitar adicionar índices sem necessidade.

## 13. Estratégia de migrations e testes

- Manter migrations SQL versionadas no repositório, em ordem cronológica.
- Não editar manualmente o banco de produção sem migration revisada.
- Testar migrations em ambiente local/de desenvolvimento antes de aplicá-las em produção.
- Testar criação, alteração e cancelamento de reservas.
- Testar duas ou mais solicitações concorrentes para o mesmo horário e confirmar que apenas uma é aceita.
- Testar que usuários de uma empresa não consigam ler, alterar, excluir ou exportar dados de outra.
- Testar permissões de administrador, funcionário e usuário sem vínculo.
- Testar fusos diferentes, mudanças de horário legal e conversão de datas.
- Testar moedas com diferentes quantidades de casas decimais.
- Testar limites de planos no servidor.
- Testar restauração de backup antes de disponibilizar o serviço comercialmente.

## 14. Decisões que precisam ser confirmadas antes das migrations

- Se cada agendamento exige exatamente um profissional no MVP.
- Se a reserva pública exige confirmação por e-mail, telefone ou outro mecanismo.
- Como será implementado o acesso seguro do cliente à própria reserva para cancelar ou reagendar.
- Se a duração do serviço inclui intervalo de preparação ou limpeza.
- Se haverá intervalo de segurança entre reservas.
- Se uma unidade poderá ter moeda diferente da empresa.
- Se serviços e profissionais poderão ser compartilhados entre unidades da mesma empresa.
- Quais estados e regras comerciais serão adotados para reservas.
- Quais recursos e limites de cada plano serão efetivamente vendidos.
- Qual provedor de pagamento será escolhido no futuro.

Essas decisões devem ser tomadas antes de fechar a primeira migration, porque podem alterar restrições, relacionamentos e regras de autorização.

### Decisão aprovada para o MVP: prazos configuráveis por empresa para cancelamento e reagendamento

**Status: decisão registrada.**

Cada empresa poderá configurar separadamente o prazo mínimo para o cliente cancelar uma reserva e o prazo mínimo para solicitar um reagendamento, sempre contado para trás a partir do horário de início do agendamento.

Configuração inicial recomendada:
- Prazo padrão para cancelamento: 24 horas.
- Prazo padrão para reagendamento: 24 horas.
- Os dois prazos serão independentes e poderão ser alterados pelo administrador da empresa.
- O valor deverá ser armazenado como quantidade inteira de horas, não como texto livre. Valores iguais a zero poderão representar permissão até o início do agendamento, se essa opção for mantida na interface.

Regras para implementação:
1. A política pertence à empresa e será aplicada às reservas dessa empresa, inclusive quando ela tiver várias unidades.
2. A validação será feita no servidor no momento da ação. Ocultar ou desabilitar um botão na interface não substitui essa validação.
3. O horário de referência será o instante absoluto de início do agendamento (starts_at), respeitando o fuso da unidade apenas para exibição.
4. Se o prazo permitido tiver passado, o cliente deverá entrar em contato diretamente com a empresa; a empresa continuará responsável por administrar a reserva conforme suas próprias regras e permissões.
5. Cancelamentos e reagendamentos deverão gerar eventos no histórico, com ator, data e alterações relevantes.
6. O reagendamento deverá validar novamente profissional, serviço, unidade, disponibilidade e conflitos dentro de uma transação, sem deixar a reserva em estado inconsistente.
7. A ação pública do cliente deverá usar um mecanismo seguro de acesso à reserva, com token imprevisível, armazenamento protegido, expiração e proteção contra tentativas abusivas. A implementação e o formato desse mecanismo ainda serão especificados e testados.

**Avaliação de complexidade para o MVP: baixa a moderada.** A regra exige duas configurações por empresa, uma tela simples de ajustes, validação centralizada no servidor e testes dos limites de tempo. É mais simples e flexível do que criar regras por serviço, profissional, unidade, tipo de cliente ou exceções individuais, que ficam fora do MVP.

A decisão não define multas, taxas, reembolsos ou políticas legais de cancelamento. Esses termos comerciais deverão ser apresentados claramente pela empresa ao cliente e avaliados conforme a legislação aplicável antes do lançamento.

### Decisão aprovada para o MVP: um profissional por agendamento

**Status: decisão registrada.**

Na primeira versão do DMRJ Scheduling, cada agendamento terá exatamente um profissional responsável. A reserva deverá referenciar um único `staff_id`, pertencente à mesma empresa e habilitado para executar o serviço na unidade escolhida.

Motivos:
- Simplifica a experiência de reserva para o cliente e a gestão da agenda.
- Permite aplicar uma regra clara de prevenção de conflitos por profissional.
- Reduz a complexidade de disponibilidade, cancelamento, reagendamento e testes concorrentes.
- Evita introduzir relações muitos-para-muitos entre agendamentos e profissionais antes de existir uma necessidade validada.

Regras para implementação:
1. O profissional deverá estar ativo e habilitado para o serviço e a unidade selecionados.
2. A reserva deverá validar a disponibilidade do profissional e da unidade dentro da mesma operação transacional.
3. A restrição contra sobreposição deverá considerar o profissional, a empresa e os estados que ocupam a agenda.
4. Não será permitido cadastrar vários profissionais para a mesma reserva no MVP.
5. Uma evolução futura poderá introduzir recursos reserváveis e uma tabela de participantes do agendamento, por meio de migration própria, sem presumir que essa capacidade exista agora.

Esta decisão não impede que uma empresa tenha muitos profissionais ou várias unidades. Ela limita apenas a quantidade de profissionais responsáveis por uma reserva individual.

## 15. Limites desta especificação

Este documento é uma proposta de modelagem, não código executável nem prova de segurança. As tabelas, constraints, índices, funções, triggers, policies RLS e migrations ainda precisam ser implementados, revisados e testados.

Não inserir dados reais de clientes durante os testes. Utilizar dados fictícios até que privacidade, segurança, retenção e acesso estejam implementados e verificados.
