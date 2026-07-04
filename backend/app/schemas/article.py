from typing import List, Optional
from pydantic import BaseModel, Field

class Article(BaseModel):
    title: str
    url: str
    source: str
    author: Optional[str] = None
    publishedAt: int  # ms timestamp
    description: str
    topics: List[str]
    isOfficial: Optional[bool] = Field(default=None, alias="isOfficial")
    isTutorial: Optional[bool] = Field(default=None, alias="isTutorial")
    isCommunity: Optional[bool] = Field(default=None, alias="isCommunity")
    isNews: Optional[bool] = Field(default=None, alias="isNews")

    class Config:
        populate_by_name = True
        json_encoders = {
            # Let's ensure standard json serializations if any
        }

class ArticleResponse(BaseModel):
    total: int
    articles: List[Article]
