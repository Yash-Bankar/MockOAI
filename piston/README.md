# Piston Code Execution Server

This directory contains the Docker Compose setup for [Piston](https://github.com/engineer-man/piston), a high-performance general-purpose code execution engine.

## What is Piston?

Piston provides isolated, sandboxed code execution for multiple programming languages. It's used in this project to safely execute user-submitted code for the coding interview/practice section, completely isolated from the main Next.js application.

## Why Separate?

Running untrusted code requires strict isolation. By running Piston in its own Docker container, we ensure:
- Code execution is sandboxed and cannot affect the main application
- Resource limits prevent runaway processes
- Network isolation protects against malicious code
- Easy horizontal scaling if needed

## Getting Started

### Prerequisites

- Docker installed and running
- Port 2000 available on localhost

### Start Piston

From this directory:

```bash
docker compose up -d
```

This will:
- Pull the official Piston image (`ghcr.io/engineer-man/piston`)
- Start the API server on `http://localhost:2000`
- Create a persistent volume for installed language runtimes

### Verify It's Running

```bash
curl http://localhost:2000/api/v2/runtimes
```

You should see a JSON array (initially empty if no runtimes are installed yet).

### Install Language Runtimes

After starting Piston for the first time, install the required language runtimes:

```bash
bash install-runtimes.sh
```

This will install:
- C (gcc 10.2.0)
- C++ (g++ 10.2.0)
- D (gcc 10.2.0)
- Fortran (gcc 10.2.0)
- Python (3.12.0)
- Java (15.0.2)

The script will automatically verify the installation and show you which runtimes are available.

### Stop Piston

```bash
docker-compose down
```

To also remove the runtime data volume:

```bash
docker-compose down -v
```

## Environment Variables

The main application's `.env` file should contain:

```
PISTON_URL="http://localhost:2000/api/v2"
```

This tells the Next.js app where to find the Piston API.

## API Endpoints

- `GET /api/v2/runtimes` - List installed language runtimes
- `GET /api/v2/packages` - List available packages for installation
- `POST /api/v2/packages` - Install a language runtime
- `POST /api/v2/execute` - Execute code (main endpoint used by the app)

## Troubleshooting

**Port already in use:**
```bash
# Check what's using port 2000
netstat -ano | findstr :2000

# Stop the existing Piston container
docker-compose down
```

**Runtimes not persisting:**
Make sure you're using the named volume `piston_packages` defined in docker-compose.yml. Don't use `docker-compose down -v` unless you want to remove all runtimes.

**Installation fails:**
Check Docker logs:
```bash
docker-compose logs -f
```

## More Information

- [Piston GitHub](https://github.com/engineer-man/piston)
- [Piston Documentation](https://piston.readthedocs.io)
- [Supported Languages](https://github.com/engineer-man/piston#supported-languages)
