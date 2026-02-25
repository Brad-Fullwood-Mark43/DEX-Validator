/**
 * Universal Search Query Validator - Connector Configuration System
 *
 * This file contains all connector-specific configurations including:
 * - Field definitions
 * - Query specifications (field combinations)
 * - Validation rules
 * - XML generation logic
 * - Authentication requirements
 */

const CONNECTORS = {
    /**
     * California eSUN (Electronic Subscriber Unit Network)
     * ConnectCIC-based system for California CLETS
     */
    CA_ESUN: {
        id: 'CA_ESUN',
        name: 'California eSUN',
        description: 'California Electronic Subscriber Unit Network (CLETS)',
        providerType: 'CONNECTCIC',
        region: 'CA_CLETS',
        defaultState: 'CA',

        // Authentication requirements
        authenticationFields: ['ori', 'deviceId', 'stateUserId'],

        // CA-specific requirements
        requiresPurposeCode: true, // AB 1747 requirement
        omitStateForInState: true, // Omit State field for in-state CA queries

        // Field definitions for all query types
        fieldDefinitions: {
            // Common fields
            purposeCode: {
                label: 'CA Purpose Code',
                type: 'select',
                options: [
                    { value: 'C', label: 'C - Criminal Justice' },
                    { value: 'I', label: 'I - Immigration Enforcement' },
                    { value: 'U', label: 'U - USC 1325 Violations' }
                ],
                required: true,
                hint: 'Required per California AB 1747',
                xmlFieldName: 'CaRequestPurposeCode'
            },

            // Vehicle fields
            licensePlateNumber: {
                label: 'License Plate Number',
                type: 'text',
                placeholder: 'ABC1234',
                hint: 'Enter license plate number',
                maxLength: 10,
                xmlFieldName: 'LicensePlateNumber'
            },
            licensePlateTypeCode: {
                label: 'License Plate Type',
                type: 'select',
                options: 'platetype.csv',
                hint: 'Type of plate (PC = Passenger Car, etc.)',
                maxLength: 2,
                xmlFieldName: 'LicensePlateTypeCode'
            },
            licensePlateYear: {
                label: 'License Plate Year',
                type: 'number',
                placeholder: '2024',
                hint: 'Expiration year',
                xmlFieldName: 'LicensePlateYear'
            },
            vehicleIdentificationNumber: {
                label: 'VIN',
                type: 'text',
                placeholder: '1HGBH41JXMN109186',
                hint: 'Vehicle Identification Number (17 characters)',
                maxLength: 17,
                xmlFieldName: 'VehicleIdentificationNumber'
            },
            vehicleMakeCode: {
                label: 'Vehicle Make',
                type: 'select',
                options: 'vehiclemake.csv',
                hint: 'Vehicle manufacturer',
                maxLength: 4,
                xmlFieldName: 'VehicleMakeCode'
            },
            vehicleYear: {
                label: 'Vehicle Year',
                type: 'number',
                placeholder: '2020',
                hint: 'Model year',
                xmlFieldName: 'VehicleYear'
            },
            state: {
                label: 'State',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Two-letter state code (omit for CA in-state)',
                xmlFieldName: 'State'
            },

            // Person fields
            name: {
                label: 'Name',
                type: 'text',
                placeholder: 'DOE, JOHN MIDDLE',
                hint: 'Format: LAST, FIRST MIDDLE',
                maxLength: 50,
                xmlFieldName: 'Name'
            },
            birthDate: {
                label: 'Birth Date',
                type: 'date',
                hint: 'Date of birth',
                xmlFieldName: 'BirthDate'
            },
            sexCode: {
                label: 'Sex',
                type: 'select',
                options: [
                    { value: 'M', label: 'M - Male' },
                    { value: 'F', label: 'F - Female' },
                    { value: 'X', label: 'X - Non-binary' }
                ],
                xmlFieldName: 'SexCode'
            },
            operatorLicenseNumber: {
                label: 'Driver License Number',
                type: 'text',
                placeholder: 'A1234567',
                hint: 'Driver license number',
                maxLength: 20,
                xmlFieldName: 'OperatorLicenseNumber'
            },
            addressStreetNumber: {
                label: 'Street Number',
                type: 'text',
                placeholder: '123',
                hint: 'Address street number',
                xmlFieldName: 'AddressStreetNumber'
            },
            addressCity: {
                label: 'City',
                type: 'text',
                placeholder: 'Los Angeles',
                hint: 'City name',
                xmlFieldName: 'AddressCity'
            },

            // Article fields
            articleSerialNumber: {
                label: 'Serial Number',
                type: 'text',
                placeholder: 'SN123456',
                hint: 'Article serial number',
                maxLength: 20,
                xmlFieldName: 'ArticleSerialNumber'
            },
            articleTypeCode: {
                label: 'Article Type',
                type: 'select',
                options: 'articletype.csv',
                hint: 'Type of article',
                xmlFieldName: 'ArticleTypeCode'
            },
            articleCategory: {
                label: 'Category',
                type: 'select',
                options: [
                    { value: 'O', label: 'O - Other' },
                    { value: 'V', label: 'V - Vehicle Part' }
                ],
                xmlFieldName: 'ArticleCategory'
            },
            articleBrand: {
                label: 'Brand',
                type: 'text',
                placeholder: 'Samsung',
                hint: 'Brand name',
                maxLength: 20,
                xmlFieldName: 'ArticleBrand'
            }
        },

        // Query specifications - field combinations for each query type
        querySpecs: {
            'vehicle-registration': {
                name: 'Vehicle Registration Query',
                messageType: 'VehicleRegistrationQuery',
                combinations: [
                    {
                        id: 1,
                        description: '(In) LicensePlateNumber only',
                        fields: ['licensePlateNumber'],
                        state: 'in-state',
                        keyReference: 'QV'
                    },
                    {
                        id: 2,
                        description: '(Out) LicensePlateNumber, State',
                        fields: ['licensePlateNumber', 'state'],
                        state: 'out-of-state',
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
                        id: 4,
                        description: '(In/Out) VehicleIdentificationNumber, [State]',
                        fields: ['vehicleIdentificationNumber'],
                        optionalFields: ['state'],
                        state: 'both',
                        keyReference: 'QV'
                    },
                    {
                        id: 5,
                        description: '(In/Out) Name, AddressCity, [State]',
                        fields: ['name', 'addressCity'],
                        optionalFields: ['state'],
                        state: 'both',
                        keyReference: 'QO'
                    }
                ]
            },
            'driver-license': {
                name: 'Driver License Query',
                messageType: 'DriverLicenseQuery',
                combinations: [
                    {
                        id: 1,
                        description: '(In) OperatorLicenseNumber only',
                        fields: ['operatorLicenseNumber'],
                        state: 'in-state',
                        keyReference: 'QD'
                    },
                    {
                        id: 2,
                        description: '(Out) OperatorLicenseNumber, State',
                        fields: ['operatorLicenseNumber', 'state'],
                        state: 'out-of-state',
                        keyReference: 'QD'
                    },
                    {
                        id: 3,
                        description: '(In/Out) Name, BirthDate, SexCode, [State]',
                        fields: ['name', 'birthDate', 'sexCode'],
                        optionalFields: ['state'],
                        state: 'both',
                        keyReference: 'QD'
                    }
                ]
            },
            'driver-history': {
                name: 'Driver History Query',
                messageType: 'DriverHistoryQuery',
                combinations: [
                    {
                        id: 1,
                        description: '(In) OperatorLicenseNumber only',
                        fields: ['operatorLicenseNumber'],
                        state: 'in-state',
                        keyReference: 'QH'
                    },
                    {
                        id: 2,
                        description: '(Out) OperatorLicenseNumber, State',
                        fields: ['operatorLicenseNumber', 'state'],
                        state: 'out-of-state',
                        keyReference: 'QH'
                    },
                    {
                        id: 3,
                        description: '(In/Out) Name, BirthDate, [State]',
                        fields: ['name', 'birthDate'],
                        optionalFields: ['state'],
                        state: 'both',
                        keyReference: 'QH'
                    }
                ]
            },
            'article-query': {
                name: 'Article Query',
                messageType: 'ArticleQuery',
                combinations: [
                    {
                        id: 1,
                        description: 'ArticleSerialNumber, ArticleTypeCode',
                        fields: ['articleSerialNumber', 'articleTypeCode'],
                        state: 'both',
                        keyReference: 'QA'
                    },
                    {
                        id: 2,
                        description: 'ArticleSerialNumber, ArticleTypeCode, ArticleBrand',
                        fields: ['articleSerialNumber', 'articleTypeCode', 'articleBrand'],
                        state: 'both',
                        keyReference: 'QA'
                    }
                ]
            }
        },

        // XML generation function
        generateXML: function(queryType, data, state) {
            const queryTypeTag = this.querySpecs[queryType].messageType;

            let xml = `<Request>\n`;
            xml += `  <MessageType>${queryTypeTag}</MessageType>\n`;
            xml += `  <Id>MARK43GENERATEDMSGID</Id>\n`;

            // CA Purpose Code (AB 1747 requirement)
            if (data.purposeCode) {
                xml += `  <CaRequestPurposeCode>${data.purposeCode}</CaRequestPurposeCode>\n`;
            }

            // Field order for consistent XML output
            const fieldOrder = [
                'name', 'addressStreetNumber', 'addressCity',
                'birthDate', 'sexCode', 'operatorLicenseNumber', 'state',
                'licensePlateNumber', 'licensePlateTypeCode', 'licensePlateYear',
                'vehicleIdentificationNumber', 'vehicleMakeCode', 'vehicleYear',
                'articleSerialNumber', 'articleTypeCode', 'articleCategory', 'articleBrand'
            ];

            fieldOrder.forEach(key => {
                if (!data[key]) return;

                const fieldDef = this.fieldDefinitions[key];
                const xmlFieldName = fieldDef.xmlFieldName;

                // Special handling for State field
                if (key === 'state') {
                    // Only include for out-of-state queries
                    if (state === 'out-of-state' && data[key]) {
                        xml += `  <${xmlFieldName}>${data[key].toUpperCase()}</${xmlFieldName}>\n`;
                    }
                }
                // Special handling for Name field (format: LAST, FIRST MIDDLE)
                else if (key === 'name') {
                    xml += `  <${xmlFieldName}>${data[key].toUpperCase()}</${xmlFieldName}>\n`;
                }
                // Special handling for BirthDate (format: YYYYMMDD)
                else if (key === 'birthDate') {
                    const formatted = data[key].replace(/-/g, '');
                    xml += `  <${xmlFieldName}>${formatted}</${xmlFieldName}>\n`;
                }
                // All other fields
                else {
                    xml += `  <${xmlFieldName}>${data[key]}</${xmlFieldName}>\n`;
                }
            });

            xml += `</Request>`;
            return xml;
        }
    },

    /**
     * Florida FCIC (Florida Crime Information Center)
     * ConnectCIC-based system for Florida state queries
     *
     * Specification: FL_FCIC.xml version 93
     * Transaction versions: VehicleRegistrationQuery v15, DriverLicenseQuery v20
     */
    FL_FCIC: {
        id: 'FL_FCIC',
        name: 'Florida FCIC',
        description: 'Florida Crime Information Center',
        providerType: 'CONNECTCIC',
        region: 'FL',
        defaultState: 'FL',

        // Authentication requirements
        authenticationFields: ['ori', 'deviceId', 'userId'],

        // FL-specific requirements
        requiresPurposeCode: false, // No AB 1747 requirement
        omitStateForInState: false, // FL includes state field in certain queries

        // Field definitions for FL FCIC (complete from spec)
        fieldDefinitions: {
            // ========== VEHICLE REGISTRATION FIELDS ==========

            decalNumber: {
                label: 'Decal Number',
                type: 'text',
                placeholder: 'D12345',
                hint: 'Florida vehicle decal number. Single zero, run of zeros, single/run of alphabetic prohibited',
                maxLength: 10,
                xmlFieldName: 'DecalNumber',
                description: 'Single zero only, run of zeros only, single alphabetic only, or run of alphabetic only shall be prohibited',
                validation: {
                    prohibitedPatterns: [/^0+$/, /^[a-zA-Z]$/, /^[a-zA-Z]+$/]
                }
            },

            licensePlateNumber: {
                label: 'License Plate Number',
                type: 'text',
                placeholder: 'ABC123',
                hint: 'Cannot be UNK, UNKN, or UNKNOWN. >8 chars: last 8→LIC, full→MIS',
                maxLength: 10,
                xmlFieldName: 'LicensePlateNumber',
                description: "The values 'UNK', 'UNKN', 'UNKNOWN' shall be prohibited. If the license plate number exceeds eight characters, FCIC will forward the last eight characters into NCIC's LIC field and will insert the full license plate number into NCIC's MIS field",
                validation: {
                    prohibitedValues: ['UNK', 'UNKN', 'UNKNOWN']
                }
            },

            licensePlateTypeCode: {
                label: 'License Plate Type',
                type: 'select',
                options: 'platetype.csv',
                hint: 'Valid code from part 8 of code manual',
                maxLength: 2,
                xmlFieldName: 'LicensePlateTypeCode',
                description: 'Shall be a valid code from part 8 of the code manual'
            },

            licensePlateYear: {
                label: 'License Plate Year',
                type: 'text',
                placeholder: '2024 or NX',
                hint: 'CCYY (≥ current year) or NX for non-expiring plates',
                maxLength: 4,
                xmlFieldName: 'LicensePlateYear',
                description: "Shall have a value of 'NX' or a value greater than or equal to current year (CCYY). For non-expiring plates, 'NX' should be used",
                validation: {
                    specialValues: ['NX'] // Non-expiring plates
                }
            },

            relatedHitSearchIndicator: {
                label: 'Related Hit Search',
                type: 'select',
                options: [
                    { value: 'N', label: 'N - No Related Hit Search' },
                    { value: 'Y', label: 'Y - Include Related Hit Search' }
                ],
                hint: 'Search for related hits (stolen/wanted)',
                maxLength: 1,
                xmlFieldName: 'RelatedHitSearchIndicator',
                description: 'Must be Y or N'
            },

            requestor: {
                label: 'Requestor',
                type: 'text',
                placeholder: 'Officer Name',
                hint: 'Attention/requestor information',
                maxLength: 30,
                xmlFieldName: 'Requestor',
                description: 'Attention field'
            },

            state: {
                label: 'State',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Two-letter state code',
                maxLength: 2,
                xmlFieldName: 'State',
                description: 'Identifying state'
            },

            state2: {
                label: 'State 2',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Additional state for multi-state queries',
                maxLength: 2,
                xmlFieldName: 'State2',
                description: 'Identifying state'
            },

            state3: {
                label: 'State 3',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Additional state for multi-state queries',
                maxLength: 2,
                xmlFieldName: 'State3',
                description: 'Identifying state'
            },

            state4: {
                label: 'State 4',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Additional state for multi-state queries',
                maxLength: 2,
                xmlFieldName: 'State4',
                description: 'Identifying state'
            },

            state5: {
                label: 'State 5',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Additional state for multi-state queries',
                maxLength: 2,
                xmlFieldName: 'State5',
                description: 'Identifying state'
            },

            titleLienInformation: {
                label: 'Title/Lien Information',
                type: 'text',
                placeholder: 'Title123',
                hint: 'Title lien information',
                maxLength: 8,
                xmlFieldName: 'TitleLienInformation',
                description: 'Title lien information'
            },

            vehicleIdentificationNumber: {
                label: 'VIN',
                type: 'text',
                placeholder: '1HGBH41JXMN109186',
                hint: 'Vehicle Identification Number. Single zero, run of zeros, single/run of alphabetic prohibited',
                maxLength: 20,
                xmlFieldName: 'VehicleIdentificationNumber',
                description: 'Shall validate length and type. Single zero only, run of zeros only, single alphabetic only, or run of alphabetic only shall be prohibited',
                validation: {
                    prohibitedPatterns: [/^0+$/, /^[a-zA-Z]$/, /^[a-zA-Z]+$/]
                }
            },

            vehicleMakeCode: {
                label: 'Vehicle Make',
                type: 'select',
                options: 'vehiclemake.csv',
                hint: 'First 4 chars = valid code. Spaces in pos 3/4 if code <4 chars and pos 5 has data',
                maxLength: 24,
                xmlFieldName: 'VehicleMakeCode',
                description: "The first four characters shall be a valid code from part 8 of the code manual. If the code from the code manual is less than four characters and the VMA field contains data in position five, then the code shall contain ' ' (spaces) in position three and/or four"
            },

            vehicleYear: {
                label: 'Vehicle Year',
                type: 'number',
                placeholder: '2020',
                hint: 'Must be ≤ current year + 1',
                maxLength: 4,
                xmlFieldName: 'VehicleYear',
                description: 'Shall have a value less than or equal to the current year plus one'
            },

            vinSequenceNumber: {
                label: 'VIN Sequence Number',
                type: 'text',
                placeholder: '01',
                hint: 'VIN sequence number for tracking',
                maxLength: 2,
                xmlFieldName: 'VINSequenceNumber',
                description: 'VIN sequence number'
            },

            imageIndicator: {
                label: 'Request Image',
                type: 'select',
                options: [
                    { value: 'N', label: 'N - No Image' },
                    { value: 'Y', label: 'Y - Include Image' }
                ],
                hint: "Request image with response (default: N). If blank, default is 'N'. Inquiry only",
                maxLength: 1,
                xmlFieldName: 'ImageIndicator',
                description: "Shall be 'Y' or 'N'. If blank, default value shall be 'N'. Used on inquiry only",
                default: 'N'
            },

            // ========== DRIVER LICENSE FIELDS ==========

            birthDate: {
                label: 'Birth Date',
                type: 'date',
                hint: 'Must be prior to current date (CCYYMMDD format)',
                maxLength: 8,
                xmlFieldName: 'BirthDate',
                description: 'Shall be a valid Gregorian Date (CCYYMMDD). The DOB shall be prior to the current date'
            },

            expandedNameSearchCode: {
                label: 'Expanded Name Search',
                type: 'select',
                options: [
                    { value: 'N', label: 'N - No Expanded Search' },
                    { value: 'Y', label: 'Y - Expanded Name Search' }
                ],
                hint: 'Perform expanded name search (phonetic, nicknames)',
                maxLength: 1,
                xmlFieldName: 'ExpandedNameSearchCode',
                description: 'Must be Y or N'
            },

            name: {
                label: 'Name',
                type: 'text',
                placeholder: 'DOE, JOHN MIDDLE',
                hint: 'Format: LAST, FIRST MIDDLE (components: First, Middle, Last, Suffix)',
                maxLength: 80,
                xmlFieldName: 'Name',
                description: 'Name of person (components: First, Middle, Last, Suffix)'
            },

            operatorLicenseNumber: {
                label: 'Driver License Number',
                type: 'text',
                placeholder: 'A1234567',
                hint: 'Cannot be single zero or run of zeros',
                maxLength: 20,
                xmlFieldName: 'OperatorLicenseNumber',
                description: 'Single zero only or run of zeros only shall be prohibited',
                validation: {
                    prohibitedPatterns: [/^0+$/] // No single zero or run of zeros
                }
            },

            operatorLicenseStateCode: {
                label: 'License State',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'State that issued the license',
                maxLength: 2,
                xmlFieldName: 'OperatorLicenseStateCode',
                description: 'Operator License State'
            },

            sexCode: {
                label: 'Sex',
                type: 'select',
                options: [
                    { value: 'M', label: 'M - Male' },
                    { value: 'F', label: 'F - Female' },
                    { value: 'X', label: 'X - Non-binary' },
                    { value: 'U', label: 'U - Unknown' }
                ],
                hint: 'Valid code from Part 4 of code manual',
                maxLength: 1,
                xmlFieldName: 'SexCode',
                description: 'Shall be a valid code from Part 4 of the code manual'
            }
        },

        // Query specifications for FL FCIC (complete from spec)
        querySpecs: {
            'vehicle-registration': {
                name: 'Vehicle Registration Query',
                messageType: 'VehicleRegistrationQuery',
                version: 15,
                combinations: [
                    // Combination 1: FRQ with DecalNumber
                    {
                        id: 1,
                        description: '(FRQ) DecalNumber + LicensePlateYear',
                        fields: ['decalNumber', 'licensePlateYear'],
                        optionalFields: ['requestor', 'imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ',
                        primaryField: 'decalNumber',
                        notes: 'Florida Registration Query - Decal number lookup'
                    },
                    // Combination 2: FRQ with LicensePlateNumber
                    {
                        id: 2,
                        description: '(FRQ) LicensePlateNumber',
                        fields: ['licensePlateNumber'],
                        optionalFields: ['licensePlateYear', 'requestor', 'imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ',
                        primaryField: 'licensePlateNumber',
                        notes: 'Florida Registration Query - License plate lookup'
                    },
                    // Combination 3: FRQ with TitleLienInformation
                    {
                        id: 3,
                        description: '(FRQ) TitleLienInformation',
                        fields: ['titleLienInformation'],
                        optionalFields: ['requestor', 'imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ',
                        primaryField: 'titleLienInformation',
                        notes: 'Florida Registration Query - Title/lien lookup'
                    },
                    // Combination 4: FRQ with VehicleIdentificationNumber
                    {
                        id: 4,
                        description: '(FRQ) VehicleIdentificationNumber',
                        fields: ['vehicleIdentificationNumber'],
                        optionalFields: ['requestor', 'vinSequenceNumber', 'imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ',
                        primaryField: 'vehicleIdentificationNumber',
                        notes: 'Florida Registration Query - VIN lookup'
                    },
                    // Combination 5: QV with LicensePlateNumber (NCIC/FCIC query)
                    {
                        id: 5,
                        description: '(QV) LicensePlateNumber (with stolen/wanted check)',
                        fields: ['licensePlateNumber'],
                        optionalFields: ['imageIndicator', 'relatedHitSearchIndicator', 'requestor', 'state'],
                        state: 'both',
                        keyReference: 'QV',
                        primaryField: 'licensePlateNumber',
                        notes: 'Query Vehicle - Includes FCIC/NCIC stolen/wanted checks'
                    },
                    // Combination 6: QV with VehicleIdentificationNumber (NCIC/FCIC query)
                    {
                        id: 6,
                        description: '(QV) VehicleIdentificationNumber (with stolen/wanted check)',
                        fields: ['vehicleIdentificationNumber'],
                        optionalFields: ['imageIndicator', 'relatedHitSearchIndicator', 'requestor', 'vinSequenceNumber'],
                        state: 'both',
                        keyReference: 'QV',
                        primaryField: 'vehicleIdentificationNumber',
                        notes: 'Query Vehicle - VIN with FCIC/NCIC stolen/wanted checks'
                    }
                ]
            },
            'driver-license': {
                name: 'Driver License Query',
                messageType: 'DriverLicenseQuery',
                version: 20,
                combinations: [
                    // Combination 1: FDQ with Name/DOB/Sex
                    {
                        id: 1,
                        description: '(FDQ) Name + BirthDate + SexCode',
                        fields: ['birthDate', 'name', 'sexCode'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FDQ',
                        primaryField: 'name',
                        notes: 'Florida Driver Query - Demographic search'
                    },
                    // Combination 2: FDQ with OperatorLicenseNumber
                    {
                        id: 2,
                        description: '(FDQ) OperatorLicenseNumber',
                        fields: ['operatorLicenseNumber'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FDQ',
                        primaryField: 'operatorLicenseNumber',
                        notes: 'Florida Driver Query - License number lookup'
                    },
                    // Combination 3: QW with Name/DOB (NCIC query)
                    {
                        id: 3,
                        description: '(QW) Name + BirthDate (with wanted check)',
                        fields: ['birthDate', 'name'],
                        optionalFields: ['operatorLicenseNumber', 'expandedNameSearchCode', 'imageIndicator', 'relatedHitSearchIndicator'],
                        state: 'both',
                        keyReference: 'QW',
                        primaryField: 'name',
                        notes: 'Query Wanted - Name/DOB with FCIC/NCIC wanted checks'
                    },
                    // Combination 4: QW with Name/License (NCIC query)
                    {
                        id: 4,
                        description: '(QW) Name + OperatorLicenseNumber (with wanted check)',
                        fields: ['name', 'operatorLicenseNumber'],
                        optionalFields: ['expandedNameSearchCode', 'imageIndicator', 'relatedHitSearchIndicator'],
                        state: 'both',
                        keyReference: 'QW',
                        primaryField: 'operatorLicenseNumber',
                        notes: 'Query Wanted - Name/License with FCIC/NCIC wanted checks'
                    }
                ]
            }
        },

        // XML generation function for FL FCIC
        generateXML: function(queryType, data, state, keyReference) {
            const querySpec = this.querySpecs[queryType];
            if (!querySpec) return null;

            const queryTypeTag = querySpec.messageType;

            let xml = `<Request>\n`;
            xml += `  <MessageType>${queryTypeTag}</MessageType>\n`;
            xml += `  <Id>MARK43GENERATEDMSGID</Id>\n`;

            // Field order for consistent XML output (based on ConnectCIC spec)
            const fieldOrder = [
                // Person fields first
                'name', 'birthDate', 'sexCode',
                'operatorLicenseNumber', 'operatorLicenseStateCode',
                'expandedNameSearchCode',
                // Vehicle fields
                'decalNumber',
                'licensePlateNumber', 'licensePlateTypeCode', 'licensePlateYear',
                'titleLienInformation',
                'vehicleIdentificationNumber', 'vinSequenceNumber',
                'vehicleMakeCode', 'vehicleYear',
                // States
                'state', 'state2', 'state3', 'state4', 'state5',
                // Optional/control fields
                'requestor',
                'relatedHitSearchIndicator',
                'imageIndicator'
            ];

            fieldOrder.forEach(key => {
                if (!data[key]) return;

                const fieldDef = this.fieldDefinitions[key];
                if (!fieldDef) return;

                const xmlFieldName = fieldDef.xmlFieldName;
                let value = data[key];

                // Special handling for Name field (format: LAST, FIRST MIDDLE)
                if (key === 'name') {
                    value = value.toUpperCase();
                }
                // Special handling for BirthDate (format: CCYYMMDD)
                else if (key === 'birthDate') {
                    value = value.replace(/-/g, '');
                }

                xml += `  <${xmlFieldName}>${value}</${xmlFieldName}>\n`;
            });

            xml += `</Request>`;
            return xml;
        }
    }
};

/**
 * Get connector configuration by ID
 */
function getConnector(connectorId) {
    return CONNECTORS[connectorId];
}

/**
 * Get list of all available connectors
 */
function getAllConnectors() {
    return Object.values(CONNECTORS).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        region: c.region
    }));
}

/**
 * Get default connector (CA_ESUN for backwards compatibility)
 */
function getDefaultConnector() {
    return CONNECTORS.CA_ESUN;
}
