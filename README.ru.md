# AEGIS SIEM Система


> [English](https://github.com/scara02/AEGIS/blob/main/README.md) | [Kazakh](https://github.com/scara02/AEGIS/blob/main/README.kz.md) | Russian


**AEGIS** — это модульная система управления событиями и информацией безопасности (SIEM), предназначенная для сбора, хранения и анализа журналов безопасности в режиме реального времени. Поддерживает обнаружение аномалий и автоматическое оповещение через Telegram, используя современные инструменты, такие как Docker, InfluxDB, PostgreSQL и сервисы на базе Python.

## Основные возможности

- Сбор и управление логами
- Хранение временных рядов с помощью InfluxDB
- Управление профилями, пользователями, источниками данных и оповещениями
- Управление структурированными данными через PostgreSQL
- Обнаружение аномалий на основе машинного обучения
- Оповещения в реальном времени через Telegram
- Контейнеризация и развертывание с Docker Compose

## Используемые технологии

- Python 3
- FastAPI (для бэкенда и API обнаружения аномалий)
- PostgreSQL
- InfluxDB
- Docker и Docker Compose
- Telegram Bot API

## Инструкция по установке

### 1. Клонирование репозитория

```bash
git clone https://github.com/yourusername/AEGIS.git
cd AEGIS
```

### 2. Настройка InfluxDB в облаке

Создайте API токен для `fluentd.conf` и `siem_system/backend/.env`:

```url
https://cloud2.influxdata.com/signup
```

Создайте бакет с именем `"logs"` для хранения логов.

### 3. Настройка лог-форвардера Fluentd

Обновите конфигурационный файл Fluentd в `fluentd/fluentd.conf`:

```conf
    url <your-url>
    org <your-org>
    token <your-token>
```

### 4. Определение переменных окружения

Создайте вручную два `.env` файла в указанных директориях:

#### A. `siem_system/backend/.env`

```.env
# Конфигурация InfluxDB
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_ORG=your_org
INFLUXDB_BUCKET=your_bucket
INFLUXDB_TOKEN=your_influxdb_token

# Конфигурация PostgreSQL
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=aegis_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Аутентификация и безопасность
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### B. `anomaly-detector/.env`

```.env
# Конфигурация PostgreSQL
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=db-name
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Конфигурация Telegram-бота
telegram_bot_token=your_telegram_bot_token
telegram_chat_id=your_telegram_chat_id
```

⚠️ **Важно:** Указанные `.env` файлы обязательны и должны быть заполнены корректными данными до запуска системы.

### 5. Запуск с помощью Docker Compose

Убедитесь, что Docker и Docker Compose установлены. Из корня проекта (`AEGIS/`) выполните:

```bash
docker-compose up --build
```

Для запуска в фоновом режиме:

```bash
docker-compose up -d --build
```

Будут выполнены следующие действия:

- Сборка и запуск FastAPI-бэкенда
- Запуск сервиса обнаружения аномалий
- Запуск контейнеров PostgreSQL и InfluxDB

### 6. Доступ и использование

Система будет доступна по следующим адресам:

- API бэкенда: [http://localhost:8000](http://localhost:8000)
- API обнаружения аномалий: [http://localhost:8001](http://localhost:8001)
- Фронтенд: [http://localhost:4200](http://localhost:4200)
- PostgreSQL: подключение по адресу localhost:5432 через `psql`, `DBeaver` или другой клиент

#### Сопоставление портов Docker

| Сервис           | Порт  |
| ---------------- | ----- |
| Бэкенд (FastAPI) | 8000  |
| InfluxDB         | 8086  |
| PostgreSQL       | 5432  |
| Fluentd          | 24224 |

Для изменения портов отредактируйте файл `docker-compose.yml`.


### Поддержка

Если у вас возникли вопросы, предложения или проблемы, откройте issue в GitHub репозитории проекта.


### Используемые Open-Source инструменты и лицензии

В проекте используются следующие open-source технологии:

- **FastAPI** – MIT License
- **PostgreSQL** – PostgreSQL License
- **InfluxDB** – MIT License
- **Docker и Docker Compose** – Apache License 2.0
- **Python** – Python Software Foundation License

Мы уважаем и соблюдаем условия всех используемых лицензий.
