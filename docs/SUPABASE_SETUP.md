# Configuração do Supabase

**Status:** a integração inicial foi adicionada ao código, mas ainda depende da criação e configuração de um projeto Supabase. O login e o cadastro não devem ser considerados ativos até concluir os passos abaixo e testar os fluxos.

## 1. Criar o projeto

1. Acesse [Supabase](https://supabase.com/) e entre na sua conta.
2. Crie um projeto para o DMRJ Scheduling.
3. Guarde a senha do banco em um local seguro. Ela não é necessária no código da aplicação.
4. Aguarde o banco ficar pronto.

## 2. Criar as tabelas de identidade

1. Abra o projeto Supabase.
2. Entre em **SQL Editor**.
3. Abra no GitHub o arquivo `supabase/migrations/20261101000100_identity_and_organizations.sql`.
4. Copie o conteúdo completo, cole no SQL Editor e execute.
5. Confira se as tabelas `organizations` e `organization_members` foram criadas.

A migration cria o vínculo inicial de uma empresa com a pessoa que a cadastrou. Ela não cria administradores globais.

## 3. Configurar as variáveis no ambiente da aplicação

1. No Supabase, abra **Project Settings → API** ou **Connect**.
2. Copie a **Project URL**.
3. Copie a **Publishable key**. Não use a chave `service_role` ou qualquer chave secreta no navegador.
4. No ambiente local, copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

5. Na hospedagem, cadastre as mesmas duas variáveis nas configurações de ambiente do projeto.

O arquivo `.env.local` já está ignorado pelo Git. Nunca publique chaves secretas no repositório.

## 4. Configurar autenticação e confirmação de e-mail

Em **Authentication → Settings**, configure o tamanho mínimo da senha para pelo menos 12 caracteres. Mantenha a confirmação de e-mail habilitada e configure a URL de redirecionamento para o domínio da aplicação:

- Desenvolvimento: `http://localhost:3000/auth/callback`
- Produção: `https://SEU-DOMINIO/auth/callback`

O fluxo de recuperação também utiliza esse callback e redireciona para `/redefinir-senha`. Inclua o endereço de callback na lista permitida. O e-mail de recuperação é solicitado pela tela `/recuperar-senha`.

Inclua os endereços correspondentes na lista de URLs permitidas do Supabase Auth. O endereço de produção deverá ser o domínio real usado pelo projeto.

## 5. Instalar dependências e testar

No terminal, dentro da pasta do projeto:

```bash
npm install
npm run build
npm run dev
```

Depois, testar:
- Cadastro de empresa com e-mail válido.
- Confirmação pelo link recebido.
- Entrada com e-mail e senha.
- Acesso negado ao painel sem sessão válida.
- Acesso negado quando não existir vínculo ativo com uma empresa.
- Usuário de uma empresa não consegue consultar os dados de outra empresa.

## O que já está no código

- Cliente Supabase para navegador e servidor usando sessões em cookies.
- Middleware de atualização/validação da sessão.
- Callback de confirmação de e-mail.
- Cadastro com metadados mínimos para criar a empresa e o vínculo de proprietário pela função do banco.
- Senha mínima de 12 caracteres no formulário.
- RLS nas tabelas iniciais de empresas e membros.
- Proteção do painel de empresa por sessão verificada e vínculo ativo.

## O que ainda não está pronto

- A migration ainda precisa ser executada no projeto Supabase.
- As variáveis de ambiente ainda precisam ser configuradas.
- O fluxo precisa ser executado e testado em ambiente real.
- Recuperação de senha, convite de funcionários e gestão de membros ainda não foram implementados.
- O administrador global precisa ser provisionado por procedimento separado e protegido.
- O painel atual continua sendo uma demonstração, não um painel operacional conectado ao banco.

Não divulgar o sistema como pronto para receber clientes até que os testes de autenticação, RLS e isolamento entre empresas sejam concluídos.
