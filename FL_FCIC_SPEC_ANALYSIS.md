# FL FCIC Specification Analysis

## Source Files
- `/Users/brad.fullwood/Desktop/FL_FCIC.xml` - FL FCIC Interface Schema
- `/Users/brad.fullwood/Desktop/ApiInterfaceSchema.xsd` - XSD Schema Definition

## Vehicle Registration Query Analysis

### Field Definitions from Spec

| Field Name | Type | Max Length | Validation Rules |
|------------|------|------------|------------------|
| DecalNumber | Alphanumeric | 10 | Single zero, run of zeros, single alphabetic, run of alphabetic prohibited |
| ImageIndicator | Alphabetic | 1 | Must be 'Y' or 'N'. Default: 'N'. Inquiry only |
| LicensePlateNumber | Alphanumeric | 10 | 'UNK', 'UNKN', 'UNKNOWN' prohibited. >8 chars: last 8 → LIC, full → MIS |
| LicensePlateTypeCode | Alphanumeric | 2 | Valid code from part 8 of code manual |
| LicensePlateYear | Year | 4 | 'NX' OR ≥ current year (CCYY). 'NX' for non-expiring |
| RelatedHitSearchIndicator | Alphabetic | 1 | Must be 'Y' or 'N' |
| Requestor | Alphanumeric | 30 | Attention field |
| State | Alphanumeric | 2 | Identifying state |
| State2-5 | Alphanumeric | 2 | Additional state fields |
| TitleLienInformation | Alphanumeric | 8 | Title lien information |
| VehicleIdentificationNumber | Alphanumeric | 20 | Validate length/type. Single zero, run of zeros, etc. prohibited |
| VehicleMakeCode | Alphanumeric | 24 | First 4 chars = valid code. Spaces in pos 3/4 if <4 chars and pos 5 has data |
| VehicleYear | Year | 4 | ≤ current year + 1 |
| VINSequenceNumber | Alphanumeric | 2 | VIN sequence number |

### Valid Combinations from Spec

#### Combination 1: FRQ + DecalNumber
- **Key Reference**: FRQ
- **Primary Field**: DecalNumber
- **Requirements**:
  - REQUIRED: DecalNumber, LicensePlateYear
  - OPTIONAL (Any): Requestor, ImageIndicator

#### Combination 2: FRQ + LicensePlateNumber
- **Key Reference**: FRQ
- **Primary Field**: LicensePlateNumber
- **Requirements**:
  - REQUIRED: LicensePlateNumber
  - OPTIONAL (Any): LicensePlateYear, Requestor, ImageIndicator

#### Combination 3: FRQ + TitleLienInformation
- **Key Reference**: FRQ
- **Primary Field**: TitleLienInformation
- **Requirements**:
  - REQUIRED: TitleLienInformation
  - OPTIONAL (Any): Requestor, ImageIndicator

#### Combination 4: FRQ + VehicleIdentificationNumber
- **Key Reference**: FRQ
- **Primary Field**: VehicleIdentificationNumber
- **Requirements**:
  - REQUIRED: VehicleIdentificationNumber
  - OPTIONAL (Any): Requestor, VINSequenceNumber, ImageIndicator

#### Combination 5: QV + LicensePlateNumber
- **Key Reference**: QV
- **Primary Field**: LicensePlateNumber
- **Requirements**:
  - REQUIRED: LicensePlateNumber
  - OPTIONAL (Any): ImageIndicator, RelatedHitSearchIndicator, Requestor, State

#### Combination 6: QV + VehicleIdentificationNumber
- **Key Reference**: QV
- **Primary Field**: VehicleIdentificationNumber
- **Requirements**:
  - REQUIRED: VehicleIdentificationNumber
  - OPTIONAL (Any): ImageIndicator, RelatedHitSearchIndicator, Requestor, VINSequenceNumber

## Current Implementation Issues

### ❌ Missing Fields
- `RelatedHitSearchIndicator` - Required for QV combinations
- `Requestor` - Optional attention field
- `State` - For out-of-state queries
- `State2`, `State3`, `State4`, `State5` - Multi-state queries
- `TitleLienInformation` - Title/lien queries
- `VINSequenceNumber` - VIN sequence tracking
- `LicensePlateTypeCode` - Plate type validation
- `VehicleMakeCode` - Vehicle make
- `VehicleYear` - Vehicle year

### ❌ Missing Combinations
- Combination 3: FRQ + TitleLienInformation
- Combination 5: QV + LicensePlateNumber (different from FRQ)
- Combination 6: QV + VehicleIdentificationNumber (different from FRQ)

### ❌ Incorrect Combination Descriptions
Current implementation shows:
1. DecalNumber + LicensePlateYear ✓ (Correct)
2. LicensePlateNumber only ⚠️ (Partially correct - should allow optional fields)
3. VehicleIdentificationNumber only ⚠️ (Partially correct - missing optional fields)
4. LicensePlateNumber + LicensePlateYear ⚠️ (This is optional in combo #2, not separate combo)

## XML Generation Requirements

Based on ConnectCIC spec, the XML should follow this format:

```xml
<Request>
  <MessageType>VehicleRegistrationQuery</MessageType>
  <Id>MARK43GENERATEDMSGID</Id>
  <LicensePlateNumber>ABC123</LicensePlateNumber>
  <LicensePlateYear>2024</LicensePlateYear>
  <ImageIndicator>N</ImageIndicator>
</Request>
```

### Field Order
The XML field order should match the ConnectCIC specification. Based on common patterns:
1. MessageType
2. Id
3. Query fields in logical order (Plate info, VIN info, etc.)
4. Optional fields (ImageIndicator, Requestor, etc.)

## Action Items

### 1. Update FL_FCIC Connector Configuration (`js/connectors.js`)
- [ ] Add all missing fields to `fieldDefinitions`
- [ ] Update `querySpecs['vehicle-registration'].combinations` with all 6 combinations
- [ ] Ensure proper required/optional field handling
- [ ] Update XML generation function with correct field order

### 2. Update FL_FCIC Vehicle Registration Page (`fl-fcic/vehicle-registration.html`)
- [ ] Add all field inputs dynamically from connector config
- [ ] Update validation logic to handle all 6 combinations
- [ ] Display correct combination descriptions
- [ ] Test XML generation against spec

### 3. Driver License Query
- [ ] Extract DriverLicenseQuery spec from FL_FCIC.xml
- [ ] Analyze combinations and field requirements
- [ ] Update connector configuration
- [ ] Update driver-license.html page

### 4. JSON Configuration Validator
- [ ] Build validator to check JSON export against spec
- [ ] Ensure field mappings are correct
- [ ] Validate combination requirements
- [ ] Test import into tenant

## Notes

- **KeyReference FRQ**: Florida Registration Query (DHSMV/DMVR systems)
- **KeyReference QV**: Query Vehicle (FCIC/NCIC systems, includes stolen/wanted checks)
- The difference between FRQ and QV is the geoscope and systems queried
- FRQ is "Global" geoscope (queries all systems)
- QV has mixed geoscope ("Current" for FCIC, "Global" for NCIC/NLETS)

## Priority

1. ✅ HIGH - Fix Vehicle Registration combinations and fields
2. ⬜ HIGH - Add all missing fields
3. ⬜ MEDIUM - Fix Driver License query
4. ⬜ MEDIUM - Add JSON validator
5. ⬜ LOW - Add other query types (if needed)
