.PHONY: help
help:  ## Show this help.
	@egrep '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

ROOT_PATH ?= $(PWD)

.PHONY: copy-env-files
copy-env-files:  ## Copy .env.example to .env if .env does not exist.
	@[ -f workspace/config/.env.email_mcp ] || cp workspace/config/.env.email_mcp.example workspace/config/.env.email_mcp
	@[ -f workspace/config/.env.caldav_mcp ] || cp workspace/config/.env.caldav_mcp.example workspace/config/.env.caldav_mcp
	@echo "\033[1;33m⚠️  Required: Configure authentication credentials in .env.email_mcp and .env.caldav_mcp\033[0m"

.PHONY: prepare-calendar-usage
prepare-calendar-usage:  ## Prepare the usage of the calendar (build caldav-mcp Docker image).
	cd resources/caldav-mcp && sh build.sh

.PHONY: init
init: prepare-calendar-usage copy-env-files  ## Initialize the environment.
	@echo "Initialization completed."

.PHONY: run
run:  ## Run the application.
	ROOT_PATH=$(ROOT_PATH) docker compose up --build --remove-orphans

.PHONY: stop
stop:  ## Stop the application
	docker compose stop

.PHONY: clean
clean:  ## Clean up.
	docker compose rm -fsv
