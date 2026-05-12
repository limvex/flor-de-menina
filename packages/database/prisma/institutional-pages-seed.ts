/** Conteúdo HTML inicial das páginas institucionais (Task #24). */

export type InstitutionalPageSeedRow = {
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
};

export const INSTITUTIONAL_PAGES_SEED: InstitutionalPageSeedRow[] = [
  {
    slug: 'sobre',
    title: 'Sobre a Flor de Menina',
    sortOrder: 0,
    content: `<h1>Nossa história</h1>
<p>A Flor de Menina nasceu em Maceió-AL com um propósito simples: oferecer moda feminina com identidade, qualidade e afeto. O que começou como um sonho se tornou uma loja amada por mais de 290 mil mulheres que nos seguem, inspiram e fazem parte dessa história.</p>
<h2>O que nos move</h2>
<p>Acreditamos que a moda vai além da roupa — ela é expressão, é confiança, é como você se apresenta ao mundo. Por isso cada peça é escolhida com cuidado, pensando em mulheres reais, com rotinas reais e estilos únicos.</p>
<h2>Nossa loja física</h2>
<p>Você pode nos visitar pessoalmente em Maceió-AL. Nosso time estará pronto para te atender com a mesma atenção e carinho que você encontra aqui no site.</p>
<h2>Fale com a gente</h2>
<p>Dúvidas, sugestões ou só quer dizer oi? Nos encontre no Instagram <strong>@flordemenina</strong> ou envie um email para <strong>contato@flordemenina.store</strong>.</p>`,
  },
  {
    slug: 'trocas-e-devolucoes',
    title: 'Trocas e Devoluções',
    sortOrder: 1,
    content: `<h1>Trocas e Devoluções</h1>
<p>Queremos que você ame cada peça que receber. Se algo não saiu como esperado, estamos aqui para resolver.</p>
<h2>Prazo para solicitação</h2>
<p>Você tem até <strong>7 dias corridos</strong> após o recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor (Art. 49).</p>
<h2>Condições para troca ou devolução</h2>
<ul>
  <li>Produto sem uso, lavagem ou alteração</li>
  <li>Etiquetas originais intactas</li>
  <li>Na embalagem original ou embalagem adequada para transporte</li>
  <li>Acompanhado da nota fiscal</li>
</ul>
<h2>Como solicitar</h2>
<p>Entre em contato pelo email <strong>contato@flordemenina.store</strong> ou pelo Instagram <strong>@flordemenina</strong> informando o número do pedido e o motivo da solicitação. Nossa equipe responderá em até 2 dias úteis.</p>
<h2>Produto com defeito</h2>
<p>Se você receber um produto com defeito de fabricação, realizamos a troca sem qualquer custo adicional. O frete de retorno será por nossa conta.</p>
<h2>Reembolso</h2>
<p>Aprovada a devolução, o reembolso é realizado em até <strong>10 dias úteis</strong> pelo mesmo meio de pagamento utilizado na compra. Para pagamentos via PIX, pode ser necessário informar dados bancários.</p>
<h2>Exceções</h2>
<p>Não realizamos trocas ou devoluções de produtos em promoção com desconto acima de 50%, peças íntimas ou itens personalizados.</p>`,
  },
  {
    slug: 'faq',
    title: 'Perguntas Frequentes',
    sortOrder: 2,
    content: `<h1>Perguntas Frequentes</h1>
<h2>Pedidos e Pagamento</h2>
<h3>Quais formas de pagamento são aceitas?</h3>
<p>Aceitamos PIX (com desconto especial), cartão de crédito em até 12x sem juros e cartão de débito.</p>
<h3>Posso alterar ou cancelar meu pedido?</h3>
<p>Pedidos podem ser cancelados em até 2 horas após a confirmação do pagamento. Após esse prazo, entre em contato conosco e avaliaremos cada caso.</p>
<h3>Como acompanho meu pedido?</h3>
<p>Após o envio, você receberá um email com o código de rastreio. Você também pode acompanhar em <strong>Minha Conta → Meus Pedidos</strong>.</p>
<h2>Entregas</h2>
<h3>Qual o prazo de entrega?</h3>
<p>O prazo varia conforme a região e a modalidade de frete escolhida no checkout. Após a confirmação do pagamento, preparamos seu pedido em até 2 dias úteis antes do envio.</p>
<h3>Vocês entregam para todo o Brasil?</h3>
<p>Sim! Entregamos para todo o território nacional via Correios e transportadoras parceiras.</p>
<h3>Tem frete grátis?</h3>
<p>Sim! Pedidos acima de R$299,00 têm frete grátis para todo o Brasil.</p>
<h2>Produtos e Tamanhos</h2>
<h3>Como saber qual tamanho escolher?</h3>
<p>Cada produto tem uma tabela de medidas na página de detalhes. Você também pode usar nosso <strong>Provador Virtual</strong> para uma recomendação personalizada.</p>
<h3>Os produtos são os mesmos da loja física?</h3>
<p>Sim! Nosso site reflete o catálogo atual da loja em Maceió-AL, com estoque atualizado em tempo real.</p>
<h2>Conta e Privacidade</h2>
<h3>Preciso criar uma conta para comprar?</h3>
<p>Sim. Para finalizar a compra é necessário cadastro — assim você acompanha pedidos, salva endereços e usa a wishlist com segurança.</p>
<h3>Meus dados estão seguros?</h3>
<p>Sim. Utilizamos criptografia SSL e seguimos as diretrizes da LGPD. Seus dados nunca são vendidos ou compartilhados com terceiros sem seu consentimento.</p>`,
  },
  {
    slug: 'politica-de-privacidade',
    title: 'Política de Privacidade',
    sortOrder: 3,
    content: `<h1>Política de Privacidade</h1>
<p><em>Última atualização: Janeiro de 2025</em></p>
<p>A Flor de Menina está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
<h2>1. Quais dados coletamos</h2>
<ul>
  <li><strong>Dados de cadastro</strong>: nome, email, CPF, telefone e endereço</li>
  <li><strong>Dados de navegação</strong>: páginas visitadas, produtos visualizados e tempo de sessão</li>
  <li><strong>Dados de compra</strong>: histórico de pedidos e preferências de produto</li>
  <li><strong>Dados de pagamento</strong>: processados diretamente pelo Mercado Pago — não armazenamos dados de cartão</li>
</ul>
<h2>2. Como usamos seus dados</h2>
<ul>
  <li>Processar e entregar seus pedidos</li>
  <li>Enviar comunicações sobre pedidos e atualizações de estoque</li>
  <li>Melhorar nossa experiência de compra</li>
  <li>Cumprir obrigações legais e fiscais</li>
</ul>
<h2>3. Compartilhamento de dados</h2>
<p>Compartilhamos seus dados apenas com parceiros essenciais para a operação: transportadoras (para entrega), processadores de pagamento (Mercado Pago) e serviços de email (Resend). Nunca vendemos seus dados.</p>
<h2>4. Seus direitos (LGPD)</h2>
<p>Você tem direito a: confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos, solicitar anonimização ou exclusão, e revogar consentimento. Para exercer esses direitos, entre em contato: <strong>contato@flordemenina.store</strong>.</p>
<h2>5. Cookies</h2>
<p>Utilizamos cookies essenciais para funcionamento do site e cookies analíticos (Google Analytics) para melhorar a experiência. Você pode gerenciar cookies nas configurações do seu navegador.</p>
<h2>6. Segurança</h2>
<p>Utilizamos criptografia SSL/TLS em todas as comunicações e seguimos boas práticas de segurança para proteger suas informações.</p>
<h2>7. Contato</h2>
<p>Encarregado de Proteção de Dados: <strong>contato@flordemenina.store</strong></p>`,
  },
  {
    slug: 'termos-de-uso',
    title: 'Termos de Uso',
    sortOrder: 4,
    content: `<h1>Termos de Uso</h1>
<p><em>Última atualização: Janeiro de 2025</em></p>
<p>Ao acessar e utilizar o site Flor de Menina, você concorda com os presentes Termos de Uso. Leia com atenção antes de prosseguir.</p>
<h2>1. Aceitação dos termos</h2>
<p>O uso deste site implica na aceitação integral destes termos. Reservamo-nos o direito de atualizá-los a qualquer momento, com comunicação prévia aos usuários cadastrados.</p>
<h2>2. Uso do site</h2>
<p>O site é destinado a pessoas físicas maiores de 18 anos ou menores acompanhados por responsável legal. É proibido usar o site para fins ilícitos, fraudulentos ou que violem direitos de terceiros.</p>
<h2>3. Cadastro e conta</h2>
<p>Você é responsável pela veracidade das informações fornecidas no cadastro e pela segurança da sua senha. Notifique-nos imediatamente em caso de acesso não autorizado à sua conta.</p>
<h2>4. Produtos e preços</h2>
<p>Nos reservamos o direito de alterar preços, descrições e disponibilidade de produtos sem aviso prévio. Em caso de erro de preço evidente, entraremos em contato antes de processar o pedido.</p>
<h2>5. Propriedade intelectual</h2>
<p>Todo o conteúdo do site (textos, imagens, logotipo, layout) é de propriedade da Flor de Menina e protegido por direitos autorais. É proibida a reprodução sem autorização expressa.</p>
<h2>6. Limitação de responsabilidade</h2>
<p>Não nos responsabilizamos por danos decorrentes de uso indevido do site, indisponibilidade temporária ou ações de terceiros fora do nosso controle.</p>
<h2>7. Foro</h2>
<p>Fica eleito o foro da comarca de Maceió-AL para resolução de quaisquer litígios decorrentes destes termos.</p>
<h2>8. Contato</h2>
<p>Dúvidas sobre estes termos: <strong>contato@flordemenina.store</strong></p>`,
  },
];
