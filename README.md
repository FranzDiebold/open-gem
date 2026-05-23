# OpenGem 💎

A minimalistic, all-local, fully containerized, open-source AI agent.

![OpenGem screenshot](images/OpenGem_screenshot.png)

## Quick start

`make run`

### Prerequisites

- [Docker](https://www.docker.com/)

## Key concepts

### Full Containerization

**Everything** runs in a container:

- agent
- dispatcher
- UI
- code/shell commands executed by the agent

### All local

**Everything** runs locally:

- agent
- language model (i.e. [Gemma4](https://deepmind.google/models/gemma/gemma-4/))

### Cron queries and cron query memory

Cron queries are queries that are scheduled to run at specific intervals.

### Language only settings / configuration

## Architecture / Components

![OpenGem architecture](images/OpenGem_architecture.png)

### Agent

### Dispatcher

### UI

## Other configuration

- set timezone (`TZ`) in `compose.yaml` 