# Vovan

Изучает RAG / embeddings 2026-06-07 (новая задача #78). Разобрала 4 типа: Den...

## Log
- [[2026-06-09]] [[Vovan]] Изучает RAG / embeddings 2026-06-07 (новая задача #78). Разобрала 4 типа: Dense (классика), Sparse (BM25/SPLADE), Hybrid (dense+sparse + RRF, в проде лучше чистого dense), Multi-vector (ColBERT/ColPali late interaction). Matryoshka — резка размерности. Для production: **BGE-M3** для multilingual (включая русский, опенсорс, dense+sparse+multi-vector в одной), Voyage voyage-3 платно топ, **ColPali** для PDF с картинками (минует OCR), nomic/e5-mistral/bge-small локально. Vector stores: pgvector (если уже postgres), Qdrant (hybrid из коробки), LanceDB (embedded). Reranker (Cohere Rerank / bge-reranker-v2-m3) даёт больший буст чем смена embedding модели. Для RAG на русском — BGE-M3 + BM25 hybrid в Qdrant/pgvector.
