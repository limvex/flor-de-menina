// TODO(task-#21): integrar com módulo de reviews
export function ReviewsSection({ productId: _productId }: { productId: string }) {
  return (
    <section className="mt-16 border-t border-stone-100 pt-12">
      <h2 className="mb-6 font-serif text-2xl text-stone-900">Avaliações</h2>
      <div className="rounded border border-dashed border-stone-300 p-8 text-center">
        <p className="text-stone-500">Sistema de avaliações em breve</p>
      </div>
    </section>
  );
}
