# Privacidade e segurança

<small>Status: requisitos planejados. Nada neste documento comprova que os controles já foram implementados, testados, auditados ou certificados.</small>

## Princípios de privacidade

A privacidade deve ser considerada desde a concepção do produto (Privacy by Design).

- **Coleta mínima:** solicitar somente os dados necessários para agendamento, administração da conta e funcionamento do serviço.
- **Finalidade clara:** informar por que cada dado é coletado e como será utilizado.
- **Base legal:** documentar a base legal aplicável a cada finalidade, conforme a legislação pertinente. Consentimento não deve ser tratado como a única base possível.
- **Transparência:** disponibilizar avisos e política de privacidade claros e acessíveis.
- **Direitos dos titulares:** criar procedimentos para receber e responder solicitações de titulares, conforme os direitos, exceções, prazos e requisitos da legislação aplicável.
- **Retenção limitada:** definir prazos de retenção e eliminar ou anonimizar dados quando deixarem de ser necessários, respeitando obrigações legais.
- **Fornecedores:** identificar terceiros que tratem dados, avaliar sua segurança e documentar responsabilidades e contratos.
- **Transferência internacional:** mapear países de origem e destino, fornecedores e localização dos dados. Avaliar os mecanismos legais aplicáveis, incluindo a Resolução CD/ANPD nº 19/2024 para transferências sujeitas à LGPD e o Capítulo V do GDPR quando aplicável.
- **Incidentes:** manter procedimento para detectar, investigar, registrar e comunicar incidentes conforme os prazos e exigências legais aplicáveis.
- **Cookies:** informar o uso de cookies e tecnologias semelhantes e obter consentimento quando exigido.
- **Menores:** definir regras de idade, autorização de responsáveis e tratamento de dados de menores conforme os mercados atendidos.

## Dados sensíveis e informações de saúde

Evitar coletar diagnósticos, prontuários ou detalhes médicos. Um agendamento pode, por si só, revelar informações sensíveis.

Se o tratamento de dados sensíveis for realmente necessário, definir finalidade e base legal apropriadas, restringir campos e acessos, aplicar proteção reforçada, limitar retenção e avaliar as obrigações específicas antes de disponibilizar o recurso.

Não presumir que toda clínica ou todo uso do sistema esteja automaticamente sujeito à HIPAA.

## Papéis no tratamento de dados

As funções de controlador, operador ou corresponsável devem refletir quem efetivamente determina as finalidades e os meios de cada tratamento, e não apenas o nome utilizado em um contrato.

A DMRJ Scheduling poderá ser controladora dos dados de cadastro, faturamento e segurança da própria plataforma e operadora dos dados de agendamento tratados sob instruções da empresa cliente. Os papéis, instruções, responsabilidades e contratos deverão ser definidos por atividade.

## Requisitos técnicos de segurança

Os controles abaixo deverão ser especificados, implementados e testados antes do lançamento:

- Aplicar autorização no servidor e no banco de dados, sem confiar apenas nos controles visuais da interface.
- Implementar políticas de acesso por empresa e por função, incluindo Row Level Security (RLS) quando aplicável.
- Testar tentativas de leitura, alteração, exclusão e exportação de dados entre empresas, inclusive por alteração manual de identificadores e chamadas diretas à API.
- Proteger operações administrativas com autenticação forte, privilégios mínimos e revisão periódica de permissões.
- Registrar operações administrativas e eventos de segurança relevantes, sem armazenar senhas, tokens ou dados pessoais desnecessários nos logs.
- Manter segredos e chaves fora do código-fonte e do repositório público, usando mecanismos seguros de configuração.
- Validar entradas, limitar tentativas e aplicar proteções contra abuso, automação maliciosa e solicitações excessivas.
- Definir backups, testes de restauração, monitoramento e procedimento de resposta a incidentes.
- Incluir testes automatizados de autorização e isolamento multiempresa no desenvolvimento e antes de cada lançamento relevante.

## Referências e aplicabilidade

Avaliar, conforme países, atividades e fluxos reais de dados:

- GDPR e regras complementares de proteção de dados da União Europeia e do Espaço Econômico Europeu.
- LGPD do Brasil.
- Leis de privacidade estaduais e federais aplicáveis nos Estados Unidos.
- COPPA quando houver coleta coberta de dados de crianças menores de 13 anos.
- HIPAA ou FTC Health Breach Notification Rule somente quando o produto e os participantes estiverem dentro do escopo dessas regras.
- OWASP Application Security Verification Standard (ASVS) 5.0.0 como referência para requisitos e testes de segurança de aplicações.
- ISO/IEC 27001:2022 e ISO/IEC 27701:2025 como referências para sistemas de gestão de segurança e privacidade.
- SOC 2 como possível avaliação independente para requisitos de clientes empresariais.
- PCI DSS conforme o papel da plataforma e o fluxo de pagamento.

A implementação de práticas não equivale a certificação. Um checkout hospedado por provedor pode reduzir o escopo técnico de PCI DSS, mas não elimina automaticamente todas as responsabilidades. A aplicabilidade deve ser confirmada com o provedor, adquirente ou bandeira.

GDPR e LGPD são leis; WCAG e OWASP ASVS são referências técnicas; ISO 27001 e ISO 27701 são normas de sistemas de gestão; SOC 2 é um exame/relatório de controles, não uma certificação ISO.

## Fontes oficiais

- [GDPR, texto oficial EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [LGPD, texto atualizado](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html)
- [ANPD: Resolução CD/ANPD nº 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024)
- [OWASP ASVS](https://asvs.owasp.org/)
- [ISO/IEC 27001](https://www.iso.org/standard/27001)
- [ISO/IEC 27701](https://committee.iso.org/standard/27701)
- [PCI Security Standards Council](https://www.pcisecuritystandards.org/standards/pci-dss/)
- [PCI SSC: terceirização do processamento de pagamentos](https://www.pcisecuritystandards.org/faqs/does-pci-dss-apply-to-merchants-who-outsource-all-payment-processing-operations-and-never-store-process-or-transmit-cardholder-data/)
- [FTC: privacidade e segurança para empresas](https://www.ftc.gov/business-guidance/privacy-security)

A versão vigente das referências e sua aplicabilidade deverão ser rechecadas antes do lançamento em cada mercado.
