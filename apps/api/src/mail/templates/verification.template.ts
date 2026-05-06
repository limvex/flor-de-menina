export function verificationTemplate(name: string, link: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4a2c1a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#f5f0eb;font-size:24px;font-weight:400;letter-spacing:2px;">FLOR DE MENINA</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#4a2c1a;font-size:20px;font-weight:400;">Olá, ${name}!</h2>
              <p style="margin:0 0 24px;color:#666;line-height:1.6;font-size:15px;">
                Obrigada por se cadastrar na Flor de Menina. Para confirmar seu e-mail e ativar sua conta, clique no botão abaixo:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#4a2c1a;border-radius:4px;padding:14px 32px;">
                    <a href="${link}" style="color:#f5f0eb;text-decoration:none;font-size:15px;letter-spacing:1px;">Confirmar e-mail</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#999;font-size:13px;">
                Este link expira em 24 horas. Se você não se cadastrou, ignore este e-mail.
              </p>
              <p style="margin:0;color:#bbb;font-size:12px;word-break:break-all;">
                Ou copie: <a href="${link}" style="color:#4a2c1a;">${link}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f0ebe6;text-align:center;">
              <p style="margin:0;color:#bbb;font-size:12px;">© 2026 Flor de Menina · Maceió, AL</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
