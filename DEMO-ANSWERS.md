# Playing the candidate — answer key

You're Ken. The agent picks its own questions, but it almost always opens on
**b1 (EKS/Kubernetes)** because it's first and meaty. You control the verdict by
how you answer. Short answers are fine — it's voice, one or two sentences each.

## If you want to look GREEN (b1 — Kubernetes/EKS)

Core facts to hold onto:
- Service: a **FastAPI portfolio-data service**. You wrote the Dockerfile and the K8s manifests yourself.
- The war story: **second week, a rollout stalled** — the readiness probe hit an endpoint that touched the database, a deploy exhausted the connection pool, Kubernetes marked healthy pods unready. **You split liveness from readiness** and pointed readiness at a cheap in-memory check.
- Why Redis over in-process caching: **three replicas behind a load balancer** were giving inconsistent reads per pod; Redis = one source of truth, central TTLs. The cached queries were 100ms+, so the 1ms network hop was nothing.

If asked "what would you do differently": "I'd have load-tested the deploy path — we only found the pool exhaustion because it happened."

## If you want to trigger YELLOW (b2 — the 20% ticket claim)

When it asks how the 20% was measured, be honest:
> "Honestly, my manager quoted it in my review — tickets on environment issues were down about twenty percent after the Docker migration. I never saw the dashboard myself. The migration was mine though — I built the images with the device SDKs baked in."

This is the money moment: the agent will *accept* the honesty and the report will
say so. Candor reads well, inflation doesn't.

## If you want to trigger RED (b3 — the 35% refactor claim)

Start big, then shrink under follow-up:
- First answer: "I refactored our backend APIs to standardize error handling across the microservices."
- When it asks which services: "…mostly the device-status service. I updated two of the endpoints; the format itself was defined by the staff engineer running the migration."
- If it asks where 35% came from: "I think that was the goal in the migration doc. I'm not sure what it ended up being."

The consistency check will catch the shrink. That's the demo.

## If it reaches b4 (NBA project)

- The leakage answer: "Rolling features leak — a March training row contains information about April games in your test set. I **split by season** instead: trained through 2024-25, held out all of 2025-26, computed rolling features inside each split. Random splitting had looked *better*, which is exactly the trap."
- 61 commits in 8 days, 69 tests, GitHub Actions CI.

## Escape hatches

- Rambling is fine; pausing ~2 seconds ends your turn.
- If you blank: "Can you ask that a different way?" — the agent handles it.
- "end conversation" link finishes gracefully at any point.
