from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.logs import router as logs_router
from api.routes.data_source import router as datasource_router
from api.routes.auth import router as auth
from core.middleware import AuthMiddleware
from api.routes.users import router as users_router
from api.routes.health import router as health_router
from api.routes.alerts import router as alerts_router

app = FastAPI(title="SIEM Platform")

origins = [ "*" ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

app.include_router(auth, prefix="/auth", tags=["Authentication"])
app.include_router(logs_router, prefix="/api", tags=["logs"])
app.include_router(datasource_router, prefix="/api", tags=["datasources"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(alerts_router, prefix="/api", tags=["alert"])

