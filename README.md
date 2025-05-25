# AEGIS SIEM System
**AEGIS** is a modular Security Information and Event Management (SIEM) system designed for collecting, storing, and analyzing security logs in real-time. It supports anomaly detection and automated alerting via Telegram, leveraging modern tools like Docker, InfluxDB, PostgreSQL, and Python-based services.

## Features

- Log collection and management
- Time-series data storage with InfluxDB
- Profile, User, Data source and Alert management
- Structured data management using PostgreSQL
- Machine learning-based anomaly detection
- Real-time alert notifications via Telegram
- Containerized deployment with Docker Compose


## Technologies Used

- Python 3
- FastAPI (for backend and anomaly detection APIs)
- PostgreSQL
- InfluxDB
- Docker & Docker Compose
- Telegram Bot API


## Setup Instructions
### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/AEGIS.git
cd AEGIS
```
### 2. Setup InfluxDB on cloud
Create an API token for fluentd.conf and siem_system/backend/.env
```url
https://cloud2.influxdata.com/signup
```
Create bucket named "logs" for log storage.

### 3. Configure Fluentd Log Forwarder
Update a Fluentd configuration file at fluentd/fluentd.conf:
```conf
    url <your-url>
    org <your-org>
    token <your-token>
```

### 4. Define Environment Variables
Create two .env files manually in the specified directories:
#### A. siem_system/backend/.env
```.env
# InfluxDB Configuration
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_ORG=your_org
INFLUXDB_BUCKET=your_bucket
INFLUXDB_TOKEN=your_influxdb_token

# PostgreSQL Configuration
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=aegis_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Auth and Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
#### B. anomaly-detector/.env
```.env
# PostgreSQL Configuration
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=db-name
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Telegram Bot Configuration
telegram_bot_token=your_telegram_bot_token
telegram_chat_id=your_telegram_chat_id
```
⚠️ Note: These .env files are required and must be populated with valid credentials before running the system.

### 5. Run with Docker Compose
Ensure Docker and Docker Compose are installed. From the root directory (AEGIS/), run:
```bash
docker-compose up --build
```
To run in detached mode:
```bash
docker-compose up -d --build
```
This will:

Build and start the FastAPI backend service
Launch the anomaly detector service
Start PostgreSQL and InfluxDB containers

### 6. Access and Usage
Access the system via the following endpoints:

- Backend API: http://localhost:8000
- Anomaly detector API: http://localhost:8001
- Frontend: hhtp://localhost:4200
- PostgreSQL: Connect at localhost:5432 using tools like psql or DBeaver


#### Docker Port Mappings
| Service           | Port  |
|-------------------|-------|
| Backend (FastAPI) | 8000  |
| InfluxDB          | 8086  |
| PostgreSQL        | 5432  |
| Fluentd           | 24224 |

To change ports, edit the `docker-compose.yml` file.


### Support
For issues, questions, or suggestions, open an issue on the GitHub repository.

### Open-Source Tools and Licenses

This project uses the following open-source tools:

- **FastAPI** – MIT License
- **PostgreSQL** – PostgreSQL License
- **InfluxDB** – MIT License
- **Docker & Docker Compose** – Apache License 2.0
- **Python** – Python Software Foundation License

We respect and comply with all associated licenses.
