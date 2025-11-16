# 🔑 GitHub Actions - Секреты для настройки

## ✅ ВСЕ СЕКРЕТЫ ГОТОВЫ!

Для настройки GitHub Actions вам нужно добавить **3 секрета** в ваш репозиторий.

---

## 📋 Секрет 1: OPENAI_API_KEY

**Название секрета:** `OPENAI_API_KEY`

**Значение:**
```
sk-proj-ВАSHКЛЮЧKEY...
```
*(Используйте ваш реальный OpenAI API ключ)*

**Где взял:** Ваш OpenAI API Key (уже использовали ранее)

**Проверить баланс:** https://platform.openai.com/usage

---

## 📋 Секрет 2: NEWS_INGEST_API_KEY

**Название секрета:** `NEWS_INGEST_API_KEY`

**Значение:**
```
K2E7VJnJA8tKWix4pG6XtrJaY4jijC12qyXt/b4R8/4=
```

**Где взял:** Из `/Users/olegnikishin/art-registry-platform/.env.local`

**Как проверить:**
```bash
cd /Users/olegnikishin/art-registry-platform
grep NEWS_INGEST_API_KEY .env.local
```

---

## 📋 Секрет 3: INGEST_ENDPOINT_URL

**Название секрета:** `INGEST_ENDPOINT_URL`

### ⚠️ ВАЖНО: Два варианта значения

#### Вариант A: Локальное тестирование (НЕ РЕКОМЕНДУЕТСЯ)

**Значение:**
```
http://localhost:3000/api/news/ingest
```

**Проблема:** GitHub Actions не может достучаться до `localhost` вашего компа!

**Когда использовать:** Никогда для GitHub Actions.

---

#### Вариант B: Продакшн URL (ПРАВИЛЬНЫЙ)

**Значение (если платформа уже задеплоена):**
```
https://your-domain.com/api/news/ingest
```

**Примеры:**
- `https://artregplatform.com/api/news/ingest`
- `https://art-registry.vercel.app/api/news/ingest`
- `https://art-registry-production.up.railway.app/api/news/ingest`

**Как узнать:** Зависит от того, где вы задеплоили платформу.

---

### 🤔 Если платформа ещё не задеплоена:

**У вас 2 варианта:**

#### 1️⃣ Сначала задеплоить платформу (РЕКОМЕНДУЕТСЯ)

**Быстрый деплой на Vercel:**
```bash
cd /Users/olegnikishin/art-registry-platform

# Установите Vercel CLI
npm i -g vercel

# Деплойте
vercel

# Следуйте инструкциям, получите URL типа:
# https://art-registry-platform-xxx.vercel.app
```

**Тогда URL будет:**
```
https://art-registry-platform-xxx.vercel.app/api/news/ingest
```

---

#### 2️⃣ Использовать ngrok/localtunnel (временное решение)

**С ngrok (для тестирования):**

```bash
# Установите ngrok
brew install ngrok

# Запустите туннель (в отдельном терминале)
ngrok http 3000

# Ngrok даст вам URL типа:
# https://abcd1234.ngrok.io

# Используйте:
# https://abcd1234.ngrok.io/api/news/ingest
```

⚠️ **Минусы:**
- Нужно держать ngrok запущенным 24/7
- URL меняется при перезапуске (бесплатная версия)
- Не подходит для продакшн

---

## 🎯 МОЯ РЕКОМЕНДАЦИЯ

### Для старта (прямо сейчас):

**Шаг 1:** Задеплойте платформу на Vercel (5-10 минут)

```bash
cd /Users/olegnikishin/art-registry-platform
npm i -g vercel
vercel
```

**Шаг 2:** Скопируйте URL, который даст Vercel

**Шаг 3:** Используйте этот URL для `INGEST_ENDPOINT_URL`:
```
https://art-registry-platform-xxx.vercel.app/api/news/ingest
```

---

## 📝 КАК ДОБАВИТЬ СЕКРЕТЫ В GITHUB

### 1️⃣ Создайте репозиторий (если ещё не создали)

```bash
cd /Users/olegnikishin/art-news-agent

# Создайте репозиторий на GitHub.com, затем:
git remote add origin https://github.com/YOUR-USERNAME/art-news-agent.git
git push -u origin main
```

---

### 2️⃣ Откройте Settings → Secrets

1. Откройте ваш репозиторий на GitHub.com
2. Перейдите: **Settings** (вверху)
3. В левом меню: **Secrets and variables** → **Actions**
4. Нажмите: **New repository secret** (зеленая кнопка)

---

### 3️⃣ Добавьте 3 секрета

#### Секрет #1:

**Name:** `OPENAI_API_KEY`  
**Secret:**
```
sk-proj-ВАSHКЛЮЧKEY...
```
*(Используйте ваш реальный OpenAI API ключ)*

Нажмите **Add secret**.

---

#### Секрет #2:

**Name:** `NEWS_INGEST_API_KEY`  
**Secret:**
```
K2E7VJnJA8tKWix4pG6XtrJaY4jijC12qyXt/b4R8/4=
```

Нажмите **Add secret**.

---

#### Секрет #3:

**Name:** `INGEST_ENDPOINT_URL`  
**Secret:**
```
https://your-vercel-url.vercel.app/api/news/ingest
```

⚠️ **Замените `your-vercel-url.vercel.app` на реальный URL после деплоя платформы!**

Нажмите **Add secret**.

---

## ✅ ПРОВЕРКА

После добавления всех 3 секретов вы должны увидеть:

```
Repository secrets
- OPENAI_API_KEY                Updated X minutes ago
- NEWS_INGEST_API_KEY           Updated X minutes ago
- INGEST_ENDPOINT_URL           Updated X minutes ago
```

---

## 🚀 ЗАПУСК

После добавления секретов:

1. Перейдите: **Actions** tab
2. Выберите: **Art News Agent**
3. Нажмите: **Run workflow** (справа)
4. Нажмите: **Run workflow** (зеленая кнопка)

**Ожидаемый результат:**

```
✅ Run completed successfully
📊 Successfully sent: 2-3 articles
```

---

## 🔄 ОБНОВЛЕНИЕ СЕКРЕТОВ

Если нужно изменить секрет:

1. Settings → Secrets and variables → Actions
2. Найдите секрет
3. Нажмите **Update** (карандаш)
4. Введите новое значение
5. **Update secret**

---

## 📞 ПОМОЩЬ

### ❌ Ошибка: "Connection refused"

**Причина:** Неверный `INGEST_ENDPOINT_URL` (возможно localhost)

**Решение:**
1. Задеплойте платформу на Vercel
2. Обновите секрет `INGEST_ENDPOINT_URL` на правильный URL

---

### ❌ Ошибка: "401 Unauthorized"

**Причина:** Неверный `NEWS_INGEST_API_KEY`

**Решение:**
1. Проверьте `.env.local` платформы:
   ```bash
   cd /Users/olegnikishin/art-registry-platform
   grep NEWS_INGEST_API_KEY .env.local
   ```
2. Обновите секрет в GitHub

---

### ❌ Ошибка: "OpenAI API error"

**Причина:** Неверный `OPENAI_API_KEY` или закончился баланс

**Решение:**
1. Проверьте баланс: https://platform.openai.com/usage
2. Проверьте ключ: https://platform.openai.com/api-keys
3. Обновите секрет в GitHub

---

## 🎯 КРАТКАЯ ВЕРСИЯ (TL;DR)

**3 секрета для GitHub Actions:**

1. `OPENAI_API_KEY` = `sk-proj-ВАSHКЛЮЧKEY...` *(используйте ваш реальный ключ)*

2. `NEWS_INGEST_API_KEY` = `K2E7VJnJA8tKWix4pG6XtrJaY4jijC12qyXt/b4R8/4=`

3. `INGEST_ENDPOINT_URL` = `https://your-platform-url.com/api/news/ingest` ← **Нужно задеплоить платформу сначала!**

---

**Создано:** November 15, 2025  
**Для:** GitHub Actions Setup  
**Проект:** Art Registry Platform - News Agent

