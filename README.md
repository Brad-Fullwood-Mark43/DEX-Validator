# CA eSUN DEX Query Validator

A web-based validation tool for California Chula Vista eSUN DEX (Data Exchange) queries.

## Features

- Validates Driver License, Driver History, and Vehicle Registration queries
- Supports both in-state (CA) and out-of-state queries
- Real-time validation against CA eSUN specifications
- Generates expected XML output format
- Provides clear error messages and field requirement guidance

## Local Development

```bash
npm install
npm start
```

Visit `http://localhost:3000`

## Deployment to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize and deploy:
   ```bash
   railway init
   railway up
   ```

## Usage

1. Select query type (Driver License, Driver History, or Vehicle Registration)
2. Choose In-State (CA) or Out-of-State
3. Fill in query fields
4. Click "Validate Query"
5. Review validation results and expected XML output

## Specifications

Based on California Chula Vista (eSUN) DEX specifications. Validates field combinations and enforces:
- Mandatory Purpose Code (per AB 1747)
- Valid field combinations per query type
- Proper State field handling (omitted for CA in-state, included for out-of-state)
