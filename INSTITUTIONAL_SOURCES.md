# 🏛️ Institutional Sources Configuration

## ✅ НАСТРОЕНО: 20 Официальных Источников

### 📍 NORTH AMERICA - Major Museums (6)

| Institution | Type | Press Page |
|-------------|------|------------|
| MoMA | Museum | https://press.moma.org |
| The Met | Museum | https://www.metmuseum.org/press/news |
| Guggenheim | Museum | https://www.guggenheim.org/press-room |
| Whitney | Museum | https://whitney.org/press |
| SFMOMA | Museum | https://www.sfmoma.org/press-room |
| Art Institute Chicago | Museum | https://www.artic.edu/press |

### 🌍 EUROPE - Major Museums (4)

| Institution | Type | Press Page |
|-------------|------|------------|
| Tate | Museum | https://www.tate.org.uk/press/press-releases |
| Centre Pompidou | Museum | https://www.centrepompidou.fr/en/press |
| Museo del Prado | Museum | https://www.museodelprado.es/en/press |
| Rijksmuseum | Museum | https://www.rijksmuseum.nl/en/press |

### 🔨 AUCTION HOUSES (3)

| Institution | Type | Press Page |
|-------------|------|------------|
| Christie's | Auction | https://www.christies.com/about-us/press-center |
| Sotheby's | Auction | https://www.sothebys.com/en/press |
| Phillips | Auction | https://www.phillips.com/press |

### 🎨 ART FAIRS & INSTITUTIONS (2)

| Institution | Type | Press Page |
|-------------|------|------------|
| Art Basel | Fair | https://www.artbasel.com/news |
| Frieze | Fair | https://www.frieze.com/news |

### 🖼️ MAJOR GALLERIES (2)

| Institution | Type | Press Page |
|-------------|------|------------|
| Gagosian | Gallery | https://gagosian.com/quarterly |
| White Cube | Gallery | https://whitecube.com/stories |

### 🌏 ASIA-PACIFIC (1)

| Institution | Type | Press Page |
|-------------|------|------------|
| M+ Museum | Museum | https://www.mplus.org.hk/en/media |

### 🏜️ MIDDLE EAST (1)

| Institution | Type | Press Page |
|-------------|------|------------|
| Louvre Abu Dhabi | Museum | https://www.louvreabudhabi.ae/en/press |

---

## 🤖 Как GPT обрабатывает пресс-релизы

### Входные данные (Press Release):
```
PRESS RELEASE
FOR IMMEDIATE RELEASE

The Museum of Modern Art Announces Major Exhibition
"Modern Masters: 1900-1950"

NEW YORK, November 15, 2025 – The Museum of Modern Art (MoMA) 
is pleased to announce Modern Masters: 1900-1950, a comprehensive 
exhibition showcasing pivotal works from the museum's collection...

[Formal institutional language]
[Marketing content]
[Curator quotes]
[Practical information]
```

### Выходные данные (Readable Article):
```json
{
  "title": "MoMA to Present Major Survey of Early 20th Century Art",
  "excerpt": "The Museum of Modern Art will open 'Modern Masters: 1900-1950' 
             this December, featuring over 200 works from Picasso to Pollock 
             in a comprehensive survey of the collection.",
  "content": "<p>The Museum of Modern Art (MoMA) has announced a major new 
             exhibition exploring the first half of the 20th century through 
             masterworks from its permanent collection.</p>
             
             <p>'Modern Masters: 1900-1950' will open December 15 and run 
             through March 2026, presenting over 200 paintings, sculptures...</p>
             
             <h2>Featured Artists</h2>
             <p>The exhibition includes iconic works by Pablo Picasso...</p>",
  "categories": ["Exhibitions", "Museums"],
  "source": {
    "name": "MoMA",
    "url": "https://press.moma.org/..."
  }
}
```

---

## ⚠️ ВАЖНО: Проблема списков vs конкретных релизов

### Текущая настройка (Списки):
```typescript
{
  sourceName: 'MoMA',
  url: 'https://press.moma.org',  // ← СПИСОК пресс-релизов
}
```

**Проблема:** GPT получает список заголовков, а не полный текст одного релиза.

### Решение 1: Конкретные URL-ы (вручную)

Найдите конкретные пресс-релизы и добавьте их URL-ы:

```typescript
const staticSources = [
  {
    sourceName: 'MoMA',
    url: 'https://press.moma.org/2024/11/modern-masters-exhibition',  // ← Конкретный релиз
  },
  {
    sourceName: 'The Met',
    url: 'https://www.metmuseum.org/press/news/2024/new-acquisition-vermeer',  // ← Конкретный релиз
  },
  // ... добавьте 10-20 конкретных релизов
];
```

**Как найти:**
1. Откройте https://press.moma.org
2. Найдите свежий пресс-релиз (1-3 дня)
3. Кликните на него
4. Скопируйте полный URL
5. Добавьте в `src/fetchSources.ts`

### Решение 2: RSS Feeds (автоматизация)

Многие пресс-центры имеют RSS:

```typescript
// Примеры RSS feeds (если доступны):
'https://press.moma.org/feed'
'https://www.metmuseum.org/press/rss'
```

**Требует доработки:** добавить RSS парсер (см. CONFIGURATION.md).

### Решение 3: Парсинг списков (продвинутый)

Создать функцию, которая:
1. Загружает страницу со списком релизов
2. Извлекает ссылки на отдельные релизы
3. Загружает каждый релиз
4. Отправляет в GPT

---

## 🚀 Быстрый старт (прямо сейчас)

### Вариант A: Тестовый запуск "как есть"

```bash
cd /Users/olegnikishin/art-news-agent
npm run build
MAX_ARTICLES_PER_RUN=3 npm start
```

**Что произойдёт:**
- Агент загрузит 3 страницы (списки релизов)
- GPT попытается создать статьи из списков
- Результат: короткие статьи или ошибки

**Польза:** Увидите какие страницы работают лучше.

### Вариант B: Вручную добавить конкретные релизы (РЕКОМЕНДУЕТСЯ)

**Шаг 1:** Найдите свежие пресс-релизы

Откройте эти страницы:
- https://press.moma.org
- https://www.metmuseum.org/press/news
- https://www.tate.org.uk/press/press-releases
- https://www.christies.com/about-us/press-center
- https://www.sothebys.com/en/press

**Шаг 2:** Выберите 10-15 интересных релизов

Критерии:
- ✅ Опубликованы 1-7 дней назад
- ✅ О крупных выставках, аукционах, приобретениях
- ✅ Имеют полный текст (не просто анонсы)

**Шаг 3:** Скопируйте URL-ы

Пример:
```
https://press.moma.org/2024/11/15/moma-announces-major-retrospective
https://www.metmuseum.org/press/news/2024/met-acquires-rare-rembrandt
https://www.tate.org.uk/press/press-releases/2024/11/tate-modern-opens-winter-season
```

**Шаг 4:** Замените в `src/fetchSources.ts`

```typescript
const staticSources = [
  {
    sourceName: 'MoMA',
    url: 'https://press.moma.org/2024/11/15/moma-announces-major-retrospective',
  },
  {
    sourceName: 'The Met',
    url: 'https://www.metmuseum.org/press/news/2024/met-acquires-rare-rembrandt',
  },
  {
    sourceName: 'Tate',
    url: 'https://www.tate.org.uk/press/press-releases/2024/11/tate-modern-opens-winter-season',
  },
  // Добавьте ещё 7-12 релизов...
];
```

**Шаг 5:** Запустите агент

```bash
cd /Users/olegnikishin/art-news-agent
npm run build
npm start
```

**Шаг 6:** Проверьте результат

```bash
# Смотрите логи:
[GPT] Content: 2543 chars ✅  (хорошо!)

# Проверьте в админке:
http://localhost:3000/admin/news/queue
```

---

## 📊 Ожидаемое качество

### ✅ Преимущества официальных источников:

1. **Высокая достоверность** - информация от первоисточника
2. **Полные тексты** - пресс-релизы содержат все детали
3. **Бесплатный доступ** - нет paywall
4. **Структурированность** - легко парсить
5. **Престиж** - статьи от MoMA, Met, Christie's и т.д.

### ⚠️ Возможные проблемы:

1. **Маркетинговый язык** - GPT должен "журнализировать"
2. **Технические термины** - нужен контекст
3. **Списки vs статьи** - нужны прямые URL-ы релизов

---

## 🔄 Регулярное обновление

### Ежедневный процесс (вручную):

1. **Утро:** Проверьте пресс-центры (10 мин)
2. **Выберите:** 5-10 свежих релизов
3. **Обновите:** `src/fetchSources.ts`
4. **Запустите:** `npm run build && npm start`
5. **Проверьте:** админ-панель
6. **Опубликуйте:** одобрите статьи

### Автоматизация (будущее):

- RSS парсер для автоматической загрузки
- Cron для ежедневного запуска
- Фильтры по ключевым словам
- Автоматическая проверка качества

---

## 📞 Поддержка

**Вопросы:**
- Как найти RSS feed музея?
- Как парсить списки релизов?
- Как улучшить качество трансформации?

**См. также:**
- `CONFIGURATION.md` - общая настройка
- `README.md` - полная документация
- `DEPLOYMENT.md` - деплой на сервер

---

**Обновлено:** November 15, 2025  
**Статус:** Готово к использованию с конкретными URL-ами релизов

