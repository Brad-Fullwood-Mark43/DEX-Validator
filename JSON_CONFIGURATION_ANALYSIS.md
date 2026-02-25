# JSON Configuration Analysis: Form Fields, XML Output & Relationships

## Document Purpose

This document maps the relationship between JSON configuration files (version controlled in GitHub), form fields displayed in RMS/CAD, and XML output sent to external systems. This provides the complete understanding needed to generate accurate configurations.

**Created**: February 24, 2026
**Repositories Analyzed**:
- Federated Search: `https://github.com/mark43/federated-search.git`
- DEX Service: `https://github.com/mark43/dex.git`

---

## ✅ CONFIRMED: JSON Templates ARE Version Controlled in GitHub

### **Location in Repository**

```
federated-search/
└── api/src/main/resources/
    ├── configurations/         ← Individual configuration JSONs
    │   ├── SD_CA_eSUN.json     ← California eSUN configurations
    │   ├── TN_TIES.json        ← Tennessee TIES configurations
    │   ├── AZ_AZDPS.json       ← Arizona DPS configurations
    │   ├── HI_DIT.json         ← Hawaii DIT configurations
    │   ├── RMS.json            ← RMS internal queries
    │   └── RecordsArchive.json ← Records Archive queries
    └── bundles/                ← Bundle metadata (lighter weight)
        ├── SD_CA_eSUN.json     ← References configurations by ID
        ├── TN_TIES.json
        ├── RMS.json
        └── RecordsArchive.json
```

### **Version Control Process**

**Example from git history:**
```bash
commit 8b694c0f
Author: Developer Name
Date:   [Date]

    chore(rnd-25972): Create configurations for esun (#1212)
```

**PR-Based Workflow:**
1. Developer creates/modifies JSON in `api/src/main/resources/configurations/`
2. Creates PR with changes (e.g., #1212)
3. PR reviewed for correctness
4. Merged to main branch
5. Deployed to environments via CI/CD
6. Configurations loaded from classpath into DynamoDB on deployment

**Key Point**: JSON files in GitHub are the **source of truth** and deployed to DynamoDB. Manual imports via API update DynamoDB directly without going through GitHub (not recommended for production).

---

## Configuration Structure: Three-Tier System

### **Tier 1: Bundle (Provider Container)**

**Purpose**: Groups all configurations for a specific provider

**File**: `api/src/main/resources/bundles/SD_CA_eSUN.json`

```json
{
  "id": "5ajs687",
  "version": 1,
  "name": "CA_eSUN",
  "description": "Provider configuration for CA eSUN",
  "label": "CLETS",
  "type": "BUNDLE",
  "provider": "CA_eSUN",
  "configurations": [
    {
      "id": "eaq0qec",
      "version": 1,
      "name": "CA_eSUN",
      "type": "AUTHENTICATION"
    },
    {
      "id": "t95lf54",
      "version": 1,
      "name": "CA_eSUN_QueryMessageFormat",
      "type": "QUERYMESSAGEFORMAT"
    },
    {
      "id": "2lq4ngg",
      "version": 1,
      "name": "CA_eSUN_VehicleRegistrationQuery",
      "type": "QUERYINPUTDATAMAPPING",
      "query": "VehicleRegistrationQuery"
    },
    {
      "id": "nnq8r2i",
      "version": 1,
      "name": "CA_eSUN_DriverLicenseQuery",
      "type": "QUERYINPUTDATAMAPPING",
      "query": "DriverLicenseQuery"
    },
    {
      "id": "ruzmwsa",
      "version": 1,
      "name": "CA_eSUN_DriverHistoryQuery",
      "type": "QUERYINPUTDATAMAPPING",
      "query": "DriverHistoryQuery"
    },
    {
      "id": "tt2lb6i",
      "version": 1,
      "name": "CA_eSUN_Results",
      "type": "QUERYRESULTDATAMAPPING"
    }
  ]
}
```

**What it does**: Lists all configuration IDs for this provider

---

### **Tier 2: Configuration Types**

Each configuration serves a specific purpose:

| Type | Purpose | Controls |
|------|---------|----------|
| `AUTHENTICATION` | Auth credentials | ORI, Mnemonic, DeviceId, UserName, PurposeCode |
| `QUERYMESSAGEFORMAT` | XML wrapper structure | Message envelope, auth placement, payload structure |
| `QUERYINPUTDATAMAPPING` | **Field-to-XML mapping** | Which fields map to which XML elements, combinations |
| `QUERYINPUTFORM` | **Form field definitions** | UI field display, labels, validation, layout |
| `QUERYRESULTDATAMAPPING` | Response parsing | How to parse XML responses |
| `QUERYRESULTSLAYOUT` | Result display | How to display parsed results in UI |

---

### **Tier 3: Configuration Details**

**File**: `api/src/main/resources/configurations/SD_CA_eSUN.json`

Contains full configuration data for each type.

---

## Complete Example: CA eSUN Vehicle Registration Query

### **1. QUERYINPUTDATAMAPPING** (Controls XML Output)

```json
{
  "id": "2lq4ngg",
  "version": 1,
  "name": "CA_eSUN_VehicleRegistrationQuery",
  "description": "Mapping for VehicleRegistrationQuery in CA eSUN",
  "type": "QUERYINPUTDATAMAPPING",
  "provider": "CA_eSUN",
  "providerType": "Commsys",
  "query": "VehicleRegistrationQuery",
  "targetEntity": "Vehicle",
  "handlerFunction": "CommsysTransactionRequestHandler",

  "attributes": [
    {
      "name": "LicensePlateNumber",
      "sourceField": ["LicensePlateNumber"],
      "targetField": "licensePlateNumber",
      "size": 10
    },
    {
      "name": "LicensePlateTypeCode",
      "sourceField": ["LicensePlateTypeCode"],
      "targetField": "licensePlateTypeCode",
      "size": 2
    },
    {
      "name": "LicensePlateYear",
      "sourceField": ["LicensePlateYear"],
      "targetField": "licensePlateYear",
      "size": 4
    },
    {
      "name": "State",
      "sourceField": ["State"],
      "targetField": "state",
      "size": 2
    },
    {
      "name": "VehicleIdentificationNumber",
      "sourceField": ["VehicleIdentificationNumber"],
      "targetField": "vehicleIdentificationNumber",
      "size": 30
    },
    {
      "name": "VehicleMakeCode",
      "sourceField": ["VehicleMakeCode"],
      "targetField": "vehicleMakeCode",
      "size": 4
    },
    {
      "name": "VehicleYear",
      "sourceField": ["VehicleYear"],
      "targetField": "vehicleYear",
      "size": 4
    },
    {
      "name": "Name",
      "sourceField": ["Name"],
      "targetField": "name",
      "size": 30
    },
    {
      "name": "BirthDate",
      "sourceField": ["BirthDate"],
      "targetField": "birthDate",
      "size": 8
    },
    {
      "name": "AddressCity",
      "sourceField": ["AddressCity"],
      "targetField": "addressCity",
      "size": 13
    },
    {
      "name": "AddressStreetNumber",
      "sourceField": ["AddressStreetNumber"],
      "targetField": "addressStreetNumber",
      "size": 3
    }
  ],

  "combinations": [
    {
      "keyReference": "LicensePlateNumber",
      "primaryFieldReference": "LicensePlateNumber",
      "requirements": {
        "set": ["LicensePlateNumber"],
        "any": []
      }
    },
    {
      "keyReference": "LicensePlateNumberLicensePlateTypeCode",
      "primaryFieldReference": "LicensePlateNumber",
      "requirements": {
        "set": ["LicensePlateNumber", "LicensePlateTypeCode"],
        "any": []
      }
    },
    {
      "keyReference": "VehicleIdentificationNumber",
      "primaryFieldReference": "VehicleIdentificationNumber",
      "requirements": {
        "set": ["VehicleIdentificationNumber"],
        "any": []
      }
    },
    {
      "keyReference": "NameBirthDate",
      "primaryFieldReference": "BirthDate",
      "requirements": {
        "set": ["Name", "BirthDate"],
        "any": []
      }
    },
    {
      "keyReference": "NameAddressCityAddressStreetNumber",
      "primaryFieldReference": "Name",
      "requirements": {
        "set": ["Name"],
        "any": ["AddressCity", "AddressStreetNumber"]
      }
    }
  ]
}
```

#### **Key Fields Explained:**

**`attributes`**: Maps form fields to XML elements
- `name`: XML element name (e.g., `LicensePlateNumber`)
- `sourceField`: Form field name(s) that provide data
- `targetField`: Internal field name in handler (camelCase)
- `size`: Maximum field size for validation

**`combinations`**: Defines valid field combinations
- `keyReference`: Unique identifier for this combination (used for message routing)
- `primaryFieldReference`: The main field in this combination
- `requirements.set`: ALL of these fields must be present
- `requirements.any`: AT LEAST ONE of these fields must be present

**`handlerFunction`**: The Java handler that processes this configuration
- `CommsysTransactionRequestHandler`: Generates XML for Commsys-based systems (CA eSUN, TN TIES, etc.)

---

### **2. QUERYINPUTFORM** (Controls Form Fields)

**Note**: In current implementation, query input forms are typically stored separately in the Mark43 bundle (not provider-specific) or generated dynamically from attribute types in RMS.

**Typical structure** (if it existed for CA eSUN):

```json
{
  "id": "form-12345",
  "version": 1,
  "name": "CA_eSUN_VehicleRegistrationQuery_Form",
  "type": "QUERYINPUTFORM",
  "targetEntity": "Vehicle",
  "query": "VehicleRegistrationQuery",

  "layout": {
    "default": {
      "licensePlateNumber": {
        "component": "TextField",
        "props": {
          "label": "License Plate Number",
          "placeholder": "ABC1234",
          "maxLength": 10,
          "required": false,
          "fieldId": "licensePlateNumber",
          "attributeTypeId": "12345"
        }
      },
      "state": {
        "component": "SelectField",
        "props": {
          "label": "State",
          "placeholder": "Select state",
          "required": false,
          "fieldId": "state",
          "options": "STATE_CODES"
        }
      },
      "vin": {
        "component": "TextField",
        "props": {
          "label": "VIN",
          "placeholder": "1HGBH41JXMN109186",
          "maxLength": 30,
          "required": false,
          "fieldId": "vehicleIdentificationNumber",
          "attributeTypeId": "67890"
        }
      }
    }
  }
}
```

---

### **3. AUTHENTICATION** (Controls Auth Fields)

```json
{
  "id": "eaq0qec",
  "version": 1,
  "name": "CA_eSUN",
  "description": "Authentication configuration for CA eSUN",
  "type": "AUTHENTICATION",
  "provider": "CA_eSUN",
  "handlerFunction": "CommsysOriAuthenticationHandler",

  "attributes": [
    {
      "name": "ORI",
      "sourceField": ["ORI"],
      "targetField": "ORI",
      "size": 12
    },
    {
      "name": "Mnemonic",
      "sourceField": ["Mnemonic"],
      "targetField": "Mnemonic",
      "size": 25
    },
    {
      "name": "UserName",
      "sourceField": ["UserName"],
      "targetField": "UserName",
      "size": 25
    },
    {
      "name": "DeviceId",
      "sourceField": ["DeviceId"],
      "targetField": "DeviceId",
      "size": 25
    },
    {
      "name": "CaRequestPurposeCode",
      "sourceField": ["CaRequestPurposeCode"],
      "targetField": "CaRequestPurposeCode",
      "size": 1
    }
  ],

  "combinations": [
    {
      "requirements": {
        "set": [
          "ORI",
          "Mnemonic",
          "UserName",
          "DeviceId",
          "CaRequestPurposeCode"
        ],
        "any": null
      }
    }
  ]
}
```

---

### **4. QUERYMESSAGEFORMAT** (Controls XML Structure)

```json
{
  "id": "t95lf54",
  "version": 1,
  "name": "CA_eSUN_QueryMessageFormat",
  "description": "Configuration for Query format",
  "type": "QUERYMESSAGEFORMAT",
  "handlerFunction": "CommsysWsiOutgoingMessageHandler",
  "authenticationParent": "LawEnforcementTransaction",
  "payloadParent": "LawEnforcementTransaction"
}
```

**What this does**: Tells the system to wrap both authentication and query payload inside `<LawEnforcementTransaction>` XML element.

---

## XML Generation Flow

### **Step-by-Step Process:**

1. **User fills form** in RMS/CAD UI
   ```javascript
   {
     licensePlateNumber: "ABC1234",
     state: "CA",
     purposeCode: "C"
   }
   ```

2. **Federated Search validates** combination
   - Checks `combinations` array in QUERYINPUTDATAMAPPING
   - Finds match: `{ set: ["LicensePlateNumber"], any: [] }`
   - Validates `state="CA"` should be omitted (CA-specific logic)

3. **Authentication Handler** generates auth XML
   - Uses AUTHENTICATION configuration
   - Retrieves ORI, Mnemonic, UserName, DeviceId from user's device configuration
   - Generates:
   ```xml
   <Origin>CA012345678</Origin>
   <Destination>CAESUN</Destination>
   <ORI>CA012345678</ORI>
   <Mnemonic>SDPD</Mnemonic>
   <UserName>JSMITH</UserName>
   <DeviceId>UNIT123</DeviceId>
   <CaRequestPurposeCode>C</CaRequestPurposeCode>
   ```

4. **Query Handler** generates query XML
   - Uses QUERYINPUTDATAMAPPING configuration
   - Maps `licensePlateNumber` → `<LicensePlateNumber>ABC1234</LicensePlateNumber>`
   - Omits `state` field (CA eSUN in-state logic)
   - Uses `keyReference` for message routing
   - Generates:
   ```xml
   <LicensePlateNumber>ABC1234</LicensePlateNumber>
   ```

5. **Message Format Handler** wraps everything
   - Uses QUERYMESSAGEFORMAT configuration
   - Wraps auth + query in `<LawEnforcementTransaction>`
   - Generates final XML:

### **Final Generated XML:**

```xml
<LawEnforcementTransaction>
  <Header>
    <MessageId>01HMVKQJ6Q8XMVHRPKR2NQAW6P</MessageId>
    <MessageType>Query</MessageType>
    <MessageDateTime>2026-02-24T12:00:00Z</MessageDateTime>
    <MessagePriority>Normal</MessagePriority>
  </Header>
  <Authentication>
    <Origin>CA012345678</Origin>
    <Destination>CAESUN</Destination>
    <ORI>CA012345678</ORI>
    <Mnemonic>SDPD</Mnemonic>
    <UserName>JSMITH</UserName>
    <DeviceId>UNIT123</DeviceId>
  </Authentication>
  <Query>
    <MessageKey>RQP</MessageKey>
    <CaRequestPurposeCode>C</CaRequestPurposeCode>
    <LicensePlateNumber>ABC1234</LicensePlateNumber>
  </Query>
</LawEnforcementTransaction>
```

---

## Comparison: DEX Validation Tool vs. Production JSON

### **DEX Validation Tool Structure:**

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
            }
        ]
    }
};

const fieldDefinitions = {
    licensePlateNumber: {
        label: 'License Plate Number',
        type: 'text',
        maxLength: 10
    }
};
```

### **Production JSON Structure:**

```json
{
  "name": "CA_eSUN_VehicleRegistrationQuery",
  "attributes": [
    {
      "name": "LicensePlateNumber",
      "sourceField": ["LicensePlateNumber"],
      "targetField": "licensePlateNumber",
      "size": 10
    }
  ],
  "combinations": [
    {
      "keyReference": "LicensePlateNumber",
      "requirements": {
        "set": ["LicensePlateNumber"],
        "any": []
      }
    }
  ]
}
```

### **Mapping Table:**

| DEX Validation Tool | Production JSON | Purpose |
|---------------------|-----------------|---------|
| `querySpecs.combinations[].fields` | `combinations[].requirements.set` | Required fields |
| `querySpecs.combinations[].optionalFields` | `combinations[].requirements.any` | Optional fields |
| `querySpecs.combinations[].keyReference` | `combinations[].keyReference` | Message routing key |
| `querySpecs.combinations[].state` | (Logic in handler) | In-state vs out-of-state |
| `fieldDefinitions[field].maxLength` | `attributes[].size` | Field length validation |
| `fieldDefinitions[field].label` | `attributes[].name` | Display name & XML element |
| `fieldDefinitions[field].type` | (Inferred from attribute) | Field data type |

---

## Critical Differences: Validation Tool vs. Production

### **1. State Handling**

**Validation Tool**:
```javascript
// Simple toggle
state: 'in-state' | 'out-of-state' | 'both'

// Omit state field for in-state CA
if (state === 'in-state' && formData.state === 'CA') {
    // Don't include in XML
}
```

**Production JSON**:
```json
// State logic in handler function
// No explicit in-state/out-of-state flag in combinations
// Handler (CommsysTransactionRequestHandler) applies provider-specific logic:
// - CA eSUN: Omit state for in-state queries
// - TN TIES: Always include state
// - AZ AZDPS: Include state with specific formatting
```

### **2. Field Combinations**

**Validation Tool**:
```javascript
{
    fields: ['licensePlateNumber'],           // All required
    optionalFields: ['state']                 // At least one optional
}
```

**Production JSON**:
```json
{
    "requirements": {
        "set": ["LicensePlateNumber"],        // ALL of these required
        "any": ["State", "VehicleMakeCode"]   // AT LEAST ONE of these
    }
}
```

### **3. XML Element Naming**

**Validation Tool**:
```javascript
// Converts camelCase to PascalCase
toXmlFieldName('licensePlateNumber') → 'LicensePlateNumber'
```

**Production JSON**:
```json
// Explicitly defined
{
    "name": "LicensePlateNumber",              // XML element name
    "sourceField": ["LicensePlateNumber"],     // Form field name
    "targetField": "licensePlateNumber"        // Handler variable name
}
```

### **4. Handler Functions**

**Validation Tool**:
```javascript
// Single generateXML() function
function generateXML(queryType, data, state) {
    // Hardcoded logic for CA eSUN
}
```

**Production JSON**:
```json
{
    "handlerFunction": "CommsysTransactionRequestHandler"
}
```
- `CommsysTransactionRequestHandler`: For Commsys-based systems (CA, TN, AZ, HI)
- `CommsysWsiOutgoingMessageHandler`: For WSI message format
- `CommsysOriAuthenticationHandler`: For ORI-based auth
- Custom handlers per provider type

---

## How Configurations Get to Production

### **Deployment Flow:**

```
1. Developer modifies JSON
   ↓
   /api/src/main/resources/configurations/SD_CA_eSUN.json

2. Create PR in GitHub
   ↓
   PR #1212: "chore(rnd-25972): Create configurations for esun"

3. Code review & merge
   ↓
   Merged to main branch

4. CI/CD builds artifact
   ↓
   JAR file includes configurations in classpath

5. Deploy to environment
   ↓
   Kubernetes deploys new pod

6. Application startup
   ↓
   Spring Boot loads resources from classpath

7. ConfigService initialization
   ↓
   Reads JSON from classpath
   ↓
   Uploads to DynamoDB if not exists or version changed
   ↓
   DynamoDB: federated-search-tenant-bundles table

8. Runtime
   ↓
   ConfigService reads from DynamoDB (cached)
   ↓
   Applies configurations to queries
```

### **Manual Import Process (Not Recommended for Production):**

```
1. Export configuration from one tenant
   ↓
   GET /v2/admin/departmentConfiguration/export/{departmentId}

2. Modify JSON locally
   ↓
   Edit field mappings, add combinations, etc.

3. Import to another tenant
   ↓
   POST /v2/admin/departmentConfiguration/import/{departmentId}

4. Validate
   ↓
   GET /v2/admin/departmentConfiguration/validate/{departmentId}

Note: This bypasses GitHub version control!
Use only for testing or emergency fixes.
```

---

## Provider-Specific Configurations

### **Currently in GitHub:**

| Provider | File | Description |
|----------|------|-------------|
| CA eSUN | `SD_CA_eSUN.json` | California Law Enforcement Switching System |
| TN TIES | `TN_TIES.json` | Tennessee Transaction Information Exchange System |
| AZ AZDPS | `AZ_AZDPS.json` | Arizona Department of Public Safety |
| HI DIT | `HI_DIT.json` | Hawaii Department of Information Technology |
| RMS | `RMS.json` | Internal RMS queries (not external system) |
| RecordsArchive | `RecordsArchive.json` | Records archive queries |

### **Provider Types:**

| Type | Systems | Handler |
|------|---------|---------|
| `Commsys` | CA eSUN, TN TIES, AZ AZDPS, HI DIT | `CommsysTransactionRequestHandler` |
| `Boomi` | (Various integrations) | `BoomiRequestHandler` |
| `RMS` | Internal RMS | `RmsRestRequestHandler` |
| `RecordsArchive` | Records Archive | `RecordsArchiveRestPayloadHandler` |

---

## Example: Mapping DEX Validation Tool to Production JSON

### **Your Validation Tool Configuration:**

```javascript
// vehicle-registration.html
const querySpecs = {
    'vehicle-registration': {
        name: 'Vehicle Registration Query',
        combinations: [
            {
                id: 1,
                description: '(In) LicensePlateNumber only',
                fields: ['licensePlateNumber'],
                optionalFields: [],
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
            {
                id: 5,
                description: '(In) VehicleIdentificationNumber only',
                fields: ['vehicleIdentificationNumber'],
                optionalFields: [],
                state: 'in-state',
                keyReference: 'QV'
            }
        ]
    }
};

const fieldDefinitions = {
    licensePlateNumber: {
        label: 'License Plate Number',
        type: 'text',
        maxLength: 10,
        hint: 'Enter license plate number'
    },
    licensePlateTypeCode: {
        label: 'License Plate Type Code',
        type: 'select',
        options: 'licenseplatetypecodes.csv'
    },
    state: {
        label: 'State',
        type: 'select',
        maxLength: 2,
        options: 'statecodes.csv',
        hint: 'Two-letter state code (omit for CA in-state)'
    }
};
```

### **Converts to Production JSON:**

```json
{
  "id": "2lq4ngg",
  "version": 1,
  "name": "CA_eSUN_VehicleRegistrationQuery",
  "description": "Mapping for VehicleRegistrationQuery in CA eSUN",
  "type": "QUERYINPUTDATAMAPPING",
  "provider": "CA_eSUN",
  "providerType": "Commsys",
  "query": "VehicleRegistrationQuery",
  "targetEntity": "Vehicle",
  "handlerFunction": "CommsysTransactionRequestHandler",

  "attributes": [
    {
      "name": "LicensePlateNumber",
      "sourceField": ["LicensePlateNumber"],
      "targetField": "licensePlateNumber",
      "size": 10
    },
    {
      "name": "LicensePlateTypeCode",
      "sourceField": ["LicensePlateTypeCode"],
      "targetField": "licensePlateTypeCode",
      "size": 2
    },
    {
      "name": "LicensePlateYear",
      "sourceField": ["LicensePlateYear"],
      "targetField": "licensePlateYear",
      "size": 4
    },
    {
      "name": "State",
      "sourceField": ["State"],
      "targetField": "state",
      "size": 2
    },
    {
      "name": "VehicleIdentificationNumber",
      "sourceField": ["VehicleIdentificationNumber"],
      "targetField": "vehicleIdentificationNumber",
      "size": 30
    }
  ],

  "combinations": [
    {
      "keyReference": "LicensePlateNumber",
      "primaryFieldReference": "LicensePlateNumber",
      "requirements": {
        "set": ["LicensePlateNumber"],
        "any": []
      }
    },
    {
      "keyReference": "LicensePlateNumberLicensePlateTypeCodeLicensePlateYear",
      "primaryFieldReference": "LicensePlateNumber",
      "requirements": {
        "set": ["LicensePlateNumber", "LicensePlateTypeCode", "LicensePlateYear"],
        "any": ["State"]
      }
    },
    {
      "keyReference": "VehicleIdentificationNumber",
      "primaryFieldReference": "VehicleIdentificationNumber",
      "requirements": {
        "set": ["VehicleIdentificationNumber"],
        "any": []
      }
    }
  ]
}
```

### **Conversion Rules:**

1. **Combination ID** → Not used in production (use `keyReference` instead)
2. **`fields` array** → `requirements.set` (ALL required)
3. **`optionalFields` array** → `requirements.any` (AT LEAST ONE required)
4. **`state: 'in-state'`** → Handler logic (not in JSON)
5. **`fieldDefinitions[].label`** → `attributes[].name` (XML element name)
6. **`fieldDefinitions[].maxLength`** → `attributes[].size`
7. **`querySpecs.name`** → `name` field (with provider prefix)

---

## Summary: Complete Understanding

### **✅ CONFIRMED:**

1. **JSON templates ARE version controlled in GitHub**
   - Location: `federated-search/api/src/main/resources/configurations/`
   - Modified via PRs (e.g., #1212)
   - Deployed to DynamoDB via CI/CD

2. **JSON controls BOTH form fields AND XML output**
   - Via different configuration types in same bundle
   - `QUERYINPUTFORM` → Form fields (when used)
   - `QUERYINPUTDATAMAPPING` → XML output

3. **Three-tier structure:**
   - Bundle → Groups configurations by provider
   - Configuration → Specific config type (auth, mapping, results)
   - Attributes/Combinations → Field-level details

4. **Handler functions generate XML**
   - Different handlers for different provider types
   - Handlers read configuration JSON at runtime
   - Apply provider-specific transformation logic

### **Key Relationships:**

```
GitHub JSON File
    ↓ (Deployed via CI/CD)
DynamoDB Configuration
    ↓ (Loaded at runtime)
Handler Function (Java)
    ↓ (Generates XML)
External System (CA eSUN, TN TIES, etc.)
```

### **For DEX Validation Tool Enhancement:**

Now you can:
1. ✅ Read production JSON from GitHub
2. ✅ Understand exact structure needed
3. ✅ Map validation tool specs to production format
4. ✅ Generate compatible JSON for import
5. ✅ Validate XML matches expected format

The validation tool's `querySpecs` and `fieldDefinitions` map directly to the `attributes` and `combinations` in production JSON!

---

## Next Steps

1. **Compare validation tool XML with production XML**
   - Test same query in both systems
   - Verify XML output matches exactly

2. **Create conversion utility**
   - Convert validation tool format → production JSON format
   - Handle provider-specific differences

3. **Test JSON generation**
   - Generate JSON from validation tool
   - Import to test tenant
   - Execute queries and compare results

4. **Document provider differences**
   - CA eSUN state handling
   - TN TIES field requirements
   - AZ AZDPS specific fields

---

**Document Version**: 1.0
**Last Updated**: February 24, 2026
**Next Review**: After XML comparison testing
