# Arquitetura técnica

<small>Status: arquitetura inicial planejada. As tecnologias e os controles ainda precisam ser validados durante a implementação.</small>

## Visão geral

O DMRJ Scheduling será uma aplicação SaaS multiempresa para agendamento online. Cada empresa deverá ter seus próprios dados, usuários, configurações, serviços, profissionais e reservas.

A separação entre empresas deverá ser aplicada no servidor e no banco de dados. Não será suficiente ocultar dados apenas na interface.

## Tecnologias consideradas

- **Next.js e TypeScript:** aplicação web.
- **Supabase e PostgreSQL:** banco de dados, autenticação e políticas de acesso.
- **GitHub:** versionamento do código.
- **Vercel:** opção de hospedagem e publicação, sujeita à verificação das condições comerciais, uso comercial permitido e limites do plano escolhido.

A escolha final deverá considerar segurança, manutenção, portabilidade, limites gratuitos e custos quando o produto crescer. Nenhum serviço deve ser contratado sem avaliação prévia das condições.

## Modelo multiempresa

A arquitetura deverá prever:

- Administrador da plataforma.
- Administrador de cada empresa.
- Funcionários com permissões específicas.
- Clientes finais que podem realizar reservas sem criar conta.
- Separação de dados por empresa e, quando aplicável, por unidade.
- Verificação de autorização no servidor e no banco de dados.
- Testes contra acesso cruzado entre empresas.

A identidade de um usuário e sua participação em uma empresa devem ser tratadas separadamente. O cadastro de cliente final não deve exigir conta global nem compartilhar dados entre empresas sem necessidade e base adequada.

## Datas, horários e fusos

- Armazenar instantes de data e hora em UTC.
- Exibir horários de acordo com o fuso IANA configurado para a empresa ou unidade.
- Não utilizar offsets fixos como substitutos de fusos horários.
- Considerar mudanças de horário legal e regras locais ao calcular disponibilidade e reservas.

## Moedas e localização

- Separar a moeda da assinatura do SaaS da moeda dos serviços oferecidos pela empresa.
- Utilizar códigos de moeda padronizados (ISO 4217).
- Preparar formatos locais de datas, horários, números e valores.
- A interface inicial está planejada em português, inglês e espanhol.
- Prever preferência individual de idioma e modo claro, escuro ou automático.

## Agendamentos

A implementação deverá impedir reservas duplicadas, inclusive quando duas solicitações concorrentes tentarem reservar o mesmo horário.

A regra deverá ser garantida no banco de dados e na lógica transacional do servidor, não apenas por validação visual na tela. O desenho definitivo será documentado no esquema do banco e coberto por testes de concorrência.

## Pagamentos e assinaturas

A integração de pagamentos ainda não foi escolhida nem implementada. Não há provedor integrado e não devem ocorrer cobranças reais nesta fase.

Antes da integração, definir países atendidos, moedas, tarifas, tributos, faturamento, renovação, cancelamento, reembolso, falhas de pagamento, período de teste e responsabilidades de segurança do fluxo de pagamento.

A plataforma deverá evitar armazenar dados completos de cartão quando o processamento direto por um provedor for adequado.

## Documentos técnicos relacionados

- [Planos e preços](PLANS.md)
- [Privacidade e segurança](PRIVACY-SECURITY.md)
- [Acessibilidade e localização](ACCESSIBILITY-LOCALIZATION.md)
- [Preparação para lançamento](LAUNCH-READINESS.md)

O esquema detalhado do banco de dados será especificado em documento próprio antes da implementação das tabelas e políticas.
