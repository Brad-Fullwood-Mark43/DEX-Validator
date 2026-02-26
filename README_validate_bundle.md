# Bundle Configuration Validator

A Python script to validate Federated Search bundle JSON files against backend validation rules before uploading.

## Installation

No installation needed! Just requires Python 3 (already installed on your system).

## Usage

```bash
python3 validate_bundle.py <path_to_bundle.json>
```

### Examples

```bash
# Validate FL FCIC bundle
python3 validate_bundle.py ~/Developer/federated-search/api/src/main/resources/configurations/FL_FCIC.json

# Validate a file in Downloads
python3 validate_bundle.py ~/Downloads/CA_eSun.json

# Validate and save output to file
python3 validate_bundle.py bundle.json > validation_report.txt
```

## What It Checks

### Structure Validation
- ✅ Has `bundles` array (DepartmentBundle format)
- ✅ Each bundle has required fields: `name`, `type`, `configurations`
- ✅ Bundle type is `BUNDLE` (not `PROVIDER`)
- ✅ Configurations array is present

### Query Mapping Validation (QUERYINPUTDATAMAPPING)
- ✅ No empty combinations (all must have `set` or `any` requirements)
- ✅ No invalid attributes (all must have `name`, `targetField`, `sourceField`)
- ✅ No missing attributes (fields in combinations must exist in attributes)
- ✅ No duplicate keyReferences (each keyReference must be unique per config)

### Form Validation (QUERYINPUTFORM)
- ✅ No `id` or `version` fields (forms don't have these)
- ✅ Has required fields: `name`, `type`, `layout`
- ✅ Layout is an object (not string)
- ⚠️  Layout keys should be lowercase (`default` not `DEFAULT`)
- ⚠️  FormSelect with object options may cause parsing errors

## Exit Codes

- `0` - All validations passed
- `1` - Validation errors found

Use in scripts:
```bash
if python3 validate_bundle.py bundle.json; then
    echo "Valid! Uploading..."
    # upload logic here
else
    echo "Invalid bundle. Fix errors first."
    exit 1
fi
```

## Output Example

```
✅ Loaded file: FL_FCIC.json

=== Validating Structure ===
✅ Has 'bundles' array with 2 bundle(s)

--- Bundle 0: ENTITIES ---
✅ Has field: name
✅ Has field: type
✅ Has field: configurations
✅ Bundle type is 'BUNDLE'
✅ Has 6 configuration(s)

--- Bundle 1: FL_FCIC ---
✅ Has field: name
✅ Has field: type
✅ Has field: configurations
✅ Bundle type is 'BUNDLE'
✅ Has 8 configuration(s)

=== Validating Query Mappings ===

Bundle 1: Validating 6 query mapping(s)
  ✅ FL_FCIC_DriverLicenseQuery: 2 combination(s), all validations pass
  ✅ FL_FCIC_DriverHistoryQuery: 1 combination(s), all validations pass
  ✅ FL_FCIC_VehicleRegistrationQuery: 2 combination(s), all validations pass
  ✅ FL_FCIC_BoatQuery: 3 combination(s), all validations pass
  ✅ FL_FCIC_ArticleSingleQuery: 1 combination(s), all validations pass
  ✅ FL_FCIC_WantedPersonQuery: 1 combination(s), all validations pass

=== Validating Forms ===

Bundle 0: Validating 6 form(s)
  ✅ ENTITY_Person_DriverLicense: All validations pass
  ✅ ENTITY_Person_DriverHistory: All validations pass
  ✅ ENTITY_Vehicle: All validations pass
  ✅ ENTITY_Boat: All validations pass
  ✅ ENTITY_Article: All validations pass
  ✅ ENTITY_Person_Wanted: All validations pass

============================================================
VALIDATION SUMMARY
============================================================

File: FL_FCIC.json
Bundles: 2

Configuration Types:
  AUTHENTICATION: 1
  QUERYINPUTDATAMAPPING: 6
  QUERYINPUTFORM: 6
  QUERYMESSAGEFORMAT: 1

Errors: 0

Warnings: 0

🎉 All validations passed! Bundle is ready to import.
============================================================
```

## Common Errors and Fixes

### Error: "Missing 'bundles' key"
**Problem:** File has `{"configurations": [...]}` instead of `{"bundles": [...]}`

**Fix:**
```python
# Wrap in bundles array
{
  "bundles": [
    {
      "name": "YOUR_BUNDLE",
      "type": "BUNDLE",
      "provider": "YOUR_PROVIDER",
      "configurations": [...]
    }
  ]
}
```

### Error: "Duplicate keyReferences"
**Problem:** Multiple combinations have same keyReference value

**Fix:** Each keyReference must appear only once per configuration. Remove duplicates.

### Error: "Missing attributes"
**Problem:** Combination requirements reference fields not in attributes array

**Fix:** Add missing attributes or remove them from requirements.

### Warning: "FormSelect with object options"
**Problem:** FormSelect has `options: [{label: "X", value: "Y"}]` which may cause parsing errors

**Fix:** Convert to FormInput with maxLength instead:
```json
{
  "type": {"resolvedName": "FormInput"},
  "props": {
    "fieldId": "FieldName",
    "label": "Label",
    "maxLength": "1"
  }
}
```

## Related Files

- Source: `/Users/brad.fullwood/Developer/federated-search/api/src/main/java/com/mark43/fs/services/ConfigService.java` - Backend validation logic
- Test bundles: `/Users/brad.fullwood/Developer/federated-search/api/src/main/resources/configurations/`

## Support

For issues or questions, check the Federated Search CLAUDE.md or backend validation code in ConfigService.java.
