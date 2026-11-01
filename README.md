# DMRJ Scheduling

Plataforma SaaS internacional de agendamento online para empresas de serviços.

## Visão do produto

O DMRJ Scheduling permitirá que salões, clínicas, spas, consultórios e outros negócios organizem seus serviços, profissionais, horários e reservas em um ambiente próprio.

A plataforma será multiempresa: cada negócio terá seus próprios dados e configurações, sem acesso aos dados de outras empresas.

## Tipos de acesso previstos

- **Administrador da plataforma:** gerencia o SaaS, empresas assinantes e planos.
- **Administrador da empresa:** gerencia sua empresa, unidades, serviços, equipe e agenda.
- **Funcionários:** acessam somente os recursos permitidos por suas permissões.
- **Clientes finais:** podem agendar sem criar uma conta, informando nome, telefone e e-mail.

## Funcionalidades planejadas

- Página pública de agendamento para cada empresa.
- Cadastro e gestão de serviços, profissionais e horários.
- Confirmação automática de reservas.
- Proteção contra reservas duplicadas, inclusive em solicitações simultâneas.
- Gestão de clientes e histórico de agendamentos.
- Painel administrativo e relatórios conforme o plano.
- Suporte a múltiplas empresas e unidades.
- Interface em português, inglês e espanhol inicialmente.
- Preferência individual de idioma.
- Modo claro, escuro e automático.
- Configuração de fuso horário por empresa ou unidade.
- Configuração da moeda usada pela empresa em seus serviços.
- Estrutura preparada para assinaturas dos planos do SaaS.

## Planos e preços iniciais

Todos os planos terão período de teste gratuito de 7 dias.

| Plano | Mensal | Anual | Limites planejados |
|---|---:|---:|---|
| Starter | US$ 9,90/mês | US$ 99,00/ano | 1 profissional e 1 unidade |
| Pro | US$ 19,90/mês | US$ 199,00/ano | Até 5 profissionais e 1 unidade |
| Business | US$ 39,90/mês | US$ 399,00/ano | Até 15 profissionais e 3 unidades |

Os valores anuais equivalem a 10 mensalidades, oferecendo o equivalente a 2 meses sem cobrança em comparação com o pagamento mensal.

Os recursos e limites acima representam a oferta inicial planejada e poderão ser ajustados antes do lançamento.

A assinatura da plataforma será paga pela empresa à DMRJ Scheduling. O cliente final não pagará uma taxa à DMRJ para fazer uma reserva. A cobrança dos serviços ao cliente final será uma configuração independente da assinatura do SaaS.

## Arquitetura técnica planejada

- **Next.js e TypeScript:** aplicação web.
- **Supabase e PostgreSQL:** banco de dados, autenticação e políticas de acesso.
- **GitHub:** versionamento do código.
- **Vercel:** opção planejada para hospedagem e publicação.

A integração de pagamentos e assinaturas será definida em uma etapa posterior. Nenhum provedor de pagamento está integrado neste momento.

## Requisitos internacionais

- Armazenar datas e horários de forma consistente em UTC.
- Exibir horários conforme o fuso IANA configurado para a empresa ou unidade.
- Não usar offsets fixos como substitutos de fusos horários.
- Separar a moeda da assinatura do SaaS da moeda dos serviços vendidos pela empresa.
- Preparar a aplicação para tradução, formatos locais e expansão internacional.

## Situação do projeto

**Fase atual:** planejamento e estruturação inicial.

Este repositório é o ponto de partida do desenvolvimento. Funcionalidades descritas como planejadas ainda não estão implementadas.
