# Estado de implementação do DMRJ Scheduling

Atualizado em 03/11/2026. Este documento separa o que está no código do que já foi confirmado no ambiente hospedado.

## Implementado no repositório

- Cadastro de empresa e autenticação Supabase.
- Cadastro e consulta de clientes, profissionais e serviços.
- Gestão de agendamentos e atualização de status.
- Expediente da empresa, jornada dos profissionais, bloqueios e feriados.
- Verificação de horários disponíveis e proteção contra conflitos simultâneos.
- Consulta privada de agendamento por token individual.
- Botão para copiar o link privado na lista de agendamentos.
- Remoção da rota de reserva pública do cliente.

## Verificação técnica

- Commit de links privados: `a94231ed303938899341f9bbdfdf8c3a977244a1`.
- GitHub Actions: compilação de produção concluída com sucesso.
- A compilação confirma que o projeto compila; não substitui testes funcionais no site publicado.

## Ações externas pendentes

1. Aplicar no Supabase a migration `20261104000200_private_appointment_links.sql`.
2. Confirmar que a nova versão foi publicada na hospedagem.
3. Testar criação de agendamento, cópia do link, abertura sem login e isolamento entre links.
4. Escolher e configurar o provedor de pagamentos antes de ativar cobranças reais.
5. Finalizar e revisar os documentos legais e os dados de contato da operação.
6. Realizar testes de lançamento, incluindo permissões e isolamento multiempresa.

## Pagamentos

A estrutura de tabelas de planos e assinaturas existe no banco, mas não há integração com checkout, cobrança recorrente ou webhook. Os preços atuais são propostas documentadas, não uma oferta ativa. A integração depende da escolha do provedor, da conta comercial e das chaves privadas configuradas em ambiente seguro.

## Hospedagem

O repositório pode receber alterações e o GitHub Actions pode compilar o projeto enquanto a publicação do Netlify estiver pausada por limite de créditos. Não considerar um commit como publicação.
