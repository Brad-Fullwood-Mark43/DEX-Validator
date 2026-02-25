# Quick Start: Implementing JSON Export

This is a streamlined guide to get started quickly with implementing the JSON export functionality.

## TL;DR - What We're Building

**Goal**: Add a button to each query page that exports the current query specifications as a JSON file that can be imported into RMS Federated Search configuration.

**Result**: Instead of manually configuring Federated Search through the UI, you can:
1. Use DEX Validation Tool to design and test queries
2. Click "Export Configuration JSON"
3. Import the JSON file into RMS
4. Queries work immediately in production

---

## Quick Start (30 Minutes)

### Step 1: Create the JSON Mapper (10 min)

Create `public/js/json-mapper.js`:

```javascript
class DepartmentBundleMapper {
    generateBundle(querySpecs, fieldDefinitions, providerId = 'CA_ESUN') {
        return {
            departmentId: 'PLACEHOLDER_DEPT_ID', // User will need to change this
            version: 1,
            bundles: [{
                id: this.generateULID(),
                name: `${providerId}_${Object.keys(querySpecs)[0].toUpperCase()}`,
                version: 1,
                configurations: Object.entries(querySpecs).map(([type, spec]) =>
                    this.mapConfiguration(type, spec, fieldDefinitions)
                )
            }],
            providers: [this.generateProvider(providerId)]
        };
    }

    mapConfiguration(queryType, querySpec, fieldDefinitions) {
        return {
            id: this.generateULID(),
            name: querySpec.name,
            version: 1,
            configurationType: 'QUERY_FORM',
            data: {
                queryType: this.mapQueryType(queryType),
                messageType: querySpec.name.replace(/ /g, ''),
                fieldCombinations: querySpec.combinations.map(combo => ({
                    id: combo.id,
                    description: combo.description,
                    requiredFields: combo.fields || [],
                    optionalFields: combo.optionalFields || [],
                    state: combo.state || 'both',
                    messageKeyReference: combo.keyReference
                })),
                fieldMappings: this.mapFieldDefinitions(fieldDefinitions),
                xmlGeneration: {
                    wrapperElement: 'Request',
                    messageTypeField: 'MessageType',
                    idField: 'Id',
                    fieldOrder: this.getFieldOrder(queryType)
                }
            }
        };
    }

    mapFieldDefinitions(fieldDefinitions) {
        const mappings = {};

        for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
            mappings[fieldName] = {
                xmlFieldName: this.toXmlFieldName(fieldName),
                fieldType: definition.type === 'select' ? 'enum' : 'string',
                maxLength: definition.maxLength || null,
                required: definition.required || false,
                validationRules: this.getValidationRules(fieldName, definition)
            };
        }

        return mappings;
    }

    toXmlFieldName(fieldName) {
        // Convert camelCase to PascalCase
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }

    getValidationRules(fieldName, definition) {
        const rules = [];

        if (fieldName === 'purposeCode') rules.push('AB_1747_REQUIRED');
        if (fieldName === 'state') rules.push('OMIT_FOR_IN_STATE_CA');
        if (fieldName === 'name') rules.push('FORMAT_LAST_FIRST_MIDDLE');
        if (fieldName === 'birthDate') rules.push('DATE_FORMAT_YYYY_MM_DD');
        if (fieldName === 'vehicleIdentificationNumber') rules.push('VIN_FORMAT');

        return rules;
    }

    getFieldOrder(queryType) {
        // Standard field order for CA eSUN
        return [
            'purposeCode',
            'name',
            'addressStreetNumber',
            'addressCity',
            'birthDate',
            'sexCode',
            'operatorLicenseNumber',
            'state',
            'licensePlateNumber',
            'licensePlateTypeCode',
            'licensePlateYear',
            'vehicleIdentificationNumber',
            'vehicleMakeCode',
            'vehicleYear',
            'articleSerialNumber',
            'articleTypeCode',
            'articleCategory',
            'articleBrand'
        ];
    }

    mapQueryType(internalType) {
        const mapping = {
            'vehicle-registration': 'VEHICLE_REGISTRATION_INQUIRY',
            'driver-license': 'PERSON_INQUIRY',
            'driver-history': 'DRIVER_HISTORY_INQUIRY',
            'article-query': 'SINGLE_ARTICLE_INQUIRY'
        };
        return mapping[internalType] || internalType.toUpperCase();
    }

    generateProvider(providerId) {
        return {
            providerId: providerId,
            providerName: 'California eSUN',
            providerType: 'CONNECTCIC',
            region: 'CA_CLETS',
            authenticationRequired: true,
            authenticationFields: ['ori', 'deviceId', 'stateUserId'],
            supportedQueries: [
                'VEHICLE_REGISTRATION_INQUIRY',
                'PERSON_INQUIRY',
                'DRIVER_LICENSE_INQUIRY',
                'DRIVER_HISTORY_INQUIRY',
                'FIREARM_INQUIRY',
                'SINGLE_ARTICLE_INQUIRY'
            ],
            defaultStateCode: 'CA'
        };
    }

    generateULID() {
        // Simple ULID-like generator (for now)
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        return `01${timestamp}${random}`.toUpperCase().padEnd(26, '0');
    }
}
```

### Step 2: Add Export Button (5 min)

In each query HTML file (e.g., `vehicle-registration.html`), add this after the validation results section:

```html
<!-- Add this in the validation results container -->
<div id="export-section" style="margin-top: 20px; display: none;">
    <button id="export-json-btn" class="btn btn-primary">
        📥 Export Configuration JSON
    </button>
    <div id="json-preview" style="margin-top: 10px; display: none;">
        <h4>Configuration Preview</h4>
        <pre id="json-output" style="background: #f5f5f5; padding: 15px; border-radius: 4px; max-height: 400px; overflow: auto;"></pre>
    </div>
</div>
```

### Step 3: Add Export Logic (10 min)

Add this JavaScript at the bottom of each query HTML file:

```javascript
// Include the mapper
const mapper = new DepartmentBundleMapper();

// Show export section when validation is successful
function displayResults(results) {
    // ... existing validation display code ...

    // Show export button if valid
    if (results.valid) {
        document.getElementById('export-section').style.display = 'block';
    } else {
        document.getElementById('export-section').style.display = 'none';
    }
}

// Export button handler
document.getElementById('export-json-btn').addEventListener('click', function() {
    try {
        // Generate the configuration
        const bundle = mapper.generateBundle(querySpecs, fieldDefinitions, 'CA_ESUN');

        // Show preview
        const jsonOutput = document.getElementById('json-output');
        const jsonPreview = document.getElementById('json-preview');

        jsonOutput.textContent = JSON.stringify(bundle, null, 2);
        jsonPreview.style.display = 'block';

        // Download the file
        downloadJSON(bundle, `ca-esun-${currentQueryType}-config.json`);

    } catch (error) {
        alert('Error generating configuration: ' + error.message);
        console.error(error);
    }
});

function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

### Step 4: Test It (5 min)

1. Open `vehicle-registration.html` in browser
2. Fill in a valid query (e.g., license plate only)
3. Click "Validate Query"
4. If valid, "Export Configuration JSON" button appears
5. Click the button
6. JSON file downloads and preview shows
7. Verify JSON structure looks correct

---

## Testing the Import

### Local Testing

1. **Get a JWT token** from your RMS instance:
   ```bash
   # Login to RMS and grab token from DevTools > Application > Cookies
   ```

2. **Test the import**:
   ```bash
   curl -X POST \
     'http://localhost:8080/federated-search/api/v2/admin/departmentConfiguration/import/YOUR_DEPT_ID' \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
     -H 'Content-Type: application/json' \
     -d @ca-esun-vehicle-registration-config.json
   ```

3. **Validate the configuration**:
   ```bash
   curl -X GET \
     'http://localhost:8080/federated-search/api/v2/admin/departmentConfiguration/validate/YOUR_DEPT_ID' \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN'
   ```

### Using RMS UI

1. Login to RMS as admin
2. Navigate to: **Admin → Application Settings → Federated Search Settings**
3. Look for configuration import/export functionality
4. Upload your generated JSON file
5. Validate and save

---

## Files to Modify

```
DEX Validation Tool/
├── public/
│   ├── js/
│   │   └── json-mapper.js          ← CREATE THIS
│   ├── vehicle-registration.html   ← ADD EXPORT BUTTON & LOGIC
│   ├── driver-license.html         ← ADD EXPORT BUTTON & LOGIC
│   ├── driver-history.html         ← ADD EXPORT BUTTON & LOGIC
│   └── article-query.html          ← ADD EXPORT BUTTON & LOGIC
└── FEDERATED_SEARCH_INTEGRATION.md ← REFERENCE THIS
```

---

## Common Gotchas

### 1. Field Name Mapping

**Problem**: Internal field names don't match XML field names

**Solution**: The mapper uses `toXmlFieldName()` to convert:
- `licensePlateNumber` → `LicensePlateNumber`
- `birthDate` → `BirthDate`
- etc.

### 2. State Field Handling

**Problem**: State field included when it shouldn't be

**Solution**: The validation rule `OMIT_FOR_IN_STATE_CA` tells Federated Search to exclude the state field for in-state queries, just like the validation tool does.

### 3. Department ID

**Problem**: Generated JSON has placeholder department ID

**Solution**: User must edit the JSON before import or the import API will return error. Consider adding a prompt for department ID before export.

### 4. ULID Generation

**Problem**: Simple ULID generator might create duplicates

**Solution**: For production, use a proper ULID library. Current implementation is good enough for initial testing.

---

## Next Steps After Basic Implementation

1. **Add department ID input**: Prompt user for department ID before export
2. **Add multi-query support**: Export all query types in one bundle
3. **Add provider selection**: Let user choose provider (CA eSUN, AZ ACJIS, etc.)
4. **Add configuration validation**: Validate JSON before download
5. **Add import testing**: Create Node.js script to test imports

See `FEDERATED_SEARCH_INTEGRATION.md` for full implementation details.

---

## Getting Help

**Full Documentation**: `FEDERATED_SEARCH_INTEGRATION.md` (same directory)

**Key Sections to Reference**:
- JSON Schema Details (Section: "JSON Configuration Structure")
- Field Mapping Reference (Section: "Field Mapping Reference")
- API Endpoints (Section: "API Endpoints Reference")
- Troubleshooting (Section: "Troubleshooting Guide")

**When Stuck**:
1. Check the example JSON in the full documentation
2. Export existing configuration from RMS to see working example
3. Compare your generated JSON with the example

---

**Ready to implement?** Start with Step 1 and you'll have working JSON export in 30 minutes!
