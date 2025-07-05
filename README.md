# Raphael-san Bot

Bot Discord com sistema de votação de fotos e diversas funcionalidades.

## Estrutura do Projeto

- `main.js`: Arquivo principal do bot Discord
- `webserver.js`: Servidor web para o sistema de votação
- `start.js`: Script para iniciar tanto o bot quanto o servidor web
- `commands/`: Diretório contendo os comandos do bot
- `models/`: Modelos do MongoDB
- `public/`: Arquivos estáticos do servidor web

## Requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- MongoDB (remoto ou local)

## Configuração

1. Copie o arquivo `.env.example` para `.env` e preencha as variáveis de ambiente:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais e configurações.

## Execução com Docker

### Usando Docker Compose (Recomendado)

```bash
# Construir e iniciar o container
docker-compose up -d

# Visualizar logs
docker-compose logs -f

# Parar o container
docker-compose down
```

### Usando Docker diretamente

```bash
# Construir a imagem
docker build -t raphaelsan:latest .

# Executar o container
docker run -d --name raphaelsan -p 3000:3000 \
  -v /caminho/para/waifus:/app/waifus \
  -e TOKEN=seu_token \
  -e MONGO_URL=sua_url_mongo \
  -e OPENROUTER_API_KEY=sua_chave_api \
  raphaelsan:latest
```

## Execução Local (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Iniciar bot e servidor web
npm start

# Ou iniciar apenas o bot
npm run bot

# Ou iniciar apenas o servidor web
npm run web
```

## Acesso

- **Servidor Web**: http://localhost:3000 (em desenvolvimento) ou https://votacao.raphael-san.app (em produção)
- **Bot Discord**: Disponível nos servidores onde foi adicionado

