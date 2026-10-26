from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class Article(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

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

class ArticleResponse(BaseModel):
    total: int
    articles: List[Article]
    lastUpdated: Optional[int] = None
    articleCount: Optional[int] = None
