# CA eSUN DEX Query Validator

A web-based validation tool for California eSUN DEX (Data Exchange) queries. This tool helps validate query field combinations and generates properly formatted XML output according to the CA eSUN specification.

## Features

- **Query Type Support**: Driver License, Driver History, and Vehicle Registration queries
- **State Handling**: Supports both in-state (CA) and out-of-state queries with proper field validation
- **Real-time Validation**: Validates field combinations against CA eSUN specifications
- **XML Generation**: Generates spec-compliant XML output with correct field names and structure
- **Interactive Guidance**: Provides clear error messages, warnings, and field requirement documentation
- **Secure Access**: Basic authentication to protect the validation tool
- **Health Monitoring**: Includes `/health` endpoint for deployment monitoring

## Live Demo

Access the deployed application at your Railway URL (requires authentication).

**Default Credentials:**
- Username: `UniversalSearch`
- Password: `DEXValidation`

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd "DEX Validation Tool"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

5. Log in with the default credentials (username: `UniversalSearch`, password: `DEXValidation`)

## Deployment

### Railway Deployment (Recommended)

This application is configured for automatic deployment to Railway.

1. **Initial Setup:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Deploy:**
   ```bash
   git push origin master
   ```

   Railway will automatically detect the push and deploy the application.

3. **Configure Environment Variables (Optional):**
   In your Railway dashboard, set:
   - `AUTH_USERNAME` - Custom username for basic auth
   - `AUTH_PASSWORD` - Custom password for basic auth
   - `PORT` - Automatically set by Railway (default: 3000)

### Other Platforms

The application can be deployed to any Node.js hosting platform:
- Heroku
- Vercel
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service

Simply ensure the platform runs `npm start` and exposes the correct port.

## Usage Guide

### Validating a Query

1. **Select Query Type**: Choose from Driver License, Driver History, or Vehicle Registration
2. **Choose State Mode**: Select In-State (CA) or Out-of-State
3. **Fill in Fields**: Enter query data based on the selected combination
4. **Validate**: Click "Validate Query" to check your input
5. **Review Results**: See validation status, any errors/warnings, and the generated XML

### Understanding Valid Combinations

The tool enforces specific field combinations per the CA eSUN specification:

#### Driver License / Driver History Queries

**In-State California:**
- Name only
- Operator License Number only

**In-State or Out-of-State:**
- BirthDate + Name + SexCode + [State]
- Operator License Number + [State]

#### Vehicle Registration Queries

**In-State California:**
- Registration Plate
- VIN
- Boat Registration Number
- Name + Registration Plate
- Name + VIN
- Name + Boat Registration Number

**In-State or Out-of-State:**
- Registration Plate + [State]
- VIN + [State]
- Boat Registration Number + [State]

### Purpose Code (Required)

All queries **must** include a Purpose Code per California AB 1747 (mandatory since July 21, 2021):

- **C** - Criminal Justice
- **I** - Immigration Enforcement
- **U** - Investigate Violations of Section 1325 of Title 8 of the United States Code

## XML Output Format

The tool generates XML according to the CA eSUN specification:

### Example: Driver License Query (In-State)

```xml
<DriverLicenseQuery>
  <CaRequestPurposeCode>C</CaRequestPurposeCode>
  <Name>SMITH, JOHN A</Name>
  <BirthDate>1990-01-15</BirthDate>
  <SexCode>M</SexCode>
</DriverLicenseQuery>
```

### Example: Vehicle Registration Query (Out-of-State)

```xml
<VehicleRegistrationQuery>
  <CaRequestPurposeCode>C</CaRequestPurposeCode>
  <RegistrationPlate>ABC1234</RegistrationPlate>
  <State>AZ</State>
</VehicleRegistrationQuery>
```

### Key XML Field Names

- `CaRequestPurposeCode` - Purpose code (required)
- `Name` - Person name in format: LAST, FIRST MIDDLE
- `BirthDate` - Date of birth (YYYY-MM-DD)
- `SexCode` - Gender code (M/F/U)
- `OperatorLicenseNumber` - Driver license number
- `State` - Two-letter state code (omitted for in-state CA queries)
- `RegistrationPlate` - License plate number
- `VIN` - Vehicle Identification Number
- `BoatRegistrationNumber` - Boat/vessel registration number

## Authentication

The application uses HTTP Basic Authentication to protect access.

### Default Credentials

- **Username:** `UniversalSearch`
- **Password:** `DEXValidation`

### Customizing Credentials

Set environment variables to override defaults:

```bash
export AUTH_USERNAME="your-username"
export AUTH_PASSWORD="your-secure-password"
npm start
```

In Railway, set these as environment variables in the dashboard.

### Unprotected Endpoints

- `/health` - Health check endpoint (returns JSON status)

## API Endpoints

### GET /

Main application interface (requires authentication).

### GET /health

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T21:00:00.000Z"
}
```

## Technical Specifications

### Based on CA eSUN Documentation

- Transaction types: `DriverLicenseQuery`, `DriverHistoryQuery`, `VehicleRegistrationQuery`
- Message Key: DQ (Driver License), KQ (Driver History), RQ (Vehicle Registration)
- System: California eSUN version 21
- Geoscope: Global

### State Field Handling

**Critical Specification Detail:**
- **In-State CA queries**: State field must be **omitted entirely** (even if "CA" is entered)
- **Out-of-State queries**: State field should be included with the appropriate 2-letter state code
- The validator enforces this rule and warns/errors on incorrect usage

## Project Structure

```
DEX Validation Tool/
├── public/
│   └── index.html          # Main application (HTML + CSS + JavaScript)
├── server.js               # Express server with basic auth
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Development

### Adding New Query Types

1. Update `querySpecs` object in `public/index.html`
2. Add field combinations with proper state handling
3. Update `generateXML()` function to support new fields
4. Add field definitions to `fieldDefinitions` object

### Modifying Validation Logic

Edit the `validateQuery()` function in `public/index.html` to adjust validation rules.

## Troubleshooting

### "Authentication required" on localhost

Make sure you're entering the correct credentials:
- Username: `UniversalSearch`
- Password: `DEXValidation`

### XML output doesn't match expected format

Ensure you've selected the correct query type and state mode (In-State vs Out-of-State).

### State field warnings

- If doing an **in-state CA query**, remove any State field value
- If doing an **out-of-state query**, include the State field with a 2-letter code

## License

MIT

## Contributing

Contributions are welcome! Please ensure any changes maintain compliance with the CA eSUN specification.

## Support

For issues or questions, please open an issue in the GitHub repository.
