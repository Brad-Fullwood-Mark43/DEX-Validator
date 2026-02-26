# Quick Start: Bundle Validation

## One-Line Validation

```bash
cd ~/Developer && python3 validate_bundle.py <path_to_bundle>
```

## Common Commands

```bash
# Validate FL FCIC bundle
python3 validate_bundle.py ~/Developer/federated-search/api/src/main/resources/configurations/FL_FCIC.json

# Validate file in Downloads
python3 validate_bundle.py ~/Downloads/bundle.json

# Validate and save report
python3 validate_bundle.py bundle.json > report.txt
```

## What Gets Checked

✅ DepartmentBundle structure with `bundles` array  
✅ No duplicate keyReferences in query mappings  
✅ No missing or invalid attributes  
✅ No empty combinations  
✅ Forms don't have `id` or `version` fields  
✅ Bundle type is `BUNDLE` not `PROVIDER`  

## Quick Fixes for Common Errors

### "Missing 'bundles' key"
Wrap your configuration in bundles array:
```json
{"bundles": [{"name": "X", "type": "BUNDLE", "provider": "X", "configurations": [...]}]}
```

### "Duplicate keyReferences"
Each keyReference can only appear once per configuration. Remove duplicates.

### "Unknown ConfigurationType: PROVIDER"
Change bundle `type` from `"PROVIDER"` to `"BUNDLE"`

### "FormSelect with object options"
Convert FormSelect to FormInput to avoid parsing errors.

## See Full Documentation

Read `README_validate_bundle.md` for complete details and examples.
