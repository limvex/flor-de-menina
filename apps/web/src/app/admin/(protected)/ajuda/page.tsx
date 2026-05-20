import {
  Package,
  Tag,
  BarChart3,
  ShoppingBag,
  Ticket,
  Palette,
  Truck,
  Users,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 space-y-4">
      <h2 className="font-serif text-xl text-stone-900 flex items-center gap-2">
        <Icon className="h-5 w-5 text-flor-600 shrink-0" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1.5 text-stone-600 text-sm leading-relaxed list-decimal list-inside">
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ol>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-relaxed">
      {children}
    </p>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-medium text-stone-800 text-sm">{children}</h3>;
}

export default function AjudaPage() {
  return (
    <div>
      <AdminPageHeader
        title="Central de Ajuda"
        description="Tudo que você precisa saber para usar o painel."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Produtos */}
        <Section icon={Package} title="Produtos">
          <div className="space-y-3">
            <SubHeading>Como cadastrar um produto:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Produtos</strong> no menu lateral',
                'Clique no botão <strong>Novo produto</strong> (canto superior direito)',
                'Preencha o nome do produto, descrição e preço',
                'Adicione as fotos do produto (arraste ou clique para selecionar)',
                'Escolha a categoria do produto',
                'Adicione as variações (tamanhos e cores disponíveis)',
                'Clique em <strong>Salvar produto</strong>',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Como editar um produto:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Produtos</strong> no menu',
                'Encontre o produto na lista e clique nele',
                'Altere o que precisar e clique em <strong>Salvar</strong>',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Como desativar um produto (tirar da loja sem apagar):</SubHeading>
            <Steps
              items={[
                'Abra o produto',
                'Mude o status para <strong>Inativo</strong>',
                'Salve — o produto some da loja mas fica salvo no sistema',
              ]}
            />
          </div>
        </Section>

        {/* Categorias */}
        <Section icon={Tag} title="Categorias">
          <div className="space-y-3">
            <SubHeading>Como criar uma categoria:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Categorias</strong> no menu',
                'Clique em <strong>Nova categoria</strong>',
                'Digite o nome (ex: Vestidos, Blusas, Calças)',
                'Salve',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Como editar ou excluir:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Categorias</strong>',
                'Clique na categoria desejada',
                'Edite o nome ou clique em <strong>Excluir</strong>',
              ]}
            />
          </div>
          <Tip>⚠️ Não exclua uma categoria que ainda tem produtos — mova os produtos primeiro.</Tip>
        </Section>

        {/* Estoque */}
        <Section icon={BarChart3} title="Estoque">
          <div className="space-y-3">
            <SubHeading>Como ver o estoque atual:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Estoque</strong> no menu',
                'Você verá todos os produtos com a quantidade disponível por tamanho e cor',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Como ajustar o estoque:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Estoque</strong>',
                'Encontre a variação que deseja ajustar (ex: Vestido Floral — P — Rosa)',
                'Clique no item',
                'Altere a quantidade e salve',
              ]}
            />
          </div>
          <Tip>
            💡 Quando o estoque de uma variação chega a zero, ela aparece como{' '}
            <strong>Esgotado</strong> automaticamente na loja.
          </Tip>
        </Section>

        {/* Pedidos */}
        <Section icon={ShoppingBag} title="Pedidos">
          <div className="space-y-3">
            <SubHeading>Como ver os pedidos:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Pedidos</strong> no menu',
                'Você verá todos os pedidos com status, valor e data',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Status dos pedidos:</SubHeading>
            <ul className="space-y-1.5 text-stone-600 text-sm leading-relaxed">
              <li>
                <strong>Aguardando pagamento</strong> — cliente fez o pedido mas ainda não pagou
              </li>
              <li>
                <strong>Pago</strong> — pagamento confirmado, separar para envio
              </li>
              <li>
                <strong>Enviado</strong> — produto saiu para entrega
              </li>
              <li>
                <strong>Entregue</strong> — cliente recebeu
              </li>
              <li>
                <strong>Cancelado</strong> — pedido cancelado
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <SubHeading>Como atualizar o status de um pedido:</SubHeading>
            <Steps
              items={[
                'Clique no pedido',
                'Altere o status no campo correspondente',
                'Salve — o cliente recebe e-mail automático com a atualização',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Como ver os dados de entrega:</SubHeading>
            <Steps
              items={[
                'Abra o pedido',
                'Os dados do cliente e endereço de entrega aparecem na página do pedido',
              ]}
            />
          </div>
        </Section>

        {/* Cupons */}
        <Section icon={Ticket} title="Cupons">
          <div className="space-y-3">
            <SubHeading>Como criar um cupom de desconto:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Cupons</strong> no menu',
                'Clique em <strong>Novo cupom</strong>',
                'Defina o código (ex: BEMVINDA10), o tipo de desconto (porcentagem ou valor fixo) e o valor',
                'Defina a data de validade se quiser',
                'Salve',
              ]}
            />
          </div>
          <div className="space-y-3">
            <SubHeading>Como desativar um cupom:</SubHeading>
            <Steps
              items={[
                'Clique no cupom',
                'Mude o status para <strong>Inativo</strong>',
                'Salve — o cupom para de funcionar imediatamente',
              ]}
            />
          </div>
        </Section>

        {/* Aparência */}
        <Section icon={Palette} title="Aparência">
          <div className="space-y-3">
            <SubHeading>Como trocar a imagem do banner da home:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Configurações</strong> no menu',
                'Clique em <strong>Aparência</strong>',
                'Na seção de banners, clique em <strong>Adicionar banner</strong> ou substitua a imagem existente',
                'Faça o upload da nova imagem',
                'Preencha o título e o texto do botão se quiser',
                'Clique em <strong>Salvar banners</strong>',
              ]}
            />
          </div>
          <Tip>
            💡 O banner aparece na página inicial da loja. Use imagens horizontais e de boa
            qualidade.
          </Tip>
        </Section>

        {/* Frete */}
        <Section icon={Truck} title="Frete">
          <div className="space-y-3">
            <SubHeading>Como configurar o frete:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Configurações</strong>',
                'Clique em <strong>Frete</strong>',
                'Configure as opções de entrega disponíveis',
                'Salve',
              ]}
            />
          </div>
        </Section>

        {/* Usuários */}
        <Section icon={Users} title="Usuários do admin">
          <div className="space-y-3">
            <SubHeading>Como adicionar um novo administrador:</SubHeading>
            <Steps
              items={[
                'Clique em <strong>Configurações</strong>',
                'Clique em <strong>Usuários</strong>',
                'Clique em <strong>Novo usuário</strong>',
                'Preencha o nome, e-mail e defina a função (Admin ou Operador)',
                'Salve — a pessoa receberá um e-mail para criar a senha',
              ]}
            />
          </div>
          <Tip>
            ⚠️ Só crie usuários admin para pessoas de confiança. Eles terão acesso total ao sistema.
          </Tip>
        </Section>

        {/* Páginas */}
        <Section icon={FileText} title="Páginas">
          <div className="space-y-3">
            <SubHeading>
              Como editar uma página do site (ex: Sobre nós, Política de troca):
            </SubHeading>
            <Steps
              items={[
                'Clique em <strong>Páginas</strong> no menu',
                'Clique na página que deseja editar',
                'Edite o conteúdo no editor',
                'Salve — a página é atualizada automaticamente no site',
              ]}
            />
          </div>
        </Section>

        {/* FAQ — ocupa largura total no desktop */}
        <div className="lg:col-span-2">
          <Section icon={HelpCircle} title="Dúvidas frequentes">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="font-medium text-stone-800 text-sm">
                  O produto não aparece na loja — o que fazer?
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Verifique se o status do produto está como <strong>Ativo</strong> e se ele tem
                  pelo menos uma variação com estoque maior que zero.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-medium text-stone-800 text-sm">
                  O cliente disse que não recebeu o e-mail de confirmação — o que fazer?
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Peça para ele verificar a pasta de spam. Se não estiver lá, abra o pedido no admin
                  e confira se o e-mail do cliente está correto.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-medium text-stone-800 text-sm">Como cancelar um pedido?</p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Abra o pedido e mude o status para <strong>Cancelado</strong>. Se o pagamento já
                  foi feito, entre em contato com o cliente para combinar o reembolso.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-medium text-stone-800 text-sm">
                  Esqueci a senha do admin — o que fazer?
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Na tela de login, clique em <strong>Esqueci minha senha</strong> e siga as
                  instruções no e-mail.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
