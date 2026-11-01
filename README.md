# DMRJ Scheduling

Plataforma SaaS internacional de agendamento online para empresas de serviços.

## Visão do produto

O DMRJ Scheduling permitirá que salões, clínicas, spas, consultórios e outros negócios organizem seus serviços, profissionais, horários e reservas em um ambiente próprio.

A plataforma será multiempresa: cada negócio terá seus próprios dados e configurações, sem acesso aos dados de outras empresas.

## Tipos de acesso previstos

- **Administrador da plataforma:** gerencia o SaaS, empresas assinantes e planos.
- **Administrador da empresa:** gerencia sua empresa, unidades, serviços, equipe e agenda.
- **Funcionários:** acessam somente os recursos permitidos por suas permissões.
- **Clientes finais:** podem agendar sem criar uma conta, informando apenas os dados necessários para a reserva.

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

## Privacidade e proteção de dados

A privacidade será considerada desde a concepção do produto (Privacy by Design). As regras abaixo são requisitos de desenvolvimento e operação, não uma declaração de conformidade ou certificação já obtida.

- **Coleta mínima:** solicitar apenas os dados necessários para agendamento, administração da conta e funcionamento do serviço.
- **Finalidade clara:** informar por que cada dado é coletado e como será utilizado.
- **Base legal adequada:** documentar a base legal aplicável a cada finalidade, conforme a legislação do país e sem tratar consentimento como única base possível.
- **Transparência:** disponibilizar avisos e política de privacidade claros, acessíveis e traduzidos quando necessário.
- **Controle do usuário:** criar procedimentos para solicitações de acesso, correção, exportação, oposição e exclusão de dados, quando aplicáveis.
- **Retenção limitada:** definir prazos de retenção e eliminar ou anonimizar dados quando deixarem de ser necessários, respeitando obrigações legais.
- **Segurança:** usar criptografia em trânsito, proteção adequada de dados armazenados, autenticação segura, permissões por função e registros de atividades relevantes.
- **Separação entre empresas:** impedir que uma empresa, funcionário ou administrador de cliente acesse dados de outra empresa sem autorização.
- **Acesso restrito:** limitar o acesso interno aos dados pessoais ao mínimo necessário e registrar acessos administrativos sensíveis.
- **Fornecedores:** identificar serviços terceiros que tratem dados, avaliar sua segurança e documentar responsabilidades e contratos aplicáveis.
- **Transferência internacional:** avaliar os mecanismos legais necessários antes de transferir dados pessoais entre países.
- **Incidentes:** manter procedimento para detectar, investigar, registrar e comunicar incidentes de segurança conforme os prazos e exigências legais aplicáveis.
- **Cookies e rastreamento:** informar o uso de cookies e tecnologias semelhantes e obter consentimento quando exigido.
- **Dados sensíveis:** evitar coletar informações médicas ou outras categorias sensíveis quando não forem indispensáveis. Se houver necessidade, aplicar proteção reforçada e avaliar requisitos específicos.
- **Contas e menores:** definir regras de idade, autorização de responsáveis e tratamento de dados de menores conforme os mercados atendidos.

As empresas clientes serão orientadas sobre suas responsabilidades como controladoras dos dados de seus clientes, enquanto a DMRJ Scheduling poderá atuar como operadora em determinadas atividades. Os papéis e obrigações deverão ser definidos nos contratos e no fluxo real de tratamento de dados.

## Padrões e requisitos internacionais a avaliar

O projeto será desenvolvido considerando, conforme os países e atividades atendidos:

- GDPR e regras complementares de proteção de dados da União Europeia e do Espaço Econômico Europeu.
- LGPD do Brasil.
- Leis de privacidade estaduais e federais aplicáveis nos Estados Unidos e legislações de outros países.
- OWASP ASVS e boas práticas de desenvolvimento seguro.
- WCAG 2.2 nível AA como objetivo de acessibilidade.
- ISO/IEC 27001 e ISO/IEC 27701 como referências para gestão de segurança e privacidade.
- SOC 2 como possível avaliação independente para atender requisitos de clientes empresariais.
- PCI DSS caso o escopo de pagamentos venha a envolver dados de cartões; a utilização de um provedor com checkout hospedado pode reduzir o escopo de responsabilidade.

A menção a normas e padrões indica referências e objetivos de projeto. Não significa que a plataforma já tenha certificação, auditoria concluída ou conformidade legal comprovada. A aplicabilidade deverá ser validada antes de operar em cada mercado, com apoio jurídico e técnico adequado.

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
- Avaliar requisitos fiscais, contratuais, de consumo e de faturamento nos mercados atendidos.

## Situação do projeto

**Fase atual:** planejamento e estruturação inicial.

Este repositório é o ponto de partida do desenvolvimento. Funcionalidades descritas como planejadas ainda não estão implementadas. As regras de privacidade, segurança e padrões internacionais acima ainda precisam ser implementadas, testadas e validadas antes do lançamento.
