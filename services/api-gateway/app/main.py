import logging
import signal
from pythonjsonlogger import jsonlogger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
logger = logging.getLogger("api-gateway")
logger.setLevel(logging.INFO)
logger.addHandler(handler)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="api-gateway")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def secure_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response

@app.get("/health")
@limiter.limit("300/15minutes")
async def health(request: Request):
    logger.info("health", extra={"service": "api-gateway"})
    return {"status": "ok", "service": "api-gateway"}

@app.get("/api/api-gateway")
async def hello():
    return {"service": "api-gateway", "message": "hello from api-gateway"}

def _shutdown(signum, frame):
    logger.info("shutdown", extra={"service": "api-gateway", "signal": signum})

signal.signal(signal.SIGTERM, _shutdown)
signal.signal(signal.SIGINT, _shutdown)
