from functools import lru_cache
import re

from nltk.stem import WordNetLemmatizer


lemmatizer = WordNetLemmatizer()


@lru_cache(maxsize=16384)
def canonical_ingredient(name: str) -> str:
    words = re.findall(r"[a-z0-9]+", name.casefold())
    return " ".join(
        lemmatizer.lemmatize(word, pos="n")
        for word in words
    )