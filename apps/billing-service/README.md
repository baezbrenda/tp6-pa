
# TP6 - POC Activación de Servicios (Saga por Coreografía)

## Descripción
Monorepo desarrollado con NestJS, Kafka, MongoDB, Mailhog y React que implementa una arquitectura de microservicios basada en eventos para la activación de servicios.

## Requisitos Previos
- Docker y Docker Compose instalados en la máquina.

## Instrucciones para levantar el entorno
1. Clonar el repositorio.
2. Ejecutar el siguiente comando en la raíz del proyecto para construir y levantar todos los contenedores:
   ```bash
   docker compose up --build -d