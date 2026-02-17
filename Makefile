.PHONY: download-references

download-references:
	@set -euo pipefail; \
	ref_dir="skills/mission-control-overview/references"; \
	index="$$ref_dir/QUICKSTART.md"; \
	mkdir -p "$$ref_dir"; \
	refs=( \
		"Canary|https://raw.githubusercontent.com/flanksource/canary-checker/refs/heads/main/fixtures/minimal/http_pass_single.yaml|canary-http-pass-single.yaml" \
		"ScrapeConfig|https://raw.githubusercontent.com/flanksource/config-db/refs/heads/main/fixtures/crds/scrape-config-kubernetes.yaml|scrape-config-kubernetes.yaml" \
		"ScrapePlugin|https://raw.githubusercontent.com/flanksource/config-db/refs/heads/main/fixtures/plugins/exclude-info-changes.yaml|scrape-plugin-exclude-info-changes.yaml" \
		"Notification|https://raw.githubusercontent.com/flanksource/mission-control/refs/heads/main/fixtures/notifications/health-check.yaml|notification-health-check.yaml" \
		"NotificationSilence|https://raw.githubusercontent.com/flanksource/mission-control/refs/heads/main/fixtures/silences/silence-test-env.yaml|notification-silence-test-env.yaml" \
		"Playbook|https://raw.githubusercontent.com/flanksource/mission-control/refs/heads/main/fixtures/playbooks/scale-deployment.yaml|playbook-scale-deployment.yaml" \
		"Connection|https://raw.githubusercontent.com/flanksource/mission-control/refs/heads/main/fixtures/connections/awskms.yaml|connection-awskms.yaml" \
		"View|https://raw.githubusercontent.com/flanksource/mission-control/refs/heads/main/fixtures/views/failing-health-checks.yaml|view-failing-health-checks.yaml" \
	); \
	printf '%s\n' \
		'# Mission Control Quick-Start YAML References' \
		'' > "$$index"; \
	for ref in "$${refs[@]}"; do \
		label="$${ref%%|*}"; \
		rest="$${ref#*|}"; \
		url="$${rest%%|*}"; \
		file="$${rest#*|}"; \
		path="$$ref_dir/$$file"; \
		echo "Downloading $$url -> $$path"; \
		curl -fsSL "$$url" -o "$$path"; \
		printf -- '- **%s**: [%s](%s)\n' "$$label" "$$file" "$$file" >> "$$index"; \
		printf -- '  - Source: <%s>\n' "$$url" >> "$$index"; \
	done; \
	echo "Generated $$index"
