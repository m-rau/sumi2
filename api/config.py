from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27018"
    mongodb_database: str = "sumi2"

    # JWT
    jwt_secret: str = "change-this-to-a-secure-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    # Admin Bootstrap
    admin_email: str = "admin@localhost"
    admin_password: str = "admin"  # If empty, will generate random

    # Rate Limiting
    rate_limit_login: str = "5/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
