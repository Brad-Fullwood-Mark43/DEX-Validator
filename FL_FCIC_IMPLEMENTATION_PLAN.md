# FL FCIC Implementation Plan

## Status: In Progress

### Completed ✅
1. **Connector Configuration** (`public/js/connectors.js`)
   - ✅ All 27 field definitions from spec (Vehicle + Driver License)
   - ✅ All 6 VehicleRegistrationQuery combinations with correct requirements
   - ✅ All 4 DriverLicenseQuery combinations with correct requirements
   - ✅ Proper validation rules (prohibited values, patterns)
   - ✅ XML generation function with correct field order
   - ✅ Documentation and descriptions from spec

### Next Steps

#### Phase 1: Vehicle Registration Page (Current)
**File:** `public/fl-fcic/vehicle-registration.html`

**Requirements:**
1. Dynamic form generation from connector fieldDefinitions
2. Display all 6 combinations with proper grouping:
   - FRQ combinations (1-4): Florida Registration Queries
   - QV combinations (5-6): Query Vehicle with stolen/wanted checks
3. Real-time validation as user types
4. Field-level validation:
   - DecalNumber: Prohibit single zero, run of zeros, single/run of alphabetic
   - LicensePlateNumber: Prohibit UNK, UNKN, UNKNOWN
   - VIN: Prohibit single zero, run of zeros, single/run of alphabetic
   - OperatorLicenseNumber: Prohibit single zero, run of zeros
   - LicensePlateYear: Accept CCYY (≥ current year) or 'NX'
5. Combination matching algorithm:
   - Check all required fields present
   - Check no prohibited fields present
   - Allow optional fields
   - Show which combination matched
6. XML preview with proper formatting
7. Copy XML to clipboard functionality
8. Clear visual distinction between FRQ and QV query types

**UI Components:**
- Collapsible field sections (organize by type)
- Combination cards (clickable to highlight required fields)
- Validation feedback (real-time, per-field)
- Results panel (validation status + XML output)
- Help tooltips (show spec descriptions)

#### Phase 2: Driver License Page
**File:** `public/fl-fcic/driver-license.html`

**Requirements:**
1. All 4 combinations properly handled
2. Field-level validation
3. Combination matching
4. XML generation and preview

#### Phase 3: Testing & Validation
1. Test each combination individually
2. Test edge cases (prohibited values, patterns)
3. Test optional field handling
4. Verify XML output matches spec
5. Test validation error messages

#### Phase 4: JSON Configuration Validator
**File:** `public/fl-fcic/json-validator.html`

**Purpose:**
- Validate generated JSON configurations before tenant upload
- Check field mappings are correct
- Verify combination requirements match spec
- Test import compatibility

## Technical Details

### Validation Algorithm

```javascript
function validateQuery(formData, connector, queryType) {
    // 1. Get filled fields (excluding empty values)
    const filledFields = Object.keys(formData).filter(k => formData[k]);

    // 2. Run field-level validations
    const fieldErrors = [];
    for (const [fieldName, value] of Object.entries(formData)) {
        const fieldDef = connector.fieldDefinitions[fieldName];
        if (!fieldDef || !value) continue;

        // Check prohibited values
        if (fieldDef.validation?.prohibitedValues) {
            if (fieldDef.validation.prohibitedValues.includes(value.toUpperCase())) {
                fieldErrors.push(`${fieldDef.label}: Value "${value}" is prohibited`);
            }
        }

        // Check prohibited patterns
        if (fieldDef.validation?.prohibitedPatterns) {
            for (const pattern of fieldDef.validation.prohibitedPatterns) {
                if (pattern.test(value)) {
                    fieldErrors.push(`${fieldDef.label}: Value "${value}" matches prohibited pattern`);
                }
            }
        }
    }

    // 3. Find matching combination
    let matchedCombination = null;
    const querySpec = connector.querySpecs[queryType];

    for (const combo of querySpec.combinations) {
        const requiredFields = combo.fields || [];
        const optionalFields = combo.optionalFields || [];

        // Check all required fields present
        const hasAllRequired = requiredFields.every(f => filledFields.includes(f));
        if (!hasAllRequired) continue;

        // Check no extra fields (beyond required + optional)
        const allowedFields = [...requiredFields, ...optionalFields];
        const extraFields = filledFields.filter(f => !allowedFields.includes(f));
        if (extraFields.length > 0) continue;

        // Match found!
        matchedCombination = combo;
        break;
    }

    return {
        valid: fieldErrors.length === 0 && matchedCombination !== null,
        fieldErrors,
        matchedCombination,
        filledFields
    };
}
```

### XML Generation

The XML must follow this exact structure per ConnectCIC spec:

```xml
<Request>
  <MessageType>VehicleRegistrationQuery</MessageType>
  <Id>MARK43GENERATEDMSGID</Id>
  <!-- Person fields (if applicable) -->
  <Name>DOE, JOHN MIDDLE</Name>
  <BirthDate>19800101</BirthDate>
  <SexCode>M</SexCode>
  <!-- Vehicle fields -->
  <LicensePlateNumber>ABC123</LicensePlateNumber>
  <LicensePlateYear>2024</LicensePlateYear>
  <!-- Optional fields -->
  <ImageIndicator>N</ImageIndicator>
</Request>
```

## Key Differences Between Query Types

### FRQ (Florida Registration Query)
- **Purpose**: Query FL DHSMV/DMVR registration systems
- **Geoscope**: Global
- **Systems Queried**: DHSMV, DMVR, FCIC, NCIC, DCF, Nlets
- **Use Case**: Registration information lookup

### QV (Query Vehicle)
- **Purpose**: Query with stolen/wanted checks
- **Geoscope**: Mixed (Current for FCIC, Global for NCIC/NLETS)
- **Systems Queried**: FCIC, NCIC (with hits), DHSMV, DMVR, DCF, Nlets
- **Use Case**: Registration + stolen/wanted/felony checks
- **Key Fields**: RelatedHitSearchIndicator, State

### FDQ (Florida Driver Query)
- **Purpose**: Query FL DHSMV driver license/ID
- **Systems Queried**: DHSMV, DMVR, FCIC, NCIC, DCF, Nlets

### QW (Query Wanted)
- **Purpose**: Query with wanted person checks
- **Systems Queried**: FCIC, NCIC (wanted/warrants), DHSMV, DMVR, DCF, Nlets
- **Key Fields**: ExpandedNameSearchCode, RelatedHitSearchIndicator

## File Structure

```
public/
├── fl-fcic/
│   ├── index.html                           ← Landing page
│   ├── vehicle-registration.html            ← NEW: Complete implementation
│   ├── vehicle-registration-v1-backup.html  ← OLD: Backup
│   ├── driver-license.html                  ← TODO: Complete implementation
│   ├── driver-license-v1-backup.html        ← OLD: Backup
│   └── json-validator.html                  ← TODO: New tool
├── js/
│   └── connectors.js                        ← ✅ COMPLETE
└── ca-esun/
    └── [untouched original files]
```

## Testing Checklist

### Vehicle Registration Query
- [ ] Combo 1: FRQ DecalNumber + LicensePlateYear
- [ ] Combo 2: FRQ LicensePlateNumber (+ optional LicensePlateYear)
- [ ] Combo 3: FRQ TitleLienInformation
- [ ] Combo 4: FRQ VehicleIdentificationNumber (+ optional VINSequenceNumber)
- [ ] Combo 5: QV LicensePlateNumber (+ optional State, RelatedHitSearchIndicator)
- [ ] Combo 6: QV VehicleIdentificationNumber (+ optional VINSequenceNumber)
- [ ] Validation: DecalNumber prohibited patterns
- [ ] Validation: LicensePlateNumber prohibited values (UNK, UNKN, UNKNOWN)
- [ ] Validation: VIN prohibited patterns
- [ ] Validation: LicensePlateYear (CCYY ≥ current year OR 'NX')
- [ ] XML generation: Correct field order
- [ ] XML generation: Correct field formatting (uppercase, date format)

### Driver License Query
- [ ] Combo 1: FDQ Name + BirthDate + SexCode
- [ ] Combo 2: FDQ OperatorLicenseNumber
- [ ] Combo 3: QW Name + BirthDate (+ optional ExpandedNameSearchCode)
- [ ] Combo 4: QW Name + OperatorLicenseNumber
- [ ] Validation: OperatorLicenseNumber prohibited patterns
- [ ] Validation: BirthDate prior to current date
- [ ] XML generation: Correct field order
- [ ] XML generation: Correct date formatting (CCYYMMDD)

## Next Immediate Action

Create production-quality `vehicle-registration.html` with:
1. Clean, professional UI matching FL FCIC branding (purple)
2. All fields from connector configuration
3. 6 combination cards with clear descriptions
4. Real-time validation with clear error messages
5. XML preview with syntax highlighting
6. Responsive design (mobile-friendly)
7. Accessibility features (ARIA labels, keyboard navigation)

**Estimated Size:** ~800-1000 lines of HTML/CSS/JavaScript
**Timeline:** Create complete, test thoroughly, then move to driver-license.html
