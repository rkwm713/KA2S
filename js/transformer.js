/**

 * transformer.js - Transforms Katapult JSON to SPIDAcal format

 * Handles schema version upgrading from v9 to v10

 */



/**

 * Pre-process JSON string to fix common formatting issues

 * @param {string} jsonString - Raw JSON string that might have formatting issues

 * @returns {string} - Properly formatted JSON string

 */

function preprocessJsonString(jsonString) {

  // Check if the string starts with "invalid JSON = " and remove it

  if (jsonString.trim().startsWith("invalid JSON =")) {

    jsonString = jsonString.replace("invalid JSON =", "").trim();

  }

 

  // Replace equals signs with colons for key-value pairs (only if not within quotes)

  let inQuotes = false;

  let result = "";

 

  for (let i = 0; i < jsonString.length; i++) {

    const char = jsonString[i];

   

    // Track if we're inside a quoted string

    if (char === '"' && (i === 0 || jsonString[i-1] !== '\\')) {

      inQuotes = !inQuotes;

      result += char;

    }

    // Replace equals with colons, but only outside quoted strings

    else if (char === '=' && !inQuotes) {

      result += ':';

    }

    // Pass through all other characters

    else {

      result += char;

    }

  }

 

  return result;

}



// Schema upgrading mappings and transformations

const SCHEMA_UPGRADES = {

  // Field mappings that have changed between v9 and v10

  fieldMappings: {

    'supportType': 'structure.pole.supportType',

    'clientFile': 'clientFileVersion',

    'dateModified': 'dateModified.isoDateTime'

  }

};



// Communication bundle configuration

const COMMUNICATION_BUNDLES = {

  // Comcast

  "comcast": {

    messenger: {

      size: "1/4\" EHS",

      coreStrands: 1,

      conductorStrands: 7

    },

    components: [

      {

        size: ".500coax"

      }

    ],

    group: "Comcast Coax"

  },

 

  // CenturyLink / Brightspeed

  "centurylink": {

    messenger: {

      size: "10M EHS",

      coreStrands: 1,

      conductorStrands: 7

    },

    components: [

      {

        size: "100PR Copper"

      }

    ],

    group: "CTL Copper"

  },

 

  "brightspeed": {

    messenger: {

      size: "10M EHS",

      coreStrands: 1,

      conductorStrands: 7

    },

    components: [

      {

        size: "100PR Copper"

      }

    ],

    group: "CTL Copper"

  },

 

  // GigaPower

  "gigapower": {

    messenger: {

      size: "6M EHS",

      coreStrands: 1,

      conductorStrands: 7

    },

    components: [

      {

        size: "144ct (GIG)"

      }

    ],

    group: "Gigapower Fiber"

  },

 

  // UPN

  "upn": {

    messenger: {

      size: "144ct SS",

      coreStrands: 0,

      conductorStrands: 1

    },

    components: [

      {

        size: "144ct (UPN)"

      }

    ],

    group: "UPN Fiber"

  },

 

  // Verizon

  "verizon": {

    messenger: {

      size: "144ct SS",

      coreStrands: 0,

      conductorStrands: 1

    },

    components: [

      {

        size: "144ct (VZW)"

      }

    ],

    group: "Verizon Fiber"

  },

 

  // Vexus

  "vexus": {

    messenger: {

      size: "1/4\" EHS",

      coreStrands: 1,

      conductorStrands: 7

    },

    components: [

      {

        size: "144ct (VEX)"

      }

    ],

    group: "Vexus Fiber"

  },

 

  // Generic/Unknown

  "generic": {

    messenger: {

      size: "1/4\" EHS",

      coreStrands: 1,

      conductorStrands: 7

    },

    components: [

      {

        size: "Generic Cable"

      }

    ],

    group: "Communication"

  }

};



// Wire property templates

const WIRE_TEMPLATES = {

  "1/4\" EHS": {

    size: "1/4\" EHS",

    coreStrands: 1,

    conductorStrands: 7,

    calculation: "STATIC"

  },

 

  "6M EHS": {

    size: "6M EHS",

    coreStrands: 1,

    conductorStrands: 7,

    calculation: "STATIC"

  },

 

  "10M EHS": {

    size: "10M EHS",

    coreStrands: 1,

    conductorStrands: 7,

    calculation: "STATIC"

  },

 

  "144ct SS": {

    size: "144ct SS",

    coreStrands: 0,

    conductorStrands: 1,

    calculation: "STATIC"

  }

};



/**

 * Determine if a wire is a communication wire based on its properties

 * @param {Object} wire - Wire object

 * @returns {boolean} - Whether it's a communication wire

 */

function isCommunicationWire(wire) {

  // Check if it's already classified as a communication wire

  if (wire.usageGroup === 'COMMUNICATION' ||

      wire.usageGroup === 'COMMUNICATION_SERVICE' ||

      wire.usageGroup === 'COMMUNICATION_BUNDLE') {

    return true;

  }

 

  // Check owner industry

  if (wire.owner && wire.owner.industry === 'COMMUNICATION') {

    return true;

  }

 

  // Check owner ID for known communication companies

  if (wire.owner && wire.owner.id) {

    const ownerIdLower = wire.owner.id.toLowerCase();

   

    // Check for known communication company names

    if (ownerIdLower.includes('comcast') ||

        ownerIdLower.includes('centurylink') ||

        ownerIdLower.includes('ctl') ||

        ownerIdLower.includes('brightspeed') ||

        ownerIdLower.includes('gigapower') ||

        ownerIdLower.includes('upn') ||

        ownerIdLower.includes('verizon') ||

        ownerIdLower.includes('vzw') ||

        ownerIdLower.includes('vexus') ||

        ownerIdLower.includes('at&t') ||

        ownerIdLower.includes('fiber') ||

        ownerIdLower.includes('cable') ||

        ownerIdLower.includes('telco') ||

        ownerIdLower.includes('telecom')) {

      return true;

    }

  }

 

  // If wire name or description suggests communication

  if (wire.id && typeof wire.id === 'string') {

    const wireIdLower = wire.id.toLowerCase();

   

    if (wireIdLower.includes('comm') ||

        wireIdLower.includes('fiber') ||

        wireIdLower.includes('cable') ||

        wireIdLower.includes('telco') ||

        wireIdLower.includes('phone')) {

      return true;

    }

  }

 

  return false;

}



/**

 * Determine the communication company based on wire properties

 * @param {Object} wire - Wire object

 * @returns {string} - Company key from COMMUNICATION_BUNDLES

 */

function getCommunicationCompany(wire) {

  if (!wire.owner || !wire.owner.id) {

    return 'generic';

  }

 

  const ownerIdLower = wire.owner.id.toLowerCase();

 

  if (ownerIdLower.includes('comcast')) {

    return 'comcast';

  } else if (ownerIdLower.includes('centurylink') || ownerIdLower.includes('ctl')) {

    return 'centurylink';

  } else if (ownerIdLower.includes('brightspeed')) {

    return 'brightspeed';

  } else if (ownerIdLower.includes('gigapower')) {

    return 'gigapower';

  } else if (ownerIdLower.includes('upn')) {

    return 'upn';

  } else if (ownerIdLower.includes('verizon') || ownerIdLower.includes('vzw')) {

    return 'verizon';

  } else if (ownerIdLower.includes('vexus')) {

    return 'vexus';

  }

 

  return 'generic';

}



/**

 * Convert a communication wire to a client referenced wire

 * @param {Object} wire - Original wire object

 * @param {string} company - Company key from COMMUNICATION_BUNDLES

 * @returns {Object} - Transformed bundle wire

 */

function createCommunicationWireReference(wire, company) {

  const bundleConfig = COMMUNICATION_BUNDLES[company] || COMMUNICATION_BUNDLES.generic;

  const wireTemplate = WIRE_TEMPLATES[bundleConfig.messenger.size] || WIRE_TEMPLATES["1/4\" EHS"];

 

  // Create a client referenced wire

  const wireReference = {

    ...wire,

    usageGroup: 'COMMUNICATION',

    size: wireTemplate.size,

    coreStrands: wireTemplate.coreStrands,

    conductorStrands: wireTemplate.conductorStrands,

    calculation: wireTemplate.calculation

  };

 

  // Calculate approximate diameter and weight based on the messenger

  let diameter = 0.25; // Default to 1/4" diameter

  let weight = 0.1;    // Default to 0.1 lbs/ft

 

  // Set conductor properties if they don't exist

  if (!wireReference.conductorProperties) {

    wireReference.conductorProperties = {

      diameter: diameter,

      weight: weight

    };

  }

 

  return wireReference;

}



/**

 * Transform Katapult Pro JSON to SPIDAcal format

 * @param {Object|string} katapultJson - The parsed JSON from Katapult Pro or raw JSON string

 * @param {Object} defaultValues - Default values for missing fields

 * @returns {Object} - The transformed JSON and list of changes

 */

function transformJson(katapultJson, defaultValues) {

  const changes = [];

  let parsedJson;

 

  // Handle string input (raw JSON)

  if (typeof katapultJson === 'string') {

    try {

      // Preprocess the JSON string to fix common formatting issues

      const preprocessed = preprocessJsonString(katapultJson);

      parsedJson = JSON.parse(preprocessed);

      changes.push('Fixed malformed JSON format');

    } catch (error) {

      throw new Error(`Failed to parse JSON: ${error.message}`);

    }

  } else {

    // Already an object

    parsedJson = katapultJson;

  }

 

  // Create a deep copy to avoid modifying the original

  const transformedJson = JSON.parse(JSON.stringify(parsedJson));

 

  // First, upgrade the schema version if needed

  if (transformedJson.version !== 10) {

    // Update version

    transformedJson.version = 10;

    changes.push('Updated schema version from 9 to 10');

   

    // Update schema URL if needed

    if (!transformedJson.schema || !transformedJson.schema.includes('v1/schema')) {

      transformedJson.schema = 'https://raw.githubusercontent.com/spidasoftware/schema/master/resources/v1/schema/spidacalc/calc/project.schema';

      changes.push('Updated schema URL to v10 format');

    }

   

    // Map any renamed fields

    Object.entries(SCHEMA_UPGRADES.fieldMappings).forEach(([oldField, newField]) => {

      if (transformedJson[oldField] !== undefined && transformedJson[newField] === undefined) {

        // Handle dot notation for nested fields

        if (newField.includes('.')) {

          const parts = newField.split('.');

          let current = transformedJson;

         

          // Create nested objects if they don't exist

          for (let i = 0; i < parts.length - 1; i++) {

            if (!current[parts[i]]) {

              current[parts[i]] = {};

            }

            current = current[parts[i]];

          }

         

          // Set the final property

          current[parts[parts.length - 1]] = transformedJson[oldField];

          changes.push(`Mapped ${oldField} to ${newField}`);

        } else {

          transformedJson[newField] = transformedJson[oldField];

          changes.push(`Mapped ${oldField} to ${newField}`);

        }

      }

    });

  }

 

  // Remove fields that cause schema validation errors

  if (transformedJson.engineVersion) {

    delete transformedJson.engineVersion;

    changes.push('Removed engineVersion field to comply with schema');

  }

 

  if (transformedJson.formulaOptions) {

    delete transformedJson.formulaOptions;

    changes.push('Removed formulaOptions field to comply with schema');

  }

 

  if (transformedJson.analysisCases) {

    delete transformedJson.analysisCases;

    changes.push('Removed analysisCases field to comply with schema');

  }

 

  // Ensure leads array exists (required in v10)

  if (!transformedJson.leads || !Array.isArray(transformedJson.leads)) {

    transformedJson.leads = [];

    changes.push('Added empty leads array');

  }

 

  // Process leads and locations if they exist

  if (transformedJson.leads && Array.isArray(transformedJson.leads)) {

    transformedJson.leads.forEach((lead, leadIndex) => {

      if (lead.locations && Array.isArray(lead.locations)) {

        lead.locations.forEach((location, locationIndex) => {

          if (location.designs && Array.isArray(location.designs)) {

            location.designs.forEach((design, designIndex) => {

              // Process structure if it exists

              if (design.structure) {

                // Process equipments in structure

                if (design.structure.equipments && Array.isArray(design.structure.equipments)) {

                  design.structure.equipments.forEach((equipment, equipmentIndex) => {

                    // Ensure clientItem exists

                    if (!equipment.clientItem) {

                      equipment.clientItem = {};

                      changes.push(`Added clientItem object to lead ${leadIndex}, location ${locationIndex}, design ${designIndex}, equipment ${equipmentIndex}`);

                    }

                   

                    // Ensure clientItem has required type field

                    if (!equipment.clientItem.type) {

                      equipment.clientItem.type = equipment.type || 'EQUIPMENT';

                      changes.push(`Added missing type to clientItem for lead ${leadIndex}, location ${locationIndex}, design ${designIndex}, equipment ${equipmentIndex}`);

                    }

                  });

                }

               

                // Process wires to ensure connection IDs are properly paired

                if (design.structure.wires && Array.isArray(design.structure.wires)) {

                  // Create a map of connection IDs to count their usage

                  const connectionCount = {};

                 

                  design.structure.wires.forEach(wire => {

                    if (wire.connectionId) {

                      connectionCount[wire.connectionId] = (connectionCount[wire.connectionId] || 0) + 1;

                    }

                  });

                 

                  // Fix wires with single connection references

                  design.structure.wires.forEach((wire, wireIndex) => {

                    if (wire.connectionId && connectionCount[wire.connectionId] === 1) {

                      // Connection ID is only used once, which is invalid - generate a new unique ID

                      const newId = `${wire.connectionId}_fixed_${wireIndex}`;

                      changes.push(`Fixed single wire connection: changed ID ${wire.connectionId} to ${newId} for wire ${wireIndex}`);

                      wire.connectionId = newId;

                    }

                   

                    // Process communication wires to match schema

                    if (isCommunicationWire(wire)) {

                      const company = getCommunicationCompany(wire);

                      const commWire = createCommunicationWireReference(wire, company);

                     

                      // Update the wire with proper wire client references

                      Object.assign(wire, commWire);

                      changes.push(`Converted communication wire ${wireIndex} to properly referenced wire for ${company}`);

                    }

                   

                    // Remove clientItem properties that cause validation errors

                    if (wire.clientItem) {

                      if (wire.clientItem.type) {

                        delete wire.clientItem.type;

                      }

                      if (wire.clientItem.autoCalculateDiameter) {

                        delete wire.clientItem.autoCalculateDiameter;

                      }

                      if (wire.clientItem.group) {

                        delete wire.clientItem.group;

                      }

                      if (wire.clientItem.messenger) {

                        delete wire.clientItem.messenger;

                      }

                      if (wire.clientItem.bundleComponents) {

                        delete wire.clientItem.bundleComponents;

                      }

                     

                      changes.push(`Removed schema-violating properties from wire ${wireIndex} clientItem`);

                    }

                   

                    // Process wire by type

                    if (wire.type === 'PRIMARY' && (!wire.size || wire.size === '')) {

                      wire.size = defaultValues.wire.primary.size;

                      wire.coreStrands = 1;

                      wire.conductorStrands = 6;

                      wire.calculation = "STATIC";

                     

                      // Add conductor properties if missing

                      if (!wire.conductorProperties) {

                        wire.conductorProperties = defaultValues.wire.primary.conductorProperties;

                      }

                     

                      changes.push(`Added primary wire size "${wire.size}" to wire ${wireIndex}`);

                    } else if (wire.type === 'NEUTRAL' && (!wire.size || wire.size === '')) {

                      wire.size = defaultValues.wire.neutral.size;

                      wire.coreStrands = 1;

                      wire.conductorStrands = 6;

                      wire.calculation = "STATIC";

                     

                      // Add conductor properties if missing

                      if (!wire.conductorProperties) {

                        wire.conductorProperties = defaultValues.wire.neutral.conductorProperties;

                      }

                     

                      changes.push(`Added neutral wire size "${wire.size}" to wire ${wireIndex}`);

                    } else if (wire.type === 'SECONDARY_OPEN' && (!wire.size || wire.size === '')) {

                      wire.size = defaultValues.wire.secondaryOpen.size;

                      wire.coreStrands = 1;

                      wire.conductorStrands = 6;

                      wire.calculation = "STATIC";

                     

                      // Add conductor properties if missing

                      if (!wire.conductorProperties) {

                        wire.conductorProperties = defaultValues.wire.secondaryOpen.conductorProperties;

                      }

                     

                      changes.push(`Added secondary open wire size "${wire.size}" to wire ${wireIndex}`);

                    }

                   

                    // Ensure wire owner is set (required in v10)

                    if (!wire.owner) {

                      wire.owner = { id: 'DEFAULT', industry: 'UTILITY' };

                      changes.push(`Added default owner to wire ${wireIndex}`);

                    } else if (typeof wire.owner === 'string') {

                      // Convert string owner to object format

                      wire.owner = { id: wire.owner, industry: 'UTILITY' };

                      changes.push(`Converted string owner to object format for wire ${wireIndex}`);

                    }

                   

                    // Ensure wire usageGroup is set (required in v10)

                    if (!wire.usageGroup) {

                      if (isCommunicationWire(wire)) {

                        wire.usageGroup = 'COMMUNICATION';

                      } else {

                        const type = (wire.type || 'PRIMARY').toLowerCase();

                        wire.usageGroup = type;

                      }

                      changes.push(`Added usage group to wire ${wireIndex}`);

                    }

                   

                    // Ensure wire tensionGroup field (commonly required in v10)

                    if (!wire.tensionGroup) {

                      wire.tensionGroup = 'Full';

                      changes.push(`Added tension group to wire ${wireIndex}`);

                    }

                  });

                }

              }

            });

          }

        });

      }

    });

  }

 

  // Process poles

  if (transformedJson.poles && Array.isArray(transformedJson.poles)) {

    transformedJson.poles.forEach((pole, poleIndex) => {

      // Ensure pole has an id (required in v10)

      if (!pole.id) {

        pole.id = `pole-${poleIndex + 1}`;

        changes.push(`Added ID to pole ${poleIndex}`);

      }

     

      // Ensure structure fields for v10

      if (!pole.structure) {

        pole.structure = {

          pole: {

            glc: {

              distance: 0,

              unit: 'FOOT'

            }

          }

        };

       

        // Move relevant fields to the new structure

        const polePropertyMappings = {

          'poleHeight': 'height',

          'poleClass': 'poleClass',

          'species': 'species',

          'yearManufactured': 'yearManufactured'

        };

       

        Object.entries(polePropertyMappings).forEach(([oldField, newField]) => {

          if (pole[oldField] !== undefined) {

            pole.structure.pole[newField] = pole[oldField];

          }

        });

       

        changes.push(`Added structure object to pole ${poleIndex}`);

      }

     

      // Process equipments on each pole

      if (pole.structure && pole.structure.equipments && Array.isArray(pole.structure.equipments)) {

        pole.structure.equipments.forEach((equipment, equipmentIndex) => {

          // Ensure clientItem exists

          if (!equipment.clientItem) {

            equipment.clientItem = {};

            changes.push(`Added clientItem object to pole ${poleIndex}, equipment ${equipmentIndex}`);

          }

         

          // Ensure clientItem has required type field

          if (!equipment.clientItem.type) {

            equipment.clientItem.type = equipment.type || 'EQUIPMENT';

            changes.push(`Added missing type to clientItem for pole ${poleIndex}, equipment ${equipmentIndex}`);

          }

        });

      }

     

      // Process wires on each pole

      if (pole.wires && Array.isArray(pole.wires)) {

        // Create a map of connection IDs to count their usage

        const connectionCount = {};

       

        pole.wires.forEach(wire => {

          if (wire.connectionId) {

            connectionCount[wire.connectionId] = (connectionCount[wire.connectionId] || 0) + 1;

          }

        });

       

        pole.wires.forEach((wire, wireIndex) => {

          // Process communication wires

          if (isCommunicationWire(wire)) {

            const company = getCommunicationCompany(wire);

            const commWire = createCommunicationWireReference(wire, company);

           

            // Update the wire with proper wire properties

            Object.assign(wire, commWire);

            changes.push(`Converted communication wire ${wireIndex} at pole ${poleIndex} to properly referenced wire for ${company}`);

          }

         

          // Remove clientItem properties that cause validation errors

          if (wire.clientItem) {

            if (wire.clientItem.type) {

              delete wire.clientItem.type;

            }

            if (wire.clientItem.autoCalculateDiameter) {

              delete wire.clientItem.autoCalculateDiameter;

            }

            if (wire.clientItem.group) {

              delete wire.clientItem.group;

            }

            if (wire.clientItem.messenger) {

              delete wire.clientItem.messenger;

            }

            if (wire.clientItem.bundleComponents) {

              delete wire.clientItem.bundleComponents;

            }

           

            changes.push(`Removed schema-violating properties from wire ${wireIndex} at pole ${poleIndex} clientItem`);

          }

         

          // Check for primary wire

          if (wire.type === 'PRIMARY' && (!wire.size || wire.size === '')) {

            wire.size = defaultValues.wire.primary.size;

            wire.coreStrands = 1;

            wire.conductorStrands = 6;

            wire.calculation = "STATIC";

           

            // Add conductor properties if missing

            if (!wire.conductorProperties) {

              wire.conductorProperties = defaultValues.wire.primary.conductorProperties;

            }

           

            changes.push(`Added primary wire size "${wire.size}" to pole ${poleIndex}, wire ${wireIndex}`);

          }

         

          // Check for neutral wire

          if (wire.type === 'NEUTRAL' && (!wire.size || wire.size === '')) {

            wire.size = defaultValues.wire.neutral.size;

            wire.coreStrands = 1;

            wire.conductorStrands = 6;

            wire.calculation = "STATIC";

           

            // Add conductor properties if missing

            if (!wire.conductorProperties) {

              wire.conductorProperties = defaultValues.wire.neutral.conductorProperties;

            }

           

            changes.push(`Added neutral wire size "${wire.size}" to pole ${poleIndex}, wire ${wireIndex}`);

          }

         

          // Check for open secondary wire

          if (wire.type === 'SECONDARY_OPEN' && (!wire.size || wire.size === '')) {

            wire.size = defaultValues.wire.secondaryOpen.size;

            wire.coreStrands = 1;

            wire.conductorStrands = 6;

            wire.calculation = "STATIC";

           

            // Add conductor properties if missing

            if (!wire.conductorProperties) {

              wire.conductorProperties = defaultValues.wire.secondaryOpen.conductorProperties;

            }

           

            changes.push(`Added secondary open wire size "${wire.size}" to pole ${poleIndex}, wire ${wireIndex}`);

          }

         

          // Fix wires with single connection references

          if (wire.connectionId && connectionCount[wire.connectionId] === 1) {

            // Connection ID is only used once, which is invalid - generate a new unique ID

            const newId = `${wire.connectionId}_fixed_${wireIndex}`;

            changes.push(`Fixed single wire connection: changed ID ${wire.connectionId} to ${newId} for pole ${poleIndex}, wire ${wireIndex}`);

            wire.connectionId = newId;

          }

         

          // Ensure wire owner is set (required in v10)

          if (!wire.owner) {

            wire.owner = { id: 'DEFAULT', industry: 'UTILITY' };

            changes.push(`Added default owner to pole ${poleIndex}, wire ${wireIndex}`);

          } else if (typeof wire.owner === 'string') {

            // Convert string owner to object format

            wire.owner = { id: wire.owner, industry: 'UTILITY' };

            changes.push(`Converted string owner to object format for pole ${poleIndex}, wire ${wireIndex}`);

          }

         

          // Ensure wire usageGroup is set (required in v10)

          if (!wire.usageGroup) {

            if (isCommunicationWire(wire)) {

              wire.usageGroup = 'COMMUNICATION';

            } else {

              const type = (wire.type || 'PRIMARY').toLowerCase();

              wire.usageGroup = type;

            }

            changes.push(`Added usage group to pole ${poleIndex}, wire ${wireIndex}`);

          }

         

          // Ensure wire tensionGroup field (commonly required in v10)

          if (!wire.tensionGroup) {

            wire.tensionGroup = 'Full';

            changes.push(`Added tension group to pole ${poleIndex}, wire ${wireIndex}`);

          }

        });

      }

     

      // Check for missing wire arrays

      if (!pole.wires) {

        pole.wires = [];

        changes.push(`Created empty wires array for pole ${poleIndex}`);

      }

    });

  }

 

  return { transformedJson, changes };

}