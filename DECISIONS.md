# Decisions

## JWT Over Sessions

JWT keeps the API stateless and easy to use from a React frontend. Protected routes validate the token without server-side session storage.

## Static FX Rate

The app uses `1 USD = 83 INR` because the assignment requires a static rate. This makes imports reproducible and avoids network dependency during CSV processing.

## Refund Policy

Negative amounts are treated as refunds. They are stored as negative expenses, flagged as anomalies, and require confirmation before import.

## Missing CSV Split Type

When `split_type` is missing, the row is flagged. The import review defaults it to `EQUAL` only after the user confirms that action.

## Debt Simplification

Balances are simplified with a two-pointer debtor-creditor algorithm: sort debtors and creditors by absolute balance, match the largest remaining amounts, and emit one transaction per match.

## Soft Deletes

Expenses are soft-deleted so balance changes remain auditable and CSV cleanup can follow the required approval flow.

