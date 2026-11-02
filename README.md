# DMRJ Scheduling

Plataforma SaaS de agendamento online para empresas de serviços.

## Visão do produto

O DMRJ Scheduling está sendo planejado para salões, clínicas, spas, consultórios e outros negócios que precisam organizar serviços, profissionais, horários e reservas em um ambiente próprio.

A plataforma será multiempresa. Cada negócio terá seus próprios dados e configurações, com acesso controlado por função e empresa.

## Tipos de acesso previstos

- **Administrador da plataforma:** gerencia o SaaS, empresas assinantes e planos.
- **Administrador da empresa:** gerencia sua empresa, unidades, serviços, equipe e agenda.
- **Funcionários:** acessam somente os recursos permitidos por suas permissões.
- **Clientes finais:** poderão agendar sem criar uma conta, informando apenas os dados necessários para a reserva.

## Funcionalidades planejadas

- Página pública de agendamento para cada empresa.
- Cadastro e gestão de serviços, profissionais e horários.
- Confirmação de reservas.
- Proteção contra reservas duplicadas, inclusive em solicitações simultâneas.
- Gestão de clientes e histórico de agendamentos.
- Painel administrativo e relatórios.
- Suporte a múltiplas empresas e unidades.
- Interface inicial em português, inglês e espanhol.
- Preferência de idioma e modos claro, escuro e automático.
- Configuração de fuso horário e moeda por empresa ou unidade, conforme aplicável.
- Assinaturas dos planos do SaaS.

As funcionalidades acima são planejadas e ainda não devem ser consideradas implementadas.

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
- [Esquema do banco de dados](docs/DATABASE_SCHEMA.md)
- [Privacidade e segurança](docs/PRIVACY-SECURITY.md)
- [Acessibilidade e localização](docs/ACCESSIBILITY-LOCALIZATION.md)
- [Preparação para lançamento](docs/LAUNCH-READINESS.md)

## Situação atual

**Fase atual: fundação técnica em desenvolvimento.**

A landing page, a interface demonstrativa do painel, as telas de login e cadastro e a integração inicial de autenticação com Supabase estão no repositório. Também existe uma migration inicial para empresas, membros e políticas RLS. Essa migration ainda precisa ser executada no Supabase, e as variáveis de ambiente precisam ser configuradas. O fluxo de autenticação ainda não foi testado em um projeto real.

O painel continua demonstrativo e não está conectado às funções operacionais do SaaS. As demais funcionalidades, integrações e controles ainda precisam ser implementados e testados. Nenhum provedor de pagamento está integrado e nenhuma cobrança real está ativa.

