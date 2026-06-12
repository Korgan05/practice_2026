from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.contracts import router as contracts_router
from app.api.counteragents import router as counteragents_router
from app.api.documents import router as documents_router
from app.api.roles import router as roles_router
from app.api.tags import router as tags_router
from app.api.users import router as users_router

app = FastAPI(title="practice_2026 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(tags_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(counteragents_router, prefix="/api")
app.include_router(contracts_router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
