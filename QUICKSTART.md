# ⚡ Quick Start Guide - Art News Agent

**5 минут от установки до первого запуска**

---

## 📦 Шаг 1: Установка (2 мин)

```bash
cd art-news-agent

# Установить зависимости
npm install

# Проверить что всё установилось
npm list openai cheerio zod
```

---

## ⚙️ Шаг 2: Конфигурация (2 мин)

### 2.1 Создать .env

```bash
cp .env.example .env
nano .env  # или vim .env
```

### 2.2 Заполнить минимум 3 ключа

```env
# 1. OpenAI API Key (обязательно)
OPENAI_API_KEY=sk-proj-ВАШІ_КЛЮЧ_ТУТ

# 2. Endpoint платформы (обязательно)
INGEST_ENDPOINT_URL=http://localhost:3000/api/news/ingest

# 3. API ключ платформы (обязательно)
NEWS_INGEST_API_KEY=ваш-секретный-ключ

# Остальное можно оставить по умолчанию
OPENAI_MODEL=gpt-5.1-instant
DEFAULT_LANGUAGE=ru
MAX_ARTICLES_PER_RUN=20
API_DELAY_MS=1000
```

**Где взять ключи:**
- **OPENAI_API_KEY:** https://platform.openai.com/api-keys
- **NEWS_INGEST_API_KEY:** Скопировать из `.env.local` платформы (должны совпадать!)

---

## 🚀 Шаг 3: Первый запуск (1 мин)

### 3.1 Проверить доступные модели

```bash
npm run check-models
```

**Ожидаемый вывод:**
```
🔍 Checking available OpenAI models...

📋 Available GPT/O1 models:

  ✅ gpt-5.1-instant ← RECOMMENDED for news agent
  🧠 gpt-5.1-thinking (complex reasoning, slower)
  📌 gpt-4o (legacy, still good)

💡 RECOMMENDATION FOR NEWS AGENT:
✅ Use: gpt-5.1-instant
   → Fastest, least hallucinations, best for news
```

### 3.2 Собрать проект

```bash
npm run build
```

**Ожидаемый вывод:**
```
> art-news-agent@1.0.0 build
> tsc
```

### 3.3 Запустить агент

```bash
npm start
```

**Ожидаемый вывод:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Art News Agent - Run Started
📅 2025-11-15T12:00:00.000Z
🔧 Model: gpt-5.1-instant
🎯 Max articles: 20
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[fetchSources] 📥 Fetching: The Art Newspaper
   URL: https://...
   ✅ Fetched successfully (12543 chars)

📊 Fetched 3 article(s) from sources

═══════════════════════════════════════════════════════
📄 Processing: The Art Newspaper
   URL: https://...
   🤖 Calling GPT...
   [GPT] Using model: gpt-5.1-instant
   [GPT] ✓ Validated: "World's Oldest Known Artwork..."
   📤 Sending to Art Registry Platform...
   [Ingest] ✅ created - Article ID: 123
   ✅ Successfully sent and marked as processed
═══════════════════════════════════════════════════════

📊 RUN SUMMARY
───────────────────────────────────────────────────────
   Fetched:         3
   Already Skipped: 0
   Processed:       3
   Successfully Sent: 3
   Errors:          0
═══════════════════════════════════════════════════════

✅ Run completed successfully
```

---

## ✅ Готово!

Агент работает! Теперь:

### Для разработки:
```bash
npm run dev  # Запуск без сборки
```

### Для продакшена:
```bash
npm start  # Запуск после npm run build
```

### Автоматический запуск (cron):
```bash
crontab -e
# Добавить:
0 9 * * * cd /path/to/art-news-agent && npm start >> agent.log 2>&1
```

---

## 🐛 Если что-то не работает

### Ошибка: "Empty response from OpenAI"
```bash
# Проверить ключ
cat .env | grep OPENAI_API_KEY
```

### Ошибка: "Model gpt-5.1-instant not available"
```bash
# В .env заменить модель:
OPENAI_MODEL=gpt-4o
```

### Ошибка: "Ingest failed with status 401"
```bash
# Проверить что ключи совпадают:
cat .env | grep NEWS_INGEST_API_KEY
# И в платформе:
cat ../art-registry-platform/.env.local | grep NEWS_INGEST_API_KEY
```

### Ошибка: "No articles to process"
```bash
# Добавить источники в src/fetchSources.ts
nano src/fetchSources.ts
```

---

## 📚 Дальше

- **README.md** — Полная документация
- **DEPLOYMENT.md** — Развертывание на сервер
- **src/fetchSources.ts** — Добавить свои источники новостей

---

**Art Registry Platform** © 2025

