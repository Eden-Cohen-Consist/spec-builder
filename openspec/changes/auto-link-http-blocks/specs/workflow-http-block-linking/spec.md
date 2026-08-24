## Purpose

Lets a Hebrew, non-developer PM create and connect an HTTP workflow step to its technical integration contract without navigating back and forth between wizard steps.

## ADDED Requirements

### Requirement: The first HTTP node creates and links its technical block
When the PM adds a **קריאת API** node and no HTTP Request technical block exists, the system SHALL immediately create an HTTP Request block, set its title to the node title, and link the node to that block.

#### Scenario: Add the first HTTP node
- **WHEN** the PM adds a **קריאת API** node while the document has no HTTP Request blocks
- **THEN** one HTTP Request block is created with the same title as the node
- **AND** the node is linked to the created block
- **AND** the PM remains on the workflow step with the node side panel open

#### Scenario: Created block appears on the technical-block step
- **WHEN** the PM advances from the workflow step after the system created a linked HTTP Request block
- **THEN** the created block appears in **בלוקים טכניים** ready for its HTTP details to be completed

### Requirement: Existing HTTP blocks are chosen from the node side panel
When at least one HTTP Request block already exists, adding a **קריאת API** node SHALL open its side panel without creating another block. The side panel SHALL let the PM link an existing HTTP Request block or create and link a new one.

#### Scenario: Add an HTTP node when blocks already exist
- **WHEN** the PM adds a **קריאת API** node while one or more HTTP Request blocks exist
- **THEN** the node side panel shows the existing HTTP Request blocks and a **יצירת בלוק חדש** action
- **AND** no additional HTTP Request block is created until the PM chooses that action

#### Scenario: Link an existing block
- **WHEN** the PM chooses an existing HTTP Request block in the node side panel
- **THEN** the node links to that block
- **AND** no new block is created

#### Scenario: Create a new block from the side panel
- **WHEN** the PM chooses **יצירת בלוק חדש** in the node side panel
- **THEN** the system immediately creates one HTTP Request block with the current node title
- **AND** links the node to the created block
- **AND** keeps the PM on the workflow step

#### Scenario: Change the selected block
- **WHEN** the PM selects a different existing HTTP Request block in the node side panel
- **THEN** the node links to the newly selected block
- **AND** the previously linked block is not deleted

### Requirement: A new block title follows its node title until independently edited
The system SHALL keep the title of a newly created linked HTTP Request block equal to its originating node title while their titles still match. Once the PM gives the block a different title in **בלוקים טכניים**, later node-title edits MUST NOT overwrite the block title.

#### Scenario: Rename a node before editing its block title
- **WHEN** a node and its newly created linked block have matching titles
- **AND** the PM changes the node title
- **THEN** the linked block title changes to the same value

#### Scenario: Rename a node after editing its block title
- **WHEN** the PM has changed the linked block title so it differs from the node title
- **AND** the PM later changes the node title
- **THEN** the linked block title remains unchanged

#### Scenario: Existing blocks are not renamed on selection
- **WHEN** the PM links an HTTP node to an existing HTTP Request block
- **THEN** the existing block title remains unchanged

### Requirement: Node deletion safely cleans up an unused empty block
Deleting an HTTP node SHALL delete its linked HTTP Request block only when no other workflow node links to that block and the block contains no HTTP details other than its title and factory defaults. A populated or shared block MUST remain available in **בלוקים טכניים**.

#### Scenario: Delete a node linked to an unused empty block
- **WHEN** the PM deletes an HTTP node
- **AND** no other workflow node links to its block
- **AND** the linked block has no HTTP details beyond its title and defaults
- **THEN** the linked block is deleted

#### Scenario: Preserve a shared block
- **WHEN** the PM deletes an HTTP node whose linked block is also linked from another workflow node
- **THEN** the linked block remains available and linked to the other node

#### Scenario: Preserve a populated block
- **WHEN** the PM deletes an HTTP node whose linked block contains any entered HTTP detail
- **THEN** the linked block remains available in **בלוקים טכניים**

#### Scenario: Unlink without deleting
- **WHEN** the PM changes an HTTP node from one linked block to another or to no linked block
- **THEN** the previously linked block remains available

### Requirement: Draft and export compatibility are preserved
The system SHALL persist the resulting nodes, links, blocks, and automatic-title ownership across reloads. Drafts saved before this capability MUST continue to load without migration work by the PM. Compiled JSON MUST continue to omit internal ids and UI-only metadata and represent an HTTP workflow step's `integrationBlock` using the matching exported technical-block name.

#### Scenario: Reload an automatically linked draft
- **WHEN** the PM reloads a draft containing an automatically created linked block
- **THEN** its node-to-block link and automatic-title behavior are preserved

#### Scenario: Load an older draft
- **WHEN** the PM opens a draft created before automatic HTTP block linking was available
- **THEN** its existing workflow nodes and technical blocks load without data loss

#### Scenario: Export a newly linked HTTP node
- **WHEN** the PM exports a document containing an automatically created and linked HTTP Request block
- **THEN** the workflow step's `integrationBlock` equals that block's exported `name`
- **AND** the block appears once in `technicalBlocks`
- **AND** no internal id is present in the compiled JSON
