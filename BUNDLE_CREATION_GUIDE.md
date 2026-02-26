# Federated Search Bundle Creation Guide

This guide explains how to create configuration bundles for new ConnectCIC providers in the Federated Search system.

## Table of Contents
1. [Overview](#overview)
2. [Bundle Structure](#bundle-structure)
3. [Step-by-Step Creation Process](#step-by-step-creation-process)
4. [Validation Rules](#validation-rules)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Federated Search uses JSON configuration bundles to define how to query external data providers (like state criminal information centers). Each bundle contains:

- **Query Mappings** (QUERYINPUTDATAMAPPING) - Define fields and search combinations
- **Form Layouts** (QUERYINPUTFORM) - Define the UI forms users see
- **System Configs** (AUTHENTICATION, QUERYMESSAGEFORMAT) - Define auth and message formats

### Key Files

- **Configuration File**: `/api/src/main/resources/configurations/{PROVIDER}.json`
  - Contains full configuration with all details
  - Used for uploading through UI
  
- **Bundle Reference File**: `/api/src/main/resources/bundles/{PROVIDER}.json`
  - Contains just IDs and metadata (references only)
  - Used internally by application

---

## Bundle Structure

### DepartmentBundle Format

The configuration file must use this top-level structure:

```json
{
  "bundles": [
    {
      "name": "ENTITIES",
      "description": "Query forms of entities",
      "type": "BUNDLE",
      "provider": "MARK43",
      "configurations": [ /* QUERYINPUTFORM configs */ ]
    },
    {
      "name": "PROVIDER_NAME",
      "description": "Provider configuration for XYZ",
      "type": "BUNDLE",
      "provider": "PROVIDER_NAME",
      "configurations": [ /* Query mappings and system configs */ ]
    }
  ]
}
```

**Important**: 
- ✅ Use `"type": "BUNDLE"` (NOT "PROVIDER")
- ✅ Separate forms (ENTITIES bundle) from query mappings (provider bundle)
- ✅ Each bundle must have: `name`, `type`, `provider`, `configurations`

---

## Step-by-Step Creation Process

### Step 1: Gather Provider Documentation

You need:
- **XML specification** or API docs showing:
  - Available query types (transactions)
  - Field names and types
  - Required vs optional fields
  - Valid field combinations
  - Message keys (transaction codes)

### Step 2: Create System Configurations

#### 2.1 Authentication Configuration

```json
{
  "id": "PROVIDER_Authentication",
  "version": 1,
  "name": "PROVIDER_NAME",
  "description": "Authentication configuration",
  "type": "AUTHENTICATION",
  "attributes": [
    {
      "name": "ORI",
      "sourceField": ["ORI"],
      "targetField": "ORI",
      "size": 12,
      "description": "Originating Agency Identifier"
    }
  ],
  "combinations": [
    {
      "requirements": {
        "set": ["ORI"],
        "any": null
      }
    }
  ],
  "handlerFunction": "CommsysOriAuthenticationHandler",
  "provider": "PROVIDER_NAME"
}
```

#### 2.2 Query Message Format Configuration

```json
{
  "id": "PROVIDER_QueryMessageFormat",
  "version": 1,
  "name": "PROVIDER_QueryMessageFormat",
  "description": "Configuration for Query format",
  "type": "QUERYMESSAGEFORMAT",
  "handlerFunction": "CommsysWsiOutgoingMessageHandler",
  "authenticationParent": "Request",
  "payloadParent": "Request"
}
```

### Step 3: Create Query Input Data Mappings

For each query type (e.g., DriverLicenseQuery, VehicleQuery):

```json
{
  "id": "PROVIDER_QueryName",
  "version": 1,
  "name": "PROVIDER_QueryName",
  "description": "Mapping for QueryName",
  "type": "QUERYINPUTDATAMAPPING",
  "attributes": [
    {
      "name": "FieldName",
      "sourceField": ["FieldName"],
      "targetField": "fieldName",
      "size": 20,
      "description": "Field description from docs"
    }
  ],
  "combinations": [
    {
      "keyReference": "MESSAGE_KEY",
      "primaryFieldReference": "PrimaryFieldName",
      "requirements": {
        "set": ["RequiredField1", "RequiredField2"],
        "any": ["OptionalField1", "OptionalField2"]
      }
    }
  ],
  "handlerFunction": "CommsysTransactionRequestHandler",
  "targetEntity": "Person",
  "provider": "PROVIDER_NAME",
  "query": "QueryName",
  "providerType": "Commsys"
}
```

**Key Points**:
- Each `keyReference` must be **unique** within a configuration
- `primaryFieldReference` is the main search field for this combination
- `set` = required fields, `any` = optional fields (at least one required)
- `targetEntity` options: Person, Vehicle, Article, Boat, Firearm

### Step 4: Handle Composite Fields (Name Components)

If a field has components (e.g., Name = First + Last + Middle + Suffix):

**In QUERYINPUTDATAMAPPING**:
```json
{
  "name": "Name",
  "sourceField": ["Name", "NameLast", "NameFirst", "NameMiddle", "NameSuffix"],
  "targetField": "Name",
  "size": 80,
  "description": "Person name"
}
```

**In QUERYINPUTFORM** (see Step 5):
- Create separate inputs for each component
- Use fieldIds: `NameLast`, `NameFirst`, `NameMiddle`, `NameSuffix`

### Step 5: Create Query Input Forms

Forms define the UI that users see. Use CA eSun as a reference template.

#### Form Structure

```json
{
  "name": "ENTITY_{TargetEntity}_{QueryType}",
  "description": "Input query layout for XYZ queries",
  "label": "Display Label",
  "type": "QUERYINPUTFORM",
  "targetEntity": "Person",
  "layout": {
    "default": {
      "ROOT": {
        "type": {"resolvedName": "Root"},
        "displayName": "Root",
        "props": {},
        "isCanvas": false,
        "hidden": false,
        "nodes": ["FORM_ROOT"],
        "parent": null,
        "linkedNodes": {}
      },
      "FORM_ROOT": {
        "type": {"resolvedName": "Form"},
        "displayName": "Form",
        "props": {
          "hidePageItems": true,
          "layout": "page"
        },
        "isCanvas": true,
        "hidden": false,
        "nodes": ["ROOT_PAGE"],
        "parent": "ROOT",
        "linkedNodes": {}
      },
      "ROOT_PAGE": {
        "type": {"resolvedName": "Page"},
        "displayName": "Page",
        "props": {
          "title": "Query Title"
        },
        "isCanvas": true,
        "hidden": false,
        "nodes": ["ROOT_CARD"],
        "parent": "FORM_ROOT",
        "linkedNodes": {}
      },
      "ROOT_CARD": {
        "type": {"resolvedName": "Card"},
        "displayName": "Card",
        "props": {
          "title": "Search Criteria"
        },
        "isCanvas": true,
        "hidden": false,
        "nodes": ["ROW_1", "ROW_2"],
        "parent": "ROOT_PAGE",
        "linkedNodes": {}
      },
      "ROW_1": {
        "type": {"resolvedName": "Row"},
        "displayName": "Row",
        "props": {
          "templateColumns": ["6", "6"]
        },
        "isCanvas": true,
        "hidden": false,
        "nodes": ["Field1_Input", "Field2_Input"],
        "parent": "ROOT_CARD",
        "linkedNodes": {}
      },
      "Field1_Input": {
        "type": {"resolvedName": "FormInput"},
        "displayName": "Input",
        "props": {
          "fieldId": "FieldName",
          "label": "Field Label",
          "maxLength": "20"
        },
        "isCanvas": false,
        "hidden": false,
        "nodes": [],
        "parent": "ROW_1",
        "linkedNodes": {}
      }
    }
  }
}
```

#### Form Field Types

**Text Input**:
```json
{
  "type": {"resolvedName": "FormInput"},
  "props": {
    "fieldId": "FieldName",
    "label": "Label",
    "maxLength": "20",
    "defaultValue": "C"  // Optional
  }
}
```

**Date Input**:
```json
{
  "type": {"resolvedName": "FormDate"},
  "props": {
    "fieldId": "BirthDate",
    "label": "Birth Date"
  }
}
```

**⚠️ Dropdowns/Selects**: 
- FormSelect is NOT supported - causes parsing errors
- Use FormInput with `helperText` to show valid values instead

**Important Form Rules**:
- ❌ Do NOT include `id` or `version` fields in QUERYINPUTFORM
- ✅ Use lowercase layout context: `"default"` (not `"DEFAULT"`)
- ✅ Each node must have unique name within the layout
- ✅ `templateColumns` values are strings: `["6", "6"]` not `[6, 6]`

### Step 6: Create Bundle Reference File

In `/api/src/main/resources/bundles/PROVIDER.json`:

```json
{
  "id": "PROVIDER_Bundle",
  "version": 1,
  "name": "PROVIDER Name",
  "description": "Provider configuration bundle",
  "label": "LABEL",
  "type": "BUNDLE",
  "provider": "PROVIDER_NAME",
  "configurations": [
    {
      "id": "PROVIDER_Authentication",
      "version": 1,
      "name": "PROVIDER_NAME",
      "type": "AUTHENTICATION"
    },
    {
      "id": "PROVIDER_QueryMessageFormat",
      "version": 1,
      "name": "PROVIDER_QueryMessageFormat",
      "type": "QUERYMESSAGEFORMAT"
    },
    {
      "id": "PROVIDER_QueryName",
      "version": 1,
      "name": "PROVIDER_QueryName",
      "type": "QUERYINPUTDATAMAPPING",
      "query": "QueryName"
    }
  ]
}
```

Note: Forms are NOT typically in the bundle reference file.

---

## Validation Rules

The backend validates configurations in `ConfigService.java`. Run the validation script BEFORE uploading:

```bash
python3 validate_bundle.py path/to/PROVIDER.json
```

### QUERYINPUTDATAMAPPING Validations

1. **No Duplicate KeyReferences**
   - Each `keyReference` value must appear only ONCE per configuration
   - ❌ Bad: Two combinations both using "FDQ"
   - ✅ Good: FDQ, QW, DQ (all unique)

2. **No Empty Combinations**
   - Every combination must have requirements
   - Must have `set` array OR `any` array (or both)
   - ❌ Bad: `"requirements": null` or `{"set": [], "any": []}`
   - ✅ Good: `{"set": ["Field1"], "any": ["Field2"]}`

3. **No Missing Attributes**
   - All field names in `requirements.set` and `requirements.any` must exist in `attributes`
   - Validation checks `sourceField` array values (case-insensitive)
   - ❌ Bad: Combination references "Name" but no attribute has "Name" in sourceField
   - ✅ Good: All requirement fields exist in attributes

4. **No Invalid Attributes**
   - Every attribute must have: `name`, `targetField`, `sourceField`
   - `sourceField` must be a non-empty array
   - ❌ Bad: `"sourceField": []` or `"sourceField": null`
   - ✅ Good: `"sourceField": ["FieldName"]`

### QUERYINPUTFORM Validations

1. **No id/version Fields**
   - Forms should NOT have `id` or `version` at the top level
   - ❌ Bad: `{"id": "123", "name": "Form", ...}`
   - ✅ Good: `{"name": "Form", "type": "QUERYINPUTFORM", ...}`

2. **Required Fields**
   - Must have: `name`, `type`, `layout`
   - `layout` must be an object (dict), not a string

3. **Layout Context**
   - Use lowercase: `"default"`, `"CAD_DISPATCH"`, `"FIRST_RESPONDER"`
   - ❌ Bad: `"DEFAULT"`, `"CADDISPATCH"`

---

## Common Patterns

### Pattern 1: Multi-State Queries

Many providers support querying multiple states:

```json
{
  "name": "State",
  "sourceField": ["State"],
  "targetField": "state",
  "size": 2
},
{
  "name": "State2",
  "sourceField": ["State2"],
  "targetField": "state2",
  "size": 2
}
// ... State3, State4, State5
```

### Pattern 2: Flexible Search (Name OR ID)

When users can search by name OR by ID number:

```json
{
  "keyReference": "MESSAGE_KEY",
  "primaryFieldReference": "Name",
  "requirements": {
    "set": [],  // Nothing strictly required
    "any": ["Name", "BirthDate", "IDNumber", "State"]
  }
}
```

This allows any combination of fields.

### Pattern 3: Auto-Populated Fields (Requestor, Attention)

Some fields should NOT be in forms (auto-populated from user context):
- `Requestor` - Current user's name
- `Attention` - Department/agency info
- `ORI` - Agency identifier

Include these in QUERYINPUTDATAMAPPING attributes but NOT in forms.

### Pattern 4: Purpose/Reason Codes

Some queries require purpose codes (e.g., A, C, D, E, F, H, J, O, R):

**In Attribute**:
```json
{
  "name": "PurposeCode",
  "sourceField": ["PurposeCode"],
  "targetField": "purposeCode",
  "size": 1,
  "description": "valid values include: A, C, D, E, F, H, J, O, R"
}
```

**In Form** (use FormInput with default, NOT dropdown):
```json
{
  "type": {"resolvedName": "FormInput"},
  "props": {
    "fieldId": "PurposeCode",
    "label": "Purpose Code",
    "helperText": "Valid: A, C, D, E, F, H, J, O, R (Default: C)",
    "defaultValue": "C",
    "maxLength": "1"
  }
}
```

---

## Troubleshooting

### Error: "Unknown ConfigurationType: PROVIDER"

**Cause**: Bundle `type` is set to `"PROVIDER"` instead of `"BUNDLE"`

**Fix**:
```bash
jq '.bundles[].type = "BUNDLE"' config.json > fixed.json
```

### Error: "Duplicate keyReferences found"

**Cause**: Multiple combinations have the same `keyReference` value

**Fix**: Each keyReference must be unique. Combine requirements or use different keys:
```json
// Bad
{"keyReference": "FDQ", ...}
{"keyReference": "FDQ", ...}  // Duplicate!

// Good
{"keyReference": "FDQ", ...}
{"keyReference": "QW", ...}
```

### Error: "Missing attributes found"

**Cause**: Combination references a field that doesn't exist in attributes

**Fix**: Add the missing attribute or remove from requirements:
```json
{
  "attributes": [
    {
      "name": "MissingField",
      "sourceField": ["MissingField"],
      "targetField": "missingField",
      "size": 20
    }
  ]
}
```

### Error: "ObjectNode method asString() cannot convert value"

**Cause**: Trying to use FormSelect with object options `[{label, value}]`

**Fix**: Use FormInput instead:
```json
// Bad
{
  "type": {"resolvedName": "FormSelect"},
  "props": {
    "options": [{"label": "A", "value": "A"}]  // Objects cause errors
  }
}

// Good
{
  "type": {"resolvedName": "FormInput"},
  "props": {
    "fieldId": "Field",
    "label": "Field (A, B, or C)",
    "helperText": "Valid values: A, B, C",
    "maxLength": "1"
  }
}
```

### Form Fields Not Validating

**Cause**: Combination requirements don't match what's needed

**Check**:
1. Are all required fields in `requirements.set`?
2. Do field names in combinations match attribute names?
3. For composite fields (Name), are all components in sourceField?

---

## Reference Files

### Source of Truth: CA eSun Bundle

Location: `/Users/brad.fullwood/Downloads/CA_eSun.json`

Use this as a reference for:
- Proper bundle structure (2 bundles: ENTITIES + provider)
- Form layout patterns
- Name component handling
- Field naming conventions

### FL FCIC Example

Location: `/Users/brad.fullwood/Developer/federated-search/api/src/main/resources/configurations/FL_FCIC.json`

Example showing:
- 6 query types (Driver License, Driver History, Vehicle, Boat, Article, Wanted Person)
- Name components split into First, Last, Middle, Suffix
- Flexible search combinations (name OR ID number)
- PurposeCode field with default value

### Backend Validation Code

Location: `/Users/brad.fullwood/Developer/federated-search/api/src/main/java/com/mark43/fs/services/ConfigService.java`

Methods:
- `validateDepartmentBundle()` - Entry point
- `validateQueryInputDataMapping()` - Checks mappings
- `hasDuplicateKeyReferences()` - Checks for duplicates
- `getEmptyCombinations()` - Checks for empty requirements
- `getMissingAttributes()` - Checks field references
- `getInvalidAttributes()` - Checks attribute structure

---

## Validation Script

See: `validate_bundle.py` and `README_validate_bundle.md`

Always validate before uploading:

```bash
cd ~/Developer/DEX\ Validation\ Tool
python3 validate_bundle.py ~/path/to/bundle.json
```

Exit code 0 = success, 1 = errors found

---

## Quick Checklist

Before uploading a new bundle:

- [ ] Top-level structure is `{"bundles": [...]}`
- [ ] Each bundle has `type: "BUNDLE"`
- [ ] Two bundles: ENTITIES (forms) and PROVIDER (queries)
- [ ] All keyReferences are unique per configuration
- [ ] No empty combinations (all have requirements)
- [ ] All requirement fields exist in attributes
- [ ] All attributes have name, targetField, sourceField
- [ ] Forms have NO id/version fields
- [ ] Layout context is lowercase ("default")
- [ ] No FormSelect with object options
- [ ] Composite fields (Name) split in forms, combined in sourceField
- [ ] Auto-populated fields (Requestor) NOT in forms
- [ ] Validation script passes (exit code 0)

---

## Additional Resources

- **Federated Search CLAUDE.md**: `/Users/brad.fullwood/Developer/federated-search/CLAUDE.md`
- **Backend Code**: `/Users/brad.fullwood/Developer/federated-search/api/`
- **Validation Tool**: `/Users/brad.fullwood/Developer/DEX Validation Tool/`
- **Example Bundles**: `/Users/brad.fullwood/Developer/federated-search/api/src/main/resources/configurations/`

---

*Last Updated: 2026-02-26*
*Created for Claude Code context and future bundle development*
