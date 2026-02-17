.PHONY: schemas

schemas:
	@bun run scripts/generate-canary-schema-ref.ts
