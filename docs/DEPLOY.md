# Deploy & Infraestrutura

## Ambientes

### Desenvolvimento (gratuito)

- **Web:** Vercel free tier (deploy automático do GitHub na branch `main`)
- **API:** Railway free trial (Docker deploy)
- **Postgres:** Railway free tier
- Usado durante desenvolvimento, antes do go-live

### Produção (final)

- **VPS:** Hostinger KVM 2 (4GB RAM, 2 vCPU, datacenter BR)
- **Orquestrador:** Coolify (open source, gerencia Docker + SSL + backups)
- **Domínio:** flordemenina.store
- **DNS:** A record apontando pro IP da VPS
- **SSL:** Let's Encrypt automático via Coolify
- **Imagens:** Cloudflare R2 (10GB free tier)
- **Backup:** dump automático do Postgres pro R2 (diário)

## Migração dev → prod

1. Provisionar VPS Hostinger
2. Instalar Coolify
3. Apontar DNS de `flordemenina.store` pro IP da VPS
4. Criar projeto no Coolify, conectar repo GitHub
5. Configurar variáveis de ambiente de produção
6. Deploy via Coolify (build a partir do Dockerfile de cada app)
7. Validar SSL, health checks, smoke test
8. Atualizar webhooks (Mercado Pago, Melhor Envio) pro novo domínio
9. Deletar deploys do Vercel e Railway
