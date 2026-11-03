# DMRJ Scheduling

Plataforma SaaS de agendamento online para empresas de serviços.

## Visão do produto

O DMRJ Scheduling está sendo planejado para salões, clínicas, spas, consultórios e outros negócios que precisam organizar serviços, profissionais, horários e reservas em um ambiente próprio.

A plataforma é estruturada para múltiplas empresas. Cada negócio terá seus próprios dados e configurações, com acesso controlado por empresa.

## Tipos de acesso

- **Administrador da empresa:** gerencia dados, equipe, serviços, horários e agendamentos.
- **Cliente final:** não cria conta e não faz reservas pela plataforma. A empresa cadastra o agendamento e compartilha um link individual para o cliente consultar os próprios dados.

## Funcionalidades já presentes no código

- Cadastro de empresa e autenticação com Supabase.
- Gestão de clientes, profissionais e serviços.
- Criação e gestão de agendamentos pela empresa.
- Cadastro de expediente da empresa e jornada dos profissionais.
- Bloqueios de horários e feriados.
- Verificação de disponibilidade e prevenção de conflitos de horários.
- Link privado individual para consulta do agendamento pelo cliente, após aplicar a migration correspondente no Supabase.

A publicação do código mais recente depende da disponibilidade de créditos de produção da hospedagem. A compilação do commit de links privados passou no GitHub Actions, mas isso não significa que a versão já esteja publicada ou testada no endereço público.

## Fora do escopo imediato

- Reserva pública feita diretamente pelo cliente.
- Cadastro ou painel de conta para clientes.
- Notificações automáticas por e-mail ou WhatsApp.
- Cobrança real de assinaturas até que o provedor de pagamento seja escolhido, configurado e testado.

## Resumo dos planos planejados

| Plano | Mensal | Anual (12 meses) | Limites iniciais |
|---|---:|---:|---|
| Starter | US$ 9,90 | US$ 99,00 | 1 profissional e 1 unidade |
| Pro | US$ 19,90 | US$ 199,00 | Até 5 profissionais e 1 unidade |
| Business | US$ 39,90 | US$ 399,00 | Até 15 profissionais e 3 unidades |

Os preços e limites são propostas iniciais, ainda não implementadas. A oferta anual foi planejada como 12 meses de acesso pelo preço equivalente a 10 mensalidades. As regras do teste gratuito de 7 dias, cobrança, renovação e cancelamento ainda precisam ser definidas antes de qualquer venda.

A divisão completa de recursos, limites e condições comerciais será mantida em [Planos e preços](docs/PLANS.md).

## Princípios do projeto

- Privacidade e coleta mínima de dados desde a concepção.
- Separação de dados entre empresas.
- Segurança aplicada no servidor e no banco de dados.
- Acessibilidade e localização consideradas desde o desenvolvimento.
- Requisitos legais e técnicos avaliados conforme os mercados efetivamente atendidos.

Esses princípios são objetivos de desenvolvimento, não uma declaração de conformidade, auditoria ou certificação concluída.

## Arquitetura planejada

- **Next.js e TypeScript:** aplicação web.
- **Supabase e PostgreSQL:** banco de dados, autenticação e políticas de acesso.
- **GitHub:** versionamento do projeto.
- **Vercel:** opção de hospedagem a avaliar conforme as condições comerciais e os limites do serviço.

A arquitetura ainda será detalhada e validada antes da implementação. Consulte [Arquitetura técnica](docs/ARCHITECTURE.md).

## Documentação do projeto

- [Planos e preços](docs/PLANS.md)
- [Arquitetura técnica](docs/ARCHITECTURE.md)
- [Configuração do Supabase](docs/SUPABASE_SETUP.md)

A autenticação inicial inclui login, cadastro de empresa, recuperação e redefinição de senha. O fluxo ainda depende da configuração do projeto Supabase e de testes reais.
- [Esquema do banco de dados](docs/DATABASE_SCHEMA.md)
- [Privacidade e segurança](docs/PRIVACY-SECURITY.md)
- [Acessibilidade e localização](docs/ACCESSIBILITY-LOCALIZATION.md)
- [Preparação para lançamento](docs/LAUNCH-READINESS.md)

## Situação atual

**Fase atual: fundação técnica em desenvolvimento.**

As telas de cadastro e login, o painel e as áreas operacionais de clientes, profissionais, serviços, horários e agendamentos estão no repositório e conectadas ao Supabase. A migration de links privados foi adicionada ao GitHub, mas ainda precisa ser aplicada no Supabase. O último commit de links privados passou na compilação do GitHub Actions. A versão mais recente ainda depende de publicação e testes no ambiente hospedado. Nenhum provedor de pagamento está integrado e nenhuma cobrança real está ativa.

