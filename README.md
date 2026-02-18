# Wisling Production Infrastructure Overview

## Overview

This document describes the production infrastructure used for the Wisling platform. The environment is designed for secure deployment, high availability, and operational visibility using AWS services, Docker containers, and automated CI/CD workflows.

Region: eu north 1  
Availability Zone: eu north 1a

## 🏗️ Infrastructure Overview

![Infrastructure Diagram](./infra.jpg)

## Architecture Summary

The production system consists of the following core components:

1. CI/CD Pipeline  
2. Application Server  
3. Database Layer  
4. Networking and Security  
5. Background Processing  
6. Monitoring and Alerts

## CI/CD Pipeline

Deployment automation is handled using GitHub Actions with secure authentication.

### Components

1. GitHub Actions for build and deployment workflows  
2. OIDC authentication for secure AWS access  
3. Container images pushed to Amazon ECR  
4. Automated deployment updates to production EC2

### Workflow

1. Code is pushed to GitHub  
2. GitHub Actions builds Docker images  
3. Images are pushed to ECR  
4. Production EC2 pulls latest images and updates services

## Application Layer

The application runs on a dedicated EC2 instance named:

`wisling-prod`

### Runtime Setup

1. Docker Compose manages containers  
2. Frontend container serves the user interface  
3. Backend container handles APIs and business logic  
4. Supervisor manages queue workers

### Background Jobs

1. Queue worker processes asynchronous tasks  
2. Artisan Scheduler runs scheduled jobs  
3. Firebase Admin SDK integration for notifications and services

## Networking and Access

### Internet Access

1. Domain is configured with SSL  
2. Traffic routes securely from the internet to the EC2 instance

### Secure Communication

1. EC2 connects to RDS over private networking  
2. Database is not publicly exposed

## Database Layer

Amazon RDS MySQL is used for persistent storage.

### Configuration

1. Hosted inside a private subnet  
2. Daily backups retained for 15 days  
3. Deletion protection enabled  
4. Secure connection from application server

## Monitoring and Alerts

CloudWatch provides operational monitoring and notifications.

### Alerts Configured

1. CPU usage alarms  
2. Memory usage alarms  
3. SNS email notifications for incidents

## Security Practices

1. OIDC based authentication for CI/CD  
2. Private database networking  
3. SSL enabled domain traffic  
4. Access controls managed through AWS security groups

## Deployment Flow

1. Developer pushes code to GitHub  
2. GitHub Actions builds and pushes container images to ECR  
3. Deployment pipeline updates EC2 services  
4. Docker Compose restarts containers with the latest version

## Future Improvements

1. Auto scaling for application layer  
2. Blue green or rolling deployments  
3. Infrastructure as code using Terraform  
4. Centralized logging and tracing enhancements

## Notes

This setup is optimized for a production environment with secure deployment, containerized services, and monitoring for reliability.
