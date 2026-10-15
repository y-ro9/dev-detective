# Prompts.md — Sprint 3: Dev-Detective

## 1. Async/Await explanation
Asked AI to explain how `await fetch()` returns a Promise and why `.json()` is itself a Promise.

## 2. Rate limit fix
Asked how to pass Authorization header for GitHub PAT to raise limit from 60 → 5000/hr.

## 3. Promise.all in Battle Mode
Asked why `Promise.all([fetchA(), fetchB()])` runs both requests in parallel instead of sequentially.

## 4. Reduce for total stars
Asked to explain `repos.reduce((sum, r) => sum + r.stargazers_count, 0)` line by line.

## 5. ISO date formatting
Asked how `new Date("2023-01-25T12:00:00Z").toLocaleString()` works.