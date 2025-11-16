# 🚀 Deployment Guide - Art News Agent

Инструкция по развертыванию агента на продакшн сервере.

---

## 📋 Предварительные требования

- **Сервер**: Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+)
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Git**: для клонирования репозитория
- **Cron**: для автоматического запуска
- **Root/sudo доступ**: для настройки

---

## 🔧 Шаг 1: Подготовка сервера

### 1.1 Обновление системы

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 1.2 Установка Node.js 18+

```bash
# Ubuntu/Debian (через NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Проверка
node --version  # должно быть >= 18.0.0
npm --version
```

### 1.3 Установка Git

```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y
```

---

## 📦 Шаг 2: Установка агента

### 2.1 Создание директории

```bash
# Создать директорию (выберите один из вариантов)
sudo mkdir -p /opt/art-news-agent
cd /opt/art-news-agent

# ИЛИ в home директории
mkdir -p ~/art-news-agent
cd ~/art-news-agent
```

### 2.2 Клонирование репозитория

```bash
# Если есть git репозиторий
git clone https://github.com/your-org/art-news-agent.git .

# ИЛИ загрузка файлов вручную
# Скопируйте все файлы проекта на сервер
```

### 2.3 Установка зависимостей

```bash
npm install
```

### 2.4 Сборка проекта

```bash
npm run build
```

---

## ⚙️ Шаг 3: Конфигурация

### 3.1 Создание .env файла

```bash
# Создать .env на основе примера
cp .env.example .env

# Отредактировать
nano .env
# ИЛИ
vim .env
```

### 3.2 Заполнение .env

```env
# OpenAI API Key (получить: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-XXXXXX

# Модель (рекомендуется gpt-5.1-instant)
OPENAI_MODEL=gpt-5.1-instant

# Production endpoint платформы
INGEST_ENDPOINT_URL=https://artregplatform.com/api/news/ingest

# API Key платформы (должен совпадать с NEWS_INGEST_API_KEY на платформе)
NEWS_INGEST_API_KEY=your-production-secret-key

# Язык
DEFAULT_LANGUAGE=ru

# Макс статей за запуск
MAX_ARTICLES_PER_RUN=20

# Задержка между запросами
API_DELAY_MS=1000
```

**Важно:** Замените все значения на реальные!

### 3.3 Проверка конфигурации

```bash
# Проверить доступные модели
npm run check-models

# Проверить что агент запускается
npm start
```

---

## ⏰ Шаг 4: Настройка автозапуска (Cron)

### 4.1 Открыть crontab

```bash
crontab -e
```

### 4.2 Добавить задание

**Вариант 1: Запуск 1 раз в день (9:00 утра)**

```bash
0 9 * * * cd /opt/art-news-agent && /usr/bin/npm start >> /var/log/art-news-agent.log 2>&1
```

**Вариант 2: Запуск 2 раза в день (9:00 и 21:00)**

```bash
0 9,21 * * * cd /opt/art-news-agent && /usr/bin/npm start >> /var/log/art-news-agent.log 2>&1
```

**Вариант 3: Запуск каждые 6 часов**

```bash
0 */6 * * * cd /opt/art-news-agent && /usr/bin/npm start >> /var/log/art-news-agent.log 2>&1
```

**Формат cron:**
```
┌───────────── минута (0 - 59)
│ ┌───────────── час (0 - 23)
│ │ ┌───────────── день месяца (1 - 31)
│ │ │ ┌───────────── месяц (1 - 12)
│ │ │ │ ┌───────────── день недели (0 - 6) (воскресенье = 0)
│ │ │ │ │
│ │ │ │ │
* * * * * команда для выполнения
```

### 4.3 Проверить cron

```bash
# Список задач
crontab -l

# Проверить что cron работает
sudo systemctl status cron    # Ubuntu/Debian
sudo systemctl status crond   # CentOS/RHEL
```

---

## 📊 Шаг 5: Мониторинг логов

### 5.1 Создание директории для логов

```bash
sudo mkdir -p /var/log
sudo touch /var/log/art-news-agent.log
sudo chmod 664 /var/log/art-news-agent.log
```

### 5.2 Просмотр логов

```bash
# Последние 50 строк
tail -n 50 /var/log/art-news-agent.log

# Следить в реальном времени
tail -f /var/log/art-news-agent.log

# Поиск ошибок
grep "Error" /var/log/art-news-agent.log

# Статистика запусков
grep "Run Started" /var/log/art-news-agent.log | wc -l
```

### 5.3 Ротация логов (опционально)

```bash
# Создать конфиг для logrotate
sudo nano /etc/logrotate.d/art-news-agent
```

Содержимое:
```
/var/log/art-news-agent.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0664 user group
}
```

---

## 🔄 Шаг 6: Обновление агента

### 6.1 Pull последних изменений

```bash
cd /opt/art-news-agent

# Сохранить .env (если нужно)
cp .env .env.backup

# Обновить код
git pull origin main

# Установить зависимости
npm install

# Пересобрать
npm run build

# Восстановить .env (если было перезаписано)
# cp .env.backup .env
```

### 6.2 Ручной тест

```bash
npm start
```

---

## 🚨 Troubleshooting

### Агент не запускается

```bash
# Проверить права доступа
ls -la /opt/art-news-agent
chmod +x /opt/art-news-agent

# Проверить .env
cat .env

# Проверить Node.js
node --version
```

### Cron не работает

```bash
# Проверить синтаксис crontab
crontab -l

# Проверить что cron запущен
sudo systemctl status cron

# Перезапустить cron
sudo systemctl restart cron

# Проверить логи cron
grep CRON /var/log/syslog
```

### Ошибки GPT API

```bash
# Проверить модель
npm run check-models

# Проверить баланс OpenAI
# https://platform.openai.com/usage

# Проверить rate limits
# https://platform.openai.com/account/rate-limits
```

### Ошибки Ingest API

```bash
# Тестовый запрос к платформе
curl -X POST https://artregplatform.com/api/news/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"external_id":"test","source":{"name":"Test","url":"https://example.com"},"title":"Test","excerpt":"Test","content":"<p>Test</p>"}'
```

---

## 🔐 Безопасность

### Защита .env файла

```bash
# Установить права только для владельца
chmod 600 /opt/art-news-agent/.env

# Проверить
ls -la /opt/art-news-agent/.env
# Должно быть: -rw------- (600)
```

### Firewall

```bash
# Агент не требует открытых портов (только исходящие запросы)
# Убедитесь что исходящие HTTPS (443) разрешены
```

---

## 📈 Мониторинг производительности

### Статистика из логов

```bash
# Количество успешных запусков
grep "✅ Run completed successfully" /var/log/art-news-agent.log | wc -l

# Количество обработанных статей
grep "Successfully Sent:" /var/log/art-news-agent.log | awk '{sum+=$3} END {print sum}'

# Последние ошибки
grep "❌" /var/log/art-news-agent.log | tail -n 10
```

---

## ✅ Чеклист деплоя

- [ ] Node.js 18+ установлен
- [ ] Git установлен
- [ ] Проект склонирован в `/opt/art-news-agent`
- [ ] Зависимости установлены (`npm install`)
- [ ] Проект собран (`npm run build`)
- [ ] `.env` создан и заполнен
- [ ] OpenAI API key проверен
- [ ] Platform API key проверен
- [ ] Тестовый запуск выполнен (`npm start`)
- [ ] Cron задание добавлено
- [ ] Cron задание проверено (`crontab -l`)
- [ ] Логи создаются
- [ ] Логи читаемы

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи
2. Проверьте `.env` конфигурацию
3. Создайте issue в репозитории

**Art Registry Platform** © 2025

