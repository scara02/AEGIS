# AEGIS SIEM жүйесі

**AEGIS** — бұл қауіпсіздік журналдарын нақты уақытта жинауға, сақтауға және талдауға арналған модульдік Қауіпсіздік Ақпараттары және Оқиғаларды Басқару (SIEM) жүйесі. Жүйе аномалияларды анықтау мен Telegram арқылы автоматтандырылған хабарламаларды жіберуді қолдайды және заманауи құралдарды (Docker, InfluxDB, PostgreSQL, Python негізіндегі қызметтер) пайдаланады.

## Ерекшеліктері

- Журналдарды жинау және басқару
- Уақыттық деректерді InfluxDB көмегімен сақтау
- Профильдер, пайдаланушылар, дереккөздер мен ескертулерді басқару
- Құрылымды деректерді PostgreSQL арқылы басқару
- Машина арқылы оқыту негізінде аномалияларды анықтау
- Telegram арқылы нақты уақыттағы хабарламалар
- Docker Compose көмегімен контейнерлік орналастыру

## Қолданылған технологиялар

- Python 3
- FastAPI (backend және аномалияларды анықтау API-лері үшін)
- PostgreSQL
- InfluxDB
- Docker және Docker Compose
- Telegram Bot API

## Орнату Нұсқаулығы

### 1. Репозиторийді клондау

```bash
git clone https://github.com/yourusername/AEGIS.git
cd AEGIS
```

### 2. Бұлтта InfluxDB баптау

`fluentd.conf` және `siem_system/backend/.env` файлдары үшін API токенін жасаңыз:

```url
https://cloud2.influxdata.com/signup
```

Журналдарды сақтау үшін "logs" атты bucket жасаңыз.

### 3. Fluentd журналдарын жіберушіні баптау

`fluentd/fluentd.conf` ішіндегі конфигурацияны жаңартыңыз:

```conf
    url <your-url>
    org <your-org>
    token <your-token>
```

### 4. Ортаның айнымалыларын орнату

Келесі каталогтарда екі `.env` файлын қолмен жасаңыз:

#### A. `siem_system/backend/.env`

```.env
# InfluxDB параметрлері
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_ORG=your_org
INFLUXDB_BUCKET=your_bucket
INFLUXDB_TOKEN=your_influxdb_token

# PostgreSQL параметрлері
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=aegis_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Аутентификация және қауіпсіздік
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### B. `anomaly-detector/.env`

```.env
# PostgreSQL параметрлері
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=db-name
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Telegram Bot параметрлері
telegram_bot_token=your_telegram_bot_token
telegram_chat_id=your_telegram_chat_id
```

⚠️ **Ескерту**: Бұл `.env` файлдар міндетті түрде толтырылуы керек және жүйені іске қоспас бұрын жарамды мәліметтермен толтырылуы тиіс.

### 5. Docker Compose көмегімен іске қосу

Docker және Docker Compose орнатылғанына көз жеткізіңіз. Жоба түбірінде келесі командаларды орындаңыз:

```bash
docker-compose up --build
```

Ажыратылған режимде іске қосу үшін:

```bash
docker-compose up -d --build
```

Бұл келесілерді орындайды:

* FastAPI backend қызметін құрастырады және іске қосады
* Аномалия детекторын іске қосады
* PostgreSQL және InfluxDB контейнерлерін іске қосады

### 6. Жүйеге қол жеткізу

Жүйені келесі сілтемелер арқылы қолдануға болады:

* Backend API: [http://localhost:8000](http://localhost:8000)
* Аномалия детекторы API: [http://localhost:8001](http://localhost:8001)
* Frontend: [http://localhost:4200](http://localhost:4200)
* PostgreSQL: `localhost:5432` мекенжайына `psql` немесе `DBeaver` арқылы қосылыңыз

#### Docker порттарының сәйкестігі

| Қызмет            | Порт  |
| ----------------- | ----- |
| Backend (FastAPI) | 8000  |
| InfluxDB          | 8086  |
| PostgreSQL        | 5432  |
| Fluentd           | 24224 |

Порттарды өзгерту үшін `docker-compose.yml` файлын өзгертіңіз.


### Қолдау

Мәселелер, сұрақтар немесе ұсыныстар үшін GitHub репозиторийінде issue ашыңыз.

### Ашық бастапқы құралдар және лицензиялар

Бұл жоба келесі ашық бастапқы құралдарды қолданады:

- **FastAPI** – MIT лицензиясы
- **PostgreSQL** – PostgreSQL лицензиясы
- **InfluxDB** – MIT лицензиясы
- **Docker & Docker Compose** – Apache 2.0 лицензиясы
- **Python** – Python Software Foundation лицензиясы

Барлық лицензиялық талаптарды құрметтейміз және орындаймыз.
