from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from .view import router


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# app.include_router(router, prefix="/xx")
app.include_router(router)