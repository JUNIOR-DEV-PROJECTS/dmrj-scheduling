# Diagnóstico do Supabase

O endpoint `/api/diagnostico-supabase` verifica se as variáveis de ambiente do Supabase estão disponíveis no servidor e se o endpoint de autenticação pode ser alcançado.

Variáveis esperadas no ambiente de produção:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Após alterar variáveis `NEXT_PUBLIC_` no Netlify, é necessário executar um novo build para que os valores sejam incorporados à aplicação.

O diagnóstico não exibe valores de chaves nem valida credenciais de usuários.
