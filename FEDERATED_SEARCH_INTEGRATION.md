# Federated Search JSON Configuration Integration

## Document Purpose

This document summarizes the analysis of how the DEX Validation Tool relates to the Mark43 Federated Search configuration system and provides a roadmap for implementing JSON configuration export functionality.

**Goal**: Extend the DEX Validation Tool to generate properly formatted JSON configurations that can be imported into RMS/CAD via the Federated Search configuration API.

**Analysis Date**: February 24, 2026
**Repositories Analyzed**:
- DEX Validation Tool: `https://github.com/Brad-Fullwood-Mark43/DEX-Validator.git`
- Federated Search: `https://github.com/mark43/federated-search.git`
- DEX Service: `https://github.com/mark43/dex.git`
- RMS: `https://github.com/mark43/rms.git`
- CAD: `https://github.com/mark43/cad.git`

---

## Executive Summary

### Current State

The DEX Validation Tool currently:
- ✅ Validates query field combinations for CA eSUN
- ✅ Generates XML output matching production format
- ✅ Supports Driver License, Driver History, Vehicle Registration, and Article queries
- ✅ Enforces CA-specific rules (AB 1747 purpose code, state field handling)
- ❌ **Does NOT export configuration as JSON for import into Federated Search**

### Implementation Goal

Add functionality to:
1. Generate `DepartmentBundle` JSON from validation tool query specifications
2. Include all query forms, field mappings, and validation rules
3. Provide download/export functionality for JSON configuration files
4. Support import into RMS via Federated Search configuration API

### Validation of Approach

**Confirmed**: The DEX Validation Tool implements the **exact same XML generation and validation logic** as production systems. This makes it an ideal source for generating configuration JSON.

---

## System Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEX Validation Tool                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ JavaScript Query Specs (querySpecs object)                  │    │
│  │ - Field combinations                                        │    │
│  │ - Validation rules                                          │    │
│  │ - XML generation logic                                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                           ↓                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ NEW: JSON Configuration Export                              │    │
│  │ - Convert querySpecs to DepartmentBundle JSON               │    │
│  │ - Generate provider configurations                          │    │
│  │ - Create downloadable JSON file                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP POST)
┌─────────────────────────────────────────────────────────────────────┐
│                    Federated Search API                              │
│  POST /v2/admin/departmentConfiguration/import/{departmentId}       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ ConfigurationController                                     │    │
│  │ - Validates JSON structure                                  │    │
│  │ - Imports query forms and mappings                          │    │
│  │ - Stores in DynamoDB                                        │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (Runtime)
┌─────────────────────────────────────────────────────────────────────┐
│                        DEX Service                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ ConnectCicQueryTranslator                                   │    │
│  │ - Applies configuration rules                               │    │
│  │ - Generates XML for external systems                        │    │
│  │ - Routes to message switches                                │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   External Message Switches                          │
│  • ConnectCIC (CA eSUN, AZ ACJIS, MA LEAPS, etc.)                   │
│  • Omnixx (LA LLETS, LA CCH)                                         │
│  • Starship                                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## JSON Configuration Structure

### DepartmentBundle Schema

Based on analysis of `ConfigurationController.java` and ConfigService implementation:

```json
{
  "departmentId": "string",
  "version": 1,
  "bundles": [
    {
      "id": "string (ULID or UUID)",
      "name": "string (e.g., 'CA_ESUN_VEHICLE_QUERIES')",
      "version": 1,
      "configurations": [
        {
          "id": "string (ULID)",
          "name": "string (e.g., 'VehicleRegistrationQuery')",
          "version": 1,
          "configurationType": "QUERY_FORM",
          "data": {
            "queryType": "VEHICLE_REGISTRATION_INQUIRY",
            "messageType": "VehicleRegistrationQuery",
            "fieldCombinations": [
              {
                "id": 1,
                "description": "(In) LicensePlateNumber only",
                "requiredFields": ["licensePlateNumber"],
                "optionalFields": [],
                "state": "in-state",
                "messageKeyReference": "QV"
              }
            ],
            "fieldMappings": {
              "licensePlateNumber": {
                "xmlFieldName": "LicensePlateNumber",
                "fieldType": "string",
                "maxLength": 10,
                "required": false,
                "validationRules": []
              },
              "state": {
                "xmlFieldName": "State",
                "fieldType": "string",
                "maxLength": 2,
                "required": false,
                "validationRules": ["OMIT_FOR_IN_STATE_CA"]
              },
              "purposeCode": {
                "xmlFieldName": "CaRequestPurposeCode",
                "fieldType": "enum",
                "required": true,
                "allowedValues": ["C", "I", "U"],
                "validationRules": ["AB_1747_REQUIRED"]
              }
            },
            "xmlGeneration": {
              "wrapperElement": "Request",
              "messageTypeField": "MessageType",
              "idField": "Id",
              "fieldOrder": [
                "purposeCode",
                "name",
                "addressStreetNumber",
                "addressCity",
                "birthDate",
                "sexCode",
                "operatorLicenseNumber",
                "state",
                "licensePlateNumber",
                "licensePlateTypeCode",
                "licensePlateYear",
                "vehicleIdentificationNumber",
                "vehicleMakeCode",
                "vehicleYear"
              ]
            }
          }
        }
      ]
    }
  ],
  "providers": [
    {
      "providerId": "CA_ESUN",
      "providerName": "California eSUN",
      "providerType": "CONNECTCIC",
      "region": "CA_CLETS",
      "authenticationRequired": true,
      "authenticationFields": ["ori", "deviceId", "stateUserId"],
      "supportedQueries": [
        "VEHICLE_REGISTRATION_INQUIRY",
        "PERSON_INQUIRY",
        "FIREARM_INQUIRY"
      ]
    }
  ]
}
```

### Key Configuration Elements

#### 1. Field Combinations
Maps directly from `querySpecs.combinations` in validation tool:
- `requiredFields`: Array of field names that must be present
- `optionalFields`: Array of field names that may be present
- `state`: "in-state", "out-of-state", or "both"
- `messageKeyReference`: CA eSUN message key (QV, RQP, RQN, RQV, etc.)

#### 2. Field Mappings
Maps `fieldDefinitions` to XML element specifications:
- `xmlFieldName`: The XML element name (e.g., "LicensePlateNumber")
- `fieldType`: Data type (string, enum, date, integer)
- `validationRules`: Array of validation rule identifiers
- `maxLength`: Character limit for string fields

#### 3. XML Generation Rules
Controls how XML is constructed:
- `wrapperElement`: Top-level XML element (always "Request" for CA eSUN)
- `fieldOrder`: Order in which fields appear in XML output
- Transformation rules (e.g., date format conversion)

---

## API Endpoints Reference

### Federated Search Configuration API

**Base URL**: `{RMS_BASE_URL}/federated-search/api/v2/admin`

#### Export Configuration
```http
GET /departmentConfiguration/export/{departmentId}
Authorization: Bearer {JWT_TOKEN}

Response: 200 OK
{
  "departmentId": "string",
  "bundles": [...],
  "providers": [...]
}
```

#### Import Configuration
```http
POST /departmentConfiguration/import/{departmentId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request Body: DepartmentBundle (see schema above)

Response: 201 Created
{
  "departmentId": "string",
  "bundles": [...],
  "validationResults": {
    "errors": [],
    "warnings": []
  }
}
```

#### Validate Configuration
```http
GET /departmentConfiguration/validate/{departmentId}
Authorization: Bearer {JWT_TOKEN}

Response: 200 OK (valid) or 400 Bad Request (invalid)
{
  "queryFormErrors": [],
  "providerErrors": [],
  "fieldMappingErrors": []
}
```

### Access Control

**Required Permission**: `adminAbilities()` (Mark43 admin role)

**UI Access in RMS**:
- Navigate to: Admin → Application Settings → Federated Search Settings
- Component: `FederatedSearchSettings.tsx` (lazy-loaded from federated-search module)

---

## Current Validation Tool Implementation

### Query Specifications Structure

**Location**: `public/vehicle-registration.html`, `public/driver-license.html`, etc.

```javascript
const querySpecs = {
    'vehicle-registration': {
        name: 'Vehicle Registration Query',
        combinations: [
            {
                id: 1,
                description: '(In) LicensePlateNumber only',
                fields: ['licensePlateNumber'],
                state: 'in-state',
                keyReference: 'QV'
            },
            {
                id: 3,
                description: '(In/Out) LicensePlateNumber, LicensePlateTypeCode, LicensePlateYear, [State]',
                fields: ['licensePlateNumber', 'licensePlateTypeCode', 'licensePlateYear'],
                optionalFields: ['state'],
                state: 'both',
                keyReference: 'RQP'
            },
            // ... more combinations
        ]
    }
};
```

### Field Definitions Structure

```javascript
const fieldDefinitions = {
    licensePlateNumber: {
        label: 'License Plate Number',
        type: 'text',
        placeholder: 'ABC1234',
        hint: 'Enter license plate number',
        maxLength: 10
    },
    state: {
        label: 'State',
        type: 'select',
        options: 'stateCodes.csv',
        hint: 'Two-letter state code (omit for CA in-state)'
    },
    purposeCode: {
        label: 'CA Purpose Code',
        type: 'select',
        options: [
            { value: 'C', label: 'Criminal Justice' },
            { value: 'I', label: 'Immigration Enforcement' },
            { value: 'U', label: 'USC 1325 Violations' }
        ],
        required: true,
        hint: 'Required per AB 1747'
    }
};
```

### XML Generation Function

**Location**: `public/vehicle-registration.html:2800`

```javascript
function generateXML(queryType, data, state) {
    const queryTypeTag = queryType.replace(/ /g, '');

    let xml = `<Request>\n`;
    xml += `  <MessageType>${queryTypeTag}</MessageType>\n`;
    xml += `  <Id>MARK43GENERATEDMSGID</Id>\n`;

    // CA Purpose Code (AB 1747)
    if (data.purposeCode) {
        xml += `  <CaRequestPurposeCode>${data.purposeCode}</CaRequestPurposeCode>\n`;
    }

    // Field order
    const fieldOrder = ['name', 'addressStreetNumber', 'addressCity',
                       'birthDate', 'sexCode', 'operatorLicenseNumber', 'state',
                       'licensePlateNumber', 'licensePlateTypeCode', 'licensePlateYear',
                       'vehicleIdentificationNumber', 'vehicleMakeCode', 'vehicleYear'];

    fieldOrder.forEach(key => {
        if (!data[key]) return;

        // Field mapping
        if (key === 'licensePlateNumber') {
            xml += `  <LicensePlateNumber>${data[key]}</LicensePlateNumber>\n`;
        }
        else if (key === 'state') {
            // CRITICAL: Only include for out-of-state
            if (state === 'out-of-state' && data[key]) {
                xml += `  <State>${data[key].toUpperCase()}</State>\n`;
            }
        }
        // ... more field mappings
    });

    xml += `</Request>`;
    return xml;
}
```

---

## Production System Comparison

### DEX Service Query Translation

**Location**: `dex/data-exchange/data-exchange-connectcic/src/main/java/com/mark43/dataexchange/connectcic/models/query/ConnectCicQueryTranslator.java`

```java
public static Collection<IConnectCicQuery> translateToConnectCicQueries(
    DexQueryInputBase dexQueryInput,
    DexQuery dexQuery,
    DexRegion dexRegion,
    String requestAgencyId,
    String stateUserId) {

    Collection<IConnectCicQuery> connectCicQueries = new ArrayList<>();

    switch (dexQuery) {
        case VEHICLE_REGISTRATION_INQUIRY:
            vehicleRegistrationInquiry = (VehicleRegistrationInquiry) dexQueryInput;

            // Set default state if null
            if (vehicleRegistrationInquiry.getState() == null) {
                vehicleRegistrationInquiry.setState(dexRegion.getDefaultStateCode());
            }

            // Region-specific handling
            if (DexRegion.CA_JDIC_EXPANDED.equals(dexRegion)) {
                connectCicQueries.add(
                    translateToConnectCicCaVehicleRegistrationByNameQuery(
                        vehicleRegistrationInquiry, dexRegion));
            }
            else {
                connectCicQueries.add(
                    translateToConnectCicVehicleRegistrationQuery(
                        vehicleRegistrationInquiry, dexRegion));
            }
            break;
        // ... other query types
    }

    return connectCicQueries;
}
```

**Key Observations**:
1. **Default State Handling**: If state is null, uses `dexRegion.getDefaultStateCode()`
2. **Region-Specific Logic**: Different handlers for CA, TX, AZ, MA regions
3. **Message Type Mapping**: DexQuery enum maps to ConnectCIC message types
4. **Field Translation**: Input DTOs translated to provider-specific query objects

### Federated Search Configuration Service

**Location**: `federated-search/api/src/main/java/com/mark43/fs/controller/ConfigurationController.java`

```java
@PostMapping("/departmentConfiguration/import/{departmentId}")
public ResponseEntity<DepartmentBundle> importDepartmentConfiguration(
    @RequestBody DepartmentBundle departmentBundle,
    @PathVariable String departmentId) {

    log.info("Importing department bundle");

    // Validates and imports configuration
    DepartmentBundle importedDepartmentBundle =
        configService.importDepartmentConfiguration(departmentBundle, departmentId);

    log.info("Imported department bundle: {}", importedDepartmentBundle);

    return ResponseEntity.status(CREATED).body(importedDepartmentBundle);
}

@GetMapping("/departmentConfiguration/validate/{departmentId}")
public ResponseEntity<LinkedHashMap<String, List<String>>> validateDepartmentConfiguration(
    @PathVariable String departmentId) {

    LinkedHashMap<String, List<String>> validationSummary =
        configService.validateDepartmentConfiguration(departmentId);

    return ResponseEntity
        .status(validationSummary.isEmpty() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
        .body(validationSummary);
}
```

**Key Observations**:
1. **JSON Structure**: Accepts `DepartmentBundle` with nested configurations
2. **Validation**: Separate endpoint for pre-import validation
3. **Storage**: Configurations stored in DynamoDB (based on ConfigService impl)
4. **Versioning**: Supports configuration versioning for rollback

---

## Implementation Roadmap

### Phase 1: JSON Export Functionality

**Goal**: Add ability to export current query specifications as DepartmentBundle JSON

#### Tasks:

1. **Create JSON Mapper Module** (`public/js/json-mapper.js`)
   ```javascript
   class DepartmentBundleMapper {
       constructor() {
           this.bundleVersion = 1;
       }

       generateDepartmentBundle(querySpecs, fieldDefinitions, providerId, providerName) {
           // Convert querySpecs to DepartmentBundle format
       }

       generateConfiguration(queryType, querySpec, fieldDefinitions) {
           // Create Configuration object for single query type
       }

       generateFieldMappings(fieldDefinitions) {
           // Create fieldMappings from fieldDefinitions
       }

       generateProviderConfig(providerId, providerName, supportedQueries) {
           // Create Provider object
       }
   }
   ```

2. **Add Export Button to Each Query Page**
   - Location: Add to validation results section
   - Button text: "Export Configuration JSON"
   - Action: Generate and download JSON file

3. **Implement Download Function**
   ```javascript
   function downloadConfigurationJSON() {
       const mapper = new DepartmentBundleMapper();
       const bundle = mapper.generateDepartmentBundle(
           querySpecs,
           fieldDefinitions,
           'CA_ESUN',
           'California eSUN'
       );

       const json = JSON.stringify(bundle, null, 2);
       const blob = new Blob([json], { type: 'application/json' });
       const url = URL.createObjectURL(blob);

       const a = document.createElement('a');
       a.href = url;
       a.download = `ca-esun-${queryType}-config.json`;
       a.click();
   }
   ```

4. **Add Configuration Preview**
   - Show JSON in collapsible section before download
   - Include validation warnings (e.g., missing provider info)

### Phase 2: Multi-Query Bundle Support

**Goal**: Generate complete bundle with all query types (Vehicle, Person, Article, etc.)

#### Tasks:

1. **Create Bundle Builder Page** (`public/bundle-builder.html`)
   - Select which query types to include
   - Configure provider information (provider ID, name, region)
   - Set department-specific settings
   - Generate combined bundle

2. **Provider Configuration UI**
   ```html
   <form id="provider-config">
       <input name="providerId" placeholder="CA_ESUN" required>
       <input name="providerName" placeholder="California eSUN" required>
       <select name="providerType">
           <option value="CONNECTCIC">ConnectCIC</option>
           <option value="OMNIXX">Omnixx</option>
           <option value="STARSHIP">Starship</option>
       </select>
       <select name="region">
           <option value="CA_CLETS">CA CLETS</option>
           <option value="CA_JDIC">CA JDIC</option>
           <option value="CA_SDSD_ESUN">CA SDSD eSUN</option>
       </select>
   </form>
   ```

3. **Bundle Validation**
   - Check for duplicate configuration IDs
   - Verify all referenced providers exist
   - Validate field mappings are complete

### Phase 3: Import Testing & Documentation

**Goal**: Validate generated JSON works with production Federated Search API

#### Tasks:

1. **Create Test Import Script** (`test-import.js`)
   ```javascript
   // Node.js script for testing import
   const axios = require('axios');
   const fs = require('fs');

   async function testImport(jsonFilePath, departmentId, apiBaseUrl, jwtToken) {
       const bundle = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

       try {
           // Import configuration
           const importResponse = await axios.post(
               `${apiBaseUrl}/v2/admin/departmentConfiguration/import/${departmentId}`,
               bundle,
               {
                   headers: {
                       'Authorization': `Bearer ${jwtToken}`,
                       'Content-Type': 'application/json'
                   }
               }
           );

           console.log('Import successful:', importResponse.data);

           // Validate configuration
           const validateResponse = await axios.get(
               `${apiBaseUrl}/v2/admin/departmentConfiguration/validate/${departmentId}`,
               {
                   headers: {
                       'Authorization': `Bearer ${jwtToken}`
                   }
               }
           );

           console.log('Validation result:', validateResponse.status);

       } catch (error) {
           console.error('Import failed:', error.response?.data || error.message);
       }
   }
   ```

2. **Add Import Instructions to README**
   - How to obtain JWT token for testing
   - API endpoint URLs for different environments (QA, staging, production)
   - Troubleshooting common import errors

3. **Create Example Configurations**
   - `examples/ca-esun-vehicle-config.json` - Vehicle queries only
   - `examples/ca-esun-person-config.json` - Person queries only
   - `examples/ca-esun-complete-config.json` - All query types

### Phase 4: Advanced Features

**Goal**: Add configuration management features

#### Tasks:

1. **Configuration Diff Tool**
   - Compare two JSON configurations
   - Highlight differences in field mappings
   - Show impact of changes

2. **Migration Assistant**
   - Convert old configuration format to new format
   - Handle breaking changes
   - Generate migration notes

3. **Configuration Templates**
   - Pre-built configurations for common providers
   - Customization wizard
   - Field mapping library

---

## Field Mapping Reference

### CA eSUN Field Names

| Internal Field Name | XML Element Name | Data Type | Max Length | Notes |
|-------------------|------------------|-----------|------------|-------|
| `purposeCode` | `CaRequestPurposeCode` | enum | 1 | C, I, or U (AB 1747) |
| `name` | `Name` | string | 40 | Format: LAST, FIRST MIDDLE |
| `birthDate` | `BirthDate` | date | 8 | Format: YYYYMMDD |
| `sexCode` | `SexCode` | enum | 1 | M, F, U |
| `operatorLicenseNumber` | `OperatorLicenseNumber` | string | 20 | Driver license number |
| `state` | `State` | string | 2 | Omit for in-state CA |
| `licensePlateNumber` | `LicensePlateNumber` | string | 10 | |
| `licensePlateTypeCode` | `LicensePlateTypeCode` | string | 3 | See codes list |
| `licensePlateYear` | `LicensePlateYear` | integer | 4 | |
| `vehicleIdentificationNumber` | `VehicleIdentificationNumber` | string | 17 | VIN |
| `vehicleMakeCode` | `VehicleMakeCode` | string | 4 | See VMA codes |
| `vehicleYear` | `VehicleYear` | integer | 4 | |
| `addressStreetNumber` | `AddressStreetNumber` | string | 10 | |
| `addressCity` | `AddressCity` | string | 30 | |
| `articleSerialNumber` | `ArticleSerialNumber` | string | 20 | |
| `articleTypeCode` | `ArticleTypeCode` | string | 3 | |
| `articleCategory` | `ArticleCategory` | string | 10 | |
| `articleBrand` | `ArticleBrand` | string | 4 | See brand codes |

### Special Transformation Rules

1. **Date Fields**: Convert from `YYYY-MM-DD` to `YYYYMMDD`
   ```javascript
   const dateFormatted = value.replace(/-/g, '');
   ```

2. **State Field**:
   - In-state CA queries: **Omit entirely** (even if value is "CA")
   - Out-of-state queries: Include with uppercase 2-letter code

3. **Name Field**:
   - Format must be: `LAST, FIRST MIDDLE`
   - Trailing comma acceptable if no middle name

4. **Purpose Code**:
   - Always required per AB 1747 (July 21, 2021)
   - Appears before other fields in XML

---

## Validation Rules Reference

### Common Validation Rules

1. **AB_1747_REQUIRED**
   - Applies to: `purposeCode`
   - Description: CA Purpose Code mandatory per AB 1747
   - Error: "CA Purpose Code is mandatory per AB 1747 (required since July 21, 2021)"

2. **OMIT_FOR_IN_STATE_CA**
   - Applies to: `state`
   - Description: State field must be omitted for in-state CA queries
   - Error: "State field must be REMOVED for in-state California queries"

3. **FORMAT_LAST_FIRST_MIDDLE**
   - Applies to: `name`
   - Description: Name must follow format: LAST, FIRST MIDDLE
   - Pattern: `/^[A-Z\s'-]+,\s*[A-Z\s'-]+$/i`

4. **DATE_FORMAT_YYYY_MM_DD**
   - Applies to: `birthDate`
   - Description: Date must be in YYYY-MM-DD format
   - Pattern: `/^\d{4}-\d{2}-\d{2}$/`

5. **STATE_CODE_TWO_LETTER**
   - Applies to: `state`
   - Description: Must be valid 2-letter state code
   - Validation: Check against stateCodes.csv

6. **VIN_FORMAT**
   - Applies to: `vehicleIdentificationNumber`
   - Description: 17-character VIN
   - Pattern: `/^[A-HJ-NPR-Z0-9]{17}$/i`

---

## Testing Strategy

### Unit Testing

**Test File**: `public/js/__tests__/json-mapper.test.js`

```javascript
describe('DepartmentBundleMapper', () => {
    let mapper;

    beforeEach(() => {
        mapper = new DepartmentBundleMapper();
    });

    test('generates valid DepartmentBundle structure', () => {
        const bundle = mapper.generateDepartmentBundle(
            mockQuerySpecs,
            mockFieldDefinitions,
            'CA_ESUN',
            'California eSUN'
        );

        expect(bundle).toHaveProperty('departmentId');
        expect(bundle).toHaveProperty('bundles');
        expect(bundle.bundles).toBeInstanceOf(Array);
    });

    test('includes all field combinations', () => {
        const config = mapper.generateConfiguration(
            'vehicle-registration',
            mockQuerySpec,
            mockFieldDefinitions
        );

        expect(config.data.fieldCombinations).toHaveLength(
            mockQuerySpec.combinations.length
        );
    });

    test('maps field definitions to XML names', () => {
        const mappings = mapper.generateFieldMappings(mockFieldDefinitions);

        expect(mappings.licensePlateNumber.xmlFieldName)
            .toBe('LicensePlateNumber');
        expect(mappings.state.xmlFieldName)
            .toBe('State');
    });

    test('includes validation rules', () => {
        const mappings = mapper.generateFieldMappings(mockFieldDefinitions);

        expect(mappings.purposeCode.validationRules)
            .toContain('AB_1747_REQUIRED');
        expect(mappings.state.validationRules)
            .toContain('OMIT_FOR_IN_STATE_CA');
    });
});
```

### Integration Testing

**Test Environments**:
1. **Local Federated Search**: Test against local Docker environment
2. **QA Environment**: Test against `automated-qa.qa.mark43.io`
3. **Staging**: Final validation before production

**Test Cases**:
1. Export JSON from validation tool
2. Import JSON via Federated Search API
3. Validate configuration via API
4. Execute test query in CAD/RMS
5. Verify XML matches expected format
6. Confirm external system receives correct message

---

## Known Limitations & Future Work

### Current Limitations

1. **Single Provider Support**: Initial implementation targets CA eSUN only
2. **No Multi-Region Support**: Does not handle TX, AZ, MA region differences
3. **Static Field Mappings**: Cannot customize field mappings per department
4. **No Configuration Versioning UI**: Must manually manage versions

### Future Enhancements

1. **Provider Templates**: Pre-built configurations for common providers
2. **Visual Configuration Builder**: Drag-and-drop field mapping UI
3. **Configuration Validation**: Real-time validation against provider specs
4. **Bulk Import**: Import multiple configurations at once
5. **Configuration History**: Track changes and rollback capability
6. **Export to Other Formats**: Support YAML, TOML, etc.

---

## Troubleshooting Guide

### Common Import Errors

#### Error: "Invalid JSON structure"
**Cause**: Malformed JSON syntax
**Solution**: Validate JSON using online validator before import

#### Error: "Missing required field: departmentId"
**Cause**: departmentId not set in bundle
**Solution**: Add departmentId to bundle root

#### Error: "Invalid field combination"
**Cause**: Required field missing or invalid optional field
**Solution**: Check fieldCombinations against provider specs

#### Error: "Unknown validation rule"
**Cause**: Referenced validation rule not recognized
**Solution**: Use only supported validation rule identifiers

#### Error: "Duplicate configuration ID"
**Cause**: Multiple configurations with same ID
**Solution**: Generate unique ULIDs for each configuration

### Debugging Tips

1. **Enable Verbose Logging**: Set `LOG_LEVEL=DEBUG` in server.js
2. **Test Locally First**: Use local Federated Search before QA/prod
3. **Validate Before Import**: Use `/validate` endpoint first
4. **Check Existing Config**: Export current config to see working example
5. **Compare with Examples**: Check against example configurations

---

## References

### Repository Locations

- **DEX Validation Tool**: `/Users/brad.fullwood/Developer/DEX Validation Tool`
- **Federated Search**: `/Users/brad.fullwood/Developer/federated-search`
- **DEX Service**: `/Users/brad.fullwood/Developer/dex`
- **RMS**: `/Users/brad.fullwood/Developer/rms`
- **CAD**: `/Users/brad.fullwood/Developer/cad`

### Key Files

**Validation Tool**:
- Query specs: `public/vehicle-registration.html:403-471`
- XML generation: `public/vehicle-registration.html:2800-2874`
- Validation logic: `public/vehicle-registration.html:2681-2798`

**Federated Search**:
- Configuration API: `api/src/main/java/com/mark43/fs/controller/ConfigurationController.java`
- Config service: `api/src/main/java/com/mark43/fs/services/ConfigService.java`
- OpenAPI spec: `api/openapi/resources/FederatedSearch.yaml`

**DEX Service**:
- Query translator: `data-exchange/data-exchange-connectcic/src/main/java/com/mark43/dataexchange/connectcic/models/query/ConnectCicQueryTranslator.java`
- Message types: `data-exchange/data-exchange-connectcic/src/main/java/com/mark43/dataexchange/connectcic/models/MessageType.java`

**RMS**:
- Federated Search Settings UI: `client/src/scripts/modules/admin/application-settings/components/FederatedSearchSettings.tsx`

### Documentation Links

- CA eSUN Specification: [Internal documentation]
- AB 1747 Purpose Code: California law requiring purpose codes
- Federated Search CLAUDE.md: `federated-search/CLAUDE.md`
- DEX Service CLAUDE.md: `dex/CLAUDE.md`

---

## Appendix: Example JSON Configuration

### Complete Vehicle Registration Configuration

```json
{
  "departmentId": "dept-123456",
  "version": 1,
  "bundles": [
    {
      "id": "01HMVKQJ6Q8XMVHRPKR2NQAW6P",
      "name": "CA_ESUN_VEHICLE_REGISTRATION",
      "version": 1,
      "configurations": [
        {
          "id": "01HMVKQJ6Q8XMVHRPKR2NQAW6Q",
          "name": "VehicleRegistrationQuery",
          "version": 1,
          "configurationType": "QUERY_FORM",
          "data": {
            "queryType": "VEHICLE_REGISTRATION_INQUIRY",
            "messageType": "VehicleRegistrationQuery",
            "fieldCombinations": [
              {
                "id": 1,
                "description": "(In) LicensePlateNumber only",
                "requiredFields": ["licensePlateNumber"],
                "optionalFields": [],
                "state": "in-state",
                "messageKeyReference": "QV"
              },
              {
                "id": 2,
                "description": "(In) LicensePlateNumber, [LicensePlateTypeCode, LicensePlateYear]",
                "requiredFields": ["licensePlateNumber"],
                "optionalFields": ["licensePlateTypeCode", "licensePlateYear"],
                "state": "in-state",
                "messageKeyReference": "RQP"
              },
              {
                "id": 3,
                "description": "(In/Out) LicensePlateNumber, LicensePlateTypeCode, LicensePlateYear, [State]",
                "requiredFields": ["licensePlateNumber", "licensePlateTypeCode", "licensePlateYear"],
                "optionalFields": ["state"],
                "state": "both",
                "messageKeyReference": "RQP"
              },
              {
                "id": 5,
                "description": "(In) VehicleIdentificationNumber only",
                "requiredFields": ["vehicleIdentificationNumber"],
                "optionalFields": [],
                "state": "in-state",
                "messageKeyReference": "QV"
              },
              {
                "id": 6,
                "description": "(In) VehicleIdentificationNumber, [VehicleMakeCode or VehicleYear]",
                "requiredFields": ["vehicleIdentificationNumber"],
                "optionalFields": ["vehicleMakeCode", "vehicleYear"],
                "state": "in-state",
                "messageKeyReference": "RQV"
              },
              {
                "id": 7,
                "description": "(In/Out) VehicleIdentificationNumber, [VehicleMakeCode, VehicleYear, or State]",
                "requiredFields": ["vehicleIdentificationNumber"],
                "optionalFields": ["state", "vehicleMakeCode", "vehicleYear"],
                "state": "both",
                "messageKeyReference": "RQV"
              },
              {
                "id": 8,
                "description": "(In) Name, AddressStreetNumber, AddressCity",
                "requiredFields": ["name", "addressStreetNumber", "addressCity"],
                "optionalFields": [],
                "state": "in-state",
                "messageKeyReference": "RQN"
              },
              {
                "id": 9,
                "description": "(In) Name, BirthDate",
                "requiredFields": ["name", "birthDate"],
                "optionalFields": [],
                "state": "in-state",
                "messageKeyReference": "RQN"
              }
            ],
            "fieldMappings": {
              "purposeCode": {
                "xmlFieldName": "CaRequestPurposeCode",
                "fieldType": "enum",
                "required": true,
                "allowedValues": ["C", "I", "U"],
                "validationRules": ["AB_1747_REQUIRED"],
                "description": "CA Purpose Code per AB 1747"
              },
              "name": {
                "xmlFieldName": "Name",
                "fieldType": "string",
                "maxLength": 40,
                "required": false,
                "validationRules": ["FORMAT_LAST_FIRST_MIDDLE"],
                "format": "LAST, FIRST MIDDLE"
              },
              "addressStreetNumber": {
                "xmlFieldName": "AddressStreetNumber",
                "fieldType": "string",
                "maxLength": 10,
                "required": false,
                "validationRules": []
              },
              "addressCity": {
                "xmlFieldName": "AddressCity",
                "fieldType": "string",
                "maxLength": 30,
                "required": false,
                "validationRules": []
              },
              "birthDate": {
                "xmlFieldName": "BirthDate",
                "fieldType": "date",
                "required": false,
                "validationRules": ["DATE_FORMAT_YYYY_MM_DD"],
                "transformation": "REMOVE_HYPHENS"
              },
              "sexCode": {
                "xmlFieldName": "SexCode",
                "fieldType": "enum",
                "required": false,
                "allowedValues": ["M", "F", "U"],
                "validationRules": []
              },
              "operatorLicenseNumber": {
                "xmlFieldName": "OperatorLicenseNumber",
                "fieldType": "string",
                "maxLength": 20,
                "required": false,
                "validationRules": []
              },
              "state": {
                "xmlFieldName": "State",
                "fieldType": "string",
                "maxLength": 2,
                "required": false,
                "validationRules": ["OMIT_FOR_IN_STATE_CA", "STATE_CODE_TWO_LETTER"],
                "transformation": "UPPERCASE"
              },
              "licensePlateNumber": {
                "xmlFieldName": "LicensePlateNumber",
                "fieldType": "string",
                "maxLength": 10,
                "required": false,
                "validationRules": []
              },
              "licensePlateTypeCode": {
                "xmlFieldName": "LicensePlateTypeCode",
                "fieldType": "string",
                "maxLength": 3,
                "required": false,
                "validationRules": []
              },
              "licensePlateYear": {
                "xmlFieldName": "LicensePlateYear",
                "fieldType": "integer",
                "required": false,
                "validationRules": []
              },
              "vehicleIdentificationNumber": {
                "xmlFieldName": "VehicleIdentificationNumber",
                "fieldType": "string",
                "maxLength": 17,
                "required": false,
                "validationRules": ["VIN_FORMAT"]
              },
              "vehicleMakeCode": {
                "xmlFieldName": "VehicleMakeCode",
                "fieldType": "string",
                "maxLength": 4,
                "required": false,
                "validationRules": []
              },
              "vehicleYear": {
                "xmlFieldName": "VehicleYear",
                "fieldType": "integer",
                "required": false,
                "validationRules": []
              }
            },
            "xmlGeneration": {
              "wrapperElement": "Request",
              "messageTypeField": "MessageType",
              "idField": "Id",
              "idValue": "MARK43GENERATEDMSGID",
              "fieldOrder": [
                "purposeCode",
                "name",
                "addressStreetNumber",
                "addressCity",
                "birthDate",
                "sexCode",
                "operatorLicenseNumber",
                "state",
                "licensePlateNumber",
                "licensePlateTypeCode",
                "licensePlateYear",
                "vehicleIdentificationNumber",
                "vehicleMakeCode",
                "vehicleYear"
              ]
            }
          }
        }
      ]
    }
  ],
  "providers": [
    {
      "providerId": "CA_ESUN",
      "providerName": "California eSUN",
      "providerType": "CONNECTCIC",
      "region": "CA_CLETS",
      "authenticationRequired": true,
      "authenticationFields": [
        "ori",
        "deviceId",
        "stateUserId"
      ],
      "supportedQueries": [
        "VEHICLE_REGISTRATION_INQUIRY",
        "PERSON_INQUIRY",
        "DRIVER_LICENSE_INQUIRY",
        "DRIVER_HISTORY_INQUIRY",
        "FIREARM_INQUIRY",
        "SINGLE_ARTICLE_INQUIRY"
      ],
      "messageSwitch": "CA eSUN (California Law Enforcement Switching System)",
      "defaultStateCode": "CA"
    }
  ]
}
```

---

## Implementation Checklist

### Phase 1: JSON Export
- [ ] Create `json-mapper.js` module
- [ ] Add export button to vehicle-registration.html
- [ ] Add export button to driver-license.html
- [ ] Add export button to driver-history.html
- [ ] Add export button to article-query.html
- [ ] Implement JSON download functionality
- [ ] Add configuration preview section
- [ ] Test export with all query types

### Phase 2: Multi-Query Bundle
- [ ] Create bundle-builder.html page
- [ ] Add provider configuration form
- [ ] Implement bundle generation for multiple queries
- [ ] Add bundle validation logic
- [ ] Create combined download functionality
- [ ] Test bundle with all query types together

### Phase 3: Testing & Validation
- [ ] Write unit tests for json-mapper.js
- [ ] Create test-import.js script
- [ ] Test import against local Federated Search
- [ ] Test import against QA environment
- [ ] Document import process in README
- [ ] Create example configuration files
- [ ] Add troubleshooting guide to README

### Phase 4: Documentation
- [ ] Update README with JSON export features
- [ ] Create import instructions
- [ ] Add API endpoint documentation
- [ ] Document field mapping reference
- [ ] Add validation rules reference
- [ ] Create video walkthrough (optional)

---

## Contact & Support

**Repository Owner**: Brad Fullwood (brad.fullwood@mark43.com)

**Related Teams**:
- CAD/RMS Engineering: For production integration questions
- Federated Search Team: For configuration API questions
- DEX Team: For query translation and message switch questions

**Documentation Updates**: This document should be updated as implementation progresses and new findings emerge.

---

**Document Version**: 1.0
**Last Updated**: February 24, 2026
**Next Review**: After Phase 1 completion
