#!/usr/bin/env python3
"""
Bundle Configuration Validator
Validates Federated Search bundle JSON files against backend validation rules.

Usage:
    python3 validate_bundle.py <path_to_bundle.json>
    
Example:
    python3 validate_bundle.py ~/Downloads/FL_FCIC.json
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any


class BundleValidator:
    """Validates bundle configuration files."""
    
    def __init__(self, filepath: str):
        self.filepath = Path(filepath)
        self.data = None
        self.errors = []
        self.warnings = []
        
    def load_file(self) -> bool:
        """Load and parse JSON file."""
        try:
            with open(self.filepath, 'r') as f:
                self.data = json.load(f)
            print(f"✅ Loaded file: {self.filepath}")
            return True
        except FileNotFoundError:
            print(f"❌ File not found: {self.filepath}")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON: {e}")
            return False
    
    def validate_structure(self) -> bool:
        """Validate top-level DepartmentBundle structure."""
        print("\n=== Validating Structure ===")
        
        if 'bundles' not in self.data:
            self.errors.append("Missing 'bundles' key at top level")
            print("❌ Missing 'bundles' key - must have DepartmentBundle format")
            return False
        
        if not isinstance(self.data['bundles'], list):
            self.errors.append("'bundles' must be an array")
            print("❌ 'bundles' must be an array")
            return False
        
        if len(self.data['bundles']) == 0:
            self.errors.append("'bundles' array is empty")
            print("❌ 'bundles' array is empty")
            return False
        
        print(f"✅ Has 'bundles' array with {len(self.data['bundles'])} bundle(s)")
        
        # Validate each bundle
        for i, bundle in enumerate(self.data['bundles']):
            print(f"\n--- Bundle {i}: {bundle.get('name', 'UNNAMED')} ---")
            
            # Check required bundle fields
            required_fields = ['name', 'type', 'configurations']
            for field in required_fields:
                if field not in bundle:
                    self.errors.append(f"Bundle {i} missing required field: {field}")
                    print(f"❌ Missing required field: {field}")
                else:
                    print(f"✅ Has field: {field}")
            
            # Check bundle type
            if bundle.get('type') != 'BUNDLE':
                self.errors.append(f"Bundle {i} has invalid type: {bundle.get('type')} (should be 'BUNDLE')")
                print(f"❌ Invalid type: {bundle.get('type')} (should be 'BUNDLE')")
            else:
                print(f"✅ Bundle type is 'BUNDLE'")
            
            # Check configurations
            if 'configurations' in bundle:
                config_count = len(bundle['configurations'])
                print(f"✅ Has {config_count} configuration(s)")
        
        return len(self.errors) == 0
    
    def validate_query_mappings(self) -> bool:
        """Validate QUERYINPUTDATAMAPPING configurations."""
        print("\n=== Validating Query Mappings ===")
        
        all_valid = True
        
        for bundle_idx, bundle in enumerate(self.data['bundles']):
            configs = bundle.get('configurations', [])
            mappings = [c for c in configs if c.get('type') == 'QUERYINPUTDATAMAPPING']
            
            if not mappings:
                print(f"ℹ️  Bundle {bundle_idx} has no QUERYINPUTDATAMAPPING configurations")
                continue
            
            print(f"\nBundle {bundle_idx}: Validating {len(mappings)} query mapping(s)")
            
            for config in mappings:
                name = config.get('name', 'UNNAMED')
                has_errors = False
                
                # Check 1: Empty combinations
                empty_combs = self._get_empty_combinations(config)
                if empty_combs:
                    self.errors.append(f"{name}: Empty combinations found: {empty_combs}")
                    print(f"  ❌ {name}: Empty combinations: {empty_combs}")
                    has_errors = True
                    all_valid = False
                
                # Check 2: Invalid attributes
                invalid_attrs = self._get_invalid_attributes(config)
                if invalid_attrs:
                    self.errors.append(f"{name}: Invalid attributes: {invalid_attrs}")
                    print(f"  ❌ {name}: Invalid attributes: {invalid_attrs}")
                    has_errors = True
                    all_valid = False
                
                # Check 3: Missing attributes
                missing_attrs = self._get_missing_attributes(config)
                if missing_attrs:
                    self.errors.append(f"{name}: Missing attributes: {missing_attrs}")
                    print(f"  ❌ {name}: Missing attributes: {missing_attrs}")
                    has_errors = True
                    all_valid = False
                
                # Check 4: Duplicate keyReferences
                if self._has_duplicate_key_references(config):
                    key_refs = [c.get('keyReference') for c in config.get('combinations', [])]
                    duplicates = [k for k in set(key_refs) if key_refs.count(k) > 1]
                    self.errors.append(f"{name}: Duplicate keyReferences: {duplicates}")
                    print(f"  ❌ {name}: Duplicate keyReferences: {duplicates}")
                    has_errors = True
                    all_valid = False
                
                if not has_errors:
                    combo_count = len(config.get('combinations', []))
                    print(f"  ✅ {name}: {combo_count} combination(s), all validations pass")
        
        return all_valid
    
    def validate_forms(self) -> bool:
        """Validate QUERYINPUTFORM configurations."""
        print("\n=== Validating Forms ===")
        
        all_valid = True
        
        for bundle_idx, bundle in enumerate(self.data['bundles']):
            configs = bundle.get('configurations', [])
            forms = [c for c in configs if c.get('type') == 'QUERYINPUTFORM']
            
            if not forms:
                print(f"ℹ️  Bundle {bundle_idx} has no QUERYINPUTFORM configurations")
                continue
            
            print(f"\nBundle {bundle_idx}: Validating {len(forms)} form(s)")
            
            for form in forms:
                name = form.get('name', 'UNNAMED')
                has_errors = False
                
                # Check: Should NOT have id/version
                if 'id' in form:
                    self.errors.append(f"{name}: Forms should not have 'id' field")
                    print(f"  ❌ {name}: Has 'id' field (should be removed)")
                    has_errors = True
                    all_valid = False
                
                if 'version' in form:
                    self.errors.append(f"{name}: Forms should not have 'version' field")
                    print(f"  ❌ {name}: Has 'version' field (should be removed)")
                    has_errors = True
                    all_valid = False
                
                # Check: Required fields
                required = ['name', 'type', 'layout']
                for field in required:
                    if field not in form:
                        self.errors.append(f"{name}: Missing required field '{field}'")
                        print(f"  ❌ {name}: Missing required field '{field}'")
                        has_errors = True
                        all_valid = False
                
                # Check: Layout structure
                if 'layout' in form:
                    layout = form['layout']
                    if not isinstance(layout, dict):
                        self.errors.append(f"{name}: layout must be an object")
                        print(f"  ❌ {name}: layout must be an object")
                        has_errors = True
                        all_valid = False
                    else:
                        # Check for uppercase layout keys (should be lowercase)
                        uppercase_keys = [k for k in layout.keys() if k.upper() == k and k != k.lower()]
                        if uppercase_keys:
                            self.warnings.append(f"{name}: Layout has uppercase keys: {uppercase_keys} (should be lowercase)")
                            print(f"  ⚠️  {name}: Layout keys should be lowercase: {uppercase_keys}")
                
                # Check: FormSelect inputs should not have options with objects
                if 'layout' in form:
                    problematic_selects = self._check_form_selects(form['layout'], name)
                    if problematic_selects:
                        self.warnings.append(f"{name}: FormSelect with object options may cause issues: {problematic_selects}")
                        print(f"  ⚠️  {name}: FormSelect inputs with options objects: {problematic_selects}")
                        print(f"      Consider using FormInput with maxLength instead")
                
                if not has_errors:
                    print(f"  ✅ {name}: All validations pass")
        
        return all_valid
    
    def _get_empty_combinations(self, config: Dict) -> List[str]:
        """Get list of combinations with empty requirements."""
        empty = []
        for comb in config.get('combinations', []):
            reqs = comb.get('requirements')
            if reqs is None or (not reqs.get('set') and not reqs.get('any')):
                empty.append(comb.get('keyReference', 'UNKNOWN'))
        return empty
    
    def _get_invalid_attributes(self, config: Dict) -> List[str]:
        """Get list of attributes with invalid structure."""
        invalid = []
        for attr in config.get('attributes', []):
            if not attr.get('name') or not attr.get('targetField') or not attr.get('sourceField'):
                invalid.append(attr.get('name', 'NO_NAME'))
        return invalid
    
    def _get_missing_attributes(self, config: Dict) -> List[str]:
        """Get list of required fields not defined in attributes."""
        # Collect all attribute source fields (case-insensitive)
        attr_names = set()
        for attr in config.get('attributes', []):
            source_fields = attr.get('sourceField', [])
            if source_fields:
                attr_names.update([sf.lower() for sf in source_fields])
        
        # Collect all required fields from combinations
        required_fields = set()
        for comb in config.get('combinations', []):
            reqs = comb.get('requirements', {})
            if reqs:
                if reqs.get('set'):
                    required_fields.update([f.lower() for f in reqs['set']])
                if reqs.get('any'):
                    required_fields.update([f.lower() for f in reqs['any']])
        
        # Find missing
        missing = required_fields - attr_names
        return sorted(list(missing))
    
    def _has_duplicate_key_references(self, config: Dict) -> bool:
        """Check if configuration has duplicate keyReferences."""
        key_refs = [c.get('keyReference') for c in config.get('combinations', [])]
        return len(key_refs) != len(set(key_refs))
    
    def _check_form_selects(self, layout: Dict, form_name: str) -> List[str]:
        """Check for FormSelect inputs with problematic options."""
        problematic = []
        
        for layout_context in layout.values():
            if not isinstance(layout_context, dict):
                continue
            
            for node_name, node in layout_context.items():
                if not isinstance(node, dict):
                    continue
                
                node_type = node.get('type', {})
                if isinstance(node_type, dict) and node_type.get('resolvedName') == 'FormSelect':
                    props = node.get('props', {})
                    options = props.get('options', [])
                    
                    # Check if options contains objects
                    if options and isinstance(options[0], dict):
                        problematic.append(node_name)
        
        return problematic
    
    def print_summary(self):
        """Print validation summary."""
        print("\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)
        
        # Count configurations by type
        type_counts = {}
        for bundle in self.data.get('bundles', []):
            for config in bundle.get('configurations', []):
                ctype = config.get('type', 'UNKNOWN')
                type_counts[ctype] = type_counts.get(ctype, 0) + 1
        
        print(f"\nFile: {self.filepath}")
        print(f"Bundles: {len(self.data.get('bundles', []))}")
        print(f"\nConfiguration Types:")
        for ctype, count in sorted(type_counts.items()):
            print(f"  {ctype}: {count}")
        
        print(f"\nErrors: {len(self.errors)}")
        if self.errors:
            for error in self.errors:
                print(f"  ❌ {error}")
        
        print(f"\nWarnings: {len(self.warnings)}")
        if self.warnings:
            for warning in self.warnings:
                print(f"  ⚠️  {warning}")
        
        if not self.errors and not self.warnings:
            print("\n🎉 All validations passed! Bundle is ready to import.")
        elif not self.errors:
            print("\n✅ No errors found. Warnings should be reviewed but won't prevent import.")
        else:
            print("\n❌ Errors found. Fix these before importing.")
        
        print("="*60)
    
    def validate(self) -> bool:
        """Run all validations."""
        if not self.load_file():
            return False
        
        structure_valid = self.validate_structure()
        if not structure_valid:
            print("\n⚠️  Structure validation failed. Skipping detailed validation.")
            self.print_summary()
            return False
        
        mappings_valid = self.validate_query_mappings()
        forms_valid = self.validate_forms()
        
        self.print_summary()
        
        return len(self.errors) == 0


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 validate_bundle.py <path_to_bundle.json>")
        print("\nExample:")
        print("  python3 validate_bundle.py ~/Downloads/FL_FCIC.json")
        sys.exit(1)
    
    filepath = sys.argv[1]
    validator = BundleValidator(filepath)
    
    success = validator.validate()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
