
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Semaphore Transaction Demo

This project is a **NestJS** application designed to demonstrate the **Producer-Consumer pattern** using **Semaphores** for concurrency control.

It simulates a high-throughput transaction processing system where incoming requests are buffered and processed efficiently without overwhelming the system resources.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: TypeScript
- **Key Concepts**: 
  - Asynchronous Concurrency
  - Counting Semaphores
  - Producer-Consumer Pattern
  - In-memory Buffering

## 🚀 Features

### 1. Semaphore Utility
A custom `Semaphore` class (`src/util/semaphore.util.ts`) that manages access to shared resources using Promises. It supports:
- `acquire()`: Waits for a permit to be available.
- `release()`: Returns a permit, notifying waiting tasks.

### 2. Transaction Processing System
- **Controller (`TransactionController`)**: Exposes a `POST /transactions` endpoint. It acts as the **Producer**, submitting jobs to the service.
- **Service (`TransactionService`)**: Acts as the **Consumer** and buffer manager.
  - **Buffer**: A circular-style queue (array) with a fixed capacity (default: 10).
  - **Concurrency Control**: constructs `items`, `spaces`, and `mutex` semaphores to ensure thread-safe operations on the buffer.
  - **Simulation**: Simulates processing latency (500ms) to demonstrate the buffering behavior under load.

## 🏃‍♂️ Getting Started

### Installation

```bash
$ pnpm install
```

### Running the Application

```bash
# development mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

The application will start on `http://localhost:3000`.

## 🧪 How to Test

### 1. via HTTP Requests

You can use Postman, curl, or any HTTP client to send transaction requests.

**Endpoint:** `POST http://localhost:3000/transactions`

**Body:**
```json
{
  "amount": 500,
  "accountId": "user-123"
}
```

**Scenario:**
1. Send a request.
2. The server responds immediately with `201 Created` and `status: "Accepted"`.
3. Check the server console logs. You will see:
   - "Transaction Added. Buffer size: X"
   - "PROCESSING tx: ..."
   - (After 500ms) "COMPLETED tx: ..."

**Stress Testing:**
Try sending 20 requests rapidly. You will notice:
- The first 10 requests fill the buffer.
- Subsequent requests will **wait** (the HTTP request hangs) until a space opens up in the buffer.
- The consumer loop processes them one by one, freeing up space.

### 2. Unit Tests

The project includes comprehensive unit tests for the Semaphore logic and the Transaction flow.

```bash
$ pnpm test
```

## 📂 Project Structure

```
src/
├── transaction/
│   ├── transaction.controller.ts  # API Endpoint
│   ├── transaction.service.ts     # Business Logic & Buffer Management
│   ├── transaction.model.ts       # Type Definitions
│   └── ...
├── util/
│   └── semaphore.util.ts          # Custom Semaphore Implementation
├── app.module.ts                  # Main Module
└── main.ts                        # Entry Point
```
