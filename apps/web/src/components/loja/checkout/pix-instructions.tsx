import { QrCode, Clock } from 'lucide-react';

export function PixInstructions() {
  return (
    <div className="rounded-lg border border-flor-200 bg-flor-50 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <QrCode className="h-8 w-8 text-flor-600" aria-hidden="true" />
        <div>
          <p className="font-medium text-flor-800">Pagamento via PIX</p>
          <p className="text-sm text-flor-500">Rápido, seguro e sem taxas adicionais</p>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-flor-600">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-flor-200 text-center text-xs leading-4 text-flor-700">
            1
          </span>
          Confirme o pedido para receber o QR Code e o código Copia e Cola
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-flor-200 text-center text-xs leading-4 text-flor-700">
            2
          </span>
          Abra o app do seu banco e escaneie o QR Code ou use o Copia e Cola
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-flor-200 text-center text-xs leading-4 text-flor-700">
            3
          </span>
          Após a confirmação, você receberá um e-mail com os detalhes do pedido
        </li>
      </ul>

      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>O PIX expira em 30 minutos após a geração</span>
      </div>
    </div>
  );
}
