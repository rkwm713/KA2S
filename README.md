# Katapult to SPIDAcalc Transformer

A browser-based tool to transform JSON exports from Katapult Pro (schema v9) to SPIDAcalc-compatible format (schema v10).

## Features

- **Schema Upgrade**: Automatically converts from v9 to v10 schema
- **Missing Fields**: Adds required fields for successful SPIDAcalc import
- **Wire Properties**: Adds missing wire sizes and properties
- **Browser-based**: No installation required, works entirely in your browser
- **Privacy-focused**: All processing happens locally, no data is sent to servers

## Usage

1. **Upload Files**: Drag and drop your JSON files or use the file browser
2. **Configure Defaults**: Set default values for wire sizes and properties
3. **Process Files**: Transform your JSON files to SPIDAcal v10 format
4. **Download Results**: Get your transformed files ready for SPIDAcalc import

## Requirements

- Modern web browser (Chrome, Firefox, Edge, or Safari)
- JSON files exported from Katapult Pro

## Key Transformations

- Updates schema version from 9 to 10
- Adds required fields for v10 compatibility
- Restructures pole data to match v10 format
- Adds missing wire properties:
  - Wire sizes for primary, neutral, and secondary open wires
  - Owner, usage group, and tension group values
  - Conductor properties (diameter, weight)

## Local Development

To run this project locally:

1. Clone the repository
2. Open `index.html` in your browser

No build tools or server required!



## Acknowledgments

- TechServ for project support
- SPIDAcalc documentation for schema references
- Monster Energy Drink for the willpower
