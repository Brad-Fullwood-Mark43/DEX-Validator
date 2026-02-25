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
        omitStateForInState: false, // FL may include state field differently

        // Field definitions for FL FCIC
        fieldDefinitions: {
            // Vehicle fields
            licensePlateNumber: {
                label: 'License Plate Number',
                type: 'text',
                placeholder: 'ABC123',
                hint: 'Cannot be UNK, UNKN, or UNKNOWN',
                maxLength: 10,
                xmlFieldName: 'LicensePlateNumber',
                validation: {
                    prohibitedValues: ['UNK', 'UNKN', 'UNKNOWN']
                }
            },
            licensePlateTypeCode: {
                label: 'License Plate Type',
                type: 'select',
                options: 'platetype.csv',
                hint: 'Type of plate',
                maxLength: 2,
                xmlFieldName: 'LicensePlateTypeCode'
            },
            licensePlateYear: {
                label: 'License Plate Year',
                type: 'text',
                placeholder: '2024 or NX',
                hint: 'CCYY or NX for non-expiring',
                xmlFieldName: 'LicensePlateYear',
                validation: {
                    specialValues: ['NX'] // Non-expiring plates
                }
            },
            decalNumber: {
                label: 'Decal Number',
                type: 'text',
                placeholder: 'D12345',
                hint: 'Florida vehicle decal number',
                maxLength: 10,
                xmlFieldName: 'DecalNumber'
            },
            vehicleIdentificationNumber: {
                label: 'VIN',
                type: 'text',
                placeholder: '1HGBH41JXMN109186',
                hint: 'Vehicle Identification Number (17 characters)',
                maxLength: 20,
                xmlFieldName: 'VehicleIdentificationNumber'
            },
            vehicleMakeCode: {
                label: 'Vehicle Make',
                type: 'select',
                options: 'vehiclemake.csv',
                hint: 'Vehicle manufacturer (first 4 characters)',
                maxLength: 24,
                xmlFieldName: 'VehicleMakeCode'
            },
            vehicleYear: {
                label: 'Vehicle Year',
                type: 'number',
                placeholder: '2020',
                hint: 'Must be <= current year + 1',
                xmlFieldName: 'VehicleYear'
            },
            state: {
                label: 'State',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'Two-letter state code',
                xmlFieldName: 'State'
            },
            imageIndicator: {
                label: 'Request Image',
                type: 'select',
                options: [
                    { value: 'N', label: 'N - No Image' },
                    { value: 'Y', label: 'Y - Include Image' }
                ],
                hint: 'Request image with response (default: N)',
                xmlFieldName: 'ImageIndicator',
                default: 'N'
            },

            // Person fields
            name: {
                label: 'Name',
                type: 'text',
                placeholder: 'DOE, JOHN MIDDLE',
                hint: 'Format: LAST, FIRST MIDDLE',
                maxLength: 80,
                xmlFieldName: 'Name'
            },
            birthDate: {
                label: 'Birth Date',
                type: 'date',
                hint: 'Must be prior to current date (CCYYMMDD)',
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
                hint: 'Cannot be single zero or run of zeros',
                maxLength: 20,
                xmlFieldName: 'OperatorLicenseNumber',
                validation: {
                    prohibitedPatterns: [/^0+$/] // No single zero or run of zeros
                }
            },
            operatorLicenseStateCode: {
                label: 'License State',
                type: 'select',
                options: 'stateCodes.csv',
                hint: 'State that issued the license',
                xmlFieldName: 'OperatorLicenseStateCode'
            }
        },

        // Query specifications for FL FCIC
        querySpecs: {
            'vehicle-registration': {
                name: 'Vehicle Registration Query',
                messageType: 'VehicleRegistrationQuery',
                combinations: [
                    {
                        id: 1,
                        description: 'DecalNumber, LicensePlateYear',
                        fields: ['decalNumber', 'licensePlateYear'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ'
                    },
                    {
                        id: 2,
                        description: 'LicensePlateNumber',
                        fields: ['licensePlateNumber'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ'
                    },
                    {
                        id: 3,
                        description: 'VehicleIdentificationNumber',
                        fields: ['vehicleIdentificationNumber'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ'
                    },
                    {
                        id: 4,
                        description: 'LicensePlateNumber, LicensePlateYear',
                        fields: ['licensePlateNumber', 'licensePlateYear'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FRQ'
                    }
                ]
            },
            'driver-license': {
                name: 'Driver License Query',
                messageType: 'DriverLicenseQuery',
                combinations: [
                    {
                        id: 1,
                        description: 'Name, BirthDate, SexCode',
                        fields: ['name', 'birthDate', 'sexCode'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FDQ'
                    },
                    {
                        id: 2,
                        description: 'OperatorLicenseNumber',
                        fields: ['operatorLicenseNumber'],
                        optionalFields: ['imageIndicator'],
                        state: 'both',
                        keyReference: 'FDQ'
                    }
                ]
            }
        },

        // XML generation function for FL FCIC
        generateXML: function(queryType, data, state) {
            const queryTypeTag = this.querySpecs[queryType].messageType;

            let xml = `<Request>\n`;
            xml += `  <MessageType>${queryTypeTag}</MessageType>\n`;
            xml += `  <Id>MARK43GENERATEDMSGID</Id>\n`;

            // Field order for consistent XML output
            const fieldOrder = [
                'name', 'birthDate', 'sexCode', 'operatorLicenseNumber', 'operatorLicenseStateCode',
                'licensePlateNumber', 'licensePlateTypeCode', 'licensePlateYear', 'decalNumber',
                'vehicleIdentificationNumber', 'vehicleMakeCode', 'vehicleYear',
                'state', 'imageIndicator'
            ];

            fieldOrder.forEach(key => {
                if (!data[key]) return;

                const fieldDef = this.fieldDefinitions[key];
                if (!fieldDef) return;

                const xmlFieldName = fieldDef.xmlFieldName;

                // Special handling for Name field (format: LAST, FIRST MIDDLE)
                if (key === 'name') {
                    xml += `  <${xmlFieldName}>${data[key].toUpperCase()}</${xmlFieldName}>\n`;
                }
                // Special handling for BirthDate (format: CCYYMMDD)
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
