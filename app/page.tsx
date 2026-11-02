const highlights = [
  {
    number: "01",
    title: "Agenda organizada",
    description: "Visualize os horários e os compromissos da sua equipe em um só lugar.",
  },
  {
    number: "02",
    title: "Reservas online",
    description: "Seus clientes poderão escolher serviços e horários sem precisar criar uma conta.",
  },
  {
    number: "03",
    title: "Feito para crescer",
    description: "Uma plataforma preparada para empresas, equipes e unidades em diferentes países.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="DMRJ Scheduling início">
          <span className="brand-mark">D</span>
          <span>DMRJ <strong>Scheduling</strong></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="header-actions"><a className="header-login" href="/login">Entrar</a><a className="header-link" href="/cadastro/empresa">Cadastrar empresa</a></div>
      </header>

      <section className="hero" id="sobre">
        <div className="hero-content">
          <span className="eyebrow">AGENDAMENTO MAIS SIMPLES</span>
          <h1>Seu negócio organizado. Seus horários sob controle.</h1>
          <p>
            Uma nova forma de gerenciar serviços, profissionais e reservas.
            Simples para sua equipe e prático para seus clientes.
          </p>
          <a className="primary-button" href="/cadastro/empresa">Começar cadastro <span aria-hidden="true">→</span></a>
          <div className="hero-note">
            <span className="status-dot" />
            <span>Um espaço de agendamento preparado para o mundo.</span>
          </div>
        </div>

        <div className="preview-card" aria-label="Prévia ilustrativa de agenda">
          <div className="preview-top">
            <div>
              <span className="preview-label">VISÃO GERAL</span>
              <h2>Sua agenda</h2>
            </div>
            <span className="preview-date">Hoje</span>
          </div>
          <div className="preview-summary">
            <div><strong>08</strong><span>Agendamentos</span></div>
            <div><strong>04</strong><span>Profissionais</span></div>
          </div>
          <div className="schedule-list">
            <div className="schedule-item"><span className="schedule-time">09:00</span><span className="schedule-color color-one" /><span><strong>Atendimento</strong><small>Serviço de exemplo</small></span><span className="schedule-state">Confirmado</span></div>
            <div className="schedule-item"><span className="schedule-time">10:30</span><span className="schedule-color color-two" /><span><strong>Consulta</strong><small>Serviço de exemplo</small></span><span className="schedule-state">Confirmado</span></div>
            <div className="schedule-item"><span className="schedule-time">13:00</span><span className="schedule-color color-three" /><span><strong>Reunião</strong><small>Serviço de exemplo</small></span><span className="schedule-state">Pendente</span></div>
          </div>
          <p className="preview-disclaimer">Prévia ilustrativa. As funções ainda estão em desenvolvimento.</p>
        </div>
      </section>

      <section className="features" id="recursos">
        <div className="section-heading">
          <span className="eyebrow">RECURSOS</span>
          <h2>Mais tempo para cuidar do seu negócio.</h2>
          <p>O essencial para organizar sua rotina de atendimento em uma única plataforma.</p>
        </div>
        <div className="feature-grid">
          {highlights.map((item) => (
            <article className="feature-card" key={item.number}>
              <span className="feature-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer id="contato">
        <a className="brand footer-brand" href="/">
          <span className="brand-mark">D</span>
          <span>DMRJ <strong>Scheduling</strong></span>
        </a>
        <p>© {new Date().getFullYear()} DMRJ Scheduling. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
