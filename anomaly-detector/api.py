from fastapi import FastAPI, Request, Depends
import json
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import load_model
from joblib import load
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from db.psql import get_db
from db.base import Alert
from alert.telegram import TelegramAlert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    app.state.telegram_alert = TelegramAlert()

model = load_model('model/anomaly_detection.keras', compile=False)
label_encoder = load('model/cnn_le.joblib')
max_length = 28


def interpret_predictions(predictions):
    return ["ANOMALY" if pred == 1 else "NORMAL" for pred in predictions]


async def save_anomaly(db: AsyncSession, event_ids: list, prediction: str, source: str, raw_logs: str):
    try:
        log_lines = raw_logs.split('\n')
        messages = []
        for line in log_lines:
            if not line.strip():
                continue
            try:
                log_entry = json.loads(line)
                message = log_entry.get("message", "No message field available")
                messages.append(message)
            except json.JSONDecodeError:
                continue
        messages_str = "\n".join(messages)

        astana_tz = ZoneInfo("Asia/Almaty")
        utc_time = datetime.now(timezone.utc)
        astana_time = utc_time.astimezone(astana_tz)

        anomaly = Alert(
            event_ids=json.dumps(event_ids),
            prediction=prediction,
            source=source,
            status='Opened',
            timestamp=astana_time.replace(tzinfo=None),
            raw_logs=messages_str  # Store only message fields
        )
        db.add(anomaly)
        await db.commit()
        await db.refresh(anomaly)
        logger.info(f"Saved anomaly with ID: {anomaly.id}")
        return anomaly
    except Exception as e:
        logger.error(f"Error saving anomaly: {str(e)}")
        await db.rollback()
        return None


@app.post("/receive-logs/")
async def receive_logs(
        request: Request,
        db: AsyncSession = Depends(get_db),
        telegram_alert: TelegramAlert = Depends(lambda: app.state.telegram_alert)):
    try:
        raw_body = await request.body()
        raw_logs = raw_body.decode()
        log_lines = raw_logs.split('\n')

        event_data = []
        source = None
        for line in log_lines:
            if not line.strip():
                continue
            try:
                log_entry = json.loads(line)
                event_id = log_entry.get("EventId")
                timestamp = log_entry.get("timestamp")
                if not source:
                    source = log_entry.get("host_ip")
                if event_id and timestamp:
                    dt = datetime.fromisoformat(timestamp.replace("Z", ""))
                    event_data.append((dt, event_id, line))
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error parsing log: {str(e)} - Line: {line}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error processing log line: {str(e)} - Line: {line}")
                continue

        if not event_data:
            logger.warning("No valid log entries found in request")
            return {"status": "processed", "message": "No valid log entries found"}

        try:
            sorted_events = sorted(event_data, key=lambda x: x[0])
        except Exception as e:
            logger.error(f"Error sorting events by timestamp: {str(e)}")
            return {"status": "error", "message": "Failed to sort events by timestamp"}

        timestamps = [item[0] for item in sorted_events]
        event_ids = [item[1] for item in sorted_events]
        raw_logs_chunk = [item[2] for item in sorted_events]

        try:
            encoded_sequence = label_encoder.transform(event_ids)
        except ValueError as e:
            logger.warning(f"Some EventIDs not found in encoder: {str(e)}")
            encoded_sequence = []
            for event_id in event_ids:
                try:
                    if event_id in label_encoder.classes_:
                        encoded_sequence.append(label_encoder.transform([event_id])[0])
                    else:
                        encoded_sequence.append(0)
                        logger.warning(f"Unknown EventId detected: {event_id}")
                except Exception as e:
                    logger.error(f"Error encoding EventID {event_id}: {str(e)}")
                    encoded_sequence.append(0)
        except Exception as e:
            logger.error(f"Unexpected error during EventID encoding: {str(e)}")
            return {"status": "error", "message": "EventID encoding failed"}

        sequences = []
        try:
            for i in range(0, len(encoded_sequence), max_length):
                chunk = encoded_sequence[i:i + max_length]
                if len(chunk) < max_length:
                    chunk = pad_sequences([chunk], maxlen=max_length, padding='post', truncating='post')[0]
                sequences.append(chunk)
        except Exception as e:
            logger.error(f"Error creating sequences: {str(e)}")
            return {"status": "error", "message": "Sequence processing failed"}

        try:
            X_ready = np.array(sequences).reshape(-1, max_length, 1)
        except Exception as e:
            logger.error(f"Error preparing data for prediction: {str(e)}")
            return {"status": "error", "message": "Data preparation failed"}

        if X_ready.size > 0:
            try:
                predictions = model.predict(X_ready, verbose=0)
                predicted_labels = np.argmax(predictions, axis=1)
                human_readable = interpret_predictions(predicted_labels)
            except Exception as e:
                logger.error(f"Prediction failed: {str(e)}")
                return {"status": "error", "message": "Model prediction failed"}

            try:
                for idx, prediction in enumerate(human_readable):
                    logger.info(f"Prediction result: {prediction}")

                    if prediction == "ANOMALY":
                        start = idx * max_length
                        end = start + max_length
                        chunk_logs = "\n".join(raw_logs_chunk[start:end])

                        try:
                            anomaly = await save_anomaly(
                                db=db,
                                event_ids=event_ids[start:end],
                                prediction=prediction,
                                source=source,
                                raw_logs=chunk_logs
                            )
                            await telegram_alert.send_alert(
                                event_ids=event_ids[start:end],
                                prediction=prediction,
                                raw_logs=chunk_logs,
                                case_id=anomaly.id,
                                source=source,
                                timestamp=anomaly.timestamp
                            )
                            logger.info(f"Detected anomaly in sequence {idx + 1}")
                        except Exception as e:
                            logger.error(f"Failed to process anomaly: {str(e)}")
            except Exception as e:
                logger.error(f"Error processing prediction results: {str(e)}")
                return {"status": "error", "message": "Prediction processing failed"}

        return {"status": "processed"}

    except Exception as e:
        logger.error(f"Unexpected error in receive-logs endpoint: {str(e)}", exc_info=True)
        return {"status": "error", "message": "Internal server error"}, 500
